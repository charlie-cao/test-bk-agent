class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 设置满屏画布
        this.setupFullscreenCanvas();
        
        this.gridSize = 20;
        this.tileCount = {
            x: this.canvas.width / this.gridSize,
            y: this.canvas.height / this.gridSize
        };
        
        // 游戏状态
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameOver = false;
        
        // 蛇的初始状态
        this.snake = [
            {x: Math.floor(this.tileCount.x / 2), y: Math.floor(this.tileCount.y / 2)}
        ];
        this.snakeLength = 1;
        
        // 移动方向
        this.dx = 0;
        this.dy = 0;
        this.targetDx = 0;
        this.targetDy = 0;
        
        // 食物位置
        this.food = this.generateFood();
        
        // 分数和等级
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.userLevel = 1;
        
        // 游戏速度
        this.gameSpeed = 150;
        this.lastTime = 0;
        
        // 鼠标位置
        this.mouseX = 0;
        this.mouseY = 0;
        
        // 营销功能相关
        this.isVip = localStorage.getItem('snakeVip') === 'true';
        this.checkinDays = JSON.parse(localStorage.getItem('snakeCheckinDays') || '[]');
        this.achievements = JSON.parse(localStorage.getItem('snakeAchievements') || '[]');
        this.eventActive = false;
        this.eventEndTime = Date.now() + 24 * 60 * 60 * 1000; // 24小时后结束
        
        // 充值相关
        this.userBalance = parseFloat(localStorage.getItem('snakeUserBalance') || '0.00');
        this.usdtBalance = parseFloat(localStorage.getItem('snakeUsdtBalance') || '0.00');
        
        this.init();
    }
    
    // 设置满屏画布
    setupFullscreenCanvas() {
        const resizeCanvas = () => {
            const sidebarWidth = window.innerWidth <= 1200 ? 280 : 320;
            const gameWidth = window.innerWidth - sidebarWidth;
            const gameHeight = window.innerHeight;
            
            this.canvas.width = gameWidth - 40; // 留出边距
            this.canvas.height = gameHeight - 40;
            
            // 重新计算网格
            this.tileCount = {
                x: this.canvas.width / this.gridSize,
                y: this.canvas.height / this.gridSize
            };
            
            // 重新生成食物
            if (this.food) {
                this.food = this.generateFood();
            }
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }
    
    init() {
        this.updateHighScore();
        this.setupEventListeners();
        this.updateMarketingUI();
        this.updateBalanceUI();
        this.startEventTimer();
        this.draw();
    }
    
    setupEventListeners() {
        // 鼠标移动事件
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });
        
        // 游戏按钮事件
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        
        // 营销功能事件
        document.getElementById('checkinBtn').addEventListener('click', () => this.dailyCheckin());
        document.getElementById('joinEventBtn').addEventListener('click', () => this.toggleEvent());
        document.getElementById('upgradeVipBtn').addEventListener('click', () => this.upgradeVip());
        
        // 分享按钮事件
        document.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.shareGame(e.target.dataset.platform));
        });
        
        // 充值按钮事件
        document.querySelectorAll('.recharge-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.openRechargeModal(e.target.dataset.method));
        });
        
        // 充值弹窗事件
        document.getElementById('rechargeMethod').addEventListener('change', (e) => this.updatePaymentInfo(e.target.value));
        document.getElementById('confirmRecharge').addEventListener('click', () => this.processRecharge());
        
        // 键盘事件
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.togglePause();
            }
        });
        
        // 弹窗关闭事件
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) modal.style.display = 'none';
            });
        });
        
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }
    
    // 每日签到功能
    dailyCheckin() {
        const today = new Date().toDateString();
        const checkinBtn = document.getElementById('checkinBtn');
        
        if (this.checkinDays.includes(today)) {
            this.showModal('今日已签到，明天再来吧！', 'info');
            return;
        }
        
        // 添加签到记录
        this.checkinDays.push(today);
        localStorage.setItem('snakeCheckinDays', JSON.stringify(this.checkinDays));
        
        // 给予奖励
        const reward = 50;
        this.score += reward;
        this.updateScore();
        
        // 更新UI
        this.updateMarketingUI();
        checkinBtn.disabled = true;
        checkinBtn.textContent = '已签到';
        
        this.showModal(`签到成功！获得${reward}分奖励！`, 'success');
        
        // 检查连续签到奖励
        this.checkContinuousCheckin();
    }
    
    // 检查连续签到奖励
    checkContinuousCheckin() {
        const continuousDays = this.checkinDays.length;
        if (continuousDays === 7) {
            const bonus = 200;
            this.score += bonus;
            this.updateScore();
            this.showModal(`连续签到7天！额外奖励${bonus}分！`, 'success');
        }
    }
    
    // 成就系统
    unlockAchievement(achievementId) {
        if (this.achievements.includes(achievementId)) return;
        
        this.achievements.push(achievementId);
        localStorage.setItem('snakeAchievements', JSON.stringify(this.achievements));
        
        const achievementNames = {
            'first-food': '初次进食',
            'score-100': '百分达人',
            'snake-10': '长蛇之王'
        };
        
        const reward = 100;
        this.score += reward;
        this.updateScore();
        
        this.showModal(`🎉 解锁成就：${achievementNames[achievementId]}！获得${reward}分奖励！`, 'achievement');
        this.updateMarketingUI();
    }
    
    // 限时活动
    toggleEvent() {
        const eventBtn = document.getElementById('joinEventBtn');
        
        if (this.eventActive) {
            this.eventActive = false;
            eventBtn.textContent = '参与活动';
            eventBtn.classList.remove('active');
            this.showModal('已退出限时活动', 'info');
        } else {
            this.eventActive = true;
            eventBtn.textContent = '活动中';
            eventBtn.classList.add('active');
            this.showModal('已加入限时活动！享受双倍得分！', 'success');
        }
    }
    
    // 分享功能
    shareGame(platform) {
        const shareText = `我在贪吃蛇游戏中获得了${this.score}分！快来挑战我吧！`;
        const shareUrl = window.location.href;
        
        let shareLink = '';
        switch (platform) {
            case 'wechat':
                shareLink = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;
                break;
            case 'qq':
                shareLink = `http://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent('贪吃蛇游戏')}&desc=${encodeURIComponent(shareText)}`;
                break;
            case 'weibo':
                shareLink = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`;
                break;
        }
        
        if (shareLink) {
            window.open(shareLink, '_blank');
            
            // 给予分享奖励
            const reward = 20;
            this.score += reward;
            this.updateScore();
            
            this.showModal(`分享成功！获得${reward}分奖励！`, 'success');
        }
    }
    
    // VIP升级
    upgradeVip() {
        if (this.isVip) {
            this.showModal('您已经是VIP用户了！', 'info');
            return;
        }
        
        if (this.userBalance < 9.9) {
            this.showModal('余额不足，请先充值！', 'error');
            return;
        }
        
        // 扣除余额
        this.userBalance -= 9.9;
        this.isVip = true;
        localStorage.setItem('snakeVip', 'true');
        localStorage.setItem('snakeUserBalance', this.userBalance.toFixed(2));
        
        this.updateMarketingUI();
        this.updateBalanceUI();
        this.showModal('🎉 VIP升级成功！享受专属特权！', 'success');
    }
    
    // 打开充值弹窗
    openRechargeModal(method) {
        const modal = document.getElementById('rechargeModal');
        const methodSelect = document.getElementById('rechargeMethod');
        
        methodSelect.value = method;
        this.updatePaymentInfo(method);
        
        modal.style.display = 'block';
    }
    
    // 更新支付信息
    updatePaymentInfo(method) {
        const paymentInfo = document.getElementById('paymentInfo');
        
        switch (method) {
            case 'credit':
                paymentInfo.innerHTML = `
                    <div>
                        <p>💳 信用卡支付</p>
                        <p style="font-size: 0.8em; color: #95a5a6;">支持Visa、MasterCard、American Express</p>
                    </div>
                `;
                break;
            case 'usd':
                paymentInfo.innerHTML = `
                    <div>
                        <p>💵 美元支付</p>
                        <p style="font-size: 0.8em; color: #95a5a6;">通过PayPal或银行转账</p>
                    </div>
                `;
                break;
            case 'usdt':
                paymentInfo.innerHTML = `
                    <div>
                        <p>₮ USDT支付</p>
                        <p style="font-size: 0.8em; color: #95a5a6;">TRC20网络，地址：TQn9Y2khDD95J42FQtQTdwVVRqjLPqjqW</p>
                    </div>
                `;
                break;
        }
    }
    
    // 处理充值
    processRecharge() {
        const amount = parseFloat(document.getElementById('rechargeAmount').value);
        const method = document.getElementById('rechargeMethod').value;
        
        if (!amount || amount <= 0) {
            this.showModal('请输入有效金额！', 'error');
            return;
        }
        
        // 模拟充值处理
        this.showModal('正在处理充值请求...', 'info');
        
        setTimeout(() => {
            switch (method) {
                case 'credit':
                case 'usd':
                    this.userBalance += amount;
                    localStorage.setItem('snakeUserBalance', this.userBalance.toFixed(2));
                    this.showModal(`充值成功！余额增加 $${amount.toFixed(2)}`, 'success');
                    break;
                case 'usdt':
                    this.usdtBalance += amount;
                    localStorage.setItem('snakeUsdtBalance', this.usdtBalance.toFixed(2));
                    this.showModal(`充值成功！USDT余额增加 ${amount.toFixed(2)}`, 'success');
                    break;
            }
            
            this.updateBalanceUI();
            document.getElementById('rechargeModal').style.display = 'none';
            document.getElementById('rechargeAmount').value = '';
        }, 2000);
    }
    
    // 显示弹窗
    showModal(message, type = 'info') {
        const modal = document.getElementById('modal');
        const modalContent = document.getElementById('modalContent');
        
        let icon = 'ℹ️';
        let title = '提示';
        
        switch (type) {
            case 'success':
                icon = '✅';
                title = '成功';
                break;
            case 'achievement':
                icon = '🏆';
                title = '成就解锁';
                break;
            case 'error':
                icon = '❌';
                title = '错误';
                break;
        }
        
        modalContent.innerHTML = `
            <h2>${icon} ${title}</h2>
            <p>${message}</p>
        `;
        
        modal.style.display = 'block';
        
        // 3秒后自动关闭
        setTimeout(() => {
            modal.style.display = 'none';
        }, 3000);
    }
    
    // 更新营销功能UI
    updateMarketingUI() {
        this.updateCheckinUI();
        this.updateAchievementsUI();
        this.updateVipUI();
    }
    
    // 更新余额UI
    updateBalanceUI() {
        document.getElementById('userBalance').textContent = `$${this.userBalance.toFixed(2)}`;
        document.getElementById('usdtBalance').textContent = this.usdtBalance.toFixed(2);
    }
    
    // 更新签到UI
    updateCheckinUI() {
        const today = new Date().toDateString();
        const checkinBtn = document.getElementById('checkinBtn');
        
        // 更新签到天数显示
        this.checkinDays.forEach(day => {
            const dayElement = document.querySelector(`[data-day="${this.checkinDays.indexOf(day) + 1}"]`);
            if (dayElement) {
                dayElement.classList.add('checked');
            }
        });
        
        // 更新签到按钮状态
        if (this.checkinDays.includes(today)) {
            checkinBtn.disabled = true;
            checkinBtn.textContent = '已签到';
        }
    }
    
    // 更新成就UI
    updateAchievementsUI() {
        this.achievements.forEach(achievementId => {
            const achievementElement = document.querySelector(`[data-id="${achievementId}"]`);
            if (achievementElement) {
                achievementElement.classList.add('unlocked');
            }
        });
    }
    
    // 更新VIP UI
    updateVipUI() {
        const vipStatus = document.getElementById('vipStatus');
        const upgradeBtn = document.getElementById('upgradeVipBtn');
        
        if (this.isVip) {
            vipStatus.textContent = 'VIP用户';
            vipStatus.style.color = '#f1c40f';
            upgradeBtn.textContent = 'VIP已激活';
            upgradeBtn.disabled = true;
        } else {
            vipStatus.textContent = '免费用户';
            upgradeBtn.textContent = '升级VIP';
            upgradeBtn.disabled = false;
        }
    }
    
    // 开始活动计时器
    startEventTimer() {
        setInterval(() => {
            const now = Date.now();
            const timeLeft = this.eventEndTime - now;
            
            if (timeLeft <= 0) {
                this.eventEndTime = now + 24 * 60 * 60 * 1000; // 重置为24小时
                this.eventActive = false;
                this.updateMarketingUI();
            }
            
            // 更新倒计时显示
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            
            document.getElementById('eventTime').textContent = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }
    
    startGame() {
        if (!this.gameRunning) {
            this.gameRunning = true;
            this.gameOver = false;
            this.gamePaused = false;
            this.hideGameOverlay();
            this.gameLoop();
        }
    }
    
    togglePause() {
        if (this.gameRunning && !this.gameOver) {
            this.gamePaused = !this.gamePaused;
            if (this.gamePaused) {
                this.showGameOverlay('游戏暂停', '按空格键继续游戏');
            } else {
                this.hideGameOverlay();
                this.gameLoop();
            }
        }
    }
    
    restartGame() {
        this.snake = [{x: Math.floor(this.tileCount.x / 2), y: Math.floor(this.tileCount.y / 2)}];
        this.snakeLength = 1;
        this.dx = 0;
        this.dy = 0;
        this.targetDx = 0;
        this.targetDy = 0;
        this.food = this.generateFood();
        this.score = 0;
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameOver = false;
        this.hideGameOverlay();
        this.updateScore();
        this.updateSnakeLength();
        this.draw();
    }
    
    // 显示游戏覆盖层
    showGameOverlay(title, message) {
        const overlay = document.getElementById('gameOverlay');
        const titleElement = document.getElementById('overlayTitle');
        const messageElement = document.getElementById('overlayMessage');
        
        titleElement.textContent = title;
        messageElement.textContent = message;
        overlay.style.display = 'flex';
    }
    
    // 隐藏游戏覆盖层
    hideGameOverlay() {
        document.getElementById('gameOverlay').style.display = 'none';
    }
    
    gameLoop(currentTime = 0) {
        if (!this.gameRunning || this.gamePaused || this.gameOver) {
            return;
        }
        
        if (currentTime - this.lastTime > this.gameSpeed) {
            this.update();
            this.draw();
            this.lastTime = currentTime;
        }
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update() {
        // 根据鼠标位置计算目标方向
        this.calculateDirection();
        
        // 更新蛇的位置
        const head = {x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy};
        
        // 检查边界碰撞
        if (head.x < 0 || head.x >= this.tileCount.x || head.y < 0 || head.y >= this.tileCount.y) {
            this.gameOver = true;
            this.showGameOverlay('游戏结束!', `最终得分: ${this.score}`);
            return;
        }
        
        // 检查自身碰撞
        for (let i = 0; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                this.gameOver = true;
                this.showGameOverlay('游戏结束!', `最终得分: ${this.score}`);
                return;
            }
        }
        
        // 移动蛇
        this.snake.unshift(head);
        
        // 检查是否吃到食物
        if (head.x === this.food.x && head.y === this.food.y) {
            this.snakeLength++;
            
            // 计算得分（VIP和活动加成）
            let baseScore = 10;
            if (this.isVip) baseScore *= 2;
            if (this.eventActive) baseScore *= 2;
            
            this.score += baseScore;
            this.updateScore();
            this.updateSnakeLength();
            this.food = this.generateFood();
            
            // 检查成就
            this.checkAchievements();
            
            // 检查等级提升
            this.checkLevelUp();
            
            // 增加游戏速度
            if (this.gameSpeed > 50) {
                this.gameSpeed -= 2;
            }
        } else {
            this.snake.pop();
        }
        
        // 保持蛇的长度
        while (this.snake.length > this.snakeLength) {
            this.snake.pop();
        }
    }
    
    // 检查等级提升
    checkLevelUp() {
        const newLevel = Math.floor(this.score / 100) + 1;
        if (newLevel > this.userLevel) {
            this.userLevel = newLevel;
            document.getElementById('userLevel').textContent = this.userLevel;
            this.showModal(`🎉 等级提升到 ${this.userLevel}！`, 'success');
        }
    }
    
    // 检查成就
    checkAchievements() {
        // 初次进食成就
        if (this.snakeLength === 2) {
            this.unlockAchievement('first-food');
        }
        
        // 百分达人成就
        if (this.score >= 100 && this.score < 110) {
            this.unlockAchievement('score-100');
        }
        
        // 长蛇之王成就
        if (this.snakeLength >= 10 && this.snakeLength < 11) {
            this.unlockAchievement('snake-10');
        }
    }
    
    calculateDirection() {
        if (this.snake.length === 0) return;
        
        const head = this.snake[0];
        const centerX = head.x * this.gridSize + this.gridSize / 2;
        const centerY = head.y * this.gridSize + this.gridSize / 2;
        
        const deltaX = this.mouseX - centerX;
        const deltaY = this.mouseY - centerY;
        
        // 计算角度
        const angle = Math.atan2(deltaY, deltaX);
        
        // 将角度转换为方向
        let newDx = 0;
        let newDy = 0;
        
        if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                newDx = deltaX > 0 ? 1 : -1;
                newDy = 0;
            } else {
                newDx = 0;
                newDy = deltaY > 0 ? 1 : -1;
            }
            
            // 防止反向移动
            if (!(newDx === -this.dx && newDy === -this.dy)) {
                this.targetDx = newDx;
                this.targetDy = newDy;
            }
        }
        
        // 平滑方向变化
        if (this.targetDx !== 0 || this.targetDy !== 0) {
            this.dx = this.targetDx;
            this.dy = this.targetDy;
        }
    }
    
    generateFood() {
        let food;
        do {
            food = {
                x: Math.floor(Math.random() * this.tileCount.x),
                y: Math.floor(Math.random() * this.tileCount.y)
            };
        } while (this.snake.some(segment => segment.x === food.x && segment.y === food.y));
        
        return food;
    }
    
    draw() {
        // 清空画布
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格
        this.drawGrid();
        
        // 绘制蛇
        this.drawSnake();
        
        // 绘制食物
        this.drawFood();
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 0.5;
        
        for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    drawSnake() {
        this.snake.forEach((segment, index) => {
            if (index === 0) {
                // 蛇头
                this.ctx.fillStyle = this.isVip ? '#f1c40f' : '#e74c3c';
                this.ctx.fillRect(segment.x * this.gridSize + 2, segment.y * this.gridSize + 2, this.gridSize - 4, this.gridSize - 4);
                
                // 眼睛
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillRect(segment.x * this.gridSize + 6, segment.y * this.gridSize + 6, 3, 3);
                this.ctx.fillRect(segment.x * this.gridSize + 11, segment.y * this.gridSize + 6, 3, 3);
            } else {
                // 蛇身
                const alpha = 1 - (index / this.snake.length) * 0.5;
                this.ctx.fillStyle = this.isVip ? 
                    `rgba(241, 196, 15, ${alpha})` : 
                    `rgba(231, 76, 60, ${alpha})`;
                this.ctx.fillRect(segment.x * this.gridSize + 2, segment.y * this.gridSize + 2, this.gridSize - 4, this.gridSize - 4);
            }
        });
    }
    
    drawFood() {
        this.ctx.fillStyle = this.eventActive ? '#9b59b6' : '#2ecc71';
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * this.gridSize + this.gridSize / 2,
            this.food.y * this.gridSize + this.gridSize / 2,
            this.gridSize / 2 - 2,
            0,
            2 * Math.PI
        );
        this.ctx.fill();
        
        // 食物高光
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * this.gridSize + this.gridSize / 2 - 3,
            this.food.y * this.gridSize + this.gridSize / 2 - 3,
            2,
            0,
            2 * Math.PI
        );
        this.ctx.fill();
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
            this.updateHighScore();
        }
    }
    
    updateSnakeLength() {
        document.getElementById('snakeLength').textContent = this.snakeLength;
    }
    
    updateHighScore() {
        document.getElementById('highScore').textContent = this.highScore;
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
});
