// Small fetch helper: returns { ok, data, error }
export async function api(path, options = {}) {
  try {
    const res = await fetch(path, {
      method: options.method || "GET",
      headers: options.body ? { "Content-Type": "application/json" } : undefined,
      body: options.body ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, status: res.status, error: data.error || "Something went wrong", data };
    return { ok: true, data };
  } catch {
    return { ok: false, error: "Network error. Check your connection." };
  }
}

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function todayISO() {
  // Date string in Africa/Lagos
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date());
}
