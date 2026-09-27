import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import * as matchService from "../services/matchService";
import * as requestService from "../services/requestService";
import * as allocationService from "../services/allocationService";
import * as feedbackService from "../services/feedbackService";
import * as messageService from "../services/messageService";
import ChatbotWidget from "../components/ChatbotWidget";
import ProfileForm from "../components/ProfileForm";

const TABS = ["Recommendations", "Requests", "Chat", "My room", "Profile"];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("Recommendations");

  return (
    <div>
      <TopBar user={user} onLogout={logout} />
      <div className="container" style={{ paddingTop: "var(--space-6)", paddingBottom: "var(--space-8)" }}>
        <div className="tab-row">
          {TABS.map((t) => (
            <button key={t} className={`tab-btn ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>

        {tab === "Recommendations" && <RecommendationsTab />}
        {tab === "Requests" && <RequestsTab />}
        {tab === "Chat" && <ChatTab />}
        {tab === "My room" && <MyRoomTab />}
        {tab === "Profile" && <ProfileForm showCourseFields={true} />}
      </div>
      <ChatbotWidget />
    </div>
  );
}

function TopBar({ user, onLogout }) {
  return (
    <div className="topbar">
      <div className="container topbar-inner">
        <span className="topbar-wordmark">SmartStay</span>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span className="muted" style={{ fontSize: "0.9rem" }}>Hi, {user?.name?.split(" ")[0]}</span>
          <button className="btn btn-outline" onClick={onLogout}>Log out</button>
        </div>
      </div>
    </div>
  );
}

// ---------------- Recommendations ----------------

function RecommendationsTab() {
  const [recs, setRecs] = useState(null);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [explanations, setExplanations] = useState({});
  const [loadingExplanation, setLoadingExplanation] = useState(null);
  const [sentTo, setSentTo] = useState({});

  useEffect(() => {
    matchService
      .getRecommendations()
      .then((data) => setRecs(data.recommendations))
      .catch((err) => setError(err.response?.data?.message || "Couldn't load recommendations."));
  }, []);

  const toggleExplain = async (matchId) => {
    if (expandedId === matchId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(matchId);
    if (!explanations[matchId]) {
      setLoadingExplanation(matchId);
      try {
        const data = await matchService.getMatchExplanation(matchId);
        setExplanations((e) => ({ ...e, [matchId]: data }));
      } catch {
        setExplanations((e) => ({ ...e, [matchId]: { explanation: "Couldn't load explanation right now.", conflictAreas: [], tips: [] } }));
      } finally {
        setLoadingExplanation(null);
      }
    }
  };

  const handleSendRequest = async (candidateId) => {
    try {
      await requestService.sendRequest(candidateId);
      setSentTo((s) => ({ ...s, [candidateId]: true }));
    } catch (err) {
      alert(err.response?.data?.message || "Couldn't send request.");
    }
  };

  if (error) return <EmptyState title="Something went wrong" body={error} />;
  if (recs === null) return <p className="muted">Finding your matches…</p>;
  if (recs.length === 0) {
    return (
      <EmptyState
        title="No matches yet"
        body="Once more students complete their preference assessment, compatible matches will show up here."
      />
    );
  }

  return (
    <div className="rec-list">
      {recs.map((r) => (
        <div className="card rec-card" key={r.matchId}>
          <div className="rec-card-top">
            <div>
              <h3>{r.candidate.name}</h3>
              <p className="muted" style={{ fontSize: "0.88rem" }}>
                {r.candidate.course || "Course not specified"}
                {r.candidate.branch ? ` (${r.candidate.branch})` : ""}
                {r.candidate.year ? ` · Year ${r.candidate.year}` : ""}
              </p>
              {r.requestStatus === "accepted" && <span className="badge badge-success" style={{ marginTop: 6 }}>Matched</span>}
              {r.requestStatus === "pending" && <span className="badge badge-gold" style={{ marginTop: 6 }}>Request pending</span>}
            </div>
            <div className="score-badge">{r.overallScore}%</div>
          </div>

          <div className="attr-bars">
            {Object.entries(r.breakdown).slice(0, 4).map(([key, val]) => (
              <div key={key} className="attr-bar-row">
                <span className="attr-bar-label">{formatLabel(key)}</span>
                <div className="attr-bar-track">
                  <div className="attr-bar-fill" style={{ width: `${val}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button className="btn btn-outline" onClick={() => toggleExplain(r.matchId)}>
              {expandedId === r.matchId ? "Hide details" : "Why this match?"}
            </button>
            <button
              className="btn btn-gold"
              onClick={() => handleSendRequest(r.candidate.id)}
              disabled={sentTo[r.candidate.id] || r.requestStatus === "pending" || r.requestStatus === "accepted"}
            >
              {r.requestStatus === "accepted"
                ? "Already matched"
                : r.requestStatus === "pending" || sentTo[r.candidate.id]
                ? "Request sent"
                : "Send roommate request"}
            </button>
          </div>

          {expandedId === r.matchId && (
            <div className="explain-panel">
              {loadingExplanation === r.matchId ? (
                <p className="muted">Generating explanation…</p>
              ) : (
                <>
                  <p>{explanations[r.matchId]?.explanation}</p>
                  {explanations[r.matchId]?.conflictAreas?.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <span className="muted" style={{ fontSize: "0.82rem", fontWeight: 600 }}>Potential friction</span>
                      <ul className="explain-list">
                        {explanations[r.matchId].conflictAreas.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>
                  )}
                  {explanations[r.matchId]?.tips?.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <span className="muted" style={{ fontSize: "0.82rem", fontWeight: 600 }}>Tips</span>
                      <ul className="explain-list">
                        {explanations[r.matchId].tips.map((t, i) => <li key={i}>{t}</li>)}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function formatLabel(key) {
  const map = {
    sleepSchedule: "Sleep",
    studyHabit: "Study",
    cleanliness: "Cleanliness",
    noiseTolerance: "Noise",
    socialPreference: "Social",
    guestFrequency: "Guests",
    budget: "Budget",
    interests: "Interests",
    habitsCompatibility: "Habits",
  };
  return map[key] || key;
}

// ---------------- Requests ----------------

function RequestsTab() {
  const [received, setReceived] = useState(null);
  const [sent, setSent] = useState(null);
  const [error, setError] = useState("");

  const load = () => {
    Promise.all([requestService.getReceivedRequests(), requestService.getSentRequests()])
      .then(([r, s]) => {
        setReceived(r.requests);
        setSent(s.requests);
      })
      .catch((err) => setError(err.response?.data?.message || "Couldn't load requests."));
  };

  useEffect(load, []);

  const respond = async (id, action) => {
    try {
      await requestService.respondToRequest(id, action);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Couldn't respond to request.");
    }
  };

  const cancel = async (id) => {
    try {
      await requestService.cancelRequest(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Couldn't cancel request.");
    }
  };

  if (error) return <EmptyState title="Something went wrong" body={error} />;
  if (received === null) return <p className="muted">Loading requests…</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div>
        <h3 style={{ marginBottom: 12 }}>Received</h3>
        {received.length === 0 ? (
          <p className="muted">No requests yet.</p>
        ) : (
          <div className="rec-list">
            {received.map((req) => (
              <div className="card request-row" key={req._id}>
                <div>
                  <p style={{ fontWeight: 600 }}>{req.sender.name}</p>
                  <p className="muted" style={{ fontSize: "0.85rem" }}>
                    {req.match ? `${req.match.overallScore}% compatible` : ""}
                  </p>
                </div>
                {req.status === "pending" ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-outline" onClick={() => respond(req._id, "reject")}>Decline</button>
                    <button className="btn btn-gold" onClick={() => respond(req._id, "accept")}>Accept</button>
                  </div>
                ) : req.status === "accepted" ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <StatusBadge status={req.status} />
                    <button className="btn btn-outline" onClick={() => cancel(req._id)}>Unmatch</button>
                  </div>
                ) : (
                  <StatusBadge status={req.status} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 style={{ marginBottom: 12 }}>Sent</h3>
        {sent.length === 0 ? (
          <p className="muted">You haven't sent any requests yet.</p>
        ) : (
          <div className="rec-list">
            {sent.map((req) => (
              <div className="card request-row" key={req._id}>
                <div>
                  <p style={{ fontWeight: 600 }}>{req.receiver.name}</p>
                  <p className="muted" style={{ fontSize: "0.85rem" }}>
                    {req.match ? `${req.match.overallScore}% compatible` : ""}
                  </p>
                </div>
                {req.status === "pending" ? (
                  <button className="btn btn-outline" onClick={() => cancel(req._id)}>Cancel</button>
                ) : req.status === "accepted" ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <StatusBadge status={req.status} />
                    <button className="btn btn-outline" onClick={() => cancel(req._id)}>Unmatch</button>
                  </div>
                ) : (
                  <StatusBadge status={req.status} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const cls = status === "accepted" ? "badge-success" : status === "rejected" ? "badge-alert" : "badge-gold";
  return <span className={`badge ${cls}`}>{status}</span>;
}

// ---------------- My room ----------------

function MyRoomTab() {
  const [allocation, setAllocation] = useState(undefined); // undefined = loading, null = none
  const [error, setError] = useState("");

  useEffect(() => {
    allocationService
      .getMyAllocation()
      .then((data) => setAllocation(data.allocation))
      .catch((err) => {
        if (err.response?.status === 404) {
          setAllocation(null);
        } else {
          setError(err.response?.data?.message || "Couldn't load your room.");
        }
      });
  }, []);

  if (error) return <EmptyState title="Something went wrong" body={error} />;
  if (allocation === undefined) return <p className="muted">Loading…</p>;
  if (allocation === null) {
    return (
      <EmptyState
        title="No room assigned yet"
        body="Once an admin finalizes your allocation, your room and roommate details will appear here."
      />
    );
  }

  return (
    <div className="card" style={{ maxWidth: 480 }}>
      <span className="badge badge-gold">Room {allocation.room.roomNumber}</span>
      <h2 style={{ marginTop: 12 }}>{allocation.room.block}, Floor {allocation.room.floor}</h2>
      <p className="muted" style={{ marginTop: 4 }}>₹{allocation.room.monthlyRent}/month</p>

      <div style={{ marginTop: 20 }}>
        <span className="muted" style={{ fontSize: "0.85rem", fontWeight: 600 }}>Roommates</span>
        <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
          {allocation.students.map((s) => (
            <li key={s._id} style={{ marginBottom: 4 }}>{s.name}</li>
          ))}
        </ul>
      </div>

      <FeedbackForm />
    </div>
  );
}

const ISSUE_TAGS = ["noise", "cleanliness", "guests", "sleep_schedule", "budget", "communication"];

function FeedbackForm() {
  const [existing, setExisting] = useState(undefined); // undefined = loading, null = none yet
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState("");
  const [tags, setTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    feedbackService
      .getMyFeedback()
      .then((data) => {
        setExisting(data.feedback);
        setRating(data.feedback.satisfactionRating);
        setComments(data.feedback.comments || "");
        setTags(data.feedback.issueTags || []);
      })
      .catch(() => setExisting(null));
  }, []);

  const toggleTag = (tag) => setTags((t) => (t.includes(tag) ? t.filter((x) => x !== tag) : [...t, tag]));

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      await feedbackService.submitFeedback({ satisfactionRating: rating, comments, issueTags: tags });
      setSubmitted(true);
    } catch (err) {
      alert(err.response?.data?.message || "Couldn't submit feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  if (existing === undefined) return null;

  return (
    <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--color-border)" }}>
      <h3 style={{ fontSize: "1.05rem" }}>How's it going with your roommate(s)?</h3>

      <div className="field" style={{ marginTop: 14 }}>
        <label>Satisfaction</label>
        <div style={{ display: "flex", gap: 6 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={`choice-pill ${rating === n ? "selected" : ""}`}
              onClick={() => setRating(n)}
              style={{ padding: "8px 14px" }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Any issues? (optional)</label>
        <div className="choice-row">
          {ISSUE_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`choice-pill ${tags.includes(tag) ? "selected" : ""}`}
              onClick={() => toggleTag(tag)}
            >
              {tag.replaceAll("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label htmlFor="fb-comments">Comments (optional)</label>
        <textarea id="fb-comments" rows={3} value={comments} onChange={(e) => setComments(e.target.value)} maxLength={1000} />
      </div>

      <button className="btn btn-gold" onClick={handleSubmit} disabled={submitting || rating === 0}>
        {submitting ? "Saving…" : existing ? "Update feedback" : "Submit feedback"}
      </button>

      {submitted && <p className="muted" style={{ marginTop: 10, fontSize: "0.85rem" }}>Thanks — this helps improve future matching.</p>}
    </div>
  );
}

// ---------------- Chat ----------------

function ChatTab() {
  const [conversations, setConversations] = useState(null);
  const [activeContact, setActiveContact] = useState(null);
  const [error, setError] = useState("");

  const loadConversations = () => {
    messageService
      .getConversationsList()
      .then((data) => setConversations(data.conversations))
      .catch((err) => setError(err.response?.data?.message || "Couldn't load conversations."));
  };

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 8000); // light polling for new messages/contacts
    return () => clearInterval(interval);
  }, []);

  if (error) return <EmptyState title="Something went wrong" body={error} />;
  if (conversations === null) return <p className="muted">Loading…</p>;
  if (conversations.length === 0) {
    return (
      <EmptyState
        title="No conversations yet"
        body="Once you accept a roommate request (or one of yours is accepted), you'll be able to message them here."
      />
    );
  }

  return (
    <div className="chat-layout">
      <div className="chat-contact-list">
        {conversations.map((c) => (
          <button
            key={c.contact.id}
            className={`chat-contact-row ${activeContact === c.contact.id ? "active" : ""}`}
            onClick={() => setActiveContact(c.contact.id)}
          >
            <div>
              <p style={{ fontWeight: 600 }}>{c.contact.name}</p>
              <p className="muted chat-preview">
                {c.lastMessage ? `${c.lastMessage.fromMe ? "You: " : ""}${c.lastMessage.content}` : "Say hello"}
              </p>
            </div>
            {c.unreadCount > 0 && <span className="unread-dot">{c.unreadCount}</span>}
          </button>
        ))}
      </div>

      <div className="chat-thread-panel">
        {activeContact ? (
          <ChatThread
            contact={conversations.find((c) => c.contact.id === activeContact)?.contact}
            onMessageSent={loadConversations}
          />
        ) : (
          <div className="chat-empty-thread muted">Select a conversation to start chatting.</div>
        )}
      </div>
    </div>
  );
}

function ChatThread({ contact, onMessageSent }) {
  const [messages, setMessages] = useState(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const load = () => {
    messageService.getConversation(contact.id).then((data) => setMessages(data.messages));
  };

  useEffect(() => {
    setMessages(null);
    load();
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contact.id]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    try {
      await messageService.sendMessage(contact.id, draft.trim());
      setDraft("");
      load();
      onMessageSent();
    } catch (err) {
      alert(err.response?.data?.message || "Couldn't send message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chat-thread">
      <div className="chat-thread-header">
        <p style={{ fontWeight: 600 }}>{contact.name}</p>
      </div>

      <div className="chat-messages">
        {messages === null ? (
          <p className="muted">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="muted">No messages yet — say hello.</p>
        ) : (
          messages.map((m) => (
            <div key={m._id} className={`chat-bubble-row ${m.receiver === contact.id ? "mine" : "theirs"}`}>
              <div className="chat-bubble">{m.content}</div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSend} className="chat-input-row">
        <input
          placeholder="Type a message…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit" className="btn btn-gold" disabled={sending || !draft.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

// ---------------- Shared ----------------

function EmptyState({ title, body }) {
  return (
    <div className="card" style={{ maxWidth: 480, textAlign: "left" }}>
      <h3>{title}</h3>
      <p className="muted" style={{ marginTop: 8 }}>{body}</p>
    </div>
  );
}
