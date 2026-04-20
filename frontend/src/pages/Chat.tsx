import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  ChevronLeft,
  ChevronRight,
  History,
  MessageSquarePlus,
  Send,
  Server,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConfidenceBar, SentimentBadge, UrgencyBadge } from "@/components/StatusBadges";
import { getChatHistory, postChat, postFeedback, type ChatMessage, type ChatSession } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const detectMeta = (text: string): Pick<ChatMessage, "sentiment" | "urgency"> | {} => {
  const t = text.toLowerCase().trim();
  
  // Skip categorization for simple conversational back-and-forth
  if (t.length < 15 && /^(yes|no|y|n|thanks|thank you|ok|okay|sure|great)$/i.test(t)) {
    return {};
  }
  
  const negative = /(angry|frustrat|broken|down|terrible|awful|never|hate|urgent|asap|critical)/.test(t);
  const positive = /(thank|great|awesome|love|perfect)/.test(t);
  const urgency = /(critical|production|outage|down)/.test(t)
    ? "critical"
    : /(urgent|asap|now)/.test(t)
    ? "high"
    : negative
    ? "medium"
    : "low";
  const sentiment = negative ? "negative" : positive ? "positive" : "neutral";
  return { sentiment, urgency };
};

const Chat = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getChatHistory().then(setSessions);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const activeSession = useMemo(() => sessions.find((s) => s.id === activeId), [sessions, activeId]);

  const newChat = () => {
    setActiveId(null);
    setMessages([]);
  };

  const openSession = (s: ChatSession) => {
    setActiveId(s.id);
    setMessages(s.messages);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    const meta = detectMeta(text);
    const userMsg: ChatMessage = { role: "user", content: text, timestamp: new Date().toISOString(), ...meta };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setSending(true);
    try {
      const res = await postChat({ session_id: activeId, message: text });
      setActiveId(res.session_id);
      setMessages((m) => [...m, res.reply]);
      if (res.escalated) toast.warning("Escalated to a human responder", { description: "A specialist has been paged." });
      
      // Refresh the sidebar so the ticket status updates live
      getChatHistory().then(setSessions);
    } catch (e) {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const sendFeedback = async (idx: number, helpful: boolean) => {
    if (!activeId) return;
    setMessages((m) => m.map((msg, i) => (i === idx ? { ...msg, feedback: helpful ? "up" : "down" } : msg)));
    await postFeedback({ session_id: activeId, message_index: idx, helpful });
    toast.success(helpful ? "Thanks for the feedback" : "Noted — we'll improve this");
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "relative z-10 flex h-full flex-col border-r border-border bg-sidebar/60 backdrop-blur-xl transition-[width] duration-300",
          collapsed ? "w-[68px]" : "w-[300px]"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4">
          <Logo compact={collapsed} />
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Toggle sidebar"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <div className="px-3">
          <Button
            onClick={newChat}
            className={cn(
              "w-full justify-start gap-2 bg-gradient-cyan text-primary-foreground hover:opacity-90 shadow-glow",
              collapsed && "justify-center px-0"
            )}
          >
            <MessageSquarePlus className="h-4 w-4" />
            {!collapsed && <span>New conversation</span>}
          </Button>
        </div>

        <div className="mt-5 flex-1 overflow-y-auto scrollbar-thin px-2">
          {!collapsed && (
            <div className="px-2 pb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-1.5">
              <History className="h-3 w-3" /> Recent sessions
            </div>
          )}
          <div className="space-y-1">
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => openSession(s)}
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left text-sm surface-hover border border-transparent",
                  activeId === s.id && "bg-secondary/60 border-border-strong"
                )}
              >
                {collapsed ? (
                  <div className="grid h-7 w-7 place-items-center rounded-md bg-secondary text-muted-foreground">
                    <Server className="h-3.5 w-3.5" />
                  </div>
                ) : (
                  <>
                    <div className="truncate text-foreground/90">{s.title}</div>
                    <div className="mt-0.5 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{new Date(s.updated_at).toLocaleDateString()}</span>
                      <StatusDot status={s.status} />
                    </div>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-border p-3">
          {!collapsed ? (
            <div className="glass rounded-lg p-3 text-xs">
              <div className="flex items-center gap-1.5 text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                <span className="font-medium">AI Assistant</span>
              </div>
              <p className="mt-1 text-muted-foreground leading-relaxed">
                Resolutions are AI-generated. Critical incidents are auto-escalated to humans.
              </p>
            </div>
          ) : (
            <Sparkles className="mx-auto h-4 w-4 text-primary" />
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex h-full flex-1 flex-col">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-background/40 px-6 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-secondary">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-foreground">
                {activeSession?.title ?? "New conversation"}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {activeSession ? `Session ${activeSession.id}` : "Start typing to begin"}
              </div>
            </div>
          </div>
          <UserMenu />
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-4 py-8 md:px-10">
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.length === 0 ? (
              <EmptyState onPick={(q) => setInput(q)} />
            ) : (
              messages.map((m, i) => (
                <MessageBubble key={i} message={m} index={i} onFeedback={sendFeedback} />
              ))
            )}
            {sending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-secondary">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Resolving…
              </div>
            )}
          </div>
        </div>

        {/* Composer */}
        <div className="border-t border-border bg-background/40 px-4 py-4 backdrop-blur-xl md:px-10">
          <div className="mx-auto max-w-3xl">
            <div className="glass-strong flex items-end gap-2 rounded-2xl p-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Describe your issue — Auto-Resolve will analyze and respond…"
                rows={1}
                className="min-h-[44px] max-h-40 resize-none border-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
              />
              <Button
                onClick={send}
                disabled={!input.trim() || sending}
                className="h-10 gap-1.5 bg-gradient-cyan text-primary-foreground hover:opacity-90"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send
              </Button>
            </div>
            <p className="mt-2 px-1 text-[11px] text-muted-foreground">
              Press Enter to send · Shift+Enter for newline
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusDot = ({ status }: { status: ChatSession["status"] }) => {
  const tone =
    status === "resolved"
      ? "bg-emerald-400"
      : status === "in_progress"
      ? "bg-amber-400"
      : status === "open"
      ? "bg-rose-400"
      : "bg-primary";
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn("h-1.5 w-1.5 rounded-full", tone)} />
      <span className="capitalize">{status.replace("_", " ")}</span>
    </span>
  );
};

