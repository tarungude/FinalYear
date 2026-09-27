/**
 * SmartStay AI — Gemini AI Service
 * ----------------------------------
 * IMPORTANT: Gemini does NOT decide the compatibility score. The score is
 * already computed deterministically by utils/compatibilityEngine.js.
 * Gemini's only job here is to narrate that already-computed data in plain
 * language — explain the score, flag likely friction points, and suggest
 * practical tips. This keeps the system explainable and avoids the AI
 * "inventing" a number, which would be hard to defend in a viva.
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

let genAI = null;
const getClient = () => {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set in .env");
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

/**
 * Builds the prompt sent to Gemini. We explicitly feed it the ALREADY
 * COMPUTED score + attribute breakdown so it only has to explain, not decide.
 */
function buildPrompt({ studentAName, studentBName, overallScore, breakdown }) {
  return `
You are an assistant helping a hostel roommate-matching system explain a compatibility result to students.

Two students, "${studentAName}" and "${studentBName}", have an overall compatibility score of ${overallScore}/100, calculated from the following attribute-level similarity scores (all out of 100, higher = more compatible):

- Sleep schedule compatibility: ${breakdown.sleepSchedule}
- Study habit compatibility: ${breakdown.studyHabit}
- Cleanliness compatibility: ${breakdown.cleanliness}
- Noise tolerance compatibility: ${breakdown.noiseTolerance}
- Social preference compatibility: ${breakdown.socialPreference}
- Guest frequency compatibility: ${breakdown.guestFrequency}
- Budget range overlap: ${breakdown.budget}
- Shared interests: ${breakdown.interests}
- Habits (smoking/drinking) compatibility: ${breakdown.habitsCompatibility}

Do NOT recalculate or change the score. Only explain it.

Respond with ONLY a valid JSON object (no markdown fences, no preamble) in exactly this shape:
{
  "explanation": "2-3 sentence plain-language summary of why they are or aren't compatible, referencing the strongest and weakest attributes",
  "conflictAreas": ["short phrase describing a likely friction point", "..."],
  "tips": ["one practical, actionable tip to improve compatibility", "..."]
}

Keep "conflictAreas" and "tips" to at most 3 items each. If the score is high (80+), conflictAreas can be an empty array. Keep the tone neutral, helpful, and non-judgmental.
`.trim();
}

/**
 * Calls Gemini and returns a parsed { explanation, conflictAreas, tips } object.
 * Throws on API failure or unparseable response — caller should handle gracefully.
 */
async function generateMatchExplanation({ studentAName, studentBName, overallScore, breakdown }) {
  const client = getClient();
  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = buildPrompt({ studentAName, studentBName, overallScore, breakdown });

  const result = await model.generateContent(prompt);
  const rawText = result.response.text();

  // Strip accidental markdown code fences just in case the model adds them
  const cleaned = rawText.replace(/```json|```/g, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Gemini returned unparseable JSON: ${cleaned.slice(0, 200)}`);
  }

  return {
    explanation: parsed.explanation || "",
    conflictAreas: Array.isArray(parsed.conflictAreas) ? parsed.conflictAreas.slice(0, 3) : [],
    tips: Array.isArray(parsed.tips) ? parsed.tips.slice(0, 3) : [],
  };
}

/**
 * Hostel FAQ chatbot — separate from the match-explanation feature above.
 * This is a general-purpose assistant for questions about hostel life,
 * rules, and how SmartStay AI works. Scoped with a system instruction so
 * it stays on-topic and doesn't wander into unrelated general-purpose
 * assistant territory.
 */

const CHATBOT_SYSTEM_INSTRUCTION = `
You are the SmartStay AI hostel assistant. You help students with questions about:
- Hostel life, rules, and general accommodation topics (visiting hours, mess/food, maintenance requests, safety, common facilities)
- How SmartStay AI's roommate matching, requests, and room allocation process works
- General living-with-roommates advice (conflict resolution, communication tips)

Ground rules:
- Keep answers concise (2-5 sentences unless the question needs a list).
- If asked something with no clear answer (e.g. hostel-specific rules you don't have data for, like exact curfew times), say the student should confirm with their hostel warden/admin rather than guessing.
- If asked something unrelated to hostel life, roommates, or this platform (general trivia, homework help, coding, etc.), politely redirect: explain you're scoped to hostel and SmartStay AI topics.
- Never make up specific policies, prices, or dates you don't have information for.
- Be warm and conversational, like a helpful senior student, not a formal support bot.
`.trim();

/**
 * @param {Array<{role: "user"|"model", text: string}>} history - prior turns, oldest first
 * @param {string} userMessage - the new message to respond to
 * @param {Object} userContext - optional known facts about the student (room, allocation) to ground answers
 * @returns {Promise<string>} the assistant's reply text
 */
async function getChatbotReply(history, userMessage, userContext = {}) {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: CHATBOT_SYSTEM_INSTRUCTION,
  });

  let contextNote = "";
  if (userContext.roomNumber) {
    contextNote = `\n\n(Context for this student: they are currently allocated Room ${userContext.roomNumber}${userContext.block ? `, ${userContext.block}` : ""}. Use this only if relevant to their question.)`;
  } else if (userContext.hasNoRoom) {
    contextNote = `\n\n(Context for this student: they have not been allocated a room yet.)`;
  }

  // Gemini's chat API expects history as alternating user/model turns
  const formattedHistory = history.map((h) => ({
    role: h.role === "assistant" ? "model" : "user",
    parts: [{ text: h.text }],
  }));

  const chat = model.startChat({ history: formattedHistory });
  const result = await chat.sendMessage(userMessage + contextNote);

  return result.response.text();
}

module.exports = {
  generateMatchExplanation,
  getChatbotReply,
  CHATBOT_SYSTEM_INSTRUCTION,
};
