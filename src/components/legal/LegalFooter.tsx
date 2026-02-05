import { Link, useNavigate } from "react-router-dom";

export const LegalFooter = () => {
  const navigate = useNavigate();

  const navigateToLegal = (e: React.MouseEvent, hash?: string) => {
    e.preventDefault();
    navigate(hash ? `/legal${hash}` : "/legal");
  };

  return (
    <footer className="border-t border-white/5 bg-card/30 py-6 pb-24 md:pb-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div>
            <strong className="text-foreground">Apex AI SARL</strong> • France
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link
              to="/legal"
              onClick={(e) => navigateToLegal(e)}
              className="hover:text-foreground transition-colors"
            >
              Mentions légales
            </Link>
            <Link
              to="/legal#cgv"
              onClick={(e) => navigateToLegal(e, "#cgv")}
              className="hover:text-foreground transition-colors"
            >
              CGV
            </Link>
            <Link
              to="/legal#cgu"
              onClick={(e) => navigateToLegal(e, "#cgu")}
              className="hover:text-foreground transition-colors"
            >
              CGU
            </Link>
            <Link
              to="/legal#privacy"
              onClick={(e) => navigateToLegal(e, "#privacy")}
              className="hover:text-foreground transition-colors"
            >
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
