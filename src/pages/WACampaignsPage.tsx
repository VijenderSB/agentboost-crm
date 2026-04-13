import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MessageCircle, Send, AlertTriangle, Play, Square, 
  CalendarIcon, Filter, Zap, CheckCircle2, XCircle, Clock, Loader2, Settings2
} from 'lucide-react';
import { format } from 'date-fns';
import AppSidebar from '@/components/crm/AppSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Agent {
  id: string;
  name: string;
  phone_number?: string;
}

interface Campaign {
  id: string;
  name: string;
  created_by: string;
  agent_id: string;
  template_id: string | null;
  filters: any;
  date_from: string | null;
  date_to: string | null;
  status: string;
  total_leads: number;
  messages_sent: number;
  messages_failed: number;
  created_at: string;
}

interface CampaignMessage {
  id: string;
  campaign_id: string;
  lead_id: string;
  lead_name: string;
  lead_mobile: string;
  message: string;
  status: string;
  sent_at: string | null;
}

interface Template {
  id: string;
  name: string;
  category: string;
  message: string;
}

type TemperatureValue = 'warm' | 'cold' | 'success' | 'lost' | 'super_hot' | 'hot' | 'junk';
type StatusValue = 'fresh' | 'connected' | 'not_connected' | 'followup';

const TEMPERATURE_OPTIONS: { value: TemperatureValue; label: string }[] = [
  { value: 'warm', label: 'Warm' },
  { value: 'cold', label: 'Cold' },
  { value: 'success', label: 'Success (Referral)' },
  { value: 'lost', label: 'Lost (Referral)' },
];

const STATUS_OPTIONS: { value: StatusValue; label: string }[] = [
  { value: 'not_connected', label: 'Not Connected' },
  { value: 'fresh', label: 'Fresh' },
  { value: 'connected', label: 'Connected' },
  { value: 'followup', label: 'Follow-up' },
];

