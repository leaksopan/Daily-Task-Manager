// Task data structure
let tasks = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    setupNotifications();
    initializeWeeklyView();
    updateAllCountdowns();
});

// Request notification permission
async function setupNotifications() {
    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('Notification permission denied');
        }
    } catch (error) {
        console.error('Error requesting notification permission:', error);
    }
}

// Add new task
function addTask() {
    const taskInput = document.getElementById('taskInput');
    const startTime = document.getElementById('startTime');
    const endTime = document.getElementById('endTime');
    const category = document.getElementById('taskCategory');
    const priority = document.getElementById('taskPriority');
    const recurring = document.getElementById('recurringType');
    const reminder = document.getElementById('reminderTime');
    const description = document.getElementById('taskDescription');
    const taskDate = document.getElementById('taskDate').value; // 🆕 Tambah ini
    tasks.push(task);
    saveTasks();
    renderTask(task);
    updateWeeklyView(); // Add this line
    scheduleNotification(task);
    clearForm()

    // Validate inputs
    if (!validateInputs(taskInput, startTime, endTime)) return;

    const task = {
        id: Date.now(),
        title: taskInput.value,
        startTime: startTime.value,
        endTime: endTime.value,
        category: category.value,
        priority: priority.value,
        recurring: recurring.value,
        reminderTime: parseInt(reminder.value),
        description: description.value,
        status: 'not-started',
        createdAt: new Date().toISOString(),
        completed: false,
        date: document.getElementById('taskDate').value, // Ambil nilai dari input tanggal
        
        
    };

    tasks.push(task);
    saveTasks();
    renderTask(task);
    scheduleNotification(task);
    clearForm();
}

// Validate form inputs
function validateInputs(taskInput, startTime, endTime) {
    const taskDate = document.getElementById('taskDate').value; // 🆕
    if (!taskDate || taskInput.value.trim() === '' || !startTime.value || !endTime.value) {
        alert('Please fill in all required fields');
        return false;
    }

    if (startTime.value >= endTime.value) {
        alert('End time must be after start time');
        return false;
    }

    return true;
}

// Render single task
function renderTask(task) {
    const li = document.createElement('li');
    li.dataset.id = task.id;
    li.dataset.category = task.category;
    li.dataset.priority = task.priority;
    li.dataset.status = task.status;
    li.className = 'draggable';
    li.draggable = true;

    const taskInfo = document.createElement('div');
    taskInfo.className = 'task-info';

    const title = document.createElement('span');
    title.className = 'task-title';
    title.textContent = task.title;

    const time = document.createElement('span');
    time.className = 'task-time';
    
    // Properly format the date and time
    try {
        const taskDate = new Date(task.date);
        if (isNaN(taskDate.getTime())) {
            throw new Error('Invalid date');
        }
        time.textContent = `${task.date}, ${formatTime(task.startTime)} - ${formatTime(task.endTime)}`;
    } catch (error) {
        console.error('Date formatting error:', error);
        time.textContent = `${formatTime(task.startTime)} - ${formatTime(task.endTime)}`;
    }

    const countdown = document.createElement('span');
    countdown.className = 'task-countdown';

    const controls = document.createElement('div');
    controls.className = 'task-controls';

    // Add status toggle button
    const statusBtn = document.createElement('button');
    statusBtn.innerHTML = getStatusIcon(task.status);
    statusBtn.onclick = () => toggleStatus(task.id);

    // Add details button
    const detailsBtn = document.createElement('button');
    detailsBtn.innerHTML = '<i class="fas fa-info-circle"></i>';
    detailsBtn.onclick = () => showTaskDetails(task);

    // Add delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        if (task.recurring !== 'none') {
            if (confirm('This is a recurring task. Do you want to delete all occurrences?')) {
                deleteTask(task.id);
            }
        } else {
            deleteTask(task.id);
        }
    };

    // Assemble elements
    taskInfo.appendChild(title);
    taskInfo.appendChild(time);
    taskInfo.appendChild(countdown);
    
    controls.appendChild(statusBtn);
    controls.appendChild(detailsBtn);
    controls.appendChild(deleteBtn);

    li.appendChild(taskInfo);
    li.appendChild(controls);

    // Add drag and drop handlers
    li.addEventListener('dragstart', handleDragStart);
    li.addEventListener('dragover', handleDragOver);
    li.addEventListener('drop', handleDrop);

    const taskList = document.getElementById('taskList');
    taskList.appendChild(li);
    updateCountdown(li);

    // Di dalam renderTask()
