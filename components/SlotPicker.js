"use client";
import { useEffect, useState } from "react";
import { api, todayISO } from "./api";

// Date + available time slots for one doctor. Calls onChange({date, time}).
export default function SlotPicker({ doctorId, onChange }) {
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState([]);
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTime("");
    onChange({ date, time: "" });
    if (!doctorId || !date) return setSlots([]);
    setLoading(true);
    api(`/api/doctors/slots?doctorId=${doctorId}&date=${date}`).then((r) => {
      setSlots(r.ok ? r.data.slots : []);
      setLoading(false);
    });
  }, [doctorId, date]);

  function choose(t) {
    setTime(t);
    onChange({ date, time: t });
  }

  return (
    <div>
      <label>Date</label>
      <input type="date" value={date} min={todayISO()} onChange={(e) => setDate(e.target.value)} />
      <label>Available times</label>
      {loading ? (
        <p className="muted">Checking availability...</p>
      ) : slots.length === 0 ? (
        <p className="muted">No free slots on this date. Try another day.</p>
      ) : (
        <div className="slots">
          {slots.map((s) => (
            <button type="button" key={s} className={"slot" + (time === s ? " sel" : "")} onClick={() => choose(s)}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
