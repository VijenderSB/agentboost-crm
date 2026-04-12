import { useEffect, useState } from 'react';
import { MessageSquare, ArrowRightLeft, CalendarCheck, Activity, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TimelineEvent {
  id: string;
  type: 'activity' | 'assignment' | 'followup';
  icon: 'note' | 'status' | 'assignment' | 'followup' | 'followup_done';
  title: string;
  description: string;
  date: string;
  actor?: string;
}

interface Props {
  leadId: string;
}

export default function LeadTimeline({ leadId }: Props) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      const [{ data: activities }, { data: assignments }, { data: followups }, { data: profiles }] = await Promise.all([
        supabase.from('lead_activities').select('*').eq('lead_id', leadId).order('created_at', { ascending: false }),
        supabase.from('lead_assignments').select('*').eq('lead_id', leadId).order('created_at', { ascending: false }),
        supabase.from('followups').select('*').eq('lead_id', leadId).order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, name'),
      ]);

      const nameMap = new Map((profiles || []).map((p: any) => [p.id, p.name]));

      const timeline: TimelineEvent[] = [];

      (activities || []).forEach((a: any) => {
        const isNote = a.activity_type === 'note';
        timeline.push({
          id: `act-${a.id}`,
          type: 'activity',
          icon: isNote ? 'note' : 'status',
          title: isNote ? 'Note added' : a.activity_type,
          description: a.remarks || '',
          date: a.created_at,
          actor: nameMap.get(a.user_id) || 'System',
        });
      });

      (assignments || []).forEach((a: any) => {
        timeline.push({
          id: `asgn-${a.id}`,
          type: 'assignment',
          icon: 'assignment',
          title: 'Lead reassigned',
          description: `Assigned to ${nameMap.get(a.assigned_to) || 'Unknown'}`,
          date: a.created_at,
          actor: nameMap.get(a.assigned_by) || 'System',
        });
      });

      (followups || []).forEach((f: any) => {
        timeline.push({
          id: `fu-${f.id}`,
          type: 'followup',
          icon: f.completed ? 'followup_done' : 'followup',
          title: f.completed ? 'Follow-up completed' : 'Follow-up scheduled',
          description: `Due: ${new Date(f.followup_date).toLocaleDateString()}`,
          date: f.created_at,
          actor: nameMap.get(f.assigned_to) || 'Unknown',
        });
      });

      timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setEvents(timeline);
      setLoading(false);
    };

    fetchTimeline();
  }, [leadId]);

  const iconMap = {
    note: <MessageSquare className="w-3.5 h-3.5" />,
    status: <Activity className="w-3.5 h-3.5" />,
    assignment: <ArrowRightLeft className="w-3.5 h-3.5" />,
    followup: <CalendarCheck className="w-3.5 h-3.5" />,
    followup_done: <CheckCircle2 className="w-3.5 h-3.5" />,
  };

  const colorMap = {
    note: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    status: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    assignment: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    followup: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    followup_done: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading timeline...</p>;

  if (events.length === 0) return <p className="text-sm text-muted-foreground">No activity yet</p>;

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[15px] top-4 bottom-0 w-px bg-border" />

      <div className="space-y-4">
        {events.map(event => (
          <div key={event.id} className="relative flex gap-3">
            <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${colorMap[event.icon]}`}>
              {iconMap[event.icon]}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-medium">{event.title}</p>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                  {new Date(event.date).toLocaleDateString()}
                </span>
              </div>
              {event.description && (
                <p className="text-sm text-muted-foreground mt-0.5 break-words">{event.description}</p>
              )}
              {event.actor && (
                <p className="text-xs text-muted-foreground mt-0.5">by {event.actor}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
