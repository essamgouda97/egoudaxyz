<script lang="ts">
  interface Props {
    sentiment: string;
    size?: "sm" | "md";
  }

  let { sentiment, size = "sm" }: Props = $props();

  function getSentimentConfig(s: string) {
    switch (s?.toLowerCase()) {
      case "positive":
        return { bg: "bg-green-500/20", text: "text-green-500", icon: "↑", label: "Positive" };
      case "negative":
        return { bg: "bg-red-500/20", text: "text-red-500", icon: "↓", label: "Negative" };
      case "mixed":
        return { bg: "bg-purple-500/20", text: "text-purple-500", icon: "~", label: "Mixed" };
      default:
        return { bg: "bg-yellow-500/20", text: "text-yellow-500", icon: "–", label: "Neutral" };
    }
  }

  const config = $derived(getSentimentConfig(sentiment));
  const sizeClass = $derived(size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1");
</script>

<span class="inline-flex items-center gap-1 rounded-full font-medium {config.bg} {config.text} {sizeClass}">
  <span>{config.icon}</span>
  <span>{config.label}</span>
</span>
