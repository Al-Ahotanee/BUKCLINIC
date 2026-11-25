"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Eye, EyeOff, Loader2, LockKeyhole, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { AuthShell } from "@/components/dashboard/auth-shell";

const DEMO = [
  { role: "Student", email: "musa.ibrahim@student.buk.edu.ng", password: "Student123!" },
  { role: "Doctor", email: "dr.bello@buk.edu.ng", password: "Doctor123!" },
  { role: "Admin", email: "admin@buk.edu.ng", password: "Admin123!" },
];

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const r = await api("/api/auth/login", { method: "POST", body: { email, password } });
    if (r.ok) {
      toast.success("Welcome back!", { description: "Redirecting to your dashboard…" });
      router.push("/dashboard");
    } else {
      setError(r.error);
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to book appointments, manage your schedule, and message the clinic."
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@student.buk.edu.ng"
              className="h-11 pl-9"
              autoComplete="email"
              required
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <button type="button" onClick={() => setShowPw(!showPw)} className="text-xs font-medium text-muted-foreground hover:text-foreground" aria-label={showPw ? "Hide password" : "Show password"}>
              {showPw ? "Hide" : "Show"}
            </button>
          </div>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="h-11 pl-9"
              autoComplete="current-password"
              required
            />
          </div>
        </div>

        {error && <p className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive">{error}</p>}

        <Button type="submit" className="h-11 w-full text-[15px] font-semibold" disabled={busy}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {busy ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        New student?{" "}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Create an account
        </Link>
      </p>

      <Collapsible className="mt-4">
        <CollapsibleTrigger className="group flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-muted/40 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted">
          Preview accounts for a quick look
          <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 space-y-1.5 rounded-lg border bg-muted/30 p-3">
            {DEMO.map((d) => (
              <button
                key={d.email}
                type="button"
                onClick={() => {
                  setEmail(d.email);
                  setPassword(d.password);
                }}
                className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent"
              >
                <span className="font-semibold">{d.role}</span>
                <span className="truncate text-muted-foreground">{d.email} · {d.password}</span>
              </button>
            ))}
            <p className="px-2 pt-1 text-[11px] text-muted-foreground">Click a row to fill the form. Preview data only — replace on your deployment.</p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </AuthShell>
  );
}
