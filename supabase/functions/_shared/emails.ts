/**
 * Mails d'ApexAI — un seul gabarit, à la charte de l'app (fond noir, rouge
 * ApexAI, Space Grotesk / Inter), et un contenu par type de mail.
 *
 * Aucune dépendance : ce module est utilisé tel quel par les Edge Functions
 * (Deno) et par le script d'aperçu (Node). Le HTML suit les règles des
 * clients mail : tableaux, styles en ligne, largeur fixe de 560 px, polices
 * de secours, et une version texte pour chaque mail.
 *
 * Ton : tutoiement, phrases courtes, aucun chiffre inventé.
 */

export const BRAND = {
  site: "https://www.apexai.racing",
  icon: "https://www.apexai.racing/email/apexai-icon.png",
  contact: "contact@apexai.racing",
  bg: "#0A0A0A",
  card: "#121212",
  inner: "#181818",
  border: "#262626",
  text: "#FAFAFA",
  body: "#BDBDBD",
  muted: "#8A8A8A",
  dim: "#666666",
  primary: "#FF4242",
  primaryDeep: "#E60000",
  orange: "#F97316",
  success: "#22C55E",
  /** Fond autour de la carte en mode clair (la carte reste noire : c'est la marque). */
  lightBg: "#EDEDED",
};

/** Visuels d'en-tête (1200×600, hébergés sur le site, coin coupé en diagonale). */
export const HEROES = {
  upload: `https://www.apexai.racing/email/hero-upload.jpg`,
  monkart: `https://www.apexai.racing/email/hero-monkart.jpg`,
  trace: `https://www.apexai.racing/email/hero-trace.jpg`,
  setup: `https://www.apexai.racing/email/hero-setup.jpg`,
} as const;

const DISPLAY = "'Space Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const BODY = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SFMono-Regular', Menlo, Consolas, 'Liberation Mono', monospace";

export function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─── Briques ────────────────────────────────────────────────────────────────

type Block =
  | { t: "p"; html: string }
  | { t: "small"; html: string }
  | { t: "button"; label: string; url: string }
  | { t: "fallback"; url: string }
  | { t: "code"; code: string }
  | { t: "rows"; rows: [string, string][] }
  | { t: "steps"; steps: [string, string][] }
  | { t: "divider" };

const p = (html: string): Block => ({ t: "p", html });
const small = (html: string): Block => ({ t: "small", html });
const button = (label: string, url: string): Block => ({ t: "button", label, url });
const fallback = (url: string): Block => ({ t: "fallback", url });

