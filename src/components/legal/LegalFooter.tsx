const linkClass =
  "hover:text-foreground cursor-pointer text-sm text-muted-foreground transition-all relative z-10 select-none";

export const LegalFooter = () => {
  const goTo = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = path;
  };

  return (
    <footer className="border-t border-white/5 bg-card/30 py-6 pb-24 md:pb-6 mt-auto relative z-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div>
            <strong className="text-foreground">Apex AI SARL</strong> • France
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <a
              href="/legal"
              onClick={goTo("/legal")}
              className={linkClass}
              role="link"
              tabIndex={0}
            >
              Mentions légales
            </a>
            <a
              href="/legal#cgv"
              onClick={goTo("/legal#cgv")}
              className={linkClass}
              role="link"
              tabIndex={0}
            >
              CGV
            </a>
            <a
              href="/legal#cgu"
              onClick={goTo("/legal#cgu")}
              className={linkClass}
              role="link"
              tabIndex={0}
            >
              CGU
            </a>
            <a
              href="/legal#privacy"
              onClick={goTo("/legal#privacy")}
              className={linkClass}
              role="link"
              tabIndex={0}
            >
              Confidentialité
            </a>
            <a href="mailto:contact@apexai.run" className={linkClass}>
              Contact
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
};
