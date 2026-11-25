"use client";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/components/api";

export default function Register() {
  const [f, setF] = useState({ name: "", email: "", matric_no: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const r = await api("/api/auth/register", { method: "POST", body: f });
    if (r.ok) window.location.href = "/dashboard";
    else {
      setError(r.error);
      setBusy(false);
    }
  }

  return (
    <>
      <div className="topbar"><div className="container"><Link className="brand" href="/">Bayero University Clinic</Link></div></div>
      <div className="container narrow">
        <div className="card">
          <h2>Student sign up</h2>
          <form onSubmit={submit}>
            <label>Full name</label>
            <input value={f.name} onChange={set("name")} required />
            <label>Email</label>
            <input type="email" value={f.email} onChange={set("email")} required autoComplete="email" />
            <label>Matric / registration number</label>
            <input value={f.matric_no} onChange={set("matric_no")} required />
            <label>Phone (optional)</label>
            <input value={f.phone} onChange={set("phone")} inputMode="tel" />
            <label>Password (min 8 characters)</label>
            <input type="password" value={f.password} onChange={set("password")} required minLength={8} autoComplete="new-password" />
            {error && <div className="msg-error">{error}</div>}
            <p><button className="btn" disabled={busy}>{busy ? "Creating..." : "Create account"}</button></p>
          </form>
          <p className="muted">Already registered? <Link href="/login">Log in</Link></p>
        </div>
      </div>
    </>
  );
}
