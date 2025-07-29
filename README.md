# LiteLab

LiteLab is a powerful, web-based Minecraft structure viewer and editor that provides comprehensive manipulation capabilities for `.litematic` files, NBT structures, and Minecraft commands. Built with modern web technologies, it offers real-time 3D visualization, advanced editing features, and seamless format conversion.

## ✨ Features

### 📁 File Support
- **Litematic Files** (`.litematic`) - Full support for Litematica mod format
- **NBT Files** (`.nbt`) - JSON-formatted NBT structure data
- **Minecraft Commands** - `/setblock` and `/fill` command parsing
- **Drag & Drop** - Intuitive file loading interface

### 🎮 3D Visualization
- **Interactive Camera Controls** - WASD movement, mouse look, scroll zoom
- **Block Textures** - Authentic Minecraft block textures
- **Compass Navigation** - Directional compass overlay
- **Grid Display** - Optional coordinate grid system
- **Block Hover Effects** - Highlight blocks under cursor

### 🔧 Editing & Transformation
- **Edit Mode** - Interactive block breaking and placement
- **Structure Transformations** - Rotate (Y-axis), Flip (X/Z axes)
- **Undo System** - Multi-level undo for transformations and edits
- **Layer Filtering** - Y-level range sliders for layer-by-layer analysis
- **Block Highlighting** - Click materials to highlight in 3D view

### 📊 Analysis Tools
- **Material Lists** - Complete block count analysis
- **Block Information** - Real-time block details on hover
- **Coordinate Display** - Precise block positioning
- **Statistics** - Total and visible block counts

### 💾 Export Options
- **NBT Export** - Export as JSON-formatted NBT data
- **CSV Export** - Material lists for external analysis
- **Command Generation** - Generate `/setblock` commands with custom origins

### ⚙️ Customization
- **Settings Panel** - Comprehensive configuration options
- **Camera Settings** - Adjustable sensitivity and movement speed
- **Display Options** - Toggle grid, hover effects, and overlays
- **Dark/Light Theme** - Automatic theme switching
- **Fullscreen Mode** - Immersive viewing experience

## 🚀 Quick Start

### Prerequisites
- Modern web browser with WebGL support
- JavaScript enabled
- Recommended: Chrome, Firefox, Safari, or Edge

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Goldfromgoldwila/LiteLab.git
   cd LiteLab
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Development server**
   ```bash
   npm run dev
   ```
   Access at `http://localhost:5173`

4. **Production build**
   ```bash
   npm run build
   npm run preview
   ```
   Access at `http://localhost:4173`

## 📖 Usage Guide

### Loading Structures

#### Method 1: File Upload
1. Click the file upload area or drag files directly
2. Select `.litematic` or `.nbt` files
3. Structure loads automatically with 3D visualization

#### Method 2: Command Input
1. Paste `/setblock` or `/fill` commands in the Commands panel
2. Click "Load Commands" to parse and visualize
3. Supports multiple commands and complex structures

### Navigation Controls
- **Mouse**: Look around (click to enable pointer lock)
- **WASD**: Move camera horizontally
- **Space/Shift**: Move up/down
- **Mouse Wheel**: Zoom in/out
- **T/Escape**: Exit pointer lock mode

### Editing Features
1. **Edit Mode**: Click "Edit Mode" to enable block interaction
2. **Block Breaking**: Click blocks to remove them
3. **Transformations**: Use rotate/flip buttons for structure modifications
4. **Layer Filtering**: Adjust Y-level sliders to view specific layers
5. **Material Highlighting**: Click material names to highlight blocks

### Export Options
1. **Litematic**: Download modified structure as `.litematic` file
2. **NBT**: Export structure data as JSON NBT format
3. **Commands**: Generate `/setblock` commands with custom origin coordinates
4. **CSV**: Export material lists for spreadsheet analysis

## 🏗️ Technical Architecture

