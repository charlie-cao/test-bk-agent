// 星际殖民战争 - 游戏逻辑
class SpaceColonyGame {
    constructor() {
        this.audioEffects = new AudioEffectsManager();
        this.shipAnimations = new ShipAnimationManager(this.audioEffects);
        this.gameState = {
            turn: 1,
            resources: {
                energy: 1000,
                research: 500,
                materials: 800,
                population: 1200
            },
            planets: [],
            fleets: [],
            technologies: [],
            selectedPlanet: null,
            gamePhase: 'playing' // playing, battle, victory, defeat
        };
        
        this.planetTypes = [
            { type: 'terran', name: '类地行星', baseProduction: { energy: 50, materials: 30, population: 100 }},
            { type: 'desert', name: '沙漠行星', baseProduction: { energy: 80, materials: 20, population: 50 }},
            { type: 'ice', name: '冰雪行星', baseProduction: { energy: 30, materials: 60, population: 30 }},
            { type: 'volcanic', name: '火山行星', baseProduction: { energy: 100, materials: 80, population: 20 }},
            { type: 'gas', name: '气体行星', baseProduction: { energy: 200, research: 100, population: 0 }}
        ];
        
        this.buildings = {
            'power_plant': { name: '能源发电站', cost: { energy: 200, materials: 100 }, production: { energy: 30 }, limit: 5 },
            'research_lab': { name: '研究实验室', cost: { energy: 300, materials: 200 }, production: { research: 25 }, limit: 3 },
            'mining_facility': { name: '采矿设施', cost: { energy: 250, materials: 150 }, production: { materials: 35 }, limit: 4 },
            'habitat': { name: '居住舱', cost: { energy: 150, materials: 120 }, production: { population: 80 }, limit: 6 },
            'shipyard': { name: '造船厂', cost: { energy: 500, materials: 400 }, production: {}, limit: 2 },
            'defense_system': { name: '防御系统', cost: { energy: 400, materials: 300 }, production: {}, limit: 3 }
        };
        
        this.shipTypes = {
            'scout': { name: '侦察舰', cost: { energy: 100 }, attack: 5, defense: 10, speed: 3 },
            'fighter': { name: '战斗机', cost: { energy: 200, materials: 150 }, attack: 15, defense: 20, speed: 2 },
            'cruiser': { name: '巡洋舰', cost: { energy: 500, materials: 400 }, attack: 35, defense: 45, speed: 1 },
            'battleship': { name: '战列舰', cost: { energy: 1000, materials: 800 }, attack: 60, defense: 80, speed: 1 }
        };
        
        this.techTree = [
            { id: 'advanced_energy', name: '高级能源技术', cost: { research: 300 }, effect: 'energy_boost', researched: false, researching: false },
            { id: 'mining_efficiency', name: '采矿效率', cost: { research: 250 }, effect: 'mining_boost', researched: false, researching: false },
            { id: 'ship_armor', name: '舰船装甲', cost: { research: 400 }, effect: 'defense_boost', researched: false, researching: false },
            { id: 'weapon_systems', name: '武器系统', cost: { research: 500 }, effect: 'attack_boost', researched: false, researching: false },
            { id: 'faster_travel', name: '快速航行', cost: { research: 350 }, effect: 'speed_boost', researched: false, researching: false },
            { id: 'population_growth', name: '人口增长', cost: { research: 200 }, effect: 'population_boost', researched: false, researching: false }
        ];
        
        this.init();
    }
    
    init() {
        this.generateGalaxy();
        this.setupEventListeners();
        this.updateUI();
        this.setupInitialShips();
        this.gameLoop();
    }
    
    setupInitialShips() {
        // 为玩家的初始舰队创建飞船动画
        setTimeout(() => {
            const playerPlanets = this.gameState.planets.filter(p => p.owner === 'player');
            playerPlanets.forEach(planet => {
                const planetElement = document.querySelector(`[data-planet-id="${planet.id}"]`);
                if (planetElement) {
                    // 为每个玩家星球创建巡逻舰队
                    const shipContainer = this.shipAnimations.createShip(planetElement, 'fighter', 2);
                    this.shipAnimations.startOrbitAnimation(shipContainer);
                }
            });
            
            // 为敌方星球也创建一些飞船
            const enemyPlanets = this.gameState.planets.filter(p => p.owner === 'enemy');
            enemyPlanets.forEach(planet => {
                const planetElement = document.querySelector(`[data-planet-id="${planet.id}"]`);
                if (planetElement && Math.random() > 0.5) {
                    const shipContainer = this.shipAnimations.createShip(planetElement, 'fighter', 1);
                    this.shipAnimations.startOrbitAnimation(shipContainer);
                }
            });
        }, 2000);
    }
    
