const User = require("../models/User");
const Preference = require("../models/Preference");
const Match = require("../models/Match");
const Room = require("../models/Room");
const RoommateRequest = require("../models/RoommateRequest");
const { calculateCompatibility, rankCandidates } = require("../utils/compatibilityEngine");
const { generateMatchExplanation } = require("../utils/geminiService");

/**
 * Helper: saves/updates a Match document for a pair (order-independent),
 * so we don't recompute Gemini explanations every time and admins can
 * browse a persistent matching table.
 */
const upsertMatch = async (userAId, userBId, result) => {
  // Store consistently regardless of which student is "A" vs "B" to respect the unique index
  const [first, second] = [String(userAId), String(userBId)].sort();

  return Match.findOneAndUpdate(
    { studentA: first, studentB: second },
    {
      studentA: first,
      studentB: second,
      overallScore: result.overallScore,
      attributeBreakdown: result.breakdown,
    },
    { upsert: true, new: true }
  );
};

// @route   GET /api/matches/recommendations
// @desc    Generate ranked roommate recommendations for the logged-in student
// @access  Private (student)
const getRecommendationsForMe = async (req, res) => {
  try {
    const myPreference = await Preference.findOne({ user: req.user._id });
    if (!myPreference) {
      return res.status(400).json({
        message: "Complete your preference assessment before viewing recommendations",
      });
    }

    // Fetch all OTHER students who have completed their preferences and
    // are not already allocated a room.
    const otherUsers = await User.find({
      _id: { $ne: req.user._id },
      role: "student",
      profileCompleted: true,
      currentAllocation: null,
    });

    const otherUserIds = otherUsers.map((u) => u._id);
    const otherPreferences = await Preference.find({ user: { $in: otherUserIds } });

    // Build candidate list pairing each user with their preference doc
    const prefByUserId = {};
    otherPreferences.forEach((p) => {
      prefByUserId[String(p.user)] = p;
    });

    const candidates = otherUsers
      .filter((u) => prefByUserId[String(u._id)]) // only those with preferences
      .map((u) => ({ user: u, pref: prefByUserId[String(u._id)] }));

    const ranked = rankCandidates(myPreference, req.user, candidates);

    // Persist each computed match so admins can view the overview later
    // and so we don't need to regenerate a Gemini explanation each time.
    // savedMatches[i] corresponds to ranked[i] (Promise.all preserves order).
    const savedMatches = await Promise.all(
      ranked.map((r) => upsertMatch(req.user._id, r.candidateUserId, r))
    );

    // Attach basic user info for display
    const userById = {};
    otherUsers.forEach((u) => (userById[String(u._id)] = u));

    // Look up any pending/accepted requests between me and these candidates,
    // so the frontend can show a "Matched" / "Pending" badge instead of
    // hiding candidates once contacted — students can still request/accept
    // someone else before an admin finalizes the actual room allocation.
    const candidateIds = ranked.map((r) => r.candidateUserId);
    const myRequests = await RoommateRequest.find({
      status: { $in: ["pending", "accepted"] },
      $or: [
        { sender: req.user._id, receiver: { $in: candidateIds } },
        { sender: { $in: candidateIds }, receiver: req.user._id },
      ],
    });
    const requestStatusByCandidateId = {};
    myRequests.forEach((r) => {
      const otherId = String(r.sender) === String(req.user._id) ? String(r.receiver) : String(r.sender);
      requestStatusByCandidateId[otherId] = r.status;
    });

    const response = ranked.slice(0, 20).map((r, i) => ({
      matchId: savedMatches[i]._id,
      candidate: {
        id: r.candidateUserId,
        name: userById[String(r.candidateUserId)]?.name,
        course: userById[String(r.candidateUserId)]?.course,
        branch: userById[String(r.candidateUserId)]?.branch,
        year: userById[String(r.candidateUserId)]?.year,
      },
      overallScore: r.overallScore,
      breakdown: r.breakdown,
      requestStatus: requestStatusByCandidateId[String(r.candidateUserId)] || null,
    }));

    res.json({ count: response.length, recommendations: response });
  } catch (error) {
    res.status(500).json({ message: "Failed to generate recommendations", error: error.message });
  }
};

