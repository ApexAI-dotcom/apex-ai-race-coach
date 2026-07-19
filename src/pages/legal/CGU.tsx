import { Layout } from "@/components/layout/Layout";
import { PageMeta } from "@/components/seo/PageMeta";
import { motion } from "framer-motion";

export default function CGU() {
  return (
    <Layout>
      <PageMeta
        title="Conditions Générales d'Utilisation | ApexAI"
        description="Conditions Générales d'Utilisation (CGU) d'ApexAI."
        path="/legal/cgu"
      />
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="prose prose-invert prose-sm max-w-none"
        >
          <h1 className="text-3xl font-bold text-foreground mb-8">Conditions Générales d'Utilisation</h1>
          <p className="text-muted-foreground mb-6">
            Dernière mise à jour : Juillet 2026.
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">1. Acceptation des conditions</h2>
            <p className="text-muted-foreground">
              En accédant et en utilisant la plateforme ApexAI, vous acceptez sans réserve les présentes conditions générales d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">2. Description des services</h2>
            <p className="text-muted-foreground">
              ApexAI est une plateforme d'analyse de données de télémétrie de karting exploitant l'intelligence artificielle pour générer des recommandations de pilotage et de configurations mécaniques.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">3. Accès et création de compte</h2>
            <p className="text-muted-foreground">
              L'accès à certaines fonctionnalités nécessite la création d'un compte utilisateur. Vous êtes responsable de la confidentialité de vos identifiants de connexion et de toutes les activités associées à votre compte.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">4. Propriété intellectuelle</h2>
            <p className="text-muted-foreground">
              L'ensemble des contenus, marques, logos et technologies présents sur ApexAI sont protégés par les lois relatives à la propriété intellectuelle. Toute reproduction ou distribution non autorisée est strictement interdite.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">5. Responsabilité et limitation</h2>
            <p className="text-muted-foreground">
              ApexAI fournit des recommandations basées sur des algorithmes d'analyse mais ne peut être tenu responsable des incidents ou accidents survenus sur piste. Le pilotage de karting comporte des risques inhérents ; la responsabilité de la sécurité incombe exclusivement au pilote et à son équipe.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">6. Contact</h2>
            <p className="text-muted-foreground">
              Pour toute question relative aux présentes conditions, vous pouvez nous écrire à :{" "}
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
