/**
 * SimLibrary - Main Application Logic
 * Handles UI rendering and user interactions
 */

// Game state instance
let game;

// Screen management
const screens = {
    tower: document.getElementById('tower-screen'),
    detail: document.getElementById('detail-screen'),
    editor: document.getElementById('editor-screen')
};

let currentScreen = 'tower';

/**
 * Initialize the application
 */
function init() {
    game = new GameState();

    // Set up event listeners
    setupEventListeners();

    // Render initial state
    renderTowerScreen();

    // Start game tick (every 5 seconds for demo purposes)
    setInterval(() => {
        game.tick();
        updateStats();

        // If on detail screen, update progress bar
        if (currentScreen === 'detail' && game.currentFloorId) {
            renderDetailScreen(game.currentFloorId);
        }
    }, 5000);

    console.log('SimLibrary initialized!');
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Add Floor button
    document.getElementById('add-floor-btn').addEventListener('click', () => {
        const newFloor = game.addFloor();
        renderTowerScreen();
    });

    // Detail screen back button
    document.getElementById('detail-back-btn').addEventListener('click', () => {
        switchScreen('tower');
    });

    // Upgrade floor button
    document.getElementById('upgrade-floor-btn').addEventListener('click', () => {
        if (game.currentFloorId) {
            const success = game.upgradeFloor(game.currentFloorId);
            if (success) {
                renderDetailScreen(game.currentFloorId);
                updateStats();
            } else {
                alert('Not enough stars to upgrade!');
            }
        }
    });

    // Edit floor button
    document.getElementById('edit-floor-btn').addEventListener('click', () => {
        if (game.currentFloorId) {
            switchScreen('editor');
            renderEditorScreen(game.currentFloorId);
        }
    });

    // Editor screen buttons
    document.getElementById('editor-back-btn').addEventListener('click', () => {
        switchScreen('detail');
    });

    document.getElementById('editor-done-btn').addEventListener('click', () => {
        switchScreen('detail');
        renderDetailScreen(game.currentFloorId);
    });
}

/**
 * Switch between screens
 */
function switchScreen(screenName) {
    // Hide all screens
    Object.values(screens).forEach(screen => {
        screen.classList.remove('active');
    });

    // Show target screen
    screens[screenName].classList.add('active');
    currentScreen = screenName;
}

/**
 * Update global stats display
 */
function updateStats() {
    document.getElementById('total-readers').textContent = game.getTotalReaders();
    document.getElementById('total-stars').textContent = game.stars;
}

/**
 * Render the Library Tower Screen
 */
function renderTowerScreen() {
    const floorsList = document.getElementById('floors-list');
    floorsList.innerHTML = '';

    if (game.floors.length === 0) {
        floorsList.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-secondary);">No floors yet! Click "Add New Floor" to start building.</p>';
        return;
    }

    // Render floors in reverse order (top floor first)
    [...game.floors].reverse().forEach(floor => {
        const floorCard = createFloorCard(floor);
        floorsList.appendChild(floorCard);
    });

    updateStats();
}

/**
 * Create a floor card element
 */
function createFloorCard(floor) {
    const card = document.createElement('div');
    card.className = `floor-card ${floor.color}`;
    card.innerHTML = `
        <div class="floor-icon">${floor.emoji}</div>
        <div class="floor-info">
            <div class="floor-name">${floor.name}</div>
            <div class="floor-meta">
                <span class="floor-level">Level ${floor.level}</span>
                <span class="floor-readers">👥 ${floor.readersPerMinute}/min</span>
            </div>
        </div>
    `;

    card.addEventListener('click', () => {
        game.currentFloorId = floor.id;
        renderDetailScreen(floor.id);
        switchScreen('detail');
    });

    return card;
}

/**
 * Render the Floor Detail Screen
 */
