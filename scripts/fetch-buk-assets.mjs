// Downloads BUK brand assets into public/brand/. Run: npm run assets
import { mkdir, writeFile } from "node:fs/promises";
const FILES = {
  "buk-logo.png": "https://buk.edu.ng/sites/default/files/inline-images/buk-logo.png",
  "buk-campus.jpg": "https://buk.edu.ng/sites/default/files/2020-12/DJI_00302.jpg",
};
await mkdir("public/brand", { recursive: true });
for (const [name, url] of Object.entries(FILES)) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.status + " " + res.statusText);
    await writeFile(`public/brand/${name}`, Buffer.from(await res.arrayBuffer()));
    console.log("saved", name);
  } catch (e) {
    console.warn("failed", name, String(e));
  }
}
