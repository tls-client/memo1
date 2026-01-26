// Global variables
let currentTab = 'dashboard';
let tasks = [];
let sleepData = [];
let nutritionData = [];
let exerciseData = [];
let newsArticles = [];

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadStoredData();
    showTab('dashboard');
});

function initializeApp() {
    // Initialize charts
    initializeCharts();
    
    // Load initial data
    refreshNews();
    
    // Set up periodic updates
    setInterval(updateDashboardStats, 60000); // Update every minute
}

function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('tab-active');
    });
    
    // Show selected tab
    document.getElementById(tabName).classList.remove('hidden');
    
    // Add active class to selected button
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('tab-active');
    
    currentTab = tabName;
    
    // Update tab-specific content
    updateTabContent(tabName);
}

function updateTabContent(tabName) {
    switch(tabName) {
        case 'dashboard':
            updateDashboardStats();
            break;
        case 'sleep':
            updateSleepChart();
            break;
        case 'exercise':
            updateExerciseChart();
            break;
        case 'logs':
            showLogPeriod('day');
            break;
    }
}

// Tab switching functions
function updateSleepQuality(value) {
    document.getElementById('quality-value').textContent = value;
}

function saveSleepData() {
    const bedtime = document.getElementById('bedtime').value;
    const waketime = document.getElementById('waketime').value;
    const sleepType = document.getElementById('sleep-type').value;
    
    if (!bedtime || !waketime) {
        showNotification('就寝時間と起床時間を入力してください', 'error');
        return;
    }
    
    const totalHours = calculateSleepHours(bedtime, waketime);
    
    // Estimate sleep stages based on sleep type
    let deepSleep, lightSleep, remSleep;
    
    switch(sleepType) {
        case 'deep':
            deepSleep = (totalHours * 0.3).toFixed(1);
            lightSleep = (totalHours * 0.5).toFixed(1);
            remSleep = (totalHours * 0.2).toFixed(1);
            break;
        case 'light':
            deepSleep = (totalHours * 0.15).toFixed(1);
            lightSleep = (totalHours * 0.65).toFixed(1);
            remSleep = (totalHours * 0.2).toFixed(1);
            break;
        case 'interrupted':
            deepSleep = (totalHours * 0.1).toFixed(1);
            lightSleep = (totalHours * 0.6).toFixed(1);
            remSleep = (totalHours * 0.15).toFixed(1);
            break;
        default: // normal
            deepSleep = (totalHours * 0.2).toFixed(1);
            lightSleep = (totalHours * 0.55).toFixed(1);
            remSleep = (totalHours * 0.25).toFixed(1);
    }
    
    const sleepEntry = {
        date: new Date().toISOString(),
        bedtime: bedtime,
        waketime: waketime,
        sleepType: sleepType,
        totalHours: totalHours,
        deepSleep: deepSleep,
        lightSleep: lightSleep,
        remSleep: remSleep
    };
    
    sleepData.push(sleepEntry);
    saveToLocalStorage();
    updateSleepAnalysis(sleepEntry);
    updateSleepChart();
    updateDashboardStats();
    showNotification('睡眠データを保存しました', 'success');
}

function updateSleepAnalysis(sleepEntry) {
    document.getElementById('total-sleep').textContent = sleepEntry.totalHours + '時間';
    document.querySelector('.space-y-4 .font-bold.text-xl').textContent = sleepEntry.deepSleep + '時間 (' + Math.round((sleepEntry.deepSleep / sleepEntry.totalHours) * 100) + '%)';
    const sleepAnalysisItems = document.querySelectorAll('.space-y-4 .font-bold.text-xl');
    if (sleepAnalysisItems[1]) {
        sleepAnalysisItems[1].textContent = sleepEntry.lightSleep + '時間 (' + Math.round((sleepEntry.lightSleep / sleepEntry.totalHours) * 100) + '%)';
    }
    if (sleepAnalysisItems[2]) {
        sleepAnalysisItems[2].textContent = sleepEntry.remSleep + '時間 (' + Math.round((sleepEntry.remSleep / sleepEntry.totalHours) * 100) + '%)';
    }
}