    generateGalaxy() {
        const mapContainer = document.getElementById('mapContainer');
        const mapRect = mapContainer.getBoundingClientRect();
        
        // 生成8个星球
        for (let i = 0; i < 8; i++) {
            const planetType = this.planetTypes[Math.floor(Math.random() * this.planetTypes.length)];
            const planet = {
                id: i,
                name: `行星-${String.fromCharCode(65 + i)}`,
                type: planetType.type,
                typeName: planetType.name,
                x: Math.random() * 400 + 50,
                y: Math.random() * 350 + 50,
                owner: i === 0 ? 'player' : (i < 3 ? 'neutral' : 'enemy'),
                buildings: i === 0 ? ['power_plant', 'habitat'] : [],
                population: i === 0 ? 500 : Math.random() * 300 + 100,
                production: { ...planetType.baseProduction },
                defenseStrength: Math.floor(Math.random() * 50) + 20
            };
            
            this.gameState.planets.push(planet);
            this.createPlanetElement(planet);
        }
        
        // 初始舰队
        this.gameState.fleets.push({
            id: 0,
            owner: 'player',
            location: 0,
            ships: [
                { type: 'scout', count: 2 },
                { type: 'fighter', count: 1 }
            ]
        });
    }
    
    createPlanetElement(planet) {
        const mapContainer = document.getElementById('mapContainer');
        const planetEl = document.createElement('div');
        planetEl.className = `planet ${planet.type} ${planet.owner}`;
        planetEl.style.left = planet.x + 'px';
        planetEl.style.top = planet.y + 'px';
        planetEl.textContent = planet.name.split('-')[1];
        planetEl.dataset.planetId = planet.id;
        
        planetEl.addEventListener('click', () => this.selectPlanet(planet.id));
        mapContainer.appendChild(planetEl);
        
        // 添加脉冲动画
        if (planet.owner === 'player') {
            planetEl.style.animation = 'pulse 3s infinite';
        }
    }
    
    selectPlanet(planetId) {
        this.gameState.selectedPlanet = planetId;
        this.updatePlanetInfo();
        this.updateBuildingsList();
        
        // 高亮选中的星球
        document.querySelectorAll('.planet').forEach(p => p.classList.remove('selected'));
        document.querySelector(`[data-planet-id="${planetId}"]`).classList.add('selected');
    }
    
    updatePlanetInfo() {
        const planet = this.gameState.planets[this.gameState.selectedPlanet];
        if (!planet) return;
        
        const infoEl = document.getElementById('planetInfo');
        infoEl.innerHTML = `
            <h4>${planet.name} (${planet.typeName})</h4>
            <p><strong>所有者:</strong> ${this.getOwnerName(planet.owner)}</p>
            <p><strong>人口:</strong> ${Math.floor(planet.population)}</p>
            <p><strong>防御力:</strong> ${planet.defenseStrength}</p>
            <div class="production-info">
                <h5>生产力:</h5>
                ${planet.production.energy ? `<span>⚡ ${planet.production.energy}/回合</span>` : ''}
                ${planet.production.research ? `<span>🔬 ${planet.production.research}/回合</span>` : ''}
                ${planet.production.materials ? `<span>⚒️ ${planet.production.materials}/回合</span>` : ''}
                ${planet.production.population ? `<span>👥 +${planet.production.population}/回合</span>` : ''}
            </div>
        `;
    }
    
