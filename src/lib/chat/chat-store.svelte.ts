/**
 * Svelte 5 reactive chat store for AG-UI agent communication
 */

import { AGUIChatClient, type ChatMessage, type ChatStatus } from "./ag-ui-client";

function createChatStore() {
  let messages = $state<ChatMessage[]>([]);
  let status = $state<ChatStatus>("idle");
  let error = $state<string | null>(null);
  let currentStreamingContent = $state<string>("");
  let currentMessageId = $state<string | null>(null);
  let currentAgent = $state<string>("default");

  let client: AGUIChatClient | null = null;

  function init(agentId: string = "default") {
    currentAgent = agentId;
    client = new AGUIChatClient(agentId);
  }

  function setAgent(agentId: string) {
    currentAgent = agentId;
    client?.setAgent(agentId);
    // Clear messages when switching agents
    messages = [];
    error = null;
  }

  async function sendMessage(content: string) {
    if (!client || status === "streaming") return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };

    messages = [...messages, userMessage];
    status = "streaming";
    error = null;
    currentStreamingContent = "";
    currentMessageId = null;

    await client.sendMessage(messages, {
      onMessageStart: (messageId) => {
        currentMessageId = messageId;
        currentStreamingContent = "";
      },
      onMessageContent: (_messageId, delta) => {
        currentStreamingContent += delta;
      },
      onMessageEnd: (messageId) => {
        const assistantMessage: ChatMessage = {
          id: messageId,
          role: "assistant",
          content: currentStreamingContent,
        };
        messages = [...messages, assistantMessage];
        currentStreamingContent = "";
        currentMessageId = null;
      },
      onRunFinish: () => {
        status = "idle";
      },
      onError: (err) => {
        status = "error";
        error = err;
      },
    });
  }

  function cancel() {
    client?.cancel();
    status = "idle";
  }

  function clearMessages() {
    messages = [];
    error = null;
  }

  return {
    get messages() { return messages; },
    get status() { return status; },
    get error() { return error; },
    get currentStreamingContent() { return currentStreamingContent; },
    get isStreaming() { return status === "streaming"; },
    get currentAgent() { return currentAgent; },
    init,
    setAgent,
    sendMessage,
    cancel,
    clearMessages,
  };
}

export const chatStore = createChatStore();
