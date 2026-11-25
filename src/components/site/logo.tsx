import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";
import { BrandImage } from "./brand-image";

/** Inline shield + crescent + star fallback in BUK turquoise (used when the official crest cannot load). */
export function CrestFallback({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 46" fill="none" className={cn("h-10 w-9", className)} aria-hidden="true">
      <path d="M20 2 36 7v16c0 10-7 17-16 21C11 40 4 33 4 23V7l16-5Z" className="fill-primary" />
      <path d="M26 14a8 8 0 1 0 0 14 6.5 6.5 0 1 1 0-14Z" fill="#fff" />
      <path d="m27 18 1.2 2.6 2.8.3-2.1 1.9.6 2.8L27 24.1l-2.5 1.5.6-2.8-2.1-1.9 2.8-.3L27 18Z" fill="#fff" />
    </svg>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <BrandImage
      sources={[BRAND.logoLocal, BRAND.logoRemote]}
      alt="Bayero University Kano crest"
      className={cn("h-10 w-auto object-contain", className)}
      fallback={<CrestFallback className={className} />}
    />
  );
}

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {!compact && (
        <span className="flex flex-col leading-tight">
          <span className="text-[15px] font-bold tracking-tight">Bayero University Clinic</span>
          <span className="text-[11px] font-medium text-muted-foreground">Bayero University, Kano</span>
        </span>
      )}
    </span>
  );
}