    updateBuildingsList() {
        const planet = this.gameState.planets[this.gameState.selectedPlanet];
        if (!planet || planet.owner !== 'player') {
            document.getElementById('buildingsList').innerHTML = '<p>只能管理自己的星球</p>';
            return;
        }
        
        const buildingsEl = document.getElementById('buildingsList');
        buildingsEl.innerHTML = '<h4>建筑管理</h4>';
        
        // 显示现有建筑
        planet.buildings.forEach(buildingType => {
            const building = this.buildings[buildingType];
            const buildingEl = document.createElement('div');
            buildingEl.className = 'building-item';
            buildingEl.innerHTML = `
                <span>${building.name}</span>
                <button onclick="game.destroyBuilding('${buildingType}')">拆除</button>
            `;
            buildingsEl.appendChild(buildingEl);
        });
        
        // 显示可建造的建筑
        const availableBuildings = Object.keys(this.buildings).filter(type => {
            const building = this.buildings[type];
            const currentCount = planet.buildings.filter(b => b === type).length;
            return currentCount < building.limit && this.canAfford(building.cost);
        });
        
        if (availableBuildings.length > 0) {
            const buildSectionEl = document.createElement('div');
            buildSectionEl.innerHTML = '<h5>可建造建筑:</h5>';
            
            availableBuildings.forEach(buildingType => {
                const building = this.buildings[buildingType];
                const buildBtnEl = document.createElement('button');
                buildBtnEl.className = 'build-btn';
                buildBtnEl.textContent = `建造 ${building.name} (${this.formatCost(building.cost)})`;
                buildBtnEl.onclick = () => this.constructBuilding(buildingType);
                buildSectionEl.appendChild(buildBtnEl);
            });
            
            buildingsEl.appendChild(buildSectionEl);
        }
    }
    
    constructBuilding(buildingType) {
        const planet = this.gameState.planets[this.gameState.selectedPlanet];
        const building = this.buildings[buildingType];
        
        if (this.canAfford(building.cost)) {
            this.spendResources(building.cost);
            
            // 找到星球元素并添加建造动画
            const planetElement = document.querySelector(`[data-planet-id="${planet.id}"]`);
            if (planetElement) {
                this.audioEffects.createBuildingAnimation(planetElement);
            }
            
            // 延迟添加建筑，配合动画
            setTimeout(() => {
                planet.buildings.push(buildingType);
                this.recalculatePlanetProduction(planet);
                this.updateUI();
                this.showMessage(`建造完成: ${building.name}`);
            }, 1500);
        }
    }
    
    destroyBuilding(buildingType) {
        const planet = this.gameState.planets[this.gameState.selectedPlanet];
        const index = planet.buildings.indexOf(buildingType);
        if (index > -1) {
            planet.buildings.splice(index, 1);
            this.recalculatePlanetProduction(planet);
            this.updateUI();
            this.showMessage(`已拆除: ${this.buildings[buildingType].name}`);
        }
    }
    
    recalculatePlanetProduction(planet) {
        const baseType = this.planetTypes.find(t => t.type === planet.type);
        planet.production = { ...baseType.baseProduction };
        
        planet.buildings.forEach(buildingType => {
            const building = this.buildings[buildingType];
            Object.keys(building.production).forEach(resource => {
                if (!planet.production[resource]) planet.production[resource] = 0;
                planet.production[resource] += building.production[resource];
            });
        });
        
        // 应用科技加成
        this.applyTechBonuses(planet);
    }
    
    applyTechBonuses(planet) {
        this.gameState.technologies.filter(tech => tech.researched).forEach(tech => {
            switch (tech.effect) {
                case 'energy_boost':
                    if (planet.production.energy) planet.production.energy *= 1.5;
                    break;
                case 'mining_boost':
                    if (planet.production.materials) planet.production.materials *= 1.3;
                    break;
                case 'population_boost':
                    if (planet.production.population) planet.production.population *= 1.2;
                    break;
            }
        });
    }
    
