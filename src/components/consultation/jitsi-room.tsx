"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

export interface JitsiCfg {
  provider: "jaas" | "public";
  domain: string;
  scriptSrc: string;
  roomName: string;
  jwt: string | null;
}

interface JitsiApi {
  dispose: () => void;
  addListener: (event: string, cb: (...args: unknown[]) => void) => void;
}
declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (domain: string, options: Record<string, unknown>) => JitsiApi;
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.JitsiMeetExternalAPI && document.querySelector(`script[data-jitsi="${src}"]`)) return resolve();
    // A different provider's script defines the same global: drop it before loading ours.
    document.querySelectorAll("script[data-jitsi]").forEach((n) => n.remove());
    window.JitsiMeetExternalAPI = undefined;
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.dataset.jitsi = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("load"));
    document.body.appendChild(s);
  });
}

function directUrl(cfg: JitsiCfg) {
  return `https://${cfg.domain}/${cfg.roomName}${cfg.jwt ? `?jwt=${cfg.jwt}` : ""}`;
}

export function JitsiRoom({ cfg, displayName, subject, onLeave }: { cfg: JitsiCfg; displayName: string; subject: string; onLeave?: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let api: JitsiApi | null = null;
    let cancelled = false;
    loadScript(cfg.scriptSrc)
      .then(() => {
        if (cancelled || !host.current || !window.JitsiMeetExternalAPI) return;
        api = new window.JitsiMeetExternalAPI(cfg.domain, {
          roomName: cfg.roomName,
          parentNode: host.current,
          width: "100%",
          height: "100%",
          ...(cfg.jwt ? { jwt: cfg.jwt } : {}),
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
  }, [cfg, displayName, subject, onLeave]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-slate-950">
      <div ref={host} className="h-full w-full" />
      {status === "loading" && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-300">
          <Loader2 className="h-7 w-7 animate-spin" />
          <p className="text-sm">Connecting to secure consultation room…</p>
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-slate-200">
          <p className="font-semibold">Could not load the video service.</p>
          <p className="text-sm text-slate-400">Check your connection, then reload. You can also open the room directly:</p>
          <a className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" href={directUrl(cfg)} target="_blank" rel="noreferrer">
            Open in a new tab
          </a>
        </div>
      )}
    </div>
  );
}
