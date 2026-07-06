import { ArrowUpRight } from "lucide-react";

interface HeroSectionProps {
  onExplorePackages: () => void;
}

export default function HeroSection({ onExplorePackages }: HeroSectionProps) {
  return (
    <main className="mt-auto relative z-20 pb-4 w-full">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 lg:gap-20">
        {/* Bottom Left - Big Typography */}
        <div className="flex flex-col -space-y-1 md:-space-y-3">
          <h1 className="text-white text-[60px] md:text-[84px] lg:text-[110px] font-light tracking-[-0.02em] leading-[0.85] drop-shadow-2xl font-display italic">
            Capturing
          </h1>
          <h1
            className="text-transparent text-[60px] md:text-[84px] lg:text-[110px] font-light tracking-[-0.02em] leading-[0.85] drop-shadow-2xl font-display opacity-80"
            style={{
              WebkitTextStroke: "1px rgba(255, 255, 255, 0.85)",
            }}
          >
            the Moment
          </h1>
        </div>

        {/* Bottom Right - Description & CTA */}
        <div className="flex flex-col items-start lg:items-end text-left lg:text-right max-w-md gap-6 lg:gap-8">
          <p className="text-white/95 text-sm md:text-[15px] lg:text-[16px] leading-relaxed font-light drop-shadow-md">
            Welcome to <span className="text-[#a1c398] font-semibold">Framez.my</span>. High-end photobooth experiences designed for your most precious events in Malaysia. Professional instant prints & bespoke backdrops.
          </p>
          
          <button
            onClick={onExplorePackages}
            className="group flex justify-between items-center w-full sm:w-[240px] p-2 pl-6 rounded-full font-medium text-black bg-white hover:bg-gray-50 transition-all duration-300 shadow-xl"
          >
            <span className="font-semibold text-xs tracking-wider uppercase">Explore Packages</span>
            <span className="w-10 h-10 rounded-full bg-[#799351] flex items-center justify-center text-white group-hover:bg-[#5f743e] transition-colors">
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
            </span>
          </button>
        </div>
      </div>
    </main>
  );
}
