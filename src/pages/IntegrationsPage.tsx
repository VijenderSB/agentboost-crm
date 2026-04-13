import AppSidebar from '@/components/crm/AppSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Globe, MessageCircle, Phone, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

const WEBHOOK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/receive-lead`;

const WEBSITES = [
  { name: 'Lasik in Delhi', domain: 'www.lasikindelhi.com', city: 'Delhi' },
  { name: 'Laser FYI', domain: 'www.laser.fyi', city: '' },
  { name: 'Lasik in Pune', domain: 'www.lasikinpune.com', city: 'Pune' },
  { name: 'Lasik in Mumbai', domain: 'www.lasikinmumbai.com', city: 'Mumbai' },
];

function CodeBlock({ code, label }: { code: string; label: string }) {
  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => { navigator.clipboard.writeText(code); toast.success('Copied!'); }}
        >
          <Copy className="h-3 w-3 mr-1" /> Copy
        </Button>
      </div>
      <pre className="bg-muted/50 border border-border rounded-lg p-3 text-xs overflow-x-auto whitespace-pre-wrap font-mono">
        {code}
      </pre>
    </div>
  );
}

export default function IntegrationsPage() {
  const { user } = useAuth();

  if (user?.role === 'agent') {
    return (
      <div className="flex min-h-screen bg-background">
        <AppSidebar />
        <main className="flex-1 p-6 pt-16 lg:pt-6">
          <p className="text-muted-foreground">You don't have access to this page.</p>
        </main>
      </div>
    );
  }

  const wordpressSnippet = (domain: string) => `// Add to your theme's functions.php or use WPForms/CF7 webhook plugin
// For Contact Form 7: Install "CF7 to Webhook" plugin and set URL to:
// ${WEBHOOK_URL}

// For WPForms: Go to Settings → Notifications → Add Webhook
// URL: ${WEBHOOK_URL}
// Method: POST

// For custom theme form, add this JavaScript:
document.querySelector('#lead-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  await fetch('${WEBHOOK_URL}', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: form.get('name'),
      mobile: form.get('phone') || form.get('mobile'),
      city: form.get('city') || '',
      source: 'query_form',
      domain: '${domain}',
      notes: form.get('message') || ''
    })
  });
  // Show thank you message
});`;

  const tawktoSnippet = `// In Tawk.to Dashboard:
// 1. Go to Administration → Settings → Webhooks
// 2. Add webhook URL: ${WEBHOOK_URL}
// 3. Select events: "Chat Started", "Chat Ended"

// Tawk.to will send visitor data automatically.
// The webhook maps tawk.to data to CRM leads with source="chat".

// If using Tawk.to JavaScript API, you can also send on chat end:
Tawk_API.onChatEnded = function() {
  const visitor = Tawk_API.visitor;
  fetch('${WEBHOOK_URL}', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: visitor.name || '',
      mobile: visitor.phone || visitor.mobile || '',
      source: 'chat',
      domain: window.location.hostname,
      notes: 'Lead from Tawk.to chat'
    })
  });
};`;

  const whatsappSnippet = `// WhatsApp leads from +918800770952
// Option 1: If using WhatsApp Business API → Configure webhook:
// URL: ${WEBHOOK_URL}
// The webhook auto-maps source="whatsapp"

// Option 2: Manual entry via CRM (already supported)
// Agents can add leads with source="WhatsApp" from the Add Lead form

