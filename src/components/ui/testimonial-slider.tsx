import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

interface Testimonial {
  id: number;
  quote: string;
  name: string;
  username: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    quote: "J'ai gagné 0.8 seconde dès ma première analyse avec APEX AI. C'est magique !",
    name: "Lucas M.",
    username: "@lucas_rotaxdd2",
  },
  {
    id: 2,
    quote:
      "L'analyse des trajectoires est incroyablement précise. Ça change tout pour mon pilotage.",
    name: "Marie D.",
    username: "@marie_dd2",
  },
  {
    id: 3,
    quote:
      "Un boîtier MyChron 5 et ApexAI, c'est le combo parfait. Plus besoin de chercher nos erreurs, l'IA les surligne directement !",
    name: "Pierre G.",
    username: "@pierreg_racer",
  },
  {
    id: 4,
    quote:
      "Le score de performance me permet de fixer des objectifs clairs. Une véritable révolution pour mon entraînement.",
    name: "Sébastien K.",
    username: "@seb_karter",
  },
  {
    id: 5,
    quote:
      "Incroyable. J'ai importé mon CSV, et j'ai instantanément compris pourquoi je perdais du temps dans le double gauche.",
    name: "Thomas B.",
    username: "@thomas_b_kart",
  },
];

const HelmetIcon: React.FC = () => (
  <svg 
    className="w-6 h-6 text-primary"
    viewBox="0 0 100 100" 
    fill="none" 
    stroke="currentColor" 
  >
    <defs>
      {/* Mask to create the transparent cutout circle on the visor */}
      <mask id="visor-mask">
        <rect width="100" height="100" fill="white" />
        <circle cx="49" cy="62" r="4.5" fill="black" />
      </mask>
    </defs>

    {/* Main outer shell contour */}
    <path 
      d="M 78,45 A 36,36 0 1,1 24,84 L 84,84 A 6,6 0 0,0 90,78" 
      stroke="currentColor" 
      strokeWidth="7.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      fill="none" 
    />

    {/* Visor (Solid shape matching the tilted polygon in the image) */}
    <path 
      d="M 43,54 L 78,54 C 81,54 83,56 82,59 L 88,71 C 89,74 87,76 84,76 L 52,76 C 49,76 47,74 46,71 L 40,59 C 39,56 41,54 43,54 Z" 
      fill="currentColor"
      stroke="none"
      mask="url(#visor-mask)"
    />

    {/* Reflection highlights on top-left of shell */}
    <path 
      d="M 28,47 A 26,26 0 0,1 48,25" 
      stroke="currentColor" 
      strokeWidth="6" 
      strokeLinecap="round" 
      fill="none" 
    />

    {/* Air vent dot */}
    <circle cx="21" cy="59" r="4" fill="currentColor" stroke="none" />
  </svg>
);

const getVisibleCount = (width: number): number => {
  if (width >= 1024) return 3;
  if (width >= 768) return 2;
  return 1;
};

