<script lang="ts">
  // Simple passthrough Pane component using className prop
  export let className: string = "";
</script>

<div class={className} {...$$restProps}>
  <slot />
</div>
