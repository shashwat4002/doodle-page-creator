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
        <div data-comet-section="hero" className="relative">
          {/* Hero texture: subtle star dust grain */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")', backgroundSize: '200px' }} 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-muted/10 pointer-events-none" />
          <HeroSection />
        </div>

        <div data-comet-section="features" className="relative">
          {/* Features texture: cosmic dust with grid */}
          <div className="absolute inset-0 grid-overlay opacity-20 pointer-events-none" />
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")', backgroundSize: '250px' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-muted/10 via-accent/5 to-muted/10 pointer-events-none" />
          <FeaturesSection />
        </div>

        <div data-comet-section="stats" className="relative">
          {/* Stats texture: smooth gradient with subtle grain */}
          <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 512 512\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'1.2\' numOctaves=\'5\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")', backgroundSize: '300px' }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
          <StatsSection />
        </div>

        <div data-comet-section="testimonials" className="relative">
          {/* Testimonials texture: dark academic */}
          <div className="absolute inset-0 grid-overlay opacity-10 pointer-events-none" />
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.75\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")', backgroundSize: '200px' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-muted/10 via-accent/[0.03] to-muted/10 pointer-events-none" />
          <TestimonialsSection />
        </div>

        <div data-comet-section="cta" className="relative">
          {/* CTA texture: warm gradient */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")', backgroundSize: '200px' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-muted/10 pointer-events-none" />
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
