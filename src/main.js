import { Experience } from './app/Experience.js';

/**
 * Sandalwood Garden Estate: Main Application Entry Point
 * Bootstraps Three.js Experience, attaches to DOM, and launches animation loop.
 */

// Inject base full-viewport reset styles
if (typeof document !== 'undefined') {
  const baseStyle = document.createElement('style');
  baseStyle.id = 'sandalwood-base-styles';
  baseStyle.textContent = `
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #0c0a09;
      color: #f5f2eb;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    #webgl-container {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: block;
      overflow: hidden;
      z-index: 1;
    }
    #webgl-container canvas {
      display: block;
      width: 100% !important;
      height: 100% !important;
    }
    #ui-root {
      position: absolute;
      inset: 0;
      z-index: 100;
      pointer-events: none;
    }
  `;
  document.head.appendChild(baseStyle);
}

let experienceInstance = null;

export function bootstrap() {
  if (typeof document === 'undefined') return null;

  const canvasContainer = document.getElementById('webgl-container') || document.body;
  const uiContainer = document.getElementById('ui-root') || document.body;

  experienceInstance = new Experience(canvasContainer, uiContainer);
  if (typeof window !== 'undefined') {
    window.__sandalwood = experienceInstance;
  }
  experienceInstance.start();

  return experienceInstance;
}

// Auto-bootstrap on DOM ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => bootstrap());
  } else {
    bootstrap();
  }
}

export { experienceInstance as experience };