time.textContent = `${task.date}, ${formatTime(task.startTime)} - ${formatTime(task.endTime)}`; // ✅ Sudah benar setelah ditambahkan date
}

// Drag and Drop Handlers
function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.id);
    e.target.classList.add('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    e.target.classList.add('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    const draggedElement = document.querySelector(`[data-id="${draggedId}"]`);
    const dropTarget = e.target.closest('li');
    
    if (dropTarget && draggedElement !== dropTarget) {
        const list = dropTarget.parentNode;
        const draggedIndex = Array.from(list.children).indexOf(draggedElement);
        const dropIndex = Array.from(list.children).indexOf(dropTarget);
        
        // Reorder tasks array
        const [removed] = tasks.splice(draggedIndex, 1);
        tasks.splice(dropIndex, 0, removed);
        saveTasks();
        
        // Reorder DOM elements
        if (draggedIndex < dropIndex) {
            dropTarget.after(draggedElement);
        } else {
            dropTarget.before(draggedElement);
        }
    }
    
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
}

// Delete task
function deleteTask(taskId) {
    // Remove from tasks array
    tasks = tasks.filter(t => t.id !== parseInt(taskId));
    
    // Remove from DOM
    const taskElement = document.querySelector(`[data-id="${taskId}"]`);
    if (taskElement) {
        taskElement.remove();
    }
    
    // Save changes
    saveTasks();
    updateStatistics();
}

// Status Management
function toggleStatus(taskId) {
    const task = tasks.find(t => t.id === parseInt(taskId));
    const statusOrder = ['not-started', 'in-progress', 'completed'];
    const currentIndex = statusOrder.indexOf(task.status);
    task.status = statusOrder[(currentIndex + 1) % statusOrder.length];
    
    const taskElement = document.querySelector(`[data-id="${taskId}"]`);
    taskElement.dataset.status = task.status;
    const statusBtn = taskElement.querySelector('.task-controls button');
    statusBtn.innerHTML = getStatusIcon(task.status);
    
    saveTasks();
    updateStatistics();
}

function getStatusIcon(status) {
    const icons = {
        'not-started': '<i class="far fa-circle"></i>',
        'in-progress': '<i class="fas fa-spinner"></i>',
        'completed': '<i class="fas fa-check-circle"></i>'
    };
    return icons[status] || icons['not-started'];
}

// Time Management
function formatTime(timeStr) {
    const [hours, minutes] = timeStr.split(':');
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
}



// Notification System
function scheduleNotification(task) {
    const [hours, minutes] = task.startTime.split(':');
    const taskDate = new Date(task.date); // ✅ Gunakan tanggal dari task
    taskDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    // ... kode selanjutnya tetap

    
    const notificationTime = new Date(taskDate - task.reminderTime * 60000);
    
    setTimeout(() => {
        if (Notification.permission === 'granted' && new Date() < taskDate) {
            new Notification('Task Reminder', {
                body: `${task.title} starts in ${task.reminderTime} minutes`,
                icon: '/favicon.ico'
            });
        }
    }, notificationTime - new Date());
}
    const task = tasks.find(t => t.id === parseInt(taskId));
    const statusOrder = ['not-started', 'in-progress', 'completed'];
    const currentIndex = statusOrder.indexOf(task.status);
    task.status = statusOrder[(currentIndex + 1) % statusOrder.length];
    
    const taskElement = document.querySelector(`[data-id="${taskId}"]`);
    taskElement.dataset.status = task.status;
    const statusBtn = taskElement.querySelector('.task-controls button');
    statusBtn.innerHTML = getStatusIcon(task.status);
    
    saveTasks();
    updateStatistics();


function getStatusIcon(status) {
    const icons = {
        'not-started': '<i class="far fa-circle"></i>',
        'in-progress': '<i class="fas fa-spinner"></i>',
        'completed': '<i class="fas fa-check-circle"></i>'
    };
    return icons[status] || icons['not-started'];
}

