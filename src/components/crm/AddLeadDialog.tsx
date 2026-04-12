import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { LeadSource } from '@/types/crm';

const leadSources: { value: LeadSource; label: string }[] = [
  { value: 'query_form', label: 'Query Form' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'ivr', label: 'IVR' },
  { value: 'chat', label: 'Chat' },
  { value: 'justdial', label: 'Justdial' },
  { value: 'indiamart', label: 'IndiaMart' },
  { value: 'google_business', label: 'Google Business' },
  { value: 'practo', label: 'Practo' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'whatsapp_ads', label: 'WhatsApp Ads' },
  { value: 'reference', label: 'Reference' },
  { value: 'walkin', label: 'Walk-in' },
  { value: 'manual', label: 'Manual Entry' },
];

export default function AddLeadDialog() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    mobile: '',
    city: '',
    source: '' as LeadSource,
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.mobile.trim()) {
      toast.error('Mobile number is required');
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('leads').insert({
        name: form.name.trim(),
        mobile: form.mobile.trim(),
        city: form.city.trim(),
        source: form.source || 'manual',
        source_type: 'manual',
        status: 'fresh',
        temperature: 'warm',
        first_owner_id: user.id,
        current_owner_id: user.id,
        notes: form.notes.trim() || null,
      });

      if (error) throw error;

      toast.success('Lead added successfully');
      setForm({ name: '', mobile: '', city: '', source: '' as LeadSource, notes: '' });
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to add lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Lead</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="mobile">Mobile Number *</Label>
            <Input
              id="mobile"
              placeholder="+91 98765 43210"
              value={form.mobile}
              onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Lead name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              placeholder="City"
              value={form.city}
              onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
            />
          </div>
          <div>
            <Label>Lead Source</Label>
            <Select value={form.source} onValueChange={v => setForm(f => ({ ...f, source: v as LeadSource }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                {leadSources.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              placeholder="Any notes..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Adding...' : 'Add Lead'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
