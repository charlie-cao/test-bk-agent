// 视觉特效系统（独立于音效），负责统一管理屏幕级与元素级的视觉效果
class VFXManager {
    constructor() {
        this.layers = {};
        this.init();
    }

    init() {
        this.injectCss();
        this.setupCanvases();
    }

    injectCss() {
        const style = document.createElement('style');
        style.textContent = `
            .vfx-pulse-ring {
                position: fixed;
                border: 2px solid var(--ring-color, #4a9eff);
                border-radius: 50%;
                pointer-events: none;
                z-index: 1500;
                animation: vfxPulse 700ms ease-out forwards;
            }
            @keyframes vfxPulse {
                0% { transform: scale(0); opacity: 1; }
                100% { transform: scale(2.5); opacity: 0; }
            }

            .vfx-glow {
                transition: box-shadow 0.2s ease;
                box-shadow: 0 0 18px var(--glow-color, #4a9eff);
            }

            .vfx-floating-text {
                position: fixed;
                color: var(--text-color, #ffffff);
                font-family: 'Orbitron', monospace;
                font-weight: 700;
                text-shadow: 0 0 6px rgba(255,255,255,0.5);
                pointer-events: none;
                z-index: 1600;
                animation: vfxFloatUp 900ms ease-out forwards;
            }
            @keyframes vfxFloatUp {
                0% { transform: translateY(0); opacity: 1; }
                100% { transform: translateY(-24px); opacity: 0; }
            }

            .vfx-laser {
                position: fixed;
                height: 2px;
                background: linear-gradient(90deg, transparent, var(--laser-core, #ff6b6b), transparent);
                pointer-events: none;
                z-index: 1550;
                transform-origin: 0 50%;
                animation: vfxLaser 280ms ease-out;
            }
            @keyframes vfxLaser {
                0% { opacity: 0; transform: scaleX(0); }
                40% { opacity: 1; transform: scaleX(1); }
                100% { opacity: 0; transform: scaleX(1); }
            }
        `;
        document.head.appendChild(style);
    }

    setupCanvases() {
        // 粒子层
        const particleCanvas = document.createElement('canvas');
        particleCanvas.id = 'vfxParticleCanvas';
        particleCanvas.style.cssText = `
            position: fixed; left: 0; top: 0; width: 100%; height: 100%;
            pointer-events: none; z-index: 1200;`;
        document.body.appendChild(particleCanvas);
        this.particleCanvas = particleCanvas;
        this.particleCtx = particleCanvas.getContext('2d');
        const resize = () => {
            this.particleCanvas.width = window.innerWidth;
            this.particleCanvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);
        this.particles = [];
        this.animateParticles();
    }

    // 通用坐标获取
    getCenterXYOfElement(element) {
        const rect = element.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }

    // 元素高亮（短时发光）
    glowElement(element, color = '#4a9eff', durationMs = 600) {
        element.style.setProperty('--glow-color', color);
        element.classList.add('vfx-glow');
        window.setTimeout(() => element.classList.remove('vfx-glow'), durationMs);
    }

    // 脉冲环
    pulseAt(x, y, radius = 60, color = '#4a9eff') {
        const ring = document.createElement('div');
        ring.className = 'vfx-pulse-ring';
        ring.style.left = `${x - radius}px`;
        ring.style.top = `${y - radius}px`;
        ring.style.width = `${radius * 2}px`;
        ring.style.height = `${radius * 2}px`;
        ring.style.setProperty('--ring-color', color);
        document.body.appendChild(ring);
        window.setTimeout(() => ring.remove(), 800);
    }

    // 飘字
    floatingText(x, y, text, color = '#ffffff') {
        const el = document.createElement('div');
        el.className = 'vfx-floating-text';
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.setProperty('--text-color', color);
        el.textContent = text;
        document.body.appendChild(el);
        window.setTimeout(() => el.remove(), 1000);
    }

    // 激光
    laser(startX, startY, endX, endY, color = '#ff6b6b') {
        const dx = endX - startX;
        const dy = endY - startY;
        const angle = Math.atan2(dy, dx);
        const distance = Math.sqrt(dx * dx + dy * dy);
        const beam = document.createElement('div');
        beam.className = 'vfx-laser';
        beam.style.left = `${startX}px`;
        beam.style.top = `${startY}px`;
        beam.style.width = `${distance}px`;
        beam.style.transform = `rotate(${angle}rad)`;
        beam.style.setProperty('--laser-core', color);
        document.body.appendChild(beam);
        window.setTimeout(() => beam.remove(), 320);
    }

    // 粒子（用于爆炸/建造/资源）
    emitParticles(x, y, count = 14, color = '#4a9eff') {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 1,
                decay: 0.02 + Math.random() * 0.03,
                size: 2 + Math.random() * 3,
                color
            });
        }
    }

    animateParticles() {
        if (!this.particleCtx) return;
        this.particleCtx.clearRect(0, 0, this.particleCanvas.width, this.particleCanvas.height);
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
            if (p.life > 0) {
                this.particleCtx.save();
                this.particleCtx.globalAlpha = p.life;
                this.particleCtx.fillStyle = p.color;
                this.particleCtx.beginPath();
                this.particleCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.particleCtx.fill();
                this.particleCtx.restore();
                return true;
            }
            return false;
        });
        requestAnimationFrame(() => this.animateParticles());
    }
}

// 导出
window.VFXManager = VFXManager;

