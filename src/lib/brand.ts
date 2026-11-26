/** BUK brand constants. Official university colour: Turquoise Blue (BUK Communication Policy §5.14). */
export const BRAND = {
  name: "Bayero University Clinic",
  university: "Bayero University, Kano",
  motto: "To lead in research and education in Africa",
  // Official images live in /public/brand; the .svg files are fallbacks if a file ever fails to load.
  logoLocal: "/brand/buk-logo.png",
  logoRemote: "/brand/buk-logo.svg",
  // Aerial campus shot (has the university name baked in, so it is only used as a faint background).
  heroLocal: "/brand/buk-campus-aerial.jpg",
  heroRemote: "/brand/buk-campus.svg",
  // Clean photo of the main building, used where the image is shown at full strength.
  bandLocal: "/brand/buk-campus-building.jpg",
  bandRemote: "/brand/buk-campus.svg",
  turquoise: "#0E8FAE",
  turquoiseDeep: "#0A5C73",
} as const;
