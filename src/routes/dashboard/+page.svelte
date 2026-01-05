<script lang="ts">
  import { authClient } from "$lib/auth-client";
  import { goto } from "$app/navigation";
  import Button from "$lib/components/ui/button/button.svelte";
  import ChatInterface from "$lib/components/chat/ChatInterface.svelte";

  async function handleSignOut() {
    await authClient.signOut();
    goto("/login");
  }
</script>

<div class="flex h-screen flex-col">
  <!-- Header -->
  <header class="flex items-center justify-between border-b px-6 py-4">
    <h1 class="text-xl font-bold">Agent Playground</h1>
    <Button variant="outline" onclick={handleSignOut}>
      Sign Out
    </Button>
  </header>

  <!-- Main Content -->
  <main class="flex-1 overflow-hidden p-6">
    <div class="mx-auto h-full max-w-4xl">
      <ChatInterface />
    </div>
  </main>
</div>
