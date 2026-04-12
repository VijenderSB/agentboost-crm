import AppSidebar from '@/components/crm/AppSidebar';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(220, 90%, 50%)', 'hsl(160, 70%, 42%)', 'hsl(38, 95%, 55%)', 'hsl(0, 80%, 55%)', 'hsl(200, 70%, 55%)', 'hsl(220, 10%, 60%)', 'hsl(220, 15%, 40%)'];

export default function ReportsPage() {
  const [sourceData, setSourceData] = useState<any[]>([]);
  const [tempData, setTempData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: leads } = await supabase.from('leads').select('source, temperature');
      if (leads) {
        // Source breakdown
        const sourceMap: Record<string, number> = {};
        const tempMap: Record<string, number> = {};
        leads.forEach((l: any) => {
          sourceMap[l.source] = (sourceMap[l.source] || 0) + 1;
          tempMap[l.temperature] = (tempMap[l.temperature] || 0) + 1;
        });
        setSourceData(Object.entries(sourceMap).map(([name, value]) => ({ name: name.replace('_', ' '), value })));
        setTempData(Object.entries(tempMap).map(([name, value]) => ({ name: name.replace('_', ' '), value })));
      }
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 p-4 lg:p-6 pt-16 lg:pt-6 overflow-auto">
        <h1 className="text-2xl font-bold mb-6">Reports</h1>

        {loading ? (
          <div className="text-center text-muted-foreground py-12">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold mb-4">Leads by Source</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sourceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold mb-4">Temperature Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={tempData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {tempData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
