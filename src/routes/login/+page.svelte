<script lang="ts">
  import { authClient } from "$lib/auth-client";
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import Spinner from "$lib/components/ui/spinner/spinner.svelte";
  import { onMount } from "svelte";

  let isReady = $state(false);
  let isSigningIn = $state(false);

  onMount(() => {
    // Wait for auth client to be initialized
    setTimeout(() => {
      isReady = true;
    }, 100);
  });

  async function handleGitHubSignIn(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    isSigningIn = true;
    
    try {
      const result = await authClient.signIn.social({
        provider: "github",
        callbackURL: "/dashboard",
      });
      console.log("Sign in result:", result);
    } catch (error) {
      console.error("Sign in error:", error);
      isSigningIn = false;
    }
  }
</script>

<div class="flex items-center justify-center min-h-screen">
  <Card class="w-[350px]">
    <CardHeader>
      <CardTitle>Access Dashboard</CardTitle>
    </CardHeader>
    <CardContent>
      <button 
        type="button"
        onclick={handleGitHubSignIn} 
        disabled={!isReady || isSigningIn}
        class="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {#if isSigningIn}
          <Spinner />
          Signing in...
        {:else if isReady}
          Sign In with GitHub
        {:else}
          Loading...
        {/if}
      </button>
    </CardContent>
  </Card>
</div>
