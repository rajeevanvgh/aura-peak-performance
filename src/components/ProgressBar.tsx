import { cn } from "@/lib/utils";

interface ProgressBarProps {
  progress: number;
  className?: string;
}

export const ProgressBar = ({ progress, className = '' }: ProgressBarProps) => (
  <div className={cn("w-full bg-white/10 rounded-full h-3 overflow-hidden", className)}>
    <div 
      className="h-full bg-gradient-to-r from-auro-gold to-electric-blue transition-all duration-500 rounded-full" 
      style={{ width: `${progress}%` }} 
    />
  </div>
);
