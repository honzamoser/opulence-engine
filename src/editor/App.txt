<script lang="ts">
    import "./style.css";
    import * as game from "../..../../game_src/render_test
    const toolbarItems: string[] = [
        "File",
        "Edit",
        "Assets",
        "GameObject",
        "Window",
        "Help",
    ];

    // State management
    let selectedHierarchyItem = $state("Main Scene");
    let selectedViewportTab = $state("Scene");
    let selectedBottomTab = $state("assets");
    let selectedViewportTool = $state("move");
    let isPlaying = $state(false);
    let isPaused = $state(false);

    // Hierarchy state
    let expandedItems = $state(new Set(["Main Scene", "Player"]));

    let consoleMessages = $state<
        { type: "log" | "warn" | "error"; text: string; trace: string }[]
    >([]);

    // File System API state
    type FileItem = {
        name: string;
        type: "file" | "directory";
        path: string;
        handle?: FileSystemFileHandle | FileSystemDirectoryHandle;
        children?: FileItem[] | undefined;
    };

    let projectDirectoryHandle = $state<FileSystemDirectoryHandle | null>(null);
    let currentAssetPath = $state<string[]>([]);
    let assetItems = $state<FileItem[]>([]);
    let expandedAssetFolders = $state(new Set<string>());
    let loadingFolders = $state(new Set<string>());
    let selectedAssetPath = $state<string | null>(null);

    // File explorer navigation mode
    type AssetViewMode = "tree" | "explorer";
    let assetViewMode = $state<AssetViewMode>("tree");
    let currentExplorerPath = $state<string[]>([]);
    let currentExplorerItems = $state<FileItem[]>([]);

    let hierarchy = $state([
        {
            id: "main-scene",
            name: "Main Scene",
            icon: "▣",
            children: ["light", "camera", "player", "terrain", "audio"],
        },
        {
            id: "light",
            name: "Directional Light",
            icon: "◐",
            parent: "main-scene",
        },
        { id: "camera", name: "Main Camera", icon: "◉", parent: "main-scene" },
        {
            id: "player",
            name: "Player",
            icon: "▢",
            parent: "main-scene",
            children: ["mesh-renderer", "controller"],
        },
        {
            id: "mesh-renderer",
            name: "Mesh Renderer",
            icon: "▢",
            parent: "player",
        },
        {
            id: "controller",
            name: "Character Controller",
            icon: "◈",
            parent: "player",
        },
        { id: "terrain", name: "Terrain", icon: "▢", parent: "main-scene" },
        { id: "audio", name: "Audio Source", icon: "♪", parent: "main-scene" },
    ]);

    // Inspector collapsed sections
    let collapsedSections = $state(new Set<string>());

    // Console override
    let originalLog = console.log;
    console.log = function (...args) {
        originalLog.apply(console, args);
        const logContainer = document.getElementById("console-content");
        if (logContainer) {
            const message = args.join(" ");
            consoleMessages = [
                ...consoleMessages,
                { type: "log", text: message, trace: "" },
            ];
            // Auto-scroll to bottom
            setTimeout(() => {
                logContainer.scrollTop = logContainer.scrollHeight;
            }, 0);
        }
    };

    // Toolbar functions
    function handlePlay() {
        if (!isPlaying) {
            isPlaying = true;
            isPaused = false;
            startGame();
            console.log("Game started");
        }
    }

    function handlePause() {
        if (isPlaying) {
            isPaused = !isPaused;
            console.log(isPaused ? "Game paused" : "Game resumed");
        }
    }

    function handleStop() {
        if (isPlaying) {
            isPlaying = false;
            isPaused = false;
            console.log("Game stopped");
        }
    }

    function handleBuild() {
        console.log("Building project...");
        // TODO: Implement build functionality
    }

    async function handleMenuClick(item: string) {
        console.log(`Menu clicked: ${item}`);

        if (item === "File") {
            // Could open a submenu here
        } else if (item === "Assets") {
            await openProjectDirectory();
        }
    }

    // File System Access API functions
    async function openProjectDirectory() {
        try {
            // @ts-ignore - File System Access API
            if (!window.showDirectoryPicker) {
                console.error(
                    "File System Access API not supported in this browser",
                );
                return;
            }

            // @ts-ignore
            const dirHandle = await window.showDirectoryPicker({
                mode: "readwrite",
            });

            projectDirectoryHandle = dirHandle;
            console.log(`Opened project directory: ${dirHandle.name}`);

            // Load the directory structure
            await loadProjectAssets();
        } catch (err) {
            if (err.name !== "AbortError") {
                console.error("Error opening directory:", err);
            }
        }
    }

    async function loadProjectAssets() {
        if (!projectDirectoryHandle) return;

        try {
            const items: FileItem[] = [];

            // Try to find /resources directory
            try {
                const resourcesHandle =
                    await projectDirectoryHandle.getDirectoryHandle(
                        "resources",
                    );
                const resourcesItems = await loadDirectory(
                    resourcesHandle,
                    "resources",
                );
                console.log(
                    "Loaded /resources with",
                    resourcesItems.length,
                    "items",
                );
                items.push({
                    name: "resources",
                    type: "directory",
                    path: "resources",
                    handle: resourcesHandle,
                    children: resourcesItems,
                });
            } catch (e) {
                console.log("No /resources directory found");
            }

            // Try to find /game_src directory
            try {
                const gameSrcHandle =
                    await projectDirectoryHandle.getDirectoryHandle("game_src");
                const gameSrcItems = await loadDirectory(
                    gameSrcHandle,
                    "game_src",
                );
                console.log(
                    "Loaded /game_src with",
                    gameSrcItems.length,
                    "items",
                );
                items.push({
                    name: "game_src",
                    type: "directory",
                    path: "game_src",
                    handle: gameSrcHandle,
                    children: gameSrcItems,
                });
            } catch (e) {
                console.log("No /game_src directory found");
            }

            assetItems = items;

            // Auto-expand root directories for better UX
            items.forEach((item) => {
                console.log("Auto-expanding:", item.path);
                expandedAssetFolders.add(item.path);
            });
            expandedAssetFolders = new Set(expandedAssetFolders);

            // Initialize explorer view with root items
            currentExplorerItems = items;

            console.log(`Loaded ${items.length} root directories`);
            console.log("Asset items:", assetItems);
            console.log("Expanded folders:", Array.from(expandedAssetFolders));
        } catch (err) {
            console.error("Error loading assets:", err);
        }
    }

    async function loadDirectory(
        dirHandle: FileSystemDirectoryHandle,
        basePath: string,
    ): Promise<FileItem[]> {
        const items: FileItem[] = [];

        try {
            // @ts-ignore
            for await (const entry of dirHandle.values()) {
                const fullPath = `${basePath}/${entry.name}`;

                if (entry.kind === "directory") {
                    items.push({
                        name: entry.name,
                        type: "directory",
                        path: fullPath,
                        handle: entry,
                        children: undefined, // Load lazily when expanded
                    });
                } else {
                    items.push({
                        name: entry.name,
                        type: "file",
                        path: fullPath,
                        handle: entry,
                    });
                }
            }
        } catch (err) {
            console.error(`Error loading directory ${basePath}:`, err);
        }

        // Sort: directories first, then files, alphabetically
        items.sort((a, b) => {
            if (a.type === b.type) {
                return a.name.localeCompare(b.name);
            }
            return a.type === "directory" ? -1 : 1;
        });

        return items;
    }

    async function toggleAssetFolder(item: FileItem, event?: Event) {
        if (event) {
            event.stopPropagation();
        }

        console.log("Toggling folder:", item.name, "path:", item.path);
        const pathKey = item.path;

        if (expandedAssetFolders.has(pathKey)) {
            console.log("Collapsing folder:", item.name);
            expandedAssetFolders.delete(pathKey);
            // Force reactivity by creating new Set
            expandedAssetFolders = new Set(expandedAssetFolders);
        } else {
            console.log("Expanding folder:", item.name);
            // Load children if not loaded yet
            if (
                item.type === "directory" &&
                item.handle &&
                item.children === undefined
            ) {
                console.log("Loading children for:", item.name);
                loadingFolders.add(pathKey);
                loadingFolders = loadingFolders;

                const children = await loadDirectory(
                    item.handle as FileSystemDirectoryHandle,
                    item.path,
                );

                console.log(
                    "Loaded",
                    children?.length,
                    "children for:",
                    item.name,
                );

                // Update the item with children
                item.children = children;
                loadingFolders.delete(pathKey);
                loadingFolders = loadingFolders;
            } else {
                console.log("Children already loaded:", item.children?.length);
            }
            expandedAssetFolders.add(pathKey);
            // Force reactivity by creating new Set
            expandedAssetFolders = new Set(expandedAssetFolders);
            console.log(
                "Expanded folders after toggle:",
                Array.from(expandedAssetFolders),
            );
            console.log("Is folder expanded?", isAssetFolderExpanded(pathKey));
        }
    }

    function isAssetFolderExpanded(path: string): boolean {
        const isExpanded = expandedAssetFolders.has(path);
        return isExpanded;
    }

    function isFolderLoading(path: string): boolean {
        return loadingFolders.has(path);
    }

    function getFileIcon(item: FileItem): string {
        if (item.type === "directory") {
            return "📁";
        }

        // Determine icon based on file extension
        const ext = item.name.split(".").pop()?.toLowerCase();
        switch (ext) {
            case "js":
            case "ts":
            case "svelte":
                return "📄";
            case "png":
            case "jpg":
            case "jpeg":
            case "gif":
            case "svg":
                return "🖼️";
            case "mp3":
            case "wav":
            case "ogg":
                return "🔊";
            case "glb":
            case "gltf":
            case "obj":
            case "fbx":
                return "🎨";
            case "json":
                return "📋";
            case "html":
            case "css":
                return "🌐";
            default:
                return "📄";
        }
    }

    // Hierarchy functions
    function selectHierarchyItem(itemName: string) {
        selectedHierarchyItem = itemName;
        console.log(`Selected: ${itemName}`);
    }

    function toggleExpand(itemName: string, event: Event) {
        event.stopPropagation();
        if (expandedItems.has(itemName)) {
            expandedItems.delete(itemName);
        } else {
            expandedItems.add(itemName);
        }
        expandedItems = expandedItems; // Trigger reactivity
    }

    function isExpanded(itemName: string): boolean {
        return expandedItems.has(itemName);
    }

    // Viewport functions
    function selectViewportTab(tab: string) {
        selectedViewportTab = tab;
        console.log(`Viewport: ${tab}`);
    }

    function selectViewportTool(tool: string) {
        selectedViewportTool = tool;
        console.log(`Tool: ${tool}`);
    }

    // Bottom panel functions
    function selectBottomTab(tab: string) {
        selectedBottomTab = tab;
    }

    // Inspector functions
    function toggleInspectorSection(sectionName: string) {
        if (collapsedSections.has(sectionName)) {
            collapsedSections.delete(sectionName);
        } else {
            collapsedSections.add(sectionName);
        }
        collapsedSections = collapsedSections; // Trigger reactivity
    }

    function isSectionCollapsed(sectionName: string): boolean {
        return collapsedSections.has(sectionName);
    }

    // Asset functions
    async function handleAssetClick(item: FileItem) {
        if (item.type === "file") {
            selectedAssetPath = item.path;
            console.log(`Selected file: ${item.path}`);
            // TODO: Implement file preview/loading
        }
    }

    async function handleExplorerAssetClick(item: FileItem) {
        if (item.type === "directory") {
            await navigateToDirectory(item);
        } else if (item.type === "file") {
            selectedAssetPath = item.path;
            console.log(`Selected file: ${item.path}`);
            // TODO: Implement file preview/loading
        }
    }

    async function handleTreeItemClickInExplorerMode(
        item: FileItem,
        event: Event,
    ) {
        event.stopPropagation();
        if (item.type === "directory") {
            // Auto-expand the folder in tree view
            if (!isAssetFolderExpanded(item.path)) {
                await toggleAssetFolder(item, event);
            }
            // Navigate to this directory in explorer view
            await navigateToDirectoryByPath(item.path);
        }
    }

    async function handleAssetDoubleClick(item: FileItem) {
        console.log("Double-clicked:", item.name, "type:", item.type);
        if (assetViewMode === "tree") {
            if (item.type === "directory") {
                await toggleAssetFolder(item);
            } else if (item.type === "file") {
                console.log(`Opening file: ${item.path}`);
                // TODO: Implement file opening/editing
            }
        } else if (assetViewMode === "explorer") {
            if (item.type === "directory") {
                await navigateToDirectory(item);
            } else if (item.type === "file") {
                console.log(`Opening file: ${item.path}`);
                // TODO: Implement file opening/editing
            }
        }
    }

    // Explorer mode navigation
    async function navigateToDirectory(item: FileItem) {
        console.log("Navigating to:", item.name);

        // Load children if not loaded
        if (
            item.children === undefined &&
            item.handle &&
            item.type === "directory"
        ) {
            loadingFolders.add(item.path);
            loadingFolders = new Set(loadingFolders);

            item.children = await loadDirectory(
                item.handle as FileSystemDirectoryHandle,
                item.path,
            );

            loadingFolders.delete(item.path);
            loadingFolders = new Set(loadingFolders);
        }

        currentExplorerPath = [...currentExplorerPath, item.name];
        currentExplorerItems = item.children || [];
    }

    async function navigateToDirectoryByPath(path: string) {
        console.log("Navigating to path:", path);

        // Split the path (e.g., "resources/shaders" -> ["resources", "shaders"])
        const parts = path.split("/");
        let items = assetItems;

        // Navigate through the path and auto-expand parent folders
        for (let i = 0; i < parts.length; i++) {
            const folderName = parts[i];
            const folder = items.find((item) => item.name === folderName);

            if (folder && folder.type === "directory") {
                // Auto-expand parent folders in the tree
                if (!isAssetFolderExpanded(folder.path)) {
                    expandedAssetFolders.add(folder.path);
                    expandedAssetFolders = new Set(expandedAssetFolders);
                }

                // Load children if needed
                if (folder.children === undefined && folder.handle) {
                    loadingFolders.add(folder.path);
                    loadingFolders = new Set(loadingFolders);

                    folder.children = await loadDirectory(
                        folder.handle as FileSystemDirectoryHandle,
                        folder.path,
                    );

                    loadingFolders.delete(folder.path);
                    loadingFolders = new Set(loadingFolders);
                }

                items = folder.children || [];
            }
        }

        currentExplorerPath = parts;
        currentExplorerItems = items;
    }

    function navigateToRoot() {
        currentExplorerPath = [];
        currentExplorerItems = assetItems;
    }

    function navigateToBreadcrumb(index: number) {
        if (index === -1) {
            navigateToRoot();
            return;
        }

        // Navigate to the clicked breadcrumb level
        const targetPath = currentExplorerPath.slice(0, index + 1);
        let items = assetItems;

        for (let i = 0; i < targetPath.length; i++) {
            const folderName = targetPath[i];
            const folder = items.find((item) => item.name === folderName);
            if (folder && folder.children) {
                items = folder.children;
            }
        }

        currentExplorerPath = targetPath;
        currentExplorerItems = items;
    }

    function toggleAssetViewMode() {
        assetViewMode = assetViewMode === "tree" ? "explorer" : "tree";
        if (assetViewMode === "explorer") {
            navigateToRoot();
        }
    }

    // Transform functions
    function handleTransformChange(
        property: string,
        axis: string,
        value: number,
    ) {
        console.log(`Transform ${property}.${axis} changed to ${value}`);
        // TODO: Update selected object transform
    }
