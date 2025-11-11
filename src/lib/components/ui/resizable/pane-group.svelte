<script lang="ts">
    import { writable, get } from "svelte/store";
    import { onDestroy, onMount, createEventDispatcher } from "svelte";

    type Direction = "horizontal" | "vertical";

    // Public API
    export let direction: Direction = "horizontal";
    export let className: string = "";

    // Two-pane initial sizes (percentages that sum to 100)
    export let defaultA = 75;
    export let defaultB = 25;

    // Minimum sizes for each pane (percent)
    export let minA = 10;
    export let minB = 10;

    // Optional localStorage key to persist user-resized sizes
    export let storageKey: string | null = null;

    // Keyboard step size in percent
    export let step = 2;

    // Internal state
    const dispatch = createEventDispatcher<{
        resize: { a: number; b: number };
    }>();
    function getInitialSizes() {
        if (typeof window !== "undefined" && storageKey) {
            try {
                const raw = localStorage.getItem(storageKey);
                if (raw) {
                    const parsed = JSON.parse(raw) as {
                        a?: number;
                        b?: number;
                    };
                    if (
                        typeof parsed?.a === "number" &&
                        typeof parsed?.b === "number"
                    ) {
                        return normalizeAndClamp(
                            parsed.a,
                            parsed.b,
                            minA,
                            minB,
                        );
                    }
                }
            } catch {
                // ignore storage errors
            }
        }
        return normalizeAndClamp(defaultA, defaultB, minA, minB);
    }
    const sizes = writable<{ a: number; b: number }>(getInitialSizes());

    let containerEl: HTMLDivElement | null = null;
    let handleEl: HTMLButtonElement | null = null;
    let dragging = false;
    let startPos = 0;
    let startSizes = { a: 0, b: 0 };

    const isHorizontal = () => direction === "horizontal";

    onMount(() => {
        // Sizes are initialized synchronously from localStorage (if available) to avoid flicker.

        // Persist and emit resize on changes
        const unsub = sizes.subscribe((val) => {
            dispatch("resize", val);
            if (storageKey && typeof localStorage !== "undefined") {
                try {
                    localStorage.setItem(storageKey, JSON.stringify(val));
                } catch {
                    // ignore storage errors
                }
            }
            // Persist to cookie for SSR defaults
            if (typeof document !== "undefined" && storageKey) {
                try {
                    const oneYear = 60 * 60 * 24 * 365;
                    document.cookie = `${storageKey}=${encodeURIComponent(JSON.stringify(val))}; Path=/; Max-Age=${oneYear}; SameSite=Lax`;
                } catch {
                    // ignore cookie errors
                }
            }
        });

        return () => {
            unsub();
        };
    });

    // Pointer interactions
    function onPointerDown(e: PointerEvent) {
        if (!handleEl) return;
        dragging = true;
        try {
            handleEl.setPointerCapture(e.pointerId);
        } catch {
            // ignore
        }
        startPos = getPointerPos(e);
        startSizes = get(sizes);
        addDragGlobalListeners();
        e.preventDefault();
    }

    function onPointerMove(e: PointerEvent) {
        if (!dragging || !containerEl) return;
        const current = getPointerPos(e);
        const deltaPx = current - startPos;
        const totalPx = getContainerSize();
        if (totalPx <= 0) return;

        const deltaPercent = (deltaPx / totalPx) * 100;
        const a = startSizes.a + deltaPercent;
        const b = 100 - a;
        sizes.set(normalizeAndClamp(a, b, minA, minB));
    }

    function onPointerUp(e: PointerEvent) {
        if (!dragging || !handleEl) return;
        dragging = false;
        try {
            handleEl.releasePointerCapture(e.pointerId);
        } catch {
            // ignore
        }
        removeDragGlobalListeners();
    }

    function addDragGlobalListeners() {
        if (typeof window === "undefined") return;
        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", onPointerUp);
        window.addEventListener("pointercancel", onPointerUp);
    }

    function removeDragGlobalListeners() {
        if (typeof window === "undefined") return;
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerUp);
    }

    onDestroy(() => {
        removeDragGlobalListeners();
    });

    // Keyboard interactions on the handle (using a button to satisfy a11y)
    function onHandleKeyDown(e: KeyboardEvent) {
        const k = e.key;
        const { a, b } = get(sizes);
        const horiz = isHorizontal();

        if (
            (horiz && (k === "ArrowLeft" || k === "ArrowRight")) ||
            (!horiz && (k === "ArrowUp" || k === "ArrowDown")) ||
            k === "Home" ||
            k === "End"
        ) {
            e.preventDefault();
        } else {
            return;
        }

        if (k === "Home") {
            sizes.set(normalizeAndClamp(minA, 100 - minA, minA, minB));
            return;
        }
        if (k === "End") {
            sizes.set(normalizeAndClamp(100 - minB, minB, minA, minB));
            return;
        }

        let delta = step;
        if ((horiz && k === "ArrowLeft") || (!horiz && k === "ArrowUp")) {
            delta = -step;
        }

        const nextA = a + delta;
        const nextB = b - delta;
        sizes.set(normalizeAndClamp(nextA, nextB, minA, minB));
    }

    // Helpers
    function normalizeAndClamp(
        a: number,
        b: number,
        minA: number,
        minB: number,
    ) {
        let sum = a + b;
        if (sum === 0) {
            a = 50;
            b = 50;
            sum = 100;
        }
        // normalize to 100
        a = (a / sum) * 100;
        b = 100 - a;

        // clamp mins
        a = Math.max(minA, Math.min(100 - minB, a));
        b = 100 - a;

        // round to two decimals for stable inline styles
        return {
            a: Math.round(a * 100) / 100,
            b: Math.round(b * 100) / 100,
        };
    }

    function getPointerPos(e: PointerEvent) {
        return isHorizontal() ? e.clientX : e.clientY;
    }

    function getContainerSize() {
        if (!containerEl) return 0;
        const rect = containerEl.getBoundingClientRect();
        return isHorizontal() ? rect.width : rect.height;
    }

    // Mouse fallback
    function onMouseDown(e: MouseEvent) {
        dragging = true;
        startPos = isHorizontal() ? e.clientX : e.clientY;
        startSizes = get(sizes);
        if (typeof window !== "undefined") {
            window.addEventListener("mousemove", onMouseMove);
            window.addEventListener("mouseup", onMouseUp);
        }
        e.preventDefault();
    }

    function onMouseMove(e: MouseEvent) {
        if (!dragging || !containerEl) return;
        const current = isHorizontal() ? e.clientX : e.clientY;
        const deltaPx = current - startPos;
        const totalPx = getContainerSize();
        if (totalPx <= 0) return;
        const deltaPercent = (deltaPx / totalPx) * 100;
        const a = startSizes.a + deltaPercent;
        const b = 100 - a;
        sizes.set(normalizeAndClamp(a, b, minA, minB));
    }

    function onMouseUp(_e: MouseEvent) {
        if (!dragging) return;
        dragging = false;
        removeMouseGlobalListeners();
    }

    function removeMouseGlobalListeners() {
        if (typeof window === "undefined") return;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
    }

    // Touch fallback
    function onTouchStart(e: TouchEvent) {
        const t = e.touches[0];
        if (!t) return;
        dragging = true;
        startPos = isHorizontal() ? t.clientX : t.clientY;
        startSizes = get(sizes);
        if (typeof window !== "undefined") {
            window.addEventListener("touchmove", onTouchMove, {
                passive: false,
            });
            window.addEventListener("touchend", onTouchEnd);
            window.addEventListener("touchcancel", onTouchEnd);
        }
        e.preventDefault();
    }

    function onTouchMove(e: TouchEvent) {
        if (!dragging || !containerEl) return;
        const t = e.touches[0];
        if (!t) return;
        const current = isHorizontal() ? t.clientX : t.clientY;
        const deltaPx = current - startPos;
        const totalPx = getContainerSize();
        if (totalPx <= 0) return;
        const deltaPercent = (deltaPx / totalPx) * 100;
        const a = startSizes.a + deltaPercent;
        const b = 100 - a;
        sizes.set(normalizeAndClamp(a, b, minA, minB));
        e.preventDefault();
    }

    function onTouchEnd(_e: TouchEvent) {
        if (!dragging) return;
        dragging = false;
        removeTouchGlobalListeners();
    }

    function removeTouchGlobalListeners() {
        if (typeof window === "undefined") return;
        window.removeEventListener("touchmove", onTouchMove as any);
        window.removeEventListener("touchend", onTouchEnd as any);
        window.removeEventListener("touchcancel", onTouchEnd as any);
    }

    onDestroy(() => {
        removeMouseGlobalListeners();
        removeTouchGlobalListeners();
    });

    $: a = get(sizes).a;
    $: b = get(sizes).b;

    $: handleDataOrientation = isHorizontal() ? "vertical" : "horizontal";
