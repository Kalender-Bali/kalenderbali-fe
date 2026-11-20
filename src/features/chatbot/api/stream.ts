export type ChatStatus = { stage: string; feature?: string };
export type ChatAnswer = { answer: string; clarification_reason?: string; references?: unknown; usage?: { total_tokens: number } };

export class ChatError extends Error {
  code?: string;
  status?: number;
  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// Gabungkan potongan byte sebelum membaca event; jawaban hanya diterima setelah event lengkap.
export async function readChatStream(body: ReadableStream<Uint8Array>, onStatus: (status: ChatStatus) => void): Promise<ChatAnswer> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let total = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > 1024 * 1024) throw new ChatError('Jawaban terlalu besar untuk ditampilkan.');
      buffer += decoder.decode(value, { stream: true });
      let boundary: RegExpExecArray | null;
      while ((boundary = /\r?\n\r?\n/.exec(buffer))) {
        const frame = buffer.slice(0, boundary.index);
        buffer = buffer.slice(boundary.index + boundary[0].length);
        let event = 'message';
        const data: string[] = [];
        for (const line of frame.split(/\r?\n/)) {
          if (line.startsWith('event:')) event = line.slice(6).trim();
          if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
        }
        if (!data.length) continue;
        let payload: unknown;
        try { payload = JSON.parse(data.join('\n')); } catch { throw new ChatError('Respons chatbot tidak valid.'); }
        if (!payload || typeof payload !== 'object') throw new ChatError('Respons chatbot tidak valid.');
        const item = payload as Record<string, unknown>;
        if (event === 'status' && typeof item.stage === 'string') onStatus(item as ChatStatus);
        if (event === 'error') {
          const error = item.error as { message?: unknown; code?: unknown } | undefined;
          throw new ChatError(typeof error?.message === 'string' ? error.message : 'Sistem sedang mengalami masalah. Silakan coba lagi.', typeof error?.code === 'string' ? error.code : undefined);
        }
        if (event === 'answer') {
          if (typeof item.answer !== 'string' || !item.answer.trim()) throw new ChatError('Jawaban chatbot tidak valid.');
          return item as ChatAnswer;
        }
      }
    }
    throw new ChatError('Koneksi terputus sebelum jawaban selesai. Silakan coba lagi.');
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
