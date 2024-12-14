<script lang="ts">
  import Layout from './lib/Layout.svelte';
  import DirList from './lib/DirList.svelte';
  import type { FileItem, FolderItem } from './lib/types';
  import { dir } from 'opfs-tools';

  let { path }: { path: string } = $props();
  let items = $state<(FileItem | FolderItem)[]>([]);

  // 拖拽相关状态
  let isDragging = false;
  let startX = 0;
  let startY = 0;

  // 初始化拖拽功能
  function initDrag(node: HTMLElement) {
    function handleMouseDown(e: MouseEvent) {
      if ((e.target as HTMLElement).closest('.toolbar')) {
        isDragging = true;
        // 获取当前实际位置
        const rect = node.getBoundingClientRect();
        startX = e.clientX - rect.left;
        startY = e.clientY - rect.top;
        // 移除居中定位
        node.style.left = rect.left + 'px';
        node.style.top = rect.top + 'px';
        node.style.transform = 'none';
      }
    }

    function handleMouseMove(e: MouseEvent) {
      if (isDragging) {
        node.style.left = `${e.clientX - startX}px`;
        node.style.top = `${e.clientY - startY}px`;
      }
    }

    function handleMouseUp() {
      isDragging = false;
    }

    node.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return {
      destroy() {
        node.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      },
    };
  }

  // 初始加载根目录
  $effect(() => {
    loadDirectory(path);
  });

  async function loadDirectory(dirPath: string) {
    try {
      const entries = await dir(dirPath).children();
      const dirItems = entries.map(
        async (entry): Promise<FileItem | FolderItem> => {
          const baseItem = {
            id: entry.path,
            name: entry.name,
            modifiedAt: Date.now(),
            createdAt: Date.now(),
          };

          if (entry.kind === 'dir') {
            return {
              ...baseItem,
              type: 'folder',
              children: [], // 初始为空，展开时加载
            };
          } else {
            return {
              ...baseItem,
              type: 'file',
              size: await entry.getSize(),
            };
          }
        }
      );

      if (dirPath === path) {
        items = await Promise.all(dirItems);
      } else {
        // 更新子文件夹的内容
        updateFolderChildren(dirPath, await Promise.all(dirItems));
      }
    } catch (error) {
      console.error('Failed to load directory:', error);
    }
  }

  function updateFolderChildren(
    folderPath: string,
    children: (FileItem | FolderItem)[]
  ) {
    function updateFolder(items: (FileItem | FolderItem)[]): boolean {
      for (const item of items) {
        if (item.id === folderPath && item.type === 'folder') {
          item.children = children;
          return true;
        }
        if (item.type === 'folder' && item.children) {
          if (updateFolder(item.children)) return true;
        }
      }
      return false;
    }
    updateFolder(items);
    items = [...items]; // 触发更新
  }

  function handleMoveItem(eventDetail: { sourceId: string; targetId: string }) {
    const { sourceId, targetId } = eventDetail;
    // 深度查找 item
    function findItem(
      items: (FileItem | FolderItem)[],
      id: string
    ): FileItem | FolderItem | undefined {
      for (const item of items) {
        if (item.id === id) return item;
        if (item.type === 'folder' && item.children) {
          const found = findItem(item.children, id);
          if (found) return found;
        }
      }
      return undefined;
    }

    // 从树中删除指定 id 的 item
    function removeItem(items: (FileItem | FolderItem)[], id: string): boolean {
      const index = items.findIndex((item) => item.id === id);
      if (index > -1) {
        items.splice(index, 1);
        return true;
      }

      for (const item of items) {
        if (item.type === 'folder' && item.children) {
          if (removeItem(item.children, id)) return true;
        }
      }
      return false;
    }

    const sourceItem = findItem(items, sourceId);
    const targetItem = findItem(items, targetId) as FolderItem;

    if (sourceItem && targetItem && targetItem.type === 'folder') {
      targetItem.children = [...(targetItem.children || []), sourceItem];
      removeItem(items, sourceId);
      items = [...items]; // 触发更新
    }
  }

  // 处理文件夹展开事件
  function handleFolderExpand(path: string) {
    loadDirectory(path);
  }
</script>

<main use:initDrag>
  <Layout>
    <DirList
      {items}
      level={0}
      onMoveItem={handleMoveItem}
      onFolderExpand={handleFolderExpand}
    />
  </Layout>
</main>

<style>
  main {
    position: absolute;
    padding: 20px;
    width: 900px;
    height: 500px;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    resize: both;
    overflow: hidden;
  }
</style>
