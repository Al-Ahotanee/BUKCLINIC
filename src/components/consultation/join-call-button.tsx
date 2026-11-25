"use client";

import { useRouter } from "next/navigation";
import { Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ModeBadge({ mode }: { mode?: string }) {
  if (mode !== "online") return null;
  return (
    <Badge variant="secondary" className="rounded-full bg-primary/10 font-semibold text-primary">
      <Video className="mr-1 h-3 w-3" /> Online
    </Badge>
  );
}

// Shown on booked online appointments. The call page enforces the time window and access.
export function JoinCallButton({ id, mode, status, className }: { id: number; mode?: string; status: string; className?: string }) {
  const router = useRouter();
  if (mode !== "online" || status !== "booked") return null;
  return (
    <Button size="sm" className={cn("bg-primary", className)} onClick={() => router.push(`/dashboard/call/${id}`)}>
      <Video className="mr-1.5 h-3.5 w-3.5" /> Join video call
    </Button>
  );
}
