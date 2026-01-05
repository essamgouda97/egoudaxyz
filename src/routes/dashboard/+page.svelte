<script lang="ts">
  import { authClient } from "$lib/auth-client";
  import { goto } from "$app/navigation";
  import Button from "$lib/components/ui/button/button.svelte";
  import MonitorDashboard from "$lib/components/monitor/MonitorDashboard.svelte";

  async function handleSignOut() {
    await authClient.signOut();
    goto("/login");
  }
</script>

<div class="flex h-screen flex-col">
  <!-- Header -->
  <header class="flex items-center justify-between border-b px-6 py-4">
    <div class="flex items-center gap-3">
      <span class="text-2xl">👀</span>
      <h1 class="text-xl font-bold">World</h1>
    </div>
    <Button variant="outline" size="sm" onclick={handleSignOut}>
      Sign Out
    </Button>
  </header>

  <!-- Main Content -->
  <main class="flex-1 overflow-hidden p-4">
    <MonitorDashboard />
  </main>
</div>
