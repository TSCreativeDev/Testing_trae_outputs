// DOM Elements
const tasksList = document.getElementById('tasks-list');
const addTaskBtn = document.getElementById('add-task-btn');
const taskModal = document.getElementById('task-modal');
const taskForm = document.getElementById('task-form');
const closeModalBtns = document.querySelectorAll('.close-modal');
const cancelTaskBtn = document.getElementById('cancel-task');
const taskFilter = document.getElementById('task-filter');
const navItems = document.querySelectorAll('nav ul li');
const views = document.querySelectorAll('.view');
const themeToggle = document.querySelector('.theme-toggle');
const calendarDays = document.getElementById('calendar-days');
const currentMonthElement = document.getElementById('current-month');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const addCategoryBtn = document.getElementById('add-category-btn');
const addCategoryBtnMain = document.getElementById('add-category-btn-main');
const categoryModal = document.getElementById('category-modal');
const categoryForm = document.getElementById('category-form');
const cancelCategoryBtn = document.getElementById('cancel-category');
const categoriesList = document.getElementById('categories');
const categoriesListMain = document.getElementById('categories-list');
const totalTasksElement = document.getElementById('total-tasks');
const completedTasksElement = document.getElementById('completed-tasks');
const pendingTasksElement = document.getElementById('pending-tasks');
const overdueTasksElement = document.getElementById('overdue-tasks');

// App State
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let categories = JSON.parse(localStorage.getItem('categories')) || [
    { id: 'work', name: 'Work', color: '#4CAF50' },
    { id: 'personal', name: 'Personal', color: '#2196F3' },
    { id: 'shopping', name: 'Shopping', color: '#FF9800' }
];
let currentDate = new Date();
let currentView = 'tasks';
let editingTaskId = null;
let isDarkTheme = localStorage.getItem('darkTheme') === 'true';

// Initialize the app
function init() {
    if (isDarkTheme) {
        document.body.classList.add('dark-theme');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    renderTasks();
    renderCalendar();
    renderCategories();
    updateStatistics();
    setupEventListeners();
}

// Event Listeners
function setupEventListeners() {
    // Task related events
    addTaskBtn.addEventListener('click', openAddTaskModal);
    taskForm.addEventListener('submit', handleTaskFormSubmit);
    closeModalBtns.forEach(btn => btn.addEventListener('click', closeModals));
    cancelTaskBtn.addEventListener('click', closeModals);
    taskFilter.addEventListener('change', renderTasks);
    
    // Navigation events
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const view = item.getAttribute('data-view');
            changeView(view);
        });
    });
    
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Calendar navigation
    prevMonthBtn.addEventListener('click', () => navigateMonth(-1));
    nextMonthBtn.addEventListener('click', () => navigateMonth(1));
    
    // Category related events
    addCategoryBtn.addEventListener('click', openAddCategoryModal);
    addCategoryBtnMain.addEventListener('click', openAddCategoryModal);
    categoryForm.addEventListener('submit', handleCategoryFormSubmit);
    cancelCategoryBtn.addEventListener('click', closeModals);
    
    // Window events
    window.addEventListener('click', (e) => {
        if (e.target === taskModal || e.target === categoryModal) {
            closeModals();
        }
    });
}

