import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { COURSES, BRANCHES_BY_COURSE } from "../constants/courses";

export default function Signup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    course: "",
    branch: "",
    year: "",
    gender: "",
    contactNumber: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const updateCourse = (e) => {
    const course = e.target.value;
    // Reset branch whenever the course changes, since branch options depend on it
    setForm((f) => ({ ...f, course, branch: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signup({ ...form, year: form.year ? Number(form.year) : undefined });
      navigate("/onboarding");
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't create your account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const branchOptions = form.course ? BRANCHES_BY_COURSE[form.course] || [] : [];

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="auth-brand">
          <h1 className="auth-wordmark">SmartStay</h1>
          <p className="muted">Find who you'll actually get along with.</p>
        </div>

        <div className="card auth-card">
          <h2>Create your account</h2>
          <p className="muted" style={{ marginTop: 4, marginBottom: 24 }}>
            Takes two minutes. You'll set your living preferences next.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="name">Full name</label>
              <input id="name" value={form.name} onChange={update("name")} required />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" value={form.email} onChange={update("email")} required />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" value={form.password} onChange={update("password")} required minLength={6} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="field">
                <label htmlFor="course">Course</label>
                <select id="course" value={form.course} onChange={updateCourse}>
                  <option value="">Select</option>
                  {COURSES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="branch">Branch</label>
                <select id="branch" value={form.branch} onChange={update("branch")} disabled={!form.course}>
                  <option value="">{form.course ? "Select" : "Select course first"}</option>
                  {branchOptions.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="field">
                <label htmlFor="year">Year</label>
                <select id="year" value={form.year} onChange={update("year")}>
                  <option value="">Select</option>
                  <option value="1">1st</option>
                  <option value="2">2nd</option>
                  <option value="3">3rd</option>
                  <option value="4">4th</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="gender">Gender</label>
                <select id="gender" value={form.gender} onChange={update("gender")}>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label htmlFor="contactNumber">Contact number</label>
              <input id="contactNumber" value={form.contactNumber} onChange={update("contactNumber")} />
            </div>

            {error && <p className="error-text" style={{ marginBottom: 16 }}>{error}</p>}

            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={submitting}>
              {submitting ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="muted" style={{ marginTop: 20, fontSize: "0.9rem" }}>
            Already have an account? <Link to="/login" style={{ color: "var(--color-ink)", fontWeight: 600 }}>Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
