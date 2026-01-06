<script lang="ts">
  import TweetArabifier from "$lib/components/arabifier/TweetArabifier.svelte";
</script>

<svelte:head>
  <title>Tweet Arabifier | egouda.xyz</title>
  <meta
    name="description"
    content="Convert your tweets to modern Egyptian Arabic with natural English mixing"
  />
</svelte:head>

<div class="container mx-auto max-w-4xl px-4 py-8">
  <TweetArabifier />
</div>