// Task Functions
function renderTasks() {
    const filterValue = taskFilter.value;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let filteredTasks = [...tasks];
    
    if (filterValue === 'today') {
        filteredTasks = tasks.filter(task => {
            const taskDate = new Date(task.date);
            taskDate.setHours(0, 0, 0, 0);
            return taskDate.getTime() === today.getTime();
        });
    } else if (filterValue === 'upcoming') {
        filteredTasks = tasks.filter(task => {
            const taskDate = new Date(task.date);
            taskDate.setHours(0, 0, 0, 0);
            return taskDate.getTime() > today.getTime();
        });
    } else if (filterValue === 'completed') {
        filteredTasks = tasks.filter(task => task.completed);
    }
    
    tasksList.innerHTML = '';
    
    if (filteredTasks.length === 0) {
        tasksList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tasks" style="font-size: 3rem; color: var(--primary-light); margin-bottom: 15px;"></i>
                <h3>No tasks found</h3>
                <p>Add a new task to get started</p>
            </div>
        `;
        return;
    }
    
    filteredTasks.sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }
        return new Date(a.date) - new Date(b.date);
    });
    
    filteredTasks.forEach(task => {
        const taskDate = new Date(task.date);
        const isOverdue = !task.completed && taskDate < today;
        
        const taskElement = document.createElement('div');
        taskElement.className = `task-item priority-${task.priority} ${task.completed ? 'task-completed' : ''}`;
        
        const category = categories.find(cat => cat.id === task.category) || { name: 'Uncategorized', color: '#999' };
        
        taskElement.innerHTML = `
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-id="${task.id}">
                ${task.completed ? '<i class="fas fa-check"></i>' : ''}
            </div>
            <div class="task-content">
                <h3 class="task-title">${task.title}</h3>
                <div class="task-details">
                    <span><i class="far fa-calendar-alt"></i> ${formatDate(task.date)}</span>
                    <span class="task-category" style="background-color: ${category.color}">${category.name}</span>
                    ${isOverdue ? '<span class="task-overdue"><i class="fas fa-exclamation-circle"></i> Overdue</span>' : ''}
                </div>
            </div>
            <div class="task-actions">
                <button class="task-action-btn edit-task" data-id="${task.id}"><i class="fas fa-edit"></i></button>
                <button class="task-action-btn delete-task" data-id="${task.id}"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;
        
        tasksList.appendChild(taskElement);
        
        // Add event listeners to the task item
        const checkbox = taskElement.querySelector('.task-checkbox');
        checkbox.addEventListener('click', () => toggleTaskCompletion(task.id));
        
        const editBtn = taskElement.querySelector('.edit-task');
        editBtn.addEventListener('click', () => openEditTaskModal(task.id));
        
        const deleteBtn = taskElement.querySelector('.delete-task');
        deleteBtn.addEventListener('click', () => deleteTask(task.id));
    });
}

function openAddTaskModal() {
    editingTaskId = null;
    document.getElementById('modal-title').textContent = 'Add New Task';
    taskForm.reset();
    
    // Set default date to today
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    document.getElementById('task-date').value = formattedDate;
    
    // Update category options
    updateCategoryOptions();
    
    taskModal.classList.add('active');
}

function openEditTaskModal(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    editingTaskId = taskId;
    document.getElementById('modal-title').textContent = 'Edit Task';
    
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-description').value = task.description || '';
    document.getElementById('task-date').value = task.date;
    document.getElementById('task-time').value = task.time || '';
    document.getElementById('task-category').value = task.category;
    document.getElementById('task-priority').value = task.priority;
    
    // Update category options
    updateCategoryOptions();
    
    taskModal.classList.add('active');
}

function handleTaskFormSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-description').value;
    const date = document.getElementById('task-date').value;
    const time = document.getElementById('task-time').value;
    const category = document.getElementById('task-category').value;
    const priority = document.getElementById('task-priority').value;
    
    if (editingTaskId) {
        // Update existing task
        const taskIndex = tasks.findIndex(t => t.id === editingTaskId);
        if (taskIndex !== -1) {
            tasks[taskIndex] = {
                ...tasks[taskIndex],
                title,
                description,
                date,
                time,
                category,
                priority,
                updatedAt: new Date().toISOString()
            };
        }
    } else {
        // Add new task
        const newTask = {
            id: generateId(),
            title,
            description,
            date,
            time,
            category,
            priority,
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        tasks.push(newTask);
    }
    
    saveTasks();
    closeModals();
    renderTasks();
    renderCalendar();
    updateStatistics();
}

