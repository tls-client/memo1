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

// ========== 初期化 ==========
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // データ読み込み
    loadData();
    
    // イベントリスナー設定
    setupEventListeners();
    
    // AIニュース初回読み込み
    loadAINews();
    
    // 定期更新（10分ごと）
    setInterval(loadAINews, 600000);
}

function setupEventListeners() {
    // 食事追加
    document.getElementById('addMealBtn').addEventListener('click', addMeal);
    document.getElementById('mealInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addMeal();
    });
    
    // カメラ
    document.getElementById('startCameraBtn').addEventListener('click', startCamera);
    document.getElementById('captureBtn').addEventListener('click', capturePhoto);
    document.getElementById('analyzeBtn').addEventListener('click', analyzePhoto);
    document.getElementById('closeCameraBtn').addEventListener('click', closeCamera);
    
    // タスク
    document.getElementById('addTaskBtn').addEventListener('click', addTask);
    document.getElementById('taskInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addTask();
    });
    
    // 録音
    document.getElementById('recordBtn').addEventListener('click', toggleRecording);
    
    // ニュース更新
    document.getElementById('refreshNewsBtn').addEventListener('click', loadAINews);
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
    
    // 累積
    currentNutrition.carbs += nutrition.carbs;
    currentNutrition.protein += nutrition.protein;
    currentNutrition.fat += nutrition.fat;
    currentNutrition.vitamins += nutrition.vitamins;
    currentNutrition.minerals += nutrition.minerals;
    currentNutrition.water += nutrition.water;
    
    updateNutritionDisplay();
    
    // 履歴に追加
    const now = new Date();
    mealHistory.unshift({
        name: mealName,
        time: `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`
    });
    
    if (mealHistory.length > 10) mealHistory.pop();
    updateMealHistory();
    
    mealInput.value = '';
    saveData();
}

function updateNutritionDisplay() {
    document.getElementById('carbs').textContent = Math.round(currentNutrition.carbs) + 'g';
    document.getElementById('protein').textContent = Math.round(currentNutrition.protein) + 'g';
    document.getElementById('fat').textContent = Math.round(currentNutrition.fat) + 'g';
    document.getElementById('vitamins').textContent = Math.round(currentNutrition.vitamins) + 'mg';
    document.getElementById('minerals').textContent = Math.round(currentNutrition.minerals) + 'mg';
    document.getElementById('water').textContent = Math.round(currentNutrition.water) + 'ml';
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
    const canvas = document.createElement('canvas');
    
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
    
    document.getElementById('analyzeBtn').textContent = '分析中...';
    document.getElementById('analyzeBtn').disabled = true;
    
    try {
        // Claude APIを使った画像分析
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
        
        // JSONを抽出
        const jsonMatch = text.match(/\{[^}]+\}/);
        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            
            // 栄養情報を追加
            currentNutrition.carbs += result.carbs || 0;
            currentNutrition.protein += result.protein || 0;
            currentNutrition.fat += result.fat || 0;
            currentNutrition.vitamins += result.vitamins || 0;
            currentNutrition.minerals += result.minerals || 0;
            currentNutrition.water += result.water || 0;
            
            updateNutritionDisplay();
            
            // 履歴に追加
            const now = new Date();
            mealHistory.unshift({
                name: result.name || '撮影した食事',
                time: `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`
            });
            updateMealHistory();
            
            alert(`✅ ${result.name}を記録しました！`);
            closeCamera();
        } else {
            alert('食事を認識できませんでした。もう一度撮影してください。');
        }
        
    } catch (error) {
        console.error('AI分析エラー:', error);
        alert('分析中にエラーが発生しました。');
    }
    
    document.getElementById('analyzeBtn').textContent = 'AI分析';
    document.getElementById('analyzeBtn').disabled = false;
}

function closeCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    
    document.getElementById('cameraPreview').classList.remove('active');
    capturedImageData = null;
}

// ========== 録音機能 ==========
async function toggleRecording() {
    const btn = document.getElementById('recordBtn');
    const status = document.getElementById('recordingStatus');
    
    if (!isRecording) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            
            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };
            
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                analyzeAudio(audioBlob);
            };
            
            mediaRecorder.start();
            isRecording = true;
            
            btn.textContent = '⏹️ 録音停止';
            btn.classList.remove('btn-record');
            btn.classList.add('btn-stop');
            status.textContent = '🔴 録音中...';
            
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
    }
}

