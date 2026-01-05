/**
 * AG-UI Client for pydantic-ai agent communication
 * Uses native fetch with SSE parsing for streaming responses
 */

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export type ChatStatus = "idle" | "streaming" | "error";

export interface ChatCallbacks {
  onMessageStart?: (messageId: string) => void;
  onMessageContent?: (messageId: string, delta: string) => void;
  onMessageEnd?: (messageId: string) => void;
  onRunStart?: (runId: string) => void;
  onRunFinish?: (runId: string) => void;
  onError?: (error: string) => void;
}

interface AGUIEvent {
  type: string;
  [key: string]: unknown;
}

export class AGUIChatClient {
  private url: string;
  private abortController: AbortController | null = null;

  constructor(agentId: string = "default") {
    // Use SvelteKit proxy route to avoid CORS/mixed-content issues
    this.url = `/api/chat?agent=${agentId}`;
  }

  setAgent(agentId: string) {
    this.url = `/api/chat?agent=${agentId}`;
  }

  async sendMessage(
    messages: ChatMessage[],
    callbacks: ChatCallbacks
  ): Promise<void> {
    this.abortController = new AbortController();

    // AG-UI RunAgentInput format (camelCase)
    const body = {
      threadId: crypto.randomUUID(),
      runId: crypto.randomUUID(),
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
      })),
      tools: [],
      context: [],
      state: null,
      forwardedProps: null,
    };

    try {
      const response = await fetch(this.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify(body),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          // Handle both "data:" and "data: " formats
          if (line.startsWith("data:")) {
            const data = line.slice(5).trim();
            if (data && data !== "[DONE]") {
              try {
                const event = JSON.parse(data) as AGUIEvent;
                this.handleEvent(event, callbacks);
              } catch (e) {
                console.warn("Failed to parse SSE event:", data, e);
              }
            }
          }
        }
      }

      // Handle any remaining buffer
      if (buffer.startsWith("data:")) {
        const data = buffer.slice(5).trim();
        if (data && data !== "[DONE]") {
          try {
            const event = JSON.parse(data) as AGUIEvent;
            this.handleEvent(event, callbacks);
          } catch {
            // Skip
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        callbacks.onError?.(
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    }
  }

  private handleEvent(event: AGUIEvent, callbacks: ChatCallbacks): void {
    // AG-UI protocol uses UPPERCASE event types
    const eventType = (event.type as string).toUpperCase();

    switch (eventType) {
      case "RUN_STARTED":
        callbacks.onRunStart?.(event.runId as string);
        break;
      case "TEXT_MESSAGE_START":
        callbacks.onMessageStart?.(event.messageId as string);
        break;
      case "TEXT_MESSAGE_CONTENT":
        callbacks.onMessageContent?.(
          event.messageId as string,
          event.delta as string
        );
        break;
      case "TEXT_MESSAGE_END":
        callbacks.onMessageEnd?.(event.messageId as string);
        break;
      case "RUN_FINISHED":
        callbacks.onRunFinish?.(event.runId as string);
        break;
      case "RUN_ERROR":
        callbacks.onError?.(event.message as string || "Agent error");
        break;
    }
  }

  cancel(): void {
    this.abortController?.abort();
  }
}