function toggleTaskCompletion(taskId) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        tasks[taskIndex].updatedAt = new Date().toISOString();
        
        if (tasks[taskIndex].completed) {
            tasks[taskIndex].completedAt = new Date().toISOString();
        } else {
            tasks[taskIndex].completedAt = null;
        }
        
        saveTasks();
        renderTasks();
        updateStatistics();
    }
}

function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveTasks();
        renderTasks();
        renderCalendar();
        updateStatistics();
    }
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Calendar Functions
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Update month display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    currentMonthElement.textContent = `${monthNames[month]} ${year}`;
    
    // Get first day of the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the day of the week for the first day (0 = Sunday, 6 = Saturday)
    const firstDayIndex = firstDay.getDay();
    
    // Get the number of days in the month
    const daysInMonth = lastDay.getDate();
    
    // Get the number of days in the previous month
    const prevLastDay = new Date(year, month, 0);
    const prevDaysInMonth = prevLastDay.getDate();
    
    // Get the number of days to display from the previous month
    const prevDays = firstDayIndex;
    
    // Get the number of days to display from the next month
    const nextDays = 42 - (prevDays + daysInMonth); // 42 = 6 rows * 7 days
    
    // Clear calendar days
    calendarDays.innerHTML = '';
    
    // Previous month days
    for (let i = prevDays - 1; i >= 0; i--) {
        const day = prevDaysInMonth - i;
        const dayElement = createCalendarDay(day, 'other-month', new Date(year, month - 1, day));
        calendarDays.appendChild(dayElement);
    }
    
    // Current month days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        const isToday = date.getTime() === today.getTime();
        
        const dayElement = createCalendarDay(i, isToday ? 'today' : '', date);
        calendarDays.appendChild(dayElement);
    }
    
    // Next month days
    for (let i = 1; i <= nextDays; i++) {
        const dayElement = createCalendarDay(i, 'other-month', new Date(year, month + 1, i));
        calendarDays.appendChild(dayElement);
    }
}

function createCalendarDay(day, className, date) {
    const dayElement = document.createElement('div');
    dayElement.className = `calendar-day ${className}`;
    
    // Format date for comparison
    const dateString = formatDateForComparison(date);
    
    // Get tasks for this day
    const dayTasks = tasks.filter(task => {
        const taskDate = formatDateForComparison(new Date(task.date));
        return taskDate === dateString;
    });
    
    // Create day content
    dayElement.innerHTML = `
        <div class="day-number">${day}</div>
        <div class="day-tasks">
            ${dayTasks.length > 0 ? 
                dayTasks.slice(0, 3).map(task => {
                    const category = categories.find(cat => cat.id === task.category) || { color: '#999' };
                    return `<div class="day-task" style="background-color: ${category.color}">${task.title}</div>`;
                }).join('') : ''}
            ${dayTasks.length > 3 ? `<div class="day-task-more">+${dayTasks.length - 3} more</div>` : ''}
        </div>
    `;
    
    // Add click event to show tasks for this day
    dayElement.addEventListener('click', () => {
        taskFilter.value = 'all';
        const clickedDate = formatDateForStorage(date);
        
        // Filter tasks for this day
        const filteredTasks = tasks.filter(task => task.date === clickedDate);
        
        if (filteredTasks.length > 0) {
            changeView('tasks');
            
            // Highlight tasks for this day
            setTimeout(() => {
                renderTasks();
                
                // Add a temporary class to highlight the tasks
                const taskElements = document.querySelectorAll('.task-item');
                taskElements.forEach(el => {
                    const taskId = el.querySelector('.task-checkbox').getAttribute('data-id');
                    const task = filteredTasks.find(t => t.id === taskId);
                    
                    if (task) {
                        el.classList.add('highlighted');
                        setTimeout(() => {
                            el.classList.remove('highlighted');
                        }, 2000);
                    }
                });
            }, 100);
        } else {
            // If no tasks, open add task modal with the selected date
            document.getElementById('task-date').value = clickedDate;
            openAddTaskModal();
        }
    });
    
    return dayElement;
}

function navigateMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    renderCalendar();
}

