import { Phone, MessageCircle, Clock, User } from 'lucide-react';
import { LeadStatusBadge, TemperatureBadge } from './StatusBadge';
import type { Lead } from '@/types/crm';
import { Link } from 'react-router-dom';

interface LeadCardProps {
  lead: Lead;
}

export default function LeadCard({ lead }: LeadCardProps) {
  return (
    <Link 
      to={`/leads/${lead.id}`}
      className="block stat-card group cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
            {lead.name || 'Unknown'}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{lead.mobile}</p>
        </div>
        <TemperatureBadge temperature={lead.temperature} />
      </div>

      <div className="flex items-center gap-2 mb-3">
        <LeadStatusBadge status={lead.status} />
        <span className="text-xs text-muted-foreground">{lead.city}</span>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="capitalize">{lead.source.replace('_', ' ')}</span>
        {lead.followup_date && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(lead.followup_date).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Quick actions for mobile */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
        <a
          href={`tel:${lead.mobile}`}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-success/10 text-success text-xs font-medium hover:bg-success/20 transition-colors"
        >
          <Phone className="w-3.5 h-3.5" />
          Call
        </a>
        <a
          href={`https://wa.me/${lead.mobile.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          WhatsApp
        </a>
      </div>
    </Link>
  );
}
