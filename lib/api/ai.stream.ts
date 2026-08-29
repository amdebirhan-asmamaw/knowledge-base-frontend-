import { getSession } from "next-auth/react";
import type { ChatMessage, Source } from "./ai.api";
import { API_BASE_URL } from "@/config/app.config";

const API_BASE = API_BASE_URL;

export type StreamEvent =
  | { type: "sources"; sources: Source[]; meta?: unknown }
  | { type: "delta"; text: string }
  | { type: "done"; reply: string }
  | { type: "error"; message: string };

/**
 * Stream an AI chat response via SSE.
 *
 * We use `fetch` rather than the native EventSource because EventSource cannot
 * attach the NextAuth bearer token. The backend writes `data: {json}\n\n` frames.
 */
export async function* streamChatMessage(
  message: string,
  history: ChatMessage[],
  signal?: AbortSignal,
): AsyncGenerator<StreamEvent> {
  const session = await getSession();
  const res = await fetch(`${API_BASE}/ai/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
    },
    body: JSON.stringify({ message, history }),
    signal,
  });

  if (!res.ok || !res.body) {
    let msg = "AI service is unavailable. Please try again.";
    try {
      const json = await res.json();
      msg = json.message ?? msg;
    } catch {
      /* non-JSON error body — keep default */
    }
    yield { type: "error", message: msg };
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE frames are separated by a blank line.
    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const line = frame.split("\n").find((l) => l.startsWith("data:"));
      if (!line) continue;
      const payload = line.slice(5).trim();
      if (!payload) continue;
      try {
        yield JSON.parse(payload) as StreamEvent;
      } catch {
        /* ignore malformed frame */
      }
    }
  }
}
