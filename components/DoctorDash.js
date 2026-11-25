"use client";
import { useEffect, useState } from "react";
import { api, todayISO } from "./api";
import Messages from "./Messages";

export default function DoctorDash({ user }) {
  const [tab, setTab] = useState("appts");
  const [unread, setUnread] = useState(0);
  return (
    <>
      <h2>{user.name}</h2>
      <div className="tabs">
        <button className={"tab" + (tab === "appts" ? " active" : "")} onClick={() => setTab("appts")}>Appointments</button>
        <button className={"tab" + (tab === "msg" ? " active" : "")} onClick={() => setTab("msg")}>
          Messages{unread > 0 && <span className="badge dot">{unread}</span>}
        </button>
      </div>
      {tab === "appts" && <Appts />}
      {tab === "msg" && <div className="card"><Messages onUnread={setUnread} /></div>}
    </>
  );
}

function Appts() {
  const [items, setItems] = useState(null);
  const [filter, setFilter] = useState("upcoming");
  const [error, setError] = useState("");

  const load = () => api("/api/appointments").then((r) => r.ok && setItems(r.data.appointments));
  useEffect(() => { load(); }, []);

  async function act(id, action) {
    setError("");
    const r = await api(`/api/appointments/${id}`, { method: "PATCH", body: { action } });
    if (!r.ok) return setError(r.error);
    load();
  }

  if (!items) return <p className="muted">Loading...</p>;
  const today = todayISO();
  const shown = items
    .filter((a) => (filter === "upcoming" ? a.status === "booked" && a.date >= today : filter === "today" ? a.date === today : true))
    .sort((a, b) => (filter === "all" ? 0 : (a.date + a.time).localeCompare(b.date + b.time)));

  return (
    <div className="card">
      <div className="row between">
        <h3>Appointments</h3>
        <select style={{ width: "auto" }} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="upcoming">Upcoming</option>
          <option value="today">Today</option>
          <option value="all">All</option>
        </select>
      </div>
      {error && <div className="msg-error">{error}</div>}
      {shown.length === 0 && <p className="muted">Nothing to show.</p>}
      <div className="tablewrap">
        <table>
          <thead><tr><th>Date</th><th>Time</th><th>Student</th><th>Reason</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {shown.map((a) => (
              <tr key={a.id}>
                <td>{a.date}</td>
                <td>{a.time}</td>
                <td>{a.student_name}<div className="muted">{a.matric_no}</div></td>
                <td>{a.reason || "-"}</td>
                <td><span className={"badge " + a.status}>{a.status}</span></td>
                <td>
                  {a.status === "booked" && (
                    <span className="row">
                      <button className="btn small" onClick={() => act(a.id, "complete")}>Complete</button>
                      <button className="btn danger small" onClick={() => confirm("Cancel this appointment?") && act(a.id, "cancel")}>Cancel</button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
