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

beforeAll(() => {
  installCanvasMock();
  // load VFX first
  const vfxScript = fs.readFileSync(path.join(process.cwd(), 'vfx-manager.js'), 'utf8');
  const vfxEl = document.createElement('script');
  vfxEl.textContent = vfxScript;
  document.head.appendChild(vfxEl);
  window.VFXManagerInstance = new window.VFXManager();

  // load ship animations
  const shipScript = fs.readFileSync(path.join(process.cwd(), 'ship-animations.js'), 'utf8');
  const shipEl = document.createElement('script');
  shipEl.textContent = shipScript;
  document.head.appendChild(shipEl);
});

test('createLaserEffect uses VFX when available', () => {
  const audioStub = { createTone: jest.fn(), playBattleSound: jest.fn() };
  const manager = new window.ShipAnimationManager(audioStub);
  const vfxSpy = jest.spyOn(window.VFXManagerInstance, 'laser');
  manager.createLaserEffect(0, 0, 100, 0);
  expect(vfxSpy).toHaveBeenCalled();
  expect(audioStub.createTone).toHaveBeenCalled();
});

