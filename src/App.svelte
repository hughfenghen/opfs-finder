<script lang="ts">
  import Layout from './lib/Layout.svelte';
  import DirList from './lib/DirList.svelte';
  import type { FileItem, FolderItem, MenuItem } from './lib/types';
  import { dir, file, write } from 'opfs-tools';
  import ContextMenu from './lib/ContextMenu.svelte';

  let { path }: { path: string } = $props();
  let items = $state<(FileItem | FolderItem)[]>([]);

  // 选中的文件ID集合
  let selectedIds = $state<Set<string>>(new Set());
  // 记录最后一个选中的文件ID
  let lastSelectedId = $state<string | null>(null);

  // 处理选择事件
  function handleSelect(event: {
    id: string;
    isCtrlKey: boolean;
    isShiftKey: boolean;
  }) {
    const { id, isCtrlKey, isShiftKey } = event;

    if (isShiftKey && lastSelectedId) {
      // Shift 多选：选中两个文件之间的所有文件
      const allItems = getAllItems(items);
      const startIdx = allItems.findIndex((item) => item.id === lastSelectedId);
      const endIdx = allItems.findIndex((item) => item.id === id);
      const [start, end] =
        startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];

      const newSelection = new Set(selectedIds);
      for (let i = start; i <= end; i++) {
        newSelection.add(allItems[i].id);
      }
      selectedIds = newSelection;
    } else if (isCtrlKey) {
      // Ctrl/Cmd 多选：切换选中状态
      const newSelection = new Set(selectedIds);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      selectedIds = newSelection;
      lastSelectedId = id;
    } else {
      // 普通点击：单选
      selectedIds = new Set([id]);
      lastSelectedId = id;
    }
  }

  // 递归获取所有文件项
  function getAllItems(
    items: (FileItem | FolderItem)[]
  ): (FileItem | FolderItem)[] {
    let result: (FileItem | FolderItem)[] = [];
    for (const item of items) {
      result.push(item);
      if (item.type === 'folder' && item.children) {
        result = result.concat(getAllItems(item.children));
      }
    }
    return result;
  }

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

  // 从树中删除指定 id 的 item
  function removeItemByIds(ids: string[]) {
    // 递归删除匹配的元素
    function removeMatched(
      items: (FileItem | FolderItem)[]
    ): (FileItem | FolderItem)[] {
      return items.filter((item) => {
        // 如果当前 item 的 id 在待删除列表中,则过滤掉
        if (ids.includes(item.id)) {
          return false;
        }
        // 如果是文件夹,递归处理其子项
        if (item.type === 'folder' && item.children) {
          item.children = removeMatched(item.children);
        }
        return true;
      });
    }

    return removeMatched(items);
  }

  async function handleMoveItem(eventDetail: {
    sourceId: string;
    targetId: string;
  }) {
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

    const sourceItem = findItem(items, sourceId);
    const targetItem = findItem(items, targetId) as FolderItem;

    if (sourceItem && targetItem && targetItem.type === 'folder') {
      await (sourceItem.type === 'file' ? file : dir)(sourceItem.id).moveTo(
        dir(targetItem.id)
      );
      items = removeItemByIds([sourceId]);
      targetItem.children = [...(targetItem.children || []), sourceItem];
      items = [...items];
    }
  }

  // 处理文件夹展开事件
  function handleFolderExpand(path: string) {
    loadDirectory(path);
  }

  // 删除选中文件和文件夹
  async function deleteSelectedItems() {
    const allItems = getAllItems(items);
    const itemsToDelete = allItems.filter((item) => selectedIds.has(item.id));

    for (const item of itemsToDelete) {
      try {
        await (item.type === 'file' ? file : dir)(item.id).remove();
      } catch (error) {
        console.error('Failed to delete item:', item.id, error);
      }
    }

    items = removeItemByIds(Array.from(selectedIds));

    // 清空选中状态
    selectedIds = new Set();
    lastSelectedId = null;
  }

  // 添加键盘事件监听
  function handleKeyDown(event: KeyboardEvent) {
    // 检查是否按下 cmd/ctrl + Backspace
    if ((event.metaKey || event.ctrlKey) && event.key === 'Backspace') {
      event.preventDefault();
      if (selectedIds.size > 0) {
        deleteSelectedItems();
      }
    }
  }

  let contextMenu = $state<{
    show: boolean;
    x: number;
    y: number;
    items: any[];
  }>({
    show: false,
    x: 0,
    y: 0,
    items: [],
  });

  // 处理空白区域右键
  function handleContextMenu(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      e.preventDefault();
      contextMenu = {
        show: true,
        x: e.clientX,
        y: e.clientY,
        items: [
          {
            name: '新建文件夹',
            onClick: async () => {
              const newDirPath = path + '/未命名文件夹';
              await dir(newDirPath).create();
              items.push({
                id: newDirPath,
                type: 'folder',
                name: '未命名文件夹',
                isEditing: true,
                modifiedAt: Date.now(),
                createdAt: Date.now(),
              });
            },
          },
          {
            name: '新建文本文件',
            onClick: async () => {
              const newFilePath = path + '/未命名文件.txt';
              await write(newFilePath, '');
              items.push({
                id: newFilePath,
                type: 'file',
                name: '未命名文件.txt',
                size: 0,
                isEditing: true,
                modifiedAt: Date.now(),
                createdAt: Date.now(),
              });
            },
          },
        ],
      };
    }
  }

  // 更新右键菜单处理
  function handleItemContextMenu(
    e: MouseEvent,
    hitItem: FileItem | FolderItem
  ) {
    e.preventDefault();

    const menuItems: MenuItem[] = [
      {
        icon: '🗑️',
        name: `删除${items.length > 1 ? `(${items.length}项)` : ''}`,
        onClick: () => deleteSelectedItems(),
      },
      {
        icon: '📋',
        name: `复制${items.length > 1 ? `(${items.length}项)` : ''}`,
        onClick: () => {
          /* 处理复制 */
        },
      },
      {
        icon: '🔄',
        name: '重命名',
        onClick: () => {
          hitItem.isEditing = true;
        },
      },
    ];

    if (hitItem.type === 'file') {
      menuItems.push({
        icon: '📂',
        name: '打开方式',
        children: [
          { name: '文本', onClick: () => {} },
          { name: '图片', onClick: () => {} },
          { name: '视频', onClick: () => {} },
          { name: '音频', onClick: () => {} },
        ],
      });
    }

    contextMenu = {
      show: true,
      x: e.clientX,
      y: e.clientY,
      items: menuItems,
    };
  }

  // 处理重命名完成
  async function handleRename(event: {
    item: FileItem | FolderItem;
    newName: string;
  }) {
    const { item, newName } = event;
    item.isEditing = false;

    if (item.type === 'file') {
      const curFile = file(item.id);
      const targetFile = file(curFile.parent!.path + '/' + newName);
      await curFile.moveTo(targetFile);
      item.id = targetFile.path;
    } else {
      const curDir = dir(item.id);
      const targetDir = dir(curDir.parent!.path + '/' + newName);
      await curDir.moveTo(targetDir);
      item.id = targetDir.path;
    }

    item.name = newName;
  }
</script>

<svelte:window
  onkeydown={handleKeyDown}
  onclick={() => (contextMenu.show = false)}
/>

<main use:initDrag>
  <Layout
    onClickEmpty={(evt: MouseEvent) => {
      if (evt.button === 2) {
        handleContextMenu(evt);
        return;
      }
      lastSelectedId = null;
      selectedIds = new Set();
    }}
  >
    <DirList
      {items}
      level={0}
      {selectedIds}
      onSelect={handleSelect}
      onMoveItem={handleMoveItem}
      onFolderExpand={handleFolderExpand}
      onContextMenu={handleItemContextMenu}
      onRename={handleRename}
    />
  </Layout>
</main>

{#if contextMenu.show}
  <ContextMenu items={contextMenu.items} x={contextMenu.x} y={contextMenu.y} />
{/if}

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