    buildShip(shipType) {
        const ship = this.shipTypes[shipType];
        const homeworlds = this.gameState.planets.filter(p => 
            p.owner === 'player' && p.buildings.includes('shipyard')
        );
        
        if (homeworlds.length === 0) {
            this.showMessage('需要造船厂才能建造舰船！');
            return;
        }
        
        if (this.canAfford(ship.cost)) {
            this.spendResources(ship.cost);
            
            // 找到玩家的舰队或创建新舰队
            let playerFleet = this.gameState.fleets.find(f => f.owner === 'player' && f.location === 0);
            if (!playerFleet) {
                playerFleet = {
                    id: this.gameState.fleets.length,
                    owner: 'player',
                    location: 0,
                    ships: []
                };
                this.gameState.fleets.push(playerFleet);
            }
            
            const existingShip = playerFleet.ships.find(s => s.type === shipType);
            if (existingShip) {
                existingShip.count++;
            } else {
                playerFleet.ships.push({ type: shipType, count: 1 });
            }
            
            // 找到有造船厂的星球并创建飞船动画
            const shipyardPlanet = homeworlds[0];
            const planetElement = document.querySelector(`[data-planet-id="${shipyardPlanet.id}"]`);
            if (planetElement) {
                this.shipAnimations.launchShip(planetElement, shipType);
            }
            
            this.updateFleetDisplay();
            this.updateUI();
            this.audioEffects.playBuildSound();
            this.showMessage(`建造完成: ${ship.name}`);
        }
    }
    
    updateFleetDisplay() {
        const fleetList = document.getElementById('fleetList');
        const playerFleets = this.gameState.fleets.filter(f => f.owner === 'player');
        
        fleetList.innerHTML = '<h4>我的舰队</h4>';
        
        playerFleets.forEach(fleet => {
            const fleetEl = document.createElement('div');
            fleetEl.className = 'fleet-item';
            
            const location = this.gameState.planets[fleet.location];
            const shipsText = fleet.ships.map(ship => 
                `${this.shipTypes[ship.type].name} x${ship.count}`
            ).join(', ');
            
            fleetEl.innerHTML = `
                <div>
                    <strong>舰队 #${fleet.id}</strong>
                    <br>位置: ${location.name}
                    <br>舰船: ${shipsText}
                </div>
                <button onclick="game.moveFleet(${fleet.id})">移动舰队</button>
            `;
            
            fleetList.appendChild(fleetEl);
        });
    }
    
    moveFleet(fleetId) {
        this.showMessage('选择目标星球来移动舰队');
        // 这里可以添加更复杂的舰队移动逻辑
    }
    
    researchTechnology(techId) {
        const tech = this.techTree.find(t => t.id === techId);
        if (tech && !tech.researched && !tech.researching && this.canAfford(tech.cost)) {
            this.spendResources(tech.cost);
            tech.researching = true;
            tech.researchProgress = 0;
            this.updateTechDisplay();
            this.updateUI();
            this.showMessage(`开始研究: ${tech.name}`);
        }
    }
    
    updateTechDisplay() {
        const techTree = document.getElementById('techTree');
        techTree.innerHTML = '';
        
        this.techTree.forEach(tech => {
            const techEl = document.createElement('div');
            techEl.className = `tech-item ${tech.researched ? 'researched' : ''} ${tech.researching ? 'researching' : ''}`;
            
            let statusText = '';
            if (tech.researched) {
                statusText = '✅ 已研究';
            } else if (tech.researching) {
                statusText = '🔬 研究中...';
            } else {
                statusText = `研究费用: ${this.formatCost(tech.cost)}`;
            }
            
            techEl.innerHTML = `
                <h5>${tech.name}</h5>
                <p>${statusText}</p>
            `;
            
            if (!tech.researched && !tech.researching) {
                techEl.addEventListener('click', () => this.researchTechnology(tech.id));
            }
            
            techTree.appendChild(techEl);
        });
    }
    
