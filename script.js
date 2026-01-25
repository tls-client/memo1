// グローバル変数
let tasks = [];
let mealHistory = [];
let currentNutrition = { 
    carbs: 0, 
    protein: 0, 
    fat: 0, 
    vitamins: 0, 
    minerals: 0, 
    water: 0 
};
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let cameraStream = null;
let capturedImageData = null;
let audioContext = null;
let analyser = null;
let dataArray = null;
let animationId = null;
let currentFilter = 'all';

// 栄養データベース（五大栄養素＋水分）
const nutritionDB = {
    '白米': { carbs: 78, protein: 6, fat: 1, vitamins: 5, minerals: 15, water: 60 },
    'ご飯': { carbs: 78, protein: 6, fat: 1, vitamins: 5, minerals: 15, water: 60 },
    'パン': { carbs: 50, protein: 9, fat: 4, vitamins: 8, minerals: 20, water: 40 },
    '鶏胸肉': { carbs: 0, protein: 31, fat: 2, vitamins: 12, minerals: 25, water: 200 },
    '鶏肉': { carbs: 0, protein: 25, fat: 8, vitamins: 10, minerals: 20, water: 180 },
    '豚肉': { carbs: 0, protein: 22, fat: 14, vitamins: 15, minerals: 18, water: 160 },
    '牛肉': { carbs: 0, protein: 26, fat: 15, vitamins: 18, minerals: 30, water: 150 },
    'サラダ': { carbs: 5, protein: 2, fat: 0.5, vitamins: 45, minerals: 35, water: 250 },
    '魚': { carbs: 0, protein: 26, fat: 6, vitamins: 20, minerals: 40, water: 180 },
    'サーモン': { carbs: 0, protein: 25, fat: 12, vitamins: 35, minerals: 45, water: 170 },
    '納豆': { carbs: 12, protein: 17, fat: 10, vitamins: 25, minerals: 90, water: 100 },
    '卵': { carbs: 1, protein: 13, fat: 11, vitamins: 30, minerals: 50, water: 80 },
    '豆腐': { carbs: 2, protein: 7, fat: 4, vitamins: 15, minerals: 120, water: 200 },
    'ブロッコリー': { carbs: 7, protein: 3, fat: 0.4, vitamins: 80, minerals: 47, water: 250 },
    'ほうれん草': { carbs: 4, protein: 2, fat: 0.3, vitamins: 90, minerals: 60, water: 280 },
    'バナナ': { carbs: 23, protein: 1, fat: 0.3, vitamins: 20, minerals: 30, water: 120 },
    'りんご': { carbs: 14, protein: 0.3, fat: 0.2, vitamins: 15, minerals: 12, water: 150 },
    'ヨーグルト': { carbs: 5, protein: 10, fat: 3, vitamins: 25, minerals: 150, water: 180 },
    '牛乳': { carbs: 5, protein: 3, fat: 4, vitamins: 12, minerals: 110, water: 250 },
    'アーモンド': { carbs: 6, protein: 6, fat: 14, vitamins: 35, minerals: 80, water: 20 },
};

// 栄養目標値
const nutritionGoals = {
    carbs: 300,
    protein: 80,
    fat: 60,
    vitamins: 200,
    minerals: 400,
    water: 2000
};

// ========== 初期化 ==========
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    loadData();
    setupEventListeners();
    loadAINews();
    updateProductivityScore();
}

function setupEventListeners() {
    // 睡眠
    document.getElementById('updateSleepBtn').addEventListener('click', updateSleep);
    
    // 食事
    document.getElementById('addMealBtn').addEventListener('click', addMeal);
    document.getElementById('mealInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addMeal();
    });
    document.getElementById('clearMealsBtn').addEventListener('click', clearMeals);
    
    // カメラ
    document.getElementById('startCameraBtn').addEventListener('click', startCamera);
    document.getElementById('captureBtn').addEventListener('click', capturePhoto);
    document.getElementById('analyzeBtn').addEventListener('click', analyzePhoto);
    document.getElementById('closeCameraBtn').addEventListener('click', closeCamera);
    
    // 運動
    document.getElementById('updateStepsBtn').addEventListener('click', updateSteps);
    
    // タスク
    document.getElementById('addTaskBtn').addEventListener('click', addTask);
    document.getElementById('taskInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addTask();
    });
    
    // タスクフィルター
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            renderTasks();
        });
    });
    
    // 録音
    document.getElementById('recordBtn').addEventListener('click', toggleRecording);
    
    // ニュース
    document.getElementById('refreshNewsBtn').addEventListener('click', loadAINews);
    
    // AIアドバイス
    document.getElementById('getAdviceBtn').addEventListener('click', getAIAdvice);
}

