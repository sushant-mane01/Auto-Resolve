// Real API layer — calls the FastAPI backend.
// All endpoints are proxied via Vite dev server: /api/* → http://localhost:3000/api/*

import type { AuthUser, Role } from "@/store/auth";

const BASE = import.meta.env.VITE_API_URL || ""; // Uses Vite proxy locally, VITE_API_URL in production

// ----------------------- Types -----------------------

export type Sentiment = "positive" | "neutral" | "negative";
export type Urgency = "low" | "medium" | "high" | "critical";
export type TicketStatus = "open" | "in_progress" | "resolved";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sentiment?: Sentiment;
  urgency?: Urgency;
  category?: string;
  confidence?: number;
  escalated?: boolean;
  feedback?: "up" | "down" | null;
}

export interface ChatSession {
  id: string;
  title: string;
  user_email: string;
  user_name: string;
  created_at: string;
  updated_at: string;
  status: TicketStatus | "active";
  messages: ChatMessage[];
}

export interface KBArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  session_id: string;
  user_name: string;
  user_email: string;
  subject: string;
  category: string;
  urgency: Urgency;
  status: TicketStatus;
  created_at: string;
}

// ----------------------- Helpers -----------------------

function getToken(): string | null {
  try {
    const stored = localStorage.getItem("ar.auth");
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed?.state?.token ?? null;
    }
  } catch {}
  return null;
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...authHeaders(),
    ...(options.headers as Record<string, string> || {}),
  };
  const res = await fetch(`${BASE}${url}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `API error ${res.status}`);
  }
  return res.json();
}

// ----------------------- Auth -----------------------

export async function loginWithGoogle(payload: { token: string }) {
  const data = await apiFetch<{
    success: boolean;
    token: string;
    role: Role;
    name: string;
    email: string;
  }>("/api/auth/google", {
    method: "POST",
    body: JSON.stringify({ token: payload.token }),
  });
  const user: AuthUser = { name: data.name, email: data.email, role: data.role };
  return { token: data.token, user };
}

export async function signInWithEmail(payload: { email: string; password: string }) {
  const data = await apiFetch<{
    success: boolean;
    token: string;
    role: Role;
    name: string;
    email: string;
  }>("/api/auth/signin", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const user: AuthUser = { name: data.name, email: data.email, role: data.role };
  return { token: data.token, user };
}

export async function signUpWithEmail(payload: { email: string; password: string }) {
  const data = await apiFetch<{
    success: boolean;
    token: string;
    role: Role;
    name: string;
    email: string;
  }>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const user: AuthUser = { name: data.name, email: data.email, role: data.role };
  return { token: data.token, user };
}

// ----------------------- Chat -----------------------

export async function getChatHistory(): Promise<ChatSession[]> {
  const data = await apiFetch<any[]>("/api/chat/history");
  return data.map((s) => ({
    id: s.session_id,
    title: s.first_message?.slice(0, 60) || "New Chat",
    user_email: "",
    user_name: "",
    created_at: s.created_at,
    updated_at: s.created_at,
    status: s.status as TicketStatus | "active",
    messages: (s.messages || []).map((m: any) => ({
      role: m.role,
      content: m.text || m.content || "",
      timestamp: m.timestamp || s.created_at,
      sentiment: m.sentiment,
      urgency: m.urgency,
      category: m.category,
      confidence: m.confidence,
      escalated: m.escalated,
      feedback: m.feedback ?? null,
    })),
  }));
}

export async function postChat(payload: { session_id: string | null; message: string }): Promise<{
  session_id: string;
  reply: ChatMessage;
  ticket_status: TicketStatus | "active";
  escalated: boolean;
}> {
  const data = await apiFetch<any>("/api/chat", {
    method: "POST",
    body: JSON.stringify({
      session_id: payload.session_id,
      message: payload.message,
    }),
  });

  const reply: ChatMessage = {
    role: "assistant",
    content: data.reply || "",
    timestamp: new Date().toISOString(),
    sentiment: data.sentiment as Sentiment | undefined,
    urgency: data.urgency as Urgency | undefined,
    category: data.category,
    confidence: data.confidence,
    escalated: data.escalated,
  };

  return {
    session_id: data.session_id,
    reply,
    ticket_status: data.ticket_status || "active",
    escalated: data.escalated || false,
  };
}

export async function postFeedback(payload: { session_id: string; message_index: number; helpful: boolean }) {
  return apiFetch("/api/feedback", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ----------------------- Admin: Analytics -----------------------

export async function getAdminAnalytics() {
  const data = await apiFetch<any>("/api/admin/analytics");
  
  return {
    metrics: {
      total_sessions: data.total_sessions || 0,
      resolution_rate: data.resolution_rate || 0,
      avg_confidence: data.avg_confidence || 0,
      escalations_24h: data.escalated_sessions || 0,
    },
    timeseries: ((data.queries_by_hour || []) as [string, number][]).map(([time, count]) => ({
      day: time,
      Resolved: count,
      Escalated: Math.floor(count * 0.1), // visually differentiate
    })),
    sentiment: Object.entries(data.sentiment_breakdown || {}).map(([name, value]) => ({ name, value })),
    categories: Object.entries(data.category_breakdown || {}).map(([name, value]) => ({ name, value })),
    feedback: {
      thumbs_up: data.feedback?.helpful || 0,
      thumbs_down: data.feedback?.unhelpful || 0,
    }
  };
}

// ----------------------- Admin: Sessions -----------------------

export async function getAdminSessions(): Promise<ChatSession[]> {
  const data = await apiFetch<any[]>("/api/admin/sessions");
  return data.map((s) => ({
    id: s.session_id,
    title: s.first_message?.slice(0, 60) || "Session",
    user_email: s.user_email || "",
    user_name: s.user_email?.split("@")[0] || "User",
    created_at: s.created_at,
    updated_at: s.created_at,
    status: (s.status || "active") as TicketStatus | "active",
    messages: (s.messages || []).map((m: any) => ({
      role: m.role,
      content: m.text || m.content || "",
      timestamp: m.timestamp || s.created_at,
      sentiment: m.sentiment,
      urgency: m.urgency,
      category: m.category,
      confidence: m.confidence,
      escalated: m.escalated,
      feedback: m.feedback ?? null,
    })),
  }));
}

// ----------------------- Admin: Tickets -----------------------

export async function getAdminTickets(): Promise<Ticket[]> {
  const data = await apiFetch<any[]>("/api/admin/tickets");
  return data.map((t) => ({
    id: t.ticket_id || t.id,
    session_id: t.session_id || "",
    user_name: t.user_email?.split("@")[0] || "User",
    user_email: t.user_email || "",
    subject: t.first_message?.slice(0, 80) || t.category || "Support ticket",
    category: t.category || "General",
    urgency: (t.urgency || "low") as Urgency,
    status: (t.ticket_status || t.status || "open") as TicketStatus,
    created_at: t.created_at || new Date().toISOString(),
  }));
}

export async function updateAdminTicket(id: string, status: TicketStatus): Promise<Ticket> {
  const data = await apiFetch<any>(`/api/admin/tickets/${id}`, {
    method: "PUT",
    body: JSON.stringify({ ticket_status: status }),
  });
  return {
    id: data.ticket_id || id,
    session_id: data.session_id || "",
    user_name: "",
    user_email: "",
    subject: "",
    category: "",
    urgency: "low",
    status: (data.ticket_status || status) as TicketStatus,
    created_at: "",
  };
}

// ----------------------- Admin: Knowledge Base -----------------------

export async function getKB(): Promise<KBArticle[]> {
  const data = await apiFetch<any[]>("/api/admin/kb");
  return data.map((entry) => ({
    id: String(entry.id),
    title: entry.problem_description?.slice(0, 60) || entry.category || "KB Article",
    category: entry.category || "General",
    content: [
      entry.problem_description,
      ...(Array.isArray(entry.resolution_steps) ? entry.resolution_steps : []),
    ].filter(Boolean).join("\n"),
    updated_at: entry.updated_at || new Date().toISOString(),
  }));
}

export async function createKB(input: Omit<KBArticle, "id" | "updated_at">): Promise<KBArticle> {
  // Map frontend fields → backend schema
  const data = await apiFetch<any>("/api/admin/kb", {
    method: "POST",
    body: JSON.stringify({
      category: input.category,
      keywords: input.title.split(/\s+/).slice(0, 5),
      resolution: input.content,
      follow_up: "",
    }),
  });
  return {
    id: String(data.id),
    title: input.title,
    category: input.category,
    content: input.content,
    updated_at: new Date().toISOString(),
  };
}

export async function updateKB(id: string, input: Partial<KBArticle>): Promise<KBArticle> {
  const body: any = {};
  if (input.category) body.category = input.category;
  if (input.content) body.resolution = input.content;
  if (input.title) body.keywords = input.title.split(/\s+/).slice(0, 5);

  const data = await apiFetch<any>(`/api/admin/kb/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return {
    id: String(data.id || id),
    title: input.title || "",
    category: input.category || data.category || "",
    content: input.content || "",
    updated_at: new Date().toISOString(),
  };
}

export async function deleteKB(id: string) {
  return apiFetch(`/api/admin/kb/${id}`, { method: "DELETE" });
}

// ----------------------- Admin: SSE Events -----------------------

export function subscribeAdminEvents(onEvent: (e: { type: "escalation"; ticket: Ticket }) => void) {
  const token = getToken();
  const url = token
    ? `${BASE}/api/admin/events?authorization=${encodeURIComponent(`Bearer ${token}`)}`
    : `${BASE}/api/admin/events`;

  const source = new EventSource(url);

  source.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "escalation") {
        const ticket: Ticket = {
          id: data.ticket_id || `TCK-${Date.now()}`,
          session_id: data.session_id || "",
          user_name: data.user_name || "User",
          user_email: data.user_email || "",
          subject: data.first_message?.slice(0, 80) || "Escalated ticket",
          category: data.category || "General",
          urgency: (data.urgency || "high") as Urgency,
          status: "open",
          created_at: data.timestamp || new Date().toISOString(),
        };
        onEvent({ type: "escalation", ticket });
      }
    } catch {}
  };

  source.onerror = () => {
    // EventSource will auto-reconnect
  };

  return () => source.close();
}
