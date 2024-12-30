<script lang="ts">
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
    onMoveItem: (event: {
      sourceId: string;
      targetId: string;
      sysFileEntry: FileSystemEntry | null;
    }) => void;
    onToggleFolder: (folder: FolderItem) => void;
    onContextMenu: (event: MouseEvent, item: FileItem | FolderItem) => void;
    onRename: (event: { item: FileItem | FolderItem; newName: string }) => void;
    onPathChange: (path: string) => void;
  };

  let {
    items,
    level,
    selectedIds,
    onSelect,
    onMoveItem,
    onToggleFolder,
    onContextMenu,
    onRename,
    onPathChange,
  }: Props = $props();

  let dragOverId = $state<string | null>(null);

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

  async function handleDrop(event: DragEvent, targetFolder: FolderItem) {
    event.preventDefault();
    dragOverId = null;
    const element = event.currentTarget as HTMLElement;
    element.classList.remove('drag-over');

    let sysFileEntry: FileSystemEntry | null = null;
    // 处理从操作系统拖拽的文件
    if (event.dataTransfer?.items) {
      const items = Array.from(event.dataTransfer.items);
      for (const item of items) {
        if (item.kind === 'file') {
          sysFileEntry = item.webkitGetAsEntry();
        }
      }
    }

    // 处理内部拖拽
    const draggedData = JSON.parse(
      event.dataTransfer?.getData('text/plain') || '{}'
    );

    const detail = {
      sourceId: draggedData.id,
      targetId: targetFolder.id,
      sysFileEntry,
    };
    onMoveItem(detail);
  }

  function handleClick(event: MouseEvent, item: FileItem | FolderItem) {
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
  let lastEditTime = 0;
  function handleEditComplete(item: FileItem | FolderItem, newName: string) {
    const now = performance.now();
    if (now - lastEditTime < 300) return;
    lastEditTime = now;

    if (newName.trim() && newName !== item.name) {
      onRename({
        item,
        newName: newName.trim(),
      });
    } else {
      item.isEditing = false;
    }
  }

  // 添加 focus action
  function focus(node: HTMLElement) {
    node.focus();
  }

  // 添加双击处理函数
  function handleDoubleClick(item: FileItem | FolderItem) {
    if (item.type === 'folder') {
      onPathChange(item.id);
    }
  }
</script>

{#if items.length > 0}
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
        ondblclick={() => handleDoubleClick(item)}
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
              onclick={() => onToggleFolder(item as FolderItem)}
            >
              {item.isExpanded ? '▼' : '▶'}
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
                  handleEditComplete(
                    item,
                    (e.target as HTMLInputElement).value
                  );
                } else if (e.key === 'Escape') {
                  onRename({ item, newName: item.name });
                }
              }}
              onblur={(e) => {
                handleEditComplete(item, (e.target as HTMLInputElement).value);
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
      {#if item.type === 'folder' && item.isExpanded && item.children}
        <DirList
          items={item.children}
          level={level + 1}
          {selectedIds}
          {onSelect}
          {onToggleFolder}
          {onMoveItem}
          {onContextMenu}
          {onRename}
          {onPathChange}
        />
      {/if}
    {/each}
  </div>
{/if}

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
    cursor: default;
  }

  .list-item:nth-child(odd) {
    background-color: #f4f5f5;
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
    background-color: #0364e1 !important;
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
