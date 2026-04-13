import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string;
  agentName: string;
  onUpdated?: () => void;
}

export default function EditAgentEmailDialog({ open, onOpenChange, agentId, agentName, onUpdated }: Props) {
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) { toast.error('Enter new email'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('update-agent-email', {
        body: { agent_id: agentId, new_email: newEmail },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Email updated successfully');
      setNewEmail('');
      onOpenChange(false);
      onUpdated?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Email for {agentName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="new-email">New Email</Label>
            <Input id="new-email" type="email" placeholder="new@email.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Updating...' : 'Update Email'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
