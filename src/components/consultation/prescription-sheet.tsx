"use client";

import { useEffect, useState } from "react";
import { Loader2, Printer } from "lucide-react";
import { api, formatDatePlain } from "@/lib/api";
import { BRAND } from "@/lib/brand";
import type { PrescriptionDoc } from "@/lib/records-types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BrandImage } from "@/components/site/brand-image";
import { CrestFallback } from "@/components/site/logo";

function issued(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", day: "numeric", month: "long", year: "numeric" }).format(d);
}

/** The formal clinic prescription form. Always light on white so it prints and saves to PDF cleanly. */
export function PrescriptionSheet({ doc }: { doc: PrescriptionDoc }) {
  return (
    <article className="rx-print-area relative mx-auto w-full max-w-[794px] overflow-hidden bg-white p-6 text-[13px] leading-relaxed text-slate-900 shadow-sm ring-1 ring-slate-200 sm:p-10" aria-label={`Prescription ${doc.rx_no}`}>
      {doc.draft && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <span className="-rotate-30 select-none text-6xl font-black tracking-widest text-slate-900/[0.06] sm:text-8xl">DRAFT</span>
        </div>
      )}

      {/* Letterhead */}
      <header className="flex items-start justify-between gap-4 border-b-4 border-[#0E8FAE] pb-4">
        <div className="flex items-center gap-3">
          <BrandImage
            sources={[BRAND.logoLocal, BRAND.logoRemote]}
            alt="Bayero University Kano crest"
            className="h-16 w-16 object-contain"
            fallback={<CrestFallback className="h-16 w-14" />}
          />
          <div className="leading-tight">
            <p className="text-lg font-extrabold uppercase tracking-wide text-[#0A5C73]">Bayero University, Kano</p>
            <p className="text-sm font-semibold text-slate-700">University Clinic</p>
            <p className="text-[11px] text-slate-500">{BRAND.motto}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-extrabold uppercase tracking-wider text-[#0E8FAE]">Prescription</p>
          <p className="mt-1 text-xs text-slate-500">Rx No.</p>
          <p className="font-mono text-sm font-bold">{doc.rx_no}</p>
        </div>
      </header>

      {/* Patient */}
      <section className="mt-5 grid gap-x-8 gap-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
        <Field label="Patient" value={doc.patient_name} />
        <Field label="Matric / ID No." value={doc.matric_no || "—"} />
        <Field label="Date of consultation" value={formatDatePlain(doc.consultation_date)} />
        <Field label="Date issued" value={issued(doc.issued_at)} />
        <div className="sm:col-span-2">
          <Field label="Known allergies" value={doc.allergies || "None reported"} />
        </div>
      </section>

      {/* Diagnosis */}
      <section className="mt-5">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#0A5C73]">Diagnosis</h3>
        <p className="mt-1 whitespace-pre-wrap font-medium">{doc.diagnosis || "—"}</p>
      </section>

      {/* Medicines */}
      <section className="mt-5">
        <div className="flex items-baseline gap-3">
          <span className="font-serif text-4xl font-bold leading-none text-[#0E8FAE]" aria-hidden="true">℞</span>
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#0A5C73]">Medication</h3>
        </div>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-[12.5px]">
            <thead>
              <tr className="bg-[#0E8FAE] text-white">
                <th className="w-8 px-2 py-1.5 font-semibold">#</th>
                <th className="px-2 py-1.5 font-semibold">Medicine</th>
                <th className="px-2 py-1.5 font-semibold">Dose</th>
                <th className="px-2 py-1.5 font-semibold">Frequency</th>
                <th className="px-2 py-1.5 font-semibold">Duration</th>
              </tr>
            </thead>
            <tbody>
              {doc.items.length === 0 && (
                <tr>
                  <td colSpan={5} className="border-b border-slate-200 px-2 py-3 text-slate-500">No medication prescribed.</td>
                </tr>
              )}
              {doc.items.map((it, i) => (
                <tr key={i} className="align-top odd:bg-white even:bg-slate-50">
                  <td className="border-b border-slate-200 px-2 py-2 text-slate-500">{i + 1}</td>
                  <td className="border-b border-slate-200 px-2 py-2">
                    <span className="font-semibold">{it.drug}</span>
                    {it.instructions && <span className="mt-0.5 block text-[11.5px] italic text-slate-600">{it.instructions}</span>}
                  </td>
                  <td className="border-b border-slate-200 px-2 py-2">{it.dosage || "—"}</td>
                  <td className="border-b border-slate-200 px-2 py-2">{it.frequency || "—"}</td>
                  <td className="border-b border-slate-200 px-2 py-2">{it.duration || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {(doc.instructions || doc.advice) && (
        <section className="mt-5 grid gap-4 sm:grid-cols-2">
          {doc.instructions && (
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#0A5C73]">Instructions</h3>
              <p className="mt-1 whitespace-pre-wrap">{doc.instructions}</p>
            </div>
          )}
          {doc.advice && (
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#0A5C73]">Advice</h3>
              <p className="mt-1 whitespace-pre-wrap">{doc.advice}</p>
            </div>
          )}
        </section>
      )}

      {doc.follow_up_date && (
        <p className="mt-5 rounded-lg border border-[#0E8FAE]/30 bg-[#0E8FAE]/5 px-4 py-2 font-medium">
          Follow-up visit: <span className="font-bold">{formatDatePlain(doc.follow_up_date)}</span>
        </p>
      )}

      {/* Signature */}
      <footer className="mt-10 flex flex-wrap items-end justify-between gap-6 border-t border-slate-300 pt-4">
        <p className="max-w-[320px] text-[11px] leading-snug text-slate-500">
          Issued electronically through the Bayero University Clinic appointment system. Take medicines exactly as directed
          and return to the clinic if symptoms persist or worsen.
        </p>
        <div className="min-w-[200px] text-center">
          <p className="font-[cursive] text-xl italic text-[#0A5C73]">{doc.doctor_name}</p>
          <div className="mt-1 border-t border-slate-700 pt-1">
            <p className="text-sm font-semibold">{doc.doctor_name}</p>
            <p className="text-[11px] text-slate-500">{doc.specialization || "Medical Officer"} · BUK Clinic</p>
          </div>
        </div>
      </footer>
    </article>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      <span className="font-semibold">{value}</span>
    </p>
  );
}

/** Dialog that loads a saved prescription (or shows a live `preview`) with Print / Save as PDF. */
export function PrescriptionDialog({
  appointmentId,
  preview,
  open,
  onOpenChange,
}: {
  appointmentId: number | null;
  preview?: PrescriptionDoc | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [doc, setDoc] = useState<PrescriptionDoc | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || preview || appointmentId == null) return;
    let live = true;
    api<{ prescription: PrescriptionDoc }>(`/api/prescriptions/${appointmentId}`).then((r) => {
      if (!live) return;
      if (r.ok) {
        setDoc(r.data.prescription);
        setError("");
      } else setError(r.error);
    });
    return () => {
      live = false;
    };
  }, [open, appointmentId, preview]);

  const shown = preview ?? doc;
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setDoc(null); setError(""); } onOpenChange(v); }}>
      <DialogContent className="rx-dialog max-h-[92vh] w-[96vw] max-w-[860px] overflow-y-auto bg-slate-100 p-3 dark:bg-slate-900 sm:p-5">
        <DialogHeader className="rx-hide-print">
          <DialogTitle>Prescription</DialogTitle>
          <DialogDescription>Use Print, then choose “Save as PDF” as the destination to keep a copy.</DialogDescription>
        </DialogHeader>
        <div className="rx-hide-print flex justify-end">
          <Button size="sm" disabled={!shown} onClick={() => window.print()}>
            <Printer className="mr-1.5 h-4 w-4" /> Print / Save as PDF
          </Button>
        </div>
        {shown ? (
          <PrescriptionSheet doc={shown} />
        ) : error ? (
          <p className="py-10 text-center text-sm text-destructive">{error}</p>
        ) : (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        )}
      </DialogContent>
    </Dialog>
  );
}
