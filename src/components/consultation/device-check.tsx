"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Lets a user test their camera and microphone before the room opens. Nothing is recorded or sent anywhere. */
export function DeviceCheck() {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const raf = useRef(0);
  const ctx = useRef<AudioContext | null>(null);
  const [state, setState] = useState<"idle" | "on" | "denied">("idle");
  const [level, setLevel] = useState(0);

  const stop = useCallback(() => {
    cancelAnimationFrame(raf.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    ctx.current?.close().catch(() => {});
    ctx.current = null;
    setLevel(0);
    setState("idle");
  }, []);

  useEffect(() => () => {
    cancelAnimationFrame(raf.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    ctx.current?.close().catch(() => {});
  }, []);

  async function start() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.current = s;
      setState("on");
      requestAnimationFrame(() => {
        if (video.current) video.current.srcObject = s;
      });
      const ac = new AudioContext();
      ctx.current = ac;
      const analyser = ac.createAnalyser();
      analyser.fftSize = 256;
      ac.createMediaStreamSource(s).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let peak = 0;
        for (const v of data) peak = Math.max(peak, Math.abs(v - 128));
        setLevel(Math.min(100, Math.round((peak / 64) * 100)));
        raf.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      setState("denied");
    }
  }

  if (state === "idle" || state === "denied") {
    return (
      <div className="w-full space-y-2">
        <Button variant="outline" onClick={start}>
          <Camera className="mr-1.5 h-4 w-4" /> Test camera &amp; microphone
        </Button>
        {state === "denied" && (
          <p className="flex items-center justify-center gap-1.5 text-xs text-destructive">
            <CameraOff className="h-3.5 w-3.5" /> Access was blocked. Allow camera and microphone in the browser address bar, then try again.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full space-y-3 rounded-xl border bg-card p-3">
      <video ref={video} autoPlay muted playsInline className="aspect-video w-full rounded-lg bg-slate-950 object-cover [transform:scaleX(-1)]" />
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Mic className="h-4 w-4 text-primary" />
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted" role="meter" aria-label="Microphone level" aria-valuenow={level} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-primary transition-[width] duration-100" style={{ width: `${level}%` }} />
        </div>
        <span className="w-24 text-right">{level > 8 ? "Mic is working" : "Say something"}</span>
      </div>
      <Button variant="outline" size="sm" onClick={stop}>
        <Square className="mr-1.5 h-3.5 w-3.5" /> Stop test
      </Button>
    </div>
  );
}
