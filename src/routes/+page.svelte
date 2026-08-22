<script lang="ts">
    import PortfolioPage from "./portfolio/+page.svelte";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();
</script>

<PortfolioPage {data} />