export default function WACampaignsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('create');
  
  // Create campaign state
  const [campaignName, setCampaignName] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedTemperatures, setSelectedTemperatures] = useState<TemperatureValue[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<StatusValue[]>([]);
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [leadCount, setLeadCount] = useState<number | null>(null);
  const [counting, setCounting] = useState(false);
  
  // Data
  const [agents, setAgents] = useState<Agent[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [dailyLimit, setDailyLimit] = useState(30);
  const [editingLimit, setEditingLimit] = useState(false);
  const [newLimit, setNewLimit] = useState('30');
  
  // Sending state
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [campaignMessages, setCampaignMessages] = useState<CampaignMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const sendingRef = useRef(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Detail dialog
  const [detailCampaign, setDetailCampaign] = useState<Campaign | null>(null);
  const [detailMessages, setDetailMessages] = useState<CampaignMessage[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [agentsRes, templatesRes, campaignsRes, settingsRes] = await Promise.all([
      supabase.from('profiles').select('id, name').eq('status', 'active'),
      supabase.from('whatsapp_templates').select('id, name, category, message').eq('is_active', true).order('sort_order'),
      supabase.from('wa_campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('wa_settings').select('*').eq('key', 'daily_message_limit').single(),
    ]);

    // Filter to agents only
    const { data: rolesData } = await supabase.from('user_roles').select('user_id').eq('role', 'agent');
    const agentIds = new Set((rolesData || []).map(r => r.user_id));
    
    // Get agent phone numbers
    const { data: phonesData } = await supabase.from('agent_phone_numbers').select('user_id, phone_number').eq('is_whatsapp', true);
    const phoneMap = new Map((phonesData || []).map(p => [p.user_id, p.phone_number]));

    const filteredAgents = (agentsRes.data || [])
      .filter(a => agentIds.has(a.id))
      .map(a => ({ ...a, phone_number: phoneMap.get(a.id) }));

    setAgents(filteredAgents);
    setTemplates((templatesRes.data as Template[]) || []);
    setCampaigns((campaignsRes.data as Campaign[]) || []);
    if (settingsRes.data) {
      setDailyLimit(parseInt(settingsRes.data.value) || 30);
      setNewLimit(settingsRes.data.value);
    }
  };

  const countLeads = useCallback(async () => {
    if (selectedTemperatures.length === 0 && selectedStatuses.length === 0) {
      toast.error('Select at least one temperature or status filter');
      return;
    }
    setCounting(true);
    let query = supabase.from('leads').select('id', { count: 'exact', head: true });
    
    if (selectedTemperatures.length > 0) {
      query = query.in('temperature', selectedTemperatures);
    }
    if (selectedStatuses.length > 0) {
      query = query.in('status', selectedStatuses);
    }
    if (dateFrom) {
      query = query.gte('created_at', format(dateFrom, 'yyyy-MM-dd'));
    }
    if (dateTo) {
      query = query.lte('created_at', format(dateTo, 'yyyy-MM-dd') + 'T23:59:59');
    }
    if (selectedAgent) {
      query = query.eq('current_owner_id', selectedAgent);
    }

    const { count, error } = await query;
    if (error) toast.error(error.message);
    else setLeadCount(count ?? 0);
    setCounting(false);
  }, [selectedTemperatures, selectedStatuses, dateFrom, dateTo, selectedAgent]);

  const createCampaign = async () => {
    if (!campaignName.trim()) { toast.error('Enter a campaign name'); return; }
    if (!selectedAgent) { toast.error('Select an agent'); return; }
    if (!selectedTemplate) { toast.error('Select a template'); return; }
    if (leadCount === null || leadCount === 0) { toast.error('Count leads first'); return; }

    setGenerating(true);

    // Fetch matching leads
    let query = supabase.from('leads').select('id, name, mobile');
    if (selectedTemperatures.length > 0) query = query.in('temperature', selectedTemperatures);
    if (selectedStatuses.length > 0) query = query.in('status', selectedStatuses);
    if (dateFrom) query = query.gte('created_at', format(dateFrom, 'yyyy-MM-dd'));
    if (dateTo) query = query.lte('created_at', format(dateTo, 'yyyy-MM-dd') + 'T23:59:59');
    if (selectedAgent) query = query.eq('current_owner_id', selectedAgent);

    const { data: leads, error: leadsErr } = await query;
    if (leadsErr || !leads?.length) { toast.error('Failed to fetch leads'); setGenerating(false); return; }

    const template = templates.find(t => t.id === selectedTemplate);
    const agent = agents.find(a => a.id === selectedAgent);

    // Create campaign record
    const { data: campaign, error: campErr } = await supabase.from('wa_campaigns').insert({
      name: campaignName,
      created_by: user!.id,
      agent_id: selectedAgent,
      template_id: selectedTemplate,
      filters: { temperatures: selectedTemperatures, statuses: selectedStatuses },
      date_from: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : null,
      date_to: dateTo ? format(dateTo, 'yyyy-MM-dd') : null,
      status: 'generating',
      total_leads: leads.length,
    }).select().single();

    if (campErr || !campaign) { toast.error('Failed to create campaign'); setGenerating(false); return; }

    // Generate unique messages via AI in batches of 10
    const allMessages: CampaignMessage[] = [];
    const batchSize = 10;
    
    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize);
      try {
        const { data: aiData, error: aiErr } = await supabase.functions.invoke('generate-wa-messages', {
          body: {
            leads: batch.map(l => ({ id: l.id, name: l.name })),
            templateMessage: template?.message || '',
            agentName: agent?.name || 'Agent',
          },
        });

        if (aiErr) throw aiErr;

        const generated = aiData?.messages || [];
        for (const msg of generated) {
          const lead = batch.find(l => l.id === msg.lead_id);
          if (lead) {
            allMessages.push({
              id: '', // will be set by DB
              campaign_id: campaign.id,
              lead_id: lead.id,
              lead_name: lead.name || '',
              lead_mobile: lead.mobile,
              message: msg.message,
              status: 'pending',
              sent_at: null,
            });
          }
        }
      } catch (err: any) {
        console.error('AI generation error:', err);
        toast.error(`AI error on batch ${Math.floor(i / batchSize) + 1}: ${err.message || 'Unknown'}`);
      }
    }

    if (allMessages.length === 0) {
      await supabase.from('wa_campaigns').update({ status: 'failed' }).eq('id', campaign.id);
      toast.error('Failed to generate any messages');
      setGenerating(false);
      return;
    }

    // Insert messages
    const { error: msgErr } = await supabase.from('wa_campaign_messages').insert(
      allMessages.map(m => ({
        campaign_id: m.campaign_id,
        lead_id: m.lead_id,
        lead_name: m.lead_name,
        lead_mobile: m.lead_mobile,
        message: m.message,
        status: 'pending',
      }))
    );

    if (msgErr) {
      toast.error('Failed to save messages');
      setGenerating(false);
      return;
    }

    // Update campaign status
    await supabase.from('wa_campaigns').update({ status: 'ready' }).eq('id', campaign.id);

    toast.success(`Campaign created with ${allMessages.length} unique messages!`);
    setGenerating(false);
    loadData();
    setTab('campaigns');
  };

  const startSending = async (campaign: Campaign) => {
    const { data: messages } = await supabase
      .from('wa_campaign_messages')
      .select('*')
      .eq('campaign_id', campaign.id)
      .eq('status', 'pending')
      .order('created_at');

    if (!messages?.length) { toast.info('No pending messages'); return; }

    setActiveCampaign(campaign);
    setCampaignMessages(messages as CampaignMessage[]);
    setCurrentIndex(0);
    setSending(true);
    sendingRef.current = true;

    await supabase.from('wa_campaigns').update({ status: 'sending' }).eq('id', campaign.id);

    // Start sequential sending
    for (let i = 0; i < messages.length; i++) {
      if (!sendingRef.current) break;
      
      setCurrentIndex(i);
      const msg = messages[i] as CampaignMessage;
      const phone = msg.lead_mobile.replace(/\D/g, '');
      const encoded = encodeURIComponent(msg.message);
      
      // Open wa.me link — agent presses Enter
      window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');

      // Mark as sent
      await supabase.from('wa_campaign_messages')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', msg.id);

      // Update campaign counters
      await supabase.from('wa_campaigns')
        .update({ messages_sent: (campaign.messages_sent || 0) + i + 1 })
        .eq('id', campaign.id);

      // Update local state
      setCampaignMessages(prev => prev.map((m, idx) => 
        idx === i ? { ...m, status: 'sent' } : m
      ));

      // Random delay 1-5 seconds
      if (i < messages.length - 1 && sendingRef.current) {
        const delay = Math.floor(Math.random() * 4000) + 1000;
        await new Promise(r => setTimeout(r, delay));
      }
    }

    // Complete
    if (sendingRef.current) {
      await supabase.from('wa_campaigns').update({ status: 'completed' }).eq('id', campaign.id);
      toast.success('Campaign completed!');
    } else {
      toast.info('Campaign paused');
    }
    
    setSending(false);
    sendingRef.current = false;
    loadData();
  };

  const stopSending = () => {
    sendingRef.current = false;
    setSending(false);
  };

  const updateDailyLimit = async () => {
    const val = parseInt(newLimit);
    if (isNaN(val) || val < 1) { toast.error('Invalid limit'); return; }
    const { error } = await supabase.from('wa_settings')
      .update({ value: String(val), updated_by: user!.id })
      .eq('key', 'daily_message_limit');
    if (error) toast.error(error.message);
    else { setDailyLimit(val); setEditingLimit(false); toast.success('Limit updated'); }
  };

  const viewCampaignDetail = async (c: Campaign) => {
    setDetailCampaign(c);
    const { data } = await supabase.from('wa_campaign_messages')
      .select('*').eq('campaign_id', c.id).order('created_at');
    setDetailMessages((data as CampaignMessage[]) || []);
  };

  const toggleFilter = <T extends string>(value: T, list: T[], setter: (v: T[]) => void) => {
    setter(list.includes(value) ? list.filter(v => v !== value) : [...list, value]);
    setLeadCount(null);
  };

  const exceedsLimit = leadCount !== null && leadCount > dailyLimit;
  const selectedAgentObj = agents.find(a => a.id === selectedAgent);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 p-4 lg:p-6 pt-16 lg:pt-6 overflow-auto">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold">WhatsApp Campaigns</h1>
            </div>
            {user?.role === 'admin' && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditingLimit(true)}>
                <Settings2 className="w-4 h-4" />
                Daily Limit: {dailyLimit}
              </Button>
            )}
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="create">Create Campaign</TabsTrigger>
              <TabsTrigger value="campaigns">Campaign History</TabsTrigger>
            </TabsList>

            <TabsContent value="create">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Left: Filters */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Filter className="w-5 h-5" />
                      Lead Filters
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div>
                      <Label>Campaign Name *</Label>
                      <Input 
                        value={campaignName} 
                        onChange={e => setCampaignName(e.target.value)}
                        placeholder="e.g. March Cold Lead Re-engagement"
                      />
                    </div>

                    <div>
                      <Label>Select Agent *</Label>
                      <Select value={selectedAgent} onValueChange={v => { setSelectedAgent(v); setLeadCount(null); }}>
                        <SelectTrigger><SelectValue placeholder="Choose agent" /></SelectTrigger>
                        <SelectContent>
                          {agents.map(a => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.name} {a.phone_number ? `(${a.phone_number})` : '(No WA number)'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedAgent && !selectedAgentObj?.phone_number && (
                        <p className="text-xs text-destructive mt-1">⚠️ This agent has no WhatsApp number configured</p>
                      )}
                    </div>

                    <div>
                      <Label>Temperature</Label>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {TEMPERATURE_OPTIONS.map(opt => (
                          <Badge
                            key={opt.value}
                            variant={selectedTemperatures.includes(opt.value) ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => toggleFilter(opt.value, selectedTemperatures, setSelectedTemperatures)}
                          >
                            {opt.label}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Status</Label>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {STATUS_OPTIONS.map(opt => (
                          <Badge
                            key={opt.value}
                            variant={selectedStatuses.includes(opt.value) ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => toggleFilter(opt.value, selectedStatuses, setSelectedStatuses)}
                          >
                            {opt.label}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>From Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateFrom ? format(dateFrom, "PP") : "Pick date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={dateFrom} onSelect={d => { setDateFrom(d); setLeadCount(null); }} className="p-3 pointer-events-auto" />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <Label>To Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateTo ? format(dateTo, "PP") : "Pick date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={dateTo} onSelect={d => { setDateTo(d); setLeadCount(null); }} className="p-3 pointer-events-auto" />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <Button onClick={countLeads} disabled={counting} variant="secondary" className="w-full gap-2">
                      {counting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />}
                      Count Matching Leads
                    </Button>
                  </CardContent>
                </Card>

                {/* Right: Template & Summary */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <MessageCircle className="w-5 h-5" />
                        Template & Preview
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>WhatsApp Template *</Label>
                        <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                          <SelectTrigger><SelectValue placeholder="Choose template" /></SelectTrigger>
                          <SelectContent>
                            {templates.map(t => (
                              <SelectItem key={t.id} value={t.id}>
                                [{t.category}] {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {selectedTemplate && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Template Preview:</p>
                          <pre className="text-sm whitespace-pre-wrap font-sans">
                            {templates.find(t => t.id === selectedTemplate)?.message}
                          </pre>
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            AI will generate unique variations of this for each lead
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Lead Count Result */}
                  {leadCount !== null && (
                    <Card className={cn(exceedsLimit && "border-destructive")}>
                      <CardContent className="pt-6">
                        <div className="text-center space-y-2">
                          <p className="text-4xl font-bold">{leadCount}</p>
                          <p className="text-sm text-muted-foreground">matching leads</p>
                          {exceedsLimit && (
                            <div className="flex items-center justify-center gap-2 text-destructive bg-destructive/10 rounded-lg p-3 mt-3">
                              <AlertTriangle className="w-5 h-5" />
                              <div className="text-sm font-medium">
                                Exceeds daily limit of {dailyLimit} messages!
                                <p className="font-normal text-xs mt-0.5">
                                  Only first {dailyLimit} leads will be messaged. Narrow your filters or increase the limit.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Button 
                    onClick={createCampaign} 
                    disabled={generating || leadCount === null || leadCount === 0}
                    className="w-full gap-2 h-12 text-base"
                    size="lg"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating Unique Messages...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        Create Campaign ({leadCount ?? 0} leads)
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="campaigns">
              <div className="space-y-3">
                {campaigns.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">No campaigns yet</p>
                ) : campaigns.map(c => (
                  <Card key={c.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => viewCampaignDetail(c)}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{c.name}</h3>
                            <CampaignStatusBadge status={c.status} />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(c.created_at), 'PPp')} · {c.total_leads} leads · 
                            {c.messages_sent} sent · {c.messages_failed} failed
                          </p>
                          {c.total_leads > 0 && (
                            <Progress 
                              value={((c.messages_sent + c.messages_failed) / c.total_leads) * 100} 
                              className="mt-2 h-1.5" 
                            />
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          {c.status === 'ready' && (
                            <Button size="sm" className="gap-1.5" onClick={e => { e.stopPropagation(); startSending(c); }}>
                              <Play className="w-3.5 h-3.5" /> Start
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Active sending overlay */}
          {sending && activeCampaign && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
              <Card className="w-full max-w-lg mx-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    Sending Messages...
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={(currentIndex / campaignMessages.length) * 100} />
                  <p className="text-sm text-center text-muted-foreground">
                    {currentIndex + 1} of {campaignMessages.length} · Press Enter in each WhatsApp tab
                  </p>
                  {campaignMessages[currentIndex] && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs font-medium">To: {campaignMessages[currentIndex].lead_name} ({campaignMessages[currentIndex].lead_mobile})</p>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{campaignMessages[currentIndex].message}</p>
                    </div>
                  )}
                  <Button variant="destructive" className="w-full gap-2" onClick={stopSending}>
                    <Square className="w-4 h-4" /> Stop Sending
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Campaign detail dialog */}
          <Dialog open={!!detailCampaign} onOpenChange={() => setDetailCampaign(null)}>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {detailCampaign?.name}
                  {detailCampaign && <CampaignStatusBadge status={detailCampaign.status} />}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-2xl font-bold">{detailCampaign?.total_leads}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-3">
                    <p className="text-2xl font-bold text-primary">{detailCampaign?.messages_sent}</p>
                    <p className="text-xs text-muted-foreground">Sent</p>
                  </div>
                  <div className="bg-destructive/10 rounded-lg p-3">
                    <p className="text-2xl font-bold text-destructive">{detailCampaign?.messages_failed}</p>
                    <p className="text-xs text-muted-foreground">Failed</p>
                  </div>
                </div>

                {detailCampaign?.status === 'ready' && (
                  <Button className="w-full gap-2" onClick={() => { setDetailCampaign(null); startSending(detailCampaign); }}>
                    <Play className="w-4 h-4" /> Start Sending
                  </Button>
                )}

                <div className="space-y-2">
                  {detailMessages.map(m => (
                    <div key={m.id} className="border border-border rounded-lg p-3 text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{m.lead_name || m.lead_mobile}</span>
                        <MessageStatusBadge status={m.status} />
                      </div>
                      <p className="text-muted-foreground whitespace-pre-wrap text-xs">{m.message}</p>
                      {m.sent_at && <p className="text-xs text-muted-foreground mt-1">{format(new Date(m.sent_at), 'PPp')}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit limit dialog */}
          <Dialog open={editingLimit} onOpenChange={setEditingLimit}>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Daily Message Limit</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label>Maximum messages per day per agent</Label>
                  <Input type="number" value={newLimit} onChange={e => setNewLimit(e.target.value)} min="1" />
                </div>
                <Button className="w-full" onClick={updateDailyLimit}>Save Limit</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}

function CampaignStatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
    draft: { variant: 'outline', icon: Clock },
    generating: { variant: 'secondary', icon: Loader2 },
    ready: { variant: 'default', icon: CheckCircle2 },
    sending: { variant: 'secondary', icon: Send },
    completed: { variant: 'default', icon: CheckCircle2 },
    failed: { variant: 'destructive', icon: XCircle },
    cancelled: { variant: 'outline', icon: XCircle },
  };
  const c = config[status] || config.draft;
  const Icon = c.icon;
  return (
    <Badge variant={c.variant} className="text-xs gap-1">
      <Icon className={cn("w-3 h-3", status === 'generating' && "animate-spin")} />
      {status}
    </Badge>
  );
}

function MessageStatusBadge({ status }: { status: string }) {
  if (status === 'sent') return <Badge variant="default" className="text-xs">Sent</Badge>;
  if (status === 'failed') return <Badge variant="destructive" className="text-xs">Failed</Badge>;
  if (status === 'skipped') return <Badge variant="outline" className="text-xs">Skipped</Badge>;
  return <Badge variant="secondary" className="text-xs">Pending</Badge>;
}
