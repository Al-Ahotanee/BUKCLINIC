import { cn } from "@/lib/utils";

/** Brand mark: caduceus-inspired cross inside a rounded shield. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={cn("h-9 w-9", className)} aria-hidden="true">
      <rect x="1.5" y="1.5" width="37" height="37" rx="11" className="fill-primary" />
      <path
        d="M20 9c4.5 1.8 8 2.2 8 2.2v9.1c0 5.6-4.3 9-8 10.7-3.7-1.7-8-5.1-8-10.7v-9.1S15.5 10.8 20 9Z"
        className="fill-primary-foreground/15"
      />
      <rect x="18.4" y="15" width="3.2" height="10" rx="1.2" className="fill-primary-foreground" />
      <rect x="15" y="18.4" width="10" height="3.2" rx="1.2" className="fill-primary-foreground" />
    </svg>
  );
}

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {!compact && (
        <span className="flex flex-col leading-tight">
          <span className="text-[15px] font-bold tracking-tight">Bayero University Clinic</span>
          <span className="text-[11px] font-medium text-muted-foreground">Bayero University Kano</span>
        </span>
      )}
    </span>
  );
}
