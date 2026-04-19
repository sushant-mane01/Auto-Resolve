import { Hexagon } from "lucide-react";
import { cn } from "@/lib/utils";

export const Logo = ({ className, compact = false }: { className?: string; compact?: boolean }) => (
  <div className={cn("flex items-center gap-2.5", className)}>
    <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-cyan shadow-glow">
      <Hexagon className="h-5 w-5 text-primary-foreground" strokeWidth={2.4} />
    </div>
    {!compact && (
      <div className="leading-tight">
        <div className="text-[15px] font-semibold tracking-tight text-foreground">
          Auto<span className="text-gradient-cyan">·</span>Resolve
        </div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Support Console</div>
      </div>
    )}
  </div>
);
