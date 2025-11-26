<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import "@excalidraw/excalidraw/index.css";

  let { 
    initialData = null, 
    onChange = undefined,
    class: className = "" 
  } = $props();

  let container: HTMLDivElement;
  let root: any;
  let React: any;
  let ReactDOM: any;
  let ExcalidrawLib: any;

  onMount(async () => {
    if (browser) {
      // Dynamically import React and Excalidraw to avoid SSR issues
      [React, ReactDOM, ExcalidrawLib] = await Promise.all([
        import('react'),
        import('react-dom/client'),
        import('@excalidraw/excalidraw')
      ]);

      const { Excalidraw } = ExcalidrawLib;

      // Create React root
      root = ReactDOM.createRoot(container);
      
      render(initialData);
    }
  });

  onDestroy(() => {
    if (root) {
      root.unmount();
    }
  });

  function render(data: any) {
    if (!root || !React || !ExcalidrawLib) return;

    const { Excalidraw } = ExcalidrawLib;
    
    // If data is null/undefined, pass minimal valid empty state or just undefined to let Excalidraw handle defaults
    // Excalidraw expects { elements: [], appState: {} } structure if provided
    const safeInitialData = data || { elements: [], appState: {} };

    // Sanitize appState to ensure collaborators is a Map if present, or removed if empty/invalid
    // The error 'props.appState.collaborators.forEach is not a function' suggests it might be saved as an object/array 
    // instead of a Map (Excalidraw internal expectation) or just corrupted.
    if (safeInitialData.appState) {
      // We generally don't want to persist collaborators in local storage anyway for a local-only app
      // so safe bet is to remove it from initialData
      delete safeInitialData.appState.collaborators;
    }

    const element = React.createElement(Excalidraw, {
      initialData: safeInitialData,
      onChange: (elements: any, appState: any, files: any) => {
        if (onChange) {
          onChange(elements, appState, files);
        }
      },
      UIOptions: {
        canvasActions: {
          loadScene: false,
          saveToActiveFile: false,
        }
      }
    });

    root.render(element);
  }
  
  // Re-render if initialData changes (optional, might need careful handling to not overwrite)
  $effect(() => {
      if(initialData && root) {
          // We generally don't want to re-render full excalidraw on prop change 
          // unless it's a hard reset, so we might leave this out or handle it carefully.
          // For now, we'll rely on the initial mount.
      }
  })

</script>

<style>
  /* Isolate Excalidraw from Tailwind's preflight */
  :global(.excalidraw-wrapper .excalidraw) {
    font-family: "Virgil", sans-serif;
  }
  
  :global(.excalidraw-wrapper svg) {
    /* Reset Tailwind's global svg styles that might conflict */
    display: inline;
    vertical-align: baseline;
  }
  
  /* Specific fix for Excalidraw toolbar icons if they are getting blown up */
  :global(.excalidraw-wrapper .App-toolbar svg),
  :global(.excalidraw-wrapper .App-menu__left svg),
  :global(.excalidraw-wrapper .layer-ui__wrapper svg),
  :global(.excalidraw-wrapper .main-menu-trigger svg) {
    width: auto;
    height: auto;
    max-width: none;
    max-height: none;
    display: block; /* Restore typical svg behavior for icons */
  }
</style>

<div bind:this={container} class={"excalidraw-wrapper " + className} style="height: 100%; width: 100%;"></div>
