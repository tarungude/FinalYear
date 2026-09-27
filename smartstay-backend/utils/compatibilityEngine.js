/**
 * SmartStay AI — Compatibility Scoring Engine
 * ---------------------------------------------
 * Pure, deterministic, explainable scoring logic. No AI/ML black box —
 * this makes it easy to defend in a viva and easy to unit test.
 *
 * Approach: weighted similarity score across attributes.
 *   - Numeric attributes  -> normalized distance similarity
 *   - Categorical attrs   -> compatibility matrices (exact/partial/mismatch)
 *   - Multi-select (tags) -> Jaccard similarity
 *   - Hard filters        -> checked separately, BEFORE scoring (see
 *                            passesHardFilters). A hard filter failure means
 *                            the pair should never be recommended, regardless
 *                            of how high the rest of the score is.
 *
 * Final score is normalized to 0-100 for display ("87% compatible").
 */

// ---- Weights (must sum to 1.0) ----
const WEIGHTS = {
  sleepSchedule: 0.15,
  studyHabit: 0.12,
  cleanliness: 0.15,
  noiseTolerance: 0.12,
  socialPreference: 0.1,
  guestFrequency: 0.08,
  budget: 0.1,
  interests: 0.08,
  habitsCompatibility: 0.1, // smoking/drinking cross-tolerance, scored (soft signal)
};

// Sanity check weights sum to 1 (helps catch config mistakes during development)
function validateWeights() {
  const total = Object.values(WEIGHTS).reduce((sum, w) => sum + w, 0);
  if (Math.abs(total - 1) > 0.001) {
    throw new Error(
      `Compatibility weights must sum to 1.0, currently sum to ${total}`
    );
  }
}
validateWeights();

// ---- Categorical compatibility matrices ----
// 1 = fully compatible, 0.5 = partially compatible, 0 = incompatible

const SLEEP_MATRIX = {
  early_bird: { early_bird: 1, night_owl: 0, flexible: 0.6 },
  night_owl: { early_bird: 0, night_owl: 1, flexible: 0.6 },
  flexible: { early_bird: 0.6, night_owl: 0.6, flexible: 1 },
};

const STUDY_MATRIX = {
  silent_study: { silent_study: 1, background_music: 0.4, group_study: 0.3 },
  background_music: { silent_study: 0.4, background_music: 1, group_study: 0.6 },
  group_study: { silent_study: 0.3, background_music: 0.6, group_study: 1 },
};

const SOCIAL_MATRIX = {
  introvert: { introvert: 1, ambivert: 0.7, extrovert: 0.3 },
  ambivert: { introvert: 0.7, ambivert: 1, extrovert: 0.7 },
  extrovert: { introvert: 0.3, ambivert: 0.7, extrovert: 1 },
};

const GUEST_MATRIX = {
  never: { never: 1, occasional: 0.5, frequent: 0.1 },
  occasional: { never: 0.5, occasional: 1, frequent: 0.6 },
  frequent: { never: 0.1, occasional: 0.6, frequent: 1 },
};

function categoricalSimilarity(matrix, a, b) {
  if (!matrix[a] || matrix[a][b] === undefined) {
    throw new Error(`Invalid categorical values: "${a}", "${b}"`);
  }
  return matrix[a][b];
}

// ---- Numeric similarity (1-5 scales) ----
function numericSimilarity(a, b, maxRange = 4) {
  // maxRange = 4 because scale is 1-5, so max possible |a-b| is 4
  return 1 - Math.abs(a - b) / maxRange;
}

// ---- Budget similarity: overlap between two [min, max] ranges ----
function budgetSimilarity(aMin, aMax, bMin, bMax) {
  const overlapStart = Math.max(aMin, bMin);
  const overlapEnd = Math.min(aMax, bMax);
  const overlap = Math.max(0, overlapEnd - overlapStart);

  const unionStart = Math.min(aMin, bMin);
  const unionEnd = Math.max(aMax, bMax);
  const union = unionEnd - unionStart;

  if (union === 0) return 1; // both identical single-value ranges
  return overlap / union; // Jaccard-style overlap ratio
}

// ---- Interests similarity: Jaccard index on tag sets ----
function jaccardSimilarity(setA = [], setB = []) {
  const a = new Set(setA.map((s) => s.toLowerCase().trim()));
  const b = new Set(setB.map((s) => s.toLowerCase().trim()));

  if (a.size === 0 && b.size === 0) return 0.5; // neutral if neither specified

  const intersection = new Set([...a].filter((x) => b.has(x)));
  const union = new Set([...a, ...b]);

  return union.size === 0 ? 0 : intersection.size / union.size;
}

