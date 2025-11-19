/**
 * SimLibrary - Visual Tower Renderer
 * Renders the tower with floors, characters, and animations
 */

class TowerRenderer {
    constructor(canvasId, game) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.game = game;

        // Canvas dimensions
        this.width = 600;
        this.height = 800;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Floor dimensions
        this.floorHeight = 120;
        this.floorWidth = 500;
        this.floorX = 50;

        // Elevator dimensions
        this.elevatorWidth = 40;
        this.elevatorX = 5;
        this.elevatorCarHeight = 80;

        // Character sprites
        this.characters = []; // Active character animations

        // Animation frame
        this.animationFrame = null;

        // Colors for floor types
        this.floorColors = {
            peach: { bg: '#FFD4B2', border: '#FFAB91', accent: '#FF8A65' },
            mint: { bg: '#C8E6C9', border: '#A5D6A7', accent: '#81C784' },
            sky: { bg: '#B3E5FC', border: '#81D4FA', accent: '#4FC3F7' },
            lavender: { bg: '#E1BEE7', border: '#CE93D8', accent: '#BA68C8' },
            brown: { bg: '#D7CCC8', border: '#BCAAA4', accent: '#A1887F' },
            rainbow: { bg: '#FFE5B4', border: '#FFD700', accent: '#FFA500' }
        };

