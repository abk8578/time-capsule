import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import LandingGsapProvider from "@/components/landing/LandingGsapProvider";
import NightSkyBackground from "@/components/nightsky/NightSkyBackground";
import LandingHero from "@/components/landing/LandingHero";
import GsapFeatures from "@/components/landing/GsapFeatures";
import InteractiveDemo from "@/components/landing/InteractiveDemo";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import UseCasesSection from "@/components/landing/UseCasesSection";
import SecurityBanner from "@/components/landing/SecurityBanner";
import FaqAccordion from "@/components/landing/FaqAccordion";
import FinalCtaSection from "@/components/landing/FinalCtaSection";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <LandingGsapProvider>
      <div className="relative isolate flex flex-1 flex-col items-center justify-center overflow-hidden bg-bg text-text transition-colors duration-200">
        {/* Fixed Pristine Starfield (active in dark mode) */}
        <NightSkyBackground />

        {/* 1. Interactive 3D Sealed Time Capsule Hero with FlipWords & Cosmic Typography */}
        <LandingHero />

        {/* 2. Interactive Live Capsule Simulator (Sealed vs Unlocked Preview) */}
        <InteractiveDemo />

        {/* 3. Three Pillars of Cryptographic Sealing Revealed with GSAP */}
        <GsapFeatures />

        {/* 4. Three-Step Alternating Process (Left / Bottom / Right Slide-Ins) */}
        <HowItWorksSection />

        {/* 5. Use Cases & Story Scenarios Grid */}
        <UseCasesSection />

        {/* 6. Cryptographic & Server Security Guarantee Banner */}
        <SecurityBanner />

        {/* 7. Frequently Asked Questions Accordion */}
        <FaqAccordion />

        {/* 8. Final Celestial Call to Action Portal */}
        <FinalCtaSection />
      </div>
    </LandingGsapProvider>
  );
}
