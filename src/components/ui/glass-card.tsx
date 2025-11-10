import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const GlassCard = ({ children, className = '', hover = false, ...props }: GlassCardProps) => (
  <div 
    className={cn(
      "bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 transition-all duration-300",
      hover && "hover:bg-white/10 hover:scale-105 hover:shadow-xl hover:shadow-auro-gold/20",
      className
    )}
    {...props}
  >
    {children}
  </div>
);
