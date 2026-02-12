import { useState, useCallback } from 'react';
import { CometField } from '@/components/CometField';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { FeaturesSection } from '@/components/FeaturesSection';
import { StatsSection } from '@/components/StatsSection';
import { TestimonialsSection } from '@/components/TestimonialsSection';
import { CTASection } from '@/components/CTASection';
import { Footer } from '@/components/Footer';
import { ToastNotification } from '@/components/ToastNotification';

const Index = () => {
  const [revealActive, setRevealActive] = useState(false);

  const handleRevealStateChange = useCallback((active: boolean) => {
    setRevealActive(active);
  }, []);

  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden">
      <CometField onRevealStateChange={handleRevealStateChange} />
      
      <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-space" />
      
      <div
        className="transition-opacity duration-700 ease-in-out"
        style={{ opacity: revealActive ? 0 : 1 }}
      >
        <Navbar />
      </div>
      
      <main
        className="relative z-10 transition-opacity duration-700 ease-in-out"
        style={{ opacity: revealActive ? 0 : 1 }}
      >
        <HeroSection />

        <div data-comet-section="features">
          <FeaturesSection />
        </div>

        <div data-comet-section="stats">
          <StatsSection />
        </div>

        <div data-comet-section="testimonials">
          <TestimonialsSection />
        </div>

        <div data-comet-section="cta">
          <CTASection />
        </div>
      </main>
      
      <div
        className="transition-opacity duration-700 ease-in-out"
        style={{ opacity: revealActive ? 0 : 1 }}
      >
        <Footer />
      </div>
      
      <ToastNotification />
    </div>
  );
};

export default Index;