function calculateSleepHours(bedtime, waketime) {
    const bed = new Date(`2000-01-01 ${bedtime}`);
    const wake = new Date(`2000-01-01 ${waketime}`);
    
    if (wake < bed) {
        wake.setDate(wake.getDate() + 1);
    }
    
    const diff = wake - bed;
    return (diff / (1000 * 60 * 60)).toFixed(1);
}

function analyzeMeal() {
    const mealName = document.getElementById('meal-name').value;
    const mealType = document.getElementById('meal-type').value;
    
    if (!mealName) {
        showNotification('食事名を入力してください', 'error');
        return;
    }
    
    // Simulate nutrition analysis (in real app, this would call an API)
    const nutrition = simulateNutritionAnalysis(mealName);
    
    // Update nutrition display
    document.getElementById('calories').textContent = nutrition.calories + ' kcal';
    document.getElementById('carbs').textContent = nutrition.carbs + ' g';
    document.getElementById('protein').textContent = nutrition.protein + ' g';
    document.getElementById('fat').textContent = nutrition.fat + ' g';
    document.getElementById('fiber').textContent = nutrition.fiber + ' g';
    document.getElementById('calcium').textContent = nutrition.calcium + ' mg';
    document.getElementById('vitamins').textContent = nutrition.vitamins + ' mg';
    document.getElementById('minerals').textContent = nutrition.minerals + ' mg';
    document.getElementById('water').textContent = nutrition.water + ' ml';
    
    // Save nutrition data
    const nutritionEntry = {
        date: new Date().toISOString(),
        name: mealName,
        type: mealType,
        nutrition: nutrition
    };
    
    nutritionData.push(nutritionEntry);
    saveToLocalStorage();
    
    // Update today's meals display
    updateTodaysMeals();
    
    // Generate AI advice
    generateNutritionAdvice(nutrition);
    
    showNotification('栄養分析が完了しました', 'success');
}

function simulateNutritionAnalysis(mealName) {
    // Simulate nutrition values based on meal name
    const baseValues = {
        calories: Math.floor(Math.random() * 500) + 200,
        carbs: Math.floor(Math.random() * 60) + 20,
        protein: Math.floor(Math.random() * 40) + 10,
        fat: Math.floor(Math.random() * 30) + 5,
        fiber: Math.floor(Math.random() * 15) + 2,
        calcium: Math.floor(Math.random() * 200) + 50,
        vitamins: Math.floor(Math.random() * 100) + 20,
        minerals: Math.floor(Math.random() * 80) + 15,
        water: Math.floor(Math.random() * 300) + 100
    };
    
    return baseValues;
}

function generateNutritionAdvice(nutrition) {
    const adviceDiv = document.getElementById('nutrition-advice');
    let advice = [];
    
    // Check protein intake
    if (nutrition.protein < 20) {
        advice.push({
            type: 'warning',
            icon: 'exclamation-triangle',
            text: 'タンパク質が不足しています。肉、魚、卵、豆腐などのタンパク質豊富な食品を追加しましょう。'
        });
    } else if (nutrition.protein > 50) {
        advice.push({
            type: 'success',
            icon: 'check-circle',
            text: 'タンパク質摂取量は適切です。筋肉の維持と回復に役立ちます。'
        });
    }
    
    // Check fiber intake
    if (nutrition.fiber < 5) {
        advice.push({
            type: 'warning',
            icon: 'exclamation-triangle',
            text: '食物繊維が不足しています。野菜や果物、全粒穀物を増やしましょう。'
        });
    } else {
        advice.push({
            type: 'success',
            icon: 'check-circle',
            text: '食物繊維摂取は良好です。消化器系の健康に貢献します。'
        });
    }
    
    // Check calories
    if (nutrition.calories > 800) {
        advice.push({
            type: 'info',
            icon: 'info-circle',
            text: 'カロリーが高めです。バランスの取れた食事を心がけましょう。'
        });
    }
    
    // Brain function benefits
    if (nutrition.protein > 25 && nutrition.fat > 15) {
        advice.push({
            type: 'success',
            icon: 'brain',
            text: '脳の機能が活性化する栄養バランスです。集中力と認知機能の向上が期待できます。'
        });
    }
    
    // Display advice
    adviceDiv.innerHTML = advice.map(item => `
        <div class="flex items-start p-3 bg-white bg-opacity-10 rounded-lg mb-2">
            <i class="fas fa-${item.icon} text-${item.type === 'warning' ? 'yellow' : item.type === 'success' ? 'green' : 'blue'}-400 mt-1 mr-3"></i>
            <p class="text-sm">${item.text}</p>
        </div>
    `).join('');
}

