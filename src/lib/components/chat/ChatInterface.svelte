<script lang="ts">
  import { onMount } from "svelte";
  import { chatStore } from "$lib/chat/chat-store.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import Spinner from "$lib/components/ui/spinner/spinner.svelte";

  interface Agent {
    id: string;
    name: string;
    description: string;
  }

  let inputValue = $state("");
  let messagesContainer: HTMLDivElement | null = $state(null);
  let agents = $state<Agent[]>([]);
  let selectedAgent = $state("default");
  let loadingAgents = $state(true);

  onMount(async () => {
    // Initialize chat store
    chatStore.init(selectedAgent);

    // Fetch available agents
    try {
      const response = await fetch("/api/agents");
      if (response.ok) {
        agents = await response.json();
      }
    } catch (error) {
      console.error("Failed to fetch agents:", error);
    } finally {
      loadingAgents = false;
    }
  });

  function scrollToBottom() {
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  $effect(() => {
    // Scroll when messages change or streaming content updates
    if (chatStore.messages.length || chatStore.currentStreamingContent) {
      scrollToBottom();
    }
  });

  function handleAgentChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    selectedAgent = select.value;
    chatStore.setAgent(selectedAgent);
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!inputValue.trim() || chatStore.isStreaming) return;

    const message = inputValue.trim();
    inputValue = "";
    await chatStore.sendMessage(message);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  function getSelectedAgentDescription(): string {
    const agent = agents.find((a) => a.id === selectedAgent);
    return agent?.description || "";
  }
</script>

<div class="flex h-full flex-col rounded-xl border bg-card">
  <!-- Header with Agent Selector -->
  <div class="flex flex-col gap-3 border-b px-4 py-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="size-2 rounded-full bg-green-500"></div>
        {#if loadingAgents}
          <span class="text-sm text-muted-foreground">Loading agents...</span>
        {:else}
          <select
            value={selectedAgent}
            onchange={handleAgentChange}
            disabled={chatStore.isStreaming}
            class="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          >
            {#each agents as agent (agent.id)}
              <option value={agent.id}>{agent.name}</option>
            {/each}
          </select>
        {/if}
      </div>
      <Button variant="ghost" size="sm" onclick={() => chatStore.clearMessages()}>
        Clear
      </Button>
    </div>
    {#if !loadingAgents && getSelectedAgentDescription()}
      <p class="text-xs text-muted-foreground">{getSelectedAgentDescription()}</p>
    {/if}
  </div>

  <!-- Messages -->
  <div
    bind:this={messagesContainer}
    class="flex-1 overflow-y-auto p-4 space-y-4"
  >
    {#if chatStore.messages.length === 0 && !chatStore.isStreaming}
      <div class="flex h-full items-center justify-center text-muted-foreground">
        <p class="text-sm">Start a conversation with the AI agent.</p>
      </div>
    {:else}
      {#each chatStore.messages as message (message.id)}
        <div
          class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}"
        >
          <div
            class="max-w-[80%] rounded-lg px-4 py-2 {message.role === 'user'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground'}"
          >
            <p class="whitespace-pre-wrap text-sm">{message.content}</p>
          </div>
        </div>
      {/each}

      <!-- Streaming message -->
      {#if chatStore.isStreaming && chatStore.currentStreamingContent}
        <div class="flex justify-start">
          <div class="max-w-[80%] rounded-lg bg-muted px-4 py-2 text-foreground">
            <p class="whitespace-pre-wrap text-sm">{chatStore.currentStreamingContent}</p>
          </div>
        </div>
      {:else if chatStore.isStreaming}
        <div class="flex justify-start">
          <div class="flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
            <Spinner class="size-4" />
            <span class="text-sm text-muted-foreground">Thinking...</span>
          </div>
        </div>
      {/if}
    {/if}

    {#if chatStore.error}
      <div class="rounded-lg bg-destructive/10 px-4 py-2 text-destructive">
        <p class="text-sm">Error: {chatStore.error}</p>
      </div>
    {/if}
  </div>

  <!-- Input -->
  <form onsubmit={handleSubmit} class="border-t p-4">
    <div class="flex gap-2">
      <Input
        bind:value={inputValue}
        onkeydown={handleKeydown}
        placeholder="Type a message..."
        disabled={chatStore.isStreaming}
        class="flex-1"
      />
      {#if chatStore.isStreaming}
        <Button type="button" variant="destructive" onclick={() => chatStore.cancel()}>
          Stop
        </Button>
      {:else}
        <Button type="submit" disabled={!inputValue.trim()}>
          Send
        </Button>
      {/if}
    </div>
  </form>
</div>
