<script lang="ts">
    // Portfolio page
    import * as Resizable from "$lib/components/ui/resizable/index.js";
    import ResumePane from "$lib/components/portfolio/ResumePane.svelte";
    import ProjectsTimelinePane from "$lib/components/portfolio/ProjectsTimelinePane.svelte";
    export let data: { defaultA: number; defaultB: number };
</script>

<svelte:head>
    <title>Portfolio</title>
</svelte:head>

<div class="w-full h-[calc(100vh-4rem)]">
    <Resizable.PaneGroup
        direction="horizontal"
        defaultA={data.defaultA}
        defaultB={data.defaultB}
        storageKey="portfolio-resize"
    >
        <ResumePane slot="pane-a" className="h-full w-full" />
        <ProjectsTimelinePane slot="pane-b" className="h-full w-full" />
    </Resizable.PaneGroup>
</div>
