<script lang="ts">
  // Visual-only separator handle for resizable layouts.
  // This component does not implement resize logic; it only renders a styled separator.
  // Props:
  // - orientation: orientation of the separator itself:
  //     "vertical"   -> thin vertical bar (between left/right panes)
  //     "horizontal" -> thin horizontal bar (between top/bottom panes)
  // - withHandle: show a visible "grip" for better affordance
  // - className: extra classes for styling overrides
  export let className: string = "";
  export let orientation: "vertical" | "horizontal" = "vertical";
  export let withHandle: boolean = false;
</script>

<div
  role="separator"
  aria-orientation={orientation}
  data-orientation={orientation}
  class={[
    "group relative shrink-0 bg-border",
    // Vertical separator (between left/right panes)
    "data-[orientation=vertical]:w-px data-[orientation=vertical]:h-full data-[orientation=vertical]:cursor-col-resize",
    // Horizontal separator (between top/bottom panes)
    "data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=horizontal]:cursor-row-resize",
    className
  ].filter(Boolean).join(" ")}
  {...$$restProps}
>
  {#if withHandle}
    <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div
        data-orientation={orientation}
        class="rounded-sm border bg-background shadow-sm
               data-[orientation=vertical]:h-8 data-[orientation=vertical]:w-2.5
               data-[orientation=horizontal]:w-8 data-[orientation=horizontal]:h-2.5"
      >
        <div
          data-orientation={orientation}
          class="mx-auto my-auto rounded bg-foreground/50
                 data-[orientation=vertical]:h-4 data-[orientation=vertical]:w-0.5
                 data-[orientation=horizontal]:w-4 data-[orientation=horizontal]:h-0.5"
        ></div>
      </div>
    </div>
  {/if}
  <slot></slot>
</div>
