"use client";
import { useEffect, useState } from "react";
import { api, DAY_NAMES } from "./api";

export default function AdminDash() {
  const [tab, setTab] = useState("overview");
  return (
    <>
      <h2>Administrator</h2>
      <div className="tabs">
        {[
          ["overview", "Overview"],
          ["users", "Users"],
          ["schedules", "Doctor schedules"],
          ["appts", "All appointments"],
        ].map(([k, l]) => (
          <button key={k} className={"tab" + (tab === k ? " active" : "")} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      {tab === "overview" && <Overview />}
      {tab === "users" && <Users />}
      {tab === "schedules" && <Schedules />}
      {tab === "appts" && <AllAppts />}
    </>
  );
}

function Overview() {
  const [s, setS] = useState(null);
  useEffect(() => { api("/api/admin/appointments").then((r) => r.ok && setS(r.data.stats)); }, []);
  if (!s) return <p className="muted">Loading...</p>;
  const items = [["Students", s.students], ["Doctors", s.doctors], ["Booked", s.booked], ["Completed", s.completed], ["Cancelled", s.cancelled]];
  return (
    <div className="grid stats">
      {items.map(([l, v]) => (
        <div className="card stat" key={l}><b>{v}</b>{l}</div>
      ))}
    </div>
  );
}

function Users() {
  const [users, setUsers] = useState([]);
  const [f, setF] = useState({ name: "", email: "", password: "", specialization: "" });
  const [msg, setMsg] = useState({ type: "", text: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const load = () => api("/api/admin/users").then((r) => r.ok && setUsers(r.data.users));
  useEffect(() => { load(); }, []);

  async function add(e) {
    e.preventDefault();
    const r = await api("/api/admin/users", { method: "POST", body: f });
    if (r.ok) {
      setMsg({ type: "ok", text: "Doctor account created." });
      setF({ name: "", email: "", password: "", specialization: "" });
      load();
    } else setMsg({ type: "error", text: r.error });
  }

  async function toggle(u) {
    const r = await api("/api/admin/users", { method: "PATCH", body: { id: u.id, active: !u.active } });
    if (!r.ok) setMsg({ type: "error", text: r.error });
    else load();
  }

  return (
    <>
      <div className="card">
        <h3>Add a doctor</h3>
        <form onSubmit={add} className="grid two">
          <div><label>Name</label><input value={f.name} onChange={set("name")} required /></div>
          <div><label>Email</label><input type="email" value={f.email} onChange={set("email")} required /></div>
          <div><label>Specialization</label><input value={f.specialization} onChange={set("specialization")} /></div>
          <div><label>Temporary password (min 8)</label><input type="text" value={f.password} onChange={set("password")} required minLength={8} /></div>
          <div><button className="btn">Create doctor</button></div>
        </form>
        {msg.text && <div className={msg.type === "ok" ? "msg-ok" : "msg-error"}>{msg.text}</div>}
      </div>
      <div className="card">
        <h3>All users</h3>
        <div className="tablewrap">
          <table>
            <thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Matric</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.role}</td>
                  <td>{u.email}</td>
                  <td>{u.matric_no || "-"}</td>
                  <td>{u.active ? "Active" : "Deactivated"}</td>
                  <td>{u.role !== "admin" && (
                    <button className={"btn small " + (u.active ? "danger" : "secondary")} onClick={() => toggle(u)}>
                      {u.active ? "Deactivate" : "Activate"}
                    </button>
                  )}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function Schedules() {
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState("");
  const [rows, setRows] = useState([]);
  const [f, setF] = useState({ weekday: "1", start_time: "09:00", end_time: "13:00", slot_minutes: "20" });
  const [error, setError] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => { api("/api/doctors").then((r) => r.ok && setDoctors(r.data.doctors)); }, []);
  const load = (id) => api(`/api/admin/schedules?doctorId=${id}`).then((r) => r.ok && setRows(r.data.schedules));
  useEffect(() => { if (doctorId) load(doctorId); else setRows([]); }, [doctorId]);

  async function add(e) {
    e.preventDefault();
    setError("");
    const r = await api("/api/admin/schedules", {
      method: "POST",
      body: { doctor_id: Number(doctorId), weekday: Number(f.weekday), start_time: f.start_time, end_time: f.end_time, slot_minutes: Number(f.slot_minutes) },
    });
    if (!r.ok) return setError(r.error);
    load(doctorId);
  }

  async function remove(id) {
    await api(`/api/admin/schedules?id=${id}`, { method: "DELETE" });
    load(doctorId);
  }

  return (
    <div className="card">
      <h3>Doctor schedules</h3>
      <label>Doctor</label>
      <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
        <option value="">Select a doctor</option>
        {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
      </select>
      {doctorId && (
        <>
          <div className="tablewrap" style={{ marginTop: ".75rem" }}>
            <table>
              <thead><tr><th>Day</th><th>From</th><th>To</th><th>Slot (min)</th><th></th></tr></thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td>{DAY_NAMES[s.weekday]}</td><td>{s.start_time}</td><td>{s.end_time}</td><td>{s.slot_minutes}</td>
                    <td><button className="btn danger small" onClick={() => remove(s.id)}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <p className="muted">No schedule yet. Students cannot book this doctor until you add one.</p>}
          </div>
          <h3 style={{ marginTop: "1rem" }}>Add availability</h3>
          <form onSubmit={add} className="grid two">
            <div>
              <label>Day</label>
              <select value={f.weekday} onChange={set("weekday")}>
                {DAY_NAMES.map((d, i) => <option key={d} value={i}>{d}</option>)}
              </select>
            </div>
            <div><label>Slot length (minutes)</label><input type="number" min="5" max="120" value={f.slot_minutes} onChange={set("slot_minutes")} /></div>
            <div><label>From</label><input type="time" value={f.start_time} onChange={set("start_time")} required /></div>
            <div><label>To</label><input type="time" value={f.end_time} onChange={set("end_time")} required /></div>
            <div><button className="btn">Add block</button></div>
          </form>
          {error && <div className="msg-error">{error}</div>}
        </>
      )}
    </div>
  );
}

function AllAppts() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const load = () => api("/api/admin/appointments").then((r) => r.ok && setItems(r.data.appointments));
  useEffect(() => { load(); }, []);

  async function cancel(id) {
    if (!confirm("Cancel this appointment?")) return;
    const r = await api(`/api/appointments/${id}`, { method: "PATCH", body: { action: "cancel" } });
    if (!r.ok) setError(r.error);
    else load();
  }

  if (!items) return <p className="muted">Loading...</p>;
  return (
    <div className="card">
      <h3>All appointments (latest 300)</h3>
      {error && <div className="msg-error">{error}</div>}
      <div className="tablewrap">
        <table>
          <thead><tr><th>Date</th><th>Time</th><th>Student</th><th>Doctor</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id}>
                <td>{a.date}</td><td>{a.time}</td>
                <td>{a.student_name}<div className="muted">{a.matric_no}</div></td>
                <td>{a.doctor_name}</td>
                <td><span className={"badge " + a.status}>{a.status}</span></td>
                <td>{a.status === "booked" && <button className="btn danger small" onClick={() => cancel(a.id)}>Cancel</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
