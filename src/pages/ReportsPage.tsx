import AppSidebar from '@/components/crm/AppSidebar';
import { useEffect, useState } from 'react';
import { format, subDays, startOfMonth, startOfYear, startOfWeek } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import { TrendingUp, Users, Target, BarChart3, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const COLORS = [
  'hsl(220, 90%, 56%)', 'hsl(160, 70%, 42%)', 'hsl(38, 95%, 55%)',
  'hsl(0, 75%, 55%)', 'hsl(270, 60%, 55%)', 'hsl(190, 70%, 50%)',
  'hsl(30, 80%, 50%)', 'hsl(330, 65%, 50%)', 'hsl(120, 50%, 45%)',
  'hsl(50, 85%, 50%)', 'hsl(210, 50%, 60%)', 'hsl(350, 60%, 50%)',
  'hsl(180, 55%, 45%)', 'hsl(60, 70%, 50%)',
];

interface AgentProductivity {
  name: string;
  total: number;
  connected: number;
  conversions: number;
  rate: number;
}

interface MonthlyTrend {
  month: string;
  leads: number;
  conversions: number;
  rate: number;
}

export default function ReportsPage() {
  const [sourceData, setSourceData] = useState<any[]>([]);
  const [tempData, setTempData] = useState<any[]>([]);
  const [agentData, setAgentData] = useState<AgentProductivity[]>([]);
  const [trendData, setTrendData] = useState<MonthlyTrend[]>([]);
  const [sourceConversion, setSourceConversion] = useState<any[]>([]);
  const [totals, setTotals] = useState({ leads: 0, conversions: 0, rate: '0', agents: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: leads }, { data: profiles }] = await Promise.all([
        supabase.from('leads').select('source, temperature, status, current_owner_id, created_at'),
        supabase.from('profiles').select('id, name'),
      ]);

      if (!leads || !profiles) { setLoading(false); return; }

      const nameMap = new Map(profiles.map((p: any) => [p.id, p.name]));

      // Source breakdown
      const sourceMap: Record<string, number> = {};
      const tempMap: Record<string, number> = {};
      const sourceConvMap: Record<string, { total: number; conversions: number }> = {};
      const agentMap: Record<string, { total: number; connected: number; conversions: number }> = {};
      const monthMap: Record<string, { leads: number; conversions: number }> = {};

      leads.forEach((l: any) => {
        // Source
        const src = (l.source || 'manual').replace(/_/g, ' ');
        sourceMap[src] = (sourceMap[src] || 0) + 1;
        if (!sourceConvMap[src]) sourceConvMap[src] = { total: 0, conversions: 0 };
        sourceConvMap[src].total++;
        if (l.temperature === 'success') sourceConvMap[src].conversions++;

        // Temperature
        const temp = (l.temperature || 'warm').replace(/_/g, ' ');
        tempMap[temp] = (tempMap[temp] || 0) + 1;

        // Agent
        const agentId = l.current_owner_id;
        const agentName = nameMap.get(agentId) || 'Unknown';
        if (!agentMap[agentName]) agentMap[agentName] = { total: 0, connected: 0, conversions: 0 };
        agentMap[agentName].total++;
        if (l.status === 'connected') agentMap[agentName].connected++;
        if (l.temperature === 'success') agentMap[agentName].conversions++;

        // Monthly trend
        const date = new Date(l.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthMap[monthKey]) monthMap[monthKey] = { leads: 0, conversions: 0 };
        monthMap[monthKey].leads++;
        if (l.temperature === 'success') monthMap[monthKey].conversions++;
      });

      setSourceData(Object.entries(sourceMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value));
      setTempData(Object.entries(tempMap).map(([name, value]) => ({ name, value })));

      setSourceConversion(
        Object.entries(sourceConvMap)
          .map(([name, v]) => ({ name, total: v.total, conversions: v.conversions, rate: v.total > 0 ? +((v.conversions / v.total) * 100).toFixed(1) : 0 }))
          .sort((a, b) => b.total - a.total)
      );

      setAgentData(
        Object.entries(agentMap)
          .map(([name, v]) => ({ name, ...v, rate: v.total > 0 ? +((v.conversions / v.total) * 100).toFixed(1) : 0 }))
          .sort((a, b) => b.total - a.total)
      );

      const sortedMonths = Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b));
      setTrendData(
        sortedMonths.map(([month, v]) => ({
          month: new Date(month + '-01').toLocaleDateString('en', { month: 'short', year: '2-digit' }),
          leads: v.leads,
          conversions: v.conversions,
          rate: v.leads > 0 ? +((v.conversions / v.leads) * 100).toFixed(1) : 0,
        }))
      );

      const totalConversions = leads.filter((l: any) => l.temperature === 'success').length;
      setTotals({
        leads: leads.length,
        conversions: totalConversions,
        rate: leads.length > 0 ? ((totalConversions / leads.length) * 100).toFixed(1) : '0',
        agents: profiles.length,
      });

      setLoading(false);
    };
    fetchData();
  }, []);

  const sourceLabels: Record<string, string> = {
    'query form': 'Query Form', 'whatsapp': 'WhatsApp', 'ivr': 'IVR', 'chat': 'Chat',
    'justdial': 'JustDial', 'indiamart': 'IndiaMart', 'google business': 'Google Business',
    'practo': 'Practo', 'facebook': 'Facebook', 'instagram': 'Instagram',
    'whatsapp ads': 'WhatsApp Ads', 'reference': 'Reference', 'walkin': 'Walk-in', 'manual': 'Manual',
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 p-4 lg:p-6 pt-16 lg:pt-6 overflow-auto">
        <h1 className="text-2xl font-bold mb-6">Reports</h1>

        {loading ? (
          <div className="text-center text-muted-foreground py-12">Loading...</div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard icon={<BarChart3 className="w-5 h-5" />} label="Total Leads" value={totals.leads} />
              <SummaryCard icon={<Target className="w-5 h-5" />} label="Conversions" value={totals.conversions} accent />
              <SummaryCard icon={<TrendingUp className="w-5 h-5" />} label="Conversion Rate" value={`${totals.rate}%`} />
              <SummaryCard icon={<Users className="w-5 h-5" />} label="Active Agents" value={totals.agents} />
            </div>

            {/* Row 1: Conversion Trend + Temperature */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="font-semibold mb-4">Lead & Conversion Trend</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="leads" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} name="Leads" />
                    <Line type="monotone" dataKey="conversions" stroke="hsl(160, 70%, 42%)" strokeWidth={2} dot={{ r: 4 }} name="Conversions" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="font-semibold mb-4">Temperature Distribution</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={tempData} cx="50%" cy="50%" outerRadius={95} innerRadius={50} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {tempData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Row 2: Source Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="font-semibold mb-4">Leads by Source</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sourceData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} tickFormatter={n => sourceLabels[n] || n} />
                    <Tooltip labelFormatter={n => sourceLabels[n as string] || n} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Leads" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="font-semibold mb-4">Source Conversion Rate</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sourceConversion} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" unit="%" />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} tickFormatter={n => sourceLabels[n] || n} />
                    <Tooltip labelFormatter={n => sourceLabels[n as string] || n} formatter={(v: any) => [`${v}%`, 'Conversion Rate']} />
                    <Bar dataKey="rate" fill="hsl(160, 70%, 42%)" radius={[0, 4, 4, 0]} name="Rate %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Row 3: Agent Productivity */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold mb-4">Agent Productivity</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-3 pr-4 font-medium text-muted-foreground">Agent</th>
                      <th className="py-3 px-4 font-medium text-muted-foreground text-center">Total Leads</th>
                      <th className="py-3 px-4 font-medium text-muted-foreground text-center">Connected</th>
                      <th className="py-3 px-4 font-medium text-muted-foreground text-center">Conversions</th>
                      <th className="py-3 px-4 font-medium text-muted-foreground text-center">Conv. Rate</th>
                      <th className="py-3 pl-4 font-medium text-muted-foreground">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentData.map(agent => (
                      <tr key={agent.name} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-3 pr-4 font-medium">{agent.name}</td>
                        <td className="py-3 px-4 text-center">{agent.total}</td>
                        <td className="py-3 px-4 text-center">{agent.connected}</td>
                        <td className="py-3 px-4 text-center font-semibold text-primary">{agent.conversions}</td>
                        <td className="py-3 px-4 text-center">{agent.rate}%</td>
                        <td className="py-3 pl-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-[120px]">
                              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(agent.rate, 100)}%` }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Agent bar chart */}
              <div className="mt-6">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={agentData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Total" />
                    <Bar dataKey="connected" fill="hsl(38, 95%, 55%)" radius={[4, 4, 0, 0]} name="Connected" />
                    <Bar dataKey="conversions" fill="hsl(160, 70%, 42%)" radius={[4, 4, 0, 0]} name="Conversions" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function SummaryCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${accent ? 'text-primary' : ''}`}>{value}</p>
    </div>
  );
}
