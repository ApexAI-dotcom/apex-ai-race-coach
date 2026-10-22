/**
 * Vocabulaire du pilote.
 *
 * En français on dit « point de corde », pas « apex ». Le serveur écrit
 * désormais ainsi, mais les analyses ENREGISTRÉES avant ce changement portent
 * encore l'ancien mot dans leurs conseils et leurs libellés : on le corrige à
 * l'affichage, pour que le pilote ne voie jamais les deux vocabulaires.
 *
 * La marque (« ApexAI », « Apex AI », « APEX ») n'est jamais touchée.
 * La fonction est idempotente : le texte déjà propre ressort inchangé.
 */
export function toDriverVocabulary(text: string): string {
  if (!text) return text;
  return (
    text
      .replace(/double apex/gi, "deux points de corde")
      .replace(/single apex/gi, "un seul point de corde")
      // On capture le caractère qui précède plutôt qu'un `(?<!…)` : les anciens
      // iPhone (< iOS 16.4) ne connaissent pas le lookbehind, et une regex qu'ils
      // ne comprennent pas ferait échouer le chargement de toute l'application.
      // But : « de l'apex » ne doit pas mordre dans « Regarde l'apex ».
      .replace(/(^|[^\p{L}])à l['’]apex\b/giu, "$1au point de corde")
      .replace(/(^|[^\p{L}])de l['’]apex\b/giu, "$1du point de corde")
      .replace(/(^|[^\p{L}])d['’]apex\b/giu, "$1du point de corde")
      .replace(/(^|[^\p{L}])l['’]apex\b/giu, "$1le point de corde")
      .replace(/\bapices?\b|\bapexes\b/gi, "points de corde")
      // Début de phrase : majuscule. Ailleurs : minuscule (« Précision point de corde »).
      .replace(/(^|[.!?—–:]\s*)Apex\b(?!\s?AI)/g, "$1Point de corde")
      .replace(/\b[Aa]pex\b(?!\s?AI)/g, "point de corde")
  );
}
