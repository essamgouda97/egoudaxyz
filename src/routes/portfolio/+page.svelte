<script lang="ts">
    // Portfolio page
    import * as Resizable from "$lib/components/ui/resizable/index.js";
    import ResumePane from "$lib/components/portfolio/ResumePane.svelte";
    import ProjectsTimelinePane from "$lib/components/portfolio/ProjectsTimelinePane.svelte";
    export let data: { defaultA: number; defaultB: number };
</script>

<svelte:head>
    <title>Essam Gouda | Software Engineer</title>
    <meta name="description" content="Software engineer specializing in full-stack development, AI/ML, and cloud infrastructure. View my projects, experience, and technical blog." />
    <link rel="canonical" href="https://egouda.xyz/" />

    <!-- Open Graph -->
    <meta property="og:title" content="Essam Gouda | Software Engineer" />
    <meta property="og:description" content="Software engineer specializing in full-stack development, AI/ML, and cloud infrastructure." />
    <meta property="og:url" content="https://egouda.xyz/" />
    <meta property="og:image" content="https://egouda.xyz/og-image.png" />

    <!-- Twitter -->
    <meta name="twitter:title" content="Essam Gouda | Software Engineer" />
    <meta name="twitter:description" content="Software engineer specializing in full-stack development, AI/ML, and cloud infrastructure." />
    <meta name="twitter:image" content="https://egouda.xyz/og-image.png" />
</svelte:head>

<div class="w-full h-[calc(100vh-4rem)]">
    <div class="md:hidden flex flex-col h-full overflow-y-auto">
        <ResumePane className="min-h-screen" />
        <ProjectsTimelinePane className="min-h-screen" />
    </div>
    
    <div class="hidden md:block h-full">
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
</div>
