<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity';
  import { formatFileSize, formatDate } from './utils';
  import DirList from './DirList.svelte';
  import type { FileItem, FolderItem } from './types';

  type Props = {
    items: (FileItem | FolderItem)[];
    level: number;
    selectedIds: Set<string>;
    onSelect: (event: {
      id: string;
      isCtrlKey: boolean;
      isShiftKey: boolean;
    }) => void;
    onMoveItem: (event: { sourceId: string; targetId: string }) => void;
    onFolderExpand: (path: string) => void;
    onContextMenu: (event: MouseEvent, item: FileItem | FolderItem) => void;
    onRename: (event: { item: FileItem | FolderItem; newName: string }) => void;
  };

  let {
    items,
    level,
    selectedIds,
    onSelect,
    onMoveItem,
    onFolderExpand,
    onContextMenu,
    onRename,
  }: Props = $props();

  // 控制文件夹展开/折叠的状态
  let expandedFolders = new SvelteSet<string>();

  let dragOverId = $state<string | null>(null);

  // 切换文件夹展开状态
  function toggleFolder(folder: FolderItem) {
    if (!expandedFolders.has(folder.id)) {
      onFolderExpand(folder.id); // folder.id 就是文件夹路径
    }
    if (expandedFolders.has(folder.id)) {
      expandedFolders.delete(folder.id);
    } else {
      expandedFolders.add(folder.id);
    }
  }

  function handleDragStart(event: DragEvent, item: FileItem | FolderItem) {
    event.dataTransfer?.setData(
      'text/plain',
      JSON.stringify({
        id: item.id,
        type: item.type,
        name: item.name,
      })
    );
  }

  function handleDragOver(event: DragEvent, item: FileItem | FolderItem) {
    if (item.type === 'folder') {
      event.preventDefault();
      dragOverId = item.id;
    }
  }

  function handleDragLeave() {
    dragOverId = null;
  }

  function handleDrop(event: DragEvent, targetFolder: FolderItem) {
    event.preventDefault();
    dragOverId = null;
    const element = event.currentTarget as HTMLElement;
    element.classList.remove('drag-over');

    const draggedData = JSON.parse(
      event.dataTransfer?.getData('text/plain') || '{}'
    );

    const detail = {
      sourceId: draggedData.id,
      targetId: targetFolder.id,
    };
    onMoveItem(detail);

    const moveEvent = new CustomEvent('moveItem', {
      detail,
      bubbles: true,
      composed: true,
    });
    element.dispatchEvent(moveEvent);
  }

  function handleClick(event: MouseEvent, item: FileItem | FolderItem) {
    // 阻止事件冒泡，避免嵌套选择问题
    event.stopPropagation();

    onSelect({
      id: item.id,
      isCtrlKey: event.metaKey || event.ctrlKey, // metaKey for Mac, ctrlKey for Windows
      isShiftKey: event.shiftKey,
    });
  }

  // 处理右键点击
  function handleContextMenu(event: MouseEvent, item: FileItem | FolderItem) {
    event.preventDefault();
    event.stopPropagation();

    // 调用父组件的 onContextMenu 处理函数
    onContextMenu(event, item);
  }

  // 处理编辑完成
  function handleEditComplete(item: FileItem | FolderItem, newName: string) {
    if (newName.trim() && newName !== item.name) {
      onRename({
        item,
        newName: newName.trim(),
      });
    }
  }

  // 添加 focus action
  function focus(node: HTMLElement) {
    node.focus();
  }
</script>

<div class="dir-list">
  {#if level === 0}
    <!-- 表头 -->
    <div class="list-header">
      <div class="col name">名称</div>
      <div class="col size">大小</div>
      <div class="col date">修改日期</div>
      <div class="col date">创建日期</div>
    </div>
  {/if}

  <!-- 文件列表 -->
  {#each items as item}
    <div
      class="list-item"
      class:selected={selectedIds.has(item.id)}
      style:padding-left="{level * 20}px"
      draggable={true}
      class:drag-over={dragOverId === item.id}
      onclick={(e) => handleClick(e, item)}
      oncontextmenu={(e) => handleContextMenu(e, item)}
      ondragstart={(e) => handleDragStart(e, item)}
      ondragover={(e) => handleDragOver(e, item)}
      ondragleave={handleDragLeave}
      ondrop={(e) => handleDrop(e, item as FolderItem)}
      aria-hidden="true"
    >
      <div class="col name">
        {#if item.type === 'folder'}
          <button
            class="expand-btn"
            onclick={() => toggleFolder(item as FolderItem)}
          >
            {expandedFolders.has(item.id) ? '▼' : '▶'}
          </button>
          <span class="icon">📁</span>
        {:else}
          <span class="icon">📄</span>
        {/if}

        {#if item.isEditing}
          <input
            type="text"
            class="edit-input"
            value={item.name}
            onkeydown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleEditComplete(item, (e.target as HTMLInputElement).value);
              } else if (e.key === 'Escape') {
                onRename({ item, newName: item.name });
              }
            }}
            use:focus
          />
        {:else}
          <span class="item-name">
            {item.name}
          </span>
        {/if}
      </div>
      <div class="col size">
        {item.type === 'folder' ? '--' : formatFileSize(item.size)}
      </div>
      <div class="col date">{formatDate(item.modifiedAt)}</div>
      <div class="col date">{formatDate(item.createdAt)}</div>
    </div>

    <!-- 递归显示子文件夹内容 -->
    {#if item.type === 'folder' && expandedFolders.has(item.id) && item.children}
      <DirList
        items={item.children}
        level={level + 1}
        {selectedIds}
        {onSelect}
        {onFolderExpand}
        {onMoveItem}
        {onContextMenu}
        {onRename}
      />
    {/if}
  {/each}
</div>

<style>
  .dir-list {
    width: 100%;
    font-size: 14px;
    user-select: none;
  }

  .list-header {
    display: flex;
    padding: 6px 0;
    border-bottom: 1px solid #e0e0e0;
    background-color: #fff;
    position: sticky;
    top: 0;
    z-index: 1;
    color: #666;
    font-size: 12px;
  }

  .list-item {
    display: flex;
    padding: 4px 0;
    border-bottom: 1px solid #f0f0f0;
    cursor: default;
  }

  .list-item:active {
    background-color: #e8e8e8;
  }

  .col {
    padding: 0 8px;
    display: flex;
    align-items: center;
  }

  .name {
    flex: 1;
    min-width: 200px;
  }

  .size {
    width: 100px;
    opacity: 0.6;
  }

  .date {
    width: 160px;
    opacity: 0.6;
  }

  .expand-btn {
    background: none;
    border: none;
    padding: 0 4px;
    cursor: pointer;
    font-size: 8px;
    color: #999;
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .icon {
    margin-right: 6px;
  }

  .drag-over {
    background-color: rgba(0, 122, 255, 0.1);
    border: 1px dashed #007aff;
  }

  /* 选中状态 */
  .list-item.selected {
    color: #fff;
    background-color: #0364e1;
  }

  /* 文件夹展开/折叠图标 */
  .expand-btn {
    color: #999;
    transition: transform 0.15s ease;
  }

  .edit-input {
    flex: 1;
    min-width: 100px;
    height: 20px;
    border: 1px solid #007aff;
    border-radius: 2px;
    padding: 0 4px;
    font-size: inherit;
    outline: none;
  }

  .item-name {
    flex: 1;
    padding: 2px 4px;
    border-radius: 2px;
  }
</style>
