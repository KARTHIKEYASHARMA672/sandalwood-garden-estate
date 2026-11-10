import * as THREE from 'three';
import {
  getTimberTextures,
  getFabricTextures,
  getArtworkTexture,
} from '../../assets/procedural/TextureGenerator.js';

/**
 * DiningHallBuilder: Furnishes the Secondary Dining & Family Hall (PRD §10.3, Feature F23).
 *
 * Space bounds: minX: -11.75, maxX: -6.75, minZ: 0.2, maxZ: 4.4, floorY: 0.3, ceilingY: 3.7.
 * Connects to rear pool gallery along west wing (minX = -11.75).
 *
 * Includes:
 * - 8-seater sandalwood dining table (2.80m L x 1.10m W x 0.76m H)
 * - 8 ergonomic upholstered dining chairs (seat height 0.45m, back height 0.85m)
 * - Sandalwood sideboard credenza (1.80m L x 0.50m W x 0.85m H)
 * - Contemporary suspended chandelier / pendant ring at Y = 2.4m
 * - Dining area wool rug (3.6m x 2.2m)
 * - Curated abstract horizon wall artwork
 */
export class DiningHallBuilder {
  constructor(options = {}) {
    this.options = options;
    this.group = new THREE.Group();
    this.group.name = 'furniture-dining-hall';
    this.colliders = [];
    this.interactables = [];
    this.seats = [];
    this.materials = this.createMaterials();
  }

