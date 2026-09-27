import { Link } from "react-router-dom";
import image1 from "./image1.png";
import image2 from "./image2.png";
import {
  Moon,
  BookOpen,
  Sparkles,
  MessageCircle,
  ClipboardCheck,
  LayoutDashboard,
} from "lucide-react";

export default function Home() {
  return (
    <div className="home">
      <PublicNav />
      <Hero />
      <CommunityGallery />
      <About />
      <HowItWorks />
      <Features />
      <ClosingCTA />
      <Footer />
    </div>
  );
}

function PublicNav() {
  return (
    <header className="public-nav">
      <div className="container public-nav-inner">
        <span className="public-wordmark">SmartStay AI</span>
        <nav className="public-nav-links">
          <a href="#about" className="about-btn">About</a>
         <a href="#how-it-works" className="about-btn">How it works</a>
          <a href="#features" className="about-btn">Features</a>
        </nav>
        <div className="public-nav-actions">
          <Link to="/login" className="btn btn-outline">
            Log in
          </Link>
          <Link to="/signup" className="btn btn-primary">
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero">
      <div className="container hero-inner">
        <div className="hero-copy">
          <h1>
            A roommate match
            <br />
            you won't want to
            <br />
            move out on.
          </h1>
          <p className="hero-sub">
            SmartStay AI scores compatibility across sleep schedules,
            cleanliness, noise, budget, and habits — then explains, in plain
            language, why a match works before you ever share a room.
          </p>
          <div className="hero-actions">
            <Link to="/signup" className="btn btn-gold">
              Find your match
            </Link>
            <a href="#how-it-works" className="btn btn-outline">
              See how it works
            </a>
          </div>
        </div>

        <div className="hero-visual">
          <MatchCardMockup />
        </div>
      </div>
    </section>
  );
}

