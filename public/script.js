const API_BASE = '/api';
let currentUser = null;
let habits = [];
let habitCompletions = [];

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
    
    document.getElementById('dashboard-btn').classList.add('active');
    document.getElementById('progress-btn').classList.remove('active');
    
    renderHabits();
}

function showProgress() {
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('progress-page').classList.remove('hidden');
    
    document.getElementById('dashboard-btn').classList.remove('active');
    document.getElementById('progress-btn').classList.add('active');
    
    loadProgressPage();
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

document.addEventListener('DOMContentLoaded', initApp);