  createMaterials() {
    const sandalwood = getTimberTextures('sandalwood', 2, 2);
    const walnut = getTimberTextures('walnut', 2, 2);
    const chairFabric = getFabricTextures('#EFE6D5', 2, 2);

    return {
      tableWood: new THREE.MeshStandardMaterial({
        map: sandalwood.map,
        bumpMap: sandalwood.bumpMap,
        bumpScale: 0.03,
        roughness: 0.5,
        metalness: 0.04,
      }),
      sideboardWood: new THREE.MeshStandardMaterial({
        map: walnut.map,
        bumpMap: walnut.bumpMap,
        bumpScale: 0.03,
        roughness: 0.55,
        metalness: 0.04,
      }),
      chairUpholstery: new THREE.MeshStandardMaterial({
        map: chairFabric.map,
        bumpMap: chairFabric.bumpMap,
        bumpScale: 0.03,
        roughness: 0.85,
        metalness: 0.0,
      }),
      chairLegs: new THREE.MeshStandardMaterial({
        color: 0x422d1f,
        roughness: 0.6,
      }),
      brassMetal: new THREE.MeshStandardMaterial({
        color: 0xc8a265,
        roughness: 0.3,
        metalness: 0.85,
      }),
      ceramicWhite: new THREE.MeshStandardMaterial({
        color: 0xf3ede2,
        roughness: 0.35,
      }),
      glassPendant: new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffeedd,
        emissiveIntensity: 0.65,
        roughness: 0.2,
      }),
    };
  }

  build() {
    const floorY = 0.3; // Dining hall datum
    const cx = -9.25; // center X of dining room (-11.75 to -6.75)
    const cz = 2.3; // center Z of dining room (0.2 to 4.4)

    this.buildAreaRug(cx, floorY, cz);
    this.buildDiningTableAndChairs(cx, floorY, cz);
    this.buildSideboardCredenza(floorY);
    this.buildChandelier(cx, floorY, cz);
    this.buildWallArt(floorY);

    this.group.userData = {
      zoneId: 'dining-hall',
      colliders: this.colliders,
      interactables: this.interactables,
      seats: this.seats,
    };

    return this.group;
  }

  buildAreaRug(cx, floorY, cz) {
    const rugTex = getFabricTextures('#D6CABA', 4, 3);
    const rugGeo = new THREE.PlaneGeometry(3.6, 2.2);
    rugGeo.rotateX(-Math.PI / 2);
    const rugMat = new THREE.MeshStandardMaterial({
      map: rugTex.map,
      bumpMap: rugTex.bumpMap,
      bumpScale: 0.04,
      roughness: 0.92,
    });
    const rug = new THREE.Mesh(rugGeo, rugMat);
    rug.position.set(cx, floorY + 0.003, cz);
    rug.receiveShadow = true;
    this.group.add(rug);
  }

  buildDiningTableAndChairs(cx, floorY, cz) {
    const setGroup = new THREE.Group();
    setGroup.name = 'dining-table-set';

    // 1. Long timber dining table: 2.80m L x 1.10m W x 0.76m H
    const tL = 2.8;
    const tW = 1.1;
    const tH = 0.76;
    const topThick = 0.045;

    // Solid sandalwood tabletop
    const topMesh = new THREE.Mesh(
      new THREE.BoxGeometry(tL, topThick, tW),
      this.materials.tableWood
    );
    topMesh.position.set(0, tH - topThick * 0.5, 0);
    topMesh.castShadow = true;
    topMesh.receiveShadow = true;
    setGroup.add(topMesh);

    // Trestle legs / structural posts at each end
    const legGeo = new THREE.BoxGeometry(0.1, tH - topThick, tW - 0.2);
    const legLeft = new THREE.Mesh(legGeo, this.materials.tableWood);
    legLeft.position.set(-tL * 0.5 + 0.35, (tH - topThick) * 0.5, 0);
    legLeft.castShadow = true;
    setGroup.add(legLeft);

    const legRight = new THREE.Mesh(legGeo, this.materials.tableWood);
    legRight.position.set(tL * 0.5 - 0.35, (tH - topThick) * 0.5, 0);
    legRight.castShadow = true;
    setGroup.add(legRight);

    // Center table centerpiece: ceramic bowl and dried floral sprig
    const centerBowl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.1, 0.07, 16),
      this.materials.ceramicWhite
    );
    centerBowl.position.set(0, tH + 0.035, 0);
    centerBowl.castShadow = true;
    setGroup.add(centerBowl);

    // 2. 8 Upholstered dining chairs: seat height 0.45m, back height 0.85m
    const seatH = 0.45;
    const backH = 0.85;
    const chairW = 0.48;
    const chairD = 0.48;

    // 3 chairs on south side (facing north)
    const chairOffsetsX = [-0.85, 0.0, 0.85];
    for (let i = 0; i < 3; i++) {
      const chair = this.createDiningChair(chairW, chairD, seatH, backH);
      chair.position.set(chairOffsetsX[i], 0, tW * 0.5 + 0.25);
      chair.rotation.y = 0; // facing north toward table
      setGroup.add(chair);

      this.seats.push({
        id: `dining-chair-south-${i + 1}`,
        label: `Dining Chair South ${i + 1}`,
        x: cx + chairOffsetsX[i],
        y: floorY + seatH,
        z: cz + tW * 0.5 + 0.25,
        heading: Math.PI,
      });
    }

    // 3 chairs on north side (facing south)
    for (let i = 0; i < 3; i++) {
      const chair = this.createDiningChair(chairW, chairD, seatH, backH);
      chair.position.set(chairOffsetsX[i], 0, -tW * 0.5 - 0.25);
      chair.rotation.y = Math.PI; // facing south toward table
      setGroup.add(chair);

      this.seats.push({
        id: `dining-chair-north-${i + 1}`,
        label: `Dining Chair North ${i + 1}`,
        x: cx + chairOffsetsX[i],
        y: floorY + seatH,
        z: cz - tW * 0.5 - 0.25,
        heading: 0,
      });
    }

    // 1 chair at west head (facing east)
    const westHeadChair = this.createDiningChair(chairW, chairD, seatH, backH);
    westHeadChair.position.set(-tL * 0.5 - 0.25, 0, 0);
    westHeadChair.rotation.y = Math.PI / 2;
    setGroup.add(westHeadChair);

    this.seats.push({
      id: 'dining-chair-west-head',
      label: 'Dining Chair West Head',
      x: cx - tL * 0.5 - 0.25,
      y: floorY + seatH,
      z: cz,
      heading: -Math.PI / 2,
    });

    // 1 chair at east head (facing west)
    const eastHeadChair = this.createDiningChair(chairW, chairD, seatH, backH);
    eastHeadChair.position.set(tL * 0.5 + 0.25, 0, 0);
    eastHeadChair.rotation.y = -Math.PI / 2;
    setGroup.add(eastHeadChair);

    this.seats.push({
      id: 'dining-chair-east-head',
      label: 'Dining Chair East Head',
      x: cx + tL * 0.5 + 0.25,
      y: floorY + seatH,
      z: cz,
      heading: Math.PI / 2,
    });

    setGroup.position.set(cx, floorY, cz);
    this.group.add(setGroup);

    this.colliders.push({
      id: 'collider-dining-table',
      min: new THREE.Vector3(cx - tL * 0.5 - 0.1, floorY, cz - tW * 0.5 - 0.1),
      max: new THREE.Vector3(cx + tL * 0.5 + 0.1, floorY + tH, cz + tW * 0.5 + 0.1),
      type: 'furniture',
    });
  }

  createDiningChair(w, d, seatH, backH) {
    const chairGroup = new THREE.Group();

    // Upholstered seat cushion
    const seatMesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.08, d),
      this.materials.chairUpholstery
    );
    seatMesh.position.set(0, seatH - 0.04, 0);
    seatMesh.castShadow = true;
    chairGroup.add(seatMesh);

    // Upholstered gently curved backrest (total height backH = 0.85m)
    const backrestH = backH - seatH;
    const backMesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, backrestH, 0.06),
      this.materials.chairUpholstery
    );
    backMesh.position.set(0, seatH + backrestH * 0.5, d * 0.5 - 0.03);
    backMesh.castShadow = true;
    chairGroup.add(backMesh);

    // 4 Dark walnut tapered legs
    const legGeo = new THREE.CylinderGeometry(0.016, 0.012, seatH - 0.08, 8);
    const legOffsets = [
      [-w * 0.5 + 0.04, -d * 0.5 + 0.04],
      [w * 0.5 - 0.04, -d * 0.5 + 0.04],
      [-w * 0.5 + 0.04, d * 0.5 - 0.04],
      [w * 0.5 - 0.04, d * 0.5 - 0.04],
    ];
    for (const [lx, lz] of legOffsets) {
      const leg = new THREE.Mesh(legGeo, this.materials.chairLegs);
      leg.position.set(lx, (seatH - 0.08) * 0.5, lz);
      leg.castShadow = true;
      chairGroup.add(leg);
    }

    return chairGroup;
  }

  buildSideboardCredenza(floorY) {
    const sbGroup = new THREE.Group();
    sbGroup.name = 'dining-sideboard';

    // Spec: 1.80m L x 0.50m W x 0.85m H
    const sbL = 1.8;
    const sbW = 0.5;
    const sbH = 0.85;

    const sbBody = new THREE.Mesh(
      new THREE.BoxGeometry(sbL, sbH, sbW),
      this.materials.sideboardWood
    );
    sbBody.position.set(0, sbH * 0.5, 0);
    sbBody.castShadow = true;
    sbBody.receiveShadow = true;
    sbGroup.add(sbBody);

    // Brushed brass hardware handles
    const pullGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.1, 8);
    pullGeo.rotateZ(Math.PI / 2);
    for (const px of [-0.5, 0.0, 0.5]) {
      const pull = new THREE.Mesh(pullGeo, this.materials.brassMetal);
      pull.position.set(px, sbH * 0.65, sbW * 0.5 + 0.015);
      sbGroup.add(pull);
    }

    // Decorative ceramic pieces on top of credenza
    const jugMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.09, 0.24, 12),
      this.materials.ceramicWhite
    );
    jugMesh.position.set(-0.55, sbH + 0.12, 0);
    jugMesh.castShadow = true;
    sbGroup.add(jugMesh);

    // Position along south wall of dining hall (Z = 0.6)
    sbGroup.position.set(-9.25, floorY, 0.6);
    this.group.add(sbGroup);

    this.colliders.push({
      id: 'collider-dining-sideboard',
      min: new THREE.Vector3(-9.25 - sbL * 0.5, floorY, 0.6 - sbW * 0.5),
      max: new THREE.Vector3(-9.25 + sbL * 0.5, floorY + sbH, 0.6 + sbW * 0.5),
      type: 'furniture',
    });
  }

  buildChandelier(cx, floorY, cz) {
    const chanGroup = new THREE.Group();
    chanGroup.name = 'dining-chandelier';

    // Suspension rod from ceiling (Y = 3.7) down to Y = 2.4
    const rodGeo = new THREE.CylinderGeometry(0.008, 0.008, 1.25, 8);
    const rod = new THREE.Mesh(rodGeo, this.materials.brassMetal);
    rod.position.set(0, 3.05, 0);
    chanGroup.add(rod);

    // Contemporary brass chandelier ring: 0.85m diameter at Y = 2.4m
    const ringGeo = new THREE.TorusGeometry(0.42, 0.018, 12, 32);
    ringGeo.rotateX(Math.PI / 2);
    const ring = new THREE.Mesh(ringGeo, this.materials.brassMetal);
    ring.position.set(0, 2.4, 0);
    chanGroup.add(ring);

    // 6 Warm glowing glass shades along ring
    const globeGeo = new THREE.SphereGeometry(0.05, 12, 10);
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const globe = new THREE.Mesh(globeGeo, this.materials.glassPendant);
      globe.position.set(Math.cos(ang) * 0.42, 2.4, Math.sin(ang) * 0.42);
      chanGroup.add(globe);
    }

    chanGroup.position.set(cx, 0, cz);
    this.group.add(chanGroup);
  }

  buildWallArt(floorY) {
    const artGroup = new THREE.Group();
    artGroup.name = 'dining-wall-art';

    let artTex;
    try {
      artTex = getArtworkTexture('abstract');
    } catch {
      const canvas = document.createElement('canvas');
      canvas.width = 384;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#B8755F';
        ctx.fillRect(0, 0, 384, 512);
      }
      artTex = new THREE.CanvasTexture(canvas);
      artTex.colorSpace = THREE.SRGBColorSpace;
    }
    const artGeo = new THREE.PlaneGeometry(1.5, 0.95);
    const artMat = new THREE.MeshStandardMaterial({
      map: artTex,
      roughness: 0.75,
    });
    const artMesh = new THREE.Mesh(artGeo, artMat);
    artMesh.position.set(0, 0, 0.02);
    artGroup.add(artMesh);

    const frameGeo = new THREE.BoxGeometry(1.58, 1.03, 0.035);
    const frameMesh = new THREE.Mesh(frameGeo, this.materials.brassMetal);
    frameMesh.position.set(0, 0, 0);
    artGroup.add(frameMesh);

    // Mounted on wall at Z = 0.25 (facing north)
    artGroup.position.set(-9.25, floorY + 2.0, 0.25);
    this.group.add(artGroup);
  }
}

export function buildDiningHall(options = {}) {
  const builder = new DiningHallBuilder(options);
  return builder.build();
}
