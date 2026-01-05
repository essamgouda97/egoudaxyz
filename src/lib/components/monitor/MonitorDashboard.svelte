<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import Spinner from "$lib/components/ui/spinner/spinner.svelte";
  import ReportSection from "./ReportSection.svelte";
  import ChatInterface from "$lib/components/chat/ChatInterface.svelte";

  interface ReportData {
    id: string;
    created_at: string;
    summary: string;
    full_report?: {
      executive_summary: string;
      news: { title: string; summary: string; key_points: string[]; sentiment: string };
      markets: { title: string; summary: string; key_points: string[]; sentiment: string };
      social: { title: string; summary: string; key_points: string[]; sentiment: string };
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
    const wsUrl = `${protocol}//${window.location.host}/api/ws/reports`;

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
      // Report will be updated via WebSocket or we poll after a delay
      setTimeout(fetchLatestReport, 3000);
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
    // setupWebSocket(); // Uncomment when WebSocket proxy is configured
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
    <div class="grid gap-4 lg:grid-cols-2">
      <!-- Summary Card -->
      {#if report?.full_report?.executive_summary || report?.summary}
        <div class="rounded-xl border bg-card p-4 lg:col-span-2">
          <div class="mb-2 flex items-center gap-2">
            <span class="text-xl">📋</span>
            <h3 class="font-semibold">Executive Summary</h3>
          </div>
          <p class="text-sm">
            {report.full_report?.executive_summary || report.summary}
          </p>
        </div>
      {/if}

      <!-- Section Cards -->
      <ReportSection
        title="News"
        icon="📰"
        loading={loading}
        data={report?.sections?.news || (report?.full_report?.news ? {
          title: report.full_report.news.title,
          summary: report.full_report.news.summary,
          items: [{ key_points: report.full_report.news.key_points }]
        } : null)}
      />

      <ReportSection
        title="Markets"
        icon="📈"
        loading={loading}
        data={report?.sections?.markets || (report?.full_report?.markets ? {
          title: report.full_report.markets.title,
          summary: report.full_report.markets.summary,
          items: [{ key_points: report.full_report.markets.key_points }]
        } : null)}
      />

      <ReportSection
        title="Social & Tech"
        icon="💬"
        loading={loading}
        data={report?.sections?.social || (report?.full_report?.social ? {
          title: report.full_report.social.title,
          summary: report.full_report.social.summary,
          items: [{ key_points: report.full_report.social.key_points }]
        } : null)}
      />

      <!-- Error Display -->
      {#if error && !loading}
        <div class="rounded-xl border border-yellow-500/50 bg-yellow-500/10 p-4 lg:col-span-2">
          <p class="text-sm text-yellow-600 dark:text-yellow-400">{error}</p>
        </div>
      {/if}

      <!-- Chat Interface -->
      <div class="lg:col-span-2">
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
          <div class="h-[400px]">
            <ChatInterface />
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
