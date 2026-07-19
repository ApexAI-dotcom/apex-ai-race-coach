import { Layout } from "@/components/layout/Layout";
import { PageMeta } from "@/components/seo/PageMeta";
import { motion } from "framer-motion";

export default function Confidentialite() {
  return (
    <Layout>
      <PageMeta
        title="Politique de Confidentialité | ApexAI"
        description="Politique de Confidentialité d'ApexAI - RGPD 2026."
        path="/legal/confidentialite"
      />
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="prose prose-invert prose-sm max-w-none"
        >
          <h1 className="text-3xl font-bold text-foreground mb-8">Politique de Confidentialité</h1>
          <p className="text-muted-foreground mb-6">
            Dernière mise à jour : Juillet 2026.
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">1. Collecte des données</h2>
            <p className="text-muted-foreground">
              Nous collectons les données que vous nous transmettez directement (lors de votre inscription et de la saisie de vos configurations de karting) ainsi que des fichiers de télémétrie que vous importez volontairement dans le cadre des fonctionnalités d'analyse.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">2. Utilisation des données</h2>
            <p className="text-muted-foreground">
              Vos données sont principalement exploitées pour analyser vos performances de pilotage, générer des graphiques, suggérer des ajustements de pressions de pneus, et assurer le suivi mécanique de votre matériel.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">3. Partage des données</h2>
            <p className="text-muted-foreground">
              Nous ne vendons ni ne louons vos données personnelles. Elles peuvent être temporairement partagées avec nos prestataires techniques indispensables (Stripe pour le paiement et Supabase pour la base de données sécurisée).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">4. Vos droits (RGPD 2026)</h2>
            <p className="text-muted-foreground">
              Conformément à la réglementation sur la protection des données (RGPD), vous disposez d'un droit d'accès, de rectification, de portabilité et de suppression de toutes vos données personnelles sur simple demande par courrier électronique.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">5. Sécurité</h2>
            <p className="text-muted-foreground">
              Nous mettons en œuvre des mesures de sécurité rigoureuses pour protéger vos informations contre tout accès, modification ou divulgation non autorisés.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">6. Contact</h2>
            <p className="text-muted-foreground">
              Pour exercer vos droits ou pour toute question sur notre politique de gestion des données, veuillez nous contacter à :{" "}
              <a href="mailto:contact@apexai.run" className="text-primary hover:underline">
                contact@apexai.run
              </a>.
            </p>
          </section>
        </motion.div>
      </div>
    </Layout>
  );
}
