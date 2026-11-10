/**
 * Asset Manifest (PRD Section 22.3):
 * Records every procedural geometry generator, texture, and synthesized audio source.
 * Zero external copyrighted or unlicensed assets are used.
 */

export const ASSET_MANIFEST = {
  textures: [
    { id: 'sandalwood-timber', type: 'Procedural CanvasTexture', license: 'Original / Project-Authored' },
    { id: 'walnut-timber', type: 'Procedural CanvasTexture', license: 'Original / Project-Authored' },
    { id: 'honey-oak-floor', type: 'Procedural CanvasTexture', license: 'Original / Project-Authored' },
    { id: 'teak-decking', type: 'Procedural CanvasTexture', license: 'Original / Project-Authored' },
    { id: 'beige-stone-pavers', type: 'Procedural CanvasTexture', license: 'Original / Project-Authored' },
    { id: 'limestone-porcelain', type: 'Procedural CanvasTexture', license: 'Original / Project-Authored' },
    { id: 'bathroom-porcelain', type: 'Procedural CanvasTexture', license: 'Original / Project-Authored' },
    { id: 'aqua-pool-mosaic', type: 'Procedural CanvasTexture', license: 'Original / Project-Authored' },
    { id: 'woven-linen-fabric', type: 'Procedural CanvasTexture', license: 'Original / Project-Authored' },
    { id: 'garden-lawn-soil', type: 'Procedural CanvasTexture', license: 'Original / Project-Authored' },
    { id: 'tree-bark', type: 'Procedural CanvasTexture', license: 'Original / Project-Authored' },
    { id: 'framed-artworks', type: 'Procedural CanvasTexture', license: 'Original / Project-Authored' },
  ],
  models: [
    { id: 'male-character-rig', heightMeters: 1.78, source: 'Original Hierarchical Procedural Mesh' },
    { id: 'female-character-rig', heightMeters: 1.66, source: 'Original Hierarchical Procedural Mesh' },
    { id: 'flower-varieties-x7', countRange: '450-650', source: 'Original Curved-Petal Instanced Geometry' },
    { id: 'sandalwood-residence', footprintMeters: '24x18', source: 'Original Architectural Timber Builder' },
    { id: 'interior-furnishings', rooms: 12, source: 'Original Measured Furniture & Appliance Builders' },
  ],
  audio: [
    { id: 'garden-breeze-birds', source: 'Web Audio API Procedural Synthesis' },
    { id: 'surface-footsteps', source: 'Web Audio API Procedural Synthesis (grass/stone/timber/tile)' },
    { id: 'door-hinge', source: 'Web Audio API Procedural Synthesis' },
    { id: 'shower-spray', source: 'Web Audio API Procedural Synthesis' },
    { id: 'pool-shimmer', source: 'Web Audio API Procedural Synthesis' },
    { id: 'interaction-chime', source: 'Web Audio API Procedural Synthesis' },
  ],
};
