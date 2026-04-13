import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Phone, Plus, Trash2, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AgentPhone {
  id: string;
  phone_number: string;
  label: string;
  is_whatsapp: boolean;
}

export default function AgentPhoneManager() {
  const { user } = useAuth();
  const [phones, setPhones] = useState<AgentPhone[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ phone_number: '', label: 'Primary', is_whatsapp: true });

  const fetchPhones = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('agent_phone_numbers')
      .select('id, phone_number, label, is_whatsapp')
      .eq('user_id', user.id)
      .order('created_at');
    setPhones(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchPhones(); }, [user]);

  const handleAdd = async () => {
    if (!user || !form.phone_number.trim()) {
      toast.error('Phone number is required');
      return;
    }
    setAdding(true);
    const { error } = await supabase.from('agent_phone_numbers').insert({
      user_id: user.id,
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
    <div className="bg-card rounded-xl border border-border p-5 space-y-4 mt-6">
      <div className="flex items-center gap-2">
        <Phone className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">My Phone Numbers</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Add your phone numbers for calling and WhatsApp messaging with leads. Numbers marked as WhatsApp-enabled will be used to send messages.
      </p>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : phones.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No phone numbers added yet.</p>
      ) : (
        <div className="space-y-2">
          {phones.map(ph => (
            <div key={ph.id} className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{ph.phone_number}</span>
                  <Badge variant="outline" className="text-xs">{ph.label}</Badge>
                  {ph.is_whatsapp && (
                    <Badge className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                      <MessageCircle className="w-3 h-3 mr-1" />
                      WhatsApp
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">WA</span>
                  <Switch
                    checked={ph.is_whatsapp}
                    onCheckedChange={() => toggleWhatsApp(ph.id, ph.is_whatsapp)}
                  />
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(ph.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-border pt-4 space-y-3">
        <h4 className="text-sm font-medium">Add New Number</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Phone Number</Label>
            <Input
              placeholder="+91 98765 43210"
              value={form.phone_number}
              onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))}
            />
          </div>
          <div>
            <Label className="text-xs">Label</Label>
            <Input
              placeholder="e.g. Primary, Office"
              value={form.label}
              onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
            />
          </div>
          <div className="flex items-end gap-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_whatsapp}
                onCheckedChange={v => setForm(f => ({ ...f, is_whatsapp: v }))}
              />
              <Label className="text-xs">WhatsApp</Label>
            </div>
            <Button size="sm" className="gap-1.5" onClick={handleAdd} disabled={adding}>
              <Plus className="w-4 h-4" />
              {adding ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
