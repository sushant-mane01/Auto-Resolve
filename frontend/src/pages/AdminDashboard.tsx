import { useEffect, useMemo, useState } from "react";
import { Activity, BookOpen, LayoutDashboard, MessageSquare, Plus, Search, Trash2, TicketCheck, Pencil, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  createKB,
  deleteKB,
  getAdminAnalytics,
  getAdminSessions,
  getAdminTickets,
  getKB,
  subscribeAdminEvents,
  updateAdminTicket,
  updateKB,
  type ChatSession,
  type KBArticle,
  type Ticket,
  type TicketStatus,
} from "@/lib/api";
import { ConfidenceBar, SentimentBadge, UrgencyBadge } from "@/components/StatusBadges";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

const TAB_DEFS = [
  { id: "analytics", label: "Analytics", icon: LayoutDashboard },
  { id: "tickets", label: "Tickets", icon: TicketCheck },
  { id: "sessions", label: "Sessions", icon: MessageSquare },
  { id: "kb", label: "Knowledge Base", icon: BookOpen },
] as const;

const AdminDashboard = () => {
  const [tab, setTab] = useState<(typeof TAB_DEFS)[number]["id"]>("analytics");

  // SSE — escalation toasts
  useEffect(() => {
    const unsub = subscribeAdminEvents((e) => {
      toast.error(`New escalation · ${e.ticket.id}`, {
        description: `${e.ticket.user_name} — ${e.ticket.subject}`,
      });
    });
    return unsub;
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/60 px-6 backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <Logo />
          <div className="hidden md:flex items-center gap-1.5 rounded-full border border-border-strong bg-secondary/40 px-2.5 py-1 text-[11px] uppercase tracking-wider text-muted-foreground">
            <Activity className="h-3 w-3 text-emerald-400" />
            <span>Live</span>
          </div>
        </div>
        <UserMenu />
      </header>

      <main className="flex-1 px-6 py-6 md:px-10">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-6 flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Admin Console</h1>
            <p className="text-sm text-muted-foreground">
              Monitor resolution health, triage tickets, and curate the knowledge base.
            </p>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList className="glass mb-6 h-11 gap-1 bg-transparent p-1">
              {TAB_DEFS.map((t) => (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  className="gap-2 data-[state=active]:bg-secondary data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="analytics"><AnalyticsTab /></TabsContent>
            <TabsContent value="tickets"><TicketsTab /></TabsContent>
            <TabsContent value="sessions"><SessionsTab /></TabsContent>
            <TabsContent value="kb"><KBTab /></TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

// ---------------- Analytics ----------------
const PIE_COLORS = ["hsl(158 75% 50%)", "hsl(220 10% 62%)", "hsl(350 85% 60%)"];
const BAR_COLORS = ["hsl(187 95% 55%)", "hsl(200 95% 50%)", "hsl(220 80% 60%)", "hsl(260 70% 65%)", "hsl(38 95% 58%)", "hsl(158 75% 50%)"];

const AnalyticsTab = () => {
  const [data, setData] = useState<Awaited<ReturnType<typeof getAdminAnalytics>> | null>(null);
  useEffect(() => { getAdminAnalytics().then(setData); }, []);
  if (!data) return <div className="text-sm text-muted-foreground">Loading metrics…</div>;

  const metrics = [
    { label: "Total sessions", value: data.metrics.total_sessions.toLocaleString(), tone: "text-foreground" },
    { label: "Resolution rate", value: `${(data.metrics.resolution_rate * 100).toFixed(1)}%`, tone: "text-emerald-400" },
    { label: "Avg confidence", value: `${(data.metrics.avg_confidence * 100).toFixed(0)}%`, tone: "text-primary" },
    { label: "Escalations · 24h", value: data.metrics.escalations_24h, tone: "text-rose-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="glass rounded-xl p-5">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{m.label}</div>
            <div className={cn("mt-2 text-3xl font-semibold tracking-tight tabular-nums", m.tone)}>{m.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="glass rounded-xl p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-foreground">Resolution vs Escalation</div>
              <div className="text-[11px] text-muted-foreground">Last 14 days</div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.timeseries}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(187 95% 55%)" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="hsl(187 95% 55%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(350 85% 60%)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="hsl(350 85% 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(220 15% 100% / 0.05)" vertical={false} />
                <XAxis dataKey="day" stroke="hsl(220 10% 62%)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(220 10% 62%)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(240 18% 9%)", border: "1px solid hsl(220 15% 100% / 0.08)", borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: "hsl(210 40% 98%)" }}
                />
                <Area type="monotone" dataKey="Resolved" stroke="hsl(187 95% 55%)" fill="url(#g1)" strokeWidth={2} />
                <Area type="monotone" dataKey="Escalated" stroke="hsl(350 85% 60%)" fill="url(#g2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-xl p-5">
          <div className="text-sm font-medium text-foreground">Sentiment distribution</div>
          <div className="text-[11px] text-muted-foreground">All sessions</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.sentiment} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {data.sentiment.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="transparent" />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(240 18% 9%)", border: "1px solid hsl(220 15% 100% / 0.08)", borderRadius: 12, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11, color: "hsl(220 10% 62%)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="glass rounded-xl p-5 lg:col-span-2">
          <div className="text-sm font-medium text-foreground">Top categories</div>
          <div className="text-[11px] text-muted-foreground">Sessions by detected topic</div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.categories}>
                <CartesianGrid stroke="hsl(220 15% 100% / 0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(220 10% 62%)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(220 10% 62%)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "hsl(220 15% 100% / 0.04)" }} contentStyle={{ background: "hsl(240 18% 9%)", border: "1px solid hsl(220 15% 100% / 0.08)", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {data.categories.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-xl p-5">
          <div className="text-sm font-medium text-foreground">User feedback</div>
          <div className="text-[11px] text-muted-foreground">Aggregate ratings</div>
          <div className="mt-6 space-y-5">
            <FeedbackRow label="Helpful" value={data.feedback.thumbs_up} total={data.feedback.thumbs_up + data.feedback.thumbs_down} tone="bg-emerald-400" />
            <FeedbackRow label="Not helpful" value={data.feedback.thumbs_down} total={data.feedback.thumbs_up + data.feedback.thumbs_down} tone="bg-rose-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

const FeedbackRow = ({ label, value, total, tone }: { label: string; value: number; total: number; tone: string }) => {
  const pct = Math.round((value / total) * 100);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums text-foreground">{value.toLocaleString()} · {pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary/60">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// ---------------- Tickets ----------------
const TicketsTab = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState<"all" | TicketStatus>("all");

  useEffect(() => { getAdminTickets().then(setTickets); }, []);

  const filtered = useMemo(() => filter === "all" ? tickets : tickets.filter(t => t.status === filter), [tickets, filter]);

  const change = async (t: Ticket, status: TicketStatus) => {
    setTickets((all) => all.map((x) => (x.id === t.id ? { ...x, status } : x)));
    await updateAdminTicket(t.id, status);
    toast.success(`${t.id} · ${status.replace("_", " ")}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {(["all", "open", "in_progress", "resolved"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs capitalize",
                filter === s ? "border-primary/40 bg-primary/10 text-primary" : "border-border-strong text-muted-foreground hover:text-foreground"
              )}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">{filtered.length} ticket(s)</div>
      </div>

      <div className="glass overflow-hidden rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3 font-medium">Ticket</th>
              <th className="px-5 py-3 font-medium">Requester</th>
              <th className="px-5 py-3 font-medium">Subject</th>
              <th className="px-5 py-3 font-medium">Urgency</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/20">
                <td className="px-5 py-3">
                  <div className="font-medium text-foreground">{t.id}</div>
                  <div className="text-[11px] text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</div>
                </td>
                <td className="px-5 py-3">
                  <div className="text-foreground">{t.user_name}</div>
                  <div className="text-[11px] text-muted-foreground">{t.user_email}</div>
                </td>
                <td className="px-5 py-3 text-foreground/90">{t.subject}</td>
                <td className="px-5 py-3"><UrgencyBadge value={t.urgency} /></td>
                <td className="px-5 py-3"><StatusPill status={t.status} /></td>
                <td className="px-5 py-3 text-right">
                  <Select value={t.status} onValueChange={(v) => change(t, v as TicketStatus)}>
                    <SelectTrigger className="ml-auto h-8 w-36 bg-secondary/50 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">No tickets in this view.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StatusPill = ({ status }: { status: TicketStatus }) => {
  const cfg = {
    open: "text-rose-400 border-rose-400/30 bg-rose-400/5",
    in_progress: "text-amber-400 border-amber-400/30 bg-amber-400/5",
    resolved: "text-emerald-400 border-emerald-400/30 bg-emerald-400/5",
  }[status];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider", cfg)}>
      {status.replace("_", " ")}
    </span>
  );
};

// ---------------- Sessions ----------------
const SessionsTab = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [q, setQ] = useState("");
  const [active, setActive] = useState<ChatSession | null>(null);

  useEffect(() => { getAdminSessions().then(setSessions); }, []);

  const filtered = useMemo(() => {
    const t = q.toLowerCase().trim();
    if (!t) return sessions;
    return sessions.filter(s =>
      s.title.toLowerCase().includes(t) ||
      s.user_email.toLowerCase().includes(t) ||
      s.user_name.toLowerCase().includes(t) ||
      s.id.includes(t)
    );
  }, [q, sessions]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by user, title, or session id…" className="h-10 pl-9 bg-secondary/40 border-border-strong" />
      </div>

      <div className="glass overflow-hidden rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3 font-medium">Session</th>
              <th className="px-5 py-3 font-medium">User</th>
              <th className="px-5 py-3 font-medium">Title</th>
              <th className="px-5 py-3 font-medium">Updated</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} onClick={() => setActive(s)} className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-secondary/20">
                <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{s.id}</td>
                <td className="px-5 py-3">
                  <div className="text-foreground">{s.user_name}</div>
                  <div className="text-[11px] text-muted-foreground">{s.user_email}</div>
                </td>
                <td className="px-5 py-3 text-foreground/90">{s.title}</td>
                <td className="px-5 py-3 text-muted-foreground">{new Date(s.updated_at).toLocaleString()}</td>
                <td className="px-5 py-3">
                  {s.status === "active" ? (
                    <span className="text-[10px] uppercase tracking-wider text-primary">active</span>
                  ) : (
                    <StatusPill status={s.status as TicketStatus} />
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">No sessions match your search.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="glass-strong max-h-[80vh] max-w-2xl overflow-y-auto scrollbar-thin">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              {active?.title}
            </DialogTitle>
            <div className="text-xs text-muted-foreground">{active?.user_name} · {active?.user_email} · {active?.id}</div>
          </DialogHeader>
          <div className="mt-2 space-y-3">
            {active?.messages.map((m, i) => (
              <div key={i} className={cn("rounded-lg p-3 text-sm", m.role === "user" ? "bg-secondary/40" : "glass")}>
                <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span>{m.role}</span>
                  <SentimentBadge value={m.sentiment} />
                  <UrgencyBadge value={m.urgency} />
                </div>
                <div className="whitespace-pre-wrap text-foreground/90">{m.content}</div>
                {typeof m.confidence === "number" && (
                  <div className="mt-2"><ConfidenceBar value={m.confidence} /></div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ---------------- Knowledge Base ----------------
const KBTab = () => {
  const [items, setItems] = useState<KBArticle[]>([]);
  const [editing, setEditing] = useState<KBArticle | null>(null);
  const [open, setOpen] = useState(false);

  const load = () => getKB().then(setItems);
  useEffect(() => { load(); }, []);

  const onSave = async (input: { title: string; category: string; content: string }) => {
    if (editing) {
      await updateKB(editing.id, input);
      toast.success("Article updated");
    } else {
      await createKB(input);
      toast.success("Article created");
    }
    setOpen(false);
    setEditing(null);
    load();
  };

  const onDelete = async (id: string) => {
    await deleteKB(id);
    toast.success("Article deleted");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-foreground">Resolution articles</div>
          <div className="text-[11px] text-muted-foreground">Curated knowledge powering AI resolutions</div>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="gap-1.5 bg-gradient-cyan text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4" /> New article
        </Button>
      </div>

      <div className="glass overflow-hidden rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3 font-medium">Title</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Updated</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/20">
                <td className="px-5 py-3">
                  <div className="font-medium text-foreground">{a.title}</div>
                  <div className="line-clamp-1 text-[11px] text-muted-foreground">{a.content}</div>
                </td>
                <td className="px-5 py-3">
                  <span className="rounded-full border border-border-strong bg-secondary/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{a.category}</span>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{new Date(a.updated_at).toLocaleDateString()}</td>
                <td className="px-5 py-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    <button onClick={() => { setEditing(a); setOpen(true); }} className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Edit">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => onDelete(a.id)} className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-rose-400/10 hover:text-rose-400" aria-label="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">No articles yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <KBEditor open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }} editing={editing} onSave={onSave} />
    </div>
  );
};

const KBEditor = ({
  open, onOpenChange, editing, onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: KBArticle | null;
  onSave: (input: { title: string; category: string; content: string }) => void;
}) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");
  const [content, setContent] = useState("");

  useEffect(() => {
    setTitle(editing?.title ?? "");
    setCategory(editing?.category ?? "General");
    setContent(editing?.content ?? "");
  }, [editing, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit article" : "New article"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Resetting 2FA" className="bg-secondary/40 border-border-strong" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-secondary/40 border-border-strong"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["General", "Account", "Billing", "API", "Reporting", "Incident"].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Content</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} placeholder="Resolution steps…" className="bg-secondary/40 border-border-strong" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="gap-1.5"><X className="h-4 w-4" /> Cancel</Button>
          <Button
            disabled={!title.trim() || !content.trim()}
            onClick={() => onSave({ title: title.trim(), category, content: content.trim() })}
            className="bg-gradient-cyan text-primary-foreground hover:opacity-90"
          >
            {editing ? "Save changes" : "Create article"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminDashboard;
