"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, GraduationCap, Loader2, LockKeyhole, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { AuthShell } from "@/components/dashboard/auth-shell";

export default function Register() {
  const router = useRouter();
  const [f, setF] = useState({ name: "", email: "", matric_no: "", phone: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  function validate() {
    if (f.name.trim().length < 2) return "Enter your full name";
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) return "Enter a valid email";
    if (!f.matric_no.trim()) return "Matric / registration number is required";
    if (f.password.length < 8) return "Password must be at least 8 characters";
    return "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setBusy(true);
    setError("");
    const r = await api("/api/auth/register", { method: "POST", body: f });
    if (r.ok) {
      toast.success("Account created", { description: "Welcome to the Bayero University Clinic platform." });
      router.push("/dashboard");
    } else {
      setError(r.error);
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Create your student account"
      subtitle="Sign up with your matriculation number — it takes less than a minute."
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" value={f.name} onChange={set("name")} placeholder="e.g. Musa Ibrahim" className="h-11" autoComplete="name" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="email" type="email" value={f.email} onChange={set("email")} placeholder="you@student.buk.edu.ng" className="h-11 pl-9" autoComplete="email" required />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="matric">Matric number</Label>
            <div className="relative">
              <GraduationCap className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="matric" value={f.matric_no} onChange={set("matric_no")} placeholder="UG22/PHY/1001" className="h-11 pl-9" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="phone" value={f.phone} onChange={set("phone")} inputMode="tel" placeholder="0803 000 0000" className="h-11 pl-9" />
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <span className="text-xs text-muted-foreground">Minimum 8 characters</span>
          </div>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPw ? "text" : "password"}
              value={f.password}
              onChange={set("password")}
              className="h-11 pl-9 pr-10"
              autoComplete="new-password"
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              aria-label={showPw ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && <p className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive">{error}</p>}

        <Button type="submit" className="h-11 w-full text-[15px] font-semibold" disabled={busy}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {busy ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