</script>

<main>
    <!-- Toolbar -->
    <div class="toolbar">
        <div class="toolbar-logo">OPULENCE</div>
        <div class="toolbar-menu">
            {#each toolbarItems as item}
                <div
                    class="toolbar-menu-item"
                    onclick={() => handleMenuClick(item)}
                >
                    {item}
                </div>
            {/each}
        </div>
        <div class="toolbar-buttons">
            <button
                class="toolbar-button"
                class:active={isPlaying && !isPaused}
                onclick={handlePlay}
            >
                ▶ Play
            </button>
            <button
                class="toolbar-button"
                class:active={isPaused}
                onclick={handlePause}
                disabled={!isPlaying}
            >
                ⏸ Pause
            </button>
            <button
                class="toolbar-button"
                onclick={handleStop}
                disabled={!isPlaying}
            >
                ⏹ Stop
            </button>
            <button class="toolbar-button primary" onclick={handleBuild}>
                Build
            </button>
        </div>
    </div>

    <!-- Main Container -->
    <div class="main-container">
        <!-- Left Panel - Hierarchy -->
        <div class="left-panel">
            <div class="panel-header">Scene Hierarchy</div>
            <div class="panel-content">
                <div
                    class="hierarchy-item"
                    class:selected={selectedHierarchyItem === "Main Scene"}
                    onclick={() => selectHierarchyItem("Main Scene")}
                >
                    <span
                        class="expand"
                        onclick={(e) => toggleExpand("Main Scene", e)}
                    >
                        {isExpanded("Main Scene") ? "▼" : "▶"}
                    </span>
                    <span class="icon">▣</span>
                    <span>Main Scene</span>
                </div>

                {#if isExpanded("Main Scene")}
                    <div
                        class="hierarchy-item nested"
                        class:selected={selectedHierarchyItem ===
                            "Directional Light"}
                        onclick={() => selectHierarchyItem("Directional Light")}
                    >
                        <span class="expand">▶</span>
                        <span class="icon">◐</span>
                        <span>Directional Light</span>
                    </div>
                    <div
                        class="hierarchy-item nested"
                        class:selected={selectedHierarchyItem === "Main Camera"}
                        onclick={() => selectHierarchyItem("Main Camera")}
                    >
                        <span class="expand">▶</span>
                        <span class="icon">◉</span>
                        <span>Main Camera</span>
                    </div>
                    <div
                        class="hierarchy-item nested"
                        class:selected={selectedHierarchyItem === "Player"}
                        onclick={() => selectHierarchyItem("Player")}
                    >
                        <span
                            class="expand"
                            onclick={(e) => toggleExpand("Player", e)}
                        >
                            {isExpanded("Player") ? "▼" : "▶"}
                        </span>
                        <span class="icon">▢</span>
                        <span>Player</span>
                    </div>

                    {#if isExpanded("Player")}
                        <div
                            class="hierarchy-item nested"
                            style="margin-left: 32px"
                            class:selected={selectedHierarchyItem ===
                                "Mesh Renderer"}
                            onclick={() => selectHierarchyItem("Mesh Renderer")}
                        >
                            <span class="expand"></span>
                            <span class="icon">▢</span>
                            <span>Mesh Renderer</span>
                        </div>
                        <div
                            class="hierarchy-item nested"
                            style="margin-left: 32px"
                            class:selected={selectedHierarchyItem ===
                                "Character Controller"}
                            onclick={() =>
                                selectHierarchyItem("Character Controller")}
                        >
                            <span class="expand"></span>
                            <span class="icon">◈</span>
                            <span>Character Controller</span>
                        </div>
                    {/if}

                    <div
                        class="hierarchy-item nested"
                        class:selected={selectedHierarchyItem === "Terrain"}
                        onclick={() => selectHierarchyItem("Terrain")}
                    >
                        <span class="expand">▶</span>
                        <span class="icon">▢</span>
                        <span>Terrain</span>
                    </div>
                    <div
                        class="hierarchy-item nested"
                        class:selected={selectedHierarchyItem ===
                            "Audio Source"}
                        onclick={() => selectHierarchyItem("Audio Source")}
                    >
                        <span class="expand">▶</span>
                        <span class="icon">♪</span>
                        <span>Audio Source</span>
                    </div>
                {/if}
            </div>
        </div>

        <!-- Center Panel - Viewport and Bottom Panel -->
        <div style="flex: 1; display: flex; flex-direction: column">
            <div class="center-panel">
                <div class="viewport-tabs">
                    <button
                        class="viewport-tab"
                        class:active={selectedViewportTab === "Scene"}
                        onclick={() => selectViewportTab("Scene")}
                    >
                        Scene
                    </button>
                    <button
                        class="viewport-tab"
                        class:active={selectedViewportTab === "Game"}
                        onclick={() => selectViewportTab("Game")}
                    >
                        Game
                    </button>
                    <button
                        class="viewport-tab"
                        class:active={selectedViewportTab === "Prefab"}
                        onclick={() => selectViewportTab("Prefab")}
                    >
                        Prefab
                    </button>
                </div>
                <div class="viewport-content">
                    <div class="viewport-controls">
                        <button
                            class="viewport-control-btn"
                            class:active={selectedViewportTool === "move"}
                            title="Move"
                            onclick={() => selectViewportTool("move")}
                        >
                            ↔
                        </button>
                        <button
                            class="viewport-control-btn"
                            class:active={selectedViewportTool === "rotate"}
                            title="Rotate"
                            onclick={() => selectViewportTool("rotate")}
                        >
                            ↻
                        </button>
                        <button
                            class="viewport-control-btn"
                            class:active={selectedViewportTool === "scale"}
                            title="Scale"
                            onclick={() => selectViewportTool("scale")}
                        >
                            ⤢
                        </button>
                        <button
                            class="viewport-control-btn"
                            class:active={selectedViewportTool === "rect"}
                            title="Rect"
                            onclick={() => selectViewportTool("rect")}
                        >
                            ▭
                        </button>
                    </div>
                    <div class="viewport-canvas">
                        <canvas id="main" style="width: 100%; height: 100%">
                        </canvas>
                    </div>
                </div>
            </div>

            <!-- Bottom Panel - Assets and Console -->
            <div class="bottom-panel">
                <div class="bottom-tabs">
                    <button
                        class="bottom-tab"
                        class:active={selectedBottomTab === "assets"}
                        onclick={() => selectBottomTab("assets")}
                    >
                        Assets
                    </button>
                    <button
                        class="bottom-tab"
                        class:active={selectedBottomTab === "console"}
                        onclick={() => selectBottomTab("console")}
                    >
                        Console
                    </button>
                </div>
                <div class="bottom-content">
                    <div
                        id="assets-content"
                        class:hidden={selectedBottomTab !== "assets"}
                        style="display: flex; flex-direction: column; height: 100%;"
                    >
                        {#if assetItems.length === 0}
                            <div
                                style="padding: 20px; text-align: center; color: var(--text-secondary);"
                            >
                                <div
                                    style="margin-bottom: 12px; font-size: 32px;"
                                >
                                    📂
                                </div>
                                <div style="margin-bottom: 8px;">
                                    No project directory loaded
                                </div>
                                <button
                                    class="toolbar-button primary"
                                    onclick={openProjectDirectory}
                                    style="margin-top: 8px;"
                                >
                                    Open Project Directory
                                </button>
                            </div>
                        {:else}
                            <!-- Asset View Controls -->
                            <div
                                style="display: flex; align-items: center; justify-content: space-between; padding: 4px 6px; border-bottom: 1px solid var(--border-color); background: var(--bg-tertiary);"
                            >
                                {#if assetViewMode === "explorer"}
                                    <div class="breadcrumb-nav">
                                        <span
                                            class="breadcrumb-item"
                                            onclick={() =>
                                                navigateToBreadcrumb(-1)}
                                        >
                                            📁 Root
                                        </span>
                                        {#each currentExplorerPath as crumb, index}
                                            <span class="breadcrumb-separator"
                                                >›</span
                                            >
                                            <span
                                                class="breadcrumb-item"
                                                onclick={() =>
                                                    navigateToBreadcrumb(index)}
                                            >
                                                {crumb}
                                            </span>
                                        {/each}
                                    </div>
                                {:else}
                                    <div
                                        style="font-size: 10px; color: var(--text-secondary);"
                                    >
                                        Tree View
                                    </div>
                                {/if}
                                <button
                                    class="view-mode-toggle"
                                    onclick={toggleAssetViewMode}
                                    title={assetViewMode === "tree"
                                        ? "Switch to Explorer"
                                        : "Switch to Tree"}
                                >
                                    {assetViewMode === "tree" ? "⊞" : "⊟"}
                                </button>
                            </div>

                            <!-- Asset Content Area -->
                            <div
                                style="flex: 1; overflow-y: auto; display: flex;"
                            >
                                {#if assetViewMode === "tree"}
                                    <div
                                        class="assets-tree"
                                        style="padding: 6px; width: 100%;"
                                    >
                                        {#each assetItems as item (item.path)}
                                            {@render AssetTreeItem(item, 0)}
                                        {/each}
                                    </div>
                                {:else}
                                    <!-- Explorer mode with sidebar -->
                                    <div class="explorer-sidebar">
                                        <div class="assets-tree">
                                            {#each assetItems as item (item.path)}
                                                {@render ExplorerTreeItem(
                                                    item,
                                                    0,
                                                )}
                                            {/each}
                                        </div>
                                    </div>
                                    <div class="explorer-content">
                                        {#if currentExplorerPath.length > 0}
                                            <div
                                                class="explorer-back-button"
                                                onclick={() =>
                                                    navigateToBreadcrumb(
                                                        currentExplorerPath.length -
                                                            2,
                                                    )}
                                            >
                                                <div class="back-icon">←</div>
                                                <div class="back-text">
                                                    Back to {currentExplorerPath.length >
                                                    1
                                                        ? currentExplorerPath[
                                                              currentExplorerPath.length -
                                                                  2
                                                          ]
                                                        : "Root"}
                                                </div>
                                            </div>
                                        {/if}
                                        {#if currentExplorerItems.length === 0}
                                            <div
                                                style="padding: 20px; text-align: center; color: var(--text-secondary);"
                                            >
                                                <div
                                                    style="margin-bottom: 8px;"
                                                >
                                                    Empty directory
                                                </div>
                                            </div>
                                        {:else}
                                            <div class="explorer-tiles">
                                                {#each currentExplorerItems as item (item.path)}
                                                    {@render ExplorerTile(item)}
                                                {/each}
                                            </div>
                                        {/if}
                                    </div>
                                {/if}
                            </div>
                        {/if}
                    </div>
                    <div
                        id="console-content"
                        class="console-content"
                        class:hidden={selectedBottomTab !== "console"}
                    >
                        {#each consoleMessages as message}
                            <div class="console-message {message.type}">
                                <span class="icon">
                                    {message.type === "log"
                                        ? "ℹ"
                                        : message.type === "warn"
                                          ? "⚠"
                                          : "✖"}
                                </span>
                                <span>{message.text}</span>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        </div>

        <!-- Right Panel - Inspector -->
        <div class="right-panel">
            <div class="panel-header">Inspector</div>
            <div class="panel-content" style="overflow-y: auto">
                <!-- Transform Component -->
                <div class="inspector-section">
                    <div
                        class="inspector-section-header"
                        onclick={() => toggleInspectorSection("Transform")}
                    >
                        <span
                            >{isSectionCollapsed("Transform") ? "▶" : "▼"}</span
                        >
                        <span>Transform</span>
                    </div>
                    {#if !isSectionCollapsed("Transform")}
                        <div class="inspector-section-content">
                            <div class="inspector-field">
                                <div class="inspector-field-group">
                                    <label>Position</label>
                                    <input
                                        type="number"
                                        value="0"
                                        placeholder="X"
                                        onchange={(e) =>
                                            handleTransformChange(
                                                "position",
                                                "x",
                                                parseFloat(
                                                    e.currentTarget.value,
                                                ),
                                            )}
                                    />
                                    <input
                                        type="number"
                                        value="0"
                                        placeholder="Y"
                                        onchange={(e) =>
                                            handleTransformChange(
                                                "position",
                                                "y",
                                                parseFloat(
                                                    e.currentTarget.value,
                                                ),
                                            )}
                                    />
                                    <input
                                        type="number"
                                        value="0"
                                        placeholder="Z"
                                        onchange={(e) =>
                                            handleTransformChange(
                                                "position",
                                                "z",
                                                parseFloat(
                                                    e.currentTarget.value,
                                                ),
                                            )}
                                    />
                                </div>
                            </div>
                            <div class="inspector-field">
                                <div class="inspector-field-group">
                                    <label>Rotation</label>
                                    <input
                                        type="number"
                                        value="0"
                                        placeholder="X"
                                        onchange={(e) =>
                                            handleTransformChange(
                                                "rotation",
                                                "x",
                                                parseFloat(
                                                    e.currentTarget.value,
                                                ),
                                            )}
                                    />
                                    <input
                                        type="number"
                                        value="0"
                                        placeholder="Y"
                                        onchange={(e) =>
                                            handleTransformChange(
                                                "rotation",
                                                "y",
                                                parseFloat(
                                                    e.currentTarget.value,
                                                ),
                                            )}
                                    />
                                    <input
                                        type="number"
                                        value="0"
                                        placeholder="Z"
                                        onchange={(e) =>
                                            handleTransformChange(
                                                "rotation",
                                                "z",
                                                parseFloat(
                                                    e.currentTarget.value,
                                                ),
                                            )}
                                    />
                                </div>
                            </div>
                            <div class="inspector-field">
                                <div class="inspector-field-group">
                                    <label>Scale</label>
                                    <input
                                        type="number"
                                        value="1"
                                        placeholder="X"
                                        onchange={(e) =>
                                            handleTransformChange(
                                                "scale",
                                                "x",
                                                parseFloat(
                                                    e.currentTarget.value,
                                                ),
                                            )}
                                    />
                                    <input
                                        type="number"
                                        value="1"
                                        placeholder="Y"
                                        onchange={(e) =>
                                            handleTransformChange(
                                                "scale",
                                                "y",
                                                parseFloat(
                                                    e.currentTarget.value,
                                                ),
                                            )}
                                    />
                                    <input
                                        type="number"
                                        value="1"
                                        placeholder="Z"
                                        onchange={(e) =>
                                            handleTransformChange(
                                                "scale",
                                                "z",
                                                parseFloat(
                                                    e.currentTarget.value,
                                                ),
                                            )}
                                    />
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>

                <!-- Mesh Renderer Component -->
                <div class="inspector-section">
                    <div
                        class="inspector-section-header"
                        onclick={() => toggleInspectorSection("MeshRenderer")}
                    >
                        <span
                            >{isSectionCollapsed("MeshRenderer")
                                ? "▶"
                                : "▼"}</span
                        >
                        <span>Mesh Renderer</span>
                    </div>
                    {#if !isSectionCollapsed("MeshRenderer")}
                        <div class="inspector-section-content">
                            <div class="inspector-field">
                                <label>Cast Shadows</label>
                                <select>
                                    <option>On</option>
                                    <option>Off</option>
                                    <option>Two Sided</option>
                                </select>
                            </div>
                            <div class="inspector-field">
                                <label>Receive Shadows</label>
                                <select>
                                    <option>Yes</option>
                                    <option>No</option>
                                </select>
                            </div>
                            <div class="inspector-field">
                                <label>Materials</label>
                                <input
                                    type="text"
                                    value="Default Material"
                                    readonly
                                />
                            </div>
                        </div>
                    {/if}
                </div>

                <!-- Physics Component -->
                <div class="inspector-section">
                    <div
                        class="inspector-section-header"
                        onclick={() => toggleInspectorSection("Rigidbody")}
                    >
                        <span
                            >{isSectionCollapsed("Rigidbody") ? "▶" : "▼"}</span
                        >
                        <span>Rigidbody</span>
                    </div>
                    {#if !isSectionCollapsed("Rigidbody")}
                        <div class="inspector-section-content">
                            <div class="inspector-field">
                                <label>Mass</label>
                                <input type="number" value="1" step="0.1" />
                            </div>
                            <div class="inspector-field">
                                <label>Drag</label>
                                <input type="number" value="0" step="0.1" />
                            </div>
                            <div class="inspector-field">
                                <label>Angular Drag</label>
                                <input type="number" value="0.05" step="0.01" />
                            </div>
                            <div class="inspector-field">
                                <label>Use Gravity</label>
                                <select>
                                    <option>Yes</option>
                                    <option>No</option>
                                </select>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>

    <!-- Status Bar -->
    <div class="statusbar">
        <div class="statusbar-item">
            <span>●</span>
            <span
                >{isPlaying ? (isPaused ? "Paused" : "Playing") : "Ready"}</span
            >
        </div>
        <div class="statusbar-separator"></div>
        <div class="statusbar-item">FPS: 60</div>
        <div class="statusbar-separator"></div>
        <div class="statusbar-item">Objects: 8</div>
        <div class="statusbar-separator"></div>
        <div class="statusbar-item">Vertices: 12,486</div>
        {#if projectDirectoryHandle}
            <div class="statusbar-separator"></div>
            <div class="statusbar-item">📁 {projectDirectoryHandle.name}</div>
        {/if}
    </div>
</main>

{#snippet AssetTreeItem(item: FileItem, depth: number)}
    <div style="margin-left: {depth * 16}px;">
        <div
            class="asset-tree-item"
            class:selected={selectedAssetPath === item.path}
            onclick={() => handleAssetClick(item)}
            ondblclick={() => handleAssetDoubleClick(item)}
        >
            {#if item.type === "directory"}
                <span
                    class="expand"
                    onclick={(e) => toggleAssetFolder(item, e)}
                >
                    {#if isFolderLoading(item.path)}
                        ⏳
                    {:else}
                        {isAssetFolderExpanded(item.path) ? "▼" : "▶"}
                    {/if}
                </span>
            {:else}
                <span class="expand"></span>
            {/if}
            <span class="icon">{getFileIcon(item)}</span>
            <span class="name">{item.name}</span>
        </div>

        {#if item.type === "directory" && isAssetFolderExpanded(item.path) && item.children}
            {#each item.children as child (child.path)}
                {@render AssetTreeItem(child, depth + 1)}
            {/each}
        {/if}
    </div>
{/snippet}

{#snippet ExplorerTile(item: FileItem)}
    <div
        class="explorer-tile"
        class:selected={selectedAssetPath === item.path}
        onclick={() => handleExplorerAssetClick(item)}
        ondblclick={() => handleAssetDoubleClick(item)}
    >
        <div class="tile-icon">{getFileIcon(item)}</div>
        <div class="tile-name">{item.name}</div>
    </div>
{/snippet}

{#snippet ExplorerTreeItem(item: FileItem, depth: number)}
    <div style="margin-left: {depth * 12}px;">
        <div
            class="asset-tree-item explorer-tree-item"
            class:selected={currentExplorerPath.join("/") === item.path}
            onclick={(e) => handleTreeItemClickInExplorerMode(item, e)}
        >
            {#if item.type === "directory"}
                <span
                    class="expand"
                    onclick={(e) => toggleAssetFolder(item, e)}
                >
                    {#if isFolderLoading(item.path)}
                        ⏳
                    {:else}
                        {isAssetFolderExpanded(item.path) ? "▼" : "▶"}
                    {/if}
                </span>
            {:else}
                <span class="expand"></span>
            {/if}
            <span class="icon">{getFileIcon(item)}</span>
            <span class="name">{item.name}</span>
        </div>

        {#if item.type === "directory" && isAssetFolderExpanded(item.path) && item.children}
            {#each item.children as child (child.path)}
                {@render ExplorerTreeItem(child, depth + 1)}
            {/each}
        {/if}
    </div>
{/snippet}