### Core Technologies
- **[Deepslate](https://github.com/misode/deepslate)** - NBT parsing and Minecraft data handling
- **[gl-matrix](https://glmatrix.net/)** - 3D mathematics and matrix operations
- **[Vite](https://vitejs.dev/)** - Modern build tooling and development server
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Pako](https://github.com/nodeca/pako)** - Compression/decompression library
- **[Prismarine NBT](https://github.com/PrismarineJS/prismarine-nbt)** - NBT format handling

### File Structure
```
LiteLab/
├── src/
│   ├── main.js              # Application entry point and state management
│   ├── viewer.js            # 3D rendering and camera controls
│   ├── litematic-utils.js   # Litematic file parsing and processing
│   ├── command-parser.js    # Minecraft command parsing (/setblock, /fill)
│   ├── command-loader.js    # Command input handling
│   ├── exporter.js          # File export functionality
│   ├── edit-mode.js         # Interactive editing features
│   ├── transformations.js   # Structure transformation operations
│   ├── block-hover.js       # Block highlighting and hover effects
│   ├── compass.js           # Navigation compass overlay
│   ├── nearest-block.js     # Nearest block detection
│   ├── settings.js          # User preferences and configuration
│   └── style.css            # Application styling
├── public/
│   └── resource/
│       ├── atlas.png        # Minecraft block texture atlas
│       ├── assets.js        # Block asset definitions
│       └── opaque.js        # Block opacity data
├── index.html               # Main application HTML
├── package.json             # Dependencies and build scripts
└── vite.config.js           # Build configuration
```

### Key Components

#### Structure Processing Pipeline
1. **File Input** → NBT parsing → Litematic object creation
2. **Command Input** → Regex parsing → Block placement simulation
3. **3D Conversion** → Deepslate structure → WebGL rendering

#### Rendering System
- **WebGL Context** - Hardware-accelerated 3D graphics
- **Deepslate Renderer** - Minecraft-specific rendering engine
- **Camera System** - First-person perspective controls
- **Overlay System** - UI elements over 3D viewport

#### State Management
- **AppState** - Global application state container
- **Transform History** - Undo/redo functionality
- **Settings Persistence** - LocalStorage configuration

## 🎯 Supported Formats

### Input Formats
| Format | Extension | Description |
|--------|-----------|-------------|
| Litematic | `.litematic` | Litematica mod schematic format |
| NBT | `.nbt` | JSON-formatted NBT structure data |
| Commands | Text | `/setblock` and `/fill` commands |

### Export Formats
| Format | Extension | Description |
|--------|-----------|-------------|
| Litematic | `.litematic` | Modified structure export |
| NBT | `.nbt` | JSON NBT data export |
| CSV | `.csv` | Material count spreadsheet |
| Commands | `.txt` | Generated `/setblock` commands |

### Command Support
- **`/setblock x y z block [properties]`** - Single block placement
- **`/fill x1 y1 z1 x2 y2 z2 block [properties]`** - Cuboid filling
- **Multiple commands** - Batch processing support
- **Block properties** - Full property parsing (e.g., `facing=north`)

## ⚙️ Configuration

### Camera Settings
- **Mouse Sensitivity**: 0.1 - 5.0 (default: 1.0)
- **Movement Speed**: 0.1 - 2.0 (default: 0.2)
- **Invert Controls**: Toggle Y-axis inversion

### Display Settings
- **Show Grid**: Toggle coordinate grid overlay
- **Block Hover Effect**: Enable/disable block highlighting
- **Theme**: Light/Dark mode toggle

### Performance Settings
- **Chunk Size**: Rendering optimization (default: 8)
- **WebGL Optimizations**: Automatic context management

## 🔧 Development

### Build Scripts
```bash
npm run dev      # Development server with hot reload
npm run build    # Production build
npm run preview  # Preview production build
```

### Development Setup
1. Install Node.js (v16+ recommended)
2. Clone repository and install dependencies
3. Run development server
4. Access at `http://localhost:5173`

### Contributing
1. Fork the repository
2. Create feature branch (`git checkout -b feature/name`)
3. Commit changes (`git commit -m 'info'`)
4. Push to branch (`git push origin feature/name`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT - see the [LICENSE](LICENSE) file for details.


## 🐛 Issues & Support

- **Bug Reports**: [GitHub Issues](https://github.com/Goldfromgoldwila/LiteLab/issues)

---