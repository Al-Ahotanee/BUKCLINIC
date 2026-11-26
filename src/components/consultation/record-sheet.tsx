"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Loader2, Plus, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, formatDatePlain, formatTime } from "@/lib/api";
import {
  EMPTY_ITEM,
  EMPTY_RECORD,
  type ConsultationRecord,
  type PrescriptionData,
  type PrescriptionDoc,
  type RecordAppointment,
  type RxItem,
} from "@/lib/records-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PrescriptionDialog } from "./prescription-sheet";

const COMMON_DRUGS = ["Paracetamol", "Ibuprofen", "Amoxicillin", "Artemether/Lumefantrine", "Metronidazole", "Cetirizine", "Omeprazole", "Oral rehydration salts", "Vitamin C", "Multivitamin"];
const FREQUENCIES = ["Once daily", "Twice daily", "Three times daily", "Every 8 hours", "At night", "When needed"];
const DURATIONS = ["3 days", "5 days", "7 days", "14 days", "Until finished"];

interface Loaded {
  appointment: RecordAppointment;
  record: ConsultationRecord | null;
  prescription: PrescriptionData | null;
}

/** Doctor's consultation record: history and examination, diagnosis and plan, prescription. */
export function RecordSheet({ appointmentId, open, onOpenChange, onSaved }: { appointmentId: number | null; open: boolean; onOpenChange: (v: boolean) => void; onSaved?: () => void }) {
  const [appt, setAppt] = useState<RecordAppointment | null>(null);
  const [rec, setRec] = useState<ConsultationRecord>(EMPTY_RECORD);
  const [items, setItems] = useState<RxItem[]>([{ ...EMPTY_ITEM }]);
  const [rxNotes, setRxNotes] = useState("");
  const [sentAt, setSentAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<"" | "save" | "send">("");
  const [complete, setComplete] = useState(true);
  const [preview, setPreview] = useState<PrescriptionDoc | null>(null);
  const close = useRef(onOpenChange);
  useEffect(() => {
    close.current = onOpenChange;
  });

  useEffect(() => {
    if (!open || appointmentId == null) return;
    let live = true;
    // Defer the state reset so it does not run synchronously inside the effect.
    const t = setTimeout(() => {
      setLoading(true);
      api<Loaded>(`/api/records/${appointmentId}`).then((r) => {
        if (!live) return;
        setLoading(false);
        if (!r.ok) {
          toast.error(r.error);
          close.current(false);
          return;
        }
        setAppt(r.data.appointment);
        setRec(r.data.record ?? EMPTY_RECORD);
        setItems(r.data.prescription?.items.length ? r.data.prescription.items : [{ ...EMPTY_ITEM }]);
        setRxNotes(r.data.prescription?.instructions ?? "");
        setSentAt(r.data.prescription?.sent_at ?? null);
        setComplete(r.data.appointment.status === "booked");
      });
    }, 0);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [open, appointmentId]);

  const set = <K extends keyof ConsultationRecord>(k: K, v: ConsultationRecord[K]) => setRec((r) => ({ ...r, [k]: v }));
  const setItem = (i: number, k: keyof RxItem, v: string) => setItems((xs) => xs.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const filled = useMemo(() => items.filter((i) => i.drug.trim()), [items]);

  async function save(send: boolean) {
    if (appointmentId == null) return;
    setSaving(send ? "send" : "save");
    const r = await api<{ justSent: boolean; prescription: PrescriptionData | null }>(`/api/records/${appointmentId}`, {
      method: "PUT",
      body: { record: rec, prescription: { items: filled, instructions: rxNotes }, send, complete: complete && appt?.status === "booked" },
    });
    setSaving("");
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    setSentAt(r.data.prescription?.sent_at ?? null);
    toast.success(send ? (r.data.justSent ? "Prescription sent to the patient" : "Prescription updated for the patient") : "Consultation record saved");
    onSaved?.();
    if (send) onOpenChange(false);
  }

  function openPreview() {
    if (!appt) return;
    setPreview({
      appointment_id: appt.id,
      rx_no: "Draft",
      issued_at: new Date().toISOString(),
      consultation_date: appt.date,
      patient_name: appt.student_name,
      matric_no: appt.matric_no,
      doctor_name: appt.doctor_name,
      specialization: appt.specialization,
      allergies: rec.allergies,
      diagnosis: rec.diagnosis,
      items: filled,
      instructions: rxNotes,
      advice: rec.advice,
      follow_up_date: rec.follow_up_date,
      draft: true,
    });
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl">
          <SheetHeader className="border-b p-5">
            <SheetTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Consultation record</SheetTitle>
            <SheetDescription>
              {appt ? `${appt.student_name}${appt.matric_no ? ` · ${appt.matric_no}` : ""} — ${formatDatePlain(appt.date)}, ${formatTime(appt.time)}${appt.reason ? ` · “${appt.reason}”` : ""}` : "Loading…"}
            </SheetDescription>
          </SheetHeader>

          {loading || !appt ? (
            <div className="flex flex-1 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <Tabs defaultValue="consultation" className="flex min-h-0 flex-1 flex-col">
              <TabsList className="mx-5 mt-4 grid grid-cols-3">
                <TabsTrigger value="consultation">Consultation</TabsTrigger>
                <TabsTrigger value="diagnosis">Diagnosis &amp; plan</TabsTrigger>
                <TabsTrigger value="prescription">Prescription{filled.length ? ` (${filled.length})` : ""}</TabsTrigger>
              </TabsList>

              <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-5 pb-4">
                <TabsContent value="consultation" className="space-y-4 pt-4">
                  <Area label="Presenting complaint" value={rec.chief_complaint} onChange={(v) => set("chief_complaint", v)} placeholder="What the patient is complaining of, and for how long" />
                  <Area label="History" value={rec.history} onChange={(v) => set("history", v)} placeholder="History of the complaint, relevant past history, medications" />
                  <Area label="Known allergies" value={rec.allergies} onChange={(v) => set("allergies", v)} rows={2} placeholder="e.g. Penicillin. Leave blank if none reported" />
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Small label="BP (mmHg)" value={rec.bp} onChange={(v) => set("bp", v)} placeholder="120/80" />
                    <Small label="Temp (°C)" value={rec.temperature} onChange={(v) => set("temperature", v)} placeholder="36.8" />
                    <Small label="Pulse (bpm)" value={rec.pulse} onChange={(v) => set("pulse", v)} placeholder="72" />
                    <Small label="Weight (kg)" value={rec.weight} onChange={(v) => set("weight", v)} placeholder="65" />
                  </div>
                  <Area label="Examination findings" value={rec.examination} onChange={(v) => set("examination", v)} />
                </TabsContent>

                <TabsContent value="diagnosis" className="space-y-4 pt-4">
                  <Area label="Diagnosis" value={rec.diagnosis} onChange={(v) => set("diagnosis", v)} rows={3} placeholder="Required before a prescription can be sent. Shown on the prescription." />
                  <Area label="Treatment plan" value={rec.treatment_plan} onChange={(v) => set("treatment_plan", v)} />
                  <Area label="Advice to patient" value={rec.advice} onChange={(v) => set("advice", v)} rows={3} placeholder="Rest, fluids, diet, warning signs. Shown on the prescription." />
                  <div className="max-w-xs space-y-1.5">
                    <Label htmlFor="fu">Follow-up date</Label>
                    <Input id="fu" type="date" value={rec.follow_up_date ?? ""} onChange={(e) => set("follow_up_date", e.target.value || null)} />
                  </div>
                  <Area label="Private notes (only you can see these)" value={rec.private_notes} onChange={(v) => set("private_notes", v)} />
                </TabsContent>

                <TabsContent value="prescription" className="space-y-4 pt-4">
                  <datalist id="rx-drugs">{COMMON_DRUGS.map((d) => <option key={d} value={d} />)}</datalist>
                  <datalist id="rx-freq">{FREQUENCIES.map((d) => <option key={d} value={d} />)}</datalist>
                  <datalist id="rx-dur">{DURATIONS.map((d) => <option key={d} value={d} />)}</datalist>
                  {items.map((it, i) => (
                    <div key={i} className="space-y-2 rounded-xl border bg-card p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">Medicine {i + 1}</span>
                        {items.length > 1 && (
                          <Button type="button" variant="ghost" size="sm" aria-label={`Remove medicine ${i + 1}`} onClick={() => setItems((xs) => xs.filter((_, j) => j !== i))}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <Input list="rx-drugs" placeholder="Medicine name and strength, e.g. Amoxicillin 500 mg capsule" value={it.drug} onChange={(e) => setItem(i, "drug", e.target.value)} aria-label="Medicine" />
                      <div className="grid gap-2 sm:grid-cols-3">
                        <Input placeholder="Dose, e.g. 1 capsule" value={it.dosage} onChange={(e) => setItem(i, "dosage", e.target.value)} aria-label="Dose" />
                        <Input list="rx-freq" placeholder="Frequency" value={it.frequency} onChange={(e) => setItem(i, "frequency", e.target.value)} aria-label="Frequency" />
                        <Input list="rx-dur" placeholder="Duration" value={it.duration} onChange={(e) => setItem(i, "duration", e.target.value)} aria-label="Duration" />
                      </div>
                      <Input placeholder="Special instructions (optional), e.g. after meals" value={it.instructions} onChange={(e) => setItem(i, "instructions", e.target.value)} aria-label="Special instructions" />
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" disabled={items.length >= 20} onClick={() => setItems((xs) => [...xs, { ...EMPTY_ITEM }])}>
                    <Plus className="mr-1.5 h-4 w-4" /> Add medicine
                  </Button>
                  <Area label="General instructions on the prescription" value={rxNotes} onChange={setRxNotes} rows={3} placeholder="Optional" />
                  <p className="text-xs text-muted-foreground">
                    {sentAt ? "This prescription has been sent. Sending again updates what the patient sees." : "The patient cannot see the prescription until you send it."}
                  </p>
                </TabsContent>
              </div>
            </Tabs>
          )}

          <SheetFooter className="gap-3 border-t p-4 sm:flex-col">
            {appt?.status === "booked" && (
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={complete} onCheckedChange={(v) => setComplete(v === true)} /> Mark this visit as completed when I save
              </label>
            )}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={!appt || !!saving} onClick={openPreview}>Preview prescription</Button>
              <Button variant="outline" disabled={!appt || !!saving} onClick={() => save(false)}>
                {saving === "save" && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Save record
              </Button>
              <Button disabled={!appt || !!saving} onClick={() => save(true)} className="sm:ml-auto">
                {saving === "send" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />}
                {sentAt ? "Save & update prescription" : "Save & send prescription"}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <PrescriptionDialog appointmentId={appointmentId} preview={preview} open={!!preview} onOpenChange={(v) => !v && setPreview(null)} />
    </>
  );
}

function Area({ label, value, onChange, rows = 4, placeholder }: { label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  const id = `f-${label.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Small({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const id = `f-${label.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <Input id={id} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
