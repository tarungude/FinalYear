/**
 * Quick manual test for the compatibility engine.
 * Run with: npm test   (or) node tests/testCompatibilityEngine.js
 *
 * This does NOT need MongoDB — it's pure logic testing on plain objects,
 * so you can run it right now to confirm the scoring makes sense before
 * connecting anything else.
 */

const { calculateCompatibility } = require("../utils/compatibilityEngine");

// ---- Sample students ----

const studentA_user = { _id: "A", gender: "male" };
const studentA_pref = {
  sleepSchedule: "night_owl",
  studyHabit: "silent_study",
  cleanliness: 4,
  noiseTolerance: 2,
  socialPreference: "introvert",
  guestFrequency: "never",
  budgetMin: 5000,
  budgetMax: 8000,
  interests: ["music", "reading", "gaming"],
  smoking: false,
  drinking: false,
  okWithSmokingRoommate: false,
  okWithDrinkingRoommate: true,
};

// Case 1: Very compatible roommate
const studentB_user = { _id: "B", gender: "male" };
const studentB_pref = {
  sleepSchedule: "night_owl",
  studyHabit: "silent_study",
  cleanliness: 4,
  noiseTolerance: 3,
  socialPreference: "introvert",
  guestFrequency: "occasional",
  budgetMin: 6000,
  budgetMax: 9000,
  interests: ["reading", "gaming", "coding"],
  smoking: false,
  drinking: true,
  okWithSmokingRoommate: false,
  okWithDrinkingRoommate: true,
};

// Case 2: Poor match (opposite habits)
const studentC_user = { _id: "C", gender: "male" };
const studentC_pref = {
  sleepSchedule: "early_bird",
  studyHabit: "group_study",
  cleanliness: 1,
  noiseTolerance: 5,
  socialPreference: "extrovert",
  guestFrequency: "frequent",
  budgetMin: 12000,
  budgetMax: 15000,
  interests: ["sports", "parties"],
  smoking: true,
  drinking: true,
  okWithSmokingRoommate: true,
  okWithDrinkingRoommate: true,
};

// Case 3: Gender mismatch -> should be excluded by hard filter
const studentD_user = { _id: "D", gender: "female" };
const studentD_pref = { ...studentB_pref };

function printResult(label, result) {
  console.log(`\n--- ${label} ---`);
  if (!result.eligible) {
    console.log(`EXCLUDED — Reason: ${result.reason}`);
    return;
  }
  console.log(`Overall Compatibility Score: ${result.overallScore}%`);
  console.log("Attribute Breakdown:");
  for (const [key, value] of Object.entries(result.breakdown)) {
    console.log(`  ${key}: ${value}%`);
  }
}

console.log("Running SmartStay AI Compatibility Engine tests...\n");

const resultAB = calculateCompatibility(
  studentA_pref,
  studentB_pref,
  studentA_user,
  studentB_user
);
printResult("Student A vs Student B (expected: HIGH compatibility)", resultAB);

const resultAC = calculateCompatibility(
  studentA_pref,
  studentC_pref,
  studentA_user,
  studentC_user
);
printResult("Student A vs Student C (expected: LOW compatibility)", resultAC);

const resultAD = calculateCompatibility(
  studentA_pref,
  studentD_pref,
  studentA_user,
  studentD_user
);
printResult("Student A vs Student D (expected: EXCLUDED, gender mismatch)", resultAD);

// Basic assertions so this can double as a regression check
console.assert(
  resultAB.overallScore > resultAC.overallScore,
  "FAIL: A-B should score higher than A-C"
);
console.assert(
  resultAD.eligible === false,
  "FAIL: A-D should be excluded by gender hard filter"
);

console.log("\nAll checks passed if no 'FAIL' messages appear above.");
