/**
 * SimLibrary - Game State Management
 * Handles all game data, floors, furniture, and persistence
 */

class GameState {
    constructor() {
        this.floors = [];
        this.stars = 500; // Starting currency
        this.currentFloorId = null;

        // Available decor items
        this.decorCatalog = [
            { id: 'chair', emoji: '🪑', label: 'Tiny Chair', cost: 50, readers: 1 },
            { id: 'beanbag', emoji: '🛋️', label: 'Beanbag', cost: 75, readers: 2 },
            { id: 'rug', emoji: '🧺', label: 'Cozy Rug', cost: 100, readers: 3 },
            { id: 'poster', emoji: '🖼️', label: 'Poster', cost: 60, readers: 1 },
            { id: 'plant', emoji: '🪴', label: 'Plant', cost: 80, readers: 2 },
            { id: 'lamp', emoji: '💡', label: 'Lamp', cost: 90, readers: 2 },
            { id: 'bookshelf', emoji: '📚', label: 'Bookshelf', cost: 150, readers: 5 }
        ];

        // Floor themes/templates
        this.floorThemes = [
            {
                name: 'Picture Book Meadow',
                emoji: '📖',
                color: 'peach',
                description: 'A cozy space for young readers'
            },
            {
                name: 'Animals & Nature Wing',
                emoji: '🦋',
                color: 'mint',
                description: 'Discover the natural world'
            },
            {
                name: 'Space & Science Zone',
                emoji: '🚀',
                color: 'sky',
                description: 'Explore the cosmos and beyond'
            },
            {
                name: 'Mystery Corner',
                emoji: '🔍',
                color: 'lavender',
                description: 'Unravel thrilling mysteries'
            }
        ];

        this.load();
    }

    /**
     * Generate a unique ID
     */
    generateId() {
        return 'floor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Create a new floor
     */
    addFloor(themeName = null) {
        const theme = themeName
            ? this.floorThemes.find(t => t.name === themeName)
            : this.floorThemes[this.floors.length % this.floorThemes.length];

        const newFloor = {
            id: this.generateId(),
            name: theme.name,
            emoji: theme.emoji,
            color: theme.color,
            level: 1,
            xp: 0,
            xpToNextLevel: 100,
            readersPerMinute: 0,
            furniture: [] // Array of placed furniture items
        };

        this.floors.push(newFloor);
        this.save();
        return newFloor;
    }

    /**
     * Get floor by ID
     */
    getFloor(id) {
        return this.floors.find(floor => floor.id === id);
    }

    /**
     * Upgrade a floor (increase level)
     */
    upgradeFloor(floorId) {
        const floor = this.getFloor(floorId);
        if (!floor) return false;

        const upgradeCost = this.getUpgradeCost(floor.level);

        if (this.stars >= upgradeCost) {
            this.stars -= upgradeCost;
            floor.level += 1;
            floor.xp = 0;
            floor.xpToNextLevel = Math.floor(floor.xpToNextLevel * 1.5);
            this.save();
            return true;
        }

        return false;
    }

    /**
     * Calculate upgrade cost based on level
     */
    getUpgradeCost(level) {
        return Math.floor(100 * Math.pow(1.5, level - 1));
    }

    /**
     * Add furniture to a floor
     */
    addFurniture(floorId, decorId, x, y) {
        const floor = this.getFloor(floorId);
        const decor = this.decorCatalog.find(d => d.id === decorId);

        if (!floor || !decor) return false;

        const furnitureItem = {
            id: 'furniture_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            decorId: decorId,
            x: x,
            y: y
        };

        floor.furniture.push(furnitureItem);
        this.recalculateFloorStats(floorId);
        this.save();
        return furnitureItem;
    }

    /**
     * Move furniture on a floor
     */
    moveFurniture(floorId, furnitureId, newX, newY) {
        const floor = this.getFloor(floorId);
        if (!floor) return false;

        const furniture = floor.furniture.find(f => f.id === furnitureId);
        if (furniture) {
            furniture.x = newX;
            furniture.y = newY;
            this.save();
            return true;
        }

        return false;
    }

    /**
     * Remove furniture from a floor
     */
    removeFurniture(floorId, furnitureId) {
        const floor = this.getFloor(floorId);
        if (!floor) return false;

        floor.furniture = floor.furniture.filter(f => f.id !== furnitureId);
        this.recalculateFloorStats(floorId);
        this.save();
        return true;
    }

    /**
     * Recalculate floor stats based on furniture
     */
    recalculateFloorStats(floorId) {
        const floor = this.getFloor(floorId);
        if (!floor) return;

        let totalReaders = 0;

        floor.furniture.forEach(furniture => {
            const decor = this.decorCatalog.find(d => d.id === furniture.decorId);
            if (decor) {
                totalReaders += decor.readers;
            }
        });

        // Apply level multiplier
        floor.readersPerMinute = Math.floor(totalReaders * floor.level);
    }

    /**
     * Get total readers per minute across all floors
     */
    getTotalReaders() {
        return this.floors.reduce((total, floor) => total + floor.readersPerMinute, 0);
    }

    /**
     * Game tick - called every second/minute
     * Awards XP and stars based on readers
     */
    tick() {
        const totalReaders = this.getTotalReaders();

        // Award stars (currency)
        this.stars += Math.floor(totalReaders / 10); // 10 readers = 1 star per tick

        // Award XP to floors
        this.floors.forEach(floor => {
            if (floor.readersPerMinute > 0) {
                floor.xp += floor.readersPerMinute;

                // Level up if reached threshold
                while (floor.xp >= floor.xpToNextLevel) {
                    floor.xp -= floor.xpToNextLevel;
                    floor.level += 1;
                    floor.xpToNextLevel = Math.floor(floor.xpToNextLevel * 1.5);
                    this.recalculateFloorStats(floor.id);
                }
            }
        });

        this.save();
    }

    /**
     * Save game state to LocalStorage
     */
    save() {
        const saveData = {
            floors: this.floors,
            stars: this.stars,
            timestamp: Date.now()
        };
        localStorage.setItem('simlibrary_save', JSON.stringify(saveData));
    }

    /**
     * Load game state from LocalStorage
     */
    load() {
        const saved = localStorage.getItem('simlibrary_save');

        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.floors = data.floors || [];
                this.stars = data.stars || 500;
            } catch (e) {
                console.error('Failed to load save data:', e);
                this.initializeNewGame();
            }
        } else {
            this.initializeNewGame();
        }
    }

    /**
     * Initialize a new game with starter floor
     */
    initializeNewGame() {
        this.floors = [];
        this.stars = 500;

        // Add starter floor
        this.addFloor('Picture Book Meadow');

        // Add some starter furniture
        const starterFloor = this.floors[0];
        this.addFurniture(starterFloor.id, 'chair', 100, 100);
        this.addFurniture(starterFloor.id, 'bookshelf', 200, 150);

        this.save();
    }

    /**
     * Reset game (for debugging)
     */
    reset() {
        localStorage.removeItem('simlibrary_save');
        this.initializeNewGame();
    }
}