// Option 3: If using a WhatsApp chatbot service, configure the
// chatbot to POST to the webhook when a new conversation starts:
// POST ${WEBHOOK_URL}
// Body: { "name": "...", "mobile": "...", "source": "whatsapp", "domain": "whatsapp" }`;

  const ivrSnippet = `// IVR Integration
// Configure your IVR provider to send a webhook/API call when:
// - A new call is received
// - A missed call is logged
// - A caller leaves details

// Webhook URL: ${WEBHOOK_URL}
// Method: POST
// Content-Type: application/json

// Sample payload your IVR should send:
{
  "name": "Caller Name (if captured)",
  "mobile": "9876543210",
  "source": "ivr",
  "domain": "ivr",
  "city": "Delhi",
  "notes": "IVR call - interested in LASIK consultation"
}

// Common IVR providers (Exotel, Knowlarity, MyOperator)
// all support webhook callbacks. Use the URL above.`;

  const testSnippet = `// Test the webhook with curl:
curl -X POST '${WEBHOOK_URL}' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "name": "Test Lead",
    "mobile": "9876543210",
    "source": "query_form",
    "domain": "www.lasikindelhi.com",
    "city": "Delhi",
    "notes": "Test lead from integration"
  }'`;

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 p-4 lg:p-6 pt-16 lg:pt-6 overflow-auto">
        <div className="max-w-4xl">
          <h1 className="text-2xl font-bold mb-2">Integrations</h1>
          <p className="text-muted-foreground mb-6">
            Connect your websites and communication channels to automatically capture leads in the CRM.
          </p>

          {/* Webhook URL */}
          <Card className="mb-6 border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                🔗 Webhook Endpoint
              </CardTitle>
              <CardDescription>Use this URL for all integrations. Leads are auto-assigned via round-robin.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <code className="bg-muted border border-border rounded px-3 py-2 text-sm font-mono flex-1 break-all">
                  {WEBHOOK_URL}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { navigator.clipboard.writeText(WEBHOOK_URL); toast.success('Webhook URL copied!'); }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                POST JSON with: name, mobile (required), source, domain, city, notes
              </p>
            </CardContent>
          </Card>

          {/* Websites */}
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Globe className="h-5 w-5" /> Website Lead Forms
          </h2>
          <div className="grid gap-4 mb-6">
            {WEBSITES.map(site => (
              <Card key={site.domain}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    {site.name}
                    <Badge variant="outline" className="text-xs">{site.domain}</Badge>
                    {site.city && <Badge className="text-xs">{site.city}</Badge>}
                  </CardTitle>
                  <CardDescription>WordPress form integration</CardDescription>
                </CardHeader>
                <CardContent>
                  <CodeBlock code={wordpressSnippet(site.domain)} label="WordPress Integration" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* WhatsApp */}
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" /> WhatsApp (+918800770952)
              </CardTitle>
              <CardDescription>Capture leads from WhatsApp conversations</CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock code={whatsappSnippet} label="WhatsApp Integration" />
            </CardContent>
          </Card>

          {/* Tawk.to */}
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" /> Tawk.to Chat
              </CardTitle>
              <CardDescription>Auto-capture leads when visitors chat on your websites</CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock code={tawktoSnippet} label="Tawk.to Webhook Setup" />
            </CardContent>
          </Card>

          {/* IVR */}
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" /> IVR / Calling
              </CardTitle>
              <CardDescription>Capture leads from phone calls via your IVR provider</CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock code={ivrSnippet} label="IVR Webhook Setup" />
            </CardContent>
          </Card>

          {/* Test */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">🧪 Test Integration</CardTitle>
              <CardDescription>Use this curl command to test the webhook</CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock code={testSnippet} label="Test Command" />
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">✅ Built-in Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>✓ <strong>Duplicate Detection</strong> — Same mobile within 30 days logs activity instead of creating duplicate</li>
                <li>✓ <strong>Round-Robin Assignment</strong> — Leads auto-assigned to active agents</li>
                <li>✓ <strong>Auto City Detection</strong> — City derived from website domain if not provided</li>
                <li>✓ <strong>Website Mapping</strong> — Domain auto-mapped to website name</li>
                <li>✓ <strong>Source Tracking</strong> — Form, WhatsApp, Chat, IVR tracked separately</li>
                <li>✓ <strong>Notifications</strong> — Agents notified when new lead assigned</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
