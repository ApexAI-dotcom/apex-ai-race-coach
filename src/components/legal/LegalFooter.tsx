import { Link } from "react-router-dom";

export const LegalFooter = () => {
  return (
    <footer className="border-t border-white/5 bg-card/30 py-6 pb-24 md:pb-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div>
            <strong className="text-foreground">Apex AI SARL</strong> • France
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link to="/legal" className="hover:text-foreground transition-colors">
              Mentions légales
            </Link>
            <Link to="/legal#cgv" className="hover:text-foreground transition-colors">
              CGV
            </Link>
            <Link to="/legal#cgu" className="hover:text-foreground transition-colors">
              CGU
            </Link>
            <Link to="/legal#privacy" className="hover:text-foreground transition-colors">
              Confidentialité
            </Link>
            <a href="mailto:contact@apexai.run" className="hover:text-foreground transition-colors">
              Contact
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
};