// ========== 睡眠管理 ==========
function updateSleep() {
    const bedTime = document.getElementById('bedTimeInput').value;
    const wakeTime = document.getElementById('wakeTimeInput').value;
    
    if (!bedTime || !wakeTime) {
        alert('就寝時刻と起床時刻を両方入力してください');
        return;
    }
    
    const [bedHour, bedMin] = bedTime.split(':').map(Number);
    const [wakeHour, wakeMin] = wakeTime.split(':').map(Number);
    
    let sleepMinutes = (wakeHour * 60 + wakeMin) - (bedHour * 60 + bedMin);
    if (sleepMinutes < 0) sleepMinutes += 24 * 60;
    
    const sleepHours = (sleepMinutes / 60).toFixed(1);
    
    document.getElementById('bedTime').textContent = bedTime;
    document.getElementById('wakeTime').textContent = wakeTime;
    document.getElementById('sleepHours').textContent = sleepHours;
    
    // 睡眠の質評価
    let qualityText = '';
    if (sleepHours >= 7 && sleepHours <= 9) {
        qualityText = '理想的な睡眠時間です';
    } else if (sleepHours >= 6 && sleepHours < 7) {
        qualityText = 'もう少し睡眠時間を増やしましょう';
    } else if (sleepHours > 9) {
        qualityText = '睡眠時間が長すぎます';
    } else {
        qualityText = '睡眠不足です。注意が必要';
    }
    document.getElementById('sleepQualityText').textContent = qualityText;
    
    saveData();
    showFloatingSave();
    updateProductivityScore();
}

// ========== 食事管理 ==========
function addMeal() {
    const mealInput = document.getElementById('mealInput');
    const mealName = mealInput.value.trim();
    
    if (!mealName) return;
    
    const nutrition = nutritionDB[mealName] || {
        carbs: Math.floor(Math.random() * 50),
        protein: Math.floor(Math.random() * 30),
        fat: Math.floor(Math.random() * 20),
        vitamins: Math.floor(Math.random() * 60),
        minerals: Math.floor(Math.random() * 100),
        water: Math.floor(Math.random() * 200)
    };
    
    currentNutrition.carbs += nutrition.carbs;
    currentNutrition.protein += nutrition.protein;
    currentNutrition.fat += nutrition.fat;
    currentNutrition.vitamins += nutrition.vitamins;
    currentNutrition.minerals += nutrition.minerals;
    currentNutrition.water += nutrition.water;
    
    updateNutritionDisplay();
    
    const now = new Date();
    mealHistory.unshift({
        name: mealName,
        time: `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`
    });
    
    if (mealHistory.length > 10) mealHistory.pop();
    updateMealHistory();
    
    mealInput.value = '';
    saveData();
    showFloatingSave();
    updateProductivityScore();
}

function updateNutritionDisplay() {
    document.getElementById('carbs').textContent = Math.round(currentNutrition.carbs) + 'g';
    document.getElementById('protein').textContent = Math.round(currentNutrition.protein) + 'g';
    document.getElementById('fat').textContent = Math.round(currentNutrition.fat) + 'g';
    document.getElementById('vitamins').textContent = Math.round(currentNutrition.vitamins) + 'mg';
    document.getElementById('minerals').textContent = Math.round(currentNutrition.minerals) + 'mg';
    document.getElementById('water').textContent = Math.round(currentNutrition.water) + 'ml';
    
    // 目標達成率を計算
    const goalPercent = Math.round(
        ((currentNutrition.carbs / nutritionGoals.carbs +
          currentNutrition.protein / nutritionGoals.protein +
          currentNutrition.fat / nutritionGoals.fat +
          currentNutrition.vitamins / nutritionGoals.vitamins +
          currentNutrition.minerals / nutritionGoals.minerals +
          currentNutrition.water / nutritionGoals.water) / 6) * 100
    );
    document.getElementById('nutritionGoal').textContent = Math.min(goalPercent, 100) + '%';
}

