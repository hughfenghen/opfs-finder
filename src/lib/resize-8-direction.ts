// 添加方向类型定义
type Direction =
  | 'east'
  | 'west'
  | 'north'
  | 'south'
  | 'northwest'
  | 'northeast'
  | 'southwest'
  | 'southeast';

// 扩展 HTMLDivElement 接口
interface ResizeGrabber extends HTMLDivElement {
  direction: Direction;
}

export function resize(element: HTMLElement) {
  const right = document.createElement('div') as ResizeGrabber;
  right.direction = 'east';
  right.classList.add('grabber');
  right.classList.add('right');

  const left = document.createElement('div') as ResizeGrabber;
  left.direction = 'west';
  left.classList.add('grabber');
  left.classList.add('left');

  const top = document.createElement('div') as ResizeGrabber;
  top.direction = 'north';
  top.classList.add('grabber');
  top.classList.add('top');

  const bottom = document.createElement('div') as ResizeGrabber;
  bottom.direction = 'south';
  bottom.classList.add('grabber');
  bottom.classList.add('bottom');

  const topLeft = document.createElement('div') as ResizeGrabber;
  topLeft.direction = 'northwest';
  topLeft.classList.add('grabber');
  topLeft.classList.add('top-left');

  const topRight = document.createElement('div') as ResizeGrabber;
  topRight.direction = 'northeast';
  topRight.classList.add('grabber');
  topRight.classList.add('top-right');

  const bottomLeft = document.createElement('div') as ResizeGrabber;
  bottomLeft.direction = 'southwest';
  bottomLeft.classList.add('grabber');
  bottomLeft.classList.add('bottom-left');

  const bottomRight = document.createElement('div') as ResizeGrabber;
  bottomRight.direction = 'southeast';
  bottomRight.classList.add('grabber');
  bottomRight.classList.add('bottom-right');

  // 更新 grabbers 数组的类型
  const grabbers: ResizeGrabber[] = [
    right,
    left,
    top,
    bottom,
    topLeft,
    topRight,
    bottomLeft,
    bottomRight,
  ];

  let active: ResizeGrabber | null = null,
    initialRect: {
      width: number;
      height: number;
      left: number;
      right: number;
      top: number;
      bottom: number;
    } | null = null,
    initialPos: { x: number; y: number } | null = null;

  grabbers.forEach((grabber) => {
    element.appendChild(grabber);
    grabber.addEventListener('mousedown', onMousedown);
  });

  function onMousedown(event: MouseEvent) {
    active = event.target as ResizeGrabber;
    const rect = element.getBoundingClientRect();
    const parent = element.parentElement?.getBoundingClientRect()!;

    console.log({ rect, parent });

    initialRect = {
      width: rect.width,
      height: rect.height,
      left: rect.left - parent.left,
      right: parent.right - rect.right,
      top: rect.top - parent.top,
      bottom: parent.bottom - rect.bottom,
    };
    initialPos = { x: event.pageX, y: event.pageY };
    active.classList.add('selected');
  }

  function onMouseup(event: MouseEvent) {
    if (!active) return;

    active.classList.remove('selected');
    active = null;
    initialRect = null;
    initialPos = null;
  }

  function onMove(event: MouseEvent) {
    if (!active) return;

    const direction = active.direction;
    let delta;

    if (!initialPos || !initialRect) return;
    if (direction.match('east')) {
      delta = event.pageX - initialPos.x;
      element.style.width = `${initialRect.width + delta}px`;
    }

    if (direction.match('west')) {
      delta = initialPos.x - event.pageX;
      element.style.left = `${initialRect.left - delta}px`;
      element.style.width = `${initialRect.width + delta}px`;
    }

    if (direction.match('north')) {
      delta = initialPos.y - event.pageY;
      element.style.top = `${initialRect.top - delta}px`;
      element.style.height = `${initialRect.height + delta}px`;
    }

    if (direction.match('south')) {
      delta = event.pageY - initialPos.y;
      element.style.height = `${initialRect.height + delta}px`;
    }
  }

  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onMouseup);

  return {
    destroy() {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousemove', onMousedown);

      grabbers.forEach((grabber) => {
        element.removeChild(grabber);
      });
    },
  };
}
