"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { api, type SessionUser } from "@/lib/api";
import { AppShell } from "@/components/dashboard/app-shell";

export default function Dashboard() {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    api<{ user: SessionUser }>("/api/auth/me").then((r) => {
      if (r.ok) setUser(r.data.user);
      else window.location.href = "/login";
    });
  }, []);

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    toast.success("Logged out");
    window.location.href = "/";
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-sm font-medium">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return <AppShell user={user} onLogout={logout} />;
}
