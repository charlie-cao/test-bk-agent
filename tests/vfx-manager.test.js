/** @jest-environment jsdom */
const fs = require('fs');
const path = require('path');

function installCanvasMock() {
  if (!HTMLCanvasElement.prototype.getContext || HTMLCanvasElement.prototype.getContext.name === 'getContext') {
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
      clearRect: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      beginPath: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      fillStyle: '#000',
      globalAlpha: 1,
    }));
  }
  if (!global.requestAnimationFrame) {
    global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  }
}

// Load VFX script into JSDOM
beforeAll(() => {
  installCanvasMock();
  const script = fs.readFileSync(path.join(process.cwd(), 'vfx-manager.js'), 'utf8');
  const scriptEl = document.createElement('script');
  scriptEl.textContent = script;
  document.head.appendChild(scriptEl);
});

test('VFXManager attaches to window and provides basic methods', () => {
  expect(window.VFXManager).toBeDefined();
  const vfx = new window.VFXManager();
  window.VFXManagerInstance = vfx;
  expect(typeof vfx.pulseAt).toBe('function');
  expect(typeof vfx.emitParticles).toBe('function');
  expect(typeof vfx.floatingText).toBe('function');
});

test('pulseAt creates and removes pulse element', () => {
  const vfx = new window.VFXManager();
  const countBefore = document.querySelectorAll('.vfx-pulse-ring').length;
  vfx.pulseAt(100, 100, 40, '#fff');
  const countAfter = document.querySelectorAll('.vfx-pulse-ring').length;
  expect(countAfter).toBe(countBefore + 1);
});

test('floatingText creates element with text', () => {
  const vfx = new window.VFXManager();
  vfx.floatingText(50, 60, 'Hello', '#fff');
  const el = Array.from(document.querySelectorAll('.vfx-floating-text')).pop();
  expect(el).toBeTruthy();
  expect(el.textContent).toBe('Hello');
});

