import { apiClient } from '@/lib/axios';
import { useAuthStore } from '@/stores/useAuthStore';
import { ChatError, readChatStream } from './stream';
import type { ChatStatus } from './stream';

export interface ChatRoom { id: number; created_at: string; expires_at: string | null }
export interface ChatMessage { id: number; role: 'user' | 'assistant'; content: string; created_at: string; references?: unknown; clarification_yes_no?: boolean }
export interface ChatQuota { date: string; limit: number; used: number; remaining: number; resets_at: string; can_start: boolean; required_reservation: number; maintenance?: boolean; dev_unlimited?: boolean }
export interface ChatSettings { maintenance: boolean; premium_daily_tokens: number; admin_daily_tokens: number }
export interface ChatStat { date: string; state: string; outcome: string | null; feature: string | null; clarification_reason: string | null; count: number; tokens: number; unconfirmed_reserved_tokens: number; average_duration_ms: number | null }
export interface ChatStats { data: ChatStat[]; cache_stats_available: boolean; clarification_stats_available: boolean }

type Envelope<T> = { data: T };
function roomId(id: number): number {
  if (!Number.isSafeInteger(id) || id <= 0) throw new ChatError('Identitas percakapan tidak valid.');
  return id;
}
export const chatApi = {
  async rooms() { return (await apiClient.get<Envelope<ChatRoom[]>>('/chat/rooms')).data.data; },
  async createRoom() { const room = (await apiClient.post<Envelope<ChatRoom>>('/chat/rooms')).data.data; roomId(room.id); return room; },
  async messages(id: number) { return (await apiClient.get<Envelope<ChatMessage[]>>(`/chat/rooms/${roomId(id)}/messages`)).data.data; },
  async removeRoom(id: number) { await apiClient.delete(`/chat/rooms/${roomId(id)}`); },
  async quota() { return (await apiClient.get<Envelope<ChatQuota>>('/chat/quota')).data.data; },
  async settings() { return (await apiClient.get<Envelope<ChatSettings>>('/admin/chat/settings')).data.data; },
  async saveSettings(settings: ChatSettings) { return (await apiClient.put<Envelope<ChatSettings>>('/admin/chat/settings', settings)).data.data; },
  async stats() { return (await apiClient.get<ChatStats>('/admin/chat/stats')).data; },
};

// Fetch diperlukan karena Axios browser tidak menyediakan stream POST yang dapat dibaca bertahap.
export async function sendChat(id: number, operationId: string, message: string, signal: AbortSignal, onStatus: (status: ChatStatus) => void, devUnlimited = false) {
  const token = useAuthStore.getState().token;
  if (!token) throw new ChatError('Silakan masuk terlebih dahulu.', 'AUTH_REQUIRED', 401);
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (signal.aborted) controller.abort(); else signal.addEventListener('abort', cancel, { once: true });
  const timer = devUnlimited ? undefined : setTimeout(() => controller.abort(), 55000);
  try {
    const base = (apiClient.defaults.baseURL || '/api/v1').replace(/\/$/, '');
    const response = await fetch(`${base}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream', Authorization: `Bearer ${token}` }, body: JSON.stringify({ room_id: roomId(id), operation_id: operationId, message }), signal: controller.signal, cache: 'no-store' });
    if (!response.ok) {
      let body: { code?: string; error?: string } = {};
      try { body = await response.json(); } catch { /* Gunakan pesan umum saat server tidak mengirim JSON. */ }
      if (response.status === 401 && useAuthStore.getState().token === token) useAuthStore.getState().logout();
      throw new ChatError(typeof body.error === 'string' ? body.error : 'Sistem sedang mengalami masalah. Silakan coba lagi.', body.code, response.status);
    }
    if (!response.body || !response.headers.get('content-type')?.toLowerCase().startsWith('text/event-stream')) throw new ChatError('Respons chatbot tidak valid.');
    return await readChatStream(response.body, onStatus);
  } catch (error) {
    if (error instanceof ChatError || signal.aborted) throw error;
    if (controller.signal.aborted) throw new ChatError('Waktu tunggu habis. Periksa histori sebelum mencoba lagi.');
    throw new ChatError('Koneksi ke chatbot gagal. Silakan periksa jaringan dan coba lagi.');
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', cancel);
  }
}
