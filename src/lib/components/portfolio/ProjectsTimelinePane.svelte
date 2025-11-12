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

    const statusColors: Record<ProjectStatus, string> = {
        failed: "bg-red-500",
        "in-progress": "bg-yellow-500",
        success: "bg-green-500",
    };

    const projects: Project[] = [
        {
            title: "Dispatcher Agent",
            description:
                "Creating a truck dispatcher agentic workflow for truck companies.",
            status: "in-progress",
            year: 2026,
        },
        {
            title: "Hala Qeshta Franchise",
            description:
                "Tried opening Hala Qeshta franchise in Montreal for egyptian desserts.",
            status: "failed",
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
            status: "failed",
            year: 2025,
            links: [{ label: "Site Link", url: "https://www.santagrams.ai/" }],
        },
    ].sort((a, b) => b.year - a.year);
</script>

<section
    aria-label="Projects timeline"
    class={`h-full w-full overflow-auto ${className}`}
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
            <Carousel.Root
                orientation="vertical"
                opts={{ align: "start" }}
                class="relative mt-12 w-full"
            >
                <Carousel.Content class="h-[600px]">
                    {#each projects as project}
                        <Carousel.Item class="pt-4 md:basis-1/2 lg:basis-1/3">
                            <div class="rounded-lg border p-6">
                                <div
                                    class="flex items-start justify-between gap-4"
                                >
                                    <div class="flex-1">
                                        <div class="flex items-center gap-3">
                                            <h3 class="text-xl font-semibold">
                                                {project.title}
                                            </h3>
                                            <span
                                                class="text-sm font-medium text-muted-foreground"
                                                >{project.year}</span
                                            >
                                        </div>
                                        <p
                                            class="mt-2 text-sm text-muted-foreground"
                                        >
                                            {project.description}
                                        </p>
                                        {#if project.links}
                                            <div class="mt-3 flex gap-2">
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
                                    <div class="flex items-center gap-2">
                                        <span
                                            class={`h-3 w-3 rounded-full ${statusColors[project.status]}`}
                                        ></span>
                                        <span class="text-sm capitalize"
                                            >{project.status}</span
                                        >
                                    </div>
                                </div>
                            </div>
                        </Carousel.Item>
                    {/each}
                </Carousel.Content>
                <Carousel.Previous />
                <Carousel.Next />
            </Carousel.Root>
        </div>
    </div>
</section>
