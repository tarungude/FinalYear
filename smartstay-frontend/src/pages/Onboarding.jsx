import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="container" style={{ paddingTop: "var(--space-8)", maxWidth: 640 }}>
      <h1>Welcome, {user?.name?.split(" ")[0]}.</h1>
      <p className="muted" style={{ marginTop: 12, marginBottom: 32 }}>
        Your account is set up. Next, we'll ask a few questions about how you live —
        sleep schedule, cleanliness, noise tolerance — so we can find roommates you'll
        actually get along with.
      </p>
      <button className="btn btn-gold" onClick={() => navigate("/preferences")}>
        Start the assessment
      </button>
    </div>
  );
}
