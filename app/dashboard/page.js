"use client";
import { useEffect, useState } from "react";
import { api } from "@/components/api";
import StudentDash from "@/components/StudentDash";
import DoctorDash from "@/components/DoctorDash";
import AdminDash from "@/components/AdminDash";

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    api("/api/auth/me").then((r) => {
      if (r.ok) setUser(r.data.user);
      else window.location.href = "/login";
    });
  }, []);

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  if (!user) return <div className="container muted">Loading...</div>;

  return (
    <>
      <div className="topbar">
        <div className="container">
          <span className="brand">BUK Clinic Appointments</span>
          <span className="row">
            <small>{user.name} ({user.role})</small>
            <button className="btn secondary small" onClick={logout}>Log out</button>
          </span>
        </div>
      </div>
      <div className="container">
        {user.role === "student" && <StudentDash user={user} />}
        {user.role === "doctor" && <DoctorDash user={user} />}
        {user.role === "admin" && <AdminDash user={user} />}
        <p className="notice">Booking and messaging only. Not for emergencies, go directly to the clinic.</p>
      </div>
    </>
  );
}
