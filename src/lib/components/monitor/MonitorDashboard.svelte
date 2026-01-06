<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import Spinner from "$lib/components/ui/spinner/spinner.svelte";
  import SentimentBadge from "./SentimentBadge.svelte";
  import MarketTicker from "./MarketTicker.svelte";
  import NewsCard from "./NewsCard.svelte";
  import TechCard from "./TechCard.svelte";
  import ChatInterface from "$lib/components/chat/ChatInterface.svelte";

  interface NewsItem {
    title: string;
    url: string;
    source: string;
    summary?: string;
  }

  interface MarketQuote {
    symbol: string;
    name?: string;
    category?: string;
    price: number;
    change: number;
    change_percent: number;
    sentiment: string;
  }

  interface TechItem {
    title: string;
    url: string;
    score: number;
    comments: number;
    is_hot?: boolean;
  }

  interface ReportData {
    id: string;
    created_at: string;
    summary: string;
    full_report?: {
      executive_summary: string;
      news: { title: string; summary: string; key_points: string[]; sentiment: string };
      markets: { title: string; summary: string; key_points: string[]; sentiment: string };
      social: { title: string; summary: string; key_points: string[]; sentiment: string };
      top_news?: NewsItem[];
      market_quotes?: MarketQuote[];
      top_tech?: TechItem[];
      market_sentiment?: string;
    };
    sections: Record<string, {
      title: string;
      summary: string;
      items: Array<{ key_points?: string[] }>;
    }>;
  }

  let report = $state<ReportData | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let lastUpdate = $state<Date | null>(null);
  let triggering = $state(false);
  let ws: WebSocket | null = null;
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  // Extract rich data from report
  const topNews = $derived(report?.full_report?.top_news || []);
  const marketQuotes = $derived(report?.full_report?.market_quotes || []);
  const topTech = $derived(report?.full_report?.top_tech || []);
  const marketSentiment = $derived(report?.full_report?.market_sentiment || "neutral");

  async function fetchLatestReport() {
    loading = true;
    error = null;

    try {
      const response = await fetch("/api/reports/latest");

      if (response.ok) {
        report = await response.json();
        lastUpdate = new Date(report!.created_at);
      } else if (response.status === 404) {
        report = null;
        error = "No reports yet. Click 'Refresh Now' to generate the first report.";
      } else {
        error = "Failed to fetch report";
      }
    } catch (e) {
      console.error("Failed to fetch report:", e);
      error = "Failed to connect to backend";
    } finally {
      loading = false;
    }
  }

  function setupWebSocket() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/reports`;

    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("WebSocket connected");
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "report_update") {
          fetchLatestReport();
        }
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected, reconnecting in 5s...");
        reconnectTimeout = setTimeout(setupWebSocket, 5000);
      };

      ws.onerror = (e) => {
        console.error("WebSocket error:", e);
      };
    } catch (e) {
      console.error("Failed to setup WebSocket:", e);
    }
  }

  async function triggerRefresh() {
    triggering = true;
    try {
      await fetch("/api/reports/trigger", { method: "POST" });
      setTimeout(fetchLatestReport, 5000);
    } catch (e) {
      console.error("Failed to trigger refresh:", e);
    } finally {
      triggering = false;
    }
  }

  function formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function getTimeSince(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  }

  onMount(() => {
    fetchLatestReport();
    setupWebSocket();
  });

  onDestroy(() => {
    ws?.close();
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
  });
</script>

<div class="flex h-full flex-col gap-4 overflow-hidden">
  <!-- Status Bar -->
  <div class="flex items-center justify-between rounded-xl border bg-card px-4 py-3">
    <div class="flex items-center gap-4">
      <div class="size-3 rounded-full {report ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse"></div>
      <span class="text-sm text-muted-foreground">
        {#if lastUpdate}
          Last update: {formatTime(lastUpdate)} ({getTimeSince(lastUpdate)})
        {:else}
          No reports yet
        {/if}
      </span>
      {#if report?.full_report?.news?.sentiment}
        <SentimentBadge sentiment={report.full_report.news.sentiment} />
      {/if}
    </div>
    <Button
      variant="outline"
      size="sm"
      onclick={triggerRefresh}
      disabled={triggering || loading}
    >
      {#if triggering}
        <Spinner class="mr-2 size-4" />
        Generating...
      {:else}
        Refresh Now
      {/if}
    </Button>
  </div>

  <!-- Main Content -->
  <div class="flex-1 overflow-auto">
    {#if loading}
      <div class="flex h-64 items-center justify-center">
        <Spinner class="size-8" />
      </div>
    {:else if error && !report}
      <div class="rounded-xl border border-yellow-500/50 bg-yellow-500/10 p-6 text-center">
        <p class="text-sm text-yellow-600 dark:text-yellow-400">{error}</p>
      </div>
    {:else if report}
      <div class="space-y-4">
        <!-- Executive Summary -->
        {#if report.full_report?.executive_summary || report.summary}
          <div class="rounded-xl border bg-gradient-to-r from-primary/5 to-primary/10 p-5">
            <div class="mb-2 flex items-center gap-2">
              <span class="text-xl">📋</span>
              <h3 class="font-semibold">Executive Summary</h3>
            </div>
            <p class="text-sm leading-relaxed">
              {report.full_report?.executive_summary || report.summary}
            </p>
          </div>
        {/if}

        <!-- Markets Ticker -->
        {#if marketQuotes.length > 0}
          <MarketTicker quotes={marketQuotes} marketSentiment={marketSentiment} />
        {/if}

        <!-- Three Column Grid -->
        <div class="grid gap-4 lg:grid-cols-3">
          <!-- News Section -->
          <div class="rounded-xl border bg-card p-4">
            <div class="mb-3 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xl">📰</span>
                <h3 class="font-semibold">News</h3>
              </div>
              {#if report.full_report?.news?.sentiment}
                <SentimentBadge sentiment={report.full_report.news.sentiment} />
              {/if}
            </div>
            {#if report.full_report?.news?.summary}
              <p class="mb-3 text-xs text-muted-foreground">{report.full_report.news.summary}</p>
            {/if}
            <div class="space-y-2 max-h-[400px] overflow-y-auto">
              {#if topNews.length > 0}
                {#each topNews.slice(0, 6) as item}
                  <NewsCard {item} />
                {/each}
              {:else if report.full_report?.news?.key_points}
                {#each report.full_report.news.key_points as point}
                  <div class="flex gap-2 text-sm">
                    <span class="text-muted-foreground">•</span>
                    <span>{point}</span>
                  </div>
                {/each}
              {/if}
            </div>
          </div>

          <!-- Markets Section -->
          <div class="rounded-xl border bg-card p-4">
            <div class="mb-3 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xl">📈</span>
                <h3 class="font-semibold">Market News</h3>
              </div>
              {#if report.full_report?.markets?.sentiment}
                <SentimentBadge sentiment={report.full_report.markets.sentiment} />
              {/if}
            </div>
            {#if report.full_report?.markets?.summary}
              <p class="mb-3 text-xs text-muted-foreground">{report.full_report.markets.summary}</p>
            {/if}
            <div class="space-y-2 max-h-[400px] overflow-y-auto">
              {#if report.full_report?.markets?.key_points}
                {#each report.full_report.markets.key_points as point}
                  <div class="flex gap-2 text-sm">
                    <span class="text-muted-foreground">•</span>
                    <span>{point}</span>
                  </div>
                {/each}
              {/if}
            </div>
          </div>

          <!-- Tech/Social Section -->
          <div class="rounded-xl border bg-card p-4">
            <div class="mb-3 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xl">🔥</span>
                <h3 class="font-semibold">Tech & HN</h3>
              </div>
              {#if report.full_report?.social?.sentiment}
                <SentimentBadge sentiment={report.full_report.social.sentiment} />
              {/if}
            </div>
            {#if report.full_report?.social?.summary}
              <p class="mb-3 text-xs text-muted-foreground">{report.full_report.social.summary}</p>
            {/if}
            <div class="space-y-2 max-h-[400px] overflow-y-auto">
              {#if topTech.length > 0}
                {#each topTech.slice(0, 6) as item}
                  <TechCard {item} />
                {/each}
              {:else if report.full_report?.social?.key_points}
                {#each report.full_report.social.key_points as point}
                  <div class="flex gap-2 text-sm">
                    <span class="text-muted-foreground">•</span>
                    <span>{point}</span>
                  </div>
                {/each}
              {/if}
            </div>
          </div>
        </div>

        <!-- Chat Interface -->
        <div class="rounded-xl border bg-card">
          <div class="border-b px-4 py-3">
            <div class="flex items-center gap-2">
              <span class="text-xl">🤖</span>
              <h3 class="font-semibold">Query Monitor</h3>
            </div>
            <p class="mt-1 text-xs text-muted-foreground">
              Ask questions about the monitoring data
            </p>
          </div>
          <div class="h-[350px]">
            <ChatInterface />
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
