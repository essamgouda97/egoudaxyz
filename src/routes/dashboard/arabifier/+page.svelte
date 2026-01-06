<script lang="ts">
  import { authClient } from "$lib/auth-client";
  import { goto } from "$app/navigation";
  import Button from "$lib/components/ui/button/button.svelte";
  import TweetArabifier from "$lib/components/arabifier/TweetArabifier.svelte";

  async function handleSignOut() {
    await authClient.signOut();
    goto("/login");
  }
</script>

<svelte:head>
  <title>Tweet Arabifier | egouda.xyz</title>
  <meta
    name="description"
    content="Convert your tweets to modern Egyptian Arabic with natural English mixing"
  />
</svelte:head>

<div class="flex h-screen flex-col">
  <!-- Header -->
  <header class="flex items-center justify-between border-b px-6 py-4">
    <div class="flex items-center gap-4">
      <a href="/dashboard" class="flex items-center gap-2 hover:opacity-80">
        <span class="text-2xl">👀</span>
        <span class="text-xl font-bold">World</span>
      </a>
      <span class="text-muted-foreground">|</span>
      <a href="/dashboard/arabifier" class="flex items-center gap-2 hover:opacity-80">
        <span class="text-xl font-bold">Arabifier</span>
      </a>
    </div>
    <Button variant="outline" size="sm" onclick={handleSignOut}>
      Sign Out
    </Button>
  </header>

  <!-- Main Content -->
  <main class="flex-1 overflow-auto p-6">
    <div class="mx-auto max-w-4xl">
      <TweetArabifier />
    </div>
  </main>
</div>
