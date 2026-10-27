/**
 * Procedural Traffic Vehicles for Traffic Rider 3D.
 * Models: Sedan, SUV, Delivery Van, Box Truck, 18-Wheeler Semi-Truck.
 * Complete with headlights, glowing taillights, rolling wheels, and collision bounds.
 */

import * as THREE from 'three';

export type TrafficVehicleType = 'sedan' | 'suv' | 'van' | 'box-truck' | 'semi-truck';

export interface TrafficCarInstance {
  group: THREE.Group;
  type: TrafficVehicleType;
  lane: number; // -1.5, -0.5, 0.5, 1.5 or lane index
  targetX: number;
  z: number;
  speed: number; // relative/absolute speed m/s
  isOncoming: boolean;
  length: number;
  width: number;
  height: number;
  wheels: THREE.Mesh[];
  leftBlinker?: THREE.Mesh;
  rightBlinker?: THREE.Mesh;
  blinkingTimer: number;
  isChangingLane: boolean;
  laneChangeTargetX: number;
  active: boolean;
  passedPlayer: boolean;
  closeCallRewarded: boolean;
}

const CAR_COLORS = [
  '#dc2626', // Red
  '#f8fafc', // White
  '#0284c7', // Blue
  '#f59e0b', // Amber/Yellow
  '#475569', // Slate Gray
  '#15803d', // British Green
  '#0f172a', // Midnight Black
  '#9333ea', // Purple
];

