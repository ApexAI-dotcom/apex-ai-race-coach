"use client";

import React, { useEffect, useRef } from "react";

interface SparklesProps {
  className?: string;
  size?: number;
  minSize?: number | null;
  density?: number;
  speed?: number;
  minSpeed?: number | null;
  opacity?: number;
  opacitySpeed?: number;
  minOpacity?: number | null;
  color?: string;
  background?: string;
  options?: any;
  direction?: string;
}

export function Sparkles({
  className,
  size = 1.5,
  density = 100,
  speed = 1,
  color = "#FFFFFF",
  direction = "bottom",
}: SparklesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    // Handle resize
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", handleResize);

    // Particle class
    class Particle {
      x = Math.random() * width;
      y = Math.random() * height;
      particleSize = Math.random() * size + 0.5;
      speedX = (Math.random() - 0.5) * speed * 0.4;
      speedY =
        direction === "bottom"
          ? Math.random() * speed * 0.6 + 0.2
          : -Math.random() * speed * 0.6 - 0.2;
      opacity = Math.random() * 0.7 + 0.3;
      fadeDirection = Math.random() > 0.5 ? 1 : -1;
      fadeSpeed = 0.005 + Math.random() * 0.01;

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Opacity animation (shimmer)
        this.opacity += this.fadeSpeed * this.fadeDirection;
        if (this.opacity > 1) {
          this.opacity = 1;
          this.fadeDirection = -1;
        } else if (this.opacity < 0.2) {
          this.opacity = 0.2;
          this.fadeDirection = 1;
        }

        // Boundary reset
        if (direction === "bottom") {
          if (this.y > height) {
            this.y = 0;
            this.x = Math.random() * width;
          }
        } else {
          if (this.y < 0) {
            this.y = height;
            this.x = Math.random() * width;
          }
        }

        if (this.x < 0 || this.x > width) {
          this.x = Math.random() * width;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.particleSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Adapt particle count to density (cap at 200 for maximum performance)
    const particlesCount = Math.min(Math.floor(density / 6), 200);
    const particles: Particle[] = [];
    for (let i = 0; i < particlesCount; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      for (const particle of particles) {
        particle.update();
        particle.draw();
      }
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [color, density, speed, direction, size]);

  return <canvas ref={canvasRef} className={className} style={{ pointerEvents: "none" }} />;
}
