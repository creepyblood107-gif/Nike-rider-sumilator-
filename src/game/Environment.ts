/**
 * Procedural Highway & Dynamic Environment System for Traffic Rider 3D.
 * Supports: Suburban Highway, Desert Canyon & Tunnel, City Night, and Winter Snow.
 * Complete Day-Sunset-Night Lighting System & Rain (Barish) Weather Simulation!
 */

import * as THREE from 'three';
import { EnvironmentType, TimeOfDay, WeatherType } from '../types';

export interface RoadChunk {
  group: THREE.Group;
  zStart: number;
  zEnd: number;
}

export interface EnvironmentSettings {
  skyColor: number;
  horizonColor: number;
  groundColor: number;
  fogColor: number;
  fogNear: number;
  fogFar: number;
  lightColor: number;
  lightIntensity: number;
  ambientColor: number;
  ambientIntensity: number;
  isNight: boolean;
}

export const TIME_OF_DAY_MODIFIERS: Record<TimeOfDay, {
  skyColorMult: number;
  lightColor: number;
  lightIntensity: number;
  ambientIntensity: number;
  fogColor: number;
  isNight: boolean;
}> = {
  day: {
    skyColorMult: 1.0,
    lightColor: 0xfff7ed,
    lightIntensity: 1.4,
    ambientIntensity: 0.65,
    fogColor: 0xc8e8ff,
    isNight: false,
  },
  sunset: {
    skyColorMult: 0.8,
    lightColor: 0xf97316,
    lightIntensity: 1.2,
    ambientIntensity: 0.55,
    fogColor: 0xfdba74,
    isNight: false,
  },
  night: {
    skyColorMult: 0.08,
    lightColor: 0x38bdf8,
    lightIntensity: 0.35,
    ambientIntensity: 0.25,
    fogColor: 0x070b14,
    isNight: true,
  },
};

export class HighwayManager {
  public chunks: RoadChunk[] = [];
  public chunkLength: number = 80;
  public totalChunks: number = 10;
  public roadWidth: number = 15;
  public scene: THREE.Scene;
  public envType: EnvironmentType;
  public timeOfDay: TimeOfDay;
  public weather: WeatherType;

  // Particle systems
  public snowParticles?: THREE.Points;
  public rainParticles?: THREE.LineSegments;

  // Materials
  private asphaltMat!: THREE.MeshStandardMaterial;
  private yellowLineMat!: THREE.MeshBasicMaterial;
  private whiteDashMat!: THREE.MeshBasicMaterial;
  private guardrailMat!: THREE.MeshStandardMaterial;
  private postMat!: THREE.MeshStandardMaterial;
  private trunkMat!: THREE.MeshStandardMaterial;
  private rockMat!: THREE.MeshStandardMaterial;
  private buildingMat!: THREE.MeshStandardMaterial;

  constructor(
    scene: THREE.Scene,
    envType: EnvironmentType = 'suburban',
    timeOfDay: TimeOfDay = 'day',
    weather: WeatherType = 'clear'
  ) {
    this.scene = scene;
    this.envType = envType;
    this.timeOfDay = timeOfDay;
    this.weather = weather;

    this.initMaterials();
    this.buildInitialHighway();

    if (envType === 'winter') {
      this.initSnowParticles();
    }
    if (weather === 'rain') {
      this.initRainParticles();
    }
  }

  private initMaterials() {
    const isWet = this.weather === 'rain';

    const asphaltCanvas = document.createElement('canvas');
    asphaltCanvas.width = 256;
    asphaltCanvas.height = 256;
    const aCtx = asphaltCanvas.getContext('2d')!;
    aCtx.fillStyle = isWet ? '#0f1115' : '#1c1e24';
    aCtx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 4000; i++) {
      const v = Math.random() * 25;
      aCtx.fillStyle = `rgb(${20 + v}, ${22 + v}, ${26 + v})`;
      aCtx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    }
    const asphaltTex = new THREE.CanvasTexture(asphaltCanvas);
    asphaltTex.wrapS = THREE.RepeatWrapping;
    asphaltTex.wrapT = THREE.RepeatWrapping;
    asphaltTex.repeat.set(1, 12);
    asphaltTex.colorSpace = THREE.SRGBColorSpace;