    endTurn() {
        this.audioEffects.playEndTurnSound();
        
        // 资源生产
        this.gameState.planets
            .filter(p => p.owner === 'player')
            .forEach(planet => {
                Object.keys(planet.production).forEach(resource => {
                    if (!this.gameState.resources[resource]) this.gameState.resources[resource] = 0;
                    this.gameState.resources[resource] += planet.production[resource];
                });
            });
        
        // 科技研究进度
        this.techTree.filter(t => t.researching).forEach(tech => {
            if (!tech.researchProgress) tech.researchProgress = 0;
            tech.researchProgress += 100;
            if (tech.researchProgress >= 100) {
                tech.researched = true;
                tech.researching = false;
                this.gameState.technologies.push(tech);
                this.showMessage(`研究完成: ${tech.name}`);
                
                // 重新计算所有星球的生产力（应用新科技）
                this.gameState.planets.forEach(planet => {
                    if (planet.owner === 'player') {
                        this.recalculatePlanetProduction(planet);
                    }
                });
            }
        });
        
        // 敌方AI行动
        this.enemyAI();
        
        // 人口增长
        this.gameState.planets.forEach(planet => {
            if (planet.production.population) {
                planet.population += planet.production.population * 0.1;
            }
        });
        
        this.gameState.turn++;
        this.updateUI();
        this.checkVictoryConditions();
        
        // 每5回合提供额外资源奖励
        if (this.gameState.turn % 5 === 0) {
            this.gameState.resources.energy += 200;
            this.gameState.resources.research += 100;
            this.gameState.resources.materials += 150;
            this.showMessage(`第 ${this.gameState.turn} 回合开始！获得回合奖励！`);
        } else {
            this.showMessage(`第 ${this.gameState.turn} 回合开始！`);
        }
    }
    
    enemyAI() {
        // 简单的敌方AI逻辑
        const enemyPlanets = this.gameState.planets.filter(p => p.owner === 'enemy');
        const playerPlanets = this.gameState.planets.filter(p => p.owner === 'player');
        
        // 根据回合数和难度调整敌方攻击概率
        const attackProbability = Math.min(0.15 + (this.gameState.turn - 1) * 0.02, 0.5);
        if (Math.random() < attackProbability && enemyPlanets.length > 0 && playerPlanets.length > 0) {
            const attacker = enemyPlanets[Math.floor(Math.random() * enemyPlanets.length)];
            const target = playerPlanets[Math.floor(Math.random() * playerPlanets.length)];
            
            setTimeout(() => {
                this.initiateBattle(attacker, target, 'enemy');
            }, 1000);
        }
    }
    
    initiateBattle(attackerPlanet, targetPlanet, attackerOwner) {
        // 先播放攻击动画
        this.playBattleAnimation(attackerPlanet, targetPlanet, attackerOwner);
        
        // 延迟显示战斗场景，让动画先播放
        setTimeout(() => {
            const battleScene = document.getElementById('battleScene');
            battleScene.classList.remove('hidden');
            
            // 计算战斗力
            const attackerForce = this.calculatePlanetDefense(attackerPlanet) + 
                                 Math.floor(Math.random() * 50) + 50;
            const defenderForce = this.calculatePlanetDefense(targetPlanet);
            
            document.getElementById('playerShips').innerHTML = `
                <div class="ship">🚀 防御力: ${defenderForce}</div>
            `;
            
            document.getElementById('enemyShips').innerHTML = `
                <div class="ship">👾 攻击力: ${attackerForce}</div>
            `;
            
            const battleLog = document.getElementById('battleLog');
            battleLog.innerHTML = `
                <p>${attackerPlanet.name} 正在攻击 ${targetPlanet.name}!</p>
                <p>攻击方战力: ${attackerForce}</p>
                <p>防御方战力: ${defenderForce}</p>
                <p>🎬 战斗动画已播放！</p>
            `;
            
            // 战斗按钮事件
            document.getElementById('attackBtn').onclick = () => this.resolveBattle(attackerForce, defenderForce, targetPlanet, attackerOwner);
            document.getElementById('retreatBtn').onclick = () => this.endBattle();
        }, 2000);
    }
    
    playBattleAnimation(attackerPlanet, targetPlanet, attackerOwner) {
        const attackerElement = document.querySelector(`[data-planet-id="${attackerPlanet.id}"]`);
        const targetElement = document.querySelector(`[data-planet-id="${targetPlanet.id}"]`);
        
        if (attackerElement && targetElement) {
            // 获取攻击方星球周围的飞船
            const attackerShips = this.shipAnimations.getShipsAroundPlanet(attackerElement);
            
            if (attackerShips.length === 0) {
                // 如果没有现有飞船，创建临时攻击舰队
                const tempFleet = this.shipAnimations.createShip(attackerElement, 'fighter', 3);
                this.shipAnimations.startOrbitAnimation(tempFleet, 'fast');
                attackerShips.push(tempFleet);
                
                // 攻击完成后移除临时舰队
                setTimeout(() => {
                    this.shipAnimations.removeShip(tempFleet);
                }, 5000);
            }
            
            // 执行攻击动画
            setTimeout(() => {
                this.shipAnimations.createAttackAnimation(attackerShips, targetElement);
            }, 500);
        }
    }
    
