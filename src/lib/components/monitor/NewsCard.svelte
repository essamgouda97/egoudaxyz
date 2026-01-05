<script lang="ts">
  interface NewsItem {
    title: string;
    url: string;
    source: string;
    summary?: string;
  }

  interface Props {
    item: NewsItem;
  }

  let { item }: Props = $props();

  function getDomain(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace("www.", "");
    } catch {
      return item.source || "unknown";
    }
  }
</script>

<a
  href={item.url}
  target="_blank"
  rel="noopener noreferrer"
  class="group block rounded-lg border bg-card p-3 transition-all hover:border-primary/50 hover:bg-muted/50"
>
  <div class="flex items-start justify-between gap-2">
    <h4 class="text-sm font-medium leading-tight group-hover:text-primary line-clamp-2">
      {item.title}
    </h4>
    <svg class="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15,3 21,3 21,9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  </div>
  {#if item.summary}
    <p class="mt-1.5 text-xs text-muted-foreground line-clamp-2">{item.summary}</p>
  {/if}
  <div class="mt-2 flex items-center gap-2">
    <span class="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <span class="size-1.5 rounded-full bg-primary/50"></span>
      {getDomain(item.url)}
    </span>
  </div>
</a>
