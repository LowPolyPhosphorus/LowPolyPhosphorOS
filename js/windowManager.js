// windowManager.js - Handles creating, moving, resizing, focusing, minimizing, and closing windows

const windowContainer = document.getElementById('window-container');
const taskbarWindows = document.getElementById('taskbar-windows');

let windows = {};
let highestZ = 100;
let windowCount = 0;

// Create a new window
function createWindow({ id, title, content, width = 600, height = 400, x, y }) {
  // If window already exists, just focus it
  if (windows[id]) {
    focusWindow(id);
    restoreWindow(id);
    return;
  }

  windowCount++;
  const zIndex = ++highestZ;

  // Default position: slightly offset each new window
  const posX = x ?? 80 + (windowCount * 20) % 200;
  const posY = y ?? 60 + (windowCount * 20) % 150;

  // Build window element
  const win = document.createElement('div');
  win.className = 'window';
  win.id = 'win-' + id;
  win.style.width = width + 'px';
  win.style.height = height + 'px';
  win.style.left = posX + 'px';
  win.style.top = posY + 'px';
  win.style.zIndex = zIndex;

  win.innerHTML = `
    <div class="window-titlebar" id="titlebar-${id}">
      <div class="window-title">
        <img class="window-icon" src="assets/icons/${id}.png" onerror="this.style.display='none'" />
        <span>${title}</span>
      </div>
      <div class="window-controls">
        <button class="win-btn win-minimize" data-id="${id}" title="Minimize">_</button>
        <button class="win-btn win-maximize" data-id="${id}" title="Maximize">□</button>
        <button class="win-btn win-close" data-id="${id}" title="Close">✕</button>
      </div>
    </div>
    <div class="window-body" id="body-${id}">
      ${content}
    </div>
  `;

  windowContainer.appendChild(win);

  // Store window state
  windows[id] = {
    el: win,
    title,
    minimized: false,
    maximized: false,
    prevSize: { width, height, x: posX, y: posY },
  };

  // Add to taskbar
  addTaskbarButton(id, title);

  // Make draggable
  makeDraggable(win, document.getElementById('titlebar-' + id), id);

  // Focus on click anywhere in window
  win.addEventListener('mousedown', () => focusWindow(id));

  // Button events
  win.querySelector('.win-minimize').addEventListener('click', (e) => {
    e.stopPropagation();
    minimizeWindow(id);
  });
  win.querySelector('.win-maximize').addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMaximize(id);
  });
  win.querySelector('.win-close').addEventListener('click', (e) => {
    e.stopPropagation();
    closeWindow(id);
  });

  // Animate in
  win.style.opacity = '0';
  win.style.transform = 'scale(0.95)';
  win.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      win.style.opacity = '1';
      win.style.transform = 'scale(1)';
    });
  });

  focusWindow(id);
}

function focusWindow(id) {
  if (!windows[id]) return;
  highestZ++;
  windows[id].el.style.zIndex = highestZ;

  // Update active state on all windows
  Object.keys(windows).forEach(wid => {
    windows[wid].el.classList.remove('window-active');
    const btn = document.getElementById('taskbarbtn-' + wid);
    if (btn) btn.classList.remove('active');
  });

  windows[id].el.classList.add('window-active');
  const btn = document.getElementById('taskbarbtn-' + id);
  if (btn) btn.classList.add('active');
}

function minimizeWindow(id) {
  if (!windows[id]) return;
  windows[id].minimized = true;
  windows[id].el.style.display = 'none';
  const btn = document.getElementById('taskbarbtn-' + id);
  if (btn) btn.classList.remove('active');
}

function restoreWindow(id) {
  if (!windows[id]) return;
  windows[id].minimized = false;
  windows[id].el.style.display = 'flex';
  focusWindow(id);
}

function toggleMaximize(id) {
  if (!windows[id]) return;
  const win = windows[id].el;
  const state = windows[id];
  const taskbarHeight = 40;

  if (!state.maximized) {
    // Save current size/pos before maximizing
    state.prevSize = {
      width: win.offsetWidth,
      height: win.offsetHeight,
      x: win.offsetLeft,
      y: win.offsetTop,
    };
    win.style.left = '0px';
    win.style.top = '0px';
    win.style.width = '100vw';
    win.style.height = `calc(100vh - ${taskbarHeight}px)`;
    state.maximized = true;
  } else {
    win.style.left = state.prevSize.x + 'px';
    win.style.top = state.prevSize.y + 'px';
    win.style.width = state.prevSize.width + 'px';
    win.style.height = state.prevSize.height + 'px';
    state.maximized = false;
  }
}

function closeWindow(id) {
  if (!windows[id]) return;
  const win = windows[id].el;

  win.style.opacity = '0';
  win.style.transform = 'scale(0.95)';
  win.style.transition = 'opacity 0.15s ease, transform 0.15s ease';

  setTimeout(() => {
    win.remove();
    removeTaskbarButton(id);
    delete windows[id];
  }, 150);
}

function addTaskbarButton(id, title) {
  const btn = document.createElement('button');
  btn.className = 'taskbar-win-btn';
  btn.id = 'taskbarbtn-' + id;
  btn.innerHTML = `<img src="assets/icons/${id}.png" onerror="this.style.display='none'" /><span>${title}</span>`;
  btn.addEventListener('click', () => {
    if (windows[id].minimized) {
      restoreWindow(id);
    } else if (windows[id].el.classList.contains('window-active')) {
      minimizeWindow(id);
    } else {
      focusWindow(id);
      restoreWindow(id);
    }
  });
  taskbarWindows.appendChild(btn);
}

function removeTaskbarButton(id) {
  const btn = document.getElementById('taskbarbtn-' + id);
  if (btn) btn.remove();
}

function makeDraggable(win, handle, id) {
  let dragging = false;
  let startX, startY, startLeft, startTop;

  handle.addEventListener('mousedown', (e) => {
    if (windows[id].maximized) return;
    if (e.target.classList.contains('win-btn')) return;

    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startLeft = win.offsetLeft;
    startTop = win.offsetTop;

    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    win.style.left = (startLeft + dx) + 'px';
    win.style.top = (startTop + dy) + 'px';
  });

  document.addEventListener('mouseup', () => {
    dragging = false;
  });
}

// Double click titlebar to maximize
document.addEventListener('dblclick', (e) => {
  const titlebar = e.target.closest('.window-titlebar');
  if (!titlebar) return;
  const id = titlebar.id.replace('titlebar-', '');
  toggleMaximize(id);
});
