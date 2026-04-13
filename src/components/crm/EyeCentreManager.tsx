import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Trash2, MapPin, ExternalLink } from 'lucide-react';

interface EyeCentre {
  id: string;
  name: string;
  city: string;
  address: string;
  google_maps_url: string;
  status: string;
}

export default function EyeCentreManager() {
  const [centres, setCentres] = useState<EyeCentre[]>([]);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchCentres = async () => {
    const { data } = await supabase.from('eye_centres').select('*').order('city').order('name');
    if (data) setCentres(data as EyeCentre[]);
  };

  useEffect(() => { fetchCentres(); }, []);

  const addCentre = async () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    setLoading(true);
    const { error } = await supabase.from('eye_centres').insert({
      name: name.trim(),
      city: city.trim(),
      address: address.trim(),
      google_maps_url: mapsUrl.trim(),
    });
    if (error) toast.error(error.message);
    else { toast.success('Eye Centre added'); setName(''); setCity(''); setAddress(''); setMapsUrl(''); fetchCentres(); }
    setLoading(false);
  };

  const toggleStatus = async (c: EyeCentre) => {
    const newStatus = c.status === 'active' ? 'inactive' : 'active';
    const { error } = await supabase.from('eye_centres').update({ status: newStatus }).eq('id', c.id);
    if (error) toast.error(error.message);
    else { toast.success(`${c.name} ${newStatus}`); fetchCentres(); }
  };

  const deleteCentre = async (c: EyeCentre) => {
    if (!confirm(`Delete "${c.name}"?`)) return;
    const { error } = await supabase.from('eye_centres').delete().eq('id', c.id);
    if (error) toast.error(error.message);
    else { toast.success('Deleted'); fetchCentres(); }
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      <h3 className="font-semibold">Eye Centres</h3>
      <p className="text-xs text-muted-foreground">Manage Lasik Eye Centres for lead referrals. Address & location are sent to leads via WhatsApp.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label>Centre Name *</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Healing Touch Eye Centre" />
        </div>
        <div>
          <Label>City</Label>
          <Input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Delhi" />
        </div>
        <div className="sm:col-span-2">
          <Label>Address</Label>
          <Textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Full address of the Eye Centre" rows={2} />
        </div>
        <div className="sm:col-span-2">
          <Label>Google Maps URL</Label>
          <Input value={mapsUrl} onChange={e => setMapsUrl(e.target.value)} placeholder="https://maps.google.com/?q=..." />
        </div>
        <div className="sm:col-span-2">
          <Button onClick={addCentre} disabled={loading} className="gap-1.5">
            <Plus className="w-4 h-4" /> Add Eye Centre
          </Button>
        </div>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {centres.length === 0 && <p className="text-sm text-muted-foreground">No eye centres added yet.</p>}
        {centres.map(c => (
          <div key={c.id} className="p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.city || 'No city'}</p>
                {c.address && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {c.address}
                  </p>
                )}
                {c.google_maps_url && (
                  <a href={c.google_maps_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline">
                    <ExternalLink className="w-3 h-3" /> View on Map
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`text-xs ${c.status === 'active' ? 'text-success' : 'text-muted-foreground'}`}
                  onClick={() => toggleStatus(c)}
                >
                  {c.status === 'active' ? 'Active' : 'Inactive'}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteCentre(c)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
