import { useState, useEffect } from "react";
import * as authService from "../services/authService";
import { useAuth } from "../context/AuthContext";
import { COURSES, BRANCHES_BY_COURSE } from "../constants/courses";

/**
 * Renders the logged-in user's own profile as an editable form.
 * Used by both the student "Profile" tab and the admin "My Profile" tab —
 * course/branch fields are only shown when showCourseFields is true, since
 * an admin/warden account doesn't have a course/branch.
 */
export default function ProfileForm({ showCourseFields = true }) {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [success, setSuccess] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    authService.getMe().then((data) => {
      setForm({
        name: data.user.name || "",
        contactNumber: data.user.contactNumber || "",
        course: data.user.course || "",
        branch: data.user.branch || "",
        year: data.user.year || "",
        gender: data.user.gender || "",
      });
    });
  }, []);

  if (!form) return <p className="muted">Loading profile…</p>;

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const updateCourse = (e) => {
    const course = e.target.value;
    setForm((f) => ({ ...f, course, branch: "" }));
  };

  const branchOptions = form.course ? BRANCHES_BY_COURSE[form.course] || [] : [];

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSavingProfile(true);
    try {
      const payload = { name: form.name, contactNumber: form.contactNumber, gender: form.gender };
      if (showCourseFields) {
        payload.course = form.course;
        payload.branch = form.branch;
        payload.year = form.year ? Number(form.year) : undefined;
      }
      const data = await authService.updateMe(payload);
      updateUser({ ...user, ...data.user });
      setSuccess("Profile updated.");
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't update your profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New password and confirmation don't match.");
      return;
    }
    setSavingPassword(true);
    try {
      await authService.updateMe({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setSuccess("Password changed.");
    } catch (err) {
      setPasswordError(err.response?.data?.message || "Couldn't change your password.");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 520 }}>
      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Your details</h3>
        <form onSubmit={handleSaveProfile}>
          <div className="field">
            <label htmlFor="profile-name">Full name</label>
            <input id="profile-name" value={form.name} onChange={update("name")} required />
          </div>
          <div className="field">
            <label htmlFor="profile-contact">Contact number</label>
            <input id="profile-contact" value={form.contactNumber} onChange={update("contactNumber")} />
          </div>
          <div className="field">
            <label htmlFor="profile-gender">Gender</label>
            <select id="profile-gender" value={form.gender} onChange={update("gender")}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          {showCourseFields && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="field">
                  <label htmlFor="profile-course">Course</label>
                  <select id="profile-course" value={form.course} onChange={updateCourse}>
                    <option value="">Select</option>
                    {COURSES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="profile-branch">Branch</label>
                  <select id="profile-branch" value={form.branch} onChange={update("branch")} disabled={!form.course}>
                    <option value="">{form.course ? "Select" : "Select course first"}</option>
                    {branchOptions.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field">
                <label htmlFor="profile-year">Year</label>
                <select id="profile-year" value={form.year} onChange={update("year")}>
                  <option value="">Select</option>
                  <option value="1">1st</option>
                  <option value="2">2nd</option>
                  <option value="3">3rd</option>
                  <option value="4">4th</option>
                </select>
              </div>
            </>
          )}

          {error && <p className="error-text" style={{ marginBottom: 12 }}>{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={savingProfile}>
            {savingProfile ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Change password</h3>
        <form onSubmit={handleChangePassword}>
          <div className="field">
            <label htmlFor="current-password">Current password</label>
            <input
              id="current-password"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="new-password">New password</label>
            <input
              id="new-password"
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              required
              minLength={6}
            />
          </div>
          <div className="field">
            <label htmlFor="confirm-password">Confirm new password</label>
            <input
              id="confirm-password"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              required
              minLength={6}
            />
          </div>
          {passwordError && <p className="error-text" style={{ marginBottom: 12 }}>{passwordError}</p>}
          <button type="submit" className="btn btn-outline" disabled={savingPassword}>
            {savingPassword ? "Updating…" : "Change password"}
          </button>
        </form>
      </div>

      {success && <p className="muted" style={{ color: "var(--color-success)" }}>{success}</p>}
    </div>
  );
}