// Category Functions
function renderCategories() {
    // Update sidebar categories list
    categoriesList.innerHTML = `
        <li data-category="all" class="active">All</li>
        ${categories.map(category => `
            <li data-category="${category.id}" style="border-left: 3px solid ${category.color}">${category.name}</li>
        `).join('')}
    `;
    
    // Add event listeners to category items
    const categoryItems = categoriesList.querySelectorAll('li');
    categoryItems.forEach(item => {
        item.addEventListener('click', () => {
            categoryItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            const category = item.getAttribute('data-category');
            filterTasksByCategory(category);
        });
    });
    
    // Update categories view
    if (categoriesListMain) {
        categoriesListMain.innerHTML = '';
        
        categories.forEach(category => {
            const categoryTasks = tasks.filter(task => task.category === category.id);
            const completedTasks = categoryTasks.filter(task => task.completed).length;
            
            const categoryElement = document.createElement('div');
            categoryElement.className = 'category-card';
            categoryElement.innerHTML = `
                <div class="category-header">
                    <h3>${category.name}</h3>
                    <div class="category-color" style="background-color: ${category.color}"></div>
                </div>
                <div class="category-stats">
                    <span>${categoryTasks.length} tasks</span>
                    <span>${completedTasks} completed</span>
                </div>
                <div class="category-actions">
                    <button class="btn-small edit-category" data-id="${category.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn-small delete-category" data-id="${category.id}"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            
            categoriesListMain.appendChild(categoryElement);
            
            // Add event listeners
            const editBtn = categoryElement.querySelector('.edit-category');
            editBtn.addEventListener('click', () => openEditCategoryModal(category.id));
            
            const deleteBtn = categoryElement.querySelector('.delete-category');
            deleteBtn.addEventListener('click', () => deleteCategory(category.id));
        });
    }
    
    // Update task form category options
    updateCategoryOptions();
}

function updateCategoryOptions() {
    const categorySelect = document.getElementById('task-category');
    if (categorySelect) {
        categorySelect.innerHTML = categories.map(category => 
            `<option value="${category.id}">${category.name}</option>`
        ).join('');
    }
}

function openAddCategoryModal() {
    document.getElementById('category-name').value = '';
    document.getElementById('category-color').value = '#4CAF50';
    categoryModal.classList.add('active');
}

function openEditCategoryModal(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;
    
    document.getElementById('category-name').value = category.name;
    document.getElementById('category-color').value = category.color;
    
    // Store the category ID in a data attribute
    categoryForm.setAttribute('data-editing-id', categoryId);
    
    categoryModal.classList.add('active');
}

function handleCategoryFormSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('category-name').value;
    const color = document.getElementById('category-color').value;
    
    const editingId = categoryForm.getAttribute('data-editing-id');
    
    if (editingId) {
        // Update existing category
        const categoryIndex = categories.findIndex(c => c.id === editingId);
        if (categoryIndex !== -1) {
            categories[categoryIndex] = {
                ...categories[categoryIndex],
                name,
                color
            };
        }
        
        // Remove the data attribute
        categoryForm.removeAttribute('data-editing-id');
    } else {
        // Add new category
        const newCategory = {
            id: generateId(),
            name,
            color
        };
        
        categories.push(newCategory);
    }
    
    saveCategories();
    closeModals();
    renderCategories();
    renderTasks();
}

function deleteCategory(categoryId) {
    if (confirm('Are you sure you want to delete this category? Tasks in this category will be set to uncategorized.')) {
        // Update tasks that use this category
        tasks.forEach(task => {
            if (task.category === categoryId) {
                task.category = 'uncategorized';
            }
        });
        
        // Remove the category
        categories = categories.filter(c => c.id !== categoryId);
        
        saveCategories();
        saveTasks();
        renderCategories();
        renderTasks();
    }
}

function filterTasksByCategory(categoryId) {
    if (categoryId === 'all') {
        renderTasks();
        return;
    }
    
    const filteredTasks = tasks.filter(task => task.category === categoryId);
    
    tasksList.innerHTML = '';
    
    if (filteredTasks.length === 0) {
        tasksList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tag" style="font-size: 3rem; color: var(--primary-light); margin-bottom: 15px;"></i>
                <h3>No tasks in this category</h3>
                <p>Add a new task to get started</p>
            </div>
        `;
        return;
    }
    
    filteredTasks.sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }
        return new Date(a.date) - new Date(b.date);
    });
    
    filteredTasks.forEach(task => {
        // Render task (same code as in renderTasks)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const taskDate = new Date(task.date);
        const isOverdue = !task.completed && taskDate < today;
        
        const taskElement = document.createElement('div');
        taskElement.className = `task-item priority-${task.priority} ${task.completed ? 'task-completed' : ''}`;
        
        const category = categories.find(cat => cat.id === task.category) || { name: 'Uncategorized', color: '#999' };
        
        taskElement.innerHTML = `
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-id="${task.id}">
                ${task.completed ? '<i class="fas fa-check"></i>' : ''}
            </div>
            <div class="task-content">
                <h3 class="task-title">${task.title}</h3>
                <div class="task-details">
                    <span><i class="far fa-calendar-alt"></i> ${formatDate(task.date)}</span>
                    <span class="task-category" style="background-color: ${category.color}">${category.name}</span>
                    ${isOverdue ? '<span class="task-overdue"><i class="fas fa-exclamation-circle"></i> Overdue</span>' : ''}
                </div>
            </div>
            <div class="task-actions">
                <button class="task-action-btn edit-task" data-id="${task.id}"><i class="fas fa-edit"></i></button>
                <button class="task-action-btn delete-task" data-id="${task.id}"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;
        
        tasksList.appendChild(taskElement);
        
        // Add event listeners to the task item
        const checkbox = taskElement.querySelector('.task-checkbox');
        checkbox.addEventListener('click', () => toggleTaskCompletion(task.id));
        
        const editBtn = taskElement.querySelector('.edit-task');
        editBtn.addEventListener('click', () => openEditTaskModal(task.id));
        
        const deleteBtn = taskElement.querySelector('.delete-task');
        deleteBtn.addEventListener('click', () => deleteTask(task.id));
    });
}

function saveCategories() {
    localStorage.setItem('categories', JSON.stringify(categories));
}

// Statistics Functions
function updateStatistics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const overdueTasks = tasks.filter(task => {
        const taskDate = new Date(task.date);
        return !task.completed && taskDate < today;
    }).length;
    
    totalTasksElement.textContent = totalTasks;
    completedTasksElement.textContent = completedTasks;
    pendingTasksElement.textContent = pendingTasks;
    overdueTasksElement.textContent = overdueTasks;
    
    // If we had a chart library, we would update the chart here
}

// Utility Functions
function changeView(view) {
    currentView = view;
    
    // Update navigation
    navItems.forEach(item => {
        if (item.getAttribute('data-view') === view) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Update views
    views.forEach(viewElement => {
        if (viewElement.id === `${view}-view`) {
            viewElement.classList.remove('hidden');
        } else {
            viewElement.classList.add('hidden');
        }
    });
    
    // Refresh the current view
    if (view === 'tasks') {
        renderTasks();
    } else if (view === 'calendar') {
        renderCalendar();
    } else if (view === 'categories') {
        renderCategories();
    } else if (view === 'statistics') {
        updateStatistics();
    }
}

function toggleTheme() {
    isDarkTheme = !isDarkTheme;
    
    if (isDarkTheme) {
        document.body.classList.add('dark-theme');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.body.classList.remove('dark-theme');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
    
    localStorage.setItem('darkTheme', isDarkTheme);
}

function closeModals() {
    taskModal.classList.remove('active');
    categoryModal.classList.remove('active');
    editingTaskId = null;
    categoryForm.removeAttribute('data-editing-id');
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
}

function formatDateForComparison(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDateForStorage(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Initialize the app
document.addEventListener('DOMContentLoaded', init);