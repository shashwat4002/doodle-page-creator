import { memo } from 'react';
import { ResearchCharacters } from '@/components/ResearchCharacters';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayoutComponent = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel — form (white/dark themed) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">{children}</div>
      </div>

      {/* Right panel — characters on vibrant background */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center overflow-hidden bg-primary">
        {/* Decorative doodle lines */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.12]" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="400" cy="400" r="300" stroke="white" strokeWidth="2" />
          <circle cx="400" cy="400" r="200" stroke="white" strokeWidth="1.5" />
          <path d="M 100 200 Q 300 100 500 250 T 750 300" stroke="white" strokeWidth="1.5" />
          <path d="M 50 500 Q 200 400 400 550 T 780 450" stroke="white" strokeWidth="1.5" />
          <path d="M 200 700 Q 400 600 600 700" stroke="white" strokeWidth="1.5" />
          {/* Sparkle crosses */}
          <g stroke="white" strokeWidth="1.5">
            <line x1="150" y1="150" x2="170" y2="150" /><line x1="160" y1="140" x2="160" y2="160" />
            <line x1="650" y1="200" x2="670" y2="200" /><line x1="660" y1="190" x2="660" y2="210" />
            <line x1="600" y1="600" x2="620" y2="600" /><line x1="610" y1="590" x2="610" y2="610" />
            <line x1="200" y1="500" x2="220" y2="500" /><line x1="210" y1="490" x2="210" y2="510" />
          </g>
          {/* Small triangles */}
          <polygon points="700,150 710,130 720,150" stroke="white" strokeWidth="1.5" fill="none" />
          <polygon points="100,650 110,630 120,650" stroke="white" strokeWidth="1.5" fill="none" />
        </svg>

        {/* Characters */}
        <div className="relative z-10 flex flex-col items-center gap-6 px-8">
          <ResearchCharacters />
          <div className="text-center space-y-2">
            <p className="text-primary-foreground/80 text-sm italic">
              "a quiet digital observatory for those who explore, discover, and push boundaries."
            </p>
            <p className="text-primary-foreground/50 text-xs">SochX Research Community</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AuthLayout = memo(AuthLayoutComponent);
