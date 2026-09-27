const Allocation = require("../models/Allocation");
const Room = require("../models/Room");
const User = require("../models/User");
const Match = require("../models/Match");
const RoommateRequest = require("../models/RoommateRequest");

// @route   POST /api/allocations
// @desc    Finalize a room allocation for a group of students (admin decision)
// @access  Private (admin/warden)
const createAllocation = async (req, res) => {
  try {
    const { roomId, studentIds, notes } = req.body;

    if (!roomId || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: "roomId and a non-empty studentIds array are required" });
    }

    const room = await Room.findById(roomId);
    if (!room || !room.isActive) {
      return res.status(404).json({ message: "Room not found or inactive" });
    }

    const availableSlots = room.capacity - room.currentOccupancy;
    if (studentIds.length > availableSlots) {
      return res.status(400).json({
        message: `Room only has ${availableSlots} slot(s) available, but ${studentIds.length} student(s) were provided`,
      });
    }

    const students = await User.find({ _id: { $in: studentIds } });
    if (students.length !== studentIds.length) {
      return res.status(404).json({ message: "One or more students not found" });
    }

    const alreadyAllocated = students.filter((s) => s.currentAllocation);
    if (alreadyAllocated.length > 0) {
      return res.status(409).json({
        message: "One or more students are already allocated a room",
        students: alreadyAllocated.map((s) => s.name),
      });
    }

    // Gender restriction check
    if (room.genderRestriction !== "any") {
      const mismatched = students.filter((s) => s.gender !== room.genderRestriction);
      if (mismatched.length > 0) {
        return res.status(400).json({
          message: `Room is restricted to ${room.genderRestriction} students`,
          mismatched: mismatched.map((s) => s.name),
        });
      }
    }

    // Snapshot average compatibility among the group, using cached Match docs where available
    let avgCompatibilityScore = null;
    if (studentIds.length > 1) {
      const pairs = [];
      for (let i = 0; i < studentIds.length; i++) {
        for (let j = i + 1; j < studentIds.length; j++) {
          const [first, second] = [String(studentIds[i]), String(studentIds[j])].sort();
          pairs.push({ first, second });
        }
      }
      const matches = await Promise.all(
        pairs.map((p) => Match.findOne({ studentA: p.first, studentB: p.second }))
      );
      const scores = matches.filter(Boolean).map((m) => m.overallScore);
      if (scores.length > 0) {
        avgCompatibilityScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      }
    }

    const allocation = await Allocation.create({
      room: room._id,
      students: studentIds,
      allocatedBy: req.user._id,
      avgCompatibilityScore,
      notes: notes || "",
    });

    // Update room occupancy
    room.occupants.push(...studentIds);
    room.currentOccupancy += studentIds.length;
    await room.save();

    // Update each student's currentAllocation pointer
    await User.updateMany(
      { _id: { $in: studentIds } },
      { currentAllocation: allocation._id }
    );

    // Auto-resolve any pending roommate requests between the now-allocated students
    // (they no longer need to request each other — they're already assigned together)
    await RoommateRequest.updateMany(
      {
        status: "pending",
        sender: { $in: studentIds },
        receiver: { $in: studentIds },
      },
      { status: "accepted", respondedAt: new Date() }
    );

    const populatedAllocation = await Allocation.findById(allocation._id)
      .populate("room")
      .populate("students", "name email")
      .populate("allocatedBy", "name");

    res.status(201).json({ message: "Allocation created", allocation: populatedAllocation });
  } catch (error) {
    res.status(500).json({ message: "Failed to create allocation", error: error.message });
  }
};

// @route   GET /api/allocations
// @desc    List all allocations (admin dashboard)
// @access  Private (admin/warden)
const getAllocations = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const allocations = await Allocation.find(filter)
      .populate("room")
      .populate("students", "name email course year")
      .populate("allocatedBy", "name")
      .sort({ createdAt: -1 });

    res.json({ count: allocations.length, allocations });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch allocations", error: error.message });
  }
};

// @route   GET /api/allocations/me
// @desc    The logged-in student's own current allocation
// @access  Private (student)
const getMyAllocation = async (req, res) => {
  try {
    if (!req.user.currentAllocation) {
      return res.status(404).json({ message: "You have not been allocated a room yet" });
    }

    const allocation = await Allocation.findById(req.user.currentAllocation)
      .populate("room")
      .populate("students", "name email course year");

    res.json({ allocation });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch your allocation", error: error.message });
  }
};

// @route   DELETE /api/allocations/:id
// @desc    Undo/end an allocation (e.g. conflict resolution, student left hostel)
// @access  Private (admin/warden)
const endAllocation = async (req, res) => {
  try {
    const allocation = await Allocation.findById(req.params.id);
    if (!allocation) {
      return res.status(404).json({ message: "Allocation not found" });
    }
    if (allocation.status === "ended") {
      return res.status(400).json({ message: "Allocation already ended" });
    }

    allocation.status = "ended";
    await allocation.save();

    // Free up the room
    const room = await Room.findById(allocation.room);
    if (room) {
      room.occupants = room.occupants.filter(
        (id) => !allocation.students.map(String).includes(String(id))
      );
      room.currentOccupancy = Math.max(0, room.currentOccupancy - allocation.students.length);
      await room.save();
    }

    // Clear the students' currentAllocation pointer
    await User.updateMany(
      { _id: { $in: allocation.students } },
      { currentAllocation: null }
    );

    res.json({ message: "Allocation ended, room freed up" });
  } catch (error) {
    res.status(500).json({ message: "Failed to end allocation", error: error.message });
  }
};