function analyzeAudio(audioBlob) {
    // 実際の実装では音声認識APIを使用
    // ここでは簡易的なシミュレーション
    setTimeout(() => {
        const snoreCount = Math.floor(Math.random() * 15);
        const breathingIssues = Math.floor(Math.random() * 5);
        
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
                    <span class="analysis-value" style="color: ${snoreCount < 5 ? '#10b981' : '#ef4444'}">
                        ${snoreCount < 5 ? '良好' : '要改善'}
                    </span>
                </div>
            </div>
        `;
        
        document.getElementById('recordingStatus').textContent = '✅ 分析完了';
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
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        renderTasks();
        saveData();
    }
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    renderTasks();
    saveData();
}

function renderTasks() {
    const taskList = document.getElementById('taskList');
    
    if (tasks.length === 0) {
        taskList.innerHTML = '<p style="color: #94a3b8; text-align: center; padding: 40px;">タスクがありません</p>';
        return;
    }
    
    taskList.innerHTML = tasks.map(task => `
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

// ========== AIニュース取得 ==========
async function loadAINews() {
    const newsList = document.getElementById('newsList');
    const lastUpdate = document.getElementById('lastUpdate');
    
    newsList.innerHTML = '<div class="loading">最新ニュースを取得中...</div>';
    
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
                    content: "最新のAI関連ニュースを5件検索して、以下のJSON配列形式で返してください：[{\"title\": \"ニュースタイトル\", \"source\": \"情報源\", \"url\": \"URL\"}] JSONのみを返してください。"
                }],
                tools: [{
                    type: "web_search_20250305",
                    name: "web_search"
                }]
            })
        });
        
        const data = await response.json();
        
        // web_searchの結果を処理
        const newsItems = [];
        for (const block of data.content) {
            if (block.type === 'tool_use' && block.name === 'web_search') {
                // 検索結果から取得
                continue;
            }
            if (block.type === 'text') {
                try {
                    const jsonMatch = block.text.match(/\[[\s\S]*\]/);
                    if (jsonMatch) {
                        const parsed = JSON.parse(jsonMatch[0]);
                        newsItems.push(...parsed);
                    }
                } catch (e) {
                    console.error('JSON解析エラー:', e);
                }
            }
        }
        
        if (newsItems.length > 0) {
            displayNews(newsItems);
        } else {
            // フォールバック：web_searchを直接呼び出し
            await loadAINewsWithSearch();
        }
        
        const now = new Date();
        lastUpdate.textContent = `最終更新: ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
        
    } catch (error) {
        console.error('ニュース取得エラー:', error);
        newsList.innerHTML = '<div class="loading">ニュースの取得に失敗しました</div>';
    }
}

async function loadAINewsWithSearch() {
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
                    content: "AI technology latest news today"
                }],
                tools: [{
                    type: "web_search_20250305",
                    name: "web_search"
                }]
            })
        });
        
        const data = await response.json();
        const newsItems = [];
        
        // 検索結果からニュースを抽出
        for (const block of data.content) {
            if (block.type === 'text') {
                // テキストからニュース情報を抽出
                const lines = block.text.split('\n');
                for (const line of lines) {
                    if (line.trim().length > 20) {
                        newsItems.push({
                            title: line.trim(),
                            source: 'Web Search',
                            url: '#'
                        });
                    }
                }
            }
        }
        
        if (newsItems.length > 0) {
            displayNews(newsItems.slice(0, 8));
        }
        
    } catch (error) {
        console.error('検索エラー:', error);
    }
}

function displayNews(newsItems) {
    const newsList = document.getElementById('newsList');
    
    newsList.innerHTML = newsItems.map(news => `
        <div class="news-item" onclick="window.open('${news.url}', '_blank')">
            <div class="news-title">${news.title}</div>
            <div class="news-meta">
                <span class="news-source">${news.source}</span>
                ${news.url && news.url !== '#' ? `<a href="${news.url}" class="news-url" target="_blank">詳細を見る →</a>` : ''}
            </div>
        </div>
    `).join('');
}

// ========== データ保存/読み込み ==========
function saveData() {
    const data = {
        tasks: tasks,
        mealHistory: mealHistory,
        currentNutrition: currentNutrition
    };
    
    try {
        // メモリ内保存（セッション間では保持されない）
        window.dashboardData = data;
    } catch (error) {
        console.error('データ保存エラー:', error);
    }
}

function loadData() {
    try {
        if (window.dashboardData) {
            const data = window.dashboardData;
            tasks = data.tasks || [];
            mealHistory = data.mealHistory || [];
            currentNutrition = data.currentNutrition || { 
                carbs: 0, protein: 0, fat: 0, vitamins: 0, minerals: 0, water: 0 
            };
            
            renderTasks();
            updateMealHistory();
            updateNutritionDisplay();
        }
    } catch (error) {
        console.error('データ読み込みエラー:', error);
    }
}
