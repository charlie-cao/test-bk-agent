// 星际殖民战争 - 游戏逻辑
class SpaceColonyGame {
	constructor() {
		this.audioEffects = new AudioEffectsManager();
		this.shipAnimations = new ShipAnimationManager(this.audioEffects);
		this.visualEffects = new VisualEffectsManager();
		window.visualEffects = this.visualEffects;
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
			gamePhase: 'playing', // playing, battle, victory, defeat
			difficulty: 'normal',
			theme: 'dark'
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
		this.createAdditionalUI();
		this.applyTheme(this.gameState.theme || 'dark');
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
				// 触发建筑建造特效
				document.dispatchEvent(new CustomEvent('buildingConstructed', {
					detail: { element: planetElement, type: buildingType }
				}));
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

	// ... existing code ...
}