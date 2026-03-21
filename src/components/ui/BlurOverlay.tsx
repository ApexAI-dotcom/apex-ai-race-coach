import React from "react";
import { Button } from "./button";
import { Lock } from "lucide-react";

interface BlurOverlayProps {
  isLocked: boolean;
  ctaTitle: string;
  ctaButtonText: string;
  onCtaClick?: () => void;
  children: React.ReactNode;
}

export const BlurOverlay: React.FC<BlurOverlayProps> = ({
  isLocked,
  ctaTitle,
  ctaButtonText,
  onCtaClick,
  children,
}) => {
  return (
    <div className="relative w-full overflow-hidden rounded-xl group">
      <div className={isLocked ? "blur-md pointer-events-none select-none" : ""}>
        {children}
      </div>
      
      {isLocked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-md rounded-xl z-10 p-4 min-h-max text-center animate-in fade-in duration-500">
          <div className="bg-red-600/20 p-3 rounded-full mb-4 border border-red-500/50">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">{ctaTitle}</h3>
          <p className="text-gray-300 text-sm mb-6 max-w-[250px]">
            Débloquez toutes les analyses et visualisez vos performances complètes.
          </p>
          <Button 
            onClick={onCtaClick}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-6 px-8 rounded-full shadow-lg shadow-red-900/40 transform transition hover:scale-105 active:scale-95"
          >
            {ctaButtonText}
          </Button>
        </div>
      )}
    </div>
  );
};
