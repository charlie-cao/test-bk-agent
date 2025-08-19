// 飞船动画管理器
class ShipAnimationManager {
    constructor(audioEffects) {
        this.audioEffects = audioEffects;
        this.ships = new Map(); // 存储所有飞船元素
        this.activeAnimations = new Map(); // 存储活跃的动画
        this.init();
    }
    
    init() {
        this.setupShipTrails();
    }
    
    // 设置飞船尾迹系统
    setupShipTrails() {
        this.trailCanvas = document.createElement('canvas');
        this.trailCanvas.id = 'shipTrailCanvas';
        this.trailCanvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 5;
        `;
        document.body.appendChild(this.trailCanvas);
        
        this.trailCtx = this.trailCanvas.getContext('2d');
        this.resizeTrailCanvas();
        window.addEventListener('resize', () => this.resizeTrailCanvas());
        
        this.trails = [];
        this.animateTrails();
    }
    
    resizeTrailCanvas() {
        this.trailCanvas.width = window.innerWidth;
        this.trailCanvas.height = window.innerHeight;
    }
    
    // 创建飞船元素
    createShip(planetElement, shipType = 'fighter', fleetSize = 1) {
        const rect = planetElement.getBoundingClientRect();
        const shipContainer = document.createElement('div');
        shipContainer.className = 'ship-container';
        shipContainer.style.cssText = `
            position: absolute;
            left: ${rect.left + rect.width / 2}px;
            top: ${rect.top + rect.height / 2}px;
            width: 0;
            height: 0;
            z-index: 10;
        `;
        
        // 创建多艘飞船
        for (let i = 0; i < Math.min(fleetSize, 5); i++) {
            const ship = document.createElement('div');
            ship.className = `ship ${shipType}`;
            ship.innerHTML = this.getShipIcon(shipType);
            
            // 为每艘飞船设置不同的轨道延迟
            ship.style.animationDelay = `${i * 0.5}s`;
            shipContainer.appendChild(ship);
            
            // 存储飞船信息
            const shipId = `ship_${Date.now()}_${i}`;
            this.ships.set(shipId, {
                element: ship,
                type: shipType,
                planetElement: planetElement,
                container: shipContainer
            });
        }
        
        document.body.appendChild(shipContainer);
        return shipContainer;
    }
    
    // 获取飞船图标
    getShipIcon(shipType) {
        const icons = {
            scout: '🛸',
            fighter: '✈️',
            cruiser: '🚀',
            battleship: '🛰️'
        };
        return icons[shipType] || '🚀';
    }
    
    // 开始轨道飞行动画
    startOrbitAnimation(shipContainer, speed = 'normal') {
        const ships = shipContainer.querySelectorAll('.ship');
        ships.forEach((ship, index) => {
            ship.classList.remove('fast-orbiting', 'orbiting');
            ship.classList.add(speed === 'fast' ? 'fast-orbiting' : 'orbiting');
            
            // 为每艘飞船添加不同的起始角度
            ship.style.transform = `rotate(${index * 72}deg) translateX(40px) rotate(${-index * 72}deg)`;
        });
        
        this.activeAnimations.set(shipContainer, 'orbit');
    }
    
    // 停止轨道飞行
    stopOrbitAnimation(shipContainer) {
        const ships = shipContainer.querySelectorAll('.ship');
        ships.forEach(ship => {
            ship.classList.remove('orbiting', 'fast-orbiting');
        });
        
        this.activeAnimations.delete(shipContainer);
    }
    
    // 创建攻击动画
    createAttackAnimation(attackerShips, targetPlanet) {
        const targetRect = targetPlanet.getBoundingClientRect();
        const targetX = targetRect.left + targetRect.width / 2;
        const targetY = targetRect.top + targetRect.height / 2;
        
        attackerShips.forEach((shipContainer, index) => {
            setTimeout(() => {
                this.animateShipAttack(shipContainer, targetX, targetY);
            }, index * 200);
        });
    }
    
    // 单个飞船攻击动画
    animateShipAttack(shipContainer, targetX, targetY) {
        const ships = shipContainer.querySelectorAll('.ship');
        const containerRect = shipContainer.getBoundingClientRect();
        
        ships.forEach((ship, index) => {
            setTimeout(() => {
                // 停止轨道动画
                ship.classList.remove('orbiting', 'fast-orbiting');
                
                // 计算攻击路径
                const startX = containerRect.left + containerRect.width / 2;
                const startY = containerRect.top + containerRect.height / 2;
                
                // 创建攻击路径动画
                this.animateShipToTarget(ship, startX, startY, targetX, targetY, () => {
                    // 攻击完成后返回轨道
                    setTimeout(() => {
                        this.returnShipToOrbit(ship, shipContainer);
                    }, 500);
                });
                
                // 创建激光效果
                setTimeout(() => {
                    this.createLaserEffect(startX, startY, targetX, targetY);
                }, 800);
                
            }, index * 100);
        });
        
        // 播放攻击音效
        this.audioEffects.playBattleSound();
    }
    
    // 飞船移动到目标动画
    animateShipToTarget(ship, startX, startY, targetX, targetY, onComplete) {
        const distance = Math.sqrt(Math.pow(targetX - startX, 2) + Math.pow(targetY - startY, 2));
        const duration = Math.min(distance / 200, 2) * 1000; // 根据距离计算持续时间
        
        ship.style.transition = `transform ${duration}ms ease-in-out`;
        ship.style.transform = `translate(${targetX - startX}px, ${targetY - startY}px) scale(1.2)`;
        
        // 添加攻击动画类
        ship.classList.add('attacking');
        
        // 创建尾迹效果
        this.createShipTrail(startX, startY, targetX, targetY);
        
        setTimeout(() => {
            ship.classList.remove('attacking');
            if (onComplete) onComplete();
        }, duration);
    }
    
    // 飞船返回轨道
    returnShipToOrbit(ship, shipContainer) {
        ship.style.transition = 'transform 1s ease-out';
        ship.style.transform = '';
        
        setTimeout(() => {
            ship.style.transition = '';
            ship.classList.add('orbiting');
        }, 1000);
    }
    
    // 创建激光效果
    createLaserEffect(startX, startY, targetX, targetY) {
        const laser = document.createElement('div');
        laser.className = 'laser-beam';
        
        const angle = Math.atan2(targetY - startY, targetX - startX);
        const distance = Math.sqrt(Math.pow(targetX - startX, 2) + Math.pow(targetY - startY, 2));
        
        laser.style.cssText = `
            left: ${startX}px;
            top: ${startY}px;
            width: ${distance}px;
            transform: rotate(${angle}rad);
            transform-origin: 0 50%;
        `;
        
        document.body.appendChild(laser);
        
        // 播放激光音效
        this.audioEffects.createTone(800, 0.2, 'sawtooth', 0.1);
        
        setTimeout(() => laser.remove(), 300);
    }
    
    // 创建飞船尾迹
    createShipTrail(startX, startY, targetX, targetY) {
        const steps = 10;
        for (let i = 0; i < steps; i++) {
            setTimeout(() => {
                const progress = i / steps;
                const x = startX + (targetX - startX) * progress;
                const y = startY + (targetY - startY) * progress;
                
                this.trails.push({
                    x: x,
                    y: y,
                    life: 1,
                    decay: 0.05,
                    size: 3
                });
            }, i * 50);
        }
    }
    
    // 动画尾迹
    animateTrails() {
        this.trailCtx.clearRect(0, 0, this.trailCanvas.width, this.trailCanvas.height);
        
        this.trails = this.trails.filter(trail => {
            trail.life -= trail.decay;
            
            if (trail.life > 0) {
                this.trailCtx.save();
                this.trailCtx.globalAlpha = trail.life;
                this.trailCtx.fillStyle = '#4a9eff';
                this.trailCtx.beginPath();
                this.trailCtx.arc(trail.x, trail.y, trail.size * trail.life, 0, Math.PI * 2);
                this.trailCtx.fill();
                this.trailCtx.restore();
                return true;
            }
            return false;
        });
        
        requestAnimationFrame(() => this.animateTrails());
    }
    
    // 飞船发射动画
    launchShip(planetElement, shipType, targetPlanet) {
        const shipContainer = this.createShip(planetElement, shipType, 1);
        const ship = shipContainer.querySelector('.ship');
        
        // 添加发射动画
        ship.classList.add('launching');
        
        // 播放发射音效
        this.audioEffects.createTone(400, 0.5, 'sawtooth', 0.08);
        
        setTimeout(() => {
            ship.classList.remove('launching');
            this.startOrbitAnimation(shipContainer);
        }, 1000);
        
        return shipContainer;
    }
    
    // 移除飞船
    removeShip(shipContainer) {
        const ships = shipContainer.querySelectorAll('.ship');
        
        ships.forEach((ship, index) => {
            setTimeout(() => {
                ship.style.transition = 'all 0.5s ease-out';
                ship.style.transform = 'scale(0) rotate(360deg)';
                ship.style.opacity = '0';
            }, index * 100);
        });
        
        setTimeout(() => {
            if (shipContainer.parentNode) {
                shipContainer.parentNode.removeChild(shipContainer);
            }
            this.activeAnimations.delete(shipContainer);
        }, 1000);
    }
    
    // 更新飞船位置（当星球移动时）
    updateShipPositions() {
        this.ships.forEach((shipData, shipId) => {
            const planetRect = shipData.planetElement.getBoundingClientRect();
            shipData.container.style.left = (planetRect.left + planetRect.width / 2) + 'px';
            shipData.container.style.top = (planetRect.top + planetRect.height / 2) + 'px';
        });
    }
    
    // 获取星球周围的飞船
    getShipsAroundPlanet(planetElement) {
        const ships = [];
        this.ships.forEach((shipData, shipId) => {
            if (shipData.planetElement === planetElement) {
                ships.push(shipData.container);
            }
        });
        return ships;
    }
    
    // 清理所有飞船
    clearAllShips() {
        this.ships.forEach((shipData) => {
            if (shipData.container.parentNode) {
                shipData.container.parentNode.removeChild(shipData.container);
            }
        });
        this.ships.clear();
        this.activeAnimations.clear();
    }
}

// 导出管理器
window.ShipAnimationManager = ShipAnimationManager;
