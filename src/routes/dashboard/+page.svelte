<script lang="ts">
  import { authClient } from "$lib/auth-client";
  import Button from "$lib/components/ui/button/button.svelte";
  import * as Tabs from "$lib/components/ui/tabs";
  import * as Sidebar from "$lib/components/ui/sidebar";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import Excalidraw from "$lib/components/Excalidraw.svelte";
  import { browser } from "$app/environment";

  let workspaces: { id: string; name: string }[] = [];
  let activeWorkspaceId: string | null = null;
  
  onMount(async () => {
    // Load workspaces from storage or initialize with default
    const stored = localStorage.getItem("excalidraw-workspaces");
    if (stored) {
      workspaces = JSON.parse(stored);
    } else {
      workspaces = [];
    }
  });

  function createNewWorkspace() {
    const newId = `workspace-${Date.now()}`;
    const newWorkspace = {
      id: newId,
      name: `Workspace ${workspaces.length + 1}`,
    };
    workspaces = [...workspaces, newWorkspace];
    activeWorkspaceId = newId;
    localStorage.setItem("excalidraw-workspaces", JSON.stringify(workspaces));
  }

  function deleteWorkspace(id: string) {
    workspaces = workspaces.filter((w) => w.id !== id);
    if (activeWorkspaceId === id) {
      activeWorkspaceId = workspaces[0]?.id || null;
    }
    localStorage.setItem("excalidraw-workspaces", JSON.stringify(workspaces));
    // Also clean up the data
    localStorage.removeItem(`excalidraw-data-${id}`);
  }

  async function handleSignOut() {
    await authClient.signOut();
    goto("/login");
  }

  function getWorkspaceData(id: string) {
    if (!browser) return null;
    const stored = localStorage.getItem(`excalidraw-data-${id}`);
    return stored ? JSON.parse(stored) : null;
  }

  function handleExcalidrawChange(elements: any, appState: any, files: any) {
    if (activeWorkspaceId && browser) {
      const data = { elements, appState, files };
      localStorage.setItem(`excalidraw-data-${activeWorkspaceId}`, JSON.stringify(data));
    }
  }
</script>

<div class="flex h-screen flex-col">
  <Tabs.Root defaultValue="dashboard" class="flex flex-1 flex-col">
    <div class="border-b bg-background px-4">
      <Tabs.List class="h-12">
        <Tabs.Trigger value="dashboard">Dashboard</Tabs.Trigger>
        <Tabs.Trigger value="excalidraw">Excalidraw</Tabs.Trigger>
      </Tabs.List>
    </div>

    <Tabs.Content value="dashboard" class="flex-1">
      <div class="p-8">
        <h1 class="text-2xl font-bold">Dashboard</h1>
        <p>Welcome to your personal dashboard.</p>
        <Button onclick={handleSignOut} class="mt-4">Sign Out</Button>
      </div>
    </Tabs.Content>

    <Tabs.Content value="excalidraw" class="flex flex-1 relative overflow-hidden">
      <Sidebar.Provider class="h-full w-full !min-h-0">
        <Sidebar.Sidebar collapsible="icon" class="!absolute !h-full border-r">
          <Sidebar.SidebarHeader class="border-b p-4 h-14 flex items-center justify-center">
            <h2 class="text-lg font-semibold group-data-[collapsible=icon]:hidden">Workspaces</h2>
            <h2 class="text-lg font-semibold hidden group-data-[collapsible=icon]:block">Ws</h2>
          </Sidebar.SidebarHeader>
          <Sidebar.SidebarContent>
            <Sidebar.SidebarGroup>
              <Sidebar.SidebarMenu>
                <Sidebar.SidebarMenuItem>
                  <Sidebar.SidebarMenuButton onclick={createNewWorkspace}>
                    <span class="text-lg leading-none">+</span>
                    <span>New Workspace</span>
                  </Sidebar.SidebarMenuButton>
                </Sidebar.SidebarMenuItem>
              </Sidebar.SidebarMenu>
              <div class="my-2 border-b"></div>
              {#if workspaces.length > 0}
                <Sidebar.SidebarMenu>
                  {#each workspaces as workspace (workspace.id)}
                    <Sidebar.SidebarMenuItem>
                      <Sidebar.SidebarMenuButton
                        onclick={() => (activeWorkspaceId = workspace.id)}
                        isActive={activeWorkspaceId === workspace.id}
                        class="w-full justify-between"
                      >
                        <span class="truncate">{workspace.name}</span>
                      </Sidebar.SidebarMenuButton>
                      <Sidebar.SidebarMenuAction
                        onclick={(e) => {
                          e.stopPropagation();
                          deleteWorkspace(workspace.id);
                        }}
                      >
                        <span class="sr-only">Delete</span>
                        ×
                      </Sidebar.SidebarMenuAction>
                    </Sidebar.SidebarMenuItem>
                  {/each}
                </Sidebar.SidebarMenu>
              {/if}
            </Sidebar.SidebarGroup>
          </Sidebar.SidebarContent>
          <Sidebar.SidebarFooter class="border-t p-4">
            <Button onclick={handleSignOut} variant="outline" size="sm" class="w-full">
              Sign Out
            </Button>
          </Sidebar.SidebarFooter>
        </Sidebar.Sidebar>
        <Sidebar.SidebarInset class="h-full overflow-hidden flex flex-col">
          <header class="flex h-14 items-center gap-2 border-b bg-background px-4 shrink-0">
            <Sidebar.SidebarTrigger />
            <div class="w-px h-4 bg-border mx-2"></div>
            {#if activeWorkspaceId}
              <h2 class="text-lg font-semibold truncate">
                {workspaces.find((w) => w.id === activeWorkspaceId)?.name}
              </h2>
            {:else}
              <h2 class="text-lg font-semibold text-muted-foreground">Select a workspace</h2>
            {/if}
          </header>
          <div class="flex-1 relative w-full min-h-0">
            {#if activeWorkspaceId}
              {#key activeWorkspaceId}
                <div class="absolute inset-0">
                  <Excalidraw
                    initialData={getWorkspaceData(activeWorkspaceId)}
                    onChange={handleExcalidrawChange}
                  />
                </div>
              {/key}
            {:else}
              <div class="flex h-full w-full items-center justify-center">
                <div class="text-center">
                  <p class="mb-4 text-lg font-medium">No workspace selected</p>
                  <Button onclick={createNewWorkspace}>Create First Workspace</Button>
                </div>
              </div>
            {/if}
          </div>
        </Sidebar.SidebarInset>
      </Sidebar.Provider>
    </Tabs.Content>
  </Tabs.Root>
</div>
