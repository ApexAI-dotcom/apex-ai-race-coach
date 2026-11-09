import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { OPEN_CONSENT_EVENT, applyConsent, readConsent, saveConsent } from "@/lib/consent";

/**
 * Bandeau de consentement : en bas d'écran, sans bloquer la page.
 * « Tout refuser » et « Tout accepter » ont le même poids visuel (CNIL) ;
 * « Personnaliser » ouvre le détail par famille. Rouvrable depuis le pied de
 * page (« Gérer les cookies »).
 */
export function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(false);
  const [measure, setMeasure] = useState(false);
  const [ads, setAds] = useState(false);

  useEffect(() => {
    const c = readConsent();
    if (c) {
      applyConsent(c);
      setMeasure(c.measure);
      setAds(c.ads);
    } else {
      // Laisse la page s'afficher d'abord : le bandeau arrive juste après.
      const t = window.setTimeout(() => setOpen(true), 700);
      return () => window.clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    const reopen = () => {
      const c = readConsent();
      setMeasure(c?.measure ?? false);
      setAds(c?.ads ?? false);
      setDetails(true);
      setOpen(true);
    };
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, []);

  const decide = (m: boolean, a: boolean) => {
    saveConsent(m, a);
    setMeasure(m);
    setAds(a);
    setOpen(false);
    setDetails(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="false"
          aria-labelledby="cookie-title"
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        >
          <div className="relative mx-auto max-w-3xl sm:ml-0 sm:max-w-md overflow-hidden rounded-2xl border border-white/10 bg-card/95 shadow-2xl backdrop-blur-xl">
            {/* Filet signature, comme les cartes de l'app */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-signature" aria-hidden />
            <div className="p-4 sm:p-5">
              <h2 id="cookie-title" className="font-display text-base font-semibold text-foreground">
                Cookies, en clair
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                L'essentiel fonctionne sans rien accepter. Avec ton accord, on rattache ta navigation à ton compte pour
                améliorer l'app, et on mesure nos publicités (Meta, Google). Ton choix vaut 6 mois, modifiable à tout
                moment en bas de page.{" "}
                <Link to="/legal#cookies" className="text-foreground underline underline-offset-2 hover:text-primary">
                  En savoir plus
                </Link>
              </p>

              {details && (
                <div className="mt-4 divide-y divide-white/5 rounded-xl border border-white/5 bg-secondary/40">
                  <Row title="Nécessaires" text="Connexion, préférences, sécurité. Toujours actifs." checked disabled />
                  <Row
                    title="Mesure liée à ton compte"
                    text="Les pages que tu utilises (Google Analytics et notre propre mesure), rattachées à ton compte. Sans accord, rien n'est envoyé à Google et notre mesure reste anonyme."
                    checked={measure}
                    onChange={setMeasure}
                  />
                  <Row
                    title="Publicité"
                    text="Pixel Meta et balise Google : savoir si nos annonces t'ont amené ici et si tu t'es inscrit."
                    checked={ads}
                    onChange={setAds}
                  />
                </div>
              )}

              <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                {details ? (
                  <button
                    type="button"
                    onClick={() => decide(measure, ads)}
                    className="h-11 rounded-lg border border-white/15 px-4 text-sm font-medium text-foreground transition-colors hover:bg-white/5 sm:mr-auto"
                  >
                    Enregistrer mon choix
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDetails(true)}
                    className="h-11 px-1 text-sm font-medium text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline sm:mr-auto"
                  >
                    Personnaliser
                  </button>
                )}
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <button
                    type="button"
                    onClick={() => decide(false, false)}
                    className="h-11 rounded-lg border border-white/15 bg-white/[0.03] px-5 text-sm font-semibold text-foreground transition-colors hover:bg-white/10"
                  >
                    Tout refuser
                  </button>
                  <button
                    type="button"
                    onClick={() => decide(true, true)}
                    className="h-11 rounded-lg bg-signature px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    Tout accepter
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Row({
  title,
  text,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  text: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 p-3">
      <span>
        <span className="block text-sm font-medium text-foreground">{title}</span>
        <span className="block text-xs text-muted-foreground">{text}</span>
      </span>
      <Switch checked={checked} disabled={disabled} onCheckedChange={(v) => onChange?.(v)} aria-label={title} className="mt-0.5 shrink-0" />
    </label>
  );
}