function updateTodaysMeals() {
    const today = new Date().toDateString();
    const todayMeals = nutritionData.filter(meal => 
        new Date(meal.date).toDateString() === today
    );
    
    const mealsDiv = document.getElementById('todays-meals');
    mealsDiv.innerHTML = todayMeals.map(meal => `
        <div class="bg-white bg-opacity-10 rounded-lg p-4">
            <h4 class="font-semibold mb-2">${meal.name}</h4>
            <p class="text-sm opacity-80 mb-2">${getMealTypeLabel(meal.type)}</p>
            <div class="text-xs space-y-1">
                <div class="flex justify-between">
                    <span>カロリー:</span>
                    <span>${meal.nutrition.calories} kcal</span>
                </div>
                <div class="flex justify-between">
                    <span>タンパク質:</span>
                    <span>${meal.nutrition.protein} g</span>
                </div>
            </div>
        </div>
    `).join('');
}

function getMealTypeLabel(type) {
    const labels = {
        morning: '朝',
        noon: '昼',
        night: '夜',
        snack: '間食'
    };
    return labels[type] || type;
}

function saveExerciseData() {
    const steps = document.getElementById('steps').value;
    const calories = document.getElementById('calories-burned').value;
    const distance = document.getElementById('distance').value;
    const time = document.getElementById('exercise-time').value;
    
    if (!steps || !calories || !distance || !time) {
        showNotification('すべての運動データを入力してください', 'error');
        return;
    }
    
    const exerciseEntry = {
        date: new Date().toISOString(),
        steps: parseInt(steps),
        calories: parseInt(calories),
        distance: parseFloat(distance),
        time: parseInt(time)
    };
    
    exerciseData.push(exerciseEntry);
    saveToLocalStorage();
    updateExerciseChart();
    updateDashboardStats();
    showNotification('運動データを保存しました', 'success');
    
    // Clear form
    document.getElementById('steps').value = '';
    document.getElementById('calories-burned').value = '';
    document.getElementById('distance').value = '';
    document.getElementById('exercise-time').value = '';
}

function addTask() {
    const taskInput = document.getElementById('new-task');
    const priority = document.getElementById('task-priority').value;
    const taskText = taskInput.value.trim();
    
    if (!taskText) {
        showNotification('タスクを入力してください', 'error');
        return;
    }
    
    const task = {
        id: Date.now(),
        text: taskText,
        priority: priority,
        status: 'todo',
        createdAt: new Date().toISOString()
    };
    
    tasks.push(task);
    saveToLocalStorage();
    renderTasks();
    
    taskInput.value = '';
    showNotification('タスクを追加しました', 'success');
}

function renderTasks() {
    const todoColumn = document.getElementById('todo-column');
    const progressColumn = document.getElementById('progress-column');
    const doneColumn = document.getElementById('done-column');
    
    const todoTasks = tasks.filter(task => task.status === 'todo');
    const progressTasks = tasks.filter(task => task.status === 'progress');
    const doneTasks = tasks.filter(task => task.status === 'done');
    
    todoColumn.innerHTML = todoTasks.map(task => createTaskCard(task)).join('');
    progressColumn.innerHTML = progressTasks.map(task => createTaskCard(task)).join('');
    doneColumn.innerHTML = doneTasks.map(task => createTaskCard(task)).join('');
}

