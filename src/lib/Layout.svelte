<script lang="ts">
  import type { Snippet } from 'svelte';
  import backSvg from '../assets/back.svg?raw';
  import forwardSvg from '../assets/forward.svg?raw';

  const {
    onFavPathChange,
    onClickEmpty,
    children,
    dirName,
    canGoBack,
    canGoForward,
    onHistoryNavigation,
    onWindClose,
  }: {
    onFavPathChange: (path: string) => void;
    onClickEmpty: (evt: MouseEvent) => void;
    children: Snippet;
    dirName: string;
    canGoBack: boolean;
    canGoForward: boolean;
    onHistoryNavigation: (direction: 'backward' | 'forward') => void;
    onWindClose: () => void;
  } = $props();

  // 导航项数据
  const favorites = [
    { icon: '📁', name: '文稿', path: '/Documents' },
    { icon: '⬇️', name: '下载', path: '/Downloads' },
    { icon: '📸', name: '图片', path: '/Pictures' },
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
    <!-- 添加窗口控制按钮 -->
    <div class="window-controls">
      <button
        class="window-btn close"
        title="关闭"
        aria-label="关闭"
        onclick={onWindClose}
      ></button>
      <!-- <button class="window-btn maximize" title="最大化" aria-label="最大化"
      ></button> -->
    </div>

    <section class="nav-group">
      <h3>个人收藏</h3>
      {#each favorites as item}
        <div
          class="nav-item"
          onclick={() => {
            onFavPathChange(item.path);
          }}
          aria-hidden="true"
        >
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
        <button
          class="nav-btn"
          disabled={!canGoBack}
          onclick={() => onHistoryNavigation('backward')}
        >
          {@html backSvg}
        </button>
        <button
          class="nav-btn"
          disabled={!canGoForward}
          onclick={() => onHistoryNavigation('forward')}
        >
          {@html forwardSvg}
        </button>
      </div>
      <div class="current-path">
        <h2>{dirName}</h2>
      </div>
      <!-- <div class="tools">
        <button>⚙️</button>
        <button>👁️</button>
        <button>🔍</button>
      </div> -->
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
    padding: 0px 16px 20px;
    border-right: 1px solid #e0e0e0;
    background: #e0e0de;
    border-right: 0.5px solid #b5b5b5;
    user-select: none;
    display: flex;
    flex-direction: column;
  }

  .nav-group h3 {
    font-size: 12px;
    color: #666;
    margin-bottom: 8px;
    font-weight: normal;
  }
  .nav-group:first-of-type h3 {
    margin-top: 0;
  }

  .nav-item {
    display: flex;
    align-items: center;
    padding: 4px 2px;
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
    padding: 6px 8px;
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

  .tools button {
    padding: 5px 10px;
    border: none;
    background: none;
    cursor: pointer;
    border-radius: 5px;
  }

  .tools button:hover {
    background-color: #e8e8e8;
  }

  .color-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    margin-right: 8px;
  }

  .navigation-buttons {
    margin-top: 2px;
  }

  .nav-btn {
    padding: 4px 8px;
    border: none;
    background: transparent;
    cursor: pointer;
    opacity: 0.6;
  }

  .nav-btn :global(svg) {
    width: 16px;
    height: 16px;
    color: #676665;
  }

  .nav-btn:disabled {
    opacity: 0.3;
    color: #b3b2b1;
    cursor: not-allowed;
  }

  .nav-btn:not(:disabled):hover {
    opacity: 1;
  }

  .window-controls {
    height: 52px; /* 与 toolbar 高度一致 */
    display: flex;
    align-items: center;
    gap: 8px;
    background: #e0e0de;
  }

  .window-btn {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: none;
    padding: 0;
    cursor: pointer;
    -webkit-app-region: no-drag; /* 按钮不参与拖拽 */
    position: relative;
  }

  .window-btn:hover::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 8px;
    height: 8px;
    background-size: 8px;
    background-repeat: no-repeat;
    background-position: center;
    opacity: 0.5;
  }

  .close {
    background-color: #fe5f58;
  }

  .close:hover::after {
    background-image: url('data:image/svg+xml;utf8,<svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L7 7M7 1L1 7" stroke="black" stroke-width="1.2"/></svg>');
  }

  .maximize {
    background-color: #2bc840;
  }

  .maximize:hover::after {
    background-image: url('data:image/svg+xml;utf8,<svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 3.5V1.5C1 1.22386 1.22386 1 1.5 1H6.5C6.77614 1 7 1.22386 7 1.5V6.5C7 6.77614 6.77614 7 6.5 7H1.5C1.22386 7 1 6.77614 1 6.5V4.5" stroke="black" stroke-width="1.2"/></svg>');
  }
</style>