function renderBlock(b: Block): string {
  switch (b.t) {
    case "p":
      return `<p style="margin:0 0 16px;font-family:${BODY};font-size:15px;line-height:24px;color:${BRAND.body};">${b.html}</p>`;
    case "small":
      return `<p style="margin:0 0 12px;font-family:${BODY};font-size:13px;line-height:20px;color:${BRAND.muted};">${b.html}</p>`;
    case "button":
      return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;">
  <tr><td align="center" bgcolor="${BRAND.primary}" style="border-radius:10px;background:${BRAND.primary};background-image:linear-gradient(90deg,${BRAND.primary} 0%,${BRAND.orange} 100%);">
    <a href="${esc(b.url)}" target="_blank" style="display:inline-block;padding:14px 26px;font-family:${DISPLAY};font-size:15px;font-weight:700;line-height:20px;color:#FFFFFF;text-decoration:none;border-radius:10px;">${esc(b.label)}&nbsp;&nbsp;&rarr;</a>
  </td></tr>
</table>`;
    case "fallback":
      return `<p style="margin:0 0 12px;font-family:${BODY};font-size:12px;line-height:18px;color:${BRAND.dim};">Le bouton ne marche pas&nbsp;? Copie ce lien dans ton navigateur&nbsp;:<br><a href="${esc(b.url)}" target="_blank" style="color:${BRAND.muted};text-decoration:underline;word-break:break-all;">${esc(b.url)}</a></p>`;
    case "code":
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 24px;">
  <tr><td align="center" style="background:${BRAND.inner};border:1px solid ${BRAND.border};border-radius:12px;padding:18px 12px;">
    <span style="font-family:${MONO};font-size:30px;font-weight:700;letter-spacing:8px;color:${BRAND.text};">${esc(b.code)}</span>
  </td></tr>
</table>`;
    case "rows":
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 24px;background:${BRAND.inner};border:1px solid ${BRAND.border};border-radius:12px;">
${b.rows
  .map(
    ([k, v], i) => `  <tr>
    <td style="padding:12px 16px;${i ? `border-top:1px solid ${BRAND.border};` : ""}font-family:${BODY};font-size:13px;color:${BRAND.muted};white-space:nowrap;" valign="top">${esc(k)}</td>
    <td style="padding:12px 16px;${i ? `border-top:1px solid ${BRAND.border};` : ""}font-family:${BODY};font-size:14px;color:${BRAND.text};text-align:right;" valign="top">${esc(v)}</td>
  </tr>`,
  )
  .join("\n")}
</table>`;
    case "steps":
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 24px;">
${b.steps
  .map(
    ([title, text], i) => `  <tr>
    <td width="36" valign="top" style="padding:0 0 18px;">
      <div style="width:26px;height:26px;line-height:26px;border-radius:8px;background:${BRAND.inner};border:1px solid ${BRAND.border};text-align:center;font-family:${DISPLAY};font-size:13px;font-weight:700;color:${BRAND.primary};">${i + 1}</div>
    </td>
    <td valign="top" style="padding:2px 0 18px;">
      <div style="font-family:${DISPLAY};font-size:15px;font-weight:700;line-height:20px;color:${BRAND.text};">${esc(title)}</div>
      <div style="margin-top:3px;font-family:${BODY};font-size:14px;line-height:21px;color:${BRAND.body};">${text}</div>
    </td>
  </tr>`,
  )
  .join("\n")}
</table>`;
    case "divider":
      return `<div style="height:1px;background:${BRAND.border};margin:8px 0 20px;line-height:1px;font-size:1px;">&nbsp;</div>`;
  }
}

function blockText(b: Block): string {
  const strip = (h: string) =>
    h
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&rarr;/g, "→");
  switch (b.t) {
    case "p":
    case "small":
      return strip(b.html);
    case "button":
      return `${b.label} : ${b.url}`;
    case "fallback":
      return "";
    case "code":
      return `Code : ${b.code}`;
    case "rows":
      return b.rows.map(([k, v]) => `${k} : ${v}`).join("\n");
    case "steps":
      return b.steps.map(([t, x], i) => `${i + 1}. ${t} — ${strip(x)}`).join("\n");
    case "divider":
      return "—";
  }
}

interface Layout {
  subject: string;
  preheader: string;
  eyebrow: string;
  title: string;
  blocks: Block[];
  /** Pourquoi le pilote reçoit ce mail (pied de page). */
  reason: string;
  /** Visuel d'en-tête (capture de l'app ou tracé de circuit) et son texte alternatif. */
  hero?: { src: string; alt: string };
  /** Mails d'accompagnement : lien de désinscription en un clic (jamais pour la sécurité). */
  unsubscribeUrl?: string;
}

