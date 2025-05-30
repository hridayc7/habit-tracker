const API_BASE = '/api';
let currentUser = null;
let habits = [];
let habitCompletions = [];
let currentTimeRange = '7d';

async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('authToken');
    
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        },
        ...options
    };

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

function initApp() {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('currentUser');
    
    if (token && userData) {
        currentUser = JSON.parse(userData);
        showMainApp();
        loadHabits();
    } else {
        showAuthSection();
    }
}

function showAuthSection() {
    document.getElementById('auth-section').classList.remove('hidden');
    document.getElementById('main-app').classList.add('hidden');
}

function showMainApp() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    showDashboard();
}

function showLogin() {
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('signup-form').classList.add('hidden');
}

function showSignup() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('signup-form').classList.remove('hidden');
}

async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    try {
        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        currentUser = response.user;
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';
        
        showMainApp();
        loadHabits();
    } catch (error) {
        alert(error.message || 'Login failed');
    }
}

async function signup() {
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    
    if (!name || !email || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    try {
        const response = await apiRequest('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ name, email, password })
        });
        
        currentUser = response.user;
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        
        document.getElementById('signup-name').value = '';
        document.getElementById('signup-email').value = '';
        document.getElementById('signup-password').value = '';
        
        showMainApp();
        loadHabits();
    } catch (error) {
        alert(error.message || 'Signup failed');
    }
}

function logout() {
    currentUser = null;
    habits = [];
    habitCompletions = [];
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    showAuthSection();
    showLogin();
}

async function loadHabits() {
    try {
        habits = await apiRequest('/habits');
        habitCompletions = await apiRequest('/habits/completions');
        renderHabits();
    } catch (error) {
        console.error('Failed to load habits:', error);
        if (error.message.includes('token')) {
            logout();
        }
    }
}

function showDashboard() {
    document.getElementById('dashboard').classList.remove('hidden');
    document.getElementById('progress-page').classList.add('hidden');
    document.getElementById('graphs-page').classList.add('hidden');
    
    document.getElementById('dashboard-btn').classList.add('active');
    document.getElementById('progress-btn').classList.remove('active');
    document.getElementById('graphs-btn').classList.remove('active');
    
    renderHabits();
}

function showProgress() {
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('progress-page').classList.remove('hidden');
    document.getElementById('graphs-page').classList.add('hidden');
    
    document.getElementById('dashboard-btn').classList.remove('active');
    document.getElementById('progress-btn').classList.add('active');
    document.getElementById('graphs-btn').classList.remove('active');
    
    loadProgressPage();
}

function showGraphs() {
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('progress-page').classList.add('hidden');
    document.getElementById('graphs-page').classList.remove('hidden');
    
    document.getElementById('dashboard-btn').classList.remove('active');
    document.getElementById('progress-btn').classList.remove('active');
    document.getElementById('graphs-btn').classList.add('active');
    
    loadGraphsPage();
}

function showAddHabitModal() {
    document.getElementById('add-habit-modal').classList.remove('hidden');
}

function hideAddHabitModal() {
    document.getElementById('add-habit-modal').classList.add('hidden');
    document.getElementById('habit-name').value = '';
    document.getElementById('habit-description').value = '';
}

async function addHabit() {
    const name = document.getElementById('habit-name').value;
    const description = document.getElementById('habit-description').value;
    
    if (!name) {
        alert('Please enter a habit name');
        return;
    }
    
    try {
        await apiRequest('/habits', {
            method: 'POST',
            body: JSON.stringify({ name, description })
        });
        
        hideAddHabitModal();
        loadHabits();
    } catch (error) {
        alert(error.message || 'Failed to add habit');
    }
}

async function deleteHabit(habitId) {
    if (confirm('Are you sure you want to delete this habit?')) {
        try {
            await apiRequest(`/habits/${habitId}`, {
                method: 'DELETE'
            });
            loadHabits();
        } catch (error) {
            alert(error.message || 'Failed to delete habit');
        }
    }
}

async function toggleHabitCompletion(habitId) {
    const today = new Date().toISOString().split('T')[0];
    const isCompleted = isHabitCompletedOnDate(habitId, today);
    
    try {
        if (isCompleted) {
            await apiRequest('/habits/completions', {
                method: 'DELETE',
                body: JSON.stringify({ habit_id: parseInt(habitId), completion_date: today })
            });
        } else {
            await apiRequest('/habits/completions', {
                method: 'POST',
                body: JSON.stringify({ habit_id: parseInt(habitId), completion_date: today })
            });
        }
        
        loadHabits();
    } catch (error) {
        alert(error.message || 'Failed to update habit completion');
    }
}

function isHabitCompletedOnDate(habitId, date) {
    return habitCompletions.some(completion => 
        completion.habit_id == habitId && completion.completion_date === date
    );
}

