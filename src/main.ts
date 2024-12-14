import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import { write } from 'opfs-tools';

// 创建一个容器用于放置所有窗口
const container = document.createElement('div');
container.style.cssText = `
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
`;
document.body.appendChild(container);

(async function initTestFiles() {
  await write('/Documents/doc1.txt', 'test');
  await write('/Downloads/doc2.txt', 'test');
})();

let zIndex = 1;

// 创建新窗口的函数
function createWindow() {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
      z-index: ${zIndex++};
  `;

  container.appendChild(wrapper);

  return mount(App, {
    target: wrapper,
    props: {
      path: '/',
    },
  });
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
