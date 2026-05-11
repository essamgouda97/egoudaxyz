<script lang="ts">
    import * as Carousel from "$lib/components/ui/carousel";

    type ProjectStatus = "failed" | "in-progress" | "success";

    interface Project {
        title: string;
        description: string;
        status: ProjectStatus;
        year: number;
        links?: Array<{ label: string; url: string }>;
    }

    export let className: string = "";
    export let scrollable: boolean = true;

    const statusColors: Record<ProjectStatus, string> = {
        failed: "bg-red-500",
        "in-progress": "bg-yellow-500",
        success: "bg-green-500",
    };

    const projects: Project[] = [
        {
            title: "Dispatcher Agent",
            description:
                "Explored a truck dispatcher agentic workflow for truck companies.",
            status: "failed" as const,
            year: 2026,
        },
        {
            title: "Compound App",
            description:
                "Creating a compound management system for operations, residents, and administration workflows.",
            status: "in-progress" as const,
            year: 2026,
        },
        {
            title: "Hala Qeshta Franchise",
            description:
                "Tried opening Hala Qeshta franchise in Montreal for egyptian desserts.",
            status: "failed" as const,
            year: 2025,
            links: [
                { label: "Company Site", url: "https://www.ewanagroup.com/" },
                {
                    label: "Business Registry",
                    url: "https://ised-isde.canada.ca/cc/lgcy/fdrlCrpDtls.html?lang=eng&corpId=16611851",
                },
            ],
        },
        {
            title: "Santagrams.ai",
            description:
                "Created an AI powered text to video santagram message generator for christmas while doing a tiktok marketing campaign.",
            status: "failed" as const,
            year: 2025,
            links: [{ label: "Site Link", url: "https://www.santagrams.ai/" }],
        },
    ].sort((a, b) => b.year - a.year);
</script>

{#snippet ProjectCard(project: Project)}
    <div class="rounded-lg border p-6">
        <div class="mb-2 flex items-start justify-between gap-4">
            <h3 class="text-xl font-semibold">
                {project.title}
            </h3>
            <div class="flex items-center gap-2">
                <span class={`h-3 w-3 rounded-full ${statusColors[project.status]}`}></span>
                <span class="text-sm capitalize">{project.status}</span>
            </div>
        </div>
        <span class="mb-3 block text-2xl font-light text-muted-foreground">{project.year}</span>
        <div>
            <p class="text-sm text-muted-foreground">
                {project.description}
            </p>
            {#if project.links}
                <div class="mt-3 flex flex-wrap gap-2">
                    {#each project.links as link}
                        <a
                            href={link.url}
                            class="text-sm text-primary hover:underline"
                        >
                            {link.label}
                        </a>
                    {/each}
                </div>
            {/if}
        </div>
    </div>
{/snippet}

<section
    aria-label="Projects timeline"
    class={`w-full ${scrollable ? "h-full overflow-auto" : ""} ${className}`}
    {...$$restProps}
>
    <div class="mx-auto w-full">
        <a
            href="https://github.com/essamgouda97"
            target="_blank"
            rel="noreferrer"
            class="block"
        >
            <img
                src="https://ghchart.rshah.org/essamgouda97"
                alt="Essam's Github Chart"
                class="w-full"
            />
        </a>
        <div class="px-4 py-6 md:px-6">
            <div class="space-y-4 md:hidden">
                {#each projects as project}
                    {@render ProjectCard(project)}
                {/each}
            </div>

            <Carousel.Root
                orientation="vertical"
                opts={{ align: "start" }}
                class="relative mt-12 hidden w-full md:block"
            >
                <Carousel.Content class="h-[600px]">
                    {#each projects as project}
                        <Carousel.Item class="pt-4 md:basis-1/2 lg:basis-1/3">
                            {@render ProjectCard(project)}
                        </Carousel.Item>
                    {/each}
                </Carousel.Content>
                <Carousel.Previous />
                <Carousel.Next />
            </Carousel.Root>
        </div>
    </div>
</section>
