<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import Spinner from "$lib/components/ui/spinner/spinner.svelte";
  import * as Card from "$lib/components/ui/card";

  interface MediaItem {
    type: string;
    url: string;
    width?: number;
    height?: number;
    alt_text?: string;
  }

  interface TweetPreview {
    id: string;
    text: string;
    author: {
      name: string;
      username: string;
      profile_image: string;
    };
    created_at: string;
    media?: MediaItem[];
  }

  interface ArabifyResult {
    original_text: string;
    arabified_text: string;
    author_name?: string;
    author_username?: string;
    note?: string;
  }

  let tweetUrl = $state("");
  let loading = $state(false);
  let previewLoading = $state(false);
  let error = $state<string | null>(null);
  let preview = $state<TweetPreview | null>(null);
  let result = $state<ArabifyResult | null>(null);
  let copied = $state(false);

  const isValidTwitterUrl = $derived(
    /(?:twitter\.com|x\.com)\/\w+\/status\/\d+/.test(tweetUrl)
  );

  async function fetchPreview() {
    if (!isValidTwitterUrl) return;

    previewLoading = true;
    error = null;
    preview = null;

    try {
      const response = await fetch(
        `/api/arabify?url=${encodeURIComponent(tweetUrl)}`
      );
      const data = await response.json();

      if (!response.ok) {
        error = data.error || data.detail || "Failed to fetch tweet";
        return;
      }

      preview = data;
    } catch {
      error = "Failed to connect to server";
    } finally {
      previewLoading = false;
    }
  }

  async function arabifyTweet() {
    if (!tweetUrl.trim()) return;

    loading = true;
    error = null;
    result = null;

    try {
      const response = await fetch("/api/arabify?endpoint=tweet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: tweetUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        error = data.error || data.detail || "Failed to arabify tweet";
        return;
      }

      result = data;
    } catch {
      error = "Failed to connect to server";
    } finally {
      loading = false;
    }
  }

  async function copyToClipboard() {
    if (!result?.arabified_text) return;

    try {
      await navigator.clipboard.writeText(result.arabified_text);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch {
      error = "Failed to copy to clipboard";
    }
  }

  function postToTwitter() {
    if (!result?.arabified_text) return;

    const text = encodeURIComponent(result.arabified_text);
    const url = `https://twitter.com/intent/tweet?text=${text}`;
    window.open(url, "_blank", "width=550,height=520");
  }

  function reset() {
    tweetUrl = "";
    preview = null;
    result = null;
    error = null;
    lastFetchedUrl = "";
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && isValidTwitterUrl && !loading) {
      arabifyTweet();
    }
  }

  // Track if we've already fetched for this URL to prevent duplicate requests
  let lastFetchedUrl = $state("");

  $effect(() => {
    if (isValidTwitterUrl && !preview && !result && tweetUrl !== lastFetchedUrl) {
      lastFetchedUrl = tweetUrl;
      fetchPreview();
    }
  });
</script>

<div class="flex flex-col gap-6">
  <div class="text-center">
    <h2 class="text-2xl font-bold">Tweet Arabifier</h2>
    <p class="mt-1 text-muted-foreground">
      Convert your tweets to Egyptian Arabic with natural English mixing
    </p>
  </div>

  <Card.Root>
    <Card.Content class="pt-6">
      <div class="flex flex-col gap-4">
        <div class="flex gap-2">
          <Input
            bind:value={tweetUrl}
            placeholder="Paste a Twitter/X URL (e.g., https://x.com/user/status/123...)"
            class="flex-1"
            disabled={loading}
            onkeydown={handleKeydown}
          />
          <Button onclick={arabifyTweet} disabled={!isValidTwitterUrl || loading}>
            {#if loading}
              <Spinner class="mr-2 size-4" />
              Arabifying...
            {:else}
              Arabify
            {/if}
          </Button>
        </div>

        {#if !isValidTwitterUrl && tweetUrl.length > 0}
          <p class="text-sm text-yellow-600">
            Please enter a valid Twitter/X URL (twitter.com or x.com)
          </p>
        {/if}

        {#if error}
          <div class="rounded-lg bg-destructive/10 px-4 py-3 text-destructive">
            <p class="text-sm">{error}</p>
          </div>
        {/if}
      </div>
    </Card.Content>
  </Card.Root>

  {#if previewLoading}
    <div class="flex justify-center py-4">
      <Spinner class="size-6" />
    </div>
  {:else if preview && !result}
    <Card.Root>
      <Card.Header>
        <Card.Title class="text-sm text-muted-foreground">Tweet Preview</Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="flex items-start gap-3">
          {#if preview.author.profile_image}
            <img
              src={preview.author.profile_image}
              alt={preview.author.name}
              class="size-10 rounded-full"
            />
          {/if}
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span class="font-semibold">{preview.author.name}</span>
              <span class="text-muted-foreground">@{preview.author.username}</span>
            </div>
            <p class="mt-2 whitespace-pre-wrap">{preview.text}</p>

            {#if preview.media && preview.media.length > 0}
              <div class="mt-3 grid gap-2 {preview.media.length === 1 ? '' : 'grid-cols-2'}">
                {#each preview.media as media}
                  <img
                    src={media.url}
                    alt={media.alt_text || "Tweet media"}
                    class="rounded-lg w-full object-cover max-h-64"
                  />
                {/each}
              </div>
            {/if}
          </div>
        </div>
      </Card.Content>
    </Card.Root>
  {/if}

  {#if result}
    <div class="flex flex-col gap-4">
      <!-- Side by side text comparison -->
      <div class="grid gap-4 md:grid-cols-2">
        <Card.Root>
          <Card.Header>
            <Card.Title class="flex items-center gap-2 text-base">
              <span>Original</span>
              {#if result.author_username}
                <span class="text-sm font-normal text-muted-foreground">
                  @{result.author_username}
                </span>
              {/if}
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <p class="whitespace-pre-wrap text-sm">{result.original_text}</p>
          </Card.Content>
        </Card.Root>

        <Card.Root class="border-primary/50">
          <Card.Header>
            <Card.Title class="flex items-center justify-between text-base">
              <span>Arabified</span>
              <div class="flex gap-2">
                <Button variant="outline" size="sm" onclick={copyToClipboard}>
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button size="sm" onclick={postToTwitter}>
                  Post to Twitter
                </Button>
              </div>
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <p class="whitespace-pre-wrap text-sm" dir="auto">
              {result.arabified_text}
            </p>
            {#if result.note}
              <p class="mt-4 text-xs italic text-muted-foreground">
                Note: {result.note}
              </p>
            {/if}
          </Card.Content>
        </Card.Root>
      </div>

      <!-- Media from original tweet -->
      {#if preview?.media && preview.media.length > 0}
        <Card.Root>
          <Card.Header>
            <Card.Title class="text-sm text-muted-foreground">
              Media (attach to your arabified tweet)
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div class="grid gap-2 {preview.media.length === 1 ? '' : 'grid-cols-2'}">
              {#each preview.media as media}
                <img
                  src={media.url}
                  alt={media.alt_text || "Tweet media"}
                  class="rounded-lg w-full object-cover max-h-80"
                />
              {/each}
            </div>
          </Card.Content>
        </Card.Root>
      {/if}
    </div>

    <div class="flex justify-center gap-2">
      <Button variant="outline" onclick={reset}>Try Another Tweet</Button>
    </div>
  {/if}
</div>
