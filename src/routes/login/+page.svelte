<script lang="ts">
  import { authClient } from "$lib/auth-client";
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { onMount } from "svelte";

  let isReady = $state(false);

  onMount(() => {
    // Wait for auth client to be initialized
    setTimeout(() => {
      isReady = true;
    }, 100);
  });

  async function handleGitHubSignIn(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    console.log("Sign in button clicked");
    
    try {
      const result = await authClient.signIn.social({
        provider: "github",
        callbackURL: "/dashboard",
      });
      console.log("Sign in result:", result);
    } catch (error) {
      console.error("Sign in error:", error);
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
        disabled={!isReady}
        class="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isReady ? "Sign In with GitHub" : "Loading..."}
      </button>
    </CardContent>
  </Card>
</div>
