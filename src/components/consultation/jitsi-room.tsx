"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

// Free public Jitsi server by default; override with NEXT_PUBLIC_JITSI_DOMAIN to self-host.
const DOMAIN = process.env.NEXT_PUBLIC_JITSI_DOMAIN || "meet.jit.si";

interface JitsiApi {
  dispose: () => void;
  addListener: (event: string, cb: (...args: unknown[]) => void) => void;
}
declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (domain: string, options: Record<string, unknown>) => JitsiApi;
  }
}

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.JitsiMeetExternalAPI) return resolve();
    const existing = document.getElementById("jitsi-external-api") as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("load")));
      return;
    }
    const s = document.createElement("script");
    s.id = "jitsi-external-api";
    s.src = `https://${DOMAIN}/external_api.js`;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("load"));
    document.body.appendChild(s);
  });
}

export function jitsiUrl(room: string) {
  return `https://${DOMAIN}/${room}`;
}

export function JitsiRoom({
  room,
  displayName,
  subject,
  onLeave,
}: {
  room: string;
  displayName: string;
  subject: string;
  onLeave?: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let api: JitsiApi | null = null;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !host.current || !window.JitsiMeetExternalAPI) return;
        api = new window.JitsiMeetExternalAPI(DOMAIN, {
          roomName: room,
          parentNode: host.current,
          width: "100%",
          height: "100%",
          userInfo: { displayName },
          configOverwrite: {
            subject,
            prejoinPageEnabled: false,
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            disableDeepLinking: true,
            disableInviteFunctions: true,
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_BRAND_WATERMARK: false,
            TOOLBAR_BUTTONS: ["microphone", "camera", "desktop", "chat", "raisehand", "tileview", "fullscreen", "settings", "hangup"],
          },
        });
        api.addListener("videoConferenceJoined", () => setStatus("ready"));
        api.addListener("readyToClose", () => onLeave?.());
        setTimeout(() => !cancelled && setStatus((s) => (s === "loading" ? "ready" : s)), 4000);
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
      api?.dispose();
    };
  }, [room, displayName, subject, onLeave]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-slate-950">
      <div ref={host} className="h-full w-full" />
      {status === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-300">
          <Loader2 className="h-7 w-7 animate-spin" />
          <p className="text-sm">Connecting to secure consultation room…</p>
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-slate-200">
          <p className="font-semibold">Could not load the video service.</p>
          <p className="text-sm text-slate-400">Check your connection, then reload. You can also open the room directly:</p>
          <a className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" href={jitsiUrl(room)} target="_blank" rel="noreferrer">
            Open in a new tab
          </a>
        </div>
      )}
    </div>
  );
}
