<script lang="ts">
  import { authClient } from "$lib/auth-client";
  import Button from "$lib/components/ui/button/button.svelte";
  import * as Tabs from "$lib/components/ui/tabs";
  import * as Sidebar from "$lib/components/ui/sidebar";
  import * as ContextMenu from "$lib/components/ui/context-menu";
  import * as Dialog from "$lib/components/ui/dialog";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import Input from "$lib/components/ui/input/input.svelte";
  import Label from "$lib/components/ui/label/label.svelte";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import Excalidraw from "$lib/components/ExcalidrawConvex.svelte";
  import { browser } from "$app/environment";
  import LogOut from "@lucide/svelte/icons/log-out";
  import { useQuery, useConvexClient } from "convex-svelte";
  import { api } from "../../convex/_generated/api";

  const workspacesQuery = useQuery(api.workspaces.list, {});
  const client = useConvexClient();

  // State using Svelte 5 Runes
  let activeWorkspaceId = $state<string | null>(null);
  let workspaceToDelete = $state<string | null>(null);
  let workspaceToRename = $state<string | null>(null);
  let renameValue = $state("");
  let showRenameDialog = $state(false);
  let showDeleteDialog = $state(false);

  // Derived workspaces from Convex query (direct access, not a store)
  let workspaces = $derived(workspacesQuery.data || []);

  // Initialize active workspace if needed
  $effect(() => {
      if (workspaces.length > 0 && !activeWorkspaceId) {
          activeWorkspaceId = workspaces[0]._id;
      }
  });

  async function createNewWorkspace() {
    const newId = await client.mutation(api.workspaces.create, { name: `Workspace ${workspaces.length + 1}` });
    activeWorkspaceId = newId;
  }

  async function deleteWorkspace(id: string) {
    await client.mutation(api.workspaces.deleteWorkspace, { id: id as any });
    if (activeWorkspaceId === id) {
      activeWorkspaceId = null;
    }
    workspaceToDelete = null;
    showDeleteDialog = false;
  }

  async function renameWorkspace() {
    if (!workspaceToRename) return;
    
    await client.mutation(api.workspaces.rename, { id: workspaceToRename as any, name: renameValue });
    showRenameDialog = false;
    workspaceToRename = null;
  }

  function openRenameDialog(id: string, currentName: string) {
    workspaceToRename = id;
    renameValue = currentName;
    showRenameDialog = true;
  }

  function openDeleteDialog(id: string) {
    workspaceToDelete = id;
    showDeleteDialog = true;
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
                  {#each workspaces as workspace (workspace._id)}
                    <Sidebar.SidebarMenuItem>
                      <ContextMenu.Root>
                        <ContextMenu.Trigger>
                          <Sidebar.SidebarMenuButton
                            onclick={() => (activeWorkspaceId = workspace._id)}
                            isActive={activeWorkspaceId === workspace._id}
                            class="w-full justify-between"
                          >
                            <span class="truncate">{workspace.name}</span>
                          </Sidebar.SidebarMenuButton>
                        </ContextMenu.Trigger>
                        <ContextMenu.Content>
                          <ContextMenu.Item onclick={() => openRenameDialog(workspace._id, workspace.name)}>
                            Rename
                          </ContextMenu.Item>
                          <ContextMenu.Item
                            onclick={() => openDeleteDialog(workspace._id)}
                            class="text-destructive focus:text-destructive"
                          >
                            Delete
                          </ContextMenu.Item>
                        </ContextMenu.Content>
                      </ContextMenu.Root>
                      {#if !activeWorkspaceId}
                        <!-- Optional: Keep a direct delete action if sidebar is collapsed or just as a shortcut -->
                        <!-- But since we are moving to right click, we can hide the direct delete button or make it only appear on hover in a cleaner way -->
                      {/if}
                    </Sidebar.SidebarMenuItem>
                  {/each}
                </Sidebar.SidebarMenu>
              {/if}
            </Sidebar.SidebarGroup>
          </Sidebar.SidebarContent>
          <Sidebar.SidebarFooter class="border-t p-4">
            <Sidebar.SidebarMenu>
              <Sidebar.SidebarMenuItem>
                <Sidebar.SidebarMenuButton onclick={handleSignOut}>
                  <LogOut />
                  <span>Sign Out</span>
                </Sidebar.SidebarMenuButton>
              </Sidebar.SidebarMenuItem>
            </Sidebar.SidebarMenu>
          </Sidebar.SidebarFooter>
        </Sidebar.Sidebar>
        <Sidebar.SidebarInset class="h-full overflow-hidden flex flex-col">
          <header class="flex h-14 items-center gap-2 border-b bg-background px-4 shrink-0">
            <Sidebar.SidebarTrigger />
            <div class="w-px h-4 bg-border mx-2"></div>
            {#if activeWorkspaceId}
              <h2 class="text-lg font-semibold truncate">
                {workspaces.find((w) => w._id === activeWorkspaceId)?.name}
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
                   workspaceId={activeWorkspaceId}
                 />
               </div>
             {/key}
           {:else}
              <div class="flex h-full w-full items-center justify-center">
                <div class="text-center">
                  <p class="mb-4 text-lg font-medium">No workspace selected</p>
                  <Button onclick={createNewWorkspace}>Create  Workspace</Button>
                </div>
              </div>
            {/if}
          </div>
        </Sidebar.SidebarInset>
      </Sidebar.Provider>
    </Tabs.Content>
  </Tabs.Root>
</div>

<Dialog.Root bind:open={showRenameDialog}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Rename Workspace</Dialog.Title>
      <Dialog.Description>
        Enter a new name for your workspace.
      </Dialog.Description>
    </Dialog.Header>
    <div class="grid gap-4 py-4">
      <div class="grid grid-cols-4 items-center gap-4">
        <Label for="name" class="text-right">Name</Label>
        <Input id="name" bind:value={renameValue} class="col-span-3" />
      </div>
    </div>
    <Dialog.Footer>
      <Button type="submit" onclick={renameWorkspace}>Save changes</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<AlertDialog.Root bind:open={showDeleteDialog}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
      <AlertDialog.Description>
        This action cannot be undone. This will permanently delete your workspace
        and remove all drawing data associated with it.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel onclick={() => {
        showDeleteDialog = false;
        workspaceToDelete = null;
      }}>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action class="bg-destructive text-destructive-foreground hover:bg-destructive/90" onclick={() => {
        if (workspaceToDelete) deleteWorkspace(workspaceToDelete);
      }}>Delete</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
