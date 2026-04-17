/**
 * TrackMapPro — Fullscreen wrapper
 */

interface TrackMapFullscreenProps {
  isFullscreen: boolean;
  toggle: () => void;
}

export function TrackMapFullscreen({ isFullscreen, toggle }: TrackMapFullscreenProps) {
  return (
    <button
      onClick={toggle}
      className="absolute top-2 right-2 z-30 p-1.5 rounded-md bg-secondary/80 border border-white/10 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all text-xs"
      title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
    >
      {isFullscreen ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3v3a2 2 0 01-2 2H3" /><path d="M21 8h-3a2 2 0 01-2-2V3" />
          <path d="M3 16h3a2 2 0 012 2v3" /><path d="M16 21v-3a2 2 0 012-2h3" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3H5a2 2 0 00-2 2v3" /><path d="M21 8V5a2 2 0 00-2-2h-3" />
          <path d="M3 16v3a2 2 0 002 2h3" /><path d="M16 21h3a2 2 0 002-2v-3" />
        </svg>
      )}
    </button>
  );
}
