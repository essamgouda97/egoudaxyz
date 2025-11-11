<script lang="ts">
    /**
     * ProjectsTimelinePane
     * - Scrollable container to house your projects timeline components.
     * - No mock data; just structure and slots for you to populate.
     *
     * Props:
     * - className: append your own classes to customize the container.
     */
    export let className: string = "";
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
            <slot></slot>
        </div>
    </div>
</section>