    this.asphaltMat = new THREE.MeshStandardMaterial({
      map: asphaltTex,
      roughness: isWet ? 0.2 : 0.8,
      metalness: isWet ? 0.5 : 0.1,
    });

    this.yellowLineMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    this.whiteDashMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
    this.guardrailMat = new THREE.MeshStandardMaterial({ color: 0xa8b2c1, metalness: 0.85, roughness: 0.3 });
    this.postMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6, metalness: 0.3 });
    this.trunkMat = new THREE.MeshStandardMaterial({ color: 0x452311, roughness: 0.9 });
    this.rockMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.85, metalness: 0.1 });
    this.buildingMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.5 });
  }

  public setWeather(weather: WeatherType) {
    this.weather = weather;
    const isWet = weather === 'rain';
    this.asphaltMat.roughness = isWet ? 0.18 : 0.8;
    this.asphaltMat.metalness = isWet ? 0.55 : 0.1;
    this.asphaltMat.needsUpdate = true;

    if (weather === 'rain') {
      if (!this.rainParticles) this.initRainParticles();
    } else {
      if (this.rainParticles) {
        this.scene.remove(this.rainParticles);
        this.rainParticles = undefined;
      }
    }
  }

  public setTimeOfDay(timeOfDay: TimeOfDay) {
    this.timeOfDay = timeOfDay;
  }

  private buildRoadChunk(zCenter: number): RoadChunk {
    const group = new THREE.Group();
    group.position.set(0, 0, zCenter);

    // 1. Asphalt Road Surface
    const roadGeo = new THREE.PlaneGeometry(this.roadWidth, this.chunkLength);
    roadGeo.rotateX(-Math.PI / 2);
    const roadMesh = new THREE.Mesh(roadGeo, this.asphaltMat);
    roadMesh.receiveShadow = true;
    group.add(roadMesh);

    // 2. Road Shoulders / Verges
    const sideWidth = 40;
    const sideGeo = new THREE.PlaneGeometry(sideWidth, this.chunkLength);
    sideGeo.rotateX(-Math.PI / 2);

    let groundHex = 0x2e6f40;
    if (this.envType === 'desert') groundHex = 0xb45309;
    if (this.envType === 'city') groundHex = 0x090d16;
    if (this.envType === 'winter') groundHex = 0xf1f5f9;

    const groundMat = new THREE.MeshStandardMaterial({ color: groundHex, roughness: 0.95 });

    const leftVerge = new THREE.Mesh(sideGeo, groundMat);
    leftVerge.position.set(-this.roadWidth / 2 - sideWidth / 2, -0.02, 0);
    group.add(leftVerge);

    const rightVerge = new THREE.Mesh(sideGeo, groundMat);
    rightVerge.position.set(this.roadWidth / 2 + sideWidth / 2, -0.02, 0);
    group.add(rightVerge);

    // 3. Lane Markings
    const yellowLineGeo = new THREE.PlaneGeometry(0.18, this.chunkLength);
    yellowLineGeo.rotateX(-Math.PI / 2);

    const yLine1 = new THREE.Mesh(yellowLineGeo, this.yellowLineMat);
    yLine1.position.set(-0.16, 0.02, 0);
    group.add(yLine1);

    const yLine2 = new THREE.Mesh(yellowLineGeo, this.yellowLineMat);
    yLine2.position.set(0.16, 0.02, 0);
    group.add(yLine2);

    const dashLength = 3.5;
    const dashGap = 5.0;
    const dashCount = Math.floor(this.chunkLength / (dashLength + dashGap));

    for (let i = 0; i < dashCount; i++) {
      const zOffset = -this.chunkLength / 2 + (i + 0.5) * (dashLength + dashGap);
      const dashGeo = new THREE.PlaneGeometry(0.16, dashLength);
      dashGeo.rotateX(-Math.PI / 2);

      const dashL = new THREE.Mesh(dashGeo, this.whiteDashMat);
      dashL.position.set(-3.7, 0.02, zOffset);
      group.add(dashL);

      const dashR = new THREE.Mesh(dashGeo, this.whiteDashMat);
      dashR.position.set(3.7, 0.02, zOffset);
      group.add(dashR);
    }

    const edgeLineGeo = new THREE.PlaneGeometry(0.2, this.chunkLength);
    edgeLineGeo.rotateX(-Math.PI / 2);
    const edgeLineL = new THREE.Mesh(edgeLineGeo, this.whiteDashMat);
    edgeLineL.position.set(-7.0, 0.02, 0);
    group.add(edgeLineL);

    const edgeLineR = new THREE.Mesh(edgeLineGeo, this.whiteDashMat);
    edgeLineR.position.set(7.0, 0.02, 0);
    group.add(edgeLineR);

    // 4. Highway Guardrails
    const railGeo = new THREE.BoxGeometry(0.15, 0.35, this.chunkLength);
    const guardrailL = new THREE.Mesh(railGeo, this.guardrailMat);
    guardrailL.position.set(-7.5, 0.45, 0);
    group.add(guardrailL);

    const guardrailR = new THREE.Mesh(railGeo, this.guardrailMat);
    guardrailR.position.set(7.5, 0.45, 0);
    group.add(guardrailR);

    // Guardrail posts
    const postGeo = new THREE.BoxGeometry(0.12, 0.7, 0.12);
    for (let p = -this.chunkLength / 2; p <= this.chunkLength / 2; p += 6) {
      const postL = new THREE.Mesh(postGeo, this.postMat);
      postL.position.set(-7.5, 0.35, p);
      group.add(postL);

      const postR = new THREE.Mesh(postGeo, this.postMat);
      postR.position.set(7.5, 0.35, p);
      group.add(postR);
    }

    // 5. Props
    this.decorateChunk(group);
    this.scene.add(group);

    return {
      group,
      zStart: zCenter - this.chunkLength / 2,
      zEnd: zCenter + this.chunkLength / 2,
    };
  }

  private decorateChunk(group: THREE.Group) {
    if (this.envType === 'suburban' || this.envType === 'winter') {
      for (let t = -this.chunkLength / 2 + 5; t < this.chunkLength / 2; t += 14) {
        const sideL = this.createTree(this.envType === 'winter');
        sideL.position.set(-11 - Math.random() * 12, 0, t + (Math.random() - 0.5) * 4);
        group.add(sideL);

        const sideR = this.createTree(this.envType === 'winter');
        sideR.position.set(11 + Math.random() * 12, 0, t + (Math.random() - 0.5) * 4);
        group.add(sideR);
      }
    } else if (this.envType === 'desert') {
      for (let r = -this.chunkLength / 2 + 8; r < this.chunkLength / 2; r += 20) {
        const cliffL = this.createCanyonRock();
        cliffL.position.set(-14 - Math.random() * 5, 0, r);
        group.add(cliffL);

        const cliffR = this.createCanyonRock();
        cliffR.position.set(14 + Math.random() * 5, 0, r);
        group.add(cliffR);
      }
    } else if (this.envType === 'city') {
      for (let l = -this.chunkLength / 2 + 10; l < this.chunkLength / 2; l += 25) {
        const lampL = this.createStreetLamp(false);
        lampL.position.set(-8.2, 0, l);
        group.add(lampL);

        const lampR = this.createStreetLamp(true);
        lampR.position.set(8.2, 0, l);
        group.add(lampR);

        const bL = this.createCityBuilding();
        bL.position.set(-22 - Math.random() * 10, 0, l);
        group.add(bL);

        const bR = this.createCityBuilding();
        bR.position.set(22 + Math.random() * 10, 0, l);
        group.add(bR);
      }
    }
  }

  private createTree(isWinter: boolean): THREE.Group {
    const tree = new THREE.Group();
    // Realistic bark trunk
    const trunkHeight = 4.2 + Math.random() * 1.5;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.42, trunkHeight, 10), this.trunkMat);
    trunk.position.y = trunkHeight / 2;
    tree.add(trunk);

    const isPine = Math.random() > 0.35;
    if (isPine) {
      // Natural layered evergreen pine (matching Traffic Rider reference)
      const pineColors = isWinter
        ? [0xe2e8f0, 0xcbd5e1, 0x94a3b8]
        : [0x14351d, 0x194524, 0x112f19, 0x22552f];

      const tiers = 5;
      for (let t = 0; t < tiers; t++) {
        const tierY = 2.4 + t * 1.35;
        const radius = (tiers - t) * 0.58 + 0.5;
        const color = pineColors[t % pineColors.length];
        const foliageMat = new THREE.MeshStandardMaterial({
          color,
          roughness: 0.88,
          flatShading: true,
        });

        // Multi-faceted organic foliage layer
        const layer = new THREE.Mesh(new THREE.ConeGeometry(radius, 2.2, 7), foliageMat);
        layer.position.y = tierY;
        layer.rotation.y = (t * Math.PI) / 3.5;
        tree.add(layer);
      }
    } else {
      // Lush deciduous roadside tree
      const leafColors = isWinter ? [0xe2e8f0, 0x94a3b8] : [0x2e6f40, 0x245833, 0x3b854e];
      const canopyCenter = trunkHeight * 0.85;

      for (let c = 0; c < 5; c++) {
        const color = leafColors[c % leafColors.length];
        const leafMat = new THREE.MeshStandardMaterial({ color, roughness: 0.85, flatShading: true });
        const cluster = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4 + Math.random() * 0.5, 1), leafMat);
        const ang = (c * Math.PI * 2) / 5;
        const dist = 0.6 + Math.random() * 0.4;
        cluster.position.set(Math.cos(ang) * dist, canopyCenter + Math.sin(c) * 0.5, Math.sin(ang) * dist);
        tree.add(cluster);
      }
    }

    const scale = 0.9 + Math.random() * 0.35;
    tree.scale.set(scale, scale, scale);
    return tree;
  }

  private createCanyonRock(): THREE.Group {
    const rock = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(5.0 + Math.random() * 3.0, 1), this.rockMat);
    mesh.scale.set(1.2, 2.5, 1.4);
    mesh.position.y = 5.0;
    rock.add(mesh);
    return rock;
  }

  private createStreetLamp(isRight: boolean): THREE.Group {
    const lamp = new THREE.Group();
    const sign = isRight ? -1 : 1;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 8.5, 12), this.postMat);
    pole.position.y = 4.25;
    lamp.add(pole);

    const arm = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.12, 0.12), this.postMat);
    arm.position.set(sign * 1.25, 8.4, 0);
    lamp.add(arm);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.4), this.postMat);
    head.position.set(sign * 2.4, 8.3, 0);
    lamp.add(head);

    const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.05, 0.3), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
    bulb.position.set(sign * 2.4, 8.18, 0);
    lamp.add(bulb);

    return lamp;
  }

  private createCityBuilding(): THREE.Group {
    const building = new THREE.Group();
    const bHeight = 25 + Math.random() * 40;
    const bWidth = 14 + Math.random() * 8;
    const bDepth = 14 + Math.random() * 8;

    const bMesh = new THREE.Mesh(new THREE.BoxGeometry(bWidth, bHeight, bDepth), this.buildingMat);
    bMesh.position.y = bHeight / 2;
    building.add(bMesh);
    return building;
  }

  // --- RAIN WEATHER PARTICLE SYSTEM (BARISH) ---
  private initRainParticles() {
    const streakCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(streakCount * 6); // 2 points per streak

    for (let i = 0; i < streakCount * 6; i += 6) {
      const rx = (Math.random() - 0.5) * 50;
      const ry = Math.random() * 25;
      const rz = (Math.random() - 0.5) * 120;

      positions[i] = rx;
      positions[i + 1] = ry;
      positions[i + 2] = rz;

      // Subtle atmospheric rain slant
      positions[i + 3] = rx - 0.15;
      positions[i + 4] = ry - 0.9;
      positions[i + 5] = rz - 0.4;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const rainMat = new THREE.LineBasicMaterial({
      color: 0xcfd8dc,
      transparent: true,
      opacity: 0.28,
    });

    this.rainParticles = new THREE.LineSegments(geometry, rainMat);
    this.scene.add(this.rainParticles);
  }

  public updateRain(playerZ: number, delta: number, speedMs: number = 0) {
    if (!this.rainParticles) return;
    const pos = this.rainParticles.geometry.attributes.position as THREE.BufferAttribute;
    const array = pos.array as Float32Array;

    for (let i = 0; i < array.length; i += 6) {
      array[i + 1] -= delta * 55; // Fast rain falling
      array[i + 4] -= delta * 55;

      // Wrap around ground
      if (array[i + 1] < 0) {
        array[i + 1] = 22;
        array[i + 4] = 22 - 1.2;
      }

      // Center around player
      if (array[i + 2] < playerZ - 30) {
        array[i + 2] += 120;
        array[i + 5] += 120;
      } else if (array[i + 2] > playerZ + 90) {
        array[i + 2] -= 120;
        array[i + 5] -= 120;
      }
    }
    pos.needsUpdate = true;
  }

  // --- SNOW PARTICLES ---
  private initSnowParticles() {
    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 80;
      positions[i + 1] = Math.random() * 25;
      positions[i + 2] = (Math.random() - 0.5) * 160;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.25, transparent: true, opacity: 0.8 });
    this.snowParticles = new THREE.Points(geometry, pMat);
    this.scene.add(this.snowParticles);
  }

  public updateSnow(playerZ: number, delta: number) {
    if (!this.snowParticles) return;
    const pos = this.snowParticles.geometry.attributes.position as THREE.BufferAttribute;
    const array = pos.array as Float32Array;

    for (let i = 0; i < array.length; i += 3) {
      array[i + 1] -= delta * 6;
      if (array[i + 1] < 0) array[i + 1] = 22;
      if (array[i + 2] < playerZ - 60) array[i + 2] += 160;
      else if (array[i + 2] > playerZ + 100) array[i + 2] -= 160;
    }
    pos.needsUpdate = true;
  }

  private buildInitialHighway() {
    const startZ = -this.chunkLength * 2;
    for (let i = 0; i < this.totalChunks; i++) {
      const z = startZ + i * this.chunkLength;
      this.chunks.push(this.buildRoadChunk(z));
    }
  }

  public update(playerZ: number) {
    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i];
      if (chunk.zEnd < playerZ - this.chunkLength * 1.5) {
        let maxZ = -Infinity;
        for (const c of this.chunks) {
          if (c.zEnd > maxZ) maxZ = c.zEnd;
        }
        const newCenter = maxZ + this.chunkLength / 2;
        chunk.group.position.z = newCenter;
        chunk.zStart = maxZ;
        chunk.zEnd = maxZ + this.chunkLength;
      }
    }
  }

  public dispose() {
    for (const chunk of this.chunks) {
      this.scene.remove(chunk.group);
    }
    this.chunks = [];
    if (this.snowParticles) this.scene.remove(this.snowParticles);
    if (this.rainParticles) this.scene.remove(this.rainParticles);
  }
}
