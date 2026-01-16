import { Navbar } from "@/components/landing/navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { ProcessSection } from "@/components/landing/process-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { SocialProofSection } from "@/components/landing/social-proof-section";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar />
      <main className="flex-1 pt-16">
        <HeroSection />
        <ProcessSection />
        <FeaturesSection />
        <SocialProofSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
