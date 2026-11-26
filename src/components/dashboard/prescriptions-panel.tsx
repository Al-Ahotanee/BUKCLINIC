"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Pill, Printer } from "lucide-react";
import { api, formatDatePlain } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { PrescriptionDialog } from "@/components/consultation/prescription-sheet";
import { EmptyState } from "./stat-card";

interface Item {
  appointment_id: number;
  rx_no: string;
  date: string;
  doctor_name: string;
  diagnosis: string;
  item_count: number;
  sent_at: string | null;
}

/** Student: prescriptions the doctor has sent, each opening as the formal clinic prescription form. */
export function PrescriptionsPanel() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    api<{ prescriptions: Item[] }>("/api/prescriptions").then((r) => setItems(r.ok ? r.data.prescriptions : []));
  }, []);

  if (items === null) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Prescriptions your doctor has sent you after a consultation. Open one to read it, print it or save it as a PDF.</p>
      {items.length === 0 ? (
        <EmptyState icon={Pill} title="No prescriptions yet" desc="When a doctor sends you a prescription after your consultation, it will appear here." />
      ) : (
        <div className="space-y-3">
          {items.map((p) => (
            <button
              key={p.appointment_id}
              type="button"
              onClick={() => setOpen(p.appointment_id)}
              className="flex w-full items-center gap-4 rounded-xl border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-serif text-2xl font-bold text-primary" aria-hidden="true">℞</span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                  <span className="font-semibold">{p.diagnosis || "Prescription"}</span>
                  <span className="font-mono text-xs text-muted-foreground">{p.rx_no}</span>
                </span>
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  {p.doctor_name} · {formatDatePlain(p.date)} · {p.item_count} {p.item_count === 1 ? "medicine" : "medicines"}
                </span>
              </span>
              <span className="hidden items-center gap-1 text-sm font-medium text-primary sm:flex">
                <Printer className="h-4 w-4" /> View
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}
      <PrescriptionDialog appointmentId={open} open={open !== null} onOpenChange={(v) => !v && setOpen(null)} />
    </div>
  );
}
