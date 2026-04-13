import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Phone, Plus, Trash2, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AgentPhone {
  id: string;
  phone_number: string;
  label: string;
  is_whatsapp: boolean;
}

interface Props {
  agentId: string;
}

export default function AgentPhoneSection({ agentId }: Props) {
  const [phones, setPhones] = useState<AgentPhone[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ phone_number: '', label: 'Primary', is_whatsapp: true });

  const fetchPhones = async () => {
    const { data } = await supabase
      .from('agent_phone_numbers')
      .select('id, phone_number, label, is_whatsapp')
      .eq('user_id', agentId)
      .order('created_at');
    setPhones(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchPhones(); }, [agentId]);

  const handleAdd = async () => {
    if (!form.phone_number.trim()) {
      toast.error('Phone number is required');
      return;
    }
    setAdding(true);
    const { error } = await supabase.from('agent_phone_numbers').insert({
      user_id: agentId,
      phone_number: form.phone_number.trim(),
      label: form.label.trim() || 'Primary',
      is_whatsapp: form.is_whatsapp,
    });
    if (error) toast.error(error.message);
    else {
      toast.success('Phone number added');
      setForm({ phone_number: '', label: 'Primary', is_whatsapp: true });
      fetchPhones();
    }
    setAdding(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('agent_phone_numbers').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Phone number removed');
      fetchPhones();
    }
  };

  const toggleWhatsApp = async (id: string, current: boolean) => {
    const { error } = await supabase.from('agent_phone_numbers').update({ is_whatsapp: !current }).eq('id', id);
    if (error) toast.error(error.message);
    else fetchPhones();
  };

  return (
    <div className="mt-4 border-t border-border pt-4">
      <div className="flex items-center gap-2 mb-3">
        <Phone className="w-4 h-4 text-primary" />
        <h4 className="text-sm font-semibold">Phone Numbers</h4>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading...</p>
      ) : (
        <>
          {phones.length > 0 && (
            <div className="space-y-2 mb-3">
              {phones.map(ph => (
                <div key={ph.id} className="flex items-center gap-3 bg-muted/50 rounded-lg p-2.5">
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span className="font-medium text-sm">{ph.phone_number}</span>
                    <Badge variant="outline" className="text-xs">{ph.label}</Badge>
                    {ph.is_whatsapp && (
                      <Badge className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                        <MessageCircle className="w-3 h-3 mr-1" />WhatsApp
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">WhatsApp</span>
                      <Switch checked={ph.is_whatsapp} onCheckedChange={() => toggleWhatsApp(ph.id, ph.is_whatsapp)} />
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(ph.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Input
              placeholder="+91 98765 43210"
              className="h-8 text-sm flex-1"
              value={form.phone_number}
              onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))}
            />
            <Input
              placeholder="Label"
              className="h-8 text-sm w-24"
              value={form.label}
              onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
            />
            <div className="flex items-center gap-1">
              <Switch
                checked={form.is_whatsapp}
                onCheckedChange={v => setForm(f => ({ ...f, is_whatsapp: v }))}
              />
              <span className="text-xs text-muted-foreground">WhatsApp</span>
            </div>
            <Button size="sm" className="gap-1 h-8" onClick={handleAdd} disabled={adding}>
              <Plus className="w-3.5 h-3.5" />
              {adding ? '...' : 'Add'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