function layout(l: Layout): { subject: string; html: string; text: string } {
  const html = `<!doctype html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${esc(l.subject)}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">
<style>
  :root { color-scheme: light dark; supported-color-schemes: light dark; }
  body { margin:0; padding:0; background:${BRAND.bg}; }
  a { color:${BRAND.primary}; }
  /* Mode clair : le fond autour s'éclaircit, la carte garde la nuit de la marque. */
  @media (prefers-color-scheme: light) {
    .ax-outer, body { background:${BRAND.lightBg} !important; }
    .ax-foot, .ax-foot a, .ax-foot span { color:#5A5A5A !important; }
    .ax-brand { color:#111111 !important; }
  }
  @media (max-width: 600px) {
    .ax-card { padding: 28px 20px !important; }
    .ax-title { font-size: 23px !important; line-height: 30px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};" bgcolor="${BRAND.bg}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${BRAND.bg};font-size:1px;line-height:1px;">${esc(l.preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table class="ax-outer" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${BRAND.bg}" style="background:${BRAND.bg};">
  <tr><td align="center" style="padding:32px 12px 40px;">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;">
      <!-- En-tête : le logo de l'app -->
      <tr><td style="padding:0 4px 22px;">
        <a href="${BRAND.site}" target="_blank" style="text-decoration:none;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td valign="middle"><img src="${BRAND.icon}" width="32" height="32" alt="" style="display:block;border:0;border-radius:8px;"></td>
            <td class="ax-brand" valign="middle" style="padding-left:10px;font-family:${DISPLAY};font-size:19px;font-weight:700;letter-spacing:-0.2px;color:${BRAND.text};">APEX<span style="color:${BRAND.primary};">AI</span></td>
          </tr></table>
        </a>
      </td></tr>
      <!-- Bandeau dégradé de la marque -->
      <tr><td height="5" bgcolor="${BRAND.primary}" style="height:5px;line-height:5px;font-size:5px;border-radius:16px 16px 0 0;background:${BRAND.primary};background-image:linear-gradient(90deg,${BRAND.primary} 0%,${BRAND.orange} 100%);">&nbsp;</td></tr>
      ${l.hero ? `<!-- Visuel -->
      <tr><td bgcolor="${BRAND.card}" style="background:${BRAND.card};border-left:1px solid ${BRAND.border};border-right:1px solid ${BRAND.border};padding:0;line-height:0;font-size:0;">
        <img src="${esc(l.hero.src)}" width="560" alt="${esc(l.hero.alt)}" style="display:block;width:100%;max-width:560px;height:auto;border:0;">
      </td></tr>` : ""}
      <!-- Carte -->
      <tr><td class="ax-card" bgcolor="${BRAND.card}" style="background:${BRAND.card};border:1px solid ${BRAND.border};border-top:0;border-radius:0 0 16px 16px;padding:32px 32px 28px;">
        <div style="font-family:${BODY};font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:${BRAND.orange};margin:0 0 12px;">${esc(l.eyebrow)}</div>
        <h1 class="ax-title" style="margin:0 0 18px;font-family:${DISPLAY};font-size:26px;line-height:32px;font-weight:700;letter-spacing:-0.4px;color:${BRAND.text};">${esc(l.title)}</h1>
        ${l.blocks.map(renderBlock).join("\n        ")}
      </td></tr>
      <!-- Pied de page -->
      <tr><td class="ax-foot" style="padding:22px 6px 0;font-family:${BODY};font-size:12px;line-height:19px;color:${BRAND.dim};">
        ${esc(l.reason)}<br>
        ${l.unsubscribeUrl ? `Tu ne veux plus ces conseils&nbsp;? <a href="${esc(l.unsubscribeUrl)}" target="_blank" style="color:${BRAND.muted};text-decoration:underline;">Se désinscrire en un clic</a> (les mails de sécurité de ton compte continuent).<br>` : ""}
        Une question&nbsp;? Réponds simplement à ce mail, ou écris à <a href="mailto:${BRAND.contact}" style="color:${BRAND.muted};">${BRAND.contact}</a>.<br><br>
        <a href="${BRAND.site}" target="_blank" style="color:${BRAND.muted};text-decoration:none;font-family:${DISPLAY};font-weight:700;">APEX<span style="color:${BRAND.primary};">AI</span></a>
        <span style="color:${BRAND.dim};">&nbsp;·&nbsp;Ton ingénieur de course IA</span>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const text = [
    l.title,
    "",
    ...l.blocks.map(blockText).filter(Boolean),
    "",
    "—",
    l.reason,
    `Une question ? Réponds à ce mail ou écris à ${BRAND.contact}.`,
    l.unsubscribeUrl ? `Se désinscrire : ${l.unsubscribeUrl}` : "",
    "ApexAI · Ton ingénieur de course IA · apexai.racing",
  ].filter((x) => x !== "").join("\n\n").replace(/\n{3,}/g, "\n\n");

  return { subject: l.subject, html, text };
}

// ─── Les mails ──────────────────────────────────────────────────────────────

export type EmailKind =
  | "signup"
  | "invite"
  | "magiclink"
  | "recovery"
  | "email_change_current"
  | "email_change_new"
  | "reauthentication"
  | "password_changed_notification"
  | "email_changed_notification"
  | "identity_linked_notification"
  | "identity_unlinked_notification"
  | "security_notification"
  | "welcome"
  | "new_device"
  // Suite d'activation (mails d'accompagnement, avec désinscription)
  | "activation_d3"
  | "activation_d7"
  | "first_analysis"
  | "pass_ending"
  | "team_farewell";

/** Mails d'accompagnement : désinscription possible, jamais envoyés deux fois. */
export const LIFECYCLE_KINDS: EmailKind[] = ["welcome", "activation_d3", "activation_d7", "first_analysis", "pass_ending", "team_farewell"];

export interface EmailData {
  /** Lien d'action (confirmation, réinitialisation, connexion…). */
  url?: string;
  /** Code à 6 chiffres (réauthentification). */
  code?: string;
  email?: string;
  oldEmail?: string;
  newEmail?: string;
  /** Fournisseur associé/dissocié (Google…). */
  provider?: string;
  /** Nouvelle connexion : date lisible, appareil. */
  when?: string;
  device?: string;
  /** Prénom ou pseudo si on le connaît. */
  name?: string;
  /** Notification de sécurité générique. */
  detail?: string;
  /** Mails d'accompagnement : lien de désinscription signé. */
  unsubscribeUrl?: string;
  /** Première analyse : lien vers elle et circuit. */
  analysisUrl?: string;
  circuit?: string;
  /** Fin de Paddock Pass ou mois offert : date lisible (« 21 novembre »). */
  until?: string;
  /** Fin de structure Team : son nom. */
  structure?: string;
}

const REASON_ACCOUNT = "Tu reçois ce mail parce qu'un compte ApexAI est associé à cette adresse.";
const REASON_SIGNUP = "Tu reçois ce mail parce que cette adresse a été utilisée pour créer un compte ApexAI.";
const PROVIDERS: Record<string, string> = { google: "Google", apple: "Apple", github: "GitHub", email: "e-mail" };

export function renderEmail(kind: EmailKind, d: EmailData): { subject: string; html: string; text: string } {
  const site = BRAND.site;
  const resetUrl = `${site}/login?mode=reset`;
  switch (kind) {
    case "signup":
      return layout({
        subject: "Confirme ton adresse e-mail",
        preheader: "Un clic et ton compte ApexAI est actif.",
        eyebrow: "Ton compte",
        title: "Plus qu'une étape",
        blocks: [
          p("Confirme ton adresse pour activer ton compte ApexAI. Ensuite, dépose le fichier de ta session&nbsp;: l'analyse prend quelques secondes."),
          button("Confirmer mon adresse", d.url!),
          small("Le lien est valable 1&nbsp;heure. Si tu n'as pas créé de compte, ignore simplement ce mail."),
          fallback(d.url!),
        ],
        reason: REASON_SIGNUP,
      });

    case "invite":
      return layout({
        subject: "Tu es invité sur ApexAI",
        preheader: "Crée ton compte pour rejoindre ApexAI.",
        eyebrow: "Invitation",
        title: "On t'attend sur ApexAI",
        blocks: [
          p("Tu as été invité à rejoindre ApexAI, l'app qui analyse tes sessions de karting virage par virage et suit ton kart toute la saison."),
          button("Créer mon compte", d.url!),
          fallback(d.url!),
        ],
        reason: "Tu reçois ce mail parce que quelqu'un t'a invité sur ApexAI.",
      });

    case "magiclink":
      return layout({
        subject: "Ton lien de connexion",
        preheader: "Connecte-toi à ApexAI en un clic.",
        eyebrow: "Connexion",
        title: "Ton lien de connexion",
        blocks: [
          p("Clique sur le bouton pour te connecter à ApexAI, sans mot de passe."),
          button("Me connecter", d.url!),
          small("Le lien est valable 1&nbsp;heure et ne fonctionne qu'une fois. Si tu n'as rien demandé, ignore ce mail&nbsp;: personne ne peut se connecter sans ce lien."),
          fallback(d.url!),
        ],
        reason: REASON_ACCOUNT,
      });

    case "recovery":
      return layout({
        subject: "Réinitialise ton mot de passe",
        preheader: "Choisis un nouveau mot de passe pour ton compte ApexAI.",
        eyebrow: "Mot de passe",
        title: "Nouveau mot de passe",
        blocks: [
          p("Tu as demandé à réinitialiser ton mot de passe. Clique sur le bouton pour en choisir un nouveau."),
          button("Choisir un nouveau mot de passe", d.url!),
          small("Le lien est valable 1&nbsp;heure. Si tu n'es pas à l'origine de la demande, ignore ce mail&nbsp;: ton mot de passe actuel reste valable."),
          fallback(d.url!),
        ],
        reason: REASON_ACCOUNT,
      });

    case "email_change_current":
      return layout({
        subject: "Confirme le changement d'adresse e-mail",
        preheader: "Une demande de changement d'adresse a été faite sur ton compte.",
        eyebrow: "Sécurité",
        title: "Changement d'adresse e-mail",
        blocks: [
          p("Une demande a été faite pour remplacer l'adresse de ton compte ApexAI."),
          { t: "rows", rows: [["Adresse actuelle", d.oldEmail ?? d.email ?? ""], ["Nouvelle adresse", d.newEmail ?? ""]] },
          p("Si c'est bien toi, confirme depuis cette adresse&nbsp;:"),
          button("Confirmer le changement", d.url!),
          small("Si tu n'es pas à l'origine de cette demande, ne clique pas et <a href=\"" + resetUrl + "\" style=\"color:" + BRAND.primary + ";\">change ton mot de passe</a>."),
          fallback(d.url!),
        ],
        reason: REASON_ACCOUNT,
      });

    case "email_change_new":
      return layout({
        subject: "Confirme ta nouvelle adresse e-mail",
        preheader: "Un clic pour utiliser cette adresse sur ApexAI.",
        eyebrow: "Ton compte",
        title: "Confirme ta nouvelle adresse",
        blocks: [
          p(`Cette adresse doit remplacer <strong style="color:${BRAND.text};">${esc(d.oldEmail ?? "l'adresse actuelle")}</strong> sur ton compte ApexAI.`),
          button("Confirmer cette adresse", d.url!),
          small("Si tu ne t'attendais pas à ce mail, ignore-le&nbsp;: rien ne change sans ta confirmation."),
          fallback(d.url!),
        ],
        reason: "Tu reçois ce mail parce que cette adresse a été indiquée pour un compte ApexAI.",
      });

    case "reauthentication":
      return layout({
        subject: `Ton code de vérification : ${d.code}`,
        preheader: "Saisis ce code dans ApexAI pour confirmer l'opération.",
        eyebrow: "Sécurité",
        title: "Ton code de vérification",
        blocks: [
          p("Saisis ce code dans ApexAI pour confirmer l'opération en cours."),
          { t: "code", code: d.code ?? "" },
          small("Le code est valable quelques minutes. Ne le transmets à personne&nbsp;: ApexAI ne te le demandera jamais par message."),
        ],
        reason: REASON_ACCOUNT,
      });

    case "password_changed_notification":
      return layout({
        subject: "Ton mot de passe a été modifié",
        preheader: "Le mot de passe de ton compte ApexAI vient d'être changé.",
        eyebrow: "Sécurité",
        title: "Mot de passe modifié",
        blocks: [
          p("Le mot de passe de ton compte ApexAI vient d'être changé. Si c'est toi, tout est en ordre."),
          p("Si ce n'est pas toi, réinitialise-le tout de suite et préviens-nous."),
          button("Réinitialiser mon mot de passe", resetUrl),
        ],
        reason: REASON_ACCOUNT,
      });

    case "email_changed_notification":
      return layout({
        subject: "L'adresse e-mail de ton compte a été modifiée",
        preheader: "Ton compte ApexAI utilise désormais une nouvelle adresse.",
        eyebrow: "Sécurité",
        title: "Adresse e-mail modifiée",
        blocks: [
          p("L'adresse de ton compte ApexAI a été modifiée."),
          { t: "rows", rows: [["Ancienne adresse", d.oldEmail ?? ""], ["Nouvelle adresse", d.newEmail ?? d.email ?? ""]] },
          p(`Si tu n'es pas à l'origine de ce changement, écris-nous tout de suite à <a href="mailto:${BRAND.contact}" style="color:${BRAND.primary};">${BRAND.contact}</a>.`),
        ],
        reason: REASON_ACCOUNT,
      });

    case "identity_linked_notification":
    case "identity_unlinked_notification": {
      const linked = kind === "identity_linked_notification";
      const name = PROVIDERS[(d.provider ?? "").toLowerCase()] ?? d.provider ?? "un autre compte";
      return layout({
        subject: linked ? `Compte ${name} associé à ApexAI` : `Compte ${name} dissocié d'ApexAI`,
        preheader: linked ? `Tu peux maintenant te connecter avec ${name}.` : `La connexion avec ${name} est retirée.`,
        eyebrow: "Sécurité",
        title: linked ? `${name} est associé à ton compte` : `${name} n'est plus associé`,
        blocks: [
          p(
            linked
              ? `Tu peux désormais te connecter à ApexAI avec ton compte ${esc(name)}.`
              : `La connexion à ApexAI avec ton compte ${esc(name)} a été retirée.`,
          ),
          p("Si tu n'es pas à l'origine de ce changement, réinitialise ton mot de passe et préviens-nous."),
          button("Réinitialiser mon mot de passe", resetUrl),
        ],
        reason: REASON_ACCOUNT,
      });
    }

    case "security_notification":
      return layout({
        subject: "Modification de sécurité sur ton compte",
        preheader: "Un réglage de sécurité de ton compte ApexAI a changé.",
        eyebrow: "Sécurité",
        title: "Un réglage de sécurité a changé",
        blocks: [
          p(esc(d.detail ?? "Un réglage de sécurité de ton compte ApexAI vient d'être modifié.")),
          p("Si ce n'est pas toi, réinitialise ton mot de passe et préviens-nous."),
          button("Réinitialiser mon mot de passe", resetUrl),
        ],
        reason: REASON_ACCOUNT,
      });

    case "welcome": {
      const hello = d.name ? `Bienvenue, ${esc(d.name)}` : "Bienvenue sur ApexAI";
      return layout({
        subject: "Bienvenue sur ApexAI : dépose ton premier fichier de session",
        preheader: "Trois étapes, et ApexAI te montre où tu perds du temps, virage par virage.",
        eyebrow: "Ton compte est prêt",
        title: hello,
        hero: { src: HEROES.upload, alt: "L'écran Analyser d'ApexAI sur téléphone, à côté du tracé d'un circuit" },
        blocks: [
          p("ApexAI lit le fichier de session de ton boîtier d'acquisition et te dit où tu perds du temps, virage par virage. Voici comment démarrer&nbsp;:"),
          {
            t: "steps",
            steps: [
              ["Récupère le fichier de ta séance", "<b>AiM MyChron</b>&nbsp;: télécharge la séance dans Race Studio&nbsp;3, le fichier <b>.xrk</b> arrive sur ton ordinateur. <b>Alfano</b>&nbsp;: exporte la séance depuis ADA, en <b>.zip</b>."],
              ["Dépose-le tel quel", "Dans ApexAI, onglet Analyser. Pas de conversion, pas de réglage&nbsp;: l'app reconnaît ton boîtier et ton circuit."],
              ["Lis tes virages", "Carte du circuit, points de corde, freinages, et les virages où tu perds le plus de temps, avec un objectif pour ta prochaine séance."],
            ],
          },
          button("Déposer mon premier fichier", `${site}/upload`),
          { t: "divider" },
          p(`Je lis tous les retours. Si quelque chose bloque, réponds à ce mail&nbsp;: c'est moi qui te réponds.`),
          p(`<span style="color:${BRAND.text};font-family:${DISPLAY};font-weight:700;">Yanis</span><br><span style="color:${BRAND.muted};font-size:13px;">Fondateur d'ApexAI</span>`),
        ],
        reason: REASON_SIGNUP,
        unsubscribeUrl: d.unsubscribeUrl,
      });
    }

    case "activation_d3":
      return layout({
        subject: "Ton fichier de session en 2 minutes",
        preheader: "Où trouver le fichier de ta MyChron ou de ton Alfano, et quoi en faire.",
        eyebrow: "Pas à pas",
        title: "Ta première analyse en 2 minutes",
        hero: { src: HEROES.upload, alt: "L'écran Analyser d'ApexAI, prêt à recevoir un fichier de session" },
        blocks: [
          p("Tu n'as pas encore déposé de séance. C'est souvent le fichier qui bloque&nbsp;: voici où le trouver."),
          {
            t: "steps",
            steps: [
              ["AiM MyChron", "Branche ou connecte ta MyChron à Race Studio&nbsp;3 et télécharge la séance. Le fichier <b>.xrk</b> (ou <b>.xrz</b>) est celui à déposer."],
              ["Alfano", "Dans l'application ADA, exporte la séance&nbsp;: dépose le <b>.zip</b> tel quel, ou l'export Excel."],
              ["Pas de séance sous la main&nbsp;?", "Garde ce mail : à ta prochaine sortie, dépose le fichier le soir même, l'analyse prend quelques secondes."],
            ],
          },
          button("Déposer un fichier", `${site}/upload`),
          small("Un fichier qui refuse de passer&nbsp;? Réponds à ce mail avec le fichier en pièce jointe, je regarde."),
        ],
        reason: REASON_SIGNUP,
        unsubscribeUrl: d.unsubscribeUrl,
      });

    case "activation_d7":
      return layout({
        subject: "Ce qu'une séance analysée t'apprend",
        preheader: "Les virages où tu perds du temps, et le tour que tu peux déjà faire.",
        eyebrow: "Ta prochaine séance",
        title: "Ton temps se cache dans quelques virages",
        hero: { src: HEROES.trace, alt: "Tracé d'un circuit de karting avec ses virages numérotés" },
        blocks: [
          p("D'un tour à l'autre, tu ne perds pas du temps partout&nbsp;: l'écart se joue sur quelques virages. ApexAI les trouve dans ton propre fichier, et tu sais où travailler à la prochaine séance."),
          {
            t: "steps",
            steps: [
              ["Ton tour idéal", "Tes meilleurs morceaux de piste mis bout à bout&nbsp;: un chrono que tu as déjà signé, donc atteignable."],
              ["Virage par virage", "Point de freinage, vitesse au point de corde, sortie&nbsp;: comparés à ton meilleur passage."],
              ["Un objectif clair", "Une consigne pour ta prochaine séance, pas une liste de 20 conseils."],
            ],
          },
          button("Analyser une séance", `${site}/upload`),
          { t: "divider" },
          p("Tu préfères qu'on le fasse ensemble&nbsp;? Réponds à ce mail avec le fichier de ta dernière séance&nbsp;: je te montre ce que l'app en sort."),
        ],
        reason: REASON_SIGNUP,
        unsubscribeUrl: d.unsubscribeUrl,
      });

    case "first_analysis":
      return layout({
        subject: "Ta première analyse est prête : et maintenant ?",
        preheader: "Trois choses à faire avec ta séance avant la prochaine sortie.",
        eyebrow: "Bien joué",
        title: d.circuit ? `Ta séance à ${esc(d.circuit)} est analysée` : "Ta première séance est analysée",
        hero: { src: HEROES.trace, alt: "Tracé du circuit avec les virages à travailler" },
        blocks: [
          p("Tu as fait le plus dur. Voici ce qui t'aidera le plus avant ta prochaine séance&nbsp;:"),
          {
            t: "steps",
            steps: [
              ["Relis l'objectif de ta prochaine séance", "En bas de ton analyse&nbsp;: une consigne, sur un ou deux virages."],
              ["Renseigne ton kart", "Dans Mon Kart, ApexAI compte les heures moteur et les tours de pneus à chaque séance déposée."],
              ["Compare tes séances", "Dépose la suivante&nbsp;: tu verras si l'écart se resserre là où tu as travaillé."],
            ],
          },
          button("Revoir mon analyse", d.analysisUrl || `${site}/dashboard`),
        ],
        reason: REASON_SIGNUP,
        unsubscribeUrl: d.unsubscribeUrl,
      });

    case "pass_ending":
      return layout({
        subject: "Ton Paddock Pass se termine dans 3 jours",
        preheader: d.until ? `Accès complet jusqu'au ${d.until}.` : "Ton accès complet se termine bientôt.",
        eyebrow: "Paddock Pass",
        title: "Encore 3 jours d'accès complet",
        hero: { src: HEROES.monkart, alt: "Mon Kart sur téléphone : moteur, pneus, freins et chaîne suivis séance après séance" },
        blocks: [
          p(`Ton Paddock Pass donne l'accès complet${d.until ? ` jusqu'au <b style="color:${BRAND.text};">${esc(d.until)}</b>` : ""}. Profite-en pour déposer tes dernières séances.`),
          p("Ensuite, tu repasses sur l'offre gratuite&nbsp;: tes séances et ton historique restent là. Racer garde les analyses illimitées, Mon Kart et le comparateur."),
          button("Voir les offres", `${site}/pricing`),
        ],
        reason: "Tu reçois ce mail parce qu'un Paddock Pass est actif sur ton compte ApexAI.",
        unsubscribeUrl: d.unsubscribeUrl,
      });

    case "team_farewell":
      return layout({
        subject: "Un mois Racer offert, pour garder le rythme",
        preheader: "Ton historique reste là, et l'accès complet continue un mois.",
        eyebrow: "Après ta structure",
        title: "Ton historique reste à toi",
        hero: { src: HEROES.setup, alt: "Les Réglages d'ApexAI sur téléphone" },
        blocks: [
          p(`Tu ne fais plus partie de ${d.structure ? `<b style="color:${BRAND.text};">${esc(d.structure)}</b>` : "ta structure"}. Tes séances, tes analyses et ton kart restent sur ton compte.`),
          p(`Pour garder l'habitude, on t'offre l'accès Racer complet${d.until ? ` jusqu'au <b style="color:${BRAND.text};">${esc(d.until)}</b>` : " pendant un mois"}.`),
          button("Déposer ma prochaine séance", `${site}/upload`),
        ],
        reason: "Tu reçois ce mail parce que tu as quitté une structure sur ApexAI.",
        unsubscribeUrl: d.unsubscribeUrl,
      });

    case "new_device":
      return layout({
        subject: "Nouvelle connexion à ton compte ApexAI",
        preheader: "Ton compte vient d'être ouvert sur un nouvel appareil.",
        eyebrow: "Sécurité",
        title: "Nouvelle connexion",
        blocks: [
          p("Ton compte ApexAI vient d'être ouvert sur un appareil que nous ne connaissions pas."),
          { t: "rows", rows: [["Quand", d.when ?? ""], ["Appareil", d.device ?? "Inconnu"], ["Compte", d.email ?? ""]] },
          p("Si c'est toi, tu n'as rien à faire."),
          p("Si ce n'est pas toi, change ton mot de passe tout de suite."),
          button("Changer mon mot de passe", resetUrl),
        ],
        reason: REASON_ACCOUNT,
      });
  }
}

