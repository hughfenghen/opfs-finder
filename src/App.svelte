<script lang="ts">
  import Layout from './lib/Layout.svelte';
  import DirList from './lib/DirList.svelte';
  import type { FileItem, FolderItem, MenuItem } from './lib/types';
  import { dir, file, write } from 'opfs-tools';
  import ContextMenu from './lib/ContextMenu.svelte';
  import { joinPath } from './lib/utils';
  import { getDirMeta, updateDirMeta } from './lib/dir-meta-manager';

  let { path, onWindClose }: { path: string; onWindClose: () => void } =
    $props();
  let items = $state<(FileItem | FolderItem)[]>([]);

  // 选中的文件ID集合
  let selectedIds = $state<Set<string>>(new Set());
  // 记录最后一个选中的文件ID
  let lastSelectedId = $state<string | null>(null);

  let pathHistory = $state<string[]>([path]); // 路径历史记录
  let currentHistoryIndex = $state<number>(0); // 当前历史记录索引

  // 处理选择事件
  function handleSelect(event: {
    id: string;
    isCtrlKey: boolean;
    isShiftKey: boolean;
  }) {
    const { id, isCtrlKey, isShiftKey } = event;

    if (isShiftKey && lastSelectedId) {
      // Shift 多选：选中两个文件之间的所有文件
      const allItems = getAllItems(items, true);
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
    items: (FileItem | FolderItem)[],
    ignoreCollapsedChildren: boolean = false
  ): (FileItem | FolderItem)[] {
    let result: (FileItem | FolderItem)[] = [];
    for (const item of items) {
      result.push(item);
      if (
        item.type === 'folder' &&
        !ignoreCollapsedChildren &&
        item.children.length > 0
      ) {
        result = result.concat(
          getAllItems(item.children, ignoreCollapsedChildren)
        );
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
      if (
        (e.target as HTMLElement).closest('.toolbar') ||
        (e.target as HTMLElement).closest('.window-controls')
      ) {
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
      const entries = (await dir(dirPath).children()).filter(
        (e) => e.name !== '.opfs-finder-meta'
      );
      const { entries: metaEntries } = await getDirMeta(dirPath);

      const dirItems = entries.map(
        async (entry): Promise<FileItem | FolderItem> => {
          const baseItem = {
            id: entry.path,
            name: entry.name,
            modifiedAt:
              metaEntries.find((e) => e.name === entry.name)?.modifiedAt ??
              Date.now(),
            createdAt:
              metaEntries.find((e) => e.name === entry.name)?.createdAt ??
              Date.now(),
          };

          if (entry.kind === 'dir') {
            return {
              ...baseItem,
              type: 'folder',
              isExpanded: false,
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
  function filterItemsByIds(ids: string[]) {
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

  // 深度查找 item
  function findItemById(
    items: (FileItem | FolderItem)[],
    id: string
  ): FileItem | FolderItem | undefined {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.type === 'folder' && item.children) {
        const found = findItemById(item.children, id);
        if (found) return found;
      }
    }
    return undefined;
  }

  // 处理文件系统条目
  async function handleFileSystemEntry(
    entry: FileSystemEntry,
    targetPath: string
  ) {
    return new Promise<void>(async (resolve) => {
      if (entry.isFile) {
        const fileEntry = entry as FileSystemFileEntry;
        fileEntry.file(async (f) => {
          // 创建文件
          const newPath = joinPath(targetPath, f.name);
          await write(file(newPath), f.stream());
          resolve();
        });
      } else if (entry.isDirectory) {
        const dirEntry = entry as FileSystemDirectoryEntry;
        const newPath = joinPath(targetPath, entry.name);

        // 创建目录
        await dir(newPath).create();

        // 递归处理子目录
        const reader = dirEntry.createReader();
        reader.readEntries(async (entries) => {
          for (const entry of entries) {
            await handleFileSystemEntry(entry, newPath);
          }
        });
        resolve();
      }
    });
  }

  async function handleMoveItem(eventDetail: {
    sourceId: string;
    targetId: string;
    sysFileEntry: FileSystemEntry | null;
  }) {
    const { sourceId, targetId, sysFileEntry } = eventDetail;

    const sourceItem = findItemById(items, sourceId);
    const targetItem = findItemById(items, targetId) as FolderItem;

    if (sysFileEntry) {
      await handleFileSystemEntry(sysFileEntry, targetId);
      if (targetItem.isExpanded) loadDirectory(targetId);
      return;
    }

    if (sourceItem && targetItem && targetItem.type === 'folder') {
      if (sourceId === targetId) return;

      await (sourceItem.type === 'file' ? file : dir)(sourceItem.id).moveTo(
        dir(targetItem.id)
      );
      items = filterItemsByIds([sourceId]);
      targetItem.children = [...(targetItem.children || []), sourceItem];
      items = [...items];
    }
  }

  // 处理文件夹展开事件
  function handleToggleFolder(folder: FolderItem) {
    folder.isExpanded = !folder.isExpanded;
    if (folder.isExpanded) loadDirectory(folder.id);
  }

  async function deleteItemByIds(delIds: string[]) {
    const allItems = getAllItems(items);
    const itemsToDelete = allItems.filter((item) => delIds.includes(item.id));

    for (const item of itemsToDelete) {
      try {
        await (item.type === 'file' ? file : dir)(item.id).remove();
      } catch (error) {
        console.error('Failed to delete item:', item.id, error);
      }
    }

    items = filterItemsByIds(delIds);
  }

  // 添加键盘事件监听
  function handleKeyDown(event: KeyboardEvent) {
    // 检查是否按下 cmd/ctrl + Backspace
    if ((event.metaKey || event.ctrlKey) && event.key === 'Backspace') {
      event.preventDefault();
      if (selectedIds.size > 0) {
        deleteItemByIds(Array.from(selectedIds));
        // 清空选中状态
        selectedIds = new Set();
        lastSelectedId = null;
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
              const newDirPath = joinPath(path, '未命名文件夹');
              const newDir = await dir(newDirPath).create();
              items.push({
                id: newDir.path,
                type: 'folder',
                name: newDir.name,
                isEditing: true,
                modifiedAt: Date.now(),
                createdAt: Date.now(),
                children: [],
                isExpanded: false,
              });
              await updateDirMeta(newDir);
            },
          },
          {
            name: '新建文本文件',
            onClick: async () => {
              const newFile = file(joinPath(path, '未命名文件.txt'));
              await write(newFile, '');
              items.push({
                id: newFile.path,
                type: 'file',
                name: newFile.name,
                size: 0,
                isEditing: true,
                modifiedAt: Date.now(),
                createdAt: Date.now(),
              });
              await updateDirMeta(newFile);
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

    const selectedCnt = selectedIds.size;
    const descStr =
      selectedIds.has(hitItem.id) && selectedCnt > 1
        ? `(${selectedCnt}项)`
        : '';

    const menuItems: MenuItem[] = [
      {
        icon: '🗑️',
        name: `删除${descStr}`,
        onClick: () => {
          // 删除命中选中元素，需清空选中状态
          if (selectedIds.has(hitItem.id)) {
            deleteItemByIds(getCommonNodes(Array.from(selectedIds)));
            selectedIds = new Set();
            lastSelectedId = null;
          } else {
            deleteItemByIds([hitItem.id]);
          }
        },
      },
      {
        icon: '📋',
        name: `复制${descStr}`,
        onClick: async () => {
          try {
            if (selectedIds.has(hitItem.id)) {
              // 复制所有选中的公共节点
              const commonNodes = getCommonNodes(Array.from(selectedIds));
              for (const nodeId of commonNodes) {
                const source = findItemById(items, nodeId);
                if (!source) continue;

                const parentPath = source.id.substring(
                  0,
                  source.id.lastIndexOf('/')
                );
                const newItem = await copyNode(nodeId, parentPath);

                // 添加到目标数组
                const targetArray =
                  (findItemById(items, parentPath) as FolderItem | undefined)
                    ?.children ?? items;
                targetArray.push(newItem);
              }
            } else {
              // 只复制点击的节点
              const parentPath = hitItem.id.substring(
                0,
                hitItem.id.lastIndexOf('/')
              );
              const newItem = await copyNode(hitItem.id, parentPath);

              const targetArray =
                (findItemById(items, parentPath) as FolderItem | undefined)
                  ?.children ?? items;
              targetArray.push(newItem);
            }

            // 触发更新
            items = [...items];
          } catch (error) {
            console.error('Failed to copy items:', error);
          }
        },
      },
      {
        icon: '🔄',
        name: '重命名',
        onClick: () => {
          hitItem.isEditing = true;
        },
      },
      {
        icon: '📤',
        name: `导出${descStr}`,
        onClick: async () => {
          try {
            const handle = await window.showDirectoryPicker({
              startIn: 'downloads',
            });
            if (selectedIds.has(hitItem.id)) {
              // 导出所有选中的公共节点
              const commonNodes = getCommonNodes(Array.from(selectedIds));
              for (const nodeId of commonNodes) {
                const source = findItemById(items, nodeId);
                if (!source) continue;

                await exportItem(source);
              }
            } else {
              await exportItem(hitItem);
            }

            async function exportItem(item: FileItem | FolderItem) {
              if (item.type === 'file') {
                await file(item.id).copyTo(
                  await handle.getFileHandle(item.name, {
                    create: true,
                  })
                );
              } else {
                await dir(item.id).copyTo(
                  await handle.getDirectoryHandle(item.name, { create: true })
                );
              }
            }
          } catch (error) {
            console.error('Failed to export,', error);
          }
        },
      },
    ];

    if (hitItem.type === 'file') {
      menuItems.push({
        icon: '📂',
        name: '打开方式 (WIP)',
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
      const targetFile = file(joinPath(curFile.parent!.path, newName));
      await curFile.moveTo(targetFile);
      item.id = targetFile.path;
    } else {
      const curDir = dir(item.id);
      const targetDir = dir(joinPath(curDir.parent!.path, newName));
      await curDir.moveTo(targetDir);
      item.id = targetDir.path;
    }

    item.name = newName;
  }

  // 获取公共节点（移除被包含的子节点）
  function getCommonNodes(ids: string[]): string[] {
    const result = new Set<string>();

    for (const id of ids) {
      let isSubNode = false;
      // 检查当前节点是否是其他节点的子节点
      for (const otherId of ids) {
        if (id !== otherId && id.startsWith(otherId + '/')) {
          isSubNode = true;
          break;
        }
      }
      if (!isSubNode) {
        result.add(id);
      }
    }

    return Array.from(result);
  }

  // 复制单个节点
  async function copyNode(
    sourceId: string,
    parentPath: string
  ): Promise<FileItem | FolderItem> {
    const sourceItem = findItemById(items, sourceId);
    if (!sourceItem) throw new Error('Source item not found');

    const source = sourceItem.type === 'file' ? file(sourceId) : dir(sourceId);
    const target =
      source.kind === 'file'
        ? file(joinPath(parentPath, sourceItem.name + '1'))
        : dir(joinPath(parentPath, sourceItem.name + '1'));
    // @ts-ignore
    await source.copyTo(target);

    return {
      id: target.path,
      type: sourceItem.type,
      name: target.name,
      ...(target.kind === 'file'
        ? {
            size: await target.getSize(),
          }
        : {
            children: [],
          }),
      isEditing: false,
      modifiedAt: Date.now(),
      createdAt: Date.now(),
    } as FileItem | FolderItem;
  }

  function handlePathChange(newPath: string, fromHistory = false) {
    if (!fromHistory) {
      // 如果不是从历史记录中改变的,则添加新记录
      // 删除当前位置之后的所有记录
      pathHistory = pathHistory.slice(0, currentHistoryIndex + 1);
      // 添加新路径
      pathHistory.push(newPath);
      currentHistoryIndex = pathHistory.length - 1;
    }

    path = newPath;
    loadDirectory(newPath);
    selectedIds = new Set();
    lastSelectedId = null;
  }

  // 添加前进后退处理函数
  function handleHistoryNavigation(direction: 'forward' | 'backward') {
    if (direction === 'backward' && currentHistoryIndex > 0) {
      currentHistoryIndex--;
      handlePathChange(pathHistory[currentHistoryIndex], true);
    } else if (
      direction === 'forward' &&
      currentHistoryIndex < pathHistory.length - 1
    ) {
      currentHistoryIndex++;
      handlePathChange(pathHistory[currentHistoryIndex], true);
    }
  }
</script>

<svelte:window
  onkeydown={handleKeyDown}
  onclick={() => (contextMenu.show = false)}
/>

<main use:initDrag>
  <Layout
    dirName={path.split('/').pop() || 'User'}
    onFavPathChange={handlePathChange}
    onHistoryNavigation={handleHistoryNavigation}
    canGoBack={currentHistoryIndex > 0}
    canGoForward={currentHistoryIndex < pathHistory.length - 1}
    {onWindClose}
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
      onToggleFolder={handleToggleFolder}
      onContextMenu={handleItemContextMenu}
      onRename={handleRename}
      onPathChange={handlePathChange}
    />
  </Layout>
</main>

{#if contextMenu.show}
  <ContextMenu items={contextMenu.items} x={contextMenu.x} y={contextMenu.y} />
{/if}

<style>
  main {
    position: fixed;
    width: 900px;
    height: 500px;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }
</style>