// Time Management
function formatTime(timeStr) {
    const [hours, minutes] = timeStr.split(':');
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
}

function updateCountdown(taskElement) {
    const task = tasks.find(t => t.id === parseInt(taskElement.dataset.id));
    if (!task) return;

    const now = new Date();
    
    // Create date object with proper timezone handling
    const taskDateTime = new Date(task.date + 'T' + task.startTime + ':00');
    
    // Handle invalid dates
    if (isNaN(taskDateTime)) {
        console.error('Invalid task date/time:', task.date, task.startTime);
        return;
    }

    const diff = taskDateTime - now;
    const countdown = taskElement.querySelector('.task-countdown');

    if (diff < 0) {
        countdown.textContent = ' (Started)';
        countdown.className = 'task-countdown started';
    } else {
        const daysLeft = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hoursLeft = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        const dayText = daysLeft > 0 ? `${daysLeft}d ` : '';
        countdown.textContent = ` (Starts in ${dayText}${hoursLeft}h ${minutesLeft}m)`;
        countdown.className = 'task-countdown pending';
    }
}

// Notification System


// Statistics and Analytics
function updateStatistics() {
    const stats = {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        byCategory: {},
        byPriority: {}
    };

    // Calculate category stats
    tasks.forEach(task => {
        stats.byCategory[task.category] = (stats.byCategory[task.category] || 0) + 1;
        stats.byPriority[task.priority] = (stats.byPriority[task.priority] || 0) + 1;
    });

    return stats;
}

function showStatistics() {
    const stats = updateStatistics();
    const modal = document.getElementById('statisticsModal');
    const content = document.getElementById('statisticsContent');
    
    content.innerHTML = `
        <div class="statistics-grid">
            <div class="stat-card">
                <h3>Total Tasks</h3>
                <p>${stats.total}</p>
            </div>
            <div class="stat-card">
                <h3>Completed</h3>
                <p>${stats.completed}</p>
            </div>
            <div class="stat-card">
                <h3>In Progress</h3>
                <p>${stats.inProgress}</p>
            </div>
        </div>
        <h3>By Category</h3>
        <ul>
            ${Object.entries(stats.byCategory).map(([cat, count]) => 
                `<li>${cat}: ${count}</li>`).join('')}
        </ul>
        <h3>By Priority</h3>
        <ul>
            ${Object.entries(stats.byPriority).map(([pri, count]) => 
                `<li>${pri}: ${count}</li>`).join('')}
        </ul>
    `;
    
    modal.style.display = 'block';
}

// Data Persistence
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
        // Perbaiki format tanggal untuk task lama
        tasks.forEach(task => {
            if (!task.date) task.date = new Date().toISOString().split('T')[0];
        });
        tasks.forEach(task => renderTask(task));
    }
}

// Export/Import
function exportTasks() {
    const dataStr = JSON.stringify(tasks, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasks_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
}

function importTasks(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedTasks = JSON.parse(e.target.result);
            tasks = importedTasks;
            saveTasks();
            document.getElementById('taskList').innerHTML = '';
            tasks.forEach(task => renderTask(task));
        } catch (error) {
            alert('Error importing tasks: Invalid file format');
        }
    };
    reader.readAsText(file);
}

// Utility Functions
function clearForm() {
    document.getElementById('taskInput').value = '';
    document.getElementById('startTime').value = '';
    document.getElementById('endTime').value = '';
    document.getElementById('taskDescription').value = '';
}

// Initialize weekly view
function initializeWeeklyView() {
    const weekGrid = document.querySelector('.week-grid');
    weekGrid.innerHTML = '';
    
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
    
    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startOfWeek);
        currentDate.setDate(startOfWeek.getDate() + i);
        
        const dayEl = document.createElement('div');
        dayEl.className = 'week-day';
        const dateStr = currentDate.toISOString().split('T')[0];
        dayEl.innerHTML = `
            <h3>${currentDate.toLocaleDateString('en-US', { weekday: 'long' })}</h3>
            <div class="date-display">${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
            <ul class="day-tasks" data-date="${dateStr}"></ul>
        `;
        weekGrid.appendChild(dayEl);
    }
    updateWeeklyView(); // Refresh tasks after initializing
}

