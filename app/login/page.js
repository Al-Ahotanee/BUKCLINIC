"use client";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/components/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const r = await api("/api/auth/login", { method: "POST", body: { email, password } });
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
          <h2>Log in</h2>
          <form onSubmit={submit}>
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            {error && <div className="msg-error">{error}</div>}
            <p><button className="btn" disabled={busy}>{busy ? "Logging in..." : "Log in"}</button></p>
          </form>
          <p className="muted">New student? <Link href="/register">Create an account</Link></p>
        </div>
      </div>
    </>
  );
}
