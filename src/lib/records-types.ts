// Shared (client + server safe) types for consultation records and prescriptions.

export interface RxItem {
  drug: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface ConsultationRecord {
  chief_complaint: string;
  history: string;
  allergies: string;
  bp: string;
  temperature: string;
  pulse: string;
  weight: string;
  examination: string;
  diagnosis: string;
  treatment_plan: string;
  advice: string;
  follow_up_date: string | null;
  private_notes: string;
}

export interface PrescriptionData {
  rx_no: string;
  items: RxItem[];
  instructions: string;
  sent_at: string | null;
  updated_at: string;
}

export type RecordAppointment = {
  id: number;
  date: string;
  time: string;
  mode: "in_person" | "online";
  status: "booked" | "completed" | "cancelled";
  reason: string | null;
  student_name: string;
  matric_no: string | null;
  student_phone: string | null;
  doctor_name: string;
  specialization: string | null;
}

/** Everything the formal prescription sheet shows. Never contains private notes. */
export interface PrescriptionDoc {
  appointment_id: number;
  rx_no: string;
  issued_at: string; // ISO timestamp (sent_at, or updated_at for a draft preview)
  consultation_date: string;
  patient_name: string;
  matric_no: string | null;
  doctor_name: string;
  specialization: string | null;
  allergies: string;
  diagnosis: string;
  items: RxItem[];
  instructions: string;
  advice: string;
  follow_up_date: string | null;
  draft: boolean;
}

export const EMPTY_RECORD: ConsultationRecord = {
  chief_complaint: "",
  history: "",
  allergies: "",
  bp: "",
  temperature: "",
  pulse: "",
  weight: "",
  examination: "",
  diagnosis: "",
  treatment_plan: "",
  advice: "",
  follow_up_date: null,
  private_notes: "",
};

export const EMPTY_ITEM: RxItem = { drug: "", dosage: "", frequency: "", duration: "", instructions: "" };
