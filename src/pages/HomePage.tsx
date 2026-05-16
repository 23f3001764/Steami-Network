import { motion, AnimatePresence } from 'framer-motion';
import { LandingHero } from '@/components/landing/LandingHero';
import { EcosystemSection } from '@/components/home/intelligence-ecosystem/EcosystemSection';
import { IntelligenceSystems } from '@/components/home/intelligence-systems/IntelligenceSystems';
import { FeatureShowcase } from '@/components/landing/FeatureShowcase';
import { WorkflowSection } from '@/components/home/workflow/WorkflowSection';
import { BrandSection } from '@/components/landing/BrandSection';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { SteamiNav } from '@/components/SteamiNav';
import { Footer } from '@/components/Footer';
import { StarBackground } from '@/components/StarBackground';
import { IntelligenceTicker } from '@/components/home/intelligence-ticker/IntelligenceTicker';
import { useThemeStore } from '@/stores/theme-store';

const HomePage = () => {
  const isLight = useThemeStore((s) => s.theme === 'light');

  return (
    <div className="relative min-h-screen transition-colors duration-500 home-page-scope">
      {/* Background Star System */}
      <StarBackground />
      
      {/* Global Navigation */}
      <SteamiNav />

      {/* Main Content Sections */}
      <main className="relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            {/* 1. HERO SECTION */}
            <LandingHero />

            {/* INTEL TICKER SECTION */}
            <IntelligenceTicker />

            {/* 2. CONTENT ECOSYSTEM SECTION */}
            <EcosystemSection />

            {/* 3. INTELLIGENCE MAPS SECTION */}
            <IntelligenceSystems />

            {/* 4. FEATURE SHOWCASE SECTION */}
            <FeatureShowcase />

            {/* 5. HOW STEAMI WORKS SECTION */}
            <WorkflowSection />

            {/* 6. EMOTIONAL BRAND SECTION */}
            <BrandSection />

            {/* 7. FINAL CTA SECTION */}
            <FinalCTA />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Global Footer */}
      <Footer />
      
      {/* Custom Styles for this page only */}
      <style dangerouslySetInnerHTML={{ __html: `
        body {
          overflow-x: hidden;
        }
        
        .steami-heading {
          font-family: 'VT323', monospace;
        }
      `}} />
    </div>
  );
};

export default HomePage;
