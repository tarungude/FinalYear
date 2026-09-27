import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import * as adminService from "../services/adminService";
import * as roomService from "../services/roomService";
import * as matchService from "../services/matchService";
import * as requestService from "../services/requestService";
import * as allocationService from "../services/allocationService";
import * as feedbackService from "../services/feedbackService";
import ProfileForm from "../components/ProfileForm";

const TABS = ["Overview", "Students", "Rooms", "Matches", "Requests", "Allocations", "Feedback", "My Profile"];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("Overview");

  return (
    <div>
      <div className="topbar">
        <div className="container topbar-inner">
          <span className="topbar-wordmark">SmartStay · Admin</span>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span className="muted" style={{ fontSize: "0.9rem" }}>{user?.name}</span>
            <button className="btn btn-outline" onClick={logout}>Log out</button>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: "var(--space-6)", paddingBottom: "var(--space-8)" }}>
        <div className="tab-row">
          {TABS.map((t) => (
            <button key={t} className={`tab-btn ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>

        {tab === "Overview" && <OverviewTab />}
        {tab === "Students" && <StudentsTab />}
        {tab === "Rooms" && <RoomsTab />}
        {tab === "Matches" && <MatchesTab />}
        {tab === "Requests" && <RequestsTab />}
        {tab === "Allocations" && <AllocationsTab />}
        {tab === "Feedback" && <FeedbackTab />}
        {tab === "My Profile" && <ProfileForm showCourseFields={false} />}
      </div>
    </div>
  );
}

// ---------------- Overview ----------------

function OverviewTab() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminService.getDashboardStats().then(setStats).catch((err) => setError(err.response?.data?.message || "Couldn't load stats."));
  }, []);

  if (error) return <p className="error-text">{error}</p>;
  if (!stats) return <p className="muted">Loading…</p>;

  const cards = [
    ["Total students", stats.totalStudents],
    ["Unallocated", stats.unallocatedStudents],
    ["Active rooms", stats.totalRooms],
    ["Occupancy rate", `${stats.occupancyRate}%`],
    ["Pending requests", stats.pendingRequests],
    ["Active allocations", stats.activeAllocations],
  ];

  return (
    <div className="stat-grid">
      {cards.map(([label, value]) => (
        <div className="card stat-card" key={label}>
          <span className="stat-value">{value}</span>
          <span className="muted stat-label">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------- Students ----------------

function StudentsTab() {
  const [students, setStudents] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const load = (searchTerm) => {
    adminService
      .getAllStudents(searchTerm ? { search: searchTerm } : {})
      .then((data) => setStudents(data.students))
      .catch((err) => setError(err.response?.data?.message || "Couldn't load students."));
  };

  useEffect(() => load(""), []);

  const handleSearch = (e) => {
    e.preventDefault();
    load(search);
  };

  if (error) return <p className="error-text">{error}</p>;

  return (
    <div>
      <form onSubmit={handleSearch} style={{ marginBottom: 20, display: "flex", gap: 10 }}>
        <input
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "9px 12px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", flex: 1, maxWidth: 320 }}
        />
        <button type="submit" className="btn btn-outline">Search</button>
      </form>

      {students === null ? (
        <p className="muted">Loading…</p>
      ) : students.length === 0 ? (
        <p className="muted">No students found.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Course</th><th>Year</th><th>Profile</th><th>Room</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s._id}>
                <td>{s.name}</td>
                <td>{s.email}</td>
                <td>{s.course || "—"}</td>
                <td>{s.year || "—"}</td>
                <td>
                  <span className={`badge ${s.profileCompleted ? "badge-success" : "badge-alert"}`}>
                    {s.profileCompleted ? "Complete" : "Incomplete"}
                  </span>
                </td>
                <td>{s.currentAllocation ? <span className="badge badge-gold">Allocated</span> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ---------------- Rooms ----------------

function RoomsTab() {
  const [rooms, setRooms] = useState(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = creating, else editing this room's id
  const emptyForm = { roomNumber: "", block: "", floor: "", capacity: "", monthlyRent: "", feeType: "monthly", genderRestriction: "any" };
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    roomService.getRooms().then((data) => setRooms(data.rooms)).catch((err) => setError(err.response?.data?.message || "Couldn't load rooms."));
  };

  useEffect(load, []);

  const openCreateForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (room) => {
    setEditingId(room._id);
    setForm({
      roomNumber: room.roomNumber,
      block: room.block,
      floor: room.floor,
      capacity: room.capacity,
      monthlyRent: room.monthlyRent,
      feeType: room.feeType || "monthly",
      genderRestriction: room.genderRestriction,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        floor: Number(form.floor),
        capacity: Number(form.capacity),
        monthlyRent: Number(form.monthlyRent),
      };
      if (editingId) {
        await roomService.updateRoom(editingId, payload);
      } else {
        await roomService.createRoom(payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      load();
    } catch (err) {
      alert(err.response?.data?.message || `Couldn't ${editingId ? "update" : "create"} room.`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (!confirm("Deactivate this room?")) return;
    try {
      await roomService.deleteRoom(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Couldn't deactivate room.");
    }
  };

  const FEE_LABELS = { monthly: "/ month", yearly: "/ year", semester: "/ semester" };

  if (error) return <p className="error-text">{error}</p>;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <button className="btn btn-gold" onClick={() => (showForm ? setShowForm(false) : openCreateForm())}>
          {showForm ? "Cancel" : "+ Add room"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 24, maxWidth: 560 }}>
          <h3 style={{ marginBottom: 16 }}>{editingId ? "Edit room" : "New room"}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="field">
              <label>Room number</label>
              <input required value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} />
            </div>
            <div className="field">
              <label>Block</label>
              <input required value={form.block} onChange={(e) => setForm({ ...form, block: e.target.value })} />
            </div>
            <div className="field">
              <label>Floor</label>
              <input type="number" required value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} />
            </div>
            <div className="field">
              <label>Capacity</label>
              <input type="number" min={1} required value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            </div>
            <div className="field">
              <label>Fee amount (₹)</label>
              <input type="number" required value={form.monthlyRent} onChange={(e) => setForm({ ...form, monthlyRent: e.target.value })} />
            </div>
            <div className="field">
              <label>Fee structure</label>
              <select value={form.feeType} onChange={(e) => setForm({ ...form, feeType: e.target.value })}>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="semester">Semester-wise</option>
              </select>
            </div>
            <div className="field">
              <label>Gender restriction</label>
              <select value={form.genderRestriction} onChange={(e) => setForm({ ...form, genderRestriction: e.target.value })}>
                <option value="any">Any</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Saving…" : editingId ? "Save changes" : "Create room"}
          </button>
        </form>
      )}

      {rooms === null ? (
        <p className="muted">Loading…</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr><th>Room</th><th>Block</th><th>Floor</th><th>Occupancy</th><th>Fee</th><th>Restriction</th><th></th></tr>
          </thead>
          <tbody>
            {rooms.map((r) => (
              <tr key={r._id}>
                <td>{r.roomNumber}</td>
                <td>{r.block}</td>
                <td>{r.floor}</td>
                <td>{r.currentOccupancy}/{r.capacity}</td>
                <td>₹{r.monthlyRent} {FEE_LABELS[r.feeType || "monthly"]}</td>
                <td style={{ textTransform: "capitalize" }}>{r.genderRestriction}</td>
                <td style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-outline" style={{ padding: "4px 12px" }} onClick={() => openEditForm(r)}>
                    Edit
                  </button>
                  <button className="btn btn-danger" style={{ padding: "4px 12px" }} onClick={() => handleDeactivate(r._id)}>
                    Deactivate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ---------------- Matches ----------------

function MatchesTab() {
  const [matches, setMatches] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    matchService.getMatchOverview().then((data) => setMatches(data.matches)).catch((err) => setError(err.response?.data?.message || "Couldn't load matches."));
  }, []);

  if (error) return <p className="error-text">{error}</p>;
  if (matches === null) return <p className="muted">Loading…</p>;
  if (matches.length === 0) return <p className="muted">No matches computed yet — matches appear once students view their recommendations.</p>;

  return (
    <table className="admin-table">
      <thead>
        <tr><th>Student A</th><th>Student B</th><th>Score</th></tr>
      </thead>
      <tbody>
        {matches.map((m) => (
          <tr key={m._id}>
            <td>{m.studentA?.name}</td>
            <td>{m.studentB?.name}</td>
            <td><span className="badge badge-gold">{m.overallScore}%</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ---------------- Requests ----------------

function RequestsTab() {
  const [requests, setRequests] = useState(null);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    requestService.getAllRequestsForAdmin(filter ? { status: filter } : {})
      .then((data) => setRequests(data.requests))
      .catch((err) => setError(err.response?.data?.message || "Couldn't load requests."));
  }, [filter]);

  if (error) return <p className="error-text">{error}</p>;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        {["", "pending", "accepted", "rejected", "cancelled"].map((s) => (
          <button
            key={s || "all"}
            className={`choice-pill ${filter === s ? "selected" : ""}`}
            style={{ marginRight: 8 }}
            onClick={() => setFilter(s)}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {requests === null ? (
        <p className="muted">Loading…</p>
      ) : requests.length === 0 ? (
        <p className="muted">No requests found.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr><th>From</th><th>To</th><th>Score</th><th>Status</th></tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r._id}>
                <td>{r.sender?.name}</td>
                <td>{r.receiver?.name}</td>
                <td>{r.match ? `${r.match.overallScore}%` : "—"}</td>
                <td><StatusBadge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const cls = status === "accepted" ? "badge-success" : status === "rejected" || status === "cancelled" ? "badge-alert" : "badge-gold";
  return <span className={`badge ${cls}`}>{status}</span>;
}

// ---------------- Allocations ----------------

function AllocationsTab() {
  const [allocations, setAllocations] = useState(null);
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = creating, else editing this allocation's id
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    allocationService.getAllocations().then((data) => setAllocations(data.allocations)).catch((err) => setError(err.response?.data?.message || "Couldn't load allocations."));
  };

  const loadPickerDataForCreate = () => {
    adminService.getAllStudents({ allocated: "false" }).then((data) => setStudents(data.students));
    roomService.getRooms({ available: "true" }).then((data) => setRooms(data.rooms));
  };

  useEffect(() => {
    load();
    loadPickerDataForCreate();
  }, []);

  const toggleStudent = (id) => {
    setSelectedStudents((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const openCreateForm = () => {
    setEditingId(null);
    setSelectedRoom("");
    setSelectedStudents([]);
    loadPickerDataForCreate();
    setShowForm(true);
  };

  const openEditForm = async (allocation) => {
    setEditingId(allocation._id);
    setSelectedRoom(allocation.room._id);
    setSelectedStudents(allocation.students.map((s) => s._id));
    // Editing needs the full pool, not just "unallocated" students/"available" rooms —
    // this allocation's own students/room are currently allocated/full, but should
    // still be selectable/visible since we're re-assigning from this exact allocation.
    const [studentsData, roomsData] = await Promise.all([
      adminService.getAllStudents({}),
      roomService.getRooms({}),
    ]);
    setStudents(studentsData.students);
    setRooms(roomsData.rooms);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRoom || selectedStudents.length === 0) {
      alert("Select a room and at least one student.");
      return;
    }
    setSubmitting(true);
    try {
      if (editingId) {
        await allocationService.updateAllocation(editingId, { roomId: selectedRoom, studentIds: selectedStudents });
      } else {
        await allocationService.createAllocation({ roomId: selectedRoom, studentIds: selectedStudents });
      }
      setSelectedRoom("");
      setSelectedStudents([]);
      setEditingId(null);
      setShowForm(false);
      load();
      loadPickerDataForCreate();
    } catch (err) {
      alert(err.response?.data?.message || `Couldn't ${editingId ? "update" : "create"} allocation.`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnd = async (id) => {
    if (!confirm("End this allocation and free up the room?")) return;
    try {
      await allocationService.endAllocation(id);
      load();
      loadPickerDataForCreate();
    } catch (err) {
      alert(err.response?.data?.message || "Couldn't end allocation.");
    }
  };

  if (error) return <p className="error-text">{error}</p>;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <button className="btn btn-gold" onClick={() => (showForm ? setShowForm(false) : openCreateForm())}>
          {showForm ? "Cancel" : "+ New allocation"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 24, maxWidth: 560 }}>
          <h3 style={{ marginBottom: 16 }}>{editingId ? "Edit allocation" : "New allocation"}</h3>
          <div className="field">
            <label>Room</label>
            <select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)} required>
              <option value="">Select a room</option>
              {rooms.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.block} {r.roomNumber} — {r.availableSlots ?? (r.capacity - r.currentOccupancy)} slot(s) free
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Students{editingId ? "" : " (unallocated)"}</label>
            <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: 10 }}>
              {students.length === 0 && <p className="muted" style={{ fontSize: "0.85rem" }}>No students available.</p>}
              {students.map((s) => (
                <label key={s._id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: "0.9rem" }}>
                  <input type="checkbox" checked={selectedStudents.includes(s._id)} onChange={() => toggleStudent(s._id)} />
                  {s.name} <span className="muted">({s.email})</span>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Saving…" : editingId ? "Save changes" : "Confirm allocation"}
          </button>
        </form>
      )}

      {allocations === null ? (
        <p className="muted">Loading…</p>
      ) : allocations.length === 0 ? (
        <p className="muted">No allocations yet.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr><th>Room</th><th>Students</th><th>Avg compatibility</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {allocations.map((a) => (
              <tr key={a._id}>
                <td>{a.room?.block} {a.room?.roomNumber}</td>
                <td>{a.students?.map((s) => s.name).join(", ")}</td>
                <td>{a.avgCompatibilityScore ? `${a.avgCompatibilityScore}%` : "—"}</td>
                <td><span className={`badge ${a.status === "active" ? "badge-success" : "badge-alert"}`}>{a.status}</span></td>
                <td style={{ display: "flex", gap: 8 }}>
                  {a.status === "active" && (
                    <>
                      <button className="btn btn-outline" style={{ padding: "4px 12px" }} onClick={() => openEditForm(a)}>
                        Edit
                      </button>
                      <button className="btn btn-danger" style={{ padding: "4px 12px" }} onClick={() => handleEnd(a._id)}>
                        End
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ---------------- Feedback ----------------

function FeedbackTab() {
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState("");
  const [onlyLowRatings, setOnlyLowRatings] = useState(false);

  useEffect(() => {
    feedbackService
      .getAllFeedbackForAdmin(onlyLowRatings ? { maxRating: 2 } : {})
      .then((data) => setFeedback(data.feedback))
      .catch((err) => setError(err.response?.data?.message || "Couldn't load feedback."));
  }, [onlyLowRatings]);

  if (error) return <p className="error-text">{error}</p>;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <button className={`choice-pill ${!onlyLowRatings ? "selected" : ""}`} style={{ marginRight: 8 }} onClick={() => setOnlyLowRatings(false)}>
          All
        </button>
        <button className={`choice-pill ${onlyLowRatings ? "selected" : ""}`} onClick={() => setOnlyLowRatings(true)}>
          Low ratings (≤2) — flagged
        </button>
      </div>

      {feedback === null ? (
        <p className="muted">Loading…</p>
      ) : feedback.length === 0 ? (
        <p className="muted">No feedback submitted yet.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr><th>Student</th><th>Room</th><th>Rating</th><th>Issues</th><th>Comments</th></tr>
          </thead>
          <tbody>
            {feedback.map((f) => (
              <tr key={f._id}>
                <td>{f.student?.name}</td>
                <td>{f.allocation?.room ? `${f.allocation.room.block} ${f.allocation.room.roomNumber}` : "—"}</td>
                <td>
                  <span className={`badge ${f.satisfactionRating >= 4 ? "badge-success" : f.satisfactionRating <= 2 ? "badge-alert" : "badge-gold"}`}>
                    {f.satisfactionRating}/5
                  </span>
                </td>
                <td>{f.issueTags?.length > 0 ? f.issueTags.map((t) => t.replaceAll("_", " ")).join(", ") : "—"}</td>
                <td style={{ maxWidth: 260, fontSize: "0.85rem" }}>{f.comments || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
