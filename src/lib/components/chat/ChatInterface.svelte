<script lang="ts">
  import { onMount } from "svelte";
  import { chatStore } from "$lib/chat/chat-store.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import Spinner from "$lib/components/ui/spinner/spinner.svelte";

  let inputValue = $state("");
  let messagesContainer: HTMLDivElement | null = $state(null);

  onMount(() => {
    // Initialize chat store with query agent
    chatStore.init("query");
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
</script>

<div class="flex h-full flex-col">
  <!-- Messages -->
  <div
    bind:this={messagesContainer}
    class="flex-1 overflow-y-auto p-4 space-y-4"
  >
    {#if chatStore.messages.length === 0 && !chatStore.isStreaming}
      <div class="flex h-full items-center justify-center text-muted-foreground">
        <p class="text-sm">Ask about news, markets, or social trends...</p>
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
        placeholder="Ask about the latest reports..."
        disabled={chatStore.isStreaming}
        class="flex-1"
      />
      {#if chatStore.isStreaming}
        <Button type="button" variant="destructive" size="sm" onclick={() => chatStore.cancel()}>
          Stop
        </Button>
      {:else}
        <Button type="submit" size="sm" disabled={!inputValue.trim()}>
          Send
        </Button>
      {/if}
    </div>
  </form>
</div>