    resolveBattle(attackerForce, defenderForce, targetPlanet, attackerOwner) {
        const battleLog = document.getElementById('battleLog');
        
        // 随机因素
        const attackRoll = Math.random() * attackerForce;
        const defenseRoll = Math.random() * defenderForce;
        
        battleLog.innerHTML += `<p>战斗中... 攻击骰: ${Math.floor(attackRoll)} vs 防御骰: ${Math.floor(defenseRoll)}</p>`;
        
        setTimeout(() => {
            if (attackRoll > defenseRoll) {
                // 攻击方胜利
                targetPlanet.owner = attackerOwner;
                targetPlanet.population *= 0.7; // 人口损失
                targetPlanet.buildings = targetPlanet.buildings.slice(0, Math.floor(targetPlanet.buildings.length / 2)); // 建筑损失
                
                battleLog.innerHTML += `<p>💥 ${targetPlanet.name} 被占领！</p>`;
                
                // 更新地图显示
                const planetEl = document.querySelector(`[data-planet-id="${targetPlanet.id}"]`);
                planetEl.className = `planet ${targetPlanet.type} ${targetPlanet.owner}`;
                
                // 添加爆炸效果
                const rect = planetEl.getBoundingClientRect();
                this.audioEffects.createExplosion(rect.left + rect.width/2, rect.top + rect.height/2);
                
                // 更新星球周围的飞船
                this.updatePlanetShips(targetPlanet, planetEl);
                
                this.recalculatePlanetProduction(targetPlanet);
            } else {
                // 防御方胜利
                battleLog.innerHTML += `<p>🛡️ ${targetPlanet.name} 成功防御！</p>`;
                targetPlanet.population *= 0.9; // 轻微人口损失
                this.audioEffects.playBattleSound();
            }
            
            setTimeout(() => this.endBattle(), 2000);
        }, 1500);
    }
    
    endBattle() {
        document.getElementById('battleScene').classList.add('hidden');
        this.updateUI();
    }
    
    calculatePlanetDefense(planet) {
        let defense = planet.defenseStrength;
        defense += planet.buildings.filter(b => b === 'defense_system').length * 30;
        defense += Math.floor(planet.population / 10);
        return defense;
    }
    
    updatePlanetShips(planet, planetElement) {
        // 移除旧的飞船
        const existingShips = this.shipAnimations.getShipsAroundPlanet(planetElement);
        existingShips.forEach(ship => {
            this.shipAnimations.removeShip(ship);
        });
        
        // 根据新的所有者创建飞船
        setTimeout(() => {
            if (planet.owner === 'player' || planet.owner === 'enemy') {
                const fleetSize = planet.owner === 'player' ? 2 : 1;
                const shipContainer = this.shipAnimations.createShip(planetElement, 'fighter', fleetSize);
                this.shipAnimations.startOrbitAnimation(shipContainer);
            }
        }, 1000);
    }
    
    checkVictoryConditions() {
        const playerPlanets = this.gameState.planets.filter(p => p.owner === 'player').length;
        const enemyPlanets = this.gameState.planets.filter(p => p.owner === 'enemy').length;
        
        if (playerPlanets >= 6) {
            this.audioEffects.playVictorySound();
            this.showModal('胜利！', '恭喜！您已经征服了大部分星系！');
            this.gameState.gamePhase = 'victory';
        } else if (playerPlanets === 0) {
            this.audioEffects.playDefeatSound();
            this.showModal('失败', '您的所有星球都被占领了！游戏结束。');
            this.gameState.gamePhase = 'defeat';
        }
    }
    
