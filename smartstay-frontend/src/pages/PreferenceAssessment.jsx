import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as preferenceService from "../services/preferenceService";

const INTEREST_OPTIONS = [
  "music", "reading", "gaming", "sports", "fitness", "movies",
  "coding", "art", "cooking", "travel", "photography", "gardening",
];

const STEPS = ["Lifestyle", "Living habits", "Budget & interests", "Review"];

export default function PreferenceAssessment() {
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    sleepSchedule: "",
    studyHabit: "",
    socialPreference: "",
    guestFrequency: "",
    cleanliness: 3,
    noiseTolerance: 3,
    smoking: false,
    drinking: false,
    okWithSmokingRoommate: false,
    okWithDrinkingRoommate: false,
    budgetMin: "",
    budgetMax: "",
    interests: [],
    additionalNotes: "",
  });

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const toggleInterest = (tag) => {
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(tag)
        ? f.interests.filter((t) => t !== tag)
        : [...f.interests, tag],
    }));
  };

  const isStepValid = () => {
    if (step === 0) {
      return form.sleepSchedule && form.studyHabit && form.socialPreference && form.guestFrequency;
    }
    if (step === 2) {
      return form.budgetMin !== "" && form.budgetMax !== "" && Number(form.budgetMin) <= Number(form.budgetMax);
    }
    return true;
  };

  const next = () => {
    setError("");
    if (!isStepValid()) {
      setError("Please fill in all fields before continuing.");
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);
    try {
      await preferenceService.submitPreferences({
        ...form,
        budgetMin: Number(form.budgetMin),
        budgetMax: Number(form.budgetMax),
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't save your preferences. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: "var(--space-7)", paddingBottom: "var(--space-8)", maxWidth: 640 }}>
      <h1>Tell us how you live</h1>
      <p className="muted" style={{ marginTop: 8, marginBottom: 32 }}>
        This shapes every roommate recommendation you'll see. Be honest — matching works best with real answers.
      </p>

      <div className="step-track">
        {STEPS.map((label, i) => (
          <div key={label} className={`step-dot ${i === step ? "active" : ""} ${i < step ? "done" : ""}`}>
            <span className="step-dot-num">{i + 1}</span>
            <span className="step-dot-label">{label}</span>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        {step === 0 && (
          <div>
            <h3 style={{ marginBottom: 20 }}>Lifestyle</h3>

            <div className="field">
              <label>Sleep schedule</label>
              <div className="choice-row">
                {[
                  ["early_bird", "Early bird"],
                  ["night_owl", "Night owl"],
                  ["flexible", "Flexible"],
                ].map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    className={`choice-pill ${form.sleepSchedule === val ? "selected" : ""}`}
                    onClick={() => set("sleepSchedule", val)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label>Study habit</label>
              <div className="choice-row">
                {[
                  ["silent_study", "Silent study"],
                  ["background_music", "Music while studying"],
                  ["group_study", "Group study"],
                ].map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    className={`choice-pill ${form.studyHabit === val ? "selected" : ""}`}
                    onClick={() => set("studyHabit", val)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label>Social preference</label>
              <div className="choice-row">
                {[
                  ["introvert", "Introvert"],
                  ["ambivert", "Ambivert"],
                  ["extrovert", "Extrovert"],
                ].map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    className={`choice-pill ${form.socialPreference === val ? "selected" : ""}`}
                    onClick={() => set("socialPreference", val)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label>How often do you have guests over?</label>
              <div className="choice-row">
                {[
                  ["never", "Never"],
                  ["occasional", "Occasional"],
                  ["frequent", "Frequent"],
                ].map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    className={`choice-pill ${form.guestFrequency === val ? "selected" : ""}`}
                    onClick={() => set("guestFrequency", val)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h3 style={{ marginBottom: 20 }}>Living habits</h3>

            <div className="field">
              <label>Cleanliness — how tidy do you keep your space? ({form.cleanliness}/5)</label>
              <input
                type="range"
                min={1}
                max={5}
                value={form.cleanliness}
                onChange={(e) => set("cleanliness", Number(e.target.value))}
              />
              <div className="range-labels"><span>Relaxed</span><span>Very tidy</span></div>
            </div>

            <div className="field">
              <label>Noise tolerance ({form.noiseTolerance}/5)</label>
              <input
                type="range"
                min={1}
                max={5}
                value={form.noiseTolerance}
                onChange={(e) => set("noiseTolerance", Number(e.target.value))}
              />
              <div className="range-labels"><span>Need quiet</span><span>Noise doesn't bother me</span></div>
            </div>

            <div className="field">
              <label>Do you smoke?</label>
              <div className="choice-row">
                <button type="button" className={`choice-pill ${form.smoking ? "selected" : ""}`} onClick={() => set("smoking", true)}>Yes</button>
                <button type="button" className={`choice-pill ${!form.smoking ? "selected" : ""}`} onClick={() => set("smoking", false)}>No</button>
              </div>
            </div>

            <div className="field">
              <label>Okay with a roommate who smokes?</label>
              <div className="choice-row">
                <button type="button" className={`choice-pill ${form.okWithSmokingRoommate ? "selected" : ""}`} onClick={() => set("okWithSmokingRoommate", true)}>Yes</button>
                <button type="button" className={`choice-pill ${!form.okWithSmokingRoommate ? "selected" : ""}`} onClick={() => set("okWithSmokingRoommate", false)}>No</button>
              </div>
            </div>

            <div className="field">
              <label>Do you drink?</label>
              <div className="choice-row">
                <button type="button" className={`choice-pill ${form.drinking ? "selected" : ""}`} onClick={() => set("drinking", true)}>Yes</button>
                <button type="button" className={`choice-pill ${!form.drinking ? "selected" : ""}`} onClick={() => set("drinking", false)}>No</button>
              </div>
            </div>

            <div className="field">
              <label>Okay with a roommate who drinks?</label>
              <div className="choice-row">
                <button type="button" className={`choice-pill ${form.okWithDrinkingRoommate ? "selected" : ""}`} onClick={() => set("okWithDrinkingRoommate", true)}>Yes</button>
                <button type="button" className={`choice-pill ${!form.okWithDrinkingRoommate ? "selected" : ""}`} onClick={() => set("okWithDrinkingRoommate", false)}>No</button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 style={{ marginBottom: 20 }}>Budget & interests</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="field">
                <label htmlFor="budgetMin">Min monthly budget (₹)</label>
                <input id="budgetMin" type="number" min={0} value={form.budgetMin} onChange={(e) => set("budgetMin", e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="budgetMax">Max monthly budget (₹)</label>
                <input id="budgetMax" type="number" min={0} value={form.budgetMax} onChange={(e) => set("budgetMax", e.target.value)} />
              </div>
            </div>

            <div className="field">
              <label>Interests (pick a few)</label>
              <div className="choice-row">
                {INTEREST_OPTIONS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`choice-pill ${form.interests.includes(tag) ? "selected" : ""}`}
                    onClick={() => toggleInterest(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label htmlFor="notes">Anything else potential roommates should know? (optional)</label>
              <textarea
                id="notes"
                rows={3}
                value={form.additionalNotes}
                onChange={(e) => set("additionalNotes", e.target.value)}
                maxLength={500}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 style={{ marginBottom: 20 }}>Review your answers</h3>
            <div className="review-grid">
              <ReviewRow label="Sleep schedule" value={form.sleepSchedule} />
              <ReviewRow label="Study habit" value={form.studyHabit} />
              <ReviewRow label="Social preference" value={form.socialPreference} />
              <ReviewRow label="Guests" value={form.guestFrequency} />
              <ReviewRow label="Cleanliness" value={`${form.cleanliness}/5`} />
              <ReviewRow label="Noise tolerance" value={`${form.noiseTolerance}/5`} />
              <ReviewRow label="Budget" value={`₹${form.budgetMin} – ₹${form.budgetMax}`} />
              <ReviewRow label="Interests" value={form.interests.join(", ") || "None selected"} />
            </div>
          </div>
        )}

        {error && <p className="error-text" style={{ marginTop: 16 }}>{error}</p>}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28 }}>
          <button type="button" className="btn btn-outline" onClick={back} disabled={step === 0}>
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" className="btn btn-primary" onClick={next}>
              Continue
            </button>
          ) : (
            <button type="button" className="btn btn-gold" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Saving…" : "Save & find matches"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="review-row">
      <span className="muted">{label}</span>
      <span style={{ fontWeight: 600 }}>{String(value).replaceAll("_", " ")}</span>
    </div>
  );
}