const EmptyState = ({ onPick }: { onPick: (q: string) => void }) => {
  const prompts = [
    "Production API returning 429 errors",
    "Refund a duplicate billing charge",
    "Reset 2FA after losing my phone",
    "Why are CSV exports missing columns?",
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-2xl text-center pt-8"
    >
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-cyan shadow-glow">
        <Bot className="h-7 w-7 text-primary-foreground" strokeWidth={2.2} />
      </div>
      <h2 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">How can we resolve this for you?</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Auto-Resolve detects sentiment, urgency, and category — then proposes a fix with a confidence score.
      </p>
      <div className="mt-7 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {prompts.map((p) => (
          <button
            key={p}
            onClick={() => onPick(p)}
            className="glass surface-hover rounded-xl px-4 py-3 text-left text-sm text-foreground/90"
          >
            {p}
          </button>
        ))}
      </div>
    </motion.div>
  );
};

const MessageBubble = ({
  message,
  index,
  onFeedback,
}: {
  message: ChatMessage;
  index: number;
  onFeedback: (idx: number, helpful: boolean) => void;
}) => {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary border border-border">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}
      <div className={cn("max-w-[78%] space-y-2", isUser && "items-end")}>
        {(message.sentiment || message.urgency || message.category) && (
          <div className={cn("flex flex-wrap items-center gap-1.5", isUser && "justify-end")}>
            <SentimentBadge value={message.sentiment} />
            <UrgencyBadge value={message.urgency} />
            {message.category && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border-strong bg-secondary/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                {message.category}
              </span>
            )}
          </div>
        )}
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
            isUser ? "bg-gradient-user text-primary-foreground rounded-tr-sm" : "glass text-foreground rounded-tl-sm"
          )}
        >
          {message.escalated && !isUser && (
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-rose-400">
              <ShieldAlert className="h-3.5 w-3.5" /> Escalated to human responder
            </div>
          )}
          {message.content}
          {!isUser && typeof message.confidence === "number" && (
            <div className="mt-3 border-t border-border pt-3">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Resolution confidence</div>
              <ConfidenceBar value={message.confidence} />
            </div>
          )}
        </div>
        {!isUser && (
          <div className="flex items-center gap-1 pl-1">
            <button
              onClick={() => onFeedback(index, true)}
              className={cn(
                "grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-emerald-400",
                message.feedback === "up" && "bg-emerald-400/10 text-emerald-400"
              )}
              aria-label="Helpful"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onFeedback(index, false)}
              className={cn(
                "grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-rose-400",
                message.feedback === "down" && "bg-rose-400/10 text-rose-400"
              )}
              aria-label="Not helpful"
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Chat;
