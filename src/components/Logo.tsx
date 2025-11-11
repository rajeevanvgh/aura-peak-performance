interface LogoProps {
  size?: 'small' | 'medium' | 'large' | 'hero';
  className?: string;
  animate?: boolean;
}

export const Logo = ({ size = 'medium', className = '', animate = false }: LogoProps) => {
  const sizes = {
    small: 'h-8',      // 32px
    medium: 'h-12',    // 48px
    large: 'h-20',     // 80px
    hero: 'h-24 md:h-30'  // 96px mobile, 120px desktop
  };

  return (
    <img
      src="/logo-new.png"
      alt="AuraQ - Fitness Tracker"
      className={`w-auto object-contain transition-all duration-300 hover:scale-105 ${sizes[size]} ${animate ? 'animate-pulse-slow' : ''} ${className}`}
    />
  );
};