function MatchCardMockup() {
  const attrs = [
    ["Sleep", 100],
    ["Study", 100],
    ["Cleanliness", 90],
    ["Noise", 75],
  ];
  return (
    <div className="card rec-card mockup-card">
      <div className="rec-card-top">
        <div>
          <h3>G Tarun</h3>
          <p className="muted" style={{ fontSize: "0.88rem" }}>
            B.Tech IT · Year 4
          </p>
        </div>
        <div className="score-badge">91%</div>
      </div>
      <div className="attr-bars">
        {attrs.map(([label, val]) => (
          <div key={label} className="attr-bar-row">
            <span className="attr-bar-label">{label}</span>
            <div className="attr-bar-track">
              <div className="attr-bar-fill" style={{ width: `${val}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mockup-explain">
        <span className="muted" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
          Why this match
        </span>
        <p style={{ fontSize: "0.88rem", marginTop: 4, lineHeight: 1.5 }}>
          You're both night owls with quiet study habits — the only gap is noise
          tolerance, worth a quick chat before moving in.
        </p>
      </div>
    </div>
  );
}

function CommunityGallery() {
  return (
    <section className="community">
      <div className="container community-inner">
        <div className="community-copy">
          <h2>Built for real hostel life</h2>
          <p className="muted" style={{ marginTop: 12, maxWidth: "34ch" }}>
            From the first request to move-in day, SmartStay keeps everyone on
            the same page.
          </p>
        </div>
        {/* <div className="community-images">
          <AgreementIllustration />
          <RoommatesIllustration />
        </div> */}
        <div className="community-images">
  <img src={image1} alt="SmartStay" className="image-one" />
  <img src={image2} alt="SmartStay" className="image-two" />
</div>
        <div>

        </div>
      </div>
    </section>
  );
}

function AgreementIllustration() {
  return (
    <svg
      viewBox="0 0 280 240"
      className="community-img"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="280" height="240" rx="20" fill="#E3F7EC" />
      <rect
        x="80"
        y="34"
        width="120"
        height="150"
        rx="12"
        fill="#FFFFFF"
        stroke="#DCEFE3"
        strokeWidth="2"
      />
      <rect x="98" y="54" width="84" height="10" rx="5" fill="#E3F7EC" />
      <rect x="98" y="74" width="64" height="7" rx="3.5" fill="#DCEFE3" />
      <rect x="98" y="90" width="70" height="7" rx="3.5" fill="#DCEFE3" />
      <rect x="98" y="106" width="50" height="7" rx="3.5" fill="#DCEFE3" />
      <path
        d="M104 150 Q112 136 122 150 T140 150"
        stroke="#1F5C3F"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* left person */}
      <circle cx="70" cy="150" r="16" fill="#5FBE87" />
      <rect x="52" y="168" width="36" height="52" rx="14" fill="#1F5C3F" />
      <rect
        x="76"
        y="178"
        width="26"
        height="9"
        rx="4.5"
        fill="#1F5C3F"
        transform="rotate(18 76 178)"
      />

      {/* right person */}
      <circle cx="212" cy="146" r="16" fill="#2E7D52" />
      <rect x="194" y="164" width="36" height="52" rx="14" fill="#5FBE87" />
      <rect
        x="178"
        y="176"
        width="26"
        height="9"
        rx="4.5"
        fill="#5FBE87"
        transform="rotate(-18 178 176)"
      />

      {/* handshake connector */}
      <circle cx="141" cy="182" r="6" fill="#1F5C3F" />
    </svg>
  );
}

function RoommatesIllustration() {
  return (
    <svg
      viewBox="0 0 280 240"
      className="community-img"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="280" height="240" rx="20" fill="#F3FBF6" />
      <rect x="20" y="196" width="240" height="8" rx="4" fill="#DCEFE3" />

      {/* person 1 */}
      <circle cx="76" cy="96" r="19" fill="#1F5C3F" />
      <rect x="54" y="118" width="44" height="72" rx="16" fill="#5FBE87" />

      {/* person 2 (taller, center) */}
      <circle cx="140" cy="78" r="21" fill="#5FBE87" />
      <rect x="115" y="102" width="50" height="88" rx="18" fill="#1F5C3F" />

      {/* person 3 */}
      <circle cx="204" cy="98" r="19" fill="#2E7D52" />
      <rect
        x="182"
        y="120"
        width="44"
        height="70"
        rx="16"
        fill="#E3F7EC"
        stroke="#DCEFE3"
        strokeWidth="2"
      />

      {/* small dog */}
      <ellipse cx="238" cy="182" rx="16" ry="10" fill="#5FBE87" />
      <circle cx="252" cy="176" r="7" fill="#5FBE87" />
    </svg>
  );
}

function About() {
  return (
    <section className="about" id="about">
      <div className="container about-inner">
        <div className="about-label">About SmartStay</div>
        <h2>Room allocation, minus the guesswork.</h2>
        <p className="about-body">
          Most hostels assign roommates by whatever's left on a spreadsheet —
          not by whether two people will actually get along. A mismatch in sleep
          schedules or noise tolerance turns into a semester of friction.
          SmartStay AI replaces that gamble with a structured assessment, a
          transparent compatibility score, and an AI-generated explanation for
          every match — so students choose with real information, and wardens
          allocate rooms with confidence instead of complaints.
        </p>
      </div>
    </section>
  );
}

const STEPS = [
  {
    n: "01",
    title: "Tell us how you live",
    body: "A short assessment covers your sleep schedule, cleanliness, noise tolerance, study habits, and budget.",
  },
  {
    n: "02",
    title: "Get matched",
    body: "Our engine scores you against every other student and ranks the most compatible options.",
  },
  {
    n: "03",
    title: "Send a request",
    body: "Like a match? Send a request. They accept, and you're both a step closer to rooming together.",
  },
  {
    n: "04",
    title: "Move in",
    body: "Your warden finalizes the room. You'll see your roommate and room details the moment it's confirmed.",
  },
];

function HowItWorks() {
  return (
    <section className="how" id="how-it-works">
      <div className="container">
        <h2 style={{ marginBottom: 40 }}>How it works</h2>
        <div className="how-steps">
          {STEPS.map((s) => (
            <div className="how-step" key={s.n}>
              <span className="how-step-num">{s.n}</span>
              <h3 style={{ fontSize: "1.1rem", marginTop: 14 }}>{s.title}</h3>
              <p
                className="muted"
                style={{ marginTop: 8, fontSize: "0.92rem" }}
              >
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    icon: Moon,
    title: "Compatibility scoring",
    body: "A weighted algorithm across sleep, cleanliness, noise, budget, and interests — transparent, not a black box.",
  },
  {
    icon: Sparkles,
    title: "AI-generated explanations",
    body: "Gemini explains why a match works and flags friction points, grounded in your actual compatibility score.",
  },
  {
    icon: ClipboardCheck,
    title: "Room allocation",
    body: "Wardens review compatible groups against real room capacity and finalize allocations in one place.",
  },
  {
    icon: MessageCircle,
    title: "Roommate chat",
    body: "Message your matches directly, once a request is accepted — no need to swap numbers first.",
  },
  {
    icon: BookOpen,
    title: "Hostel assistant",
    body: "A built-in chatbot answers questions about hostel life and how the matching process works.",
  },
  {
    icon: LayoutDashboard,
    title: "Admin dashboard",
    body: "Students, rooms, matches, requests, and feedback — all visible in one operational view.",
  },
];

function Features() {
  return (
    <section className="features" id="features">
      <div className="container">
        <h2 style={{ marginBottom: 40 }}>Everything both sides need</h2>
        <div className="features-grid">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div className="feature-card" key={title}>
              <Icon size={22} strokeWidth={1.75} color="var(--color-gold)" />
              <h3 style={{ fontSize: "1.05rem", marginTop: 16 }}>{title}</h3>
              <p className="muted" style={{ marginTop: 8, fontSize: "0.9rem" }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClosingCTA() {
  return (
    <section className="closing-cta">
      <div className="container closing-cta-inner">
        <h2>Ready to find who you'll actually get along with?</h2>
        <Link to="/signup" className="btn btn-gold" style={{ marginTop: 24 }}>
          Create your account
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="public-footer">
      <div className="container public-footer-inner">
        <span className="public-wordmark" style={{ fontSize: "1.1rem" }}>
          SmartStay AI
        </span>
        <p className="muted" style={{ fontSize: "0.85rem" }}>
          An Intelligent Hostel and Roommate Matching System
        </p>
      </div>
    </footer>
  );
}
