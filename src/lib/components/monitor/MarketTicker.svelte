<script lang="ts">
  interface Quote {
    symbol: string;
    price: number;
    change: number;
    change_percent: number;
    sentiment: string;
  }

  interface Props {
    quotes: Quote[];
    marketSentiment?: string;
  }

  let { quotes = [], marketSentiment = "neutral" }: Props = $props();

  function formatPrice(price: number): string {
    return price.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
  }

  function formatChange(change: number, percent: number): string {
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change.toFixed(2)} (${sign}${percent.toFixed(2)}%)`;
  }

  const overallColor = $derived(
    marketSentiment === "positive" ? "border-green-500/50" :
    marketSentiment === "negative" ? "border-red-500/50" : "border-yellow-500/50"
  );
</script>

<div class="rounded-xl border bg-card p-4 {overallColor}">
  <div class="mb-3 flex items-center justify-between">
    <div class="flex items-center gap-2">
      <span class="text-xl">📊</span>
      <h3 class="font-semibold">Markets</h3>
    </div>
    <span class="text-xs px-2 py-1 rounded-full {
      marketSentiment === 'positive' ? 'bg-green-500/20 text-green-500' :
      marketSentiment === 'negative' ? 'bg-red-500/20 text-red-500' :
      'bg-yellow-500/20 text-yellow-500'
    }">
      {marketSentiment === 'positive' ? '↑ Bullish' : marketSentiment === 'negative' ? '↓ Bearish' : '– Neutral'}
    </span>
  </div>

  {#if quotes.length === 0}
    <p class="text-sm text-muted-foreground">No market data available</p>
  {:else}
    <div class="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
      {#each quotes.slice(0, 10) as quote}
        <div class="rounded-lg bg-muted/50 p-2 text-center">
          <div class="text-xs font-semibold text-muted-foreground">{quote.symbol}</div>
          <div class="text-sm font-bold">{formatPrice(quote.price)}</div>
          <div class="text-xs {quote.change >= 0 ? 'text-green-500' : 'text-red-500'}">
            {quote.change >= 0 ? '↑' : '↓'} {Math.abs(quote.change_percent).toFixed(2)}%
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
