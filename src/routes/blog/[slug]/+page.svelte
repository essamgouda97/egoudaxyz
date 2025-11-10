<script lang="ts">
    import type { PageData } from "./$types";
    export let data: PageData;
</script>

<svelte:head>
    <title>{data.title}</title>
    {#if data.description}
        <meta name="description" content={data.description} />
    {/if}
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
