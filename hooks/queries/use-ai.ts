"use client";

import { useCallback, useReducer, useRef } from "react";
import type { ChatMessage, Source } from "@/lib/api/ai.api";
import { streamChatMessage } from "@/lib/api/ai.stream";

interface AiChatState {
  messages: ChatMessage[];
  sourcesMap: Record<number, Source[]>;
  isStreaming: boolean;
  error: string | null;
  activeModel: string | null;
}

type Action =
  | { type: "send"; content: string }
  | { type: "delta"; text: string }
  | { type: "sources"; index: number; sources: Source[]; model?: string }
  | { type: "done" }
  | { type: "error"; message: string }
  | { type: "reset" };

const initialState: AiChatState = {
  messages: [],
  sourcesMap: {},
  isStreaming: false,
  error: null,
  activeModel: null,
};

function reducer(state: AiChatState, action: Action): AiChatState {
  switch (action.type) {
    case "send":
      return {
        ...state,
        error: null,
        isStreaming: true,
        // Append the user message AND an empty assistant message we'll stream into.
        messages: [
          ...state.messages,
          { role: "user", content: action.content },
          { role: "assistant", content: "" },
        ],
      };
    case "delta": {
      const messages = state.messages.slice();
      const last = messages[messages.length - 1];
      if (last && last.role === "assistant") {
        messages[messages.length - 1] = { ...last, content: last.content + action.text };
      }
      return { ...state, messages };
    }
    case "sources":
      return {
        ...state,
        sourcesMap: { ...state.sourcesMap, [action.index]: action.sources },
        activeModel: action.model ?? state.activeModel,
      };
    case "done":
      return { ...state, isStreaming: false };
    case "error": {
      // Drop the trailing empty assistant placeholder on error.
      const messages = state.messages.slice();
      const last = messages[messages.length - 1];
      if (last && last.role === "assistant" && last.content === "") messages.pop();
      return { ...state, messages, isStreaming: false, error: action.message };
    }
    case "reset":
      return { ...initialState };
    default:
      return state;
  }
}

export function useAiChat() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const abortRef = useRef<AbortController | null>(null);
  // Track history without re-creating `send` on every message.
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = state.messages;

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // history = everything before this turn (exclude the placeholders we're about to add).
    const history = messagesRef.current.filter((m) => m.content !== "");
    // The assistant message we stream into will be at this index.
    const assistantIndex = messagesRef.current.length + 1;

    dispatch({ type: "send", content: trimmed });

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      for await (const event of streamChatMessage(trimmed, history, controller.signal)) {
        if (event.type === "sources") {
          const model = (event.meta as { model?: string } | undefined)?.model;
          dispatch({ type: "sources", index: assistantIndex, sources: event.sources, model });
        } else if (event.type === "delta") {
          dispatch({ type: "delta", text: event.text });
        } else if (event.type === "error") {
          dispatch({ type: "error", message: event.message });
          return;
        }
      }
      dispatch({ type: "done" });
    } catch (err) {
      if (controller.signal.aborted) {
        dispatch({ type: "done" });
      } else {
        dispatch({
          type: "error",
          message: err instanceof Error ? err.message : "AI service is unavailable. Please try again.",
        });
      }
    } finally {
      abortRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    dispatch({ type: "reset" });
  }, []);

  return {
    messages: state.messages,
    sourcesMap: state.sourcesMap,
    isStreaming: state.isStreaming,
    error: state.error,
    activeModel: state.activeModel,
    send,
    cancel,
    reset,
  };
}
