import { useState } from 'react';
import { MessageCircle, Send, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import type { Lead } from '@/types/crm';

export interface EyeCentreInfo {
  name: string;
  city: string;
  address: string;
  google_maps_url: string;
}

interface Template {
  id: string;
  label: string;
  category: string;
  message: string;
}

const baseTemplates: Template[] = [
  {
    id: 'intro',
    label: 'Introduction',
    category: 'First Contact',
    message: `Hi {{name}}, this is {{agent}} from our team. Thank you for your interest! I'd love to help you with any questions. When would be a good time to connect?`,
  },
  {
    id: 'eye_centre_referral',
    label: 'Eye Centre Referral',
    category: 'First Contact',
    message: `Hi {{name}}, this is {{agent}}. Thank you for your interest in Lasik surgery! 🏥

We have scheduled your consultation at:

*{{eye_centre_name}}*
📍 {{eye_centre_address}}
📌 Location: {{eye_centre_maps}}

Please visit the centre at your convenience. Feel free to reach out if you need any assistance!`,
  },
  {
    id: 'followup_1',
    label: 'First Follow-up',
    category: 'Follow-up',
    message: `Hi {{name}}, just following up on our earlier conversation. Have you had a chance to think about it? Happy to assist with any queries.`,
  },
  {
    id: 'followup_2',
    label: 'Gentle Reminder',
    category: 'Follow-up',
    message: `Hey {{name}}, hope you're doing well! Just a quick reminder about our discussion. Let me know if you'd like to proceed or need more information.`,
  },
  {
    id: 'not_connected',
    label: 'Missed Call',
    category: 'Not Connected',
    message: `Hi {{name}}, I tried reaching you but couldn't connect. Could you please let me know a convenient time to call? Looking forward to speaking with you.`,
  },
  {
    id: 'offer',
    label: 'Special Offer',
    category: 'Promotion',
    message: `Hi {{name}}! We have an exclusive offer running right now that I think you'd be interested in. Would you like to know more details?`,
  },
  {
    id: 'thank_you',
    label: 'Thank You',
    category: 'Post-Conversion',
    message: `Hi {{name}}, thank you so much for choosing us! We truly appreciate your trust. If you need anything or know someone who could benefit from our services, feel free to reach out anytime.`,
  },
  {
    id: 'reference',
    label: 'Ask for Reference',
    category: 'Post-Conversion',
    message: `Hi {{name}}, hope you're happy with our service! If you know anyone who might benefit, we'd really appreciate a referral. Thank you!`,
  },
];

interface Props {
  lead: Lead;
  agentName?: string;
  eyeCentres?: EyeCentreInfo[];
}

export default function WhatsAppTemplates({ lead, agentName = 'your agent', eyeCentres = [] }: Props) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [editedMessage, setEditedMessage] = useState('');

  // Build dynamic eye centre referral templates if multiple centres
  const templates: Template[] = [...baseTemplates];

  // If lead has multiple eye centres, add one template per centre
  if (eyeCentres.length > 1) {
    eyeCentres.forEach((ec, i) => {
      templates.push({
        id: `eye_centre_referral_${i}`,
        label: `Refer to ${ec.name}`,
        category: 'Eye Centre Referral',
        message: `Hi {{name}}, this is {{agent}}. Thank you for your interest in Lasik surgery! 🏥

We have scheduled your consultation at:

*${ec.name}*
📍 ${ec.address || ec.city}
📌 Location: ${ec.google_maps_url || 'Will be shared'}

Please visit the centre at your convenience. Feel free to reach out if you need any assistance!`,
      });
    });
  }

  const fillTemplate = (msg: string) => {
    let filled = msg
      .replace(/\{\{name\}\}/g, lead.name || 'there')
      .replace(/\{\{agent\}\}/g, agentName);

    // Fill eye centre placeholders with first centre if available
    if (eyeCentres.length > 0) {
      const ec = eyeCentres[0];
      filled = filled
        .replace(/\{\{eye_centre_name\}\}/g, ec.name)
        .replace(/\{\{eye_centre_address\}\}/g, ec.address || ec.city || 'Address to be shared')
        .replace(/\{\{eye_centre_maps\}\}/g, ec.google_maps_url || 'Map link to be shared');
    } else {
      filled = filled
        .replace(/\{\{eye_centre_name\}\}/g, '[Eye Centre Name]')
        .replace(/\{\{eye_centre_address\}\}/g, '[Address]')
        .replace(/\{\{eye_centre_maps\}\}/g, '[Map Link]');
    }

    return filled;
  };

  const openPreview = (template: Template) => {
    setSelectedTemplate(template);
    setEditedMessage(fillTemplate(template.message));
    setPreviewOpen(true);
  };

  const sendMessage = () => {
    const phone = lead.mobile.replace(/\D/g, '');
    const encoded = encodeURIComponent(editedMessage);
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
    setPreviewOpen(false);
  };

  const categories = [...new Set(templates.map(t => t.category))];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full gap-2 text-green-600 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/20">
            <MessageCircle className="w-4 h-4" />
            WhatsApp
            <ChevronDown className="w-3 h-3 ml-auto" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuItem
            onClick={() => window.open(`https://wa.me/${lead.mobile.replace(/\D/g, '')}`, '_blank')}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Open Chat (no template)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {categories.map(cat => (
            <div key={cat}>
              <DropdownMenuLabel className="text-xs text-muted-foreground">{cat}</DropdownMenuLabel>
              {templates.filter(t => t.category === cat).map(t => (
                <DropdownMenuItem key={t.id} onClick={() => openPreview(t)}>
                  <Send className="w-3.5 h-3.5 mr-2" />
                  {t.label}
                </DropdownMenuItem>
              ))}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              {selectedTemplate?.label}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Edit the message before sending. It will open in WhatsApp.</p>
            <Textarea
              value={editedMessage}
              onChange={e => setEditedMessage(e.target.value)}
              rows={8}
              className="resize-none"
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPreviewOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={sendMessage} className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white">
                <Send className="w-4 h-4" />
                Send via WhatsApp
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
