import * as THREE from 'three';
import {
  getFurnitureWoodTextures,
  getFabricTextures,
  getRugTextures,
  getStoneSlabTextures,
} from '../../assets/procedural/TextureGenerator.js';
import {
  createChamferedBoxGeo,
  createLatheGeo,
  createCuratedFramedArt,
  createSafeArtworkMaterial,
  createContactAoMesh,
  createFlutedPanel,
  createCurvedChairBackGeo,
} from './RoomProps.js';

/**
 * DiningHallBuilder: Furnishes the Secondary Dining & Family Hall (PRD §10.3, Feature F23).
 *
 * Space bounds: minX: -11.75, maxX: -6.75, minZ: 0.2, maxZ: 4.4, floorY: 0.3, ceilingY: 3.7.
 * Connects to rear pool gallery along west wing (minX = -11.75).
 *
 * Includes:
 * - 8-seater sandalwood dining table (2.80m L x 1.10m W x 0.76m H) with linen place settings
 * - 8 ergonomic upholstered dining chairs (seat height 0.45m, back height 0.85m)
 * - Walnut & limestone sideboard credenza anchored cleanly on South-West solid pier (clear of curtains)
 * - Contemporary suspended chandelier / pendant ring at Y = 2.4m (registered with interiorLights)
 * - Dining area wool rug (3.75m x 2.35m)
 * - Paired matted botanical & abstract framed prints on West piers clear of curtain finials
 */
export class DiningHallBuilder {
  constructor(options = {}) {
    this.options = options;
    this.group = new THREE.Group();
    this.group.name = 'furniture-dining-hall';
    this.colliders = [];
    this.interactables = [];
    this.seats = [];
    this.interiorLights = [];
    this.materials = this.createMaterials();
  }