function updateWeeklyView() {
    document.querySelectorAll('.day-tasks').forEach(ul => ul.innerHTML = '');
    
    const sortedTasks = [...tasks].sort((a, b) => 
        `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));

    sortedTasks.forEach(task => {
        const taskDate = new Date(task.date).toISOString().split('T')[0];
        const dayList = document.querySelector(`.day-tasks[data-date="${taskDate}"]`);
        
        if (dayList) {
            const taskEl = document.createElement('li');
            taskEl.className = 'week-task';
            taskEl.innerHTML = `
                <span class="task-title">${task.title}</span>
                <span class="task-time">${formatTime(task.startTime)} - ${formatTime(task.endTime)}</span>
            `;
            dayList.appendChild(taskEl);
        }
    });
}



// View switching
function switchView(view) {
    document.querySelectorAll('.task-view').forEach(el => el.classList.remove('active'));
    document.getElementById(`${view}View`).classList.add('active');
    
    document.querySelectorAll('.view-controls button').forEach(btn => {
        btn.classList.toggle('active', btn.onclick.toString().includes(view));
    });

    if (view === 'weekly') {
        initializeWeeklyView(); // Refresh weekly view when switching
    }
}

// Modal controls
function closeStatistics() {
    document.getElementById('statisticsModal').style.display = 'none';
}

function closeTaskDetails() {
    document.getElementById('taskDetailsModal').style.display = 'none';
}

// Update all countdowns periodically
setInterval(() => {
    document.querySelectorAll('#taskList li').forEach(updateCountdown);
}, 60000);

// Filter tasks
function applyFilters() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const priorityFilter = document.getElementById('priorityFilter').value;
    
    document.querySelectorAll('#taskList li').forEach(li => {
        const matchesCategory = categoryFilter === 'all' || li.dataset.category === categoryFilter;
        const matchesStatus = statusFilter === 'all' || li.dataset.status === statusFilter;
        const matchesPriority = priorityFilter === 'all' || li.dataset.priority === priorityFilter;
        
        li.style.display = matchesCategory && matchesStatus && matchesPriority ? 'flex' : 'none';
    });
}

function showTaskDetails(task) {
    const modal = document.getElementById('taskDetailsModal');
    const content = document.getElementById('taskDetailsContent');
    
    content.innerHTML = `
        <h4>${task.title}</h4>
        <p><strong>Category:</strong> ${task.category}</p>
        <p><strong>Priority:</strong> ${task.priority}</p>
        <p><strong>Time:</strong> ${task.date} | ${task.startTime} - ${task.endTime}</p>
        <p><strong>Description:</strong> ${task.description}</p>
    `;
    
    modal.style.display = 'block';
}

// Di script.js
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });
}

let currentViewDate = new Date();

function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';
    
    // Generate calendar logic
    const daysInMonth = new Date(currentViewDate.getFullYear(), 
                               currentViewDate.getMonth() + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.innerHTML = `
            <div class="day-number">${day}</div>
            <div class="calendar-tasks" data-date="${currentViewDate.getFullYear()}-${String(currentViewDate.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}"></div>
        `;
        calendarGrid.appendChild(dayCell);
    }
    updateCalendarTasks();
}

// Daily Quotes Data
const motivationalQuotes = [
    {
        text: "The future belongs to those who believe in the beauty of their dreams.",
        author: "- Eleanor Roosevelt"
    },
    {
        text: "Success is not final, failure is not fatal: It is the courage to continue that counts.",
        author: "- Winston Churchill"
    },
    {
        text: "The only limit to our realization of tomorrow will be our doubts of today.",
        author: "- Franklin D. Roosevelt"
    },
    {
        text: "Don't watch the clock; do what it does. Keep going.",
        author: "- Sam Levenson"
    },
    {
        text: "The way to get started is to quit talking and begin doing.",
        author: "- Walt Disney"
    }
];

// Show Daily Quote
function showDailyQuote() {
    // Get day-based index for consistent daily quote
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const quoteIndex = dayOfYear % motivationalQuotes.length;
    
    document.getElementById('dailyQuote').textContent = motivationalQuotes[quoteIndex].text;
    document.getElementById('quoteAuthor').textContent = motivationalQuotes[quoteIndex].author;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Add this to existing DOMContentLoaded callback
    showDailyQuote();
});