export function buildTrafficVehicle(type: TrafficVehicleType, colorHex?: string): {
  group: THREE.Group;
  wheels: THREE.Mesh[];
  width: number;
  length: number;
  height: number;
  leftBlinker: THREE.Mesh;
  rightBlinker: THREE.Mesh;
} {
  const group = new THREE.Group();
  const wheels: THREE.Mesh[] = [];

  const hex = colorHex || CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)];
  const bodyMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(hex),
    metalness: 0.8,
    roughness: 0.3,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0f172a,
    metalness: 0.1,
    roughness: 0.1,
    transmission: 0.5,
    transparent: true,
  });

  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x181a20,
    roughness: 0.9,
    metalness: 0.1,
  });

  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    metalness: 0.9,
    roughness: 0.2,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.95,
    roughness: 0.1,
  });

  const headLightMat = new THREE.MeshBasicMaterial({
    color: 0xfffbeb,
  });

  const tailLightMat = new THREE.MeshBasicMaterial({
    color: 0xef4444,
  });

  const blinkerMat = new THREE.MeshBasicMaterial({
    color: 0xf59e0b,
  });

  function addWheel(x: number, y: number, z: number, r: number = 0.34, w: number = 0.22) {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(x, y, z);

    const tireGeo = new THREE.CylinderGeometry(r, r, w, 16);
    tireGeo.rotateZ(Math.PI / 2);
    const tire = new THREE.Mesh(tireGeo, tireMat);
    wheelGroup.add(tire);

    const rimGeo = new THREE.CylinderGeometry(r * 0.65, r * 0.65, w * 1.05, 12);
    rimGeo.rotateZ(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    wheelGroup.add(rim);

    group.add(wheelGroup);
    wheels.push(tire);
  }

  let width = 2.0;
  let length = 4.4;
  let height = 1.45;

  // Tail blinkers for lane change telegraphing
  const leftBlinkerGeo = new THREE.BoxGeometry(0.12, 0.08, 0.04);
  const leftBlinker = new THREE.Mesh(leftBlinkerGeo, blinkerMat);
  leftBlinker.visible = false;

  const rightBlinkerGeo = new THREE.BoxGeometry(0.12, 0.08, 0.04);
  const rightBlinker = new THREE.Mesh(rightBlinkerGeo, blinkerMat);
  rightBlinker.visible = false;

  if (type === 'sedan') {
    width = 1.95;
    length = 4.5;
    height = 1.4;

    // Lower body / chassis
    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(width, 0.55, length), bodyMat);
    lowerBody.position.set(0, 0.5, 0);
    group.add(lowerBody);

    // Cabin / Greenhouse
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(width * 0.88, 0.48, length * 0.5), glassMat);
    cabin.position.set(0, 0.95, -0.2);
    group.add(cabin);

    // Roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(width * 0.86, 0.06, length * 0.48), bodyMat);
    roof.position.set(0, 1.2, -0.2);
    group.add(roof);

    // Headlights (Front is +Z)
    const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, 0.06), headLightMat);
    hlL.position.set(-width * 0.38, 0.55, length * 0.5);
    group.add(hlL);
    const hlR = hlL.clone();
    hlR.position.x = width * 0.38;
    group.add(hlR);

    // Taillights (Rear is -Z)
    const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.06), tailLightMat);
    tlL.position.set(-width * 0.38, 0.58, -length * 0.5);
    group.add(tlL);
    const tlR = tlL.clone();
    tlR.position.x = width * 0.38;
    group.add(tlR);

    // Blinkers
    leftBlinker.position.set(-width * 0.45, 0.58, -length * 0.5);
    rightBlinker.position.set(width * 0.45, 0.58, -length * 0.5);
    group.add(leftBlinker);
    group.add(rightBlinker);

    // Wheels
    addWheel(-width * 0.48, 0.32, 1.35);
    addWheel(width * 0.48, 0.32, 1.35);
    addWheel(-width * 0.48, 0.32, -1.35);
    addWheel(width * 0.48, 0.32, -1.35);

  } else if (type === 'suv') {
    width = 2.1;
    length = 4.8;
    height = 1.75;

    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(width, 0.7, length), bodyMat);
    lowerBody.position.set(0, 0.65, 0);
    group.add(lowerBody);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(width * 0.9, 0.65, length * 0.65), glassMat);
    cabin.position.set(0, 1.25, -0.3);
    group.add(cabin);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(width * 0.88, 0.08, length * 0.64), bodyMat);
    roof.position.set(0, 1.58, -0.3);
    group.add(roof);

    // Roof rack rails
    const railL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, length * 0.55), chromeMat);
    railL.position.set(-width * 0.4, 1.64, -0.3);
    group.add(railL);
    const railR = railL.clone();
    railR.position.x = width * 0.4;
    group.add(railR);

    // Headlights
    const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.06), headLightMat);
    hlL.position.set(-width * 0.38, 0.75, length * 0.5);
    group.add(hlL);
    const hlR = hlL.clone();
    hlR.position.x = width * 0.38;
    group.add(hlR);

    // Taillights
    const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.06), tailLightMat);
    tlL.position.set(-width * 0.42, 1.1, -length * 0.5);
    group.add(tlL);
    const tlR = tlL.clone();
    tlR.position.x = width * 0.42;
    group.add(tlR);

    leftBlinker.position.set(-width * 0.45, 0.8, -length * 0.5);
    rightBlinker.position.set(width * 0.45, 0.8, -length * 0.5);
    group.add(leftBlinker);
    group.add(rightBlinker);

    // Wheels (larger SUV tires)
    addWheel(-width * 0.48, 0.4, 1.45, 0.38, 0.24);
    addWheel(width * 0.48, 0.4, 1.45, 0.38, 0.24);
    addWheel(-width * 0.48, 0.4, -1.45, 0.38, 0.24);
    addWheel(width * 0.48, 0.4, -1.45, 0.38, 0.24);

  } else if (type === 'van') {
    // Delivery van (e.g. white van in screenshot 1)
    width = 2.15;
    length = 5.2;
    height = 2.2;

    const vanMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9, // Classic delivery white
      roughness: 0.4,
      metalness: 0.3,
    });

    const body = new THREE.Mesh(new THREE.BoxGeometry(width, 1.6, length), vanMat);
    body.position.set(0, 1.1, 0);
    group.add(body);

    // Front windshield angle
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(width * 0.92, 0.6, 0.08), glassMat);
    windshield.position.set(0, 1.3, length * 0.5);
    windshield.rotation.x = -0.25;
    group.add(windshield);

    // Headlights
    const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.06), headLightMat);
    hlL.position.set(-width * 0.38, 0.8, length * 0.5);
    group.add(hlL);
    const hlR = hlL.clone();
    hlR.position.x = width * 0.38;
    group.add(hlR);

    // Taillights
    const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 0.06), tailLightMat);
    tlL.position.set(-width * 0.44, 1.1, -length * 0.5);
    group.add(tlL);
    const tlR = tlL.clone();
    tlR.position.x = width * 0.44;
    group.add(tlR);

    leftBlinker.position.set(-width * 0.46, 0.7, -length * 0.5);
    rightBlinker.position.set(width * 0.46, 0.7, -length * 0.5);
    group.add(leftBlinker);
    group.add(rightBlinker);

    addWheel(-width * 0.48, 0.38, 1.6, 0.36, 0.22);
    addWheel(width * 0.48, 0.38, 1.6, 0.36, 0.22);
    addWheel(-width * 0.48, 0.38, -1.6, 0.36, 0.22);
    addWheel(width * 0.48, 0.38, -1.6, 0.36, 0.22);

  } else if (type === 'box-truck') {
    // Commercial medium box delivery truck
    width = 2.4;
    length = 6.8;
    height = 2.9;

    // Cab
    const cab = new THREE.Mesh(new THREE.BoxGeometry(width * 0.92, 1.5, 1.8), bodyMat);
    cab.position.set(0, 1.25, 2.2);
    group.add(cab);

    // Cab windshield
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(width * 0.86, 0.65, 0.06), glassMat);
    windshield.position.set(0, 1.55, 3.1);
    group.add(windshield);

    // Cargo Box (corrugated aluminum)
    const cargoMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.5,
      metalness: 0.6,
    });
    const cargoBox = new THREE.Mesh(new THREE.BoxGeometry(width, 2.2, 4.6), cargoMat);
    cargoBox.position.set(0, 1.65, -0.9);
    group.add(cargoBox);

    // Headlights
    const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.06), headLightMat);
    hlL.position.set(-width * 0.36, 0.9, 3.1);
    group.add(hlL);
    const hlR = hlL.clone();
    hlR.position.x = width * 0.36;
    group.add(hlR);

    // Taillights
    const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 0.06), tailLightMat);
    tlL.position.set(-width * 0.4, 0.65, -3.2);
    group.add(tlL);
    const tlR = tlL.clone();
    tlR.position.x = width * 0.4;
    group.add(tlR);

    leftBlinker.position.set(-width * 0.46, 0.65, -3.2);
    rightBlinker.position.set(width * 0.46, 0.65, -3.2);
    group.add(leftBlinker);
    group.add(rightBlinker);

    addWheel(-width * 0.46, 0.45, 2.3, 0.42, 0.26);
    addWheel(width * 0.46, 0.45, 2.3, 0.42, 0.26);
    addWheel(-width * 0.46, 0.45, -1.4, 0.42, 0.26);
    addWheel(width * 0.46, 0.45, -1.4, 0.42, 0.26);
    addWheel(-width * 0.46, 0.45, -2.4, 0.42, 0.26);
    addWheel(width * 0.46, 0.45, -2.4, 0.42, 0.26);

  } else {
    // 18-Wheeler Semi-Truck with shipping container
    width = 2.6;
    length = 11.5;
    height = 3.6;

    // Semi Tractor Cab
    const cabMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Vibrant blue semi
      metalness: 0.8,
      roughness: 0.3,
    });
    const cab = new THREE.Mesh(new THREE.BoxGeometry(width * 0.9, 2.1, 2.8), cabMat);
    cab.position.set(0, 1.6, 4.2);
    group.add(cab);

    // Chrome vertical exhaust smokestacks
    const stackL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.8, 12), chromeMat);
    stackL.position.set(-width * 0.48, 2.6, 3.2);
    group.add(stackL);
    const stackR = stackL.clone();
    stackR.position.x = width * 0.48;
    group.add(stackR);

    // Chrome front grill
    const grill = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 0.08), chromeMat);
    grill.position.set(0, 1.1, 5.6);
    group.add(grill);

    // Shipping Container
    const containerMat = new THREE.MeshStandardMaterial({
      color: 0xb91c1c, // Crimson shipping container
      roughness: 0.6,
      metalness: 0.4,
    });
    const container = new THREE.Mesh(new THREE.BoxGeometry(width, 2.6, 8.2), containerMat);
    container.position.set(0, 2.1, -1.4);
    group.add(container);

    // Headlights
    const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.22, 0.06), headLightMat);
    hlL.position.set(-width * 0.38, 0.95, 5.6);
    group.add(hlL);
    const hlR = hlL.clone();
    hlR.position.x = width * 0.38;
    group.add(hlR);

    // Taillights on rear bumper
    const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.06), tailLightMat);
    tlL.position.set(-width * 0.4, 0.75, -5.5);
    group.add(tlL);
    const tlR = tlL.clone();
    tlR.position.x = width * 0.4;
    group.add(tlR);

    leftBlinker.position.set(-width * 0.46, 0.75, -5.5);
    rightBlinker.position.set(width * 0.46, 0.75, -5.5);
    group.add(leftBlinker);
    group.add(rightBlinker);

    // Dual wheels across axles
    addWheel(-width * 0.46, 0.5, 4.4, 0.46, 0.28);
    addWheel(width * 0.46, 0.5, 4.4, 0.46, 0.28);
    addWheel(-width * 0.46, 0.5, 2.6, 0.46, 0.28);
    addWheel(width * 0.46, 0.5, 2.6, 0.46, 0.28);

    // Trailer rear tandem axles
    addWheel(-width * 0.46, 0.5, -4.0, 0.46, 0.28);
    addWheel(width * 0.46, 0.5, -4.0, 0.46, 0.28);
    addWheel(-width * 0.46, 0.5, -5.1, 0.46, 0.28);
    addWheel(width * 0.46, 0.5, -5.1, 0.46, 0.28);
  }

  // Soft contact shadow
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const sCtx = shadowCanvas.getContext('2d')!;
  const sGrad = sCtx.createRadialGradient(64, 64, 10, 64, 64, 64);
  sGrad.addColorStop(0, 'rgba(0,0,0,0.7)');
  sGrad.addColorStop(0.7, 'rgba(0,0,0,0.3)');
  sGrad.addColorStop(1, 'rgba(0,0,0,0)');
  sCtx.fillStyle = sGrad;
  sCtx.fillRect(0, 0, 128, 128);

  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.65,
  });
  const shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(width * 1.2, length * 1.05), shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.02;
  group.add(shadowMesh);

  return {
    group,
    wheels,
    width,
    length,
    height,
    leftBlinker,
    rightBlinker,
  };
}
