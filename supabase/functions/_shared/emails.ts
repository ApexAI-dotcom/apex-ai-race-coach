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
  success: "#22C55E",
};

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
  <tr><td align="center" bgcolor="${BRAND.primary}" style="border-radius:10px;background:${BRAND.primary};background-image:linear-gradient(135deg,${BRAND.primary} 0%,${BRAND.primaryDeep} 100%);">
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
}

function layout(l: Layout): { subject: string; html: string; text: string } {
  const html = `<!doctype html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${esc(l.subject)}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">
<style>
  :root { color-scheme: dark; supported-color-schemes: dark; }
  body { margin:0; padding:0; background:${BRAND.bg}; }
  a { color:${BRAND.primary}; }
  @media (max-width: 600px) {
    .ax-card { padding: 28px 20px !important; }
    .ax-title { font-size: 23px !important; line-height: 30px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};" bgcolor="${BRAND.bg}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${BRAND.bg};font-size:1px;line-height:1px;">${esc(l.preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${BRAND.bg}" style="background:${BRAND.bg};">
  <tr><td align="center" style="padding:32px 12px 40px;">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;">
      <!-- En-tête : le logo de l'app -->
      <tr><td style="padding:0 4px 22px;">
        <a href="${BRAND.site}" target="_blank" style="text-decoration:none;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td valign="middle"><img src="${BRAND.icon}" width="32" height="32" alt="" style="display:block;border:0;border-radius:8px;"></td>
            <td valign="middle" style="padding-left:10px;font-family:${DISPLAY};font-size:19px;font-weight:700;letter-spacing:-0.2px;color:${BRAND.text};">APEX<span style="color:${BRAND.primary};">AI</span></td>
          </tr></table>
        </a>
      </td></tr>
      <!-- Carte -->
      <tr><td class="ax-card" bgcolor="${BRAND.card}" style="background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:16px;padding:36px 32px 28px;">
        <div style="font-family:${BODY};font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:${BRAND.primary};margin:0 0 12px;">${esc(l.eyebrow)}</div>
        <h1 class="ax-title" style="margin:0 0 18px;font-family:${DISPLAY};font-size:26px;line-height:32px;font-weight:700;letter-spacing:-0.4px;color:${BRAND.text};">${esc(l.title)}</h1>
        ${l.blocks.map(renderBlock).join("\n        ")}
      </td></tr>
      <!-- Pied de page -->
      <tr><td style="padding:22px 6px 0;font-family:${BODY};font-size:12px;line-height:19px;color:${BRAND.dim};">
        ${esc(l.reason)}<br>
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
    "ApexAI · Ton ingénieur de course IA · apexai.racing",
  ].join("\n\n").replace(/\n{3,}/g, "\n\n");

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
  | "new_device";

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
      const hello = d.name ? `Bienvenue, ${d.name}` : "Bienvenue sur ApexAI";
      return layout({
        subject: "Bienvenue sur ApexAI",
        preheader: "Dépose ta première session : l'analyse prend quelques secondes.",
        eyebrow: "Ton compte est prêt",
        title: hello,
        blocks: [
          p("ApexAI lit le fichier de ta session, celui de ton boîtier d'acquisition, et te dit où tu perds du temps, virage par virage."),
          {
            t: "steps",
            steps: [
              ["Dépose ta session", "Le fichier .xrk de ta MyChron, tel qu'il sort de Race Studio. Carte du circuit, points de corde, freinages et conseils en quelques secondes."],
              ["Renseigne ton kart", "Dans Mon Kart&nbsp;: ApexAI compte les heures moteur, les tours de pneus et te prévient avant l'entretien."],
              ["Prépare ta prochaine sortie", "Les Réglages te proposent une base selon la météo et le circuit, et le Calendrier garde ta saison au même endroit."],
            ],
          },
          button("Analyser ma première session", `${site}/upload`),
          { t: "divider" },
          p(`Je lis tous les retours. Si quelque chose bloque ou s'il manque une fonction, réponds à ce mail&nbsp;: c'est moi qui te réponds.`),
          p(`<span style="color:${BRAND.text};font-family:${DISPLAY};font-weight:700;">Yanis</span><br><span style="color:${BRAND.muted};font-size:13px;">Fondateur d'ApexAI</span>`),
        ],
        reason: REASON_SIGNUP,
      });
    }

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