const TestimonialSlider: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const [direction, setDirection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      const newWidth = window.innerWidth;
      setWindowWidth(newWidth);

      const oldVisibleCount = getVisibleCount(windowWidth);
      const newVisibleCount = getVisibleCount(newWidth);

      if (oldVisibleCount !== newVisibleCount) {
        const maxIndexForNewWidth = testimonials.length - newVisibleCount;
        if (currentIndex > maxIndexForNewWidth) {
          setCurrentIndex(Math.max(0, maxIndexForNewWidth));
        }
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [windowWidth, currentIndex]);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const startAutoPlay = () => {
      autoPlayRef.current = setInterval(() => {
        const visibleCount = getVisibleCount(windowWidth);
        const maxIndex = testimonials.length - visibleCount;

        if (currentIndex >= maxIndex) {
          setDirection(-1);
          setCurrentIndex((prev) => prev - 1);
        } else if (currentIndex <= 0) {
          setDirection(1);
          setCurrentIndex((prev) => prev + 1);
        } else {
          setCurrentIndex((prev) => prev + direction);
        }
      }, 4000);
    };

    startAutoPlay();

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, currentIndex, windowWidth, direction]);

  const visibleCount = getVisibleCount(windowWidth);
  const maxIndex = testimonials.length - visibleCount;
  const canGoNext = currentIndex < maxIndex;
  const canGoPrev = currentIndex > 0;

  const goNext = () => {
    if (canGoNext) {
      setDirection(1);
      setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
      pauseAutoPlay();
    }
  };

  const goPrev = () => {
    if (canGoPrev) {
      setDirection(-1);
      setCurrentIndex((prev) => Math.max(prev - 1, 0));
      pauseAutoPlay();
    }
  };

  const pauseAutoPlay = () => {
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 8000);
  };

  const handleDragEnd = (event: any, info: any) => {
    const { offset } = info;
    const swipeThreshold = 30;

    if (offset.x < -swipeThreshold && canGoNext) {
      goNext();
    } else if (offset.x > swipeThreshold && canGoPrev) {
      goPrev();
    }
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    pauseAutoPlay();
  };

  return (
    <div className="px-4 py-16 sm:py-24 bg-gradient-to-b from-background via-background/95 to-background overflow-hidden relative border-t border-white/5">
      {/* Decorative blurs */}
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[150px] -mr-32 -mt-32 pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium text-xs sm:text-sm uppercase tracking-wider">
            Témoignages
          </span>
          <h3 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mt-4 px-4">
            Ce qu'en disent les <span className="text-gradient-primary">pilotes</span>
          </h3>
          <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-primary to-orange-500 mx-auto mt-4 sm:mt-6"></div>
        </motion.div>

        <div className="relative" ref={containerRef}>
          <div className="flex justify-center sm:justify-end sm:absolute sm:-top-20 right-0 space-x-2 mb-6 sm:mb-0">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={goPrev}
              disabled={!canGoPrev}
              className={`p-2 sm:p-3 rounded-full border transition-all duration-300 ${
                canGoPrev
                  ? "bg-secondary border-white/10 hover:bg-secondary/80 text-foreground shadow-md"
                  : "bg-white/5 border-white/5 text-muted-foreground/45 cursor-not-allowed opacity-50"
              }`}
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={goNext}
              disabled={!canGoNext}
              className={`p-2 sm:p-3 rounded-full border transition-all duration-300 ${
                canGoNext
                  ? "bg-secondary border-white/10 hover:bg-secondary/80 text-foreground shadow-md"
                  : "bg-white/5 border-white/5 text-muted-foreground/45 cursor-not-allowed opacity-50"
              }`}
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>

          <div className="overflow-hidden relative px-1 sm:px-0">
            <motion.div
              className="flex"
              animate={{ x: `-${currentIndex * (100 / visibleCount)}%` }}
              transition={{
                type: "spring",
                stiffness: 70,
                damping: 20,
              }}
            >
              {testimonials.map((testimonial) => (
                <motion.div
                  key={testimonial.id}
                  className={`flex-shrink-0 w-full ${
                    visibleCount === 3 ? "md:w-1/3" : visibleCount === 2 ? "md:w-1/2" : "w-full"
                  } p-3`}
                  initial={{ opacity: 0.5, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={handleDragEnd}
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.98, cursor: "grabbing" }}
                  style={{ cursor: "grab" }}
                >
                  <motion.div
                    className="relative overflow-hidden rounded-2xl p-6 sm:p-8 h-full glass-card border border-white/5 shadow-lg"
                    whileHover={{
                      borderColor: "rgba(249, 115, 22, 0.3)",
                      boxShadow: "0 10px 30px -10px rgba(249, 115, 22, 0.15)",
                    }}
                  >
                    <div className="absolute -top-4 -left-4 opacity-5 pointer-events-none">
                      <Quote size={windowWidth < 640 ? 50 : 80} className="text-primary" />
                    </div>

                    <div className="relative z-10 h-full flex flex-col justify-between">
                      <p className="text-base text-foreground/90 font-medium mb-6 leading-relaxed italic">
                        &ldquo;{testimonial.quote}&rdquo;
                      </p>

                      <div className="pt-4 border-t border-white/5">
                        <div className="flex items-center">
                          <div className="relative flex-shrink-0 w-10 h-10 rounded-full border border-primary/20 bg-primary/5 shadow-inner flex items-center justify-center overflow-hidden">
                            <HelmetIcon />
                            <motion.div
                              className="absolute inset-0 rounded-full bg-primary/10"
                              animate={{
                                scale: [1, 1.3, 1],
                                opacity: [0, 0.4, 0],
                              }}
                              transition={{
                                duration: 2.5,
                                repeat: Infinity,
                                repeatDelay: 1,
                              }}
                            />
                          </div>
                          <div className="ml-3 text-left">
                            <h4 className="font-bold text-base text-foreground">
                              {testimonial.name}
                            </h4>
                            <p className="text-muted-foreground text-xs sm:text-sm font-light">
                              {testimonial.username}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <div className="flex justify-center mt-8">
            {Array.from({ length: testimonials.length - visibleCount + 1 }, (_, index) => (
              <motion.button
                key={index}
                onClick={() => goToSlide(index)}
                className="relative mx-1.5 focus:outline-none"
                whileHover={{ scale: 1.25 }}
                whileTap={{ scale: 0.95 }}
                aria-label={`Go to testimonial ${index + 1}`}
              >
                <motion.div
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    index === currentIndex ? "bg-primary" : "bg-white/20"
                  }`}
                  animate={{
                    scale: index === currentIndex ? [1, 1.15, 1] : 1,
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: index === currentIndex ? Infinity : 0,
                    repeatDelay: 1,
                  }}
                />
                {index === currentIndex && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-primary/30"
                    animate={{
                      scale: [1, 1.8],
                      opacity: [1, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                    }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestimonialSlider;
