# Spriggles

<p align="center">
  <img src="https://raw.githubusercontent.com/cropgeeks/spriggles/main/src/assets/spriggles-full.svg?sanitize=true" width="200" alt="Logo">
</p>

![GitHub License](https://img.shields.io/github/license/cropgeeks/spriggles?style=for-the-badge&logo=apache)
![GitHub package.json version](https://img.shields.io/github/package-json/v/cropgeeks/spriggles?style=for-the-badge)
![GitHub last commit](https://img.shields.io/github/last-commit/cropgeeks/spriggles?style=for-the-badge&logo=git)

Spriggles is a web application for extracting vegetation indices from images. It's built as a Progressive Web App (PWA), so once loaded it can be used completely offline — handy for fieldwork where connectivity isn't guaranteed.

## Features

- **Vegetation index extraction** — process images to calculate vegetation indices.
- **Batch processing** — work through multiple images in one session rather than handling them one at a time.
- **Perspective correction** — draw a four-cornered polygon on a source image to mark the region of interest, which is then transformed into a rectangle for further processing.
- **GridScore integration** — send extracted data directly to [GridScore](https://gridscore.hutton.ac.uk/).
- **Offline-first (PWA)** — installable and fully usable without an internet connection after the initial load.

## Tech stack

Spriggles is built with:

- [Vue 3](https://vuejs.org/)
- [Vuetify 3](https://vuetifyjs.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Pinia](https://pinia.vuejs.org/) for state management
- [Vue Router](https://router.vuejs.org/)

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/)
- A package manager: npm, yarn, pnpm, or bun

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/cropgeeks/spriggles.git
cd spriggles
npm install
```

### Development server

Start a local development server with hot-reload:

```bash
npm run dev
```

The app will be available at `http://localhost:3000` (or the port shown in your terminal).

### Building for production

```bash
npm run build
```

The production-ready, installable PWA build will be output to the `dist` folder.

## Usage

1. Upload one or more images.
2. For each image, mark a four-cornered polygon around the area you want to analyse — Spriggles will warp this into a rectangle for consistent, distortion-free processing.
3. Run the vegetation index extraction across your selected images.
4. Review the results, and optionally send them to GridScore for further analysis.
5. Since Spriggles is a PWA, you can install it to your device and continue using it without an internet connection.

## License

This project is licensed under the [Apache-2.0 License](LICENSE).

## About

Spriggles is developed by [cropgeeks](https://github.com/cropgeeks).