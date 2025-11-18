# SimLibrary 📚

A cozy, kid-friendly library-builder game where you create and manage your dream library!

## 🎮 Game Overview

Build your library floor by floor, decorate rooms with furniture, and watch as readers flock to your beautiful spaces. Earn stars, upgrade floors, and create the ultimate reading sanctuary.

## ✨ Features

### Current Features (v0.1)

- **Library Tower View** - Stack multiple themed library floors
- **Floor Management** - Upgrade floors, track progress, and view stats
- **Room Editor** - Drag-and-drop furniture placement with grid-based layout
- **Auto-Save** - Game progress automatically saved to LocalStorage
- **Idle Game Mechanics** - Earn stars and XP over time based on reader activity
- **Cozy Pastel Design** - Soft colors, rounded corners, gentle shadows

### Floor Themes

1. **📖 Picture Book Meadow** - Cozy space for young readers (peach)
2. **🦋 Animals & Nature Wing** - Discover the natural world (mint)
3. **🚀 Space & Science Zone** - Explore the cosmos (sky blue)
4. **🔍 Mystery Corner** - Unravel thrilling mysteries (lavender)

### Decor Items

- 🪑 **Tiny Chair** - 50 stars, +1 reader/min
- 🛋️ **Beanbag** - 75 stars, +2 readers/min
- 🧺 **Cozy Rug** - 100 stars, +3 readers/min
- 🖼️ **Poster** - 60 stars, +1 reader/min
- 🪴 **Plant** - 80 stars, +2 readers/min
- 💡 **Lamp** - 90 stars, +2 readers/min
- 📚 **Bookshelf** - 150 stars, +5 readers/min

## 🎨 Design System

### Color Palette

- **Peach**: `#FFD4B2` - Picture Books theme
- **Mint**: `#C8E6C9` - Animals & Nature theme
- **Lavender**: `#E1BEE7` - Mystery theme
- **Sky Blue**: `#B3E5FC` - Space & Science theme
- **Cream**: `#FFF8F0` - Primary background
- **White**: `#FFFFFF` - Card backgrounds

### Typography

- **Headings**: System fonts (San Francisco, Segoe UI, Roboto)
- **Body**: 16px base, 1.6 line height
- **Colors**: Dark brown (`#5D4E37`) for primary text

### Visual Elements

- **Border Radius**: 12px (small), 20px (medium), 28px (large)
- **Shadows**: Soft, subtle drop shadows (0 4px 12px rgba(0,0,0,0.08))
- **Gradients**: Gentle 135° gradients for cards and buttons

## 🏗️ Project Structure

```
simlibrary/
├── index.html          # Main HTML structure
├── css/
│   └── style.css       # All styles and theme
├── js/
│   ├── gamestate.js    # Game logic and data management
│   └── app.js          # UI rendering and interactions
├── assets/             # Future images and icons
└── README.md           # This file
```

## 🚀 Getting Started

### Running Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/lstrandt-hamburglibrary/simlibrary.git
   cd simlibrary
   ```

2. Open `index.html` in your web browser
   - No build process required!
   - Works completely offline after first load

### First-Time Setup

The game automatically initializes with:
- 500 starting stars
- One "Picture Book Meadow" floor (Level 1)
- Two starter furniture items (Chair and Bookshelf)

## 🎯 How to Play

1. **View Your Library** - See all your floors on the main tower screen
2. **Tap a Floor** - View detailed stats, upgrade, or edit the floor
3. **Decorate Rooms** - Add furniture from the decor bar, drag to position
4. **Earn Stars** - Readers generate stars over time (passive income)
5. **Upgrade Floors** - Increase level to multiply reader capacity
6. **Add More Floors** - Expand your library with new themed sections

### Game Mechanics

- **Readers per Minute**: Each furniture item adds readers (multiplied by floor level)
- **Stars**: Currency earned from readers (10 readers = 1 star per tick)
- **XP**: Floors gain XP over time, automatically level up
- **Upgrades**: Manual upgrades cost stars, increase multiplier

## 💾 Save System

- Game state saved to browser LocalStorage
- Auto-saves on every change (furniture placement, upgrades, etc.)
- Tick system saves every 5 seconds
- No login required - all data stored locally

## 🛠️ Technical Details

### Technologies

- **HTML5** - Semantic structure
- **CSS3** - Gradients, flexbox, animations
- **Vanilla JavaScript** - No frameworks, pure JS
- **LocalStorage API** - Persistent game state

### Browser Support

Works in all modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🗺️ Future Roadmap

### Planned Features

- [ ] **More Decor Items** - Expanded furniture catalog
- [ ] **Special Events** - Timed challenges and bonuses
- [ ] **Achievements** - Unlock rewards for milestones
- [ ] **Themes/Skins** - Seasonal decorations
- [ ] **Sound Effects** - Cozy ambient sounds
- [ ] **Animations** - Smooth transitions and effects
- [ ] **Mobile Optimization** - PWA support, touch gestures
- [ ] **Export/Import** - Share library designs
- [ ] **Prestige System** - Reset for permanent bonuses

### Under Consideration

- Patron management (individual reader characters)
- Story events and narrative elements
- Multiple save slots
- Cloud sync (optional)
- Leaderboards

## 📝 Development Notes

### Adding New Decor Items

Edit `js/gamestate.js`, add to `decorCatalog`:

```javascript
{
    id: 'unique-id',
    emoji: '🎨',
    label: 'Item Name',
    cost: 100,
    readers: 5
}
```

### Adding New Floor Themes

Edit `js/gamestate.js`, add to `floorThemes`:

```javascript
{
    name: 'Theme Name',
    emoji: '🎭',
    color: 'lavender', // Must match CSS class
    description: 'Theme description'
}
```

### Adjusting Game Balance

- **Tick Rate**: Change interval in `app.js` (currently 5000ms = 5 seconds)
- **Star Conversion**: Modify in `gamestate.js` tick() method
- **Upgrade Costs**: Adjust `getUpgradeCost()` formula
- **XP Scaling**: Change multiplier in level-up logic

## 🤝 Contributing

This is a personal project, but suggestions and ideas are welcome!

## 📄 License

© 2025 Hamburg Township Library. All rights reserved.

---

**Built with ❤️ for readers everywhere!**
