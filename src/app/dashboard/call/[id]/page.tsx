"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarClock, Loader2, ShieldCheck, Video } from "lucide-react";
import { toast } from "sonner";
import { api, formatDatePlain, formatTime, relativeDay } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/logo";
import { DeviceCheck } from "@/components/consultation/device-check";
import { JitsiRoom, type JitsiCfg } from "@/components/consultation/jitsi-room";

interface Consultation {
  id: number;
  date: string;
  time: string;
  reason: string | null;
  status: string;
  role: "student" | "doctor";
  me: string;
  other_name: string;
  state: "early" | "open" | "ended";
  jitsi: JitsiCfg | null;
  opens_in_minutes: number | null;
}

export default function CallPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [c, setC] = useState<Consultation | null>(null);
  const [error, setError] = useState("");
  const [left, setLeft] = useState(false);
  const router = useRouter();

  const load = useCallback(async () => {
    const r = await api<Consultation>(`/api/consultations/${id}`);
    if (r.status === 401) {
      router.push("/login");
      return;
    }
    if (r.ok) setC(r.data);
    else setError(r.error);
  }, [id, router]);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  // While waiting for the window to open, re-check every 30 seconds.
  useEffect(() => {
    if (c?.state !== "early") return;
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [c?.state, load]);

  const back = () => router.push("/dashboard");

  async function endConsultation() {
    const r = await api(`/api/consultations/${id}`, { method: "POST", body: { action: "end" } });
    if (r.ok) toast.success("Consultation marked as completed");
    else toast.error(r.error);
    back();
  }

  const onLeave = useCallback(() => setLeft(true), []);

  let body: React.ReactNode;
  if (error) {
    body = <Notice title="Cannot open this consultation" desc={error} onBack={back} />;
  } else if (!c) {
    body = (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  } else if (c.state === "ended") {
    body = <Notice title="This consultation has ended" desc="The video room is closed. Use Messages to follow up with your doctor." onBack={back} />;
  } else if (c.state === "early") {
    const m = c.opens_in_minutes;
    body = (
      <Notice
        icon={<CalendarClock className="h-7 w-7 text-primary" />}
        title="The room is not open yet"
        desc={`Your consultation is ${relativeDay(c.date).toLowerCase()}, ${formatDatePlain(c.date)} at ${formatTime(c.time)}. The room opens 15 minutes before the slot${m ? ` (in about ${m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`})` : ""}. This page refreshes automatically. Use the time to check your camera and microphone.`}
        onBack={back}
        action={
          <div className="flex w-full flex-col items-center gap-3">
            <DeviceCheck />
            <Button variant="ghost" onClick={back}>Back to dashboard</Button>
          </div>
        }
      />
    );
  } else if (left) {
    body = (
      <Notice
        title="You left the consultation"
        desc="You can rejoin while the session window is still open."
        onBack={back}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setLeft(false)}>Rejoin</Button>
            {c.role === "doctor" && c.status === "booked" && <Button onClick={endConsultation}>Mark completed</Button>}
          </div>
        }
      />
    );
  } else {
    body = <JitsiRoom cfg={c.jitsi!} displayName={c.me} subject={`BUK Clinic consultation — ${c.other_name}`} onLeave={onLeave} />;
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center gap-3 border-b bg-card px-4 py-3">
        <Button variant="ghost" size="sm" onClick={back} aria-label="Back to dashboard">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Dashboard
        </Button>
        <div className="hidden sm:block"><Logo /></div>
        <div className="ml-auto flex items-center gap-2 text-sm">
          <Video className="h-4 w-4 text-primary" />
          <span className="font-semibold">{c ? `Consultation with ${c.other_name}` : "Online consultation"}</span>
          <span className="hidden items-center gap-1 text-xs text-muted-foreground md:flex">
            <ShieldCheck className="h-3.5 w-3.5" /> Private room
          </span>
        </div>
      </header>
      {c?.state === "open" && !left && c.jitsi?.provider === "public" && (
        <p className="border-b bg-amber-50 px-4 py-2 text-center text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          {c.role === "doctor"
            ? "The public Jitsi server may ask you to sign in once to start the room. After you join, the student is admitted automatically or from the lobby."
            : "If you see a waiting message, the doctor has not started the room yet. You will be let in as soon as they join."}
        </p>
      )}
      <main className="min-h-0 flex-1 p-3 sm:p-4">{body}</main>
    </div>
  );
}

function Notice({ title, desc, onBack, icon, action }: { title: string; desc: string; onBack: () => void; icon?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center gap-3 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">{icon ?? <Video className="h-7 w-7 text-primary" />}</span>
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="text-sm text-muted-foreground">{desc}</p>
      {action ?? <Button onClick={onBack}>Back to dashboard</Button>}
    </div>
  );
}
