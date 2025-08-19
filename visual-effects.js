// 星际殖民战争 - 视觉特效系统
class VisualEffectsManager {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.screenEffects = [];
        this.activeAnimations = new Map();
        this.settings = {
            enableParticles: true,
            enableScreenEffects: true,
            enableUIAnimations: true,
            particleQuality: 'high', // low, medium, high
            maxParticles: 500
        };
        
        // Performance monitoring
        this.performanceStats = {
            frameTime: 0,
            particleCount: 0,
            effectCount: 0
        };
        
        this.init();
    }
    
    init() {
        this.createCanvas();
        this.setupEventListeners();
        this.startRenderLoop();
    }
    
    createCanvas() {
        // 创建特效画布
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'visualEffectsCanvas';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1000;
        `;
        document.body.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
        // 监听窗口大小变化
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    setupEventListeners() {
        // 监听游戏事件
        document.addEventListener('buildingConstructed', (e) => {
            this.createBuildingEffect(e.detail.element, e.detail.type);
        });
        
        document.addEventListener('shipBuilt', (e) => {
            this.createShipBuildEffect(e.detail.element);
        });
        
        document.addEventListener('battleStart', (e) => {
            this.createBattleEffect(e.detail.attackerElement, e.detail.defenderElement);
        });
        
        document.addEventListener('planetConquered', (e) => {
            this.createConquestEffect(e.detail.element);
        });
        
        document.addEventListener('techResearched', (e) => {
            this.createTechEffect(e.detail.element);
        });
        
        document.addEventListener('resourceGained', (e) => {
            this.createResourceEffect(e.detail.element, e.detail.amount, e.detail.type);
        });
    }
    
    startRenderLoop() {
        let lastTime = performance.now();
        
        const render = (currentTime) => {
            // Performance monitoring
            this.performanceStats.frameTime = currentTime - lastTime;
            lastTime = currentTime;
            
            this.update();
            this.draw();
            
            // Update stats
            this.performanceStats.particleCount = this.particles.length;
            this.performanceStats.effectCount = this.screenEffects.length;
            
            requestAnimationFrame(render);
        };
        render(performance.now());
    }
    
    update() {
        // 更新粒子
        this.particles = this.particles.filter(particle => {
            particle.update();
            return particle.life > 0;
        });
        
        // 更新屏幕特效
        this.screenEffects = this.screenEffects.filter(effect => {
            effect.update();
            return !effect.finished;
        });
        
        // 限制粒子数量
        if (this.particles.length > this.settings.maxParticles) {
            this.particles = this.particles.slice(-this.settings.maxParticles);
        }
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制屏幕特效
        this.screenEffects.forEach(effect => effect.draw(this.ctx));
        
        // 绘制粒子
        this.particles.forEach(particle => particle.draw(this.ctx));
    }
    
    // 建筑建造特效
    createBuildingEffect(element, buildingType) {
        if (!this.settings.enableParticles) return;
        
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // 根据质量设置调整粒子数量
        const particleCount = this.getParticleCount(30);
        
        // 创建建造粒子
        for (let i = 0; i < particleCount; i++) {
            const particle = new ConstructionParticle(centerX, centerY, buildingType);
            this.particles.push(particle);
        }
        
        // 屏幕闪光效果
        this.createFlashEffect(centerX, centerY, '#4CAF50', 0.3);
        
        // 建筑脉冲效果
        this.createPulseEffect(element, '#4CAF50', 1000);
    }
    
    // 舰船建造特效
    createShipBuildEffect(element) {
        if (!this.settings.enableParticles) return;
        
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // 创建舰船建造粒子
        const particleCount = this.getParticleCount(20);
        for (let i = 0; i < particleCount; i++) {
            const particle = new ShipParticle(centerX, centerY);
            this.particles.push(particle);
        }
        
        // 蓝色闪光
        this.createFlashEffect(centerX, centerY, '#2196F3', 0.4);
    }
    
    // 战斗特效
    createBattleEffect(attackerElement, defenderElement) {
        if (!this.settings.enableParticles) return;
        
        const attackerRect = attackerElement.getBoundingClientRect();
        const defenderRect = defenderElement.getBoundingClientRect();
        
        const startX = attackerRect.left + attackerRect.width / 2;
        const startY = attackerRect.top + attackerRect.height / 2;
        const endX = defenderRect.left + defenderRect.width / 2;
        const endY = defenderRect.top + defenderRect.height / 2;
        
        // 创建激光束效果
        this.createLaserBeam(startX, startY, endX, endY);
        
        // 爆炸效果
        this.createExplosion(endX, endY, 'battle');
        
        // 屏幕震动
        this.createScreenShake(300, 5);
    }
    
    // 星球征服特效
    createConquestEffect(element) {
        if (!this.settings.enableParticles) return;
        
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // 征服光环
        this.createConquestRing(centerX, centerY);
        
        // 胜利粒子
        const particleCount = this.getParticleCount(50);
        for (let i = 0; i < particleCount; i++) {
            const particle = new VictoryParticle(centerX, centerY);
            this.particles.push(particle);
        }
        
        // 金色闪光
        this.createFlashEffect(centerX, centerY, '#FFD700', 0.6);
    }
    
    // 科技研发特效
    createTechEffect(element) {
        if (!this.settings.enableParticles) return;
        
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // 科技光环
        const particleCount = this.getParticleCount(25);
        for (let i = 0; i < particleCount; i++) {
            const particle = new TechParticle(centerX, centerY);
            this.particles.push(particle);
        }
        
        // 紫色闪光
        this.createFlashEffect(centerX, centerY, '#9C27B0', 0.5);
    }
    
    // 资源获得特效
    createResourceEffect(element, amount, resourceType) {
        if (!this.settings.enableParticles) return;
        
        const rect = element.getBoundingClientRect();
        const startX = rect.left + rect.width / 2;
        const startY = rect.top + rect.height / 2;
        
        // 资源粒子颜色映射
        const colors = {
            energy: '#FFD700',
            research: '#9C27B0',
            materials: '#795548',
            population: '#4CAF50'
        };
        
        const color = colors[resourceType] || '#FFFFFF';
        
        // 创建资源粒子
        for (let i = 0; i < Math.min(amount / 10, 15); i++) {
            const particle = new ResourceParticle(startX, startY, color, resourceType);
            this.particles.push(particle);
        }
    }
    
    // 激光束效果
    createLaserBeam(startX, startY, endX, endY) {
        const beam = new LaserBeam(startX, startY, endX, endY);
        this.screenEffects.push(beam);
    }
    
    // 爆炸效果
    createExplosion(x, y, type = 'normal') {
        const particleCount = type === 'battle' ? 40 : 20;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new ExplosionParticle(x, y, type);
            this.particles.push(particle);
        }
    }
    
    // 屏幕震动
    createScreenShake(duration, intensity) {
        if (!this.settings.enableScreenEffects) return;
        
        const shake = new ScreenShake(duration, intensity);
        this.screenEffects.push(shake);
    }
    
    // 闪光效果
    createFlashEffect(x, y, color, intensity) {
        if (!this.settings.enableScreenEffects) return;
        
        const flash = new FlashEffect(x, y, color, intensity);
        this.screenEffects.push(flash);
    }
    
    // 脉冲效果
    createPulseEffect(element, color, duration) {
        const pulse = new PulseEffect(element, color, duration);
        this.screenEffects.push(pulse);
    }
    
    // 征服光环
    createConquestRing(x, y) {
        const ring = new ConquestRing(x, y);
        this.screenEffects.push(ring);
    }
    
    // 设置配置
    updateSettings(newSettings) {
        Object.assign(this.settings, newSettings);
        
        // 根据质量设置调整最大粒子数
        switch (this.settings.particleQuality) {
            case 'low':
                this.settings.maxParticles = 200;
                break;
            case 'medium':
                this.settings.maxParticles = 350;
                break;
            case 'high':
                this.settings.maxParticles = 500;
                break;
        }
    }
    
    // 清除所有特效
    clearAllEffects() {
        this.particles = [];
        this.screenEffects = [];
    }
    
    // 根据质量设置获取粒子数量
    getParticleCount(baseCount) {
        switch (this.settings.particleQuality) {
            case 'low':
                return Math.floor(baseCount * 0.5);
            case 'medium':
                return Math.floor(baseCount * 0.75);
            case 'high':
            default:
                return baseCount;
        }
    }
    
    // 获取性能统计
    getPerformanceStats() {
        return {
            ...this.performanceStats,
            fps: this.performanceStats.frameTime > 0 ? Math.round(1000 / this.performanceStats.frameTime) : 0
        };
    }
    
    // 销毁特效系统
    destroy() {
        this.clearAllEffects();
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

// 基础粒子类
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.life = 1.0;
        this.maxLife = 1.0;
        this.size = 2;
        this.color = '#FFFFFF';
        this.gravity = 0;
        this.friction = 0.98;
        this.decay = 0.02;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.life -= this.decay;
        
        if (this.life < 0) this.life = 0;
    }
    
    draw(ctx) {
        if (this.life <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// 建造粒子
class ConstructionParticle extends Particle {
    constructor(x, y, buildingType) {
        super(x, y);
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.size = Math.random() * 3 + 1;
        this.color = this.getBuildingColor(buildingType);
        this.life = Math.random() * 0.5 + 0.5;
        this.maxLife = this.life;
        this.decay = 0.015;
        this.gravity = 0.1;
    }
    
    getBuildingColor(type) {
        const colors = {
            'power_plant': '#FFD700',
            'research_lab': '#9C27B0',
            'mining_facility': '#795548',
            'habitat': '#4CAF50',
            'shipyard': '#2196F3',
            'defense_system': '#F44336'
        };
        return colors[type] || '#4CAF50';
    }
}

// 舰船粒子
class ShipParticle extends Particle {
    constructor(x, y) {
        super(x, y);
        this.vx = (Math.random() - 0.5) * 6;
        this.vy = (Math.random() - 0.5) * 6;
        this.size = Math.random() * 2 + 1;
        this.color = `hsl(${200 + Math.random() * 40}, 100%, ${50 + Math.random() * 30}%)`;
        this.life = Math.random() * 0.8 + 0.4;
        this.decay = 0.02;
    }
}

// 爆炸粒子
class ExplosionParticle extends Particle {
    constructor(x, y, type) {
        super(x, y);
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.size = Math.random() * 4 + 2;
        this.color = type === 'battle' ? 
            `hsl(${Math.random() * 60}, 100%, ${60 + Math.random() * 20}%)` :
            `hsl(${Math.random() * 30 + 10}, 100%, ${50 + Math.random() * 30}%)`;
        this.life = Math.random() * 0.6 + 0.4;
        this.decay = 0.025;
        this.gravity = 0.2;
    }
}

// 胜利粒子
class VictoryParticle extends Particle {
    constructor(x, y) {
        super(x, y);
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = Math.random() * -8 - 2;
        this.size = Math.random() * 3 + 2;
        this.color = `hsl(${45 + Math.random() * 30}, 100%, ${60 + Math.random() * 20}%)`;
        this.life = Math.random() * 0.8 + 0.6;
        this.decay = 0.012;
        this.gravity = 0.15;
        this.sparkle = Math.random() > 0.7;
    }
    
    draw(ctx) {
        if (this.life <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = this.life;
        
        if (this.sparkle) {
            // 星形粒子
            ctx.fillStyle = this.color;
            ctx.translate(this.x, this.y);
            ctx.rotate(Date.now() * 0.01);
            
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i * 4 * Math.PI) / 5;
                const x = Math.cos(angle) * this.size;
                const y = Math.sin(angle) * this.size;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
        } else {
            // 圆形粒子
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

// 科技粒子
class TechParticle extends Particle {
    constructor(x, y) {
        super(x, y);
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.size = Math.random() * 2 + 1;
        this.color = `hsl(${280 + Math.random() * 40}, 100%, ${60 + Math.random() * 20}%)`;
        this.life = Math.random() * 0.9 + 0.5;
        this.decay = 0.01;
        this.spiral = Math.random() * 0.1 + 0.05;
    }
    
    update() {
        super.update();
        // 螺旋运动
        const angle = Date.now() * this.spiral;
        this.x += Math.cos(angle) * 0.5;
        this.y += Math.sin(angle) * 0.5;
    }
}

// 资源粒子
class ResourceParticle extends Particle {
    constructor(x, y, color, type) {
        super(x, y);
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = Math.random() * -6 - 2;
        this.size = Math.random() * 2 + 1;
        this.color = color;
        this.type = type;
        this.life = Math.random() * 0.7 + 0.5;
        this.decay = 0.015;
        this.gravity = 0.1;
        this.targetY = y - 100; // 向上飘移
    }
    
    update() {
        super.update();
        // 向目标位置飘移
        if (this.y > this.targetY) {
            this.vy -= 0.05;
        }
    }
}

// 激光束效果
class LaserBeam {
    constructor(startX, startY, endX, endY) {
        this.startX = startX;
        this.startY = startY;
        this.endX = endX;
        this.endY = endY;
        this.life = 1.0;
        this.maxLife = 1.0;
        this.duration = 300; // 毫秒
        this.startTime = Date.now();
        this.finished = false;
        this.width = 3;
        this.color = '#00FFFF';
    }
    
    update() {
        const elapsed = Date.now() - this.startTime;
        this.life = Math.max(0, 1 - elapsed / this.duration);
        this.finished = this.life <= 0;
    }
    
    draw(ctx) {
        if (this.finished) return;
        
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.width;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        
        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(this.endX, this.endY);
        ctx.stroke();
        
        ctx.restore();
    }
}

// 屏幕震动效果
class ScreenShake {
    constructor(duration, intensity) {
        this.duration = duration;
        this.intensity = intensity;
        this.startTime = Date.now();
        this.finished = false;
    }
    
    update() {
        const elapsed = Date.now() - this.startTime;
        this.finished = elapsed >= this.duration;
        
        if (!this.finished) {
            const progress = elapsed / this.duration;
            const currentIntensity = this.intensity * (1 - progress);
            
            const shakeX = (Math.random() - 0.5) * currentIntensity * 2;
            const shakeY = (Math.random() - 0.5) * currentIntensity * 2;
            
            document.body.style.transform = `translate(${shakeX}px, ${shakeY}px)`;
        } else {
            document.body.style.transform = '';
        }
    }
    
    draw(ctx) {
        // 屏幕震动不需要绘制
    }
}

// 闪光效果
class FlashEffect {
    constructor(x, y, color, intensity) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.intensity = intensity;
        this.life = 1.0;
        this.duration = 400;
        this.startTime = Date.now();
        this.finished = false;
        this.radius = 0;
        this.maxRadius = 150;
    }
    
    update() {
        const elapsed = Date.now() - this.startTime;
        const progress = elapsed / this.duration;
        this.life = Math.max(0, 1 - progress);
        this.finished = this.life <= 0;
        
        this.radius = this.maxRadius * progress;
    }
    
    draw(ctx) {
        if (this.finished) return;
        
        ctx.save();
        ctx.globalAlpha = this.life * this.intensity;
        
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius
        );
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

// 脉冲效果
class PulseEffect {
    constructor(element, color, duration) {
        this.element = element;
        this.color = color;
        this.duration = duration;
        this.startTime = Date.now();
        this.finished = false;
        this.originalBoxShadow = element.style.boxShadow;
    }
    
    update() {
        const elapsed = Date.now() - this.startTime;
        this.finished = elapsed >= this.duration;
        
        if (!this.finished) {
            const progress = (elapsed % 500) / 500; // 0.5秒一个周期
            const intensity = Math.sin(progress * Math.PI * 2) * 0.5 + 0.5;
            const blur = 10 + intensity * 20;
            
            this.element.style.boxShadow = `0 0 ${blur}px ${this.color}`;
        } else {
            this.element.style.boxShadow = this.originalBoxShadow;
        }
    }
    
    draw(ctx) {
        // 脉冲效果直接操作DOM元素
    }
}

// 征服光环
class ConquestRing {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.life = 1.0;
        this.duration = 2000;
        this.startTime = Date.now();
        this.finished = false;
        this.radius = 0;
        this.maxRadius = 200;
    }
    
    update() {
        const elapsed = Date.now() - this.startTime;
        const progress = elapsed / this.duration;
        this.life = Math.max(0, 1 - progress);
        this.finished = this.life <= 0;
        
        this.radius = this.maxRadius * progress;
    }
    
    draw(ctx) {
        if (this.finished) return;
        
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 15;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // 内圈
        ctx.globalAlpha = this.life * 0.5;
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 5;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.8, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }
}