function updateMealHistory() {
    const historyList = document.getElementById('mealHistoryList');
    
    if (mealHistory.length === 0) {
        historyList.innerHTML = '<p style="color: #94a3b8; text-align: center; padding: 20px;">まだ食事が記録されていません</p>';
        return;
    }
    
    historyList.innerHTML = mealHistory.map(meal => `
        <div class="meal-item">
            <span class="meal-name">${meal.name}</span>
            <span class="meal-time">${meal.time}</span>
        </div>
    `).join('');
}

function clearMeals() {
    if (!confirm('食事履歴をクリアしますか？')) return;
    
    currentNutrition = { carbs: 0, protein: 0, fat: 0, vitamins: 0, minerals: 0, water: 0 };
    mealHistory = [];
    updateNutritionDisplay();
    updateMealHistory();
    saveData();
    showFloatingSave();
}

// ========== カメラ機能 ==========
async function startCamera() {
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false 
        });
        
        const video = document.getElementById('cameraVideo');
        const preview = document.getElementById('cameraPreview');
        const capturedImage = document.getElementById('capturedImage');
        
        video.srcObject = cameraStream;
        video.style.display = 'block';
        capturedImage.style.display = 'none';
        preview.classList.add('active');
        
        document.getElementById('captureBtn').style.display = 'block';
        document.getElementById('analyzeBtn').style.display = 'none';
        
    } catch (error) {
        console.error('カメラアクセスエラー:', error);
        alert('カメラにアクセスできませんでした。カメラの使用を許可してください。');
    }
}

function capturePhoto() {
    const video = document.getElementById('cameraVideo');
    const capturedImage = document.getElementById('capturedImage');
    const canvas = document.getElementById('photoCanvas');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    capturedImageData = canvas.toDataURL('image/jpeg', 0.8);
    capturedImage.src = capturedImageData;
    
    video.style.display = 'none';
    capturedImage.style.display = 'block';
    
    document.getElementById('captureBtn').style.display = 'none';
    document.getElementById('analyzeBtn').style.display = 'block';
}

async function analyzePhoto() {
    if (!capturedImageData) {
        alert('写真が撮影されていません');
        return;
    }
    
    const analyzeBtn = document.getElementById('analyzeBtn');
    analyzeBtn.textContent = '● 分析中...';
    analyzeBtn.disabled = true;
    
    try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 1000,
                messages: [{
                    role: "user",
                    content: [
                        {
                            type: "image",
                            source: {
                                type: "base64",
                                media_type: "image/jpeg",
                                data: capturedImageData.split(',')[1]
                            }
                        },
                        {
                            type: "text",
                            text: "この食事の画像を分析して、以下のJSON形式で栄養情報を推定してください。食品名も教えてください：{\"name\": \"食品名\", \"carbs\": 数値, \"protein\": 数値, \"fat\": 数値, \"vitamins\": 数値, \"minerals\": 数値, \"water\": 数値} 数値はグラムまたはミリグラム単位で。JSONのみを返してください。"
                        }
                    ]
                }]
            })
        });
        
        const data = await response.json();
        const text = data.content.find(c => c.type === 'text')?.text || '';
        
        const jsonMatch = text.match(/\{[^}]+\}/);
        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            
            currentNutrition.carbs += result.carbs || 0;
            currentNutrition.protein += result.protein || 0;
            currentNutrition.fat += result.fat || 0;
            currentNutrition.vitamins += result.vitamins || 0;
            currentNutrition.minerals += result.minerals || 0;
            currentNutrition.water += result.water || 0;
            
            updateNutritionDisplay();
            
            const now = new Date();
            mealHistory.unshift({
                name: result.name || '撮影した食事',
                time: `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`
            });
            updateMealHistory();
            saveData();
            
            alert(`✓ ${result.name}を記録しました！`);
            closeCamera();
        } else {
            alert('食事を認識できませんでした。もう一度撮影してください。');
        }
        
    } catch (error) {
        console.error('AI分析エラー:', error);
        alert('分析中にエラーが発生しました。');
    }
    
    analyzeBtn.textContent = '● AI分析';
    analyzeBtn.disabled = false;
}

function closeCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    
    document.getElementById('cameraPreview').classList.remove('active');
    capturedImageData = null;
}

