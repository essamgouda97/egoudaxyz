<script lang="ts">
  import { authClient } from "$lib/auth-client";
  import Button from "$lib/components/ui/button/button.svelte";
  import { goto } from "$app/navigation";

  async function handleSignOut() {
    await authClient.signOut();
    // Redirect to login after sign out
    goto("/login");
  }
</script>

<div class="p-8">
  <h1 class="text-2xl font-bold">Dashboard</h1>
  <p>Welcome to your personal dashboard.</p>
  <button onclick={handleSignOut} class="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90">
    Sign Out
  </button>
</div>