  createMaterials() {
    const sandalwood = getFurnitureWoodTextures('sandalwood', 2, 2);
    const walnut = getFurnitureWoodTextures('walnut', 2, 2);
    const chairFabric = getFabricTextures('#F3EDE2', 2, 2);
    const stone = getStoneSlabTextures('calacatta', 1, 1);

    return {
      tableWood: new THREE.MeshStandardMaterial({
        map: sandalwood.map,
        normalMap: sandalwood.normalMap,
        normalScale: new THREE.Vector2(0.55, 0.55),
        roughnessMap: sandalwood.roughnessMap,
        roughness: 0.48,
        metalness: 0.04,
      }),
      sideboardWood: new THREE.MeshStandardMaterial({
        map: walnut.map,
        normalMap: walnut.normalMap,
        normalScale: new THREE.Vector2(0.58, 0.58),
        roughnessMap: walnut.roughnessMap,
        roughness: 0.52,
        metalness: 0.04,
      }),
      chairUpholstery: new THREE.MeshStandardMaterial({
        map: chairFabric.map,
        normalMap: chairFabric.normalMap,
        normalScale: new THREE.Vector2(0.45, 0.45),
        roughnessMap: chairFabric.roughnessMap,
        roughness: 0.90,
        metalness: 0.0,
        envMapIntensity: 0.2,
      }),
      chairLegs: new THREE.MeshStandardMaterial({
        color: 0x6b4d32,
        roughness: 0.52,
      }),
      brassMetal: new THREE.MeshStandardMaterial({
        color: 0xc8a265,
        roughness: 0.28,
        metalness: 0.88,
      }),
      ceramicWhite: new THREE.MeshStandardMaterial({
        color: 0xf0e9dc,
        roughness: 0.42,
      }),
      stoneTop: new THREE.MeshStandardMaterial({
        map: stone.map,
        normalMap: stone.normalMap,
        normalScale: new THREE.Vector2(0.42, 0.42),
        roughnessMap: stone.roughnessMap,
        roughness: 0.34,
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
      linenNapkin: new THREE.MeshStandardMaterial({
        color: 0xefe7d8,
        roughness: 0.92,
      }),
      matCream: new THREE.MeshStandardMaterial({
        color: 0xf2ece0,
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
      interiorLights: this.interiorLights,
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
      normalScale: new THREE.Vector2(0.5, 0.5),
      roughnessMap: rugTex.roughnessMap,
      roughness: 0.95,
      envMapIntensity: 0.18,
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

    // Sculpted cylindrical solid oak pillar pedestals matching ref_dining_kitchen_espresso
    const pillarGeo = new THREE.CylinderGeometry(0.115, 0.135, tH - topThick - 0.03, 18);
    for (const px of [-tL * 0.5 + 0.55, tL * 0.5 - 0.55]) {
      for (const pz of [-0.26, 0.26]) {
        const leg = new THREE.Mesh(pillarGeo, this.materials.tableWood);
        leg.position.set(px, (tH - topThick) * 0.5, pz);
        leg.castShadow = true;
        leg.receiveShadow = true;
        setGroup.add(leg);
      }
    }
    setGroup.add(createContactAoMesh(tL + 0.35, tW + 0.35, 0.28));

    // Sculptural matte travertine/ceramic amphora centerpiece with airy olive branches
    const centerBowl = new THREE.Mesh(
      createLatheGeo([
        [0.075, 0],
        [0.145, 0.07],
        [0.155, 0.15],
        [0.078, 0.22],
        [0.088, 0.26],
        [0.072, 0.26],
      ], 18),
      this.materials.ceramicWhite
    );
    centerBowl.position.set(0, tH, 0);
    centerBowl.castShadow = true;
    setGroup.add(centerBowl);

    for (let s = 0; s < 7; s++) {
      const ang = (s / 7) * Math.PI * 2;
      const sprig = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.005, 0.34, 6), this.materials.oliveSprig);
      sprig.position.set(Math.cos(ang) * 0.06, tH + 0.34, Math.sin(ang) * 0.06);
      sprig.rotation.z = Math.cos(ang) * 0.42;
      sprig.rotation.x = Math.sin(ang) * 0.42;
      setGroup.add(sprig);
    }

    // Complete 8 place settings on tabletop (woven placemats, porcelain plates, steel flatware, crystal goblets)
    const addPlaceSetting = (px, pz, rotY = 0) => {
      const placeG = new THREE.Group();
      placeG.position.set(px, tH, pz);
      placeG.rotation.y = rotY;

      const mat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.004, 0.3), this.materials.linenPlace);
      mat.position.set(0, 0.002, 0);
      placeG.add(mat);

      const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.105, 0.014, 16), this.materials.ceramicWhite);
      plate.position.set(0, 0.011, 0);
      plate.castShadow = true;
      placeG.add(plate);

      const napkin = new THREE.Mesh(
        createChamferedBoxGeo(0.085, 0.012, 0.16, 0.006),
        this.materials.linenNapkin
      );
      napkin.position.set(-0.155, 0.011, 0);
      placeG.add(napkin);

      const goblet = new THREE.Mesh(
        createLatheGeo([[0.032, 0], [0.005, 0.006], [0.005, 0.075], [0.042, 0.115], [0.038, 0.165]], 12),
        this.materials.clearGlass
      );
      goblet.position.set(0.14, 0, -0.11);
      placeG.add(goblet);

      const knife = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.005, 0.2), this.materials.brassMetal);
      knife.position.set(0.16, 0.006, 0);
      placeG.add(knife);

      setGroup.add(placeG);
    };
    const chairOffsetsX = [-0.85, 0.0, 0.85];
    for (const ox of chairOffsetsX) {
      addPlaceSetting(ox, tW * 0.5 - 0.2, 0);
      addPlaceSetting(ox, -tW * 0.5 + 0.2, Math.PI);
    }
    addPlaceSetting(-tL * 0.5 + 0.22, 0, -Math.PI / 2);
    addPlaceSetting(tL * 0.5 - 0.22, 0, Math.PI / 2);

    // 2. 8 Upholstered dining chairs: seat height 0.45m, back height 0.85m
    const seatH = 0.45;
    const backH = 0.85;
    const chairW = 0.48;
    const chairD = 0.48;

    // 3 chairs on south side (facing north -Z toward table => heading 0)
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
        heading: 0,
      });
    }

    // 3 chairs on north side (facing south +Z toward table => heading Math.PI)
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
        heading: Math.PI,
      });
    }

    // 1 chair at west head (facing east)
    const westHeadChair = this.createDiningChair(chairW, chairD, seatH, backH);
    westHeadChair.position.set(-tL * 0.5 - 0.25, 0, 0);
    westHeadChair.rotation.y = -Math.PI / 2;
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
    eastHeadChair.rotation.y = Math.PI / 2;
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

    // Sculpted round-edged cream bouclé seat cushion
    const seatMesh = new THREE.Mesh(
      createChamferedBoxGeo(w, 0.08, d * 0.94, 0.06),
      this.materials.chairUpholstery
    );
    seatMesh.position.set(0, seatH - 0.04, 0);
    seatMesh.castShadow = true;
    seatMesh.receiveShadow = true;
    chairGroup.add(seatMesh);

    // Curved Organic Modern wrap-around barrel backrest (arcs behind +Z, opens toward table -Z)
    const backrestH = backH - seatH;
    const backGeo = createCurvedChairBackGeo(w * 0.52, backrestH * 0.72, 0.072, Math.PI * 1.15);
    backGeo.rotateY(Math.PI);
    const backMesh = new THREE.Mesh(backGeo, this.materials.chairUpholstery);
    backMesh.position.set(0, seatH + backrestH * 0.24, 0.02);
    backMesh.castShadow = true;
    backMesh.receiveShadow = true;
    chairGroup.add(backMesh);

    // Exposed solid oak horseshoe rail cradle supporting the barrel back + tapered oak legs
    const railGeo = createCurvedChairBackGeo(w * 0.525, 0.042, 0.055, Math.PI * 1.16);
    railGeo.rotateY(Math.PI);
    const railMesh = new THREE.Mesh(railGeo, this.materials.tableWood);
    railMesh.position.set(0, seatH - 0.055, 0.02);
    railMesh.castShadow = true;
    chairGroup.add(railMesh);

    const legGeo = new THREE.CylinderGeometry(0.017, 0.012, seatH - 0.04, 10);
    const legOffsets = [
      [-w * 0.42, -d * 0.36],
      [w * 0.42, -d * 0.36],
      [-w * 0.42, d * 0.36],
      [w * 0.42, d * 0.36],
    ];
    for (const [lx, lz] of legOffsets) {
      const leg = new THREE.Mesh(legGeo, this.materials.tableWood);
      leg.position.set(lx, (seatH - 0.04) * 0.5, lz);
      leg.castShadow = true;
      chairGroup.add(leg);
    }

    return chairGroup;
  }

  buildSideboardCredenza(floorY) {
    const sbGroup = new THREE.Group();
    sbGroup.name = 'dining-sideboard';

    // Positioned cleanly against solid South-West wall pier (Z = 0.25, L = 1.44m -> Z in [-0.47, +0.97])
    // Leaves win-dining-west pleated linen curtains (Z in [1.18, 3.42]) 100% unobstructed
    const sbL = 1.44;
    const sbW = 0.5;
    const sbH = 0.85;
    const sbZ = 0.25;

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

    // 3D Vertical fluted walnut fascia panels across sideboard doors
    const sbFlutes = createFlutedPanel(
      sbL - 0.06,
      sbH - 0.2,
      0.022,
      24,
      this.materials.sideboardWood,
      this.materials.chairLegs
    );
    sbFlutes.position.set(0, 0.12 + (sbH - 0.14) * 0.5, sbW * 0.5 + 0.005);
    sbGroup.add(sbFlutes);
    sbGroup.add(createContactAoMesh(sbL + 0.12, sbW + 0.14, 0.26));

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
    for (const px of [-0.42, 0.0, 0.42]) {
      const pull = new THREE.Mesh(pullGeo, this.materials.brassMetal);
      pull.position.set(px, sbH * 0.65, sbW * 0.5 + 0.015);
      sbGroup.add(pull);
    }

    // Sculpted ceramic decanter with dried olive twigs & brass tray with stacked bowls
    const jugGroup = new THREE.Group();
    const jugMesh = new THREE.Mesh(
      createLatheGeo([[0.045, 0], [0.088, 0.09], [0.068, 0.19], [0.036, 0.25], [0.048, 0.27]], 14),
      this.materials.ceramicWhite
    );
    jugMesh.castShadow = true;
    jugGroup.add(jugMesh);
    for (let s = 0; s < 3; s++) {
      const ang = (s / 3) * Math.PI * 2 + 0.4;
      const twig = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0025, 0.004, 0.28, 6),
        this.materials.oliveSprig
      );
      twig.position.set(Math.cos(ang) * 0.035, 0.34, Math.sin(ang) * 0.035);
      twig.rotation.z = Math.cos(ang) * 0.28;
      twig.rotation.x = Math.sin(ang) * 0.28;
      jugGroup.add(twig);
    }
    jugGroup.position.set(-0.46, sbH, 0.02);
    sbGroup.add(jugGroup);

    const lowTray = new THREE.Mesh(
      createChamferedBoxGeo(0.36, 0.022, 0.24, 0.02),
      this.materials.brassMetal
    );
    lowTray.position.set(0.42, sbH + 0.011, 0.02);
    sbGroup.add(lowTray);

    sbGroup.position.set(-11.48, floorY, sbZ);
    sbGroup.rotation.y = Math.PI / 2;
    this.group.add(sbGroup);

    this.colliders.push({
      id: 'collider-dining-sideboard',
      min: new THREE.Vector3(-11.75, floorY, sbZ - sbL * 0.5),
      max: new THREE.Vector3(-11.2, floorY + sbH, sbZ + sbL * 0.5),
      type: 'furniture',
    });
  }

  buildChandelier(cx, floorY, cz) {
    const chanGroup = new THREE.Group();
    chanGroup.name = 'dining-chandelier';

    // Ceiling canopy + three slim brushed-brass suspension cables from Y = 3.7 down to Y = 2.45
    const canopy = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.028, 16), this.materials.brassMetal);
    canopy.position.set(0, 3.686, 0);
    chanGroup.add(canopy);

    const ringR = 0.46;
    const upAxis = new THREE.Vector3(0, 1, 0);
    const topPt = new THREE.Vector3(0, 3.68, 0);
    for (let i = 0; i < 3; i++) {
      const ang = (i / 3) * Math.PI * 2;
      const botPt = new THREE.Vector3(Math.cos(ang) * ringR, 2.45, Math.sin(ang) * ringR);
      const wireLen = topPt.distanceTo(botPt);
      const wire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.003, 0.003, wireLen, 6),
        this.materials.brassMetal
      );
      wire.position.copy(topPt).add(botPt).multiplyScalar(0.5);
      wire.quaternion.setFromUnitVectors(upAxis, botPt.clone().sub(topPt).normalize());
      chanGroup.add(wire);
    }

    // Minimalist brushed-brass circular halo pendant ring (0.92m diameter at Y = 2.45m)
    const ringGeo = new THREE.TorusGeometry(0.46, 0.018, 14, 48);
    ringGeo.rotateX(Math.PI / 2);
    const ring = new THREE.Mesh(ringGeo, this.materials.brassMetal);
    ring.position.set(0, 2.45, 0);
    chanGroup.add(ring);

    const haloLedGeo = new THREE.TorusGeometry(0.46, 0.01, 10, 48);
    haloLedGeo.rotateX(Math.PI / 2);
    const haloLed = new THREE.Mesh(haloLedGeo, this.materials.glassPendant);
    haloLed.position.set(0, 2.432, 0);
    chanGroup.add(haloLed);

    const chanLight = new THREE.PointLight(0xffe1b5, 1.15, 7.8, 1.45);
    chanLight.position.set(0, 2.38, 0);
    chanGroup.add(chanLight);

    this.interiorLights.push({
      light: chanLight,
      baseIntensity: 1.15,
      emissiveMat: this.materials.glassPendant,
      baseEmissive: 0.9,
    });

    chanGroup.position.set(cx, 0, cz);
    this.group.add(chanGroup);
  }

  buildWallArt(floorY) {
    // Paired curated prints on solid West piers North (Z = 3.98) and South (Z = 0.25)
    // Strictly clear of win-dining-west curtain finials (Z in [1.15, 3.45]) by >= 0.20 m
    const piers = [
      { name: 'dining-wall-art', z: 3.98, width: 0.58, height: 0.84, theme: 'abstract', fallback: '#B8755F' },
      { name: 'dining-wall-art-south', z: 0.25, width: 0.62, height: 0.84, theme: 'botanical', fallback: '#5F7762' },
    ];

    for (const p of piers) {
      const artMat = createSafeArtworkMaterial(p.theme, p.fallback, 0.72);
      const artGroup = createCuratedFramedArt({
        artMat,
        width: p.width,
        height: p.height,
        frameMat: this.materials.sideboardWood,
        matMat: this.materials.matCream,
        brassMat: this.materials.brassMetal,
        glassMat: this.materials.clearGlass,
        withPictureLight: true,
        lightIntensity: 0.42,
      });
      artGroup.name = p.name;
      artGroup.position.set(-11.74, floorY + 1.56, p.z);
      artGroup.rotation.y = Math.PI / 2;
      this.group.add(artGroup);

      if (artGroup.userData.pictureLight) {
        this.interiorLights.push(artGroup.userData.pictureLight);
      }
    }
  }
}

export function buildDiningHall(options = {}) {
  const builder = new DiningHallBuilder(options);
  return builder.build();
}
