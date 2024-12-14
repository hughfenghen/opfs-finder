<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity';
  import { formatFileSize, formatDate } from './utils';
  import DirList from './DirList.svelte';
  import type { FileItem, FolderItem } from './types';

  type Props = {
    items: (FileItem | FolderItem)[];
    level: number;
    onMoveItem: (event: { sourceId: string; targetId: string }) => void;
    onFolderExpand: (path: string) => void;
  };

  let { items, level, onMoveItem, onFolderExpand }: Props = $props();

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
      style:padding-left="{level * 20}px"
      draggable={true}
      class:drag-over={dragOverId === item.id}
      ondragstart={(e) => handleDragStart(e, item)}
      ondragover={(e) => handleDragOver(e, item)}
      ondragleave={handleDragLeave}
      ondrop={(e) => handleDrop(e, item as FolderItem)}
      role="button"
      tabindex="0"
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
        <span class="item-name">{item.name}</span>
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
        {onFolderExpand}
        {onMoveItem}
      />
    {/if}
  {/each}
</div>

<style>
  .dir-list {
    width: 100%;
    font-size: 14px;
  }

  .list-header {
    display: flex;
    padding: 8px 0;
    border-bottom: 1px solid #e0e0e0;
    background-color: #f5f5f5;
    position: sticky;
    top: 0;
  }

  .list-item {
    display: flex;
    padding: 6px 0;
    border-bottom: 1px solid #f0f0f0;
    cursor: move;
  }

  .list-item:hover {
    background-color: #f5f5f5;
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
  }

  .date {
    width: 160px;
  }

  .icon {
    margin-right: 8px;
  }

  .expand-btn {
    background: none;
    border: none;
    padding: 0 4px;
    cursor: pointer;
    font-size: 10px;
    color: #666;
  }

  .item-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .drag-over {
    background-color: #e3f2fd;
    border: 2px dashed #2196f3;
  }
</style>
