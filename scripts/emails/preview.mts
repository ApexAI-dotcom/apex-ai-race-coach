/**
 * Aperçu des mails ApexAI : rend chaque mail en HTML, puis en captures
 * (clair / sombre, téléphone / ordinateur) avec Playwright.
 *
 *   node --experimental-strip-types scripts/emails/preview.mts <dossier_sortie>
 *
 * Les visuels d'en-tête sont lus dans public/email/ (pas besoin du site en ligne).
 */
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { renderEmail, type EmailKind, LIFECYCLE_KINDS } from "../../supabase/functions/_shared/emails.ts";

const out = resolve(process.argv[2] || "email-previews");
mkdirSync(out, { recursive: true });
const pub = resolve("public/email");
const local = (html: string) =>
  html.replace(/https:\/\/www\.apexai\.racing\/email\/([a-z0-9.-]+)/g, (_m, f) =>
    `data:image/${f.endsWith(".png") ? "png" : "jpeg"};base64,${readFileSync(join(pub, f)).toString("base64")}`,
  );

const data = {
  name: "Léo",
  url: "https://www.apexai.racing/auth/confirm?token_hash=exemple",
  unsubscribeUrl: "https://www.apexai.racing/desinscription?t=exemple",
  analysisUrl: "https://www.apexai.racing/analysis/exemple",
  circuit: "Ancenis",
  until: "21 novembre",
  structure: "[Nom de l'école]",
  email: "pilote@exemple.fr",
  when: "18 novembre à 9 h 12",
  device: "Safari sur iPhone",
};
const kinds: EmailKind[] = [...LIFECYCLE_KINDS, "signup", "new_device"];
const files: string[] = [];
for (const k of kinds) {
  const m = renderEmail(k, data);
  const f = join(out, `${k}.html`);
  writeFileSync(f, local(m.html));
  writeFileSync(join(out, `${k}.txt`), `${m.subject}\n\n${m.text}`);
  files.push(f);
}

// Playwright peut être installé globalement : on le charge par require.
const { createRequire } = await import("node:module");
const { chromium } = createRequire(import.meta.url)("playwright");
const b = await chromium.launch();
for (const scheme of ["dark", "light"] as const) {
  for (const [vp, w] of [["mobile", 390], ["desktop", 900]] as const) {
    const p = await b.newPage({ viewport: { width: w, height: 900 }, colorScheme: scheme, deviceScaleFactor: 1 });
    for (const f of files) {
      await p.goto("file://" + f);
      await p.waitForTimeout(250);
      await p.screenshot({ path: f.replace(".html", `__${scheme}_${vp}.jpg`), fullPage: true, type: "jpeg", quality: 80 });
    }
    await p.close();
  }
}
await b.close();
console.log(`${files.length} mails rendus dans ${out}`);
