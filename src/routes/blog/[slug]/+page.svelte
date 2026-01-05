<script lang="ts">
    import type { PageData } from "./$types";
    export let data: PageData;

    const canonicalUrl = `https://egouda.xyz/blog/${data.slug}`;
    const ogImage = "https://egouda.xyz/og-image.png";
</script>

<svelte:head>
    <title>{data.title} | Essam Gouda</title>
    {#if data.description}
        <meta name="description" content={data.description} />
    {/if}
    <link rel="canonical" href={canonicalUrl} />

    <!-- Open Graph -->
    <meta property="og:type" content="article" />
    <meta property="og:title" content={data.title} />
    {#if data.description}
        <meta property="og:description" content={data.description} />
    {/if}
    <meta property="og:url" content={canonicalUrl} />
    <meta property="og:image" content={ogImage} />
    {#if data.date}
        <meta property="article:published_time" content={data.date} />
    {/if}
    {#if data.tags && data.tags.length > 0}
        {#each data.tags as tag}
            <meta property="article:tag" content={tag} />
        {/each}
    {/if}

    <!-- Twitter -->
    <meta name="twitter:title" content={data.title} />
    {#if data.description}
        <meta name="twitter:description" content={data.description} />
    {/if}
    <meta name="twitter:image" content={ogImage} />
</svelte:head>

<!--
    Render the blog content using GitHub's markdown-body class for styling.
    Center the content and constrain width for readability.
    The global CSS already imports `github-markdown-css`, so this class will apply.
-->
<div
    class="markdown-body"
    style="max-width: 860px; margin: 0 auto; padding: 2rem 1rem;"
>
    {@html data.content}
</div>
