import { useEffect, useState } from 'react';
import { MessageCircle, Plus, Pencil, Trash2, Save, X, GripVertical } from 'lucide-react';
import AppSidebar from '@/components/crm/AppSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Template {
  id: string;
  name: string;
  category: string;
  message: string;
  is_active: boolean;
  sort_order: number;
}

const PLACEHOLDERS = [
  { key: '{{name}}', desc: 'Lead name' },
  { key: '{{agent}}', desc: 'Agent name' },
  { key: '{{eye_centre_name}}', desc: 'Eye Centre name' },
  { key: '{{eye_centre_address}}', desc: 'Eye Centre address' },
  { key: '{{eye_centre_maps}}', desc: 'Google Maps link' },
];

export default function WhatsAppTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [form, setForm] = useState({ name: '', category: '', message: '', is_active: true });
  const [saving, setSaving] = useState(false);

  const fetchTemplates = async () => {
    const { data } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .order('sort_order')
      .order('created_at');
    setTemplates((data as Template[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchTemplates(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', category: '', message: '', is_active: true });
    setDialogOpen(true);
  };

  const openEdit = (t: Template) => {
    setEditing(t);
    setForm({ name: t.name, category: t.category, message: t.message, is_active: t.is_active });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.message.trim()) {
      toast.error('Name and message are required');
      return;
    }
    setSaving(true);
    if (editing) {
      const { error } = await supabase
        .from('whatsapp_templates')
        .update({ name: form.name, category: form.category || 'General', message: form.message, is_active: form.is_active })
        .eq('id', editing.id);
      if (error) toast.error(error.message);
      else toast.success('Template updated');
    } else {
      const maxOrder = templates.length > 0 ? Math.max(...templates.map(t => t.sort_order)) : 0;
      const { error } = await supabase
        .from('whatsapp_templates')
        .insert({ name: form.name, category: form.category || 'General', message: form.message, is_active: form.is_active, sort_order: maxOrder + 1 });
      if (error) toast.error(error.message);
      else toast.success('Template created');
    }
    setSaving(false);
    setDialogOpen(false);
    fetchTemplates();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    const { error } = await supabase.from('whatsapp_templates').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Template deleted'); fetchTemplates(); }
  };

  const toggleActive = async (t: Template) => {
    const { error } = await supabase.from('whatsapp_templates').update({ is_active: !t.is_active }).eq('id', t.id);
    if (error) toast.error(error.message);
    else fetchTemplates();
  };

  const categories = [...new Set(templates.map(t => t.category))];

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 p-4 lg:p-6 pt-16 lg:pt-6 overflow-auto max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">WhatsApp Templates</h1>
          </div>
          <Button className="gap-1.5" onClick={openNew}>
            <Plus className="w-4 h-4" />
            New Template
          </Button>
        </div>

        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs font-medium text-muted-foreground mb-2">Available Placeholders:</p>
          <div className="flex flex-wrap gap-2">
            {PLACEHOLDERS.map(p => (
              <Badge key={p.key} variant="outline" className="text-xs font-mono">
                {p.key} <span className="text-muted-foreground ml-1 font-sans">— {p.desc}</span>
              </Badge>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-12">Loading...</div>
        ) : templates.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">No templates yet. Create one to get started.</div>
        ) : (
          <div className="space-y-6">
            {categories.map(cat => (
              <div key={cat}>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{cat}</h3>
                <div className="space-y-3">
                  {templates.filter(t => t.category === cat).map(t => (
                    <div key={t.id} className={`bg-card rounded-xl border border-border p-4 ${!t.is_active ? 'opacity-50' : ''}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{t.name}</h4>
                            <Badge variant={t.is_active ? 'default' : 'secondary'} className="text-xs">
                              {t.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed bg-muted/30 rounded-lg p-3">
                            {t.message}
                          </pre>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Switch checked={t.is_active} onCheckedChange={() => toggleActive(t)} />
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(t.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Template' : 'New Template'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Template Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. First Contact Greeting" />
              </div>
              <div>
                <Label>Category</Label>
                <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. First Contact, Follow-up, Promotion" />
              </div>
              <div>
                <Label>Message *</Label>
                <Textarea
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Hi {{name}}, this is {{agent}}..."
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use placeholders: {'{{name}}'}, {'{{agent}}'}, {'{{eye_centre_name}}'}, {'{{eye_centre_address}}'}, {'{{eye_centre_maps}}'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                <Label>Active</Label>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button className="flex-1 gap-1.5" onClick={handleSave} disabled={saving}>
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Template'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