function renderDetailScreen(floorId) {
    const floor = game.getFloor(floorId);
    if (!floor) return;

    // Update header
    document.getElementById('detail-title').textContent = floor.name;

    // Update hero section
    document.getElementById('detail-emoji').textContent = floor.emoji;
    document.getElementById('detail-name').textContent = floor.name;
    document.getElementById('detail-level').textContent = floor.level;

    // Update stats
    document.getElementById('detail-readers').textContent = floor.readersPerMinute;

    // Update progress bar
    const progressPercent = (floor.xp / floor.xpToNextLevel) * 100;
    document.getElementById('detail-progress').style.width = progressPercent + '%';
    document.getElementById('detail-progress-text').textContent = `${floor.xp}/${floor.xpToNextLevel}`;

    // Update upgrade button
    const upgradeCost = game.getUpgradeCost(floor.level);
    document.getElementById('upgrade-cost').textContent = `${upgradeCost} ⭐`;
}

/**
 * Render the Floor Editor Screen
 */
function renderEditorScreen(floorId) {
    const floor = game.getFloor(floorId);
    if (!floor) return;

    // Update header
    document.getElementById('editor-title').textContent = `Edit ${floor.name}`;

    // Render placed furniture
    renderPlacedFurniture(floor);

    // Render decor catalog
    renderDecorCatalog();
}

/**
 * Render placed furniture items in the editor
 */
function renderPlacedFurniture(floor) {
    const container = document.getElementById('placed-items');
    container.innerHTML = '';

    floor.furniture.forEach(furniture => {
        const decor = game.decorCatalog.find(d => d.id === furniture.decorId);
        if (!decor) return;

        const item = document.createElement('div');
        item.className = 'furniture-item';
        item.style.left = furniture.x + 'px';
        item.style.top = furniture.y + 'px';
        item.innerHTML = `
            <div class="furniture-icon">${decor.emoji}</div>
            <div class="furniture-label">${decor.label}</div>
        `;

        // Make draggable
        makeDraggable(item, furniture.id, floor.id);

        // Double-click to remove
        item.addEventListener('dblclick', () => {
            if (confirm(`Remove ${decor.label}?`)) {
                game.removeFurniture(floor.id, furniture.id);
                renderPlacedFurniture(floor);
            }
        });

        container.appendChild(item);
    });
}

/**
 * Render the decor catalog in the editor
 */
function renderDecorCatalog() {
    const container = document.getElementById('decor-items');
    container.innerHTML = '';

    game.decorCatalog.forEach(decor => {
        const item = document.createElement('div');
        item.className = 'decor-item';
        item.innerHTML = `
            <div class="decor-item-icon">${decor.emoji}</div>
            <div class="decor-item-label">${decor.label}</div>
        `;

        item.addEventListener('click', () => {
            // Add furniture to center of room
            const floor = game.getFloor(game.currentFloorId);
            if (floor) {
                game.addFurniture(floor.id, decor.id, 150, 150);
                renderPlacedFurniture(floor);
            }
        });

        container.appendChild(item);
    });
}

/**
 * Make an element draggable
 */
function makeDraggable(element, furnitureId, floorId) {
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;

    element.addEventListener('mousedown', dragStart);
    element.addEventListener('touchstart', dragStart);

    function dragStart(e) {
        if (e.type === 'touchstart') {
            initialX = e.touches[0].clientX - element.offsetLeft;
            initialY = e.touches[0].clientY - element.offsetTop;
        } else {
            initialX = e.clientX - element.offsetLeft;
            initialY = e.clientY - element.offsetTop;
        }

        isDragging = true;

        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);
        document.addEventListener('touchmove', drag);
        document.addEventListener('touchend', dragEnd);
    }

    function drag(e) {
        if (!isDragging) return;

        e.preventDefault();

        if (e.type === 'touchmove') {
            currentX = e.touches[0].clientX - initialX;
            currentY = e.touches[0].clientY - initialY;
        } else {
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
        }

        element.style.left = currentX + 'px';
        element.style.top = currentY + 'px';
    }

    function dragEnd() {
        if (!isDragging) return;

        isDragging = false;

        // Save new position
        game.moveFurniture(floorId, furnitureId, currentX, currentY);

        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', dragEnd);
        document.removeEventListener('touchmove', drag);
        document.removeEventListener('touchend', dragEnd);
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