</script>

<div
    bind:this={containerEl}
    data-orientation={direction}
    class={[
        "flex w-full h-full min-w-0 min-h-0 grow select-none",
        isHorizontal() ? "flex-row" : "flex-col",
        className,
    ]
        .filter(Boolean)
        .join(" ")}
>
    <!-- Pane A -->
    <div class="min-w-0 min-h-0 flex-none" style={`flex-basis:${$sizes.a}%;`}>
        <slot name="pane-a" />
    </div>

    <!-- Handle (interactive button for a11y) -->
    <button
        bind:this={handleEl}
        type="button"
        aria-label="Resize panels"
        data-orientation={handleDataOrientation}
        on:pointerdown={onPointerDown}
        on:mousedown={onMouseDown}
        on:touchstart={onTouchStart}
        on:keydown={onHandleKeyDown}
        class={[
            "relative shrink-0 bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-ring/50 touch-none",
            isHorizontal()
                ? "w-2.5 h-full cursor-col-resize"
                : "h-2.5 w-full cursor-row-resize",
        ].join(" ")}
    >
        <!-- Centered 1px separator line for visual; larger hit area for pointer -->
        <span
            aria-hidden="true"
            class={[
                "absolute inset-0 m-auto bg-border",
                isHorizontal() ? "w-px h-full" : "h-px w-full",
            ].join(" ")}
        ></span>
        <span
            class="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
            <span
                data-orientation={handleDataOrientation}
                class="rounded-sm border bg-background shadow-sm
               data-[orientation=vertical]:h-8 data-[orientation=vertical]:w-2.5
               data-[orientation=horizontal]:w-8 data-[orientation=horizontal]:h-2.5"
            >
                <span
                    data-orientation={handleDataOrientation}
                    class="mx-auto my-auto rounded bg-foreground/50
                 data-[orientation=vertical]:h-4 data-[orientation=vertical]:w-0.5
                 data-[orientation=horizontal]:w-4 data-[orientation=horizontal]:h-0.5"
                ></span>
            </span>
        </span>
    </button>

    <!-- Pane B -->
    <div class="min-w-0 min-h-0 flex-none" style={`flex-basis:${$sizes.b}%;`}>
        <slot name="pane-b" />
    </div>
</div>