// @route   PUT /api/allocations/:id
// @desc    Edit an existing allocation — change its room and/or student list.
//          Implemented as: free up the current room/students, then re-validate
//          and re-apply against the new room/students, so the same capacity,
//          gender-restriction, and double-allocation checks used at creation
//          time are enforced on every edit too.
// @access  Private (admin/warden)
const updateAllocation = async (req, res) => {
  try {
    const allocation = await Allocation.findById(req.params.id);
    if (!allocation) {
      return res.status(404).json({ message: "Allocation not found" });
    }
    if (allocation.status !== "active") {
      return res.status(400).json({ message: "Only active allocations can be edited" });
    }

    const newRoomId = req.body.roomId || String(allocation.room);
    const newStudentIds =
      Array.isArray(req.body.studentIds) && req.body.studentIds.length > 0
        ? req.body.studentIds
        : allocation.students.map(String);

    // Step 1: free up the old room and old students so validation below
    // reflects capacity/allocation state as if this allocation didn't exist.
    const oldRoom = await Room.findById(allocation.room);
    if (oldRoom) {
      oldRoom.occupants = oldRoom.occupants.filter(
        (id) => !allocation.students.map(String).includes(String(id))
      );
      oldRoom.currentOccupancy = Math.max(0, oldRoom.currentOccupancy - allocation.students.length);
      await oldRoom.save();
    }
    await User.updateMany(
      { _id: { $in: allocation.students } },
      { currentAllocation: null }
    );

    // Step 2: validate against the new room + new student list
    const newRoom = await Room.findById(newRoomId);
    if (!newRoom || !newRoom.isActive) {
      return res.status(404).json({ message: "Room not found or inactive" });
    }

    const availableSlots = newRoom.capacity - newRoom.currentOccupancy;
    if (newStudentIds.length > availableSlots) {
      return res.status(400).json({
        message: `Room only has ${availableSlots} slot(s) available, but ${newStudentIds.length} student(s) were provided`,
      });
    }

    const students = await User.find({ _id: { $in: newStudentIds } });
    if (students.length !== newStudentIds.length) {
      return res.status(404).json({ message: "One or more students not found" });
    }

    const alreadyAllocated = students.filter((s) => s.currentAllocation);
    if (alreadyAllocated.length > 0) {
      return res.status(409).json({
        message: "One or more students are already allocated a different room",
        students: alreadyAllocated.map((s) => s.name),
      });
    }

    if (newRoom.genderRestriction !== "any") {
      const mismatched = students.filter((s) => s.gender !== newRoom.genderRestriction);
      if (mismatched.length > 0) {
        return res.status(400).json({
          message: `Room is restricted to ${newRoom.genderRestriction} students`,
          mismatched: mismatched.map((s) => s.name),
        });
      }
    }

    // Step 3: recompute average compatibility for the new group
    let avgCompatibilityScore = null;
    if (newStudentIds.length > 1) {
      const pairs = [];
      for (let i = 0; i < newStudentIds.length; i++) {
        for (let j = i + 1; j < newStudentIds.length; j++) {
          const [first, second] = [String(newStudentIds[i]), String(newStudentIds[j])].sort();
          pairs.push({ first, second });
        }
      }
      const matches = await Promise.all(
        pairs.map((p) => Match.findOne({ studentA: p.first, studentB: p.second }))
      );
      const scores = matches.filter(Boolean).map((m) => m.overallScore);
      if (scores.length > 0) {
        avgCompatibilityScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      }
    }

    // Step 4: apply
    newRoom.occupants.push(...newStudentIds);
    newRoom.currentOccupancy += newStudentIds.length;
    await newRoom.save();

    allocation.room = newRoomId;
    allocation.students = newStudentIds;
    allocation.avgCompatibilityScore = avgCompatibilityScore;
    if (req.body.notes !== undefined) allocation.notes = req.body.notes;
    await allocation.save();

    await User.updateMany(
      { _id: { $in: newStudentIds } },
      { currentAllocation: allocation._id }
    );

    await RoommateRequest.updateMany(
      {
        status: "pending",
        sender: { $in: newStudentIds },
        receiver: { $in: newStudentIds },
      },
      { status: "accepted", respondedAt: new Date() }
    );

    const populatedAllocation = await Allocation.findById(allocation._id)
      .populate("room")
      .populate("students", "name email")
      .populate("allocatedBy", "name");

    res.json({ message: "Allocation updated", allocation: populatedAllocation });
  } catch (error) {
    res.status(500).json({ message: "Failed to update allocation", error: error.message });
  }
};

module.exports = { createAllocation, getAllocations, getMyAllocation, endAllocation, updateAllocation };