function renderHabits() {
    const habitsList = document.getElementById('habits-list');
    const today = new Date().toISOString().split('T')[0];
    
    if (habits.length === 0) {
        habitsList.innerHTML = '<p style="text-align: center; color: #666; margin-top: 2rem;">No habits yet. Add your first habit to get started!</p>';
        return;
    }
    
    habitsList.innerHTML = habits.map(habit => {
        const isCompleted = isHabitCompletedOnDate(habit.id, today);
        return `
            <div class="habit-card">
                <div class="habit-info">
                    <h3>${habit.name}</h3>
                    ${habit.description ? `<p>${habit.description}</p>` : ''}
                </div>
                <div class="habit-actions">
                    <button class="check-btn ${isCompleted ? 'completed' : ''}" onclick="toggleHabitCompletion('${habit.id}')">
                        ${isCompleted ? '✓ Done' : 'Mark Done'}
                    </button>
                    <button class="delete-btn" onclick="deleteHabit('${habit.id}')">×</button>
                </div>
            </div>
        `;
    }).join('');
}

function loadProgressPage() {
    updateHabitFilter();
    updateProgressView();
}

function updateHabitFilter() {
    const habitFilter = document.getElementById('habit-filter');
    habitFilter.innerHTML = '<option value="all">All Habits</option>' +
        habits.map(habit => `<option value="${habit.id}">${habit.name}</option>`).join('');
}

function updateProgressView() {
    const selectedHabitId = document.getElementById('habit-filter').value;
    const progressGrid = document.getElementById('progress-grid');
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 364);
    
    const days = [];
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        days.push(new Date(date));
    }
    
    progressGrid.innerHTML = days.map(date => {
        const dateStr = date.toISOString().split('T')[0];
        
        let completedCount = 0;
        let totalHabits = 0;
        
        if (selectedHabitId === 'all') {
            totalHabits = habits.filter(h => h.created_at.split('T')[0] <= dateStr).length;
            completedCount = habitCompletions.filter(c => c.completion_date === dateStr).length;
        } else {
            const habit = habits.find(h => h.id == selectedHabitId);
            if (habit && habit.created_at.split('T')[0] <= dateStr) {
                totalHabits = 1;
                completedCount = isHabitCompletedOnDate(selectedHabitId, dateStr) ? 1 : 0;
            }
        }
        
        let level = 0;
        if (totalHabits > 0) {
            const completionRate = completedCount / totalHabits;
            if (completionRate >= 1) level = 4;
            else if (completionRate >= 0.75) level = 3;
            else if (completionRate >= 0.5) level = 2;
            else if (completionRate > 0) level = 1;
        }
        
        return `<div class="progress-day level-${level}" data-date="${dateStr}" title="${dateStr}: ${completedCount}/${totalHabits} habits completed"></div>`;
    }).join('');
    
    updateStreakInfo(selectedHabitId);
}

function updateStreakInfo(selectedHabitId) {
    const today = new Date();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    for (let i = 0; i < 365; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        let isCompleted = false;
        
        if (selectedHabitId === 'all') {
            const availableHabits = habits.filter(h => h.created_at.split('T')[0] <= dateStr);
            if (availableHabits.length > 0) {
                const completedHabits = habitCompletions.filter(c => c.completion_date === dateStr);
                isCompleted = availableHabits.every(h => completedHabits.some(c => c.habit_id == h.id));
            }
        } else {
            const habit = habits.find(h => h.id == selectedHabitId);
            if (habit && habit.created_at.split('T')[0] <= dateStr) {
                isCompleted = isHabitCompletedOnDate(selectedHabitId, dateStr);
            }
        }
        
        if (isCompleted) {
            tempStreak++;
            if (i === 0 || currentStreak === i) {
                currentStreak = tempStreak;
            }
        } else {
            if (tempStreak > longestStreak) {
                longestStreak = tempStreak;
            }
            tempStreak = 0;
        }
    }
    
    if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
    }
    
    const streakInfo = document.createElement('div');
    streakInfo.className = 'streak-info';
    streakInfo.innerHTML = `
        <h3>Current Streak</h3>
        <div class="streak-number">${currentStreak} days</div>
        <p>Longest streak: ${longestStreak} days</p>
    `;
    
    const progressGrid = document.getElementById('progress-grid');
    const existingStreak = document.querySelector('.streak-info');
    if (existingStreak) {
        existingStreak.remove();
    }
    progressGrid.parentNode.insertBefore(streakInfo, progressGrid);
}

