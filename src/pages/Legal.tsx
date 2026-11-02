import { Layout } from "@/components/layout/Layout";
import { openConsentPanel } from "@/lib/consent";
import { PageMeta } from "@/components/seo/PageMeta";
import { motion } from "framer-motion";

export default function Legal() {
  return (
    <Layout>
      <PageMeta
        title="Mentions légales | ApexAI"
        description="Mentions légales et conditions d'utilisation ApexAI."
        path="/legal"
      />
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="prose prose-invert prose-sm max-w-none"
        >
          <h1 className="text-3xl font-bold text-foreground mb-8">Mentions légales</h1>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Éditeur</h2>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Apex AI</strong>
              <br />
              France
              <br />
              Contact :{" "}
              <a href="mailto:contact@apexai.racing" className="text-primary hover:underline">
                contact@apexai.racing
              </a>
            </p>
          </section>

          <section className="mb-8" id="hebergeur">
            <h2 className="text-xl font-semibold text-foreground mb-4">Hébergeur</h2>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Vercel Inc.</strong>
              <br />
              340 S Lemon Ave #4133, Walnut, CA 91789, USA
              <br />
              <a
                href="https://vercel.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                vercel.com
              </a>
            </p>
          </section>

          <section className="mb-8" id="paiements">
            <h2 className="text-xl font-semibold text-foreground mb-4">Paiements</h2>
            <p className="text-muted-foreground">
              Les paiements sont traités par <strong className="text-foreground">Stripe</strong>,
              conforme PCI-DSS.
              <br />
              Aucune donnée bancaire n'est stockée sur nos serveurs.
              <br />
              <a
                href="https://stripe.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                stripe.com
              </a>
            </p>
          </section>

          <section className="mb-8" id="cgv">
            <span id="cgu" className="block -mt-20 pt-20" aria-hidden />
            <h2 className="text-xl font-semibold text-foreground mb-4">CGV / CGU</h2>
            <p className="text-muted-foreground">
              Conditions générales de vente (CGV) et conditions générales d'utilisation (CGU)
              disponibles sur demande à{" "}
              <a href="mailto:contact@apexai.racing" className="text-primary hover:underline">
                contact@apexai.racing
              </a>
              .
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              Pour toute demande :{" "}
              <a
                href="mailto:contact@apexai.racing?subject=Demande%20CGV-CGU"
                className="text-primary hover:underline"
              >
                Demander les CGV/CGU par email
              </a>
            </p>
          </section>

          <section className="mb-8" id="cookies">
            <h2 className="text-xl font-semibold text-foreground mb-4">Cookies</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                <strong className="text-foreground">Nécessaires</strong> (toujours actifs, sans consentement) :
                connexion à ton compte, préférences d'affichage, sécurité et paiement via Stripe.
              </p>
              <p>
                <strong className="text-foreground">Mesure d'audience</strong> : par défaut, une mesure anonyme
                hébergée chez nous (pages vues, durée, provenance), sans lien avec ton compte, avec un identifiant de
                navigateur renouvelé au plus tard après 13 mois. Avec ton accord, ces statistiques sont rattachées à
                ton compte pour améliorer l'app.
              </p>
              <p>
                <strong className="text-foreground">Publicité</strong> (avec ton accord uniquement) : pixels Meta
                et Google Ads, pour savoir si nos annonces t'ont amené ici. Rien n'est chargé avant ton accord
                (Google Consent Mode v2 réglé sur « refusé » par défaut).
              </p>
              <p>
                Ton choix est conservé 6 mois. Tu peux le modifier à tout moment :{" "}
                <button type="button" onClick={openConsentPanel} className="text-primary hover:underline">
                  gérer les cookies
                </button>
                .
              </p>
            </div>
          </section>

          <section className="mb-8" id="droit">
            <h2 className="text-xl font-semibold text-foreground mb-4">Droit applicable</h2>
            <p className="text-muted-foreground">Droit français. Tribunaux compétents : Paris.</p>
          </section>

          <section className="mb-8" id="privacy">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Confidentialité (RGPD 2026)
            </h2>
            <p className="text-muted-foreground">
              Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, de
              suppression et de portabilité de vos données personnelles.
              <br />
              Contact :{" "}
              <a href="mailto:contact@apexai.racing" className="text-primary hover:underline">
                contact@apexai.racing
              </a>
            </p>
          </section>
        </motion.div>
      </div>
    </Layout>
  );
}