function createTaskCard(task) {
    const priorityColors = {
        high: 'border-red-400',
        medium: 'border-yellow-400',
        low: 'border-green-400'
    };
    
    const priorityLabels = {
        high: '高',
        medium: '中',
        low: '低'
    };
    
    return `
        <div class="bg-white bg-opacity-10 rounded-lg p-4 border-l-4 ${priorityColors[task.priority]} cursor-pointer hover:bg-opacity-20 transition" onclick="moveTask(${task.id})">
            <div class="flex justify-between items-start mb-2">
                <span class="text-xs px-2 py-1 bg-white bg-opacity-20 rounded">${priorityLabels[task.priority]}</span>
                <button onclick="deleteTask(${task.id}); event.stopPropagation();" class="text-red-400 hover:text-red-300">
                    <i class="fas fa-trash text-xs"></i>
                </button>
            </div>
            <p class="text-sm">${task.text}</p>
        </div>
    `;
}

function moveTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    if (task.status === 'todo') {
        task.status = 'progress';
    } else if (task.status === 'progress') {
        task.status = 'done';
    } else {
        task.status = 'todo';
    }
    
    saveToLocalStorage();
    renderTasks();
    updateDashboardStats();
}

function deleteTask(taskId) {
    tasks = tasks.filter(t => t.id !== taskId);
    saveToLocalStorage();
    renderTasks();
    updateDashboardStats();
}

async function refreshNews() {
    try {
        // Fetch real AI news from RSS feeds
        const newsSources = [
            'https://rss.cnn.com/rss/edition.rss',
            'https://feeds.bbci.co.uk/news/rss.xml',
            'https://www.nasa.gov/rss/dyn/breaking_news.rss'
        ];
        
        const newsPromises = newsSources.map(async (source) => {
            try {
                const response = await fetch(`https://api.rss2json.com/api.json?rss_url=${encodeURIComponent(source)}`);
                const data = await response.json();
                
                if (data.status === 'ok' && data.items) {
                    return data.items.slice(0, 2).map(item => ({
                        title: item.title,
                        description: item.description || item.contentSnippet || '',
                        url: item.link || item.guid,
                        publishedAt: item.pubDate || new Date().toISOString()
                    }));
                }
                return [];
            } catch (error) {
                console.error('Error fetching news from', source, error);
                return [];
            }
        });
        
        const newsResults = await Promise.all(newsPromises);
        newsArticles = newsResults.flat();
        
        // Filter for AI/tech related news
        newsArticles = newsArticles.filter(article => 
            article.title.toLowerCase().includes('ai') ||
            article.title.toLowerCase().includes('artificial') ||
            article.title.toLowerCase().includes('technology') ||
            article.title.toLowerCase().includes('tech') ||
            article.description.toLowerCase().includes('ai') ||
            article.description.toLowerCase().includes('artificial')
        ).slice(0, 6);
        
        // If no AI news found, keep some general tech news
        if (newsArticles.length === 0) {
            newsArticles = newsResults.flat().slice(0, 6);
        }
        
        displayNews();
        
        // Auto-refresh every 30 minutes
        setTimeout(refreshNews, 30 * 60 * 1000);
        
    } catch (error) {
        console.error('Error refreshing news:', error);
        // Fallback to mock news if API fails
        const mockNews = [
            {
                title: 'AIがビジネス戦略を革新：最新の動向',
                description: '人工知能が企業の意思決定プロセスをどのように変革しているか',
                url: '#',
                publishedAt: new Date().toISOString()
            },
            {
                title: '生産性向上のためのAIツールトップ10',
                description: 'CEOが必ず知っておくべき最新のAI生産性ツール',
                url: '#',
                publishedAt: new Date().toISOString()
            },
            {
                title: '健康経営とAIテクノロジーの融合',
                description: '従業員の健康をAIで管理する新しいアプローチ',
                url: '#',
                publishedAt: new Date().toISOString()
            }
        ];
        
        newsArticles = mockNews;
        displayNews();
    }
}

