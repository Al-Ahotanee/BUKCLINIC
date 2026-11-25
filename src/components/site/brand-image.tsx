"use client";
import { useState } from "react";

/** <img> that walks a list of sources (local file → official remote) and renders `fallback` if all fail. */
export function BrandImage({
  sources,
  alt,
  className,
  fallback,
}: {
  sources: string[];
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}) {
  const [i, setI] = useState(0);
  if (i >= sources.length) return <>{fallback ?? null}</>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={sources[i]} alt={alt} className={className} loading="lazy" onError={() => setI((n) => n + 1)} />
  );
}
