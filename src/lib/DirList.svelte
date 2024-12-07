<script>
  import { formatFileSize, formatDate } from './utils';

  // 接收父组件传入的数据
  export let items = [];
  export let level = 0; // 用于控制缩进层级

  // 控制文件夹展开/折叠的状态
  let expandedFolders = new Set();

  // 切换文件夹展开状态
  function toggleFolder(folderId) {
    if (expandedFolders.has(folderId)) {
      expandedFolders.delete(folderId);
    } else {
      expandedFolders.add(folderId);
    }
    expandedFolders = expandedFolders; // 触发更新
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
    <div class="list-item" style="padding-left: {level * 20}px">
      <div class="col name">
        {#if item.type === 'folder'}
          <button class="expand-btn" on:click={() => toggleFolder(item.id)}>
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
      <svelte:self items={item.children} level={level + 1} />
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
</style>
