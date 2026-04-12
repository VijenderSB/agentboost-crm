import { cn } from '@/lib/utils';
import type { LeadStatus, LeadTemperature } from '@/types/crm';

const statusStyles: Record<LeadStatus, string> = {
  fresh: 'bg-status-fresh/15 text-status-fresh',
  connected: 'bg-status-connected/15 text-status-connected',
  not_connected: 'bg-status-not-connected/15 text-status-not-connected',
  followup: 'bg-status-followup/15 text-status-followup',
};

const tempStyles: Record<LeadTemperature, string> = {
  super_hot: 'bg-temp-super-hot/15 text-temp-super-hot',
  hot: 'bg-temp-hot/15 text-temp-hot',
  warm: 'bg-temp-warm/15 text-temp-warm',
  cold: 'bg-temp-cold/15 text-temp-cold',
  junk: 'bg-temp-junk/15 text-temp-junk',
  success: 'bg-temp-success/15 text-temp-success',
  lost: 'bg-temp-lost/15 text-temp-lost',
};

const statusLabels: Record<LeadStatus, string> = {
  fresh: 'Fresh',
  connected: 'Connected',
  not_connected: 'Not Connected',
  followup: 'Follow-up',
};

const tempLabels: Record<LeadTemperature, string> = {
  super_hot: '🔥 Super Hot',
  hot: 'Hot',
  warm: 'Warm',
  cold: 'Cold',
  junk: 'Junk',
  success: '✅ Success',
  lost: 'Lost',
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold", statusStyles[status])}>
      {statusLabels[status]}
    </span>
  );
}

export function TemperatureBadge({ temperature }: { temperature: LeadTemperature }) {
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold", tempStyles[temperature])}>
      {tempLabels[temperature]}
    </span>
  );
}