        this.init();
    }

    init() {
        // Set up canvas click handling
        this.canvas.addEventListener('click', (e) => this.handleClick(e));

        // Start render loop
        this.render();
    }

    /**
     * Main render loop
     */
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw background (sky)
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#E0F6FF');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw ground
        this.ctx.fillStyle = '#8BC34A';
        this.ctx.fillRect(0, this.height - 40, this.width, 40);

        // Draw elevator shaft
        this.drawElevatorShaft();

        // Draw floors (bottom to top)
        const floors = [...this.game.floors].reverse();
        floors.forEach((floor, index) => {
            const y = this.height - 40 - (index + 1) * this.floorHeight;
            this.drawFloor(floor, this.floorX, y, index);
        });

        // Draw elevator car(s) with readers
        this.drawElevators();

        // Draw "Build Floor" button at top
        if (this.game.floors.length < this.game.maxFloors) {
            const buildY = this.height - 40 - (floors.length + 1) * this.floorHeight;
            this.drawBuildSlot(this.floorX, buildY);
        }

        // Update and draw characters
        this.updateCharacters();

        // Continue loop
        this.animationFrame = requestAnimationFrame(() => this.render());
    }

    /**
     * Draw a single floor
     */
    drawFloor(floor, x, y, floorIndex) {
        const colors = this.floorColors[floor.color] || this.floorColors.peach;

        // Floor background
        this.ctx.fillStyle = colors.bg;
        this.ctx.fillRect(x, y, this.floorWidth, this.floorHeight);

        // Floor border
        this.ctx.strokeStyle = colors.border;
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x, y, this.floorWidth, this.floorHeight);

        if (floor.status === 'building') {
            this.drawConstructionFloor(floor, x, y, colors);
        } else {
            this.drawReadyFloor(floor, x, y, colors, floorIndex);
        }
    }

    /**
     * Draw elevator shaft
     */
    drawElevatorShaft() {
        const numFloors = this.game.floors.length;
        if (numFloors === 0) return;

        // Shaft should only extend to actual built floors, not the build slot
        // Top floor is at: height - 40 - (1) * floorHeight
        // Bottom floor is at: height - 40 - (numFloors) * floorHeight
        // Shaft goes from ground (height - 40) to top of highest floor
        const topFloorBottom = this.height - 40 - (1) * this.floorHeight;
        const shaftHeight = (this.height - 40) - topFloorBottom;
        const shaftY = topFloorBottom;

        // Shaft background
        this.ctx.fillStyle = '#757575';
        this.ctx.fillRect(this.elevatorX, shaftY, this.elevatorWidth, shaftHeight);

        // Shaft border
        this.ctx.strokeStyle = '#424242';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.elevatorX, shaftY, this.elevatorWidth, shaftHeight);

        // Floor markers (horizontal lines)
        this.ctx.strokeStyle = '#616161';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < numFloors; i++) {
            const markerY = this.height - 40 - (i * this.floorHeight);
            this.ctx.beginPath();
            this.ctx.moveTo(this.elevatorX, markerY);
            this.ctx.lineTo(this.elevatorX + this.elevatorWidth, markerY);
            this.ctx.stroke();
        }
    }

    /**
     * Draw elevator car(s) with readers
     */
    drawElevators() {
        const now = Date.now();

        // Group readers by elevator (for now, one reader per elevator)
        const readersInElevator = this.game.readers.filter(r =>
            r.elevatorState === 'waiting' || r.elevatorState === 'riding'
        );

        readersInElevator.forEach(reader => {
            // Find the floor's visual position (floors are rendered in reverse order)
            const floor = this.game.getFloor(reader.floorId);
            if (!floor) return;

            const floors = [...this.game.floors].reverse();
            const visualIndex = floors.findIndex(f => f.id === floor.id);
            if (visualIndex === -1) return;

            // Use EXACT same calculation as floor drawing to ensure alignment
            const destFloorY = this.height - 40 - (visualIndex + 1) * this.floorHeight;

            // Calculate elevator timing based on visual floor position
            const floorsToTravel = visualIndex + 1;
            const totalTime = 2000 + (floorsToTravel * 500);
            const spawnTime = reader.elevatorArrivalTime - totalTime;
            const elapsed = now - spawnTime;
            const progress = Math.min(1, Math.max(0, elapsed / totalTime));

            // Calculate Y position (ground to destination floor)
            const groundY = this.height - 40;
            const elevatorY = groundY - (progress * (groundY - destFloorY)) - this.elevatorCarHeight;

            // Draw elevator car
            this.ctx.fillStyle = '#9E9E9E';
            this.ctx.fillRect(this.elevatorX + 2, elevatorY, this.elevatorWidth - 4, this.elevatorCarHeight);

            // Elevator car border
            this.ctx.strokeStyle = '#616161';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(this.elevatorX + 2, elevatorY, this.elevatorWidth - 4, this.elevatorCarHeight);

            // Draw reader inside elevator
            const readerX = this.elevatorX + this.elevatorWidth / 2;
            const readerY = elevatorY + this.elevatorCarHeight / 2;

            // Reader emoji
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(reader.emoji, readerX, readerY);
        });
    }

    /**
     * Draw a floor under construction
     */
    drawConstructionFloor(floor, x, y, colors) {
        const remaining = Math.max(0, Math.ceil((floor.buildEndTime - Date.now()) / 1000));
        const progress = 1 - (remaining / (floor.buildEndTime - floor.buildStartTime) * 1000);

        // Construction scaffolding (simple lines)
        this.ctx.strokeStyle = '#FF9800';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            const lineX = x + 50 + i * 100;
            this.ctx.beginPath();
            this.ctx.moveTo(lineX, y + 20);
            this.ctx.lineTo(lineX, y + this.floorHeight - 20);
            this.ctx.stroke();
        }

        // Progress bar
        this.ctx.fillStyle = 'rgba(0,0,0,0.1)';
        this.ctx.fillRect(x + 50, y + this.floorHeight / 2 - 15, this.floorWidth - 100, 30);

        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(x + 50, y + this.floorHeight / 2 - 15, (this.floorWidth - 100) * progress, 30);

        // Text
        this.ctx.fillStyle = '#000';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`🏗️ Building ${floor.name}...`, x + this.floorWidth / 2, y + 30);
        this.ctx.fillText(`${remaining}s remaining`, x + this.floorWidth / 2, y + this.floorHeight / 2 + 5);
    }

    /**
     * Draw a ready floor with book shelves and readers
     */
    drawReadyFloor(floor, x, y, colors, floorIndex) {
        // Floor name/number
        this.ctx.fillStyle = '#000';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`${floor.emoji} ${floor.name}`, x + 10, y + 20);

        // Draw floor decorations based on floor type
        this.drawFloorDecorations(floor, x, y, colors);

        // Draw book shelves (3 categories)
        const shelfY = y + 40;
        const shelfWidth = 120;
        const shelfSpacing = (this.floorWidth - 60 - shelfWidth * 3) / 2;

        floor.bookStock.forEach((category, index) => {
            const shelfX = x + 30 + index * (shelfWidth + shelfSpacing);
            this.drawBookshelf(category, shelfX, shelfY, shelfWidth, 60, colors, floor.typeId);
        });

        // Store floor bounds for click detection
        floor._renderBounds = { x, y, width: this.floorWidth, height: this.floorHeight, floorIndex };

        // Draw characters on this floor
        this.drawFloorCharacters(floor, x, y);
    }

    /**
     * Draw a bookshelf with stock indicator
     */
    drawBookshelf(category, x, y, width, height, colors, floorType) {
        // Determine shelf style and book colors based on floor type
        const shelfStyles = this.getShelfStyle(floorType);

        // Draw shelf with custom shape based on style
        this.ctx.fillStyle = shelfStyles.shelfColor;
        this.ctx.strokeStyle = shelfStyles.borderColor;
        this.ctx.lineWidth = 2;

        // Draw different shelf shapes based on floor type
        this.ctx.beginPath();

        switch(shelfStyles.shape) {
            case 'rounded':
                // Rounded top corners
                this.ctx.moveTo(x, y + 10);
                this.ctx.arcTo(x, y, x + 10, y, 10);
                this.ctx.lineTo(x + width - 10, y);
                this.ctx.arcTo(x + width, y, x + width, y + 10, 10);
                this.ctx.lineTo(x + width, y + height);
                this.ctx.lineTo(x, y + height);
                this.ctx.closePath();
                break;

            case 'scalloped':
                // Scalloped top edge
                this.ctx.moveTo(x, y + 10);
                for (let i = 0; i < 4; i++) {
                    const scallop_x = x + (width / 4) * i + (width / 8);
                    const scallop_y = y;
                    this.ctx.quadraticCurveTo(
                        x + (width / 4) * i, y + 10,
                        scallop_x, scallop_y
                    );
                    this.ctx.quadraticCurveTo(
                        x + (width / 4) * (i + 1), y + 10,
                        x + (width / 4) * (i + 1), y + 10
                    );
                }
                this.ctx.lineTo(x + width, y + height);
                this.ctx.lineTo(x, y + height);
                this.ctx.closePath();
                break;

            case 'arched':
                // Arched top
                this.ctx.moveTo(x, y + height);
                this.ctx.lineTo(x, y + 15);
                this.ctx.quadraticCurveTo(x + width / 2, y - 5, x + width, y + 15);
                this.ctx.lineTo(x + width, y + height);
                this.ctx.closePath();
                break;

            case 'peaked':
                // Peaked/triangle top
                this.ctx.moveTo(x, y + 15);
                this.ctx.lineTo(x + width / 2, y);
                this.ctx.lineTo(x + width, y + 15);
                this.ctx.lineTo(x + width, y + height);
                this.ctx.lineTo(x, y + height);
                this.ctx.closePath();
                break;

            case 'ornate':
                // Ornate with decorative corners
                this.ctx.moveTo(x + 5, y + 5);
                this.ctx.lineTo(x, y + 10);
                this.ctx.lineTo(x, y + height);
                this.ctx.lineTo(x + width, y + height);
                this.ctx.lineTo(x + width, y + 10);
                this.ctx.lineTo(x + width - 5, y + 5);
                this.ctx.lineTo(x + width - 5, y);
                this.ctx.lineTo(x + 5, y);
                this.ctx.closePath();
                break;

            default: // 'rectangular'
                // Standard rectangle
                this.ctx.rect(x, y, width, height);
                break;
        }

        this.ctx.fill();
        this.ctx.stroke();

        // Books (as colored rectangles)
        const stockPercent = category.currentStock / category.maxStock;
        const bookCount = Math.ceil(stockPercent * 10);

        for (let i = 0; i < bookCount; i++) {
            const bookX = x + 5 + (i % 5) * 22;
            const bookY = y + 5 + Math.floor(i / 5) * 25;

            this.ctx.fillStyle = shelfStyles.bookColors[i % shelfStyles.bookColors.length];
            this.ctx.fillRect(bookX, bookY, 18, 20);
        }

        // Stock text
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = 'bold 11px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${category.currentStock}/${category.maxStock}`, x + width / 2, y + height - 5);

        // Restocking indicator
        if (category.restocking) {
            this.ctx.fillStyle = 'rgba(255, 152, 0, 0.7)';
            this.ctx.fillRect(x, y, width, height);

            this.ctx.fillStyle = '#FFF';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.fillText('📦 Restocking', x + width / 2, y + height / 2);
        }
    }

    /**
     * Draw characters on a specific floor
     */
    drawFloorCharacters(floor, floorX, floorY) {
        const floorReaders = this.game.readers.filter(r =>
            r.floorId === floor.id && r.elevatorState === 'arrived'
        );

        floorReaders.forEach(reader => {
            // Find or create character sprite for this reader
            let char = this.characters.find(c => c.readerId === reader.id);

            if (!char) {
                // Create new character animation
                char = {
                    readerId: reader.id,
                    readerType: reader.type,
                    readerEmoji: reader.emoji,
                    floorX: floorX,
                    floorY: floorY,
                    x: floorX + 30 + Math.random() * 200, // Start position
                    targetX: floorX + 250 + Math.random() * 150, // Walking to bookshelf
                    direction: 1, // 1 = right, -1 = left
                    walkSpeed: 0.5 + Math.random() * 0.5,
                    state: 'walking', // walking, reading
                    animationFrame: 0
                };
                this.characters.push(char);
            }

            // Draw character
            this.drawCharacter(char, floorY, reader);
        });
    }

    /**
     * Draw a single character sprite
     */
    drawCharacter(char, floorY, reader) {
        const baseY = floorY + 70; // Bottom of floor
        const charHeight = 40;

        // Get character style based on reader type
        const style = this.getCharacterStyle(reader);

        // Walking animation offset
        const legOffset = Math.sin(char.animationFrame * 0.2) * 2;
        const armSwing = Math.sin(char.animationFrame * 0.2) * 4;
        const bobbing = Math.abs(Math.sin(char.animationFrame * 0.2)) * 1;

        const headY = baseY - charHeight + 8 - bobbing;
        const bodyY = baseY - charHeight + 16 - bobbing;
        const legY = baseY - 6 - bobbing;

        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.beginPath();
        this.ctx.ellipse(char.x, baseY, 8, 3, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Legs (animated walking)
        this.ctx.fillStyle = style.pantsColor;
        // Left leg
        this.ctx.fillRect(char.x - 5, legY - legOffset, 4, 8 + legOffset);
        // Right leg
        this.ctx.fillRect(char.x + 1, legY + legOffset, 4, 8 - legOffset);

        // Body/Torso
        this.ctx.fillStyle = style.shirtColor;
        this.ctx.fillRect(char.x - 7, bodyY, 14, 20);

        // Add body details/pattern based on type
        if (style.hasPattern) {
            this.ctx.fillStyle = style.patternColor;
            // Simple stripe or dot pattern
            this.ctx.fillRect(char.x - 5, bodyY + 5, 10, 2);
            this.ctx.fillRect(char.x - 5, bodyY + 10, 10, 2);
        }

        // Arms (animated swinging)
        this.ctx.strokeStyle = style.skinColor;
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';

        // Left arm
        this.ctx.beginPath();
        this.ctx.moveTo(char.x - 7, bodyY + 2);
        this.ctx.lineTo(char.x - 10, bodyY + 10 - armSwing);
        this.ctx.stroke();

        // Right arm
        this.ctx.beginPath();
        this.ctx.moveTo(char.x + 7, bodyY + 2);
        this.ctx.lineTo(char.x + 10, bodyY + 10 + armSwing);
        this.ctx.stroke();

        // Neck
        this.ctx.fillStyle = style.skinColor;
        this.ctx.fillRect(char.x - 2, bodyY - 2, 4, 4);

        // Head
        this.ctx.fillStyle = style.skinColor;
        this.ctx.beginPath();
        this.ctx.arc(char.x, headY, 9, 0, Math.PI * 2);
        this.ctx.fill();

        // Hair
        this.ctx.fillStyle = style.hairColor;
        if (style.hairStyle === 'short') {
            this.ctx.beginPath();
            this.ctx.arc(char.x, headY - 2, 9, Math.PI, Math.PI * 2);
            this.ctx.fill();
        } else if (style.hairStyle === 'long') {
            this.ctx.beginPath();
            this.ctx.arc(char.x, headY - 2, 9, Math.PI, Math.PI * 2);
            this.ctx.fill();
            // Long hair sides
            this.ctx.fillRect(char.x - 9, headY - 2, 3, 10);
            this.ctx.fillRect(char.x + 6, headY - 2, 3, 10);
        } else if (style.hairStyle === 'curly') {
            // Curly/puffy hair
            this.ctx.beginPath();
            this.ctx.arc(char.x - 5, headY - 4, 5, 0, Math.PI * 2);
            this.ctx.arc(char.x, headY - 6, 6, 0, Math.PI * 2);
            this.ctx.arc(char.x + 5, headY - 4, 5, 0, Math.PI * 2);
            this.ctx.fill();
        } else if (style.hairStyle === 'bald') {
            // Just the top of head, no extra hair
        }

        // Facial features
        // Eyes
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(char.x - 3, headY - 1, 2, 2);
        this.ctx.fillRect(char.x + 1, headY - 1, 2, 2);

        // Accessories
        if (style.hasGlasses) {
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(char.x - 3, headY, 3, 0, Math.PI * 2);
            this.ctx.arc(char.x + 3, headY, 3, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(char.x - 0, headY);
            this.ctx.lineTo(char.x + 0, headY);
            this.ctx.stroke();
        }

        // VIP indicator (sparkle effect)
        if (reader.type === 'vip') {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('✨', char.x - 12, headY - 8);
        }
    }

    /**
     * Get character visual style based on reader type
     */
    getCharacterStyle(reader) {
        const styles = {
            kid: {
                skinColor: '#FDBCB4',
                hairColor: '#8B4513',
                hairStyle: 'short',
                shirtColor: '#FF6B6B',
                pantsColor: '#4ECDC4',
                hasPattern: true,
                patternColor: '#FFF',
                hasGlasses: false
            },
            teen: {
                skinColor: '#F4C2A6',
                hairColor: '#2C1810',
                hairStyle: 'long',
                shirtColor: '#9370DB',
                pantsColor: '#2C3E50',
                hasPattern: false,
                patternColor: '#FFF',
                hasGlasses: false
            },
            adult: {
                skinColor: '#E8B89A',
                hairColor: '#4A3728',
                hairStyle: 'short',
                shirtColor: '#4A90E2',
                pantsColor: '#2C3E50',
                hasPattern: false,
                patternColor: '#FFF',
                hasGlasses: Math.random() > 0.5
            },
            senior: {
                skinColor: '#F5D5C3',
                hairColor: '#CCCCCC',
                hairStyle: Math.random() > 0.5 ? 'short' : 'bald',
                shirtColor: '#8B7355',
                pantsColor: '#5C4033',
                hasPattern: false,
                patternColor: '#FFF',
                hasGlasses: true
            },
            student: {
                skinColor: '#F4C2A6',
                hairColor: '#654321',
                hairStyle: 'curly',
                shirtColor: '#2ECC71',
                pantsColor: '#34495E',
                hasPattern: false,
                patternColor: '#FFF',
                hasGlasses: true
            }
        };

        // VIP readers get special fancy clothes
        if (reader.type === 'vip') {
            return {
                skinColor: '#F4C2A6',
                hairColor: '#FFD700',
                hairStyle: 'curly',
                shirtColor: '#FFD700',
                pantsColor: '#9370DB',
                hasPattern: true,
                patternColor: '#FFF',
                hasGlasses: true
            };
        }

        return styles[reader.type] || styles.adult;
    }

    /**
     * Update character positions and animations
     */
    updateCharacters() {
        // Remove characters for readers that checked out
        this.characters = this.characters.filter(char => {
            return this.game.readers.some(r => r.id === char.readerId);
        });

        // Update positions
        this.characters.forEach(char => {
            if (char.state === 'walking') {
                // Move towards target
                if (char.x < char.targetX) {
                    char.x += char.walkSpeed;
                    char.direction = 1;
                } else if (char.x > char.targetX) {
                    char.x -= char.walkSpeed;
                    char.direction = -1;
                }

                // Check if reached target
                if (Math.abs(char.x - char.targetX) < 2) {
                    char.state = 'reading';
                }
            }

            char.animationFrame++;
        });
    }

    /**
     * Draw empty build slot
     */
    drawBuildSlot(x, y) {
        // Dashed outline
        this.ctx.strokeStyle = '#9E9E9E';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([10, 5]);
        this.ctx.strokeRect(x, y, this.floorWidth, this.floorHeight);
        this.ctx.setLineDash([]);

        // Build button
        this.ctx.fillStyle = 'rgba(156, 39, 176, 0.2)';
        this.ctx.fillRect(x + this.floorWidth / 2 - 80, y + this.floorHeight / 2 - 25, 160, 50);

        this.ctx.fillStyle = '#9C27B0';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('➕ Build New Floor', x + this.floorWidth / 2, y + this.floorHeight / 2 + 5);

        // Store bounds for click
        this._buildSlotBounds = { x, y, width: this.floorWidth, height: this.floorHeight };
    }

    /**
     * Handle canvas clicks
     */
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        console.log('Canvas clicked at:', clickX, clickY);

        // Check build slot click first (top of tower)
        if (this._buildSlotBounds) {
            const b = this._buildSlotBounds;
            if (clickX >= b.x && clickX <= b.x + b.width &&
                clickY >= b.y && clickY <= b.y + b.height) {
                console.log('Build slot clicked!');
                if (window.openBuildModal) {
                    window.openBuildModal();
                }
                return; // Don't check floors if build slot was clicked
            }
        }

        // Check floor clicks (check all floors)
        const floors = [...this.game.floors].reverse(); // Top to bottom for click priority
        for (const floor of floors) {
            if (floor._renderBounds) {
                const b = floor._renderBounds;
                if (clickX >= b.x && clickX <= b.x + b.width &&
                    clickY >= b.y && clickY <= b.y + b.height) {
                    console.log('Floor clicked:', floor.name);
                    // Floor clicked - trigger detail view
                    if (window.openFloorDetail) {
                        window.openFloorDetail(floor.id);
                    }
                    return; // Stop checking after first match
                }
            }
        }

        console.log('No floor clicked');
    }

    /**
     * Get shelf style based on floor type
     */
    getShelfStyle(floorType) {
        const styles = {
            // Children's floors - light woods with rounded/playful shapes
            board_books: {
                shelfColor: '#DEB887',
                borderColor: '#D2691E',
                shape: 'rounded',
                bookColors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#95E1D3', '#FFA07A']
            },
            picture_books: {
                shelfColor: '#F4A460',
                borderColor: '#D2691E',
                shape: 'scalloped',
                bookColors: ['#FF6347', '#FFD700', '#98D8C8', '#87CEEB', '#DDA0DD']
            },
            early_readers: {
                shelfColor: '#D2B48C',
                borderColor: '#BC9B7D',
                shape: 'rounded',
                bookColors: ['#90EE90', '#FFB6C1', '#FFD700', '#87CEEB', '#DDA0DD']
            },
            juvenile_series: {
                shelfColor: '#CD853F',
                borderColor: '#8B4513',
                shape: 'peaked',
                bookColors: ['#4169E1', '#FF4500', '#FFD700', '#32CD32', '#FF69B4']
            },
            teen: {
                shelfColor: '#A0826D',
                borderColor: '#6D5843',
                shape: 'rectangular',
                bookColors: ['#8A2BE2', '#FF1493', '#00CED1', '#FFD700', '#FF6347']
            },

            // Fiction floors - classic wood tones with traditional shapes
            fiction: {
                shelfColor: '#8D6E63',
                borderColor: '#5D4037',
                shape: 'rectangular',
                bookColors: ['#8B4513', '#A0522D', '#CD853F', '#DEB887', '#D2691E']
            },
            mystery: {
                shelfColor: '#6D5843',
                borderColor: '#5C4033',
                shape: 'ornate',
                bookColors: ['#2F4F4F', '#696969', '#708090', '#778899', '#B0C4DE']
            },
            romance: {
                shelfColor: '#BC9B7D',
                borderColor: '#A0826D',
                shape: 'arched',
                bookColors: ['#FF69B4', '#FFB6C1', '#FFC0CB', '#DB7093', '#C71585']
            },
            scifi: {
                shelfColor: '#8B7355',
                borderColor: '#5C4033',
                shape: 'rectangular',
                bookColors: ['#00CED1', '#4169E1', '#6A5ACD', '#7B68EE', '#9370DB']
            },
            fantasy: {
                shelfColor: '#A0826D',
                borderColor: '#6D5843',
                shape: 'arched',
                bookColors: ['#8A2BE2', '#9370DB', '#BA55D3', '#DA70D6', '#EE82EE']
            },
            true_crime: {
                shelfColor: '#5C4033',
                borderColor: '#3E2723',
                shape: 'rectangular',
                bookColors: ['#DC143C', '#B22222', '#8B0000', '#A52A2A', '#CD5C5C']
            },
            graphic_novels: {
                shelfColor: '#D2691E',
                borderColor: '#8B4513',
                shape: 'rectangular',
                bookColors: ['#FF4500', '#FF6347', '#FFD700', '#FFA500', '#FF8C00']
            },

            // Non-fiction floors - scholarly browns
            biography: {
                shelfColor: '#A0826D',
                borderColor: '#6D5843',
                shape: 'ornate',
                bookColors: ['#8B7355', '#A0826D', '#BC9B7D', '#D2B48C', '#DEB887']
            },
            history: {
                shelfColor: '#8B7355',
                borderColor: '#5C4033',
                shape: 'ornate',
                bookColors: ['#704214', '#8B5A3C', '#A0826D', '#BC9B7D', '#8B7355']
            },
            local_history: {
                shelfColor: '#D2B48C',
                borderColor: '#A0826D',
                shape: 'peaked',
                bookColors: ['#CD853F', '#DAA520', '#B8860B', '#D2691E', '#8B4513']
            },
            science: {
                shelfColor: '#8B6F47',
                borderColor: '#654321',
                shape: 'rectangular',
                bookColors: ['#228B22', '#32CD32', '#3CB371', '#2E8B57', '#008B8B']
            },
            technology: {
                shelfColor: '#7A6A4F',
                borderColor: '#5C4033',
                shape: 'rectangular',
                bookColors: ['#4682B4', '#5F9EA0', '#708090', '#778899', '#B0C4DE']
            },
            sports: {
                shelfColor: '#CD853F',
                borderColor: '#8B4513',
                shape: 'rectangular',
                bookColors: ['#FF8C00', '#FFD700', '#FFA500', '#FF4500', '#DC143C']
            },
            cookbooks: {
                shelfColor: '#D2691E',
                borderColor: '#A0522D',
                shape: 'rounded',
                bookColors: ['#FF6347', '#FF7F50', '#FFA07A', '#FA8072', '#E9967A']
            },
            library_of_things: {
                shelfColor: '#BC9B7D',
                borderColor: '#8B7355',
                shape: 'rounded',
                bookColors: ['#FF69B4', '#FFD700', '#00CED1', '#FF6347', '#32CD32']
            },

            // Food service floors - warm browns
            coffee_shop: {
                shelfColor: '#6F4E37',
                borderColor: '#3E2723',
                shape: 'rounded',
                bookColors: ['#795548', '#8D6E63', '#A1887F', '#BCAAA4', '#D7CCC8']
            },
            bakery: {
                shelfColor: '#DEB887',
                borderColor: '#D2691E',
                shape: 'scalloped',
                bookColors: ['#FFE4B5', '#FFDEAD', '#F5DEB3', '#DEB887', '#D2B48C']
            },
            hot_drinks_cafe: {
                shelfColor: '#8B4513',
                borderColor: '#654321',
                shape: 'rounded',
                bookColors: ['#A0522D', '#8B4513', '#D2691E', '#CD853F', '#F4A460']
            },
            snack_bar: {
                shelfColor: '#D2B48C',
                borderColor: '#BC9B7D',
                shape: 'rounded',
                bookColors: ['#FFD700', '#F0E68C', '#EEE8AA', '#FAFAD2', '#FFE4B5']
            }
        };

        return styles[floorType] || styles.fiction; // Default to fiction style
    }

    /**
     * Draw floor-specific decorations
     */
    drawFloorDecorations(floor, x, y, colors) {
        const floorType = floor.typeId;

        // Draw decorations based on floor type
        switch(floorType) {
            case 'board_books':
            case 'picture_books':
                // Colorful rugs
                this.ctx.fillStyle = 'rgba(255, 182, 193, 0.6)';
                this.ctx.fillRect(x + 180, y + 85, 50, 30);
                this.ctx.fillRect(x + 350, y + 85, 50, 30);
                break;

            case 'science':
            case 'technology':
                // Computer desks
                this.ctx.fillStyle = '#696969';
                this.ctx.fillRect(x + 430, y + 85, 35, 25);
                this.ctx.fillStyle = '#4682B4';
                this.ctx.fillRect(x + 435, y + 80, 15, 12);
                break;

            default:
                // Plants for most floors
                this.ctx.fillStyle = '#228B22';
                this.ctx.beginPath();
                this.ctx.arc(x + 450, y + 90, 8, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(x + 448, y + 95, 4, 10);
                break;
        }
    }

    /**
     * Clean up
     */
    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
}