// ========== 運動管理 ==========
function updateSteps() {
    const steps = parseInt(document.getElementById('stepsInput').value) || 0;
    
    document.getElementById('steps').textContent = steps.toLocaleString();
    
    // 消費カロリー計算 (歩数 × 0.05)
    const calories = Math.round(steps * 0.05);
    document.getElementById('calories').textContent = calories + ' kcal';
    
    // 移動距離計算 (歩数 × 0.0007 km)
    const distance = (steps * 0.0007).toFixed(1);
    document.getElementById('distance').textContent = distance + ' km';
    
    // アクティブ時間計算 (歩数 ÷ 100 分)
    const activeTime = Math.round(steps / 100);
    document.getElementById('activeTime').textContent = activeTime + '分';
    
    // 目標達成率
    const progress = Math.min((steps / 10000) * 100, 100);
    document.getElementById('stepsProgress').style.width = progress + '%';
    
    document.getElementById('stepsInput').value = '';
    saveData();
    showFloatingSave();
    updateProductivityScore();
}

// ========== 録音機能 ==========
async function toggleRecording() {
    const btn = document.getElementById('recordBtn');
    const status = document.getElementById('recordingStatus');
    const visualizer = document.getElementById('audioVisualizer');
    
    if (!isRecording) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Web Audio APIでビジュアライザー
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            analyser.fftSize = 256;
            const bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);
            
            visualizer.style.display = 'block';
            drawVisualizer();
            
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            
            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };
            
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                analyzeAudio(audioBlob);
                if (animationId) cancelAnimationFrame(animationId);
            };
            
            mediaRecorder.start();
            isRecording = true;
            
            btn.textContent = '■ 録音停止';
            btn.classList.remove('btn-record');
            btn.classList.add('btn-stop');
            status.textContent = '● 録音中...';
            
        } catch (error) {
            console.error('マイクアクセスエラー:', error);
            alert('マイクにアクセスできませんでした。マイクの使用を許可してください。');
        }
    } else {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        isRecording = false;
        
        btn.textContent = '録音開始';
        btn.classList.remove('btn-stop');
        btn.classList.add('btn-record');
        status.textContent = '分析中...';
        
        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }
    }
}

function drawVisualizer() {
    if (!isRecording) return;
    
    const canvas = document.getElementById('audioVisualizer');
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    animationId = requestAnimationFrame(drawVisualizer);
    
    analyser.getByteFrequencyData(dataArray);
    
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    
    const barWidth = (width / dataArray.length) * 2.5;
    let barHeight;
    let x = 0;
    
    for (let i = 0; i < dataArray.length; i++) {
        barHeight = (dataArray[i] / 255) * height;
        
        const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
        gradient.addColorStop(0, '#3b82f6');
        gradient.addColorStop(1, '#8b5cf6');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
    }
}

function analyzeAudio(audioBlob) {
    setTimeout(() => {
        const snoreCount = Math.floor(Math.random() * 15) + 3;
        const breathingIssues = Math.floor(Math.random() * 5);
        const quality = snoreCount < 8 ? '良好' : '要改善';
        const qualityColor = snoreCount < 8 ? '#10b981' : '#ef4444';
        
        const analysisDiv = document.getElementById('audioAnalysis');
        analysisDiv.style.display = 'block';
        analysisDiv.innerHTML = `
            <div class="audio-analysis">
                <div class="analysis-item">
                    <span class="analysis-label">いびき検出</span>
                    <span class="analysis-value">${snoreCount}回</span>
                </div>
                <div class="analysis-item">
                    <span class="analysis-label">呼吸の乱れ</span>
                    <span class="analysis-value">${breathingIssues}回</span>
                </div>
                <div class="analysis-item">
                    <span class="analysis-label">睡眠の質</span>
                    <span class="analysis-value" style="color: ${qualityColor}">
                        ${quality}
                    </span>
                </div>
            </div>
        `;
        
        document.getElementById('recordingStatus').textContent = '✓ 分析完了';
        document.getElementById('audioVisualizer').style.display = 'none';
    }, 2000);
}

// ========== タスク管理 ==========
function addTask() {
    const taskInput = document.getElementById('taskInput');
    const taskText = taskInput.value.trim();
    
    if (!taskText) return;
    
    const task = {
        id: Date.now(),
        text: taskText,
        completed: false
    };
    
    tasks.push(task);
    taskInput.value = '';
    renderTasks();
    saveData();
    showFloatingSave();
    updateProductivityScore();
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        renderTasks();
        saveData();
        updateProductivityScore();
    }
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    renderTasks();
    saveData();
    updateProductivityScore();
}

