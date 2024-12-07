<script lang="ts">
  import Layout from './lib/Layout.svelte';

  import DirList from './lib/DirList.svelte';

  // 示例数据
  const files = [
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
</script>

<main>
  <Layout>
    <DirList items={files} />
  </Layout>
</main>

<style></style>
