import { type Sentiment, type Urgency } from "@/lib/api";
import { ArrowDownRight, ArrowUpRight, Flame, Minus, ShieldAlert, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export const SentimentBadge = ({ value }: { value?: Sentiment }) => {
  if (!value) return null;
  const cfg = {
    positive: { label: "Positive", icon: ArrowUpRight, cls: "text-emerald-400 border-emerald-400/20 bg-emerald-400/5" },
    neutral: { label: "Neutral", icon: Minus, cls: "text-muted-foreground border-border-strong bg-secondary/40" },
    negative: { label: "Negative", icon: ArrowDownRight, cls: "text-rose-400 border-rose-400/20 bg-rose-400/5" },
  }[value];
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider", cfg.cls)}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
};

export const UrgencyBadge = ({ value }: { value?: Urgency }) => {
  if (!value) return null;
  const cfg = {
    low: { label: "Low", icon: Minus, cls: "text-muted-foreground border-border-strong bg-secondary/40" },
    medium: { label: "Medium", icon: Zap, cls: "text-amber-400 border-amber-400/20 bg-amber-400/5" },
    high: { label: "High", icon: Flame, cls: "text-amber-400 border-amber-400/30 bg-amber-400/10" },
    critical: { label: "Critical", icon: ShieldAlert, cls: "text-rose-400 border-rose-400/30 bg-rose-400/10" },
  }[value];
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider", cfg.cls)}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
};

export const ConfidenceBar = ({ value }: { value: number }) => {
  const tone =
    value >= 85 ? "bg-emerald-400" : value >= 70 ? "bg-primary" : value >= 50 ? "bg-amber-400" : "bg-rose-400";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 rounded-full bg-secondary/60 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[11px] font-medium tabular-nums text-muted-foreground">{value}%</span>
    </div>
  );
};
