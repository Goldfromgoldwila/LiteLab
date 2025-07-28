# LiteLab

LiteLab is a developer-oriented, web-based Minecraft litematic viewer and editor focused on .litematic file manipulation and visualization. It addresses various challenges faced during Minecraft structure development, providing full lifecycle management capabilities from loading, editing, filtering, to exporting.

Based on modern web technologies, LiteLab introduces a comprehensive solution that offers developers free access to advanced litematic manipulation features. By leveraging cutting-edge 3D rendering and intuitive user interfaces, developers can customize and extend according to project needs, facilitating community collaboration and knowledge sharing in Minecraft development.

## What can LiteLab do?

LiteLab helps developers efficiently work with Minecraft litematic by providing comprehensive manipulation capabilities. Whether it's structure visualization, block-level editing, or format conversion, LiteLab offers powerful tools and intelligent support, significantly simplifying the litematic development process and improving workflow efficiency.

- **Structure Visualization**: LiteLab's 3D rendering module provides developers with real-time interactive visualization of .litematic files, enabling intuitive exploration and analysis of complex structures with WebGL-powered graphics.
- **Advanced Filtering**: LiteLab's filtering system provides developers with multi-dimensional structure analysis capabilities, enabling layer-based and block-type filtering for precise structure examination and modification.
- **Export & Conversion**: LiteLab provides developers with versatile export capabilities for the full structure processing workflow, supporting multiple output formats including .litematic, JSON, CSV, and Minecraft commands.

## Feature List

| Module | Function |
|--------|----------|
| **File Loading** | • Drag & drop .litematic files<br>• Command import from /setblock and /fill<br>• Real-time file validation |
| **3D Visualization** | • Interactive WebGL rendering<br>• Camera controls (WASD + mouse)<br>• Block texture mapping |
| **Filtering & Analysis** | • Layer range filtering (Y-level sliders)<br>• Block type highlighting<br>• Material count analysis |
| **Editing** | • Block breaking in edit mode<br>• Structure transformations (rotate/flip)<br>• Undo/redo functionality |
| **Export** | • .litematic file export<br>• JSON structure data<br>• CSV material lists<br>• Minecraft command generation |

## Quick Start

Refer to the installation guide below for detailed instructions on how to set up and deploy LiteLab.

**Environment Requirements:**
- Modern browser with WebGL support
- JavaScript enabled
- Recommended: Chrome, Firefox, Safari, Edge

**Operation Steps:**

1. **Get the source code.** Execute the following command to get the latest version of LiteLab.
   ```bash
   # Clone the code
   git clone https://github.com/your-repo/litelab.git
   # Enter the LiteLab directory
   cd litelab
   ```

2. **Development setup.** For development with hot reload:
   ```bash
   npm install
   npm run dev
   ```

3. **Production build.** For optimized production deployment:
   ```bash
   npm run build
   npm run preview
   ```

4. **Access LiteLab** by visiting `http://localhost:5173` (dev) or `http://localhost:4173` (preview) in your browser.

## Using LiteLab

- **Structure loading and visualization**: LiteLab provides a complete litematic loading workflow with drag-and-drop support and real-time 3D rendering.
- **Advanced filtering**: LiteLab's filtering functionality offers layer-based analysis, block-type highlighting, and comprehensive material statistics.
- **Export and conversion**: LiteLab supports multiple export formats including .litematic files, JSON data, and Minecraft command generation.
- **Edit mode**: Interactive block editing with visual feedback and comprehensive undo/redo support.

## Developer Guide

- **System architecture**: Learn about the technical architecture and core components of LiteLab.
- **File structure**: Understanding the modular organization of source code and assets.
- **API integration**: How to extend LiteLab with custom functionality and third-party integrations.
- **Performance optimization**: Best practices for handling large structures and optimizing rendering performance.

## Technical Stack

### Core Technologies
- **[Deepslate](https://github.com/misode/deepslate)** - NBT parsing and Minecraft data handling
- **[gl-matrix](https://glmatrix.net/)** - 3D mathematics and transformations
- **[Vite](https://vitejs.dev/)** - Modern build tooling and development server
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework

### File Format Support
- **.litematic** files (Litematica mod format)
- **Minecraft commands** (/setblock and /fill)
- **JSON exports** for data interchange
- **CSV exports** for material analysis

## File Structure

```
LiteLab/
├── index.html              # Main application entry point
├── src/
│   ├── main.js            # Core application logic
│   ├── viewer.js          # 3D rendering and camera controls
│   ├── exporter.js        # File export functionality
│   ├── litematic-utils.js # Litematic file parsing
│   ├── edit-mode.js       # Interactive editing features
│   └── ...
├── public/
│   └── resource/
│       ├── atlas.png      # Block texture atlas
│       ├── assets.js      # Asset definitions
│       └── opaque.js      # Block opacity data
├── package.json           # Dependencies and scripts
└── vite.config.js         # Build configuration
```

## License

This project uses the Apache 2.0 license. For more details, please refer to the [LICENSE](LICENSE) file.

## Community Contributions

We welcome community contributions. For contribution guidelines, please refer to [CONTRIBUTING](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md). We look forward to your contributions!

## Security and Privacy

If you identify potential security issues in this project, please report them through our issue tracker or contact the maintainers directly.

## Join the Community

We are committed to building an open and friendly developer community. All developers interested in Minecraft development and litematic manipulation are welcome to join us!

### Issue Reports & Feature Requests

To efficiently track and resolve issues while ensuring transparency and collaboration, we recommend participating through:

- **GitHub Issues**: Submit bug reports or feature requests
- **Pull Requests**: Contribute code or documentation improvements
- **Discussions**: Share ideas and get help from the community

## Acknowledgments

Thanks to all developers and community members who contributed to the LiteLab project. Special thanks:

- **Deepslate framework** by Misode for NBT parsing and Minecraft data handling
- **Minecraft community** for inspiration and feedback
- **All contributors** who participated in testing and development
- **Mojang Studios** for Minecraft textures and data (© Mojang Studios)
- **Litematica mod** by maruohon for format specification