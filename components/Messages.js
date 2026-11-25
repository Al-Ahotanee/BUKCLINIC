"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "./api";

export default function Messages({ onUnread }) {
  const [contacts, setContacts] = useState([]);
  const [active, setActive] = useState(null);
  const [thread, setThread] = useState([]);
  const [me, setMe] = useState(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const box = useRef(null);

  async function loadContacts() {
    const r = await api("/api/messages/contacts");
    if (r.ok) {
      setContacts(r.data.contacts);
      onUnread?.(r.data.contacts.reduce((n, c) => n + c.unread, 0));
    }
  }

  async function loadThread(id) {
    const r = await api(`/api/messages?with=${id}`);
    if (r.ok) {
      setThread(r.data.messages);
      setMe(r.data.me);
    }
  }

  useEffect(() => {
    loadContacts();
  }, []);

  // Light polling keeps the chat fresh without websockets (works on Vercel serverless)
  useEffect(() => {
    if (!active) return;
    loadThread(active.id);
    const t = setInterval(() => {
      loadThread(active.id);
      loadContacts();
    }, 8000);
    return () => clearInterval(t);
  }, [active?.id]);

  useEffect(() => {
    if (box.current) box.current.scrollTop = box.current.scrollHeight;
  }, [thread.length]);

  async function send(e) {
    e.preventDefault();
    if (!text.trim() || !active) return;
    setError("");
    const r = await api("/api/messages", { method: "POST", body: { to: active.id, body: text } });
    if (!r.ok) return setError(r.error);
    setText("");
    loadThread(active.id);
  }

  function pick(c) {
    setActive(c);
    setThread([]);
    setTimeout(loadContacts, 600);
  }

  return (
    <div className="chat">
      <div className="contacts">
        {contacts.length === 0 && <p className="muted">No contacts yet.</p>}
        {contacts.map((c) => (
          <button key={c.id} className={"contact" + (active?.id === c.id ? " active" : "")} onClick={() => pick(c)}>
            <b>{c.name}</b>
            {c.unread > 0 && <span className="badge dot">{c.unread}</span>}
            <div className="muted">{c.detail || ""}</div>
          </button>
        ))}
      </div>
      <div>
        {!active ? (
          <p className="muted">Select someone to start a conversation.</p>
        ) : (
          <>
            <h3>{active.name}</h3>
            <div className="thread" ref={box}>
              {thread.length === 0 && <span className="muted">No messages yet. Say hello.</span>}
              {thread.map((m) => (
                <div key={m.id} className={"bubble " + (m.sender_id === me ? "me" : "them")}>
                  {m.body}
                  <small>{new Date(m.created_at).toLocaleString("en-NG", { timeZone: "Africa/Lagos", dateStyle: "short", timeStyle: "short" })}</small>
                </div>
              ))}
            </div>
            <form onSubmit={send} className="row" style={{ marginTop: ".5rem", flexWrap: "nowrap" }}>
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message" maxLength={2000} />
              <button className="btn">Send</button>
            </form>
            {error && <div className="msg-error">{error}</div>}
            <p className="muted">Do not use messaging for emergencies.</p>
          </>
        )}
      </div>
    </div>
  );
}
