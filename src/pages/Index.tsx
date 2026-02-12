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
  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden">
      {/* Advanced Comet Interaction System */}
      <CometField />
      
      {/* Ambient background layers */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-space" />
      
      {/* Fixed Navbar */}
      <Navbar />
      
      {/* Main Content */}
      <main className="relative z-10">
        <div data-comet-section="hero">
          <HeroSection />
        </div>

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
      
      {/* Footer */}
      <Footer />
      
      {/* Floating Toast Notifications */}
      <ToastNotification />
    </div>
  );
};

export default Index;
