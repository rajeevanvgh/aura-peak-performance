interface ProgressRingProps {
  progress: number;
  size?: number;
}

export const ProgressRing = ({ progress, size = 120 }: ProgressRingProps) => {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle 
          cx={size/2} 
          cy={size/2} 
          r={radius} 
          stroke="rgba(255,255,255,0.1)" 
          strokeWidth="8" 
          fill="none" 
        />
        <circle 
          cx={size/2} 
          cy={size/2} 
          r={radius} 
          stroke="hsl(var(--auro-gold))" 
          strokeWidth="8" 
          fill="none" 
          strokeDasharray={circumference} 
          strokeDashoffset={offset} 
          className="transition-all duration-500" 
          strokeLinecap="round" 
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-stats font-bold text-foreground">{progress}%</span>
      </div>
    </div>
  );
};