    setupEventListeners() {
        // 回合结束按钮
        document.getElementById('endTurnBtn').addEventListener('click', () => this.endTurn());
        
        // 面板切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchPanel(tab);
            });
        });
        
        // 舰船建造按钮
        document.querySelectorAll('.build-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.audioEffects.playButtonClick();
                const shipType = e.target.dataset.ship;
                if (shipType) this.buildShip(shipType);
            });
        });
        
        // 保存游戏
        document.getElementById('saveGameBtn').addEventListener('click', () => this.saveGame());
        
        // 加载游戏
        document.getElementById('loadGameBtn').addEventListener('click', () => this.loadGame());
        
        // 音乐切换
        document.getElementById('musicToggle').addEventListener('click', (e) => {
            const isEnabled = this.audioEffects.toggleMusic();
            e.target.textContent = isEnabled ? '🔊 音乐' : '🔇 音乐';
            this.audioEffects.playButtonClick();
        });
        
        // 帮助按钮
        document.getElementById('helpBtn').addEventListener('click', () => this.showHelp());
        
        // 模态框关闭
        document.querySelector('.close').addEventListener('click', () => {
            document.getElementById('modal').classList.add('hidden');
        });
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            switch(e.code) {
                case 'Space':
                    e.preventDefault();
                    if (this.gameState.gamePhase === 'playing') {
                        this.endTurn();
                    }
                    break;
                case 'Escape':
                    document.getElementById('modal').classList.add('hidden');
                    document.getElementById('battleScene').classList.add('hidden');
                    break;
                case 'Tab':
                    e.preventDefault();
                    this.switchToNextPanel();
                    break;
                case 'KeyH':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.showHelp();
                    }
                    break;
                case 'KeyS':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.saveGame();
                    }
                    break;
            }
        });
    }
    
    switchPanel(tab) {
        // 切换标签页
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.panel-content').forEach(panel => panel.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(`${tab}Panel`).classList.add('active');
        
        this.audioEffects.playButtonClick();
        
        // 更新对应面板内容
        switch (tab) {
            case 'fleet':
                this.updateFleetDisplay();
                break;
            case 'research':
                this.updateTechDisplay();
                break;
            case 'diplomacy':
                this.updateDiplomacyDisplay();
                break;
        }
    }
    
    switchToNextPanel() {
        const panels = ['planets', 'fleet', 'research', 'diplomacy'];
        const currentPanel = document.querySelector('.tab-btn.active').dataset.tab;
        const currentIndex = panels.indexOf(currentPanel);
        const nextIndex = (currentIndex + 1) % panels.length;
        this.switchPanel(panels[nextIndex]);
    }
    
    updateDiplomacyDisplay() {
        const diplomacyInfo = document.getElementById('diplomacyInfo');
        const enemyPlanets = this.gameState.planets.filter(p => p.owner === 'enemy').length;
        
        if (enemyPlanets > 0) {
            diplomacyInfo.innerHTML = `
                <h4>敌对文明</h4>
                <p>发现了敌对文明，控制着 ${enemyPlanets} 个星球。</p>
                <p>目前处于战争状态。</p>
                <div class="diplomacy-actions">
                    <button class="build-btn" onclick="game.showMessage('外交功能开发中...')">尝试停火</button>
                    <button class="build-btn" onclick="game.showMessage('贸易功能开发中...')">贸易协议</button>
                </div>
            `;
        } else {
            diplomacyInfo.innerHTML = '<p>您已经消灭了所有敌对文明！</p>';
        }
    }
    
    updateUI() {
        // 更新资源显示
        document.getElementById('energy').textContent = Math.floor(this.gameState.resources.energy);
        document.getElementById('research').textContent = Math.floor(this.gameState.resources.research);
        document.getElementById('materials').textContent = Math.floor(this.gameState.resources.materials);
        document.getElementById('population').textContent = Math.floor(this.gameState.resources.population);
        document.getElementById('currentTurn').textContent = this.gameState.turn;
        
        // 更新星球信息
        if (this.gameState.selectedPlanet !== null) {
            this.updatePlanetInfo();
            this.updateBuildingsList();
        }
        
        // 更新按钮状态
        this.updateButtonStates();
    }
    
    updateButtonStates() {
        // 更新建造按钮状态
        document.querySelectorAll('.build-btn[data-ship]').forEach(btn => {
            const shipType = btn.dataset.ship;
            const ship = this.shipTypes[shipType];
            btn.disabled = !this.canAfford(ship.cost);
        });
    }
    
    canAfford(cost) {
        return Object.keys(cost).every(resource => 
            this.gameState.resources[resource] >= cost[resource]
        );
    }
    
    spendResources(cost) {
        Object.keys(cost).forEach(resource => {
            this.gameState.resources[resource] -= cost[resource];
        });
    }
    
    formatCost(cost) {
        return Object.keys(cost).map(resource => {
            const icons = { energy: '⚡', research: '🔬', materials: '⚒️', population: '👥' };
            return `${icons[resource]}${cost[resource]}`;
        }).join(' ');
    }
    
    getOwnerName(owner) {
        const names = {
            'player': '玩家',
            'enemy': '敌方',
            'neutral': '中立'
        };
        return names[owner] || owner;
    }
    
    showMessage(message) {
        // 创建临时消息提示
        const messageEl = document.createElement('div');
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(45deg, #4a9eff, #74b9ff);
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            z-index: 10000;
            font-family: 'Orbitron', monospace;
            font-weight: bold;
            box-shadow: 0 4px 15px rgba(74, 158, 255, 0.4);
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => messageEl.remove(), 300);
        }, 3000);
    }
    
    showModal(title, content) {
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modalBody');
        
        modalBody.innerHTML = `
            <h2>${title}</h2>
            <p>${content}</p>
        `;
        
        modal.classList.remove('hidden');
    }
    
    showHelp() {
        const helpContent = `
            <h2>游戏帮助</h2>
            <h3>游戏目标</h3>
            <p>征服至少6个星球来获得胜利！</p>
            
            <h3>基础操作</h3>
            <ul>
                <li>点击星球查看详细信息</li>
                <li>在自己的星球上建造建筑来提高生产力</li>
                <li>建造舰队来攻击敌方星球</li>
                <li>研发科技来获得各种加成</li>
                <li>点击"结束回合"来进入下一回合</li>
            </ul>
            
            <h3>资源说明</h3>
            <ul>
                <li>⚡ 能量 - 用于建造建筑和舰船</li>
                <li>🔬 研究点 - 用于科技研发</li>
                <li>⚒️ 材料 - 用于建造高级建筑和舰船</li>
                <li>👥 人口 - 影响星球防御力</li>
            </ul>
            
            <h3>战斗系统</h3>
            <p>当敌方攻击你的星球时，会进入战斗模式。战斗结果基于双方的综合战力，包括星球防御力、人口和防御建筑。</p>
        `;
        
        this.showModal('游戏帮助', helpContent);
    }
    
    saveGame() {
        try {
            localStorage.setItem('spaceColonyGame', JSON.stringify(this.gameState));
            this.showMessage('游戏已保存！');
        } catch (e) {
            this.showMessage('保存失败：存储空间不足');
        }
    }
    
    loadGame() {
        try {
            const savedGame = localStorage.getItem('spaceColonyGame');
            if (savedGame) {
                this.gameState = JSON.parse(savedGame);
                this.updateUI();
                this.showMessage('游戏已加载！');
                return true;
            }
        } catch (e) {
            this.showMessage('加载失败：存档数据损坏');
        }
        return false;
    }
    
    gameLoop() {
        // 游戏主循环 - 可以在这里添加动画和定时更新
        setInterval(() => {
            // 更新动画效果
            this.updateAnimations();
        }, 100);
    }
    
    updateAnimations() {
        // 为星球添加脉冲效果
        document.querySelectorAll('.planet.owned').forEach(planet => {
            if (!planet.style.animation) {
                planet.style.animation = 'pulse 3s infinite';
            }
        });
        
        // 更新飞船位置（如果星球位置发生变化）
        this.shipAnimations.updateShipPositions();
    }
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .planet.selected {
        border-color: #ffd93d !important;
        box-shadow: 0 0 30px rgba(255, 217, 61, 0.8) !important;
        transform: scale(1.1);
    }
`;
document.head.appendChild(style);

// 启动游戏
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new SpaceColonyGame();
    
    // 尝试加载保存的游戏
    if (!game.loadGame()) {
        game.showMessage('欢迎来到星际殖民战争！');
    }
});
