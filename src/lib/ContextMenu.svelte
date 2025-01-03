<script lang="ts">
  import ContextMenu from './ContextMenu.svelte';
  import type { MenuItem } from './types';

  let { items, x, y }: { items: MenuItem[]; x: number; y: number } = $props();

  // 当前展开的子菜单索引
  let activeSubmenuIndex = $state<number | null>(null);
  let submenuTimer = $state(0);

  // 处理鼠标进入菜单项
  function handleMouseEnterItem(index: number) {
    if (submenuTimer) clearTimeout(submenuTimer);

    if (items[index].children) {
      clearTimeout(submenuTimer);
      submenuTimer = setTimeout(() => {
        activeSubmenuIndex = index;
      }, 300);
    }
  }

  // 处理鼠标离开菜单项
  function handleMouseLeaveItem(index: number) {
    if (activeSubmenuIndex === index) {
      activeSubmenuIndex = null;
    }
  }

  // 处理鼠标离开菜单项
  function handleMouseLeave() {
    clearTimeout(submenuTimer);
    submenuTimer = 0;
    activeSubmenuIndex = null;
  }

  // 处理点击菜单项
  function handleClick(item: MenuItem) {
    if (item.onClick) {
      item.onClick();
    }
  }
</script>

<div
  class="context-menu"
  style="left: {x}px; top: {y}px"
  onmouseleave={handleMouseLeave}
  aria-hidden="true"
>
  {#each items as item, index}
    <div
      class="menu-item"
      onmouseenter={() => handleMouseEnterItem(index)}
      onmouseleave={() => handleMouseLeaveItem(index)}
      onclick={() => handleClick(item)}
      aria-hidden="true"
    >
      {#if item.icon}
        <span class="icon">{item.icon}</span>
      {/if}
      <span class="name">{item.name}</span>
      {#if item.children}
        <span class="arrow">▶</span>
      {/if}
    </div>

    {#if item.children && activeSubmenuIndex === index}
      <div class="submenu">
        <ContextMenu items={item.children} x={x + 200} {y} />
      </div>
    {/if}
  {/each}
</div>

<style>
  .context-menu {
    position: fixed;
    min-width: 200px;
    background: rgba(224, 224, 222, 0.97);
    border: 0.5px solid #b5b5b5;
    border-radius: 6px;
    padding: 5px 0;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 1000;
  }

  .menu-item {
    display: flex;
    align-items: center;
    padding: 4px 10px;
    cursor: default;
    font-size: 13px;
    color: #333;
  }

  .menu-item:hover {
    background-color: #3188f6;
    color: white;
  }

  .icon {
    margin-right: 8px;
  }

  .arrow {
    margin-left: auto;
    font-size: 10px;
  }

  .submenu {
    position: absolute;
  }
</style>