/** Tous les mails, avec des données d'exemple — pour l'aperçu et les tests. */
export const SAMPLES: [EmailKind, EmailData][] = [
  ["signup", { url: `${BRAND.site}/auth/confirm?token_hash=exemple&type=email&next=/dashboard` }],
  ["recovery", { url: `${BRAND.site}/auth/confirm?token_hash=exemple&type=recovery&next=/reset-password` }],
  ["magiclink", { url: `${BRAND.site}/auth/confirm?token_hash=exemple&type=email&next=/dashboard` }],
  ["welcome", { name: "Lucas" }],
  ["new_device", { when: "dimanche 26 octobre 2026 à 09:14", device: "Chrome sur Windows", email: "pilote@exemple.fr" }],
  ["password_changed_notification", {}],
  ["email_change_current", { url: `${BRAND.site}/auth/confirm?token_hash=exemple&type=email_change`, oldEmail: "pilote@exemple.fr", newEmail: "nouvelle@exemple.fr" }],
  ["email_change_new", { url: `${BRAND.site}/auth/confirm?token_hash=exemple&type=email_change`, oldEmail: "pilote@exemple.fr" }],
  ["email_changed_notification", { oldEmail: "pilote@exemple.fr", newEmail: "nouvelle@exemple.fr" }],
  ["reauthentication", { code: "482916" }],
  ["identity_linked_notification", { provider: "google" }],
  ["invite", { url: `${BRAND.site}/auth/confirm?token_hash=exemple&type=invite&next=/dashboard` }],
];
