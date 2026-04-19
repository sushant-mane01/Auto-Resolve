const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Chat APIs (no auth)
export async function sendMessage(sessionId: string | null, message: string) {
  const res = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, message }),
  })
  if (!res.ok) throw new Error('Chat request failed')
  return res.json()
}

export async function sendFeedback(sessionId: string, messageIndex: number, helpful: boolean) {
  const res = await fetch(`${API_BASE_URL}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, message_index: messageIndex, helpful }),
  })
  if (!res.ok) throw new Error('Feedback request failed')
  return res.json()
}

export async function getSession(sessionId: string) {
  const res = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`)
  if (!res.ok) throw new Error('Session fetch failed')
  return res.json()
}

// Admin APIs
function authHeaders(): HeadersInit {
  const token = localStorage.getItem('admin-token')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

export async function adminLogin(password: string) {
  const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  if (!res.ok) throw new Error('Login failed')
  return res.json()
}

export async function adminLogout() {
  const res = await fetch(`${API_BASE_URL}/api/admin/logout`, {
    method: 'POST',
    headers: authHeaders(),
  })
  return res.json()
}

export async function getAnalytics() {
  const res = await fetch(`${API_BASE_URL}/api/admin/analytics`, { headers: authHeaders() })
  if (res.status === 401) throw new Error('Unauthorized')
  if (!res.ok) throw new Error('Analytics fetch failed')
  return res.json()
}

export async function getAdminSessions() {
  const res = await fetch(`${API_BASE_URL}/api/admin/sessions`, { headers: authHeaders() })
  if (res.status === 401) throw new Error('Unauthorized')
  if (!res.ok) throw new Error('Sessions fetch failed')
  return res.json()
}

export async function getAdminSession(sessionId: string) {
  const res = await fetch(`${API_BASE_URL}/api/admin/sessions/${sessionId}`, { headers: authHeaders() })
  if (res.status === 401) throw new Error('Unauthorized')
  if (!res.ok) throw new Error('Session fetch failed')
  return res.json()
}

export async function getTickets() {
  const res = await fetch(`${API_BASE_URL}/api/admin/tickets`, { headers: authHeaders() })
  if (res.status === 401) throw new Error('Unauthorized')
  if (!res.ok) throw new Error('Tickets fetch failed')
  return res.json()
}

export async function updateTicketStatus(sessionId: string, ticketStatus: string) {
  const res = await fetch(`${API_BASE_URL}/api/admin/tickets/${sessionId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ ticket_status: ticketStatus }),
  })
  if (res.status === 401) throw new Error('Unauthorized')
  if (!res.ok) throw new Error('Ticket update failed')
  return res.json()
}

export async function getKnowledgeBase() {
  const res = await fetch(`${API_BASE_URL}/api/admin/kb`, { headers: authHeaders() })
  if (res.status === 401) throw new Error('Unauthorized')
  if (!res.ok) throw new Error('KB fetch failed')
  return res.json()
}

export async function addKBEntry(entry: { category: string; keywords: string[]; resolution: string; follow_up: string }) {
  const res = await fetch(`${API_BASE_URL}/api/admin/kb`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(entry),
  })
  if (res.status === 401) throw new Error('Unauthorized')
  if (!res.ok) throw new Error('KB add failed')
  return res.json()
}

export async function updateKBEntry(id: string, entry: Partial<{ category: string; keywords: string[]; resolution: string; follow_up: string }>) {
  const res = await fetch(`${API_BASE_URL}/api/admin/kb/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(entry),
  })
  if (res.status === 401) throw new Error('Unauthorized')
  if (!res.ok) throw new Error('KB update failed')
  return res.json()
}

export async function deleteKBEntry(id: string) {
  const res = await fetch(`${API_BASE_URL}/api/admin/kb/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (res.status === 401) throw new Error('Unauthorized')
  if (!res.ok) throw new Error('KB delete failed')
  return res.json()
}

export async function testKBQuery(query: string) {
  const res = await fetch(`${API_BASE_URL}/api/admin/kb/test`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ query }),
  })
  if (res.status === 401) throw new Error('Unauthorized')
  if (!res.ok) throw new Error('KB test failed')
  return res.json()
}

export function createSSEConnection(onEvent: (data: any) => void): EventSource {
  const token = localStorage.getItem('admin-token')
  const es = new EventSource(`${API_BASE_URL}/api/admin/events?authorization=Bearer+${token}`)
  es.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      onEvent(data)
    } catch {
      // ignore non-JSON messages
    }
  }
  return es
}
