<script lang="ts">
    import { Toaster } from "$lib/components/ui/sonner";

    import "../app.css";
    import favicon from "$lib/assets/favicon.svg";
    import { ModeWatcher, toggleMode, mode } from "mode-watcher";
    import * as NavigationMenu from "$lib/components/ui/navigation-menu/index.js";
    import { navigationMenuTriggerStyle } from "$lib/components/ui/navigation-menu/navigation-menu-trigger.svelte";
    import { cn } from "$lib/utils.js";
    import type { HTMLAttributes } from "svelte/elements";

    let { children } = $props();

    type BlogItem = {
        title: string;
        href: string;
        description?: string;
        date?: string;
        slug?: string;
    };

    let posts: BlogItem[] = $state([]);

    async function loadBlogPosts() {
        try {
            const res = await fetch("/api/blog", {
                headers: { accept: "application/json" },
            });
            if (!res.ok) return;
            const data = await res.json();
            const list = Array.isArray(data?.posts) ? data.posts : [];
            posts = list.map((p: any) => ({
                title: p.title ?? p.slug ?? "Untitled",
                href: `/blog/${p.slug ?? ""}`,
                description: p.description ?? "",
                date: p.date ?? "",
                slug: p.slug,
            }));
        } catch {
            // swallow - navbar should gracefully degrade
        }
    }

    $effect(() => {
        loadBlogPosts();
    });

    type ListItemProps = HTMLAttributes<HTMLAnchorElement> & {
        title: string;
        href: string;
        content: string;
    };
</script>

{#snippet ListItem({
    title,
    content,
    href,
    class: className,
    ...restProps
}: ListItemProps)}
    <li>
        <NavigationMenu.Link>
            {#snippet child()}
                <a
                    {href}
                    data-sveltekit-preload-data="hover"
                    class={cn(
                        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors",
                        className,
                    )}
                    {...restProps}
                >
                    <div class="text-sm font-medium leading-none">{title}</div>
                    <p
                        class="text-muted-foreground line-clamp-2 text-sm leading-snug"
                    >
                        {content}
                    </p>
                </a>
            {/snippet}
        </NavigationMenu.Link>
    </li>
{/snippet}

<svelte:head>
    <!-- Favicon -->
    <link rel="icon" href={favicon} />

    <!-- Default SEO Meta Tags -->
    <meta name="author" content="Essam Gouda" />
    <meta name="robots" content="index, follow" />
    <meta name="googlebot" content="index, follow" />

    <!-- Open Graph defaults (pages can override) -->
    <meta property="og:site_name" content="egouda.xyz" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:type" content="website" />

    <!-- Twitter Card defaults -->
    <meta name="twitter:card" content="summary_large_image" />

    <!-- Theme color for mobile browsers -->
    <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
    <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
</svelte:head>
<ModeWatcher />
<Toaster />

<div class="min-h-screen">
    <header class="border-b">
        <div class="container mx-auto px-4 py-3 flex items-center">
            <NavigationMenu.Root>
                <NavigationMenu.List>
                    <NavigationMenu.Item>
                        <NavigationMenu.Link>
                            {#snippet child()}
                                <a
                                    href="/"
                                    data-sveltekit-preload-data="hover"
                                    class={navigationMenuTriggerStyle()}
                                >
                                    Portfolio
                                </a>
                            {/snippet}
                        </NavigationMenu.Link>
                    </NavigationMenu.Item>

                    <NavigationMenu.Item>
                        <NavigationMenu.Trigger>Blog</NavigationMenu.Trigger>
                        <NavigationMenu.Content>
                            <ul class="grid w-[400px] gap-2 p-2 md:w-[500px]">
                                {#if posts.length > 0}
                                    {#each posts.slice(0, 6) as post (post.href)}
                                        {@render ListItem({
                                            href: post.href,
                                            title: post.title,
                                            content: post.description || "",
                                        })}
                                    {/each}
                                    <li class="text-center p-2">
                                        <NavigationMenu.Link>
                                            {#snippet child()}
                                                <a
                                                    href="/blog"
                                                    data-sveltekit-preload-data="hover"
                                                    class="text-sm text-muted-foreground hover:text-foreground"
                                                >
                                                    View all posts →
                                                </a>
                                            {/snippet}
                                        </NavigationMenu.Link>
                                    </li>
                                {:else}
                                    <li
                                        class="p-3 text-sm text-muted-foreground"
                                    >
                                        <NavigationMenu.Link>
                                            {#snippet child()}
                                                <a
                                                    href="/blog"
                                                    data-sveltekit-preload-data="hover"
                                                    class="block"
                                                >
                                                    Blog
                                                </a>
                                            {/snippet}
                                        </NavigationMenu.Link>
                                    </li>
                                {/if}
                            </ul>
                        </NavigationMenu.Content>
                    </NavigationMenu.Item>
                </NavigationMenu.List>
            </NavigationMenu.Root>

            <button
                onclick={toggleMode}
                class="ml-auto p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label="Toggle theme"
            >
                {#if mode.current === "dark"}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                {:else}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                {/if}
            </button>
        </div>
    </header>

    <main class="container mx-auto px-4 py-8">
        {@render children()}
    </main>
</div>
