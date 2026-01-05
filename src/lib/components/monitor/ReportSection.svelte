<script lang="ts">
  import Spinner from "$lib/components/ui/spinner/spinner.svelte";

  interface Props {
    title: string;
    icon: string;
    loading: boolean;
    data: {
      title?: string;
      summary?: string;
      items?: Array<{ key_points?: string[] }>;
    } | null;
  }

  let { title, icon, loading, data }: Props = $props();

  function getKeyPoints(): string[] {
    if (!data?.items?.length) return [];
    const firstItem = data.items[0];
    return firstItem?.key_points || [];
  }
</script>

<div class="rounded-xl border bg-card p-4">
  <div class="mb-3 flex items-center gap-2">
    <span class="text-xl">{icon}</span>
    <h3 class="font-semibold">{title}</h3>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-8">
      <Spinner class="size-6" />
    </div>
  {:else if !data}
    <p class="text-sm text-muted-foreground">No data available</p>
  {:else}
    {#if data.summary}
      <p class="mb-3 text-sm text-muted-foreground">{data.summary}</p>
    {/if}

    {#if getKeyPoints().length > 0}
      <ul class="space-y-2">
        {#each getKeyPoints() as point}
          <li class="flex gap-2 text-sm">
            <span class="text-muted-foreground">•</span>
            <span>{point}</span>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</div>
