<script lang="ts">
    import { Toaster } from "$lib/components/ui/sonner";
    import ReadingControls from "$lib/components/ReadingControls.svelte";

    import "../app.css";
    import favicon from "$lib/assets/favicon.svg";
    import { ModeWatcher, setMode } from "mode-watcher";
    import { browser } from "$app/environment";
    import { page } from "$app/state";
    import * as NavigationMenu from "$lib/components/ui/navigation-menu/index.js";
    import { navigationMenuTriggerStyle } from "$lib/components/ui/navigation-menu/navigation-menu-trigger.svelte";
    import { cn } from "$lib/utils.js";
    import { servicesLanguage } from "$lib/stores/services-language.svelte";
    import { isServicesLanguage } from "$lib/services-language";
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
    const hasInlineReadingControls = $derived(
        page.url.pathname.startsWith("/services"),
    );

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

    function isThemeMode(value: string | null): value is "light" | "dark" | "system" {
        return value === "light" || value === "dark" || value === "system";
    }

    let lastLanguageParam: string | null = null;
    let lastThemeParam: string | null = null;

    $effect(() => {
        if (!browser) return;

        const language = page.url.searchParams.get("lang");
        if (language !== lastLanguageParam) {
            lastLanguageParam = language;
            if (isServicesLanguage(language)) {
                servicesLanguage.current = language;
            }
        }

        const theme = page.url.searchParams.get("theme");
        if (theme !== lastThemeParam) {
            lastThemeParam = theme;
            if (isThemeMode(theme)) {
                setMode(theme);
            }
        }
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
    <script>
        (() => {
            const params = new URLSearchParams(window.location.search);
            const lang = params.get("lang");
            if (lang === "en" || lang === "ar") {
                localStorage.setItem("services-language", lang);
                document.cookie = `services-language=${lang}; Path=/; Max-Age=31536000; SameSite=Lax`;
            }

            const theme = params.get("theme");
            if (theme === "light" || theme === "dark" || theme === "system") {
                localStorage.setItem("mode-watcher-mode", theme);
            }
        })();
    </script>

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

            <div class="ml-auto">
                {#if hasInlineReadingControls}
                    <ReadingControls inline />
                {/if}
            </div>
        </div>
    </header>

    <main class="container mx-auto px-4 py-8">
        {@render children()}
    </main>
</div>

{#if !hasInlineReadingControls}
    <ReadingControls />
{/if}
