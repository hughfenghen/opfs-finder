<script lang="ts">
  import type { Snippet } from 'svelte';

  const {
    onClickEmpty,
    children,
  }: { onClickEmpty: (evt: MouseEvent) => void; children: Snippet } = $props();

  // 导航项数据
  const favorites = [
    { icon: '📁', name: '文稿' },
    { icon: '⬇️', name: '下载' },
    { icon: '🖥️', name: '桌面' },
    { icon: '📸', name: '图片' },
  ];

  const tags = [
    { name: '红色', color: '#FF1D1C' },
    { name: '橙色', color: '#F67500' },
    { name: '黄色', color: '#EEB100' },
    { name: '绿色', color: '#00B327' },
    { name: '蓝色', color: '#0071F7' },
    { name: '紫色', color: '#A840CC' },
    { name: '灰色', color: '#6D6C71' },
  ];
</script>

<div class="finder">
  <!-- 左侧导航 -->
  <nav class="sidebar">
    <section class="nav-group">
      <h3>个人收藏</h3>
      {#each favorites as item}
        <div class="nav-item">
          <span class="icon">{item.icon}</span>
          <span>{item.name}</span>
        </div>
      {/each}
    </section>

    <section class="nav-group">
      <h3>标签(WIP)</h3>
      {#each tags as tag}
        <div class="nav-item">
          <span class="color-dot" style="background-color: {tag.color}"></span>
          <span>{tag.name}</span>
        </div>
      {/each}
    </section>
  </nav>

  <!-- 右侧内容区 -->
  <main class="content">
    <!-- 工具栏 -->
    <header class="toolbar">
      <div class="navigation-buttons">
        <button>←</button>
        <button>→</button>
      </div>
      <div class="current-path">
        <h2>文稿</h2>
      </div>
      <div class="tools">
        <button>⚙️</button>
        <button>👁️</button>
        <button>🔍</button>
      </div>
    </header>

    <!-- 主内容区域 -->
    <div
      class="main-content"
      onclick={(evt) => {
        // 检查点击的是否为 main-content 本身或其直接子元素
        if (evt.target === evt.currentTarget) {
          onClickEmpty(evt);
        }
      }}
      oncontextmenu={(evt) => {
        onClickEmpty(evt);
      }}
      aria-hidden="true"
    >
      {@render children()}
    </div>
  </main>
</div>

<style>
  .finder {
    display: flex;
    height: 100%;
    background-color: #fff;
    border: 0.5px solid #b5b5b5;
    border-radius: 10px;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
    overflow: hidden;
  }

  .sidebar {
    flex: 0 0 180px;
    width: 200px;
    background-color: #f5f5f5;
    padding: 20px 10px;
    border-right: 1px solid #e0e0e0;
    background: #e0e0de;
    border-right: 0.5px solid #b5b5b5;
  }

  .nav-group {
    margin-bottom: 20px;
  }

  .nav-group h3 {
    font-size: 12px;
    color: #666;
    margin-bottom: 8px;
    padding-left: 6px;
    font-weight: normal;
  }

  .nav-item {
    display: flex;
    align-items: center;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    color: #333;
  }

  .nav-item:hover {
    background-color: #e8e8e8;
  }

  .icon {
    margin-right: 8px;
  }

  .content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .toolbar {
    height: 52px;
    border-bottom: 1px solid #e0e0e0;
    display: flex;
    align-items: center;
    padding: 0 8px;
    background: #f3f3f1;
    -webkit-app-region: drag; /* 允许拖拽窗口 */
  }

  .navigation-buttons {
    display: flex;
    gap: 5px;
  }

  .navigation-buttons button {
    font-size: 16px;
    padding: 2px 8px;
    color: #666;
    -webkit-app-region: no-drag; /* 按钮不参与拖拽 */
  }

  .current-path {
    margin: 0 20px;
    flex: 1;
  }

  .current-path h2 {
    font-size: 18px;
    font-weight: bold;
    color: #494949;
  }

  .tools {
    display: flex;
    gap: 10px;
  }

  .main-content {
    flex: 1;
    overflow: auto;
  }

  button {
    padding: 5px 10px;
    border: none;
    background: none;
    cursor: pointer;
    border-radius: 5px;
  }

  button:hover {
    background-color: #e8e8e8;
  }

  .color-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    margin-right: 8px;
  }
</style>
