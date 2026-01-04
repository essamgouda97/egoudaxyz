<script lang="ts">
    import { Toaster } from "$lib/components/ui/sonner";
    import { createSvelteAuthClient } from "@mmailaender/convex-better-auth-svelte/svelte";
    import { authClient } from "$lib/auth-client";
    import { PUBLIC_CONVEX_URL } from "$env/static/public";
    import { setConvexClientContext } from "convex-svelte";
    import { convexClientInstance } from "$lib/convex-client";
    import { onMount } from "svelte";
    import { browser } from "$app/environment";

    import "../app.css";
    import favicon from "$lib/assets/favicon.svg";
    import { ModeWatcher } from "mode-watcher";
    import * as NavigationMenu from "$lib/components/ui/navigation-menu/index.js";
    import { navigationMenuTriggerStyle } from "$lib/components/ui/navigation-menu/navigation-menu-trigger.svelte";
    import { cn } from "$lib/utils.js";
    import type { HTMLAttributes } from "svelte/elements";

    // Only initialize auth client on the browser
    if (browser) {
        // Use the singleton client instance
        setConvexClientContext(convexClientInstance);
        
        if (PUBLIC_CONVEX_URL) {
            createSvelteAuthClient({ authClient, convexUrl: PUBLIC_CONVEX_URL });
        }
    }

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
    <link rel="icon" href={favicon} />
</svelte:head>
<ModeWatcher />
<Toaster />

<div class="min-h-screen">
    <header class="border-b">
        <div class="container mx-auto px-4 py-3">
            <NavigationMenu.Root>
                <NavigationMenu.List>
                    <NavigationMenu.Item>
                        <NavigationMenu.Link>
                            {#snippet child()}
                                <a
                                    href="/dashboard"
                                    data-sveltekit-preload-data="hover"
                                    class={navigationMenuTriggerStyle()}
                                >
                                    Dashboard
                                </a>
                            {/snippet}
                        </NavigationMenu.Link>
                    </NavigationMenu.Item>

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
        </div>
    </header>

    <main class="container mx-auto px-4 py-8">
        {@render children()}
    </main>
</div>
