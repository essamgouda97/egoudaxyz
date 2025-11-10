<script lang="ts">
    import type { PageData } from "./$types";

    export let data: PageData;

    const posts = data.posts ?? [];
</script>

<svelte:head>
    <title>Blog</title>
</svelte:head>

<div class="space-y-6">
    <h1 class="text-3xl font-bold">Blog</h1>

    {#if posts.length === 0}
        <p class="text-muted-foreground">No blog posts found.</p>
    {:else}
        <ul class="space-y-4">
            {#each posts as post (post.slug)}
                <li class="rounded-lg border p-4">
                    <a
                        href={`/blog/${post.slug}`}
                        data-sveltekit-preload-data="hover"
                        class="block hover:underline"
                    >
                        <h2 class="text-xl font-semibold">{post.title}</h2>
                    </a>

                    <div
                        class="mt-1 text-sm text-muted-foreground flex flex-wrap items-center gap-2"
                    >
                        {#if post.date}
                            <time datetime={post.date}>{post.date}</time>
                        {/if}
                        {#if post.date && post.readingTime}
                            <span>•</span>
                        {/if}
                        {#if post.readingTime}
                            <span>{post.readingTime} min read</span>
                        {/if}
                    </div>

                    {#if post.description}
                        <p class="text-sm mt-2">{post.description}</p>
                    {/if}

                    {#if post.tags && post.tags.length > 0}
                        <div class="mt-3 flex flex-wrap gap-2">
                            {#each post.tags as tag}
                                <span
                                    class="text-xs px-2 py-1 rounded-md bg-muted"
                                    >{tag}</span
                                >
                            {/each}
                        </div>
                    {/if}
                </li>
            {/each}
        </ul>
    {/if}
</div>