// ---- Smoking/drinking cross-tolerance (soft signal, scored not filtered) ----
function habitsCompatibility(prefA, prefB) {
  let score = 1;

  if (prefA.smoking && !prefB.okWithSmokingRoommate) score -= 0.5;
  if (prefB.smoking && !prefA.okWithSmokingRoommate) score -= 0.5;
  if (prefA.drinking && !prefB.okWithDrinkingRoommate) score -= 0.25;
  if (prefB.drinking && !prefA.okWithDrinkingRoommate) score -= 0.25;

  return Math.max(0, score);
}

/**
 * Hard filters — checked BEFORE scoring. If this returns false, the pair
 * should be excluded from recommendations entirely, no matter the score.
 * Extend this with gender restriction, room type requirements, etc.
 */
function passesHardFilters(prefA, prefB, userA = {}, userB = {}) {
  // Example hard filter: gender must match if both specified (hostel policy)
  if (userA.gender && userB.gender && userA.gender !== userB.gender) {
    return { passes: false, reason: "Gender mismatch" };
  }

  // Extreme smoking objection can be treated as a hard filter instead of a
  // soft one if your hostel policy requires it. Left as a soft signal above
  // by default — uncomment below to make it a hard filter instead:
  //
  // if (prefA.smoking && prefB.smoking === false && prefB.okWithSmokingRoommate === false) {
  //   return { passes: false, reason: "Smoking incompatibility" };
  // }

  return { passes: true, reason: null };
}

/**
 * Main scoring function.
 * @param {Object} prefA - Preference document (or plain object) for student A
 * @param {Object} prefB - Preference document (or plain object) for student B
 * @param {Object} userA - User document for student A (for hard filters, e.g. gender)
 * @param {Object} userB - User document for student B
 * @returns {Object} { eligible, overallScore, breakdown, reason }
 */
function calculateCompatibility(prefA, prefB, userA = {}, userB = {}) {
  const filterCheck = passesHardFilters(prefA, prefB, userA, userB);
  if (!filterCheck.passes) {
    return {
      eligible: false,
      overallScore: 0,
      breakdown: null,
      reason: filterCheck.reason,
    };
  }

  const breakdown = {
    sleepSchedule: categoricalSimilarity(
      SLEEP_MATRIX,
      prefA.sleepSchedule,
      prefB.sleepSchedule
    ),
    studyHabit: categoricalSimilarity(
      STUDY_MATRIX,
      prefA.studyHabit,
      prefB.studyHabit
    ),
    cleanliness: numericSimilarity(prefA.cleanliness, prefB.cleanliness),
    noiseTolerance: numericSimilarity(
      prefA.noiseTolerance,
      prefB.noiseTolerance
    ),
    socialPreference: categoricalSimilarity(
      SOCIAL_MATRIX,
      prefA.socialPreference,
      prefB.socialPreference
    ),
    guestFrequency: categoricalSimilarity(
      GUEST_MATRIX,
      prefA.guestFrequency,
      prefB.guestFrequency
    ),
    budget: budgetSimilarity(
      prefA.budgetMin,
      prefA.budgetMax,
      prefB.budgetMin,
      prefB.budgetMax
    ),
    interests: jaccardSimilarity(prefA.interests, prefB.interests),
    habitsCompatibility: habitsCompatibility(prefA, prefB),
  };

  let weightedSum = 0;
  for (const key of Object.keys(WEIGHTS)) {
    weightedSum += WEIGHTS[key] * breakdown[key];
  }

  const overallScore = Math.round(weightedSum * 100); // 0-100 scale

  // Also express each attribute as a 0-100 % for easy frontend display
  const breakdownPercent = {};
  for (const key of Object.keys(breakdown)) {
    breakdownPercent[key] = Math.round(breakdown[key] * 100);
  }

  return {
    eligible: true,
    overallScore,
    breakdown: breakdownPercent,
    reason: null,
  };
}

/**
 * Batch version — computes compatibility for one student against a list of
 * candidates, sorted descending by score. Use this to generate a student's
 * ranked recommendation list.
 */
function rankCandidates(targetPref, targetUser, candidates) {
  // candidates: [{ pref, user }, ...]
  const results = candidates
    .filter((c) => String(c.user._id) !== String(targetUser._id))
    .map((c) => {
      const result = calculateCompatibility(
        targetPref,
        c.pref,
        targetUser,
        c.user
      );
      return {
        candidateUserId: c.user._id,
        ...result,
      };
    })
    .filter((r) => r.eligible)
    .sort((a, b) => b.overallScore - a.overallScore);

  return results;
}

module.exports = {
  WEIGHTS,
  calculateCompatibility,
  rankCandidates,
  passesHardFilters,
  // exported for unit testing individual pieces
  categoricalSimilarity,
  numericSimilarity,
  budgetSimilarity,
  jaccardSimilarity,
  habitsCompatibility,
  SLEEP_MATRIX,
  STUDY_MATRIX,
  SOCIAL_MATRIX,
  GUEST_MATRIX,
};
