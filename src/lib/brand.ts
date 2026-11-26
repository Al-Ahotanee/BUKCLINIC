/** BUK brand constants. Official university colour: Turquoise Blue (BUK Communication Policy §5.14). */
export const BRAND = {
  name: "Bayero University Clinic",
  university: "Bayero University, Kano",
  motto: "To lead in research and education in Africa",
  // Files live in /public/brand. To use the official artwork, drop buk-logo.png / buk-campus.jpg there and
  // point these four constants at them (the .svg files are the built-in, always-available versions).
  logoLocal: "/brand/buk-logo.svg",
  logoRemote: "/brand/buk-logo.svg",
  heroLocal: "/brand/buk-campus.svg",
  heroRemote: "/brand/buk-campus.svg",
  turquoise: "#0E8FAE",
  turquoiseDeep: "#0A5C73",
} as const;
