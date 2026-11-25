"use client";
import { useEffect, useState } from "react";
import { api } from "./api";
import SlotPicker from "./SlotPicker";
import Messages from "./Messages";

export default function StudentDash({ user }) {
  const [tab, setTab] = useState("book");
  const [unread, setUnread] = useState(0);

  return (
    <>
      <h2>Welcome, {user.name.split(" ")[0]}</h2>
      <div className="tabs">
        <button className={"tab" + (tab === "book" ? " active" : "")} onClick={() => setTab("book")}>Book appointment</button>
        <button className={"tab" + (tab === "mine" ? " active" : "")} onClick={() => setTab("mine")}>My appointments</button>
        <button className={"tab" + (tab === "msg" ? " active" : "")} onClick={() => setTab("msg")}>
          Messages{unread > 0 && <span className="badge dot">{unread}</span>}
        </button>
      </div>
      {tab === "book" && <Book onBooked={() => setTab("mine")} />}
      {tab === "mine" && <Mine />}
      {tab === "msg" && (
        <div className="card"><Messages onUnread={setUnread} /></div>
      )}
    </>
  );
}

function Book({ onBooked }) {
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState("");
  const [pick, setPick] = useState({ date: "", time: "" });
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api("/api/doctors").then((r) => r.ok && setDoctors(r.data.doctors));
  }, []);

  const doc = doctors.find((d) => String(d.id) === String(doctorId));

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!pick.time) return setError("Choose a time slot");
    setBusy(true);
    const r = await api("/api/appointments", {
      method: "POST",
      body: { doctor_id: Number(doctorId), date: pick.date, time: pick.time, reason },
    });
    setBusy(false);
    if (r.ok) onBooked();
    else setError(r.error);
  }

  return (
    <div className="card">
      <h3>Book an appointment</h3>
      <form onSubmit={submit}>
        <label>Doctor</label>
        <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} required>
          <option value="">Select a doctor</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>{d.name}{d.specialization ? ` — ${d.specialization}` : ""}</option>
          ))}
        </select>
        {doc && (
          <p className="muted">
            Available: {doc.availability.length ? doc.availability.map((a) => `${a.day} ${a.start}-${a.end}`).join(", ") : "no schedule set yet"}
          </p>
        )}
        {doctorId && doc?.availability.length > 0 && <SlotPicker doctorId={doctorId} onChange={setPick} />}
        <label>Reason for visit (optional)</label>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} placeholder="Briefly describe your concern" />
        {error && <div className="msg-error">{error}</div>}
        <p><button className="btn" disabled={busy || !doctorId}>{busy ? "Booking..." : "Confirm booking"}</button></p>
      </form>
    </div>
  );
}

function Mine() {
  const [items, setItems] = useState(null);
  const [resched, setResched] = useState(null); // appointment being rescheduled
  const [pick, setPick] = useState({ date: "", time: "" });
  const [error, setError] = useState("");

  const load = () => api("/api/appointments").then((r) => r.ok && setItems(r.data.appointments));
  useEffect(() => { load(); }, []);

  async function act(id, body) {
    setError("");
    const r = await api(`/api/appointments/${id}`, { method: "PATCH", body });
    if (!r.ok) return setError(r.error);
    setResched(null);
    load();
  }

  if (!items) return <p className="muted">Loading...</p>;
  return (
    <div className="card">
      <h3>My appointments</h3>
      {error && <div className="msg-error">{error}</div>}
      {items.length === 0 && <p className="muted">You have no appointments yet.</p>}
      <div className="tablewrap">
        <table>
          <thead><tr><th>Date</th><th>Time</th><th>Doctor</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id}>
                <td>{a.date}</td>
                <td>{a.time}</td>
                <td>{a.doctor_name}</td>
                <td><span className={"badge " + a.status}>{a.status}</span></td>
                <td>
                  {a.status === "booked" && (
                    <span className="row">
                      <button className="btn secondary small" onClick={() => { setResched(a); setPick({ date: "", time: "" }); }}>Reschedule</button>
                      <button className="btn danger small" onClick={() => confirm("Cancel this appointment?") && act(a.id, { action: "cancel" })}>Cancel</button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {resched && (
        <div className="card" style={{ marginTop: "1rem" }}>
          <h3>Reschedule with {resched.doctor_name}</h3>
          <SlotPicker doctorId={resched.doctor_id} onChange={setPick} />
          <p className="row">
            <button className="btn" disabled={!pick.time} onClick={() => act(resched.id, { action: "reschedule", date: pick.date, time: pick.time })}>Confirm new time</button>
            <button className="btn secondary" onClick={() => setResched(null)}>Close</button>
          </p>
        </div>
      )}
    </div>
  );
}