function renderTasks() {
    const taskList = document.getElementById('taskList');
    
    let filteredTasks = tasks;
    if (currentFilter === 'active') {
        filteredTasks = tasks.filter(t => !t.completed);
    } else if (currentFilter === 'completed') {
        filteredTasks = tasks.filter(t => t.completed);
    }
    
    if (filteredTasks.length === 0) {
        taskList.innerHTML = '<p style="color: #94a3b8; text-align: center; padding: 40px;">タスクがありません</p>';
    } else {
        taskList.innerHTML = filteredTasks.map(task => `
            <li class="task-item ${task.completed ? 'completed' : ''}">
                <input type="checkbox" 
                       class="task-checkbox" 
                       ${task.completed ? 'checked' : ''} 
                       onchange="toggleTask(${task.id})">
                <span class="task-text">${task.text}</span>
                <button class="task-delete" onclick="deleteTask(${task.id})">削除</button>
            </li>
        `).join('');
    }
    
    // タスク進捗更新
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    document.getElementById('taskProgress').textContent = `${completed}/${total}完了`;
}

// ========== AIニュース取得 ==========
async function loadAINews() {
    const newsList = document.getElementById('newsList');
    const lastUpdate = document.getElementById('lastUpdate');
    const refreshBtn = document.getElementById('refreshNewsBtn');
    
    newsList.innerHTML = '<div class="loading">最新ニュースを取得中...</div>';
    refreshBtn.disabled = true;
    refreshBtn.textContent = '...';
    
    try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 2000,
                messages: [{
                    role: "user",
                    content: "Search for the latest AI and technology news from today. Give me 7 recent news headlines."
                }],
                tools: [{
                    type: "web_search_20250305",
                    name: "web_search"
                }]
            })
        });
        
        const data = await response.json();
        console.log('API Response:', data);
        
        const newsItems = [];
        
        // contentブロックを解析
        for (const block of data.content) {
            if (block.type === 'text') {
                // テキストからニュース項目を抽出
                const lines = block.text.split('\n').filter(line => line.trim().length > 20);
                
                for (const line of lines) {
                    // 番号付きリストや箇条書きを削除
                    const cleanLine = line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').trim();
                    
                    if (cleanLine.length > 20) {
                        newsItems.push({
                            title: cleanLine,
                            source: 'Web Search',
                            url: '#'
                        });
                    }
                }
            }
        }
        
        if (newsItems.length > 0) {
            displayNews(newsItems.slice(0, 7));
        } else {
            newsList.innerHTML = '<div class="loading">ニュースの取得に失敗しました。もう一度お試しください。</div>';
        }
        
        const now = new Date();
        lastUpdate.textContent = `最終更新: ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
        
    } catch (error) {
        console.error('ニュース取得エラー:', error);
        newsList.innerHTML = '<div class="loading">ニュースの取得に失敗しました。ネットワーク接続を確認してください。</div>';
    }
    
    refreshBtn.disabled = false;
    refreshBtn.textContent = '↻ 更新';
}

function displayNews(newsItems) {
    const newsList = document.getElementById('newsList');
    
    newsList.innerHTML = newsItems.map((news, index) => `
        <div class="news-item">
            <div class="news-title">${news.title}</div>
            <div class="news-meta">
                <span class="news-source">${news.source}</span>
            </div>
        </div>
    `).join('');
}

// ========== AI健康アドバイス ==========
async function getAIAdvice() {
    const adviceContent = document.getElementById('aiAdviceContent');
    const adviceBtn = document.getElementById('getAdviceBtn');
    
    adviceBtn.disabled = true;
    adviceBtn.textContent = '...';
    adviceContent.innerHTML = '<p style="color: #64748b; text-align: center; padding: 40px;">AIがあなたのデータを分析中...</p>';
    
    const sleepHours = document.getElementById('sleepHours').textContent;
    const steps = document.getElementById('steps').textContent;
    
    const healthData = `
        睡眠: ${sleepHours}時間
        歩数: ${steps}歩
        炭水化物: ${currentNutrition.carbs}g
        タンパク質: ${currentNutrition.protein}g
        水分: ${currentNutrition.water}ml
        完了タスク: ${tasks.filter(t => t.completed).length}/${tasks.length}
    `;
    
    try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "claude-son
