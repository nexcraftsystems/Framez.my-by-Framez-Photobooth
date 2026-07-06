import React, { useRef, useEffect } from "react";

export default function BackgroundVideo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !glowRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }

      animationFrameId.current = requestAnimationFrame(() => {
        if (glowRef.current) {
          glowRef.current.style.setProperty("--mx", `${x}px`);
          glowRef.current.style.setProperty("--my", `${y}px`);
          glowRef.current.style.setProperty("--r", "220px");
        }
      });
    };

    const handleMouseLeave = () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (glowRef.current) {
        glowRef.current.style.setProperty("--r", "0px");
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("mouseleave", handleMouseLeave);
      }
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  return (
    <div id="bg-video-container" ref={containerRef} className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-[#0c0c0e]">
      {/* Video element */}
      <video
        src="https://cdn.sceneai.art/backgrounds/e102a51c-c095-492e-b909-72bb753f83a2.mov"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-65 scale-105"
      />
      
      {/* Editorial aesthetic gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#2d1b0d]/40 via-transparent to-[#0c0c0e] z-[1] pointer-events-none" />

      {/* Interactive Organic Glow Effect with theme-matched colors */}
      <div
        ref={glowRef}
        id="cursor-glow-layer"
        className="absolute inset-0 z-10 pointer-events-none transition-[--r] duration-1000"
        style={{
          "--mx": "0px",
          "--my": "0px",
          "--r": "0px",
          background: "radial-gradient(var(--r) circle at var(--mx) var(--my), rgba(121, 147, 81, 0.28) 0%, rgba(240, 152, 25, 0.12) 50%, transparent 100%)",
          transition: "background 0.8s cubic-bezier(0.25, 1, 0.5, 1)",
        } as React.CSSProperties}
      />
    </div>
  );
}