function displayNews() {
    const newsContainer = document.getElementById('news-container');
    newsContainer.innerHTML = newsArticles.map(article => `
        <div class="bg-white bg-opacity-10 rounded-lg p-6 hover:bg-opacity-20 transition cursor-pointer">
            <h3 class="font-semibold mb-2">${article.title}</h3>
            <p class="text-sm opacity-80 mb-4">${article.description}</p>
            <div class="flex justify-between items-center">
                <span class="text-xs opacity-60">${formatDate(article.publishedAt)}</span>
                <a href="${article.url}" class="text-blue-400 hover:text-blue-300 text-sm">
                    続きを読む <i class="fas fa-arrow-right ml-1"></i>
                </a>
            </div>
        </div>
    `).join('');
}

function showLogPeriod(period) {
    // Update button states
    document.querySelectorAll('.log-period-btn').forEach(btn => {
        btn.classList.remove('bg-white', 'bg-opacity-30');
        btn.classList.add('bg-white', 'bg-opacity-20');
    });
    
    document.querySelector(`[data-period="${period}"]`).classList.remove('bg-opacity-20');
    document.querySelector(`[data-period="${period}"]`).classList.add('bg-opacity-30');
    
    // Update logs based on period
    updateLogs(period);
}

function updateLogs(period) {
    const sleepLog = document.getElementById('sleep-log');
    const nutritionLog = document.getElementById('nutrition-log');
    const exerciseLog = document.getElementById('exercise-log');
    const productivityLog = document.getElementById('productivity-log');
    
    // Filter data based on period
    const filteredSleep = filterDataByPeriod(sleepData, period);
    const filteredNutrition = filterDataByPeriod(nutritionData, period);
    const filteredExercise = filterDataByPeriod(exerciseData, period);
    
    // Display logs
    sleepLog.innerHTML = filteredSleep.map(entry => `
        <div class="flex justify-between items-center p-2 bg-white bg-opacity-10 rounded">
            <span class="text-sm">${formatDate(entry.date)}</span>
            <span class="text-sm font-semibold">${entry.totalHours}時間 (品質: ${entry.quality}%)</span>
        </div>
    `).join('') || '<p class="text-sm opacity-60">データがありません</p>';
    
    nutritionLog.innerHTML = filteredNutrition.map(entry => `
        <div class="flex justify-between items-center p-2 bg-white bg-opacity-10 rounded">
            <span class="text-sm">${entry.name}</span>
            <span class="text-sm font-semibold">${entry.nutrition.calories} kcal</span>
        </div>
    `).join('') || '<p class="text-sm opacity-60">データがありません</p>';
    
    exerciseLog.innerHTML = filteredExercise.map(entry => `
        <div class="flex justify-between items-center p-2 bg-white bg-opacity-10 rounded">
            <span class="text-sm">${formatDate(entry.date)}</span>
            <span class="text-sm font-semibold">${entry.steps}歩</span>
        </div>
    `).join('') || '<p class="text-sm opacity-60">データがありません</p>';
    
    // Calculate productivity
    const completedTasks = tasks.filter(task => task.status === 'done').length;
    const totalTasks = tasks.length;
    const productivity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    productivityLog.innerHTML = `
        <div class="flex justify-between items-center p-2 bg-white bg-opacity-10 rounded">
            <span class="text-sm">タスク完了率</span>
            <span class="text-sm font-semibold">${completedTasks}/${totalTasks} (${productivity}%)</span>
        </div>
    `;
}

function filterDataByPeriod(data, period) {
    const now = new Date();
    let startDate;
    
    switch(period) {
        case 'day':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        default:
            return data;
    }
    
    return data.filter(entry => new Date(entry.date) >= startDate);
}

