import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(email, password);
      navigate(user.role === "student" ? "/dashboard" : "/admin");
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't sign you in. Check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="auth-brand">
          <h1 className="auth-wordmark">SmartStay</h1>
          <p className="muted">Find who you'll actually get along with.</p>
        </div>

        <div className="card auth-card">
          <h2>Welcome back</h2>
          <p className="muted" style={{ marginTop: 4, marginBottom: 24 }}>
            Log in to see your matches and room status.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && <p className="error-text" style={{ marginBottom: 16 }}>{error}</p>}

            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={submitting}>
              {submitting ? "Signing in…" : "Log in"}
            </button>
          </form>

          <p className="muted" style={{ marginTop: 20, fontSize: "0.9rem" }}>
            New here? <Link to="/signup" style={{ color: "var(--color-ink)", fontWeight: 600 }}>Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
