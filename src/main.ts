import { mount, unmount } from 'svelte';
import './app.css';
import App from './App.svelte';
import { dir } from 'opfs-tools';

// 创建一个容器用于放置所有窗口
const container = document.createElement('div');
container.style.cssText = `
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
`;
document.body.appendChild(container);

(async function initTestFiles() {
  const sysDirPaths = ['/Documents', '/Downloads', '/Pictures'];
  for (const path of sysDirPaths) {
    await dir(path).create();
  }
})();

let zIndex = 1;

// 创建新窗口的函数
function createWindow() {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    z-index: ${zIndex++};
    position: absolute;
  `;

  // 添加点击事件监听器
  wrapper.addEventListener('mousedown', () => {
    wrapper.style.zIndex = String(zIndex++);
  });

  container.appendChild(wrapper);

  const app = mount(App, {
    target: wrapper,
    props: {
      path: '/',
      onWindClose: () => {
        unmount(app);
        wrapper.remove();
      },
    },
  });
  return app;
}

// 创建初始窗口
const app = createWindow();

// 监听快捷键创建新窗口
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'n') {
    e.preventDefault();
    createWindow();
  }
});

export default app;
