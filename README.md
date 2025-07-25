# LiteLab

A web-based Minecraft schematic viewer and editor for .litematic files with advanced filtering and export capabilities.

## Features

- **Load Litematic Files**: Drag & drop or browse to load .litematic schematic files
- **3D Visualization**: Interactive 3D viewer with camera controls and block textures
- **Layer Filtering**: Filter structures by Y-level ranges using intuitive sliders
- **Block Filtering**: Click blocks in the material list to highlight/filter specific block types
- **Material Analysis**: View complete block counts and export as CSV
- **Command Generation**: Generate Minecraft /fill and /setblock commands with custom origin points
- **Structure Transformations**: Rotate and flip structures along different axes
- **Export Options**: Download filtered structures as .litematic or .json files
- **Command Import**: Load structures from pasted /setblock and /fill commands

## Usage

### Loading Files
1. **Drag & Drop**: Simply drag .litematic files onto the drop zone
2. **Browse**: Click the drop zone to open file browser
3. **Commands**: Paste /setblock and /fill commands in the command panel

### Viewing & Navigation
- **Mouse**: Click and drag to rotate camera
- **WASD**: Move camera position
- **Scroll**: Zoom in/out
- **Settings**: Adjust mouse sensitivity and movement speed

### Filtering
- **Layer Range**: Use Y-min/Y-max sliders to show specific layers
- **Block Types**: Click blocks in material list to highlight only those blocks
- **Combined**: Use both filters together for precise selection

### Exporting
- **Litematic**: Download filtered structure as .litematic file
- **JSON**: Export structure data as readable JSON
- **CSV**: Export material list as spreadsheet
- **Commands**: Copy generated /setblock and /fill commands

## Technical Details

### Supported Formats
- **.litematic** files (Litematica mod format)
- **Minecraft /setblock and /fill commands**
- **JSON exports** for data interchange

### Libraries Used
- [Deepslate](https://github.com/misode/deepslate) - NBT parsing and Minecraft data handling
- [gl-matrix](https://glmatrix.net/) - 3D math operations
- [Pako](https://github.com/nodeca/pako) - Gzip compression/decompression
- [Tailwind CSS](https://tailwindcss.com/) - UI styling

### Browser Requirements
- Modern browser with WebGL support
- JavaScript enabled
- Recommended: Chrome, Firefox, Safari, Edge

## Installation

### Option 1: Direct Browser Access
No installation required! LiteLab runs entirely in your browser.

1. Clone or download this repository
2. Open `index.html` in your web browser
3. Start loading and viewing schematics

### Option 2: Local HTTP Server 
For better performance and to avoid CORS issues:

1. Clone or download this repository
2. Run the local server: `python helper/http_server.py`
3. Open your browser and navigate to `http://localhost:8000`
4. Start loading and viewing schematics

## File Structure

```
LiteLab/
├── index.html              # Main application page
├── src/
│   ├── main.js            # Core application logic
│   ├── viewer.js          # 3D rendering and camera controls
│   ├── exporter.js        # File export functionality
│   ├── litematic-utils.js # Litematic file parsing
│   ├── command-parser.js  # Command parsing utilities
│   ├── command-generator.js # Command generation
│   ├── transformations.js # Structure transformation tools
│   └── ...
├── resource/
│   ├── atlas.png          # Block texture atlas
│   ├── assets.js          # Asset definitions
│   └── opaque.js          # Block opacity data
└── helper/
    ├── http_server.py     # Local HTTP server for development
    └── assets.py          # Download latest Deepslate resources
```

## Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## License

This project is open source. Please check individual library licenses for their respective terms.

## Acknowledgments

- Built with [Deepslate](https://github.com/misode/deepslate) by Misode
- Minecraft textures and data © Mojang Studios
- Inspired by the Litematica mod by maruohon