function updateDashboardStats() {
    // Calculate today's stats
    const today = new Date().toDateString();
    
    // Sleep stats - remove hardcoded values
    const todaySleep = sleepData.find(sleep => 
        new Date(sleep.date).toDateString() === today
    );
    
    const sleepHours = todaySleep ? todaySleep.totalHours : '--';
    
    // Update sleep card
    const sleepCard = document.querySelector('.grid .glass-effect');
    if (sleepCard && todaySleep) {
        sleepCard.querySelector('.text-3xl').textContent = sleepHours + 'h';
        sleepCard.querySelector('.text-sm.opacity-80').textContent = `睡眠タイプ: ${getSleepTypeLabel(todaySleep.sleepType)}`;
        const progressBar = sleepCard.querySelector('.bg-green-400');
        if (progressBar) {
            const sleepQuality = calculateSleepQuality(todaySleep);
            progressBar.style.width = sleepQuality + '%';
        }
    }
    
    // Nutrition stats
    const todayNutrition = nutritionData.filter(meal => 
        new Date(meal.date).toDateString() === today
    );
    
    const totalCalories = todayNutrition.reduce((sum, meal) => 
        sum + meal.nutrition.calories, 0
    );
    
    // Update nutrition card
    const nutritionCards = document.querySelectorAll('.grid .glass-effect');
    if (nutritionCards[1]) {
        nutritionCards[1].querySelector('.text-3xl').textContent = totalCalories.toLocaleString();
        const calorieProgress = Math.min((totalCalories / 2500) * 100, 100);
        const progressBar = nutritionCards[1].querySelector('.bg-blue-400');
        if (progressBar) {
            progressBar.style.width = calorieProgress + '%';
        }
    }
    
    // Exercise stats
    const todayExercise = exerciseData.find(exercise => 
        new Date(exercise.date).toDateString() === today
    );
    
    // Update exercise card
    if (nutritionCards[2] && todayExercise) {
        nutritionCards[2].querySelector('.text-3xl').textContent = todayExercise.steps.toLocaleString();
        const stepProgress = Math.min((todayExercise.steps / 10000) * 100, 100);
        const progressBar = nutritionCards[2].querySelector('.bg-orange-400');
        if (progressBar) {
            progressBar.style.width = stepProgress + '%';
        }
    }
    
    // Task stats
    const completedTasks = tasks.filter(task => task.status === 'done').length;
    const totalTasks = tasks.length;
    
    // Update task card
    if (nutritionCards[3]) {
        nutritionCards[3].querySelector('.text-3xl').textContent = `${completedTasks}/${totalTasks}`;
        const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        const progressBar = nutritionCards[3].querySelector('.bg-purple-400');
        if (progressBar) {
            progressBar.style.width = taskProgress + '%';
        }
    }
    
    // Update summary section
    const summarySection = document.querySelector('.grid .glass-effect .space-y-3');
    if (summarySection) {
        const summaryItems = summarySection.querySelectorAll('.flex');
        if (summaryItems[0]) {
            const sleepScore = todaySleep ? calculateSleepQuality(todaySleep) : '--';
            summaryItems[0].querySelector('.font-bold').textContent = sleepScore + '/100';
        }
        if (summaryItems[1]) {
            const nutritionBalance = todayNutrition.length > 0 ? '良好' : '--';
            summaryItems[1].querySelector('.font-bold').textContent = nutritionBalance;
        }
        if (summaryItems[2]) {
            const activityLevel = todayExercise ? 
                (todayExercise.steps > 8000 ? '高' : todayExercise.steps > 5000 ? '中' : '低') : '--';
            summaryItems[2].querySelector('.font-bold').textContent = activityLevel;
        }
        if (summaryItems[3]) {
            const productivity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            summaryItems[3].querySelector('.font-bold').textContent = productivity + '%';
        }
    }
}

function getSleepTypeLabel(type) {
    const labels = {
        normal: '普通',
        deep: '深い眠り',
        light: '浅い眠り',
        interrupted: '途中で起きた'
    };
    return labels[type] || type;
}

