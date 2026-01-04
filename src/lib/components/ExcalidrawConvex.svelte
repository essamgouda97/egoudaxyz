<script lang="ts">
  import { useQuery, useConvexClient } from "convex-svelte";
  import { api } from "../../convex/_generated/api";
  import Excalidraw from "./Excalidraw.svelte";
  import { toast } from "svelte-sonner";

  import { onDestroy, onMount } from "svelte";
  import { browser } from "$app/environment";

  let { workspaceId } = $props();
  
  const client = useConvexClient();
  const drawingQuery = useQuery(api.drawings.get, { workspaceId });
  
  // We use derived state to track loading (access properties directly)
  let convexData = $derived(drawingQuery.data);
  let isLoading = $derived(drawingQuery.isLoading);
  let error = $derived(drawingQuery.error);

  // Local State
  let initialData = $state<any>(null);
  let isLocalLoaded = $state(false);

  // Debounce timer and error tracking
  let saveTimeout: any;
  let consecutiveFailures = 0;
  const MAX_RETRIES_BEFORE_TOAST = 3;
  
  // Track latest unsaved changes to flush on destroy
  let pendingSaveArgs: { elements: any, appState: any, files: any } | null = null;

  // Load from LocalStorage immediately on init (Synchronously)
  if (browser && workspaceId) {
      const localKey = `excalidraw-data-${workspaceId}`;
      const stored = localStorage.getItem(localKey);
      if (stored) {
          try {
              initialData = JSON.parse(stored);
              isLocalLoaded = true;
          } catch (e) {
              console.error("Failed to parse local storage", e);
          }
      }
      // If no local data, isLocalLoaded stays false, triggering loading state until Convex returns
  }

  // Sync strategy: 
  // 1. If we have local data, show it immediately.
  // 2. When Convex data arrives:
  //    - If local data was empty, update local with convex data and re-render (first sync).
  //    - If local data exists, compare updated timestamps.
  //    - If Convex is newer than Local, show a toast with action to update.
  
  $effect(() => {
      if (convexData && isLocalLoaded) {
          if (!initialData) {
              // First load from cloud (new device)
              initialData = convexData;
              if (browser) {
                  localStorage.setItem(`excalidraw-data-${workspaceId}`, JSON.stringify(convexData));
              }
          } else if (initialData && convexData.updatedAt && initialData.updatedAt) {
              // Conflict detection: Cloud is newer than Local
              // We use a threshold (e.g. 2 seconds) to avoid flagging our own just-saved changes 
              // if the clock skew or network delay is minor.
              // However, since we save Local synchronously, Local.updatedAt should be very recent.
              // If Cloud.updatedAt > Local.updatedAt, it implies a save from *another* device happened *after* our last local edit.
              
              if (convexData.updatedAt > initialData.updatedAt + 2000) { // 2s buffer
                  // Check if we already toasted for this version to avoid spam
                  // We can use a transient ID or just check if the timestamp is different from the last ignored one.
                  // For simplicity, just toast.
                  
                  // Ideally, use sonner to show a toast with a button.
                  // We need to track if we are currently showing this toast to avoid dupes.
                  // But standard toast.info works.
                  
                  toast.info("Newer version available from cloud", {
                      action: {
                          label: "Load Cloud Version",
                          onClick: () => {
                              initialData = convexData;
                              if (browser) {
                                  localStorage.setItem(`excalidraw-data-${workspaceId}`, JSON.stringify(convexData));
                              }
                              window.location.reload(); // Simplest way to force full re-render of Excalidraw with new initialData
                          }
                      },
                      duration: 10000, // Give them time to decide
                  });
              }
          }
      }
  });

  // Cleanup timeout on destroy to prevent saving to the wrong workspace or after unmount
  onDestroy(() => {
    if (saveTimeout) {
        clearTimeout(saveTimeout);
        // Flush pending save immediately if there is one
        if (pendingSaveArgs) {
            // Use the captured args and workspaceId from closure
            saveDrawing(pendingSaveArgs.elements, pendingSaveArgs.appState, pendingSaveArgs.files);
        }
    }
  });

  async function saveDrawing(elements: any, appState: any, files: any) {
      try {
        // Clean up appState before saving
        const cleanAppState = { ...appState };
        
        // Remove collaborators (not supported in Convex, causes "collaborators.forEach" error if map)
        delete cleanAppState.collaborators;
        
        // Remove unsupported types like Sets that Excalidraw might add
        // Aggressively prune transient UI state that doesn't need persistence and might contain Sets
        delete cleanAppState.followedBy; 
        delete cleanAppState.suggestion;
        delete cleanAppState.pendingImageElementId;
        delete cleanAppState.pasteDialog;
        delete cleanAppState.toast;
        delete cleanAppState.activeTool; 
        
        // Ensure selectedElementIds is an object, not a Map/Set (Excalidraw sometimes uses object with keys)
        // Convex handles objects fine.

        // console.log("Saving to workspace:", workspaceId, "Elements:", elements.length);

        await client.mutation(api.drawings.save, { 
          workspaceId, 
          elements, 
          appState: cleanAppState, 
          files 
        });
        
        // Reset failure count on success
        if (consecutiveFailures > 0) {
            consecutiveFailures = 0;
        }
      } catch (err) {
        console.error("Failed to save drawing:", err);
        consecutiveFailures++;
        
        // Only spam the user if it keeps failing
        if (consecutiveFailures >= MAX_RETRIES_BEFORE_TOAST) {
            toast.error("Failed to save changes to backend. Check connection.");
            consecutiveFailures = 0; 
        }
      }
  }

  function handleChange(elements: any, appState: any, files: any) {
    // 1. Save to LocalStorage IMMEDIATELY (Sync)
    if (browser) {
        const data = { elements, appState, files };
        localStorage.setItem(`excalidraw-data-${workspaceId}`, JSON.stringify(data));
    }

    // 2. Queue save to Convex (Async, Debounced)
    // Store args for potential flush
    pendingSaveArgs = { elements, appState, files };

    if (saveTimeout) clearTimeout(saveTimeout);
    
    saveTimeout = setTimeout(async () => {
        saveTimeout = null; // Clear ref so destroy doesn't double-save
        await saveDrawing(elements, appState, files);
        pendingSaveArgs = null; // clear pending args after successful save
    }, 2000); // Increased debounce to 2 seconds to reduce network chatter since we have local backup
  }
</script>

<!-- Show loading only if we have NEITHER local nor convex data -->
{#if !isLocalLoaded && isLoading}
  <div class="flex items-center justify-center h-full text-muted-foreground">
    Loading drawing...
  </div>
{:else}
  <!-- Key the component by workspaceId so it completely remounts when switching workspaces -->
  <!-- We pass initialData derived from Local -> Convex fallback -->
  <Excalidraw 
    initialData={initialData || undefined} 
    onChange={handleChange}
    class="h-full w-full"
  />
{/if}

{#if error}
  <div class="flex items-center justify-center h-full text-destructive">
    Error loading drawing: {error.message}
  </div>
{/if}
