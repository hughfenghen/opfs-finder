<script lang="ts">
  import Layout from './lib/Layout.svelte';
  import DirList from './lib/DirList.svelte';
  import type { FileItem, FolderItem } from './lib/types';

  const initialFiles: (FileItem | FolderItem)[] = [
    {
      id: '1',
      name: '文档',
      type: 'folder',
      modifiedAt: Date.now(),
      createdAt: Date.now() - 86400000,
      children: [
        {
          id: '2',
          name: '报告.pdf',
          type: 'file',
          size: 1024 * 1024 * 2.5, // 2.5MB
          modifiedAt: Date.now(),
          createdAt: Date.now(),
        },
      ],
    },
    {
      id: '3',
      name: '照片.jpg',
      type: 'file',
      size: 1024 * 500, // 500KB
      modifiedAt: Date.now(),
      createdAt: Date.now(),
    },
  ];

  let items = $state(initialFiles);

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
</script>

<main>
  <Layout>
    <DirList {items} level={0} onMoveItem={handleMoveItem} />
  </Layout>
</main>

<style></style>
