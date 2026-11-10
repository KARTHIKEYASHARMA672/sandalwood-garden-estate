import * as THREE from 'three';
import {
  getTimberTextures,
  getFabricTextures,
  getArtworkTexture,
  getRugTextures,
  getStoneTileTextures,
} from '../../assets/procedural/TextureGenerator.js';
import {
  createChamferedBoxGeo,
  createLatheGeo,
} from './RoomProps.js';

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
      stoneTop: new THREE.MeshStandardMaterial({
        map: getStoneTileTextures('limestone', 2, 1).map,
        roughness: 0.42,
      }),
      clearGlass: new THREE.MeshPhysicalMaterial({
        color: 0xf4f9fc,
        transmission: 0.9,
        transparent: true,
        opacity: 1,
        roughness: 0.06,
        ior: 1.5,
      }),
      linenPlace: new THREE.MeshStandardMaterial({
        color: 0xd9cdb8,
        roughness: 0.9,
      }),
      oliveSprig: new THREE.MeshStandardMaterial({
        color: 0x4b6a42,
        roughness: 0.78,
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
    const cx = -8.75; // Shifted slightly East to allow wide clearance by West sideboard
    const cz = 2.3; // Center Z of dining room (0.2 to 4.4)

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
    const rugTex = getRugTextures('gallery', 1, 1);
    const rugGeo = new THREE.PlaneGeometry(3.75, 2.35);
    rugGeo.rotateX(-Math.PI / 2);
    const rugMat = new THREE.MeshStandardMaterial({
      map: rugTex.map,
      normalMap: rugTex.normalMap,
      normalScale: new THREE.Vector2(0.7, 0.7),
      roughnessMap: rugTex.roughnessMap,
      roughness: 0.94,
    });
    const rug = new THREE.Mesh(rugGeo, rugMat);
    rug.position.set(cx, floorY + 0.004, cz);
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

    // Beveled solid sandalwood tabletop + recessed apron
    const topMesh = new THREE.Mesh(
      createChamferedBoxGeo(tL, topThick, tW, 0.05),
      this.materials.tableWood
    );
    topMesh.position.set(0, tH - topThick * 0.5, 0);
    topMesh.castShadow = true;
    topMesh.receiveShadow = true;
    setGroup.add(topMesh);

    const apron = new THREE.Mesh(
      new THREE.BoxGeometry(tL - 0.36, 0.06, tW - 0.24),
      this.materials.chairLegs
    );
    apron.position.set(0, tH - topThick - 0.03, 0);
    setGroup.add(apron);

    // Fluted architectural double pedestals & stretcher beam
    for (const px of [-tL * 0.5 + 0.45, tL * 0.5 - 0.45]) {
      const col = new THREE.Mesh(
        createChamferedBoxGeo(0.14, tH - topThick - 0.06, tW - 0.34, 0.03),
        this.materials.tableWood
      );
      col.position.set(px, (tH - topThick) * 0.5, 0);
      col.castShadow = true;
      setGroup.add(col);

      const foot = new THREE.Mesh(
        createChamferedBoxGeo(0.24, 0.05, tW - 0.2, 0.02),
        this.materials.chairLegs
      );
      foot.position.set(px, 0.025, 0);
      setGroup.add(foot);
    }
    const stretcher = new THREE.Mesh(new THREE.BoxGeometry(tL - 0.9, 0.05, 0.08), this.materials.chairLegs);
    stretcher.position.set(0, 0.16, 0);
    setGroup.add(stretcher);

    // Center table floral vessel & olive branches
    const centerBowl = new THREE.Mesh(
      createLatheGeo([[0.09, 0], [0.16, 0.035], [0.19, 0.085], [0.16, 0.085]], 18),
      this.materials.ceramicWhite
    );
    centerBowl.position.set(0, tH, 0);
    centerBowl.castShadow = true;
    setGroup.add(centerBowl);

    for (let s = 0; s < 5; s++) {
      const ang = (s / 5) * Math.PI * 2;
      const sprig = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.005, 0.24, 6), this.materials.oliveSprig);
      sprig.position.set(Math.cos(ang) * 0.06, tH + 0.12, Math.sin(ang) * 0.06);
      sprig.rotation.z = Math.cos(ang) * 0.55;
      sprig.rotation.x = Math.sin(ang) * 0.55;
      setGroup.add(sprig);
    }

    // Complete 8 place settings on tabletop (woven placemats, porcelain plates, steel flatware, crystal goblets)
    const addPlaceSetting = (px, pz, facingZ) => {
      const mat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.004, 0.3), this.materials.linenPlace);
      mat.position.set(px, tH + 0.002, pz);
      setGroup.add(mat);

      const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.105, 0.014, 16), this.materials.ceramicWhite);
      plate.position.set(px, tH + 0.011, pz);
      plate.castShadow = true;
      setGroup.add(plate);

      const goblet = new THREE.Mesh(
        createLatheGeo([[0.032, 0], [0.005, 0.006], [0.005, 0.075], [0.042, 0.115], [0.038, 0.165]], 12),
        this.materials.clearGlass
      );
      goblet.position.set(px + 0.14 * facingZ, tH, pz - 0.11 * facingZ);
      setGroup.add(goblet);

      const knife = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.005, 0.2), this.materials.brassMetal);
      knife.position.set(px + 0.16 * facingZ, tH + 0.006, pz);
      setGroup.add(knife);
    };
    const chairOffsetsX = [-0.85, 0.0, 0.85];
    for (const ox of chairOffsetsX) {
      addPlaceSetting(ox, tW * 0.5 - 0.2, 1);
      addPlaceSetting(ox, -tW * 0.5 + 0.2, -1);
    }
    addPlaceSetting(-tL * 0.5 + 0.22, 0, 1);
    addPlaceSetting(tL * 0.5 - 0.22, 0, -1);

    // 2. 8 Upholstered dining chairs: seat height 0.45m, back height 0.85m
    const seatH = 0.45;
    const backH = 0.85;
    const chairW = 0.48;
    const chairD = 0.48;

    // 3 chairs on south side (facing north)
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

    // Beveled upholstered seat cushion
    const seatMesh = new THREE.Mesh(
      createChamferedBoxGeo(w, 0.075, d, 0.03),
      this.materials.chairUpholstery
    );
    seatMesh.position.set(0, seatH - 0.038, 0);
    seatMesh.castShadow = true;
    chairGroup.add(seatMesh);

    // Sculpted gently reclined chamfered backrest (total height backH = 0.85m)
    const backrestH = backH - seatH;
    const backMesh = new THREE.Mesh(
      createChamferedBoxGeo(w - 0.02, backrestH, 0.055, 0.02),
      this.materials.chairUpholstery
    );
    backMesh.position.set(0, seatH + backrestH * 0.5, d * 0.5 - 0.03);
    backMesh.rotation.x = 0.07;
    backMesh.castShadow = true;
    chairGroup.add(backMesh);

    // Walnut timber back stile surround + 4 tapered legs
    const rail = new THREE.Mesh(
      createChamferedBoxGeo(w, 0.04, 0.06, 0.015),
      this.materials.chairLegs
    );
    rail.position.set(0, seatH - 0.08, d * 0.5 - 0.03);
    chairGroup.add(rail);

    const legGeo = new THREE.CylinderGeometry(0.017, 0.011, seatH - 0.075, 8);
    const legOffsets = [
      [-w * 0.5 + 0.04, -d * 0.5 + 0.04],
      [w * 0.5 - 0.04, -d * 0.5 + 0.04],
      [-w * 0.5 + 0.04, d * 0.5 - 0.04],
      [w * 0.5 - 0.04, d * 0.5 - 0.04],
    ];
    for (const [lx, lz] of legOffsets) {
      const leg = new THREE.Mesh(legGeo, this.materials.chairLegs);
      leg.position.set(lx, (seatH - 0.075) * 0.5, lz);
      leg.castShadow = true;
      chairGroup.add(leg);
    }

    return chairGroup;
  }

  buildSideboardCredenza(floorY) {
    const sbGroup = new THREE.Group();
    sbGroup.name = 'dining-sideboard';

    // Spec: 1.80m L x 0.50m W x 0.85m H tucked flush along West wall beneath win-dining-west (sill Y=1.15m)
    const sbL = 1.8;
    const sbW = 0.5;
    const sbH = 0.85;

    const sbBody = new THREE.Mesh(
      createChamferedBoxGeo(sbL, sbH - 0.14, sbW, 0.025),
      this.materials.sideboardWood
    );
    sbBody.position.set(0, 0.12 + (sbH - 0.14) * 0.5, 0);
    sbBody.castShadow = true;
    sbBody.receiveShadow = true;
    sbGroup.add(sbBody);

    const topSlab = new THREE.Mesh(
      createChamferedBoxGeo(sbL + 0.02, 0.03, sbW + 0.02, 0.02),
      this.materials.stoneTop
    );
    topSlab.position.set(0, sbH - 0.015, 0);
    topSlab.castShadow = true;
    sbGroup.add(topSlab);

    for (const fx of [-sbL * 0.5 + 0.1, 0, sbL * 0.5 - 0.1]) {
      for (const fz of [-sbW * 0.5 + 0.08, sbW * 0.5 - 0.08]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.013, 0.12, 8), this.materials.chairLegs);
        leg.position.set(fx, 0.06, fz);
        sbGroup.add(leg);
      }
    }

    // Brushed brass hardware handles
    const pullGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.1, 8);
    pullGeo.rotateZ(Math.PI / 2);
    for (const px of [-0.55, 0.0, 0.55]) {
      const pull = new THREE.Mesh(pullGeo, this.materials.brassMetal);
      pull.position.set(px, sbH * 0.65, sbW * 0.5 + 0.015);
      sbGroup.add(pull);
    }

    // Sculpted ceramic carafe & tray near ends of credenza (clear of central window glass)
    const jugMesh = new THREE.Mesh(
      createLatheGeo([[0.045, 0], [0.088, 0.09], [0.068, 0.19], [0.036, 0.25], [0.048, 0.27]], 14),
      this.materials.ceramicWhite
    );
    jugMesh.position.set(-0.72, sbH, 0.02);
    jugMesh.castShadow = true;
    sbGroup.add(jugMesh);

    const lowTray = new THREE.Mesh(
      createChamferedBoxGeo(0.36, 0.022, 0.24, 0.02),
      this.materials.brassMetal
    );
    lowTray.position.set(0.66, sbH + 0.011, 0.02);
    sbGroup.add(lowTray);

    // Mount cleanly against solid West wall at X = -11.48, Z = 2.3 (leaves Z=0.2 Rear Pool Gallery archway 100% open!)
    sbGroup.position.set(-11.48, floorY, 2.3);
    sbGroup.rotation.y = Math.PI / 2;
    this.group.add(sbGroup);

    this.colliders.push({
      id: 'collider-dining-sideboard',
      min: new THREE.Vector3(-11.75, floorY, 2.3 - sbL * 0.5),
      max: new THREE.Vector3(-11.2, floorY + sbH, 2.3 + sbL * 0.5),
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

    // 6 Warm glowing glass shades along ring + warm local fill light
    const globeGeo = new THREE.SphereGeometry(0.05, 12, 10);
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const globe = new THREE.Mesh(globeGeo, this.materials.glassPendant);
      globe.position.set(Math.cos(ang) * 0.42, 2.4, Math.sin(ang) * 0.42);
      chanGroup.add(globe);
    }

    const chanLight = new THREE.PointLight(0xffe1b5, 0.9, 6.5, 1.5);
    chanLight.position.set(0, 2.35, 0);
    chanGroup.add(chanLight);

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
    const artGeo = new THREE.PlaneGeometry(0.88, 1.05);
    const artMat = new THREE.MeshStandardMaterial({
      map: artTex,
      roughness: 0.75,
    });
    const artMesh = new THREE.Mesh(artGeo, artMat);
    artMesh.position.set(0, 0, 0.02);
    artGroup.add(artMesh);

    const frameGeo = new THREE.BoxGeometry(0.96, 1.13, 0.032);
    const frameMesh = new THREE.Mesh(frameGeo, this.materials.brassMetal);
    frameMesh.position.set(0, 0, 0);
    artGroup.add(frameMesh);

    // Mounted cleanly on solid West pier north of win-dining-west (Z = 3.92, X = -11.72 facing East)
    artGroup.position.set(-11.72, floorY + 1.85, 3.92);
    artGroup.rotation.y = Math.PI / 2;
    this.group.add(artGroup);
  }
}

export function buildDiningHall(options = {}) {
  const builder = new DiningHallBuilder(options);
  return builder.build();
}
