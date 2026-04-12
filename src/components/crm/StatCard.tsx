import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  color?: string;
  trend?: number;
}

export default function StatCard({ label, value, icon: Icon, color, trend }: StatCardProps) {
  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl font-bold mt-1">{value.toLocaleString()}</p>
          {trend !== undefined && (
            <p className={cn("text-xs mt-1 font-medium", trend >= 0 ? "text-success" : "text-destructive")}>
              {trend >= 0 ? '+' : ''}{trend}% vs last week
            </p>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", color || "bg-primary/10")}>
          <Icon className={cn("w-5 h-5", color ? "text-card-foreground" : "text-primary")} />
        </div>
      </div>
    </div>
  );
}
