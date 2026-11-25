"use client";

import { useState } from "react";
import { KeyRound, Loader2, Phone, Save, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { api, initials, type SessionUser } from "@/lib/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfilePanel({ user }: { user: SessionUser }) {
  const [phone, setPhone] = useState(user.phone ?? "");
  const [phoneBusy, setPhoneBusy] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  async function savePhone(e: React.FormEvent) {
    e.preventDefault();
    setPhoneBusy(true);
    const r = await api("/api/profile", { method: "PATCH", body: { phone } });
    setPhoneBusy(false);
    if (r.ok) toast.success("Phone number updated");
    else toast.error(r.error);
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPw.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("New passwords do not match");
      return;
    }
    setPwBusy(true);
    const r = await api("/api/profile/password", {
      method: "POST",
      body: { current_password: currentPw, new_password: newPw },
    });
    setPwBusy(false);
    if (r.ok) {
      toast.success("Password changed", { description: "Use your new password the next time you log in." });
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } else {
      toast.error(r.error);
    }
  }

  return (
    <div className="grid max-w-4xl gap-5 lg:grid-cols-2">
      {/* Identity */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-primary/10 text-lg font-bold text-primary">{initials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <CardTitle className="truncate">{user.name}</CardTitle>
              <CardDescription className="truncate">{user.email}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2.5">
              <dt className="flex items-center gap-2 text-muted-foreground"><UserRound className="h-4 w-4" /> Role</dt>
              <dd>
                <Badge variant="secondary" className="rounded-full bg-primary/10 font-semibold capitalize text-primary">
                  {user.role}
                </Badge>
              </dd>
            </div>
            {user.role === "student" && user.matric_no && (
              <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2.5">
                <dt className="text-muted-foreground">Matric number</dt>
                <dd className="font-medium">{user.matric_no}</dd>
              </div>
            )}
            {user.role === "doctor" && user.specialization && (
              <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2.5">
                <dt className="text-muted-foreground">Specialization</dt>
                <dd className="font-medium">{user.specialization}</dd>
              </div>
            )}
            <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2.5">
              <dt className="text-muted-foreground">Account status</dt>
              <dd className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="h-4 w-4" /> Active
              </dd>
            </div>
          </dl>

          <form onSubmit={savePhone} className="space-y-2 border-t pt-4">
            <Label htmlFor="phone">Phone number</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" className="h-10 pl-9" placeholder="0803 000 0000" />
              </div>
              <Button type="submit" size="icon" className="h-10 w-10 shrink-0" disabled={phoneBusy} aria-label="Save phone number">
                {phoneBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Kept private — used only if the clinic needs to reach you.</p>
          </form>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-4.5 w-4.5 text-primary" /> Change password
          </CardTitle>
          <CardDescription>Choose a strong password you do not use anywhere else.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={changePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cur">Current password</Label>
              <Input id="cur" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} autoComplete="current-password" className="h-10" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new">New password</Label>
              <Input id="new" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} autoComplete="new-password" className="h-10" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="conf">Confirm new password</Label>
              <Input id="conf" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} autoComplete="new-password" className="h-10" required />
            </div>
            <Button type="submit" className="h-10 w-full font-semibold" disabled={pwBusy || !currentPw || !newPw}>
              {pwBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