function setTimeRange(range) {
    currentTimeRange = range;
    
    document.querySelectorAll('.time-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${range}`).classList.add('active');
    
    loadGraphsPage();
}

function loadGraphsPage() {
    drawCompletionChart();
    drawWeeklyChart();
    drawHabitPerformanceChart();
}

function drawCompletionChart() {
    const canvas = document.getElementById('completion-chart');
    const ctx = canvas.getContext('2d');
    
    canvas.width = canvas.offsetWidth;
    canvas.height = 300;
    
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    
    ctx.clearRect(0, 0, width, height);
    
    const days = parseInt(currentTimeRange);
    const dates = [];
    const completionRates = [];
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dates.push(dateStr);
        
        const dayCompletions = habitCompletions.filter(c => c.completion_date === dateStr);
        const availableHabits = habits.filter(h => h.created_at.split('T')[0] <= dateStr);
        const rate = availableHabits.length > 0 ? (dayCompletions.length / availableHabits.length) * 100 : 0;
        completionRates.push(rate);
    }
    
    const maxRate = Math.max(...completionRates, 100);
    const stepX = (width - 2 * padding) / (dates.length - 1);
    
    ctx.strokeStyle = '#007AFF';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    for (let i = 0; i < dates.length; i++) {
        const x = padding + i * stepX;
        const y = height - padding - (completionRates[i] / maxRate) * (height - 2 * padding);
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
    
    ctx.fillStyle = '#007AFF';
    for (let i = 0; i < dates.length; i++) {
        const x = padding + i * stepX;
        const y = height - padding - (completionRates[i] / maxRate) * (height - 2 * padding);
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    ctx.strokeStyle = '#E5E5EA';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = padding + i * (height - 2 * padding) / 4;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }
    
    ctx.fillStyle = '#8E8E93';
    ctx.font = '12px -apple-system';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
        const y = padding + i * (height - 2 * padding) / 4;
        const value = Math.round((4 - i) * maxRate / 4);
        ctx.fillText(value + '%', padding - 10, y + 4);
    }
}

function drawWeeklyChart() {
    const canvas = document.getElementById('weekly-chart');
    const ctx = canvas.getContext('2d');
    
    canvas.width = canvas.offsetWidth;
    canvas.height = 300;
    
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    
    ctx.clearRect(0, 0, width, height);
    
    const weeklyData = [];
    const today = new Date();
    
    for (let week = 3; week >= 0; week--) {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - (week * 7) - today.getDay());
        
        let weekCompletions = 0;
        let weekPossible = 0;
        
        for (let day = 0; day < 7; day++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + day);
            const dateStr = date.toISOString().split('T')[0];
            
            const dayCompletions = habitCompletions.filter(c => c.completion_date === dateStr);
            const availableHabits = habits.filter(h => h.created_at.split('T')[0] <= dateStr);
            
            weekCompletions += dayCompletions.length;
            weekPossible += availableHabits.length;
        }
        
        weeklyData.push({
            week: `Week ${4 - week}`,
            rate: weekPossible > 0 ? (weekCompletions / weekPossible) * 100 : 0
        });
    }
    
    const barWidth = (width - 2 * padding) / weeklyData.length - 20;
    const maxRate = Math.max(...weeklyData.map(d => d.rate), 100);
    
    ctx.fillStyle = '#34C759';
    weeklyData.forEach((data, i) => {
        const x = padding + i * ((width - 2 * padding) / weeklyData.length) + 10;
        const barHeight = (data.rate / maxRate) * (height - 2 * padding);
        const y = height - padding - barHeight;
        
        ctx.fillRect(x, y, barWidth, barHeight);
        
        ctx.fillStyle = '#1C1C1E';
        ctx.font = '12px -apple-system';
        ctx.textAlign = 'center';
        ctx.fillText(data.week, x + barWidth/2, height - 10);
        ctx.fillText(Math.round(data.rate) + '%', x + barWidth/2, y - 10);
        ctx.fillStyle = '#34C759';
    });
}

function drawHabitPerformanceChart() {
    const canvas = document.getElementById('habit-performance-chart');
    const ctx = canvas.getContext('2d');
    
    canvas.width = canvas.offsetWidth;
    canvas.height = 300;
    
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    
    ctx.clearRect(0, 0, width, height);
    
    if (habits.length === 0) {
        ctx.fillStyle = '#8E8E93';
        ctx.font = '16px -apple-system';
        ctx.textAlign = 'center';
        ctx.fillText('No habits to display', width/2, height/2);
        return;
    }
    
    const habitPerformance = habits.map(habit => {
        const completions = habitCompletions.filter(c => c.habit_id == habit.id);
        const daysSinceCreation = Math.max(1, Math.floor((Date.now() - new Date(habit.created_at)) / (1000 * 60 * 60 * 24)));
        const rate = (completions.length / daysSinceCreation) * 100;
        
        return {
            name: habit.name.length > 15 ? habit.name.substring(0, 15) + '...' : habit.name,
            rate: Math.min(rate, 100)
        };
    });
    
    const colors = ['#007AFF', '#34C759', '#FF9500', '#AF52DE', '#FF3B30', '#5AC8FA'];
    const barHeight = (height - 2 * padding) / habitPerformance.length - 10;
    
    habitPerformance.forEach((habit, i) => {
        const y = padding + i * (barHeight + 10);
        const barWidth = (habit.rate / 100) * (width - padding - 150);
        
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(150, y, barWidth, barHeight);
        
        ctx.fillStyle = '#1C1C1E';
        ctx.font = '12px -apple-system';
        ctx.textAlign = 'right';
        ctx.fillText(habit.name, 140, y + barHeight/2 + 4);
        
        ctx.textAlign = 'left';
        ctx.fillText(Math.round(habit.rate) + '%', 155 + barWidth, y + barHeight/2 + 4);
    });
}

document.addEventListener('DOMContentLoaded', initApp);