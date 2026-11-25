"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, MoonStar, SunMedium } from "lucide-react";
import { api, addDaysISO, DAY_SHORT, formatDatePlain, formatDateShort, formatTime, relativeDay, todayISO } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

function SlotGroup({
  label,
  icon: Icon,
  times,
  selected,
  onSelect,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  times: string[];
  selected: string;
  onSelect: (t: string) => void;
}) {
  if (times.length === 0) return null;
  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {times.map((s) => (
          <button
            type="button"
            key={s}
            onClick={() => onSelect(s)}
            className={cn(
              "rounded-lg border px-3 py-2 text-sm font-medium transition-all",
              selected === s
                ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25"
                : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-accent"
            )}
          >
            {formatTime(s)}
          </button>
        ))}
      </div>
    </div>
  );
}

function DateChip({ d, selected, onSelect }: { d: string; selected: boolean; onSelect: () => void }) {
  const weekday = new Date(d + "T00:00:00Z").getUTCDay();
  const rel = relativeDay(d);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-[74px] shrink-0 flex-col items-center rounded-xl border px-2 py-2.5 transition-all",
        selected
          ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25"
          : "border-border bg-card hover:border-primary/50 hover:bg-accent"
      )}
    >
      <span className={cn("text-[11px] font-medium", selected ? "text-primary-foreground/80" : "text-muted-foreground")}>
        {rel === "Today" || rel === "Tomorrow" ? rel : DAY_SHORT[weekday]}
      </span>
      <span className="text-sm font-bold">{formatDateShort(d)}</span>
    </button>
  );
}

/**
 * Date + available time slots for one doctor.
 * Date chips cover the next 14 days; slots are grouped into morning / afternoon.
 */
export function SlotPicker({
  doctorId,
  onChange,
  compact = false,
}: {
  doctorId: number;
  onChange: (pick: { date: string; time: string }) => void;
  compact?: boolean;
}) {
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("");
  const [slotsByKey, setSlotsByKey] = useState<Record<string, string[]>>({});
  const slotKey = `${doctorId}|${date}`;
  const loading = slotsByKey[slotKey] === undefined;
  const slots = slotsByKey[slotKey] ?? [];
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (slotsByKey[slotKey] !== undefined) return;
    api<{ slots: string[] }>(`/api/doctors/slots?doctorId=${doctorId}&date=${date}`).then((r) => {
      setSlotsByKey((prev) => ({ ...prev, [slotKey]: r.ok ? r.data.slots : [] }));
    });
  }, [doctorId, date, slotKey, slotsByKey]);

  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => addDaysISO(todayISO(), i)), []);
  const morning = slots.filter((t) => Number(t.split(":")[0]) < 12);
  const afternoon = slots.filter((t) => Number(t.split(":")[0]) >= 12);

  function selectDate(d: string) {
    setDate(d);
    setTime("");
    onChangeRef.current({ date: d, time: "" });
  }
  function selectTime(t: string) {
    setTime(t);
    onChangeRef.current({ date, time: t });
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" /> Pick a date
        </p>
        <div className={cn("scroll-slim flex gap-2 overflow-x-auto pb-2", compact && "max-w-full")}>
          {days.map((d) => (
            <DateChip key={d} d={d} selected={date === d} onSelect={() => selectDate(d)} />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-muted-foreground">Available times</p>
        {loading ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-20 rounded-lg" />
            ))}
          </div>
        ) : slots.length === 0 ? (
          <p className="rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            No free slots on this date — try another day.
          </p>
        ) : (
          <div className="space-y-4">
            <SlotGroup label="Morning" icon={SunMedium} times={morning} selected={time} onSelect={selectTime} />
            <SlotGroup label="Afternoon" icon={MoonStar} times={afternoon} selected={time} onSelect={selectTime} />
          </div>
        )}
      </div>

      {time && (
        <p className="text-sm text-muted-foreground">
          Selected: <span className="font-semibold text-foreground">{relativeDay(date)}, {formatDatePlain(date)} at {formatTime(time)}</span>
        </p>
      )}
    </div>
  );
}
