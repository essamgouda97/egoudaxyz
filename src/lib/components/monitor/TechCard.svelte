<script lang="ts">
  interface TechItem {
    title: string;
    url: string;
    score: number;
    comments: number;
    is_hot?: boolean;
  }

  interface Props {
    item: TechItem;
  }

  let { item }: Props = $props();

  function getDomain(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace("www.", "");
    } catch {
      return "news.ycombinator.com";
    }
  }
</script>

<a
  href={item.url}
  target="_blank"
  rel="noopener noreferrer"
  class="group block rounded-lg border bg-card p-3 transition-all hover:border-orange-500/50 hover:bg-muted/50"
>
  <div class="flex items-start gap-3">
    <!-- Score -->
    <div class="flex flex-col items-center rounded bg-orange-500/10 px-2 py-1 text-orange-500">
      <span class="text-xs">▲</span>
      <span class="text-sm font-bold">{item.score}</span>
    </div>

    <div class="flex-1 min-w-0">
      <div class="flex items-start gap-2">
        <h4 class="text-sm font-medium leading-tight group-hover:text-orange-500 line-clamp-2 flex-1">
          {item.title}
        </h4>
        {#if item.is_hot}
          <span class="shrink-0 text-sm" title="Hot!">🔥</span>
        {/if}
      </div>

      <div class="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
        <span class="inline-flex items-center gap-1">
          <span class="size-1.5 rounded-full bg-orange-500/50"></span>
          {getDomain(item.url)}
        </span>
        <span class="inline-flex items-center gap-1">
          💬 {item.comments}
        </span>
      </div>
    </div>
  </div>
</a>
