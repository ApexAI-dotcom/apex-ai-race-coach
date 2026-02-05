export const LegalFooter = () => (
  <footer className="border-t border-white/5 bg-card/30 py-6 pb-24 md:pb-6 mt-auto">
    <div className="container mx-auto px-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <div>
          <strong className="text-foreground">Apex AI SARL</strong> • France
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <a
            href="/legal"
            className="hover:text-foreground hover:underline font-medium cursor-pointer"
            target="_self"
          >
            Mentions légales
          </a>
          <span className="text-muted-foreground/60">-</span>
          <a href="/docs/cgv.pdf" className="hover:text-foreground hover:underline">
            CGV
          </a>
          <span className="text-muted-foreground/60">-</span>
          <a href="/docs/cgu.pdf" className="hover:text-foreground hover:underline">
            CGU
          </a>
          <span className="text-muted-foreground/60">-</span>
          <a href="mailto:contact@apexai.run" className="hover:text-foreground hover:underline">
            Contact
          </a>
        </nav>
      </div>
    </div>
  </footer>
);
