// Course -> Branch mapping used by Signup and Profile edit forms.
// MBA has no sub-branch — a student picking MBA is just "MBA".

export const COURSES = ["B.Tech", "MBA", "Diploma"];

export const BRANCHES_BY_COURSE = {
  "B.Tech": ["CSE", "IT", "AIML", "CSM", "CSD", "CST", "ECE", "ECT", "MECH", "CIVIL"],
  "MBA": ["MBA"],
  "Diploma": ["CSE", "ECE", "MECH", "CIVIL", "EEE"],
};
