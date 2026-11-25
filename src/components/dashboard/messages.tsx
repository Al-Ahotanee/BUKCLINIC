"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, MessageSquareText, SendHorizonal } from "lucide-react";
import { api, initials, type ChatMessage, type Contact } from "@/lib/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function timeLabel(iso: string) {
  return new Date(iso).toLocaleString("en-NG", { timeZone: "Africa/Lagos", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

/**
 * One-to-one messaging between students and doctors.
 * Light polling keeps the thread fresh — works on Vercel serverless.
 */
export function Messages({ onUnread }: { onUnread?: (n: number) => void }) {
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [active, setActive] = useState<Contact | null>(null);
  const [thread, setThread] = useState<ChatMessage[]>([]);
  const [me, setMe] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const onUnreadRef = useRef(onUnread);
  useEffect(() => {
    onUnreadRef.current = onUnread;
  }, [onUnread]);

  const loadContacts = useCallback(() => {
    api<{ contacts: Contact[] }>("/api/messages/contacts").then((r) => {
      if (r.ok) {
        setContacts(r.data.contacts);
        onUnreadRef.current?.(r.data.contacts.reduce((n, c) => n + c.unread, 0));
      }
    });
  }, []);

  const loadThread = useCallback((id: number) => {
    api<{ messages: ChatMessage[]; me: number }>(`/api/messages?with=${id}`).then((r) => {
      if (r.ok) {
        setThread(r.data.messages);
        setMe(r.data.me);
      }
    });
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    if (!active) return;
    const id = active.id;
    loadThread(id);
    const t = setInterval(() => {
      loadThread(id);
      loadContacts();
    }, 8000);
    return () => clearInterval(t);
  }, [active?.id, loadThread, loadContacts]);

  useEffect(() => {
    if (box.current) box.current.scrollTop = box.current.scrollHeight;
  }, [thread.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !active) return;
    setError("");
    setSending(true);
    const r = await api("/api/messages", { method: "POST", body: { to: active.id, body: text } });
    setSending(false);
    if (!r.ok) return setError(r.error);
    setText("");
    loadThread(active.id);
    loadContacts();
  }

  function pick(c: Contact) {
    setActive(c);
    setThread([]);
    setTimeout(loadContacts, 600);
  }

  if (contacts === null) {
    return (
      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[420px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-[280px_1fr]">
      {/* Contacts */}
      <div
        className={cn(
          "rounded-xl border bg-card p-2",
          active && "hidden md:block"
        )}
      >
        <p className="px-2.5 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Conversations</p>
        {contacts.length === 0 ? (
          <p className="px-2.5 pb-3 text-sm text-muted-foreground">No contacts yet. Book an appointment to connect with a doctor.</p>
        ) : (
          <div className="flex max-h-[430px] flex-col gap-1 overflow-y-auto scroll-slim">
            {contacts.map((c) => (
              <button
                key={c.id}
                onClick={() => pick(c)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors",
                  active?.id === c.id ? "bg-accent" : "hover:bg-accent/60"
                )}
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">{initials(c.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{c.name}</p>
                    {c.unread > 0 && (
                      <Badge className="h-5 min-w-5 rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                        {c.unread}
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{c.detail || "—"}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Thread */}
      <div className="flex min-h-[460px] flex-col rounded-xl border bg-card">
        {!active ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <MessageSquareText className="h-6 w-6 text-primary" />
            </span>
            <p className="font-semibold">Select someone to start a conversation</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Messages are private and one-to-one. Do not use messaging for emergencies.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b px-4 py-3">
              <button className="text-sm font-medium text-primary md:hidden" onClick={() => setActive(null)} aria-label="Back to contacts">
                ←
              </button>
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">{initials(active.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{active.name}</p>
                <p className="truncate text-xs text-muted-foreground">{active.detail || ""}</p>
              </div>
            </div>

            <div ref={box} className="scroll-slim flex h-[360px] flex-1 flex-col gap-2.5 overflow-y-auto bg-muted/20 p-4">
              {thread.length === 0 && (
                <p className="mx-auto my-auto text-sm text-muted-foreground">No messages yet. Say hello.</p>
              )}
              {thread.map((m) => {
                const mine = m.sender_id === me;
                return (
                  <div
                    key={m.id}
                    className={cn(
                      "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm",
                      mine
                        ? "self-end rounded-br-md bg-primary text-primary-foreground"
                        : "self-start rounded-bl-md border bg-card"
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <p className={cn("mt-1 text-[10px]", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                      {timeLabel(m.created_at)}
                    </p>
                  </div>
                );
              })}
            </div>

            <form onSubmit={send} className="flex gap-2 border-t p-3">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message…"
                maxLength={2000}
                className="h-11 flex-1"
                aria-label="Message"
              />
              <Button type="submit" size="icon" className="h-11 w-11 shrink-0" disabled={sending || !text.trim()} aria-label="Send message">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
              </Button>
            </form>
            {error && <p className="px-3 pb-2 text-sm font-medium text-destructive">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
