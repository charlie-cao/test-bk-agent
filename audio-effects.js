// 音效和视觉特效管理器
class AudioEffectsManager {
    constructor() {
        this.sounds = {};
        this.musicEnabled = true;
        this.sfxEnabled = true;
        this.backgroundMusic = null;
        this.init();
    }
    
    init() {
        this.createAudioContext();
        this.setupBackgroundMusic();
        this.addParticleSystem();
        this.addScreenShake();
    }
    
    createAudioContext() {
        // 使用Web Audio API创建音效
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }
    
    // 使用Web Audio API生成音效
    createTone(frequency, duration, type = 'sine', volume = 0.1) {
        if (!this.audioContext || !this.sfxEnabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    // 播放按钮点击音效
    playButtonClick() {
        this.createTone(800, 0.1, 'square', 0.05);
    }
    
    // 播放建造音效
    playBuildSound() {
        this.createTone(600, 0.3, 'sawtooth', 0.08);
        setTimeout(() => this.createTone(800, 0.2, 'sine', 0.06), 100);
    }
    
    // 播放战斗音效
    playBattleSound() {
        // 爆炸音效
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.createTone(100 + Math.random() * 200, 0.1, 'sawtooth', 0.1);
            }, i * 50);
        }
    }
    
    // 播放胜利音效
    playVictorySound() {
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C, E, G, C
        notes.forEach((note, index) => {
            setTimeout(() => {
                this.createTone(note, 0.5, 'sine', 0.1);
            }, index * 200);
        });
    }
    
    // 播放失败音效
    playDefeatSound() {
        const notes = [500, 400, 300, 200]; // 下降音阶
        notes.forEach((note, index) => {
            setTimeout(() => {
                this.createTone(note, 0.3, 'triangle', 0.08);
            }, index * 300);
        });
    }
    
    // 播放回合结束音效
    playEndTurnSound() {
        this.createTone(440, 0.2, 'sine', 0.06);
        setTimeout(() => this.createTone(554.37, 0.3, 'sine', 0.08), 200);
    }
    
    // 播放资源收集音效
    playResourceSound() {
        this.createTone(1000, 0.1, 'sine', 0.05);
        setTimeout(() => this.createTone(1200, 0.1, 'sine', 0.04), 50);
    }
    
    // 设置背景音乐（使用音调序列模拟）
    setupBackgroundMusic() {
        if (!this.musicEnabled) return;
        
        const playAmbientMusic = () => {
            if (!this.musicEnabled) return;
            
            // 播放环境音效
            const frequencies = [220, 329.63, 440, 523.25];
            const randomFreq = frequencies[Math.floor(Math.random() * frequencies.length)];
            
            this.createTone(randomFreq, 2, 'sine', 0.02);
            
            // 随机间隔播放下一个音符
            setTimeout(playAmbientMusic, 3000 + Math.random() * 2000);
        };
        
        // 延迟开始播放，避免页面加载时的音效冲突
        setTimeout(playAmbientMusic, 2000);
    }
    
    // 添加粒子系统
    addParticleSystem() {
        this.particles = [];
        this.setupParticleCanvas();
        this.animateParticles();
    }
    
    setupParticleCanvas() {
        // 创建粒子画布
        const canvas = document.createElement('canvas');
        canvas.id = 'particleCanvas';
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        `;
        document.body.appendChild(canvas);
        
        this.particleCanvas = canvas;
        this.particleCtx = canvas.getContext('2d');
        
        // 设置画布大小
        this.resizeParticleCanvas();
        window.addEventListener('resize', () => this.resizeParticleCanvas());
    }
    
    resizeParticleCanvas() {
        this.particleCanvas.width = window.innerWidth;
        this.particleCanvas.height = window.innerHeight;
    }
    
    // 创建粒子效果
    createParticles(x, y, count = 10, color = '#4a9eff') {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 1,
                decay: 0.02 + Math.random() * 0.03,
                size: 2 + Math.random() * 3,
                color: color
            });
        }
    }
    
    // 动画粒子
    animateParticles() {
        this.particleCtx.clearRect(0, 0, this.particleCanvas.width, this.particleCanvas.height);
        
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= particle.decay;
            particle.vy += 0.1; // 重力效果
            
            if (particle.life > 0) {
                this.particleCtx.save();
                this.particleCtx.globalAlpha = particle.life;
                this.particleCtx.fillStyle = particle.color;
                this.particleCtx.beginPath();
                this.particleCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.particleCtx.fill();
                this.particleCtx.restore();
                return true;
            }
            return false;
        });
        
        requestAnimationFrame(() => this.animateParticles());
    }
    
    // 添加屏幕震动效果
    addScreenShake() {
        this.shakeIntensity = 0;
        this.shakeDecay = 0.95;
        
        this.animateShake();
    }
    
    // 触发屏幕震动
    screenShake(intensity = 10) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    }
    
    // 动画屏幕震动
    animateShake() {
        if (this.shakeIntensity > 0.1) {
            const x = (Math.random() - 0.5) * this.shakeIntensity;
            const y = (Math.random() - 0.5) * this.shakeIntensity;
            
            document.body.style.transform = `translate(${x}px, ${y}px)`;
            this.shakeIntensity *= this.shakeDecay;
        } else {
            document.body.style.transform = '';
            this.shakeIntensity = 0;
        }
        
        requestAnimationFrame(() => this.animateShake());
    }
    
    // 为元素添加闪烁效果
    addGlowEffect(element, color = '#4a9eff', duration = 1000) {
        element.style.transition = `box-shadow 0.3s ease`;
        element.style.boxShadow = `0 0 20px ${color}`;
        
        setTimeout(() => {
            element.style.boxShadow = '';
        }, duration);
    }
    
    // 添加打字机效果
    typewriterEffect(element, text, speed = 50) {
        element.textContent = '';
        let i = 0;
        
        const typeInterval = setInterval(() => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                
                // 添加打字音效
                if (i % 3 === 0) {
                    this.createTone(800 + Math.random() * 200, 0.05, 'square', 0.02);
                }
            } else {
                clearInterval(typeInterval);
            }
        }, speed);
    }
    
    // 创建爆炸效果
    createExplosion(x, y) {
        this.screenShake(15);
        this.playBattleSound();
        this.createParticles(x, y, 30, '#ff6b6b');
        
        // 添加光圈效果
        const explosionRing = document.createElement('div');
        explosionRing.style.cssText = `
            position: fixed;
            left: ${x - 50}px;
            top: ${y - 50}px;
            width: 100px;
            height: 100px;
            border: 3px solid #ff6b6b;
            border-radius: 50%;
            pointer-events: none;
            z-index: 1000;
            animation: explode 0.5s ease-out forwards;
        `;
        
        document.body.appendChild(explosionRing);
        
        setTimeout(() => explosionRing.remove(), 500);
    }
    
    // 创建成功效果
    createSuccessEffect(element) {
        this.playBuildSound();
        this.addGlowEffect(element, '#4ecdc4');
        
        const rect = element.getBoundingClientRect();
        this.createParticles(
            rect.left + rect.width / 2, 
            rect.top + rect.height / 2, 
            15, 
            '#4ecdc4'
        );
    }
    
    // 创建建造动画效果
    createBuildingAnimation(element) {
        // 添加建造动画类
        element.classList.add('building-constructing');
        
        // 创建建造波纹效果
        const rect = element.getBoundingClientRect();
        const ripple = document.createElement('div');
        ripple.className = 'build-effect';
        ripple.style.left = (rect.left + rect.width / 2 - 50) + 'px';
        ripple.style.top = (rect.top + rect.height / 2 - 50) + 'px';
        
        document.body.appendChild(ripple);
        
        // 播放建造音效
        this.playBuildSound();
        
        // 创建粒子效果
        this.createParticles(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
            20,
            '#4ecdc4'
        );
        
        // 清理动画
        setTimeout(() => {
            element.classList.remove('building-constructing');
            ripple.remove();
        }, 1500);
    }
    
    // 创建建造进度条
    createProgressBar(element, duration = 2000) {
        const progressContainer = document.createElement('div');
        progressContainer.className = 'construction-progress';
        
        const progressBar = document.createElement('div');
        progressBar.className = 'construction-progress-bar';
        progressBar.style.width = '0%';
        
        progressContainer.appendChild(progressBar);
        element.appendChild(progressContainer);
        
        // 动画进度条
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            progressBar.style.width = progress + '%';
            
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    progressContainer.remove();
                }, 500);
            }
        }, duration / 20);
        
        return progressContainer;
    }
    
    // 创建资源收集效果
    createResourceEffect(element, resourceType) {
        this.playResourceSound();
        
        const colors = {
            energy: '#ffd93d',
            research: '#4a9eff',
            materials: '#74b9ff',
            population: '#4ecdc4'
        };
        
        const color = colors[resourceType] || '#ffffff';
        this.addGlowEffect(element, color, 500);
        
        const rect = element.getBoundingClientRect();
        this.createParticles(
            rect.left + rect.width / 2, 
            rect.top + rect.height / 2, 
            8, 
            color
        );
    }
    
    // 切换音乐
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        return this.musicEnabled;
    }
    
    // 切换音效
    toggleSFX() {
        this.sfxEnabled = !this.sfxEnabled;
        return this.sfxEnabled;
    }
}

// 添加爆炸动画CSS
const explosionStyle = document.createElement('style');
explosionStyle.textContent = `
    @keyframes explode {
        0% {
            transform: scale(0);
            opacity: 1;
        }
        100% {
            transform: scale(3);
            opacity: 0;
        }
    }
    
    @keyframes resourcePulse {
        0%, 100% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.1);
        }
    }
    
    .resource-effect {
        animation: resourcePulse 0.3s ease;
    }
    
    @keyframes buildingConstruct {
        0% {
            transform: scale(0) rotate(0deg);
            opacity: 0;
        }
        50% {
            transform: scale(1.2) rotate(180deg);
            opacity: 0.8;
        }
        100% {
            transform: scale(1) rotate(360deg);
            opacity: 1;
        }
    }
    
    .building-construct {
        animation: buildingConstruct 0.5s ease;
    }
`;
document.head.appendChild(explosionStyle);

// 导出管理器
window.AudioEffectsManager = AudioEffectsManager;