function calculateSleepQuality(sleepEntry) {
    // Calculate quality based on sleep type and duration
    let baseQuality = 70;
    
    switch(sleepEntry.sleepType) {
        case 'deep':
            baseQuality = 90;
            break;
        case 'light':
            baseQuality = 60;
            break;
        case 'interrupted':
            baseQuality = 40;
            break;
        default:
            baseQuality = 70;
    }
    
    // Adjust based on duration (ideal is 7-9 hours)
    const hours = parseFloat(sleepEntry.totalHours);
    if (hours >= 7 && hours <= 9) {
        baseQuality += 10;
    } else if (hours < 6 || hours > 10) {
        baseQuality -= 20;
    }
    
    return Math.max(0, Math.min(100, baseQuality));
}

function initializeCharts() {
    // Sleep chart
    const sleepCtx = document.getElementById('sleep-chart');
    if (sleepCtx) {
        new Chart(sleepCtx, {
            type: 'line',
            data: {
                labels: ['月', '火', '水', '木', '金', '土', '日'],
                datasets: [{
                    label: '睡眠時間',
                    data: [7.5, 6.8, 8.2, 7.0, 7.5, 9.0, 8.5],
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: 'white'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: 'white'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: 'white'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }
    
    // Exercise chart
    const exerciseCtx = document.getElementById('exercise-chart');
    if (exerciseCtx) {
        new Chart(exerciseCtx, {
            type: 'bar',
            data: {
                labels: ['月', '火', '水', '木', '金', '土', '日'],
                datasets: [{
                    label: '歩数',
                    data: [8000, 12000, 6000, 10000, 8432, 15000, 11000],
                    backgroundColor: 'rgba(255, 159, 64, 0.8)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: 'white'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: 'white'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: 'white'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }
}

function updateSleepChart() {
    const sleepCtx = document.getElementById('sleep-chart');
    if (!sleepCtx) return;
    
    // Get last 7 days of sleep data
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toDateString();
        
        const dayData = sleepData.find(sleep => 
            new Date(sleep.date).toDateString() === dateStr
        );
        
        last7Days.push({
            date: date.toLocaleDateString('ja-JP', { weekday: 'short' }),
            hours: dayData ? parseFloat(dayData.totalHours) : 0
        });
    }
    
    // Update chart data
    if (window.sleepChart) {
        window.sleepChart.data.labels = last7Days.map(d => d.date);
        window.sleepChart.data.datasets[0].data = last7Days.map(d => d.hours);
        window.sleepChart.update();
    } else {
        window.sleepChart = new Chart(sleepCtx, {
            type: 'line',
            data: {
                labels: last7Days.map(d => d.date),
                datasets: [{
                    label: '睡眠時間',
                    data: last7Days.map(d => d.hours),
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: 'white'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: 'white'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: 'white'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }
}

function updateExerciseChart() {
    // Update exercise chart with real data
    // This would update the chart with actual exercise data
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white z-50 ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        'bg-blue-500'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Local storage functions
function saveToLocalStorage() {
    localStorage.setItem('ceo-app-tasks', JSON.stringify(tasks));
    localStorage.setItem('ceo-app-sleep', JSON.stringify(sleepData));
    localStorage.setItem('ceo-app-nutrition', JSON.stringify(nutritionData));
    localStorage.setItem('ceo-app-exercise', JSON.stringify(exerciseData));
}

function loadStoredData() {
    const storedTasks = localStorage.getItem('ceo-app-tasks');
    const storedSleep = localStorage.getItem('ceo-app-sleep');
    const storedNutrition = localStorage.getItem('ceo-app-nutrition');
    const storedExercise = localStorage.getItem('ceo-app-exercise');
    
    if (storedTasks) tasks = JSON.parse(storedTasks);
    if (storedSleep) sleepData = JSON.parse(storedSleep);
    if (storedNutrition) nutritionData = JSON.parse(storedNutrition);
    if (storedExercise) exerciseData = JSON.parse(storedExercise);
    
    renderTasks();
    updateDashboardStats();
}