// @route   GET /api/matches/rooms-for-me
// @desc    Suggest rooms based on the student's top roommate matches + room availability
// @access  Private (student)
const getRoomRecommendationsForMe = async (req, res) => {
  try {
    const myPreference = await Preference.findOne({ user: req.user._id });
    if (!myPreference) {
      return res.status(400).json({
        message: "Complete your preference assessment before viewing room recommendations",
      });
    }

    // Rooms matching the student's gender restriction with free slots
    const availableRooms = await Room.find({
      isActive: true,
      $expr: { $lt: ["$currentOccupancy", "$capacity"] },
      $or: [{ genderRestriction: "any" }, { genderRestriction: req.user.gender }],
    }).populate("occupants", "name");

    // For each room that already has occupants, compute this student's average
    // compatibility with the existing occupants — so we recommend rooms where
    // they'd fit well with whoever is already there.
    const occupantIds = availableRooms.flatMap((r) => r.occupants.map((o) => String(o._id)));
    const occupantPreferences = await Preference.find({ user: { $in: occupantIds } });
    const prefByUserId = {};
    occupantPreferences.forEach((p) => (prefByUserId[String(p.user)] = p));

    const roomsWithScore = availableRooms.map((room) => {
      if (room.occupants.length === 0) {
        // Empty room — no roommate compatibility to compute yet
        return { room, avgCompatibility: null };
      }

      const scores = room.occupants
        .map((o) => prefByUserId[String(o._id)])
        .filter(Boolean)
        .map((occupantPref) => calculateCompatibility(myPreference, occupantPref, req.user, {}))
        .filter((r) => r.eligible)
        .map((r) => r.overallScore);

      const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

      return { room, avgCompatibility: avg };
    });

    // Sort: rooms with known high compatibility first, then empty rooms, then rest
    roomsWithScore.sort((a, b) => {
      if (a.avgCompatibility === null && b.avgCompatibility === null) return 0;
      if (a.avgCompatibility === null) return 1;
      if (b.avgCompatibility === null) return -1;
      return b.avgCompatibility - a.avgCompatibility;
    });

    res.json({
      count: roomsWithScore.length,
      rooms: roomsWithScore.map((r) => ({
        room: r.room,
        avgCompatibilityWithCurrentOccupants: r.avgCompatibility,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to generate room recommendations", error: error.message });
  }
};

// @route   GET /api/matches/overview
// @desc    Admin view of all computed matches, sorted by score
// @access  Private (admin/warden)
const getMatchOverview = async (req, res) => {
  try {
    const matches = await Match.find()
      .populate("studentA", "name email course year")
      .populate("studentB", "name email course year")
      .sort({ overallScore: -1 })
      .limit(200);

    res.json({ count: matches.length, matches });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch match overview", error: error.message });
  }
};

// @route   GET /api/matches/:matchId/explanation
// @desc    Get (or generate + cache) the Gemini AI explanation for a specific match.
//          Only cached explanations are re-fetched — we never call Gemini twice
//          for the same pair, to keep API usage low and demos fast.
// @access  Private (either of the two matched students, or admin/warden)
const getMatchExplanation = async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId)
      .populate("studentA", "name")
      .populate("studentB", "name");

    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }

    // Access control: only the two students involved, or staff, can view this
    const isParticipant =
      String(match.studentA._id) === String(req.user._id) ||
      String(match.studentB._id) === String(req.user._id);
    const isStaff = req.user.role === "admin" || req.user.role === "warden";

    if (!isParticipant && !isStaff) {
      return res.status(403).json({ message: "Not authorized to view this match" });
    }

    // Return cached explanation if we already generated one
    if (match.aiExplanation) {
      return res.json({
        explanation: match.aiExplanation,
        conflictAreas: match.aiConflictAreas,
        tips: match.aiTips,
        cached: true,
        generatedAt: match.aiGeneratedAt,
      });
    }

    // Generate fresh via Gemini
    let aiResult;
    try {
      aiResult = await generateMatchExplanation({
        studentAName: match.studentA.name,
        studentBName: match.studentB.name,
        overallScore: match.overallScore,
        breakdown: match.attributeBreakdown,
      });
    } catch (aiError) {
      // Gemini can fail (rate limit, bad key, network) — don't crash the request,
      // fall back to a basic non-AI explanation so the feature degrades gracefully.
      console.error("Gemini generation failed:", aiError.message);
      return res.status(200).json({
        explanation: `These students have an overall compatibility score of ${match.overallScore}%. AI-generated explanation is temporarily unavailable.`,
        conflictAreas: [],
        tips: [],
        cached: false,
        aiUnavailable: true,
      });
    }

    match.aiExplanation = aiResult.explanation;
    match.aiConflictAreas = aiResult.conflictAreas;
    match.aiTips = aiResult.tips;
    match.aiGeneratedAt = new Date();
    await match.save();

    res.json({
      explanation: match.aiExplanation,
      conflictAreas: match.aiConflictAreas,
      tips: match.aiTips,
      cached: false,
      generatedAt: match.aiGeneratedAt,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to get match explanation", error: error.message });
  }
};

module.exports = {
  getRecommendationsForMe,
  getRoomRecommendationsForMe,
  getMatchOverview,
  getMatchExplanation,
};
