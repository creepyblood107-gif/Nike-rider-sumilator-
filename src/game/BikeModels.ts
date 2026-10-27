/**
 * Procedural 3D Motorbike Models for Traffic Rider 3D.
 * True-to-life First-Person Motorcycle Cockpit View inspired by Traffic Rider screenshots:
 * - Sweeping chrome / sport handlebars spanning across the lower viewport
 * - Thick, realistic rider hands with black leather gauntlet gloves gripping the rubber throttles
 * - Dual chrome rearview wing mirrors reflecting highway & sky
 * - Authentic motorcycle instrument consoles (Harley analog round dial, Ninja digital TFT, Hayabusa 3-dial, Vespa retro)
 * - Front chrome headlight nacelle & fork caps
 * - Integrated dedicated cockpit lighting so the cockpit is ALWAYS glossy, 3D, and crystal-clear!
 */

import * as THREE from 'three';
import { BikeId } from '../types';

/**
 * Creates authentic procedural canvas textures for the motorcycle dashboards.
 */
export function createSpeedometerTexture(
  bikeId: BikeId,
  speedKmh: number = 0,
  rpmRatio: number = 0,
  gear: number = 1
): THREE.CanvasTexture {
  const isCircleGauge = bikeId === 'cruiser' || bikeId === 'scooter';
  const width = isCircleGauge ? 512 : 512;
  const height = isCircleGauge ? 512 : 256;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const speedInt = Math.max(0, Math.round(speedKmh));

  if (bikeId === 'cruiser') {
    // --- CLASSIC ROUND CHROME ANALOG GAUGE (Harley Iron 883 / Bobber as in Image 2) ---
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, 512, 512);

    const cx = 256, cy = 256, radius = 220;

    // Chrome outer bezel
    const chromeGrad = ctx.createLinearGradient(0, 0, 512, 512);
    chromeGrad.addColorStop(0, '#f8fafc');
    chromeGrad.addColorStop(0.3, '#94a3b8');
    chromeGrad.addColorStop(0.7, '#e2e8f0');
    chromeGrad.addColorStop(1, '#64748b');
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 16, 0, Math.PI * 2);
    ctx.fillStyle = chromeGrad;
    ctx.fill();

    // Dark inner bezel rim
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();

    // Dial face (deep satin black)
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 6, 0, Math.PI * 2);
    ctx.fillStyle = '#090d16';
    ctx.fill();

    // Speed markings around circle (0 to 200 km/h)
    const startAngle = Math.PI * 0.75;
    const endAngle = Math.PI * 2.25;

    ctx.strokeStyle = '#f8fafc';
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 22px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let s = 0; s <= 200; s += 10) {
      const angle = startAngle + (s / 200) * (endAngle - startAngle);
      const isMajor = s % 20 === 0;
      const x1 = cx + Math.cos(angle) * (radius - 12);
      const y1 = cy + Math.sin(angle) * (radius - 12);
      const x2 = cx + Math.cos(angle) * (radius - (isMajor ? 36 : 22));
      const y2 = cy + Math.sin(angle) * (radius - (isMajor ? 36 : 22));

      ctx.lineWidth = isMajor ? 5 : 2.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      if (isMajor) {
        const tx = cx + Math.cos(angle) * (radius - 60);
        const ty = cy + Math.sin(angle) * (radius - 60);
        ctx.fillText(`${s}`, tx, ty);
      }
    }

    // Harley / American V-Twin logo mark
    ctx.fillStyle = '#f59e0b';
    ctx.font = '900 18px sans-serif';
    ctx.fillText('IRON 883', cx, cy - 80);

    // Digital Odometer & Gear display in bottom half
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.roundRect(cx - 75, cy + 55, 150, 48, 10);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 26px ui-monospace, monospace';
    ctx.fillText(`${speedInt} KM/H`, cx, cy + 80);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`GEAR ${gear}`, cx, cy + 125);

    // Center needle pin hub
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fillStyle = '#475569';
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Glowing Red Speedometer Needle
    const needleAngle = startAngle + Math.min(1, speedKmh / 200) * (endAngle - startAngle);
    ctx.save();
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(needleAngle) * (radius - 30), cy + Math.sin(needleAngle) * (radius - 30));
    ctx.stroke();
    ctx.restore();

  } else if (bikeId === 'superbike') {
    // --- ICONIC 3-GAUGE COCKPIT (Suzuki Hayabusa 1300 Falcon) ---
    ctx.fillStyle = '#080b11';
    ctx.fillRect(0, 0, 512, 256);

    // Center Tachometer
    const tcx = 256, tcy = 120, trad = 85;
    ctx.beginPath();
    ctx.arc(tcx, tcy, trad + 6, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(tcx, tcy, trad, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0d14';
    ctx.fill();

    // Speed on Left
    const lcx = 100, lcy = 140, lrad = 70;
    ctx.beginPath();
    ctx.arc(lcx, lcy, lrad, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 36px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${speedInt}`, lcx, lcy + 6);
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('KM / H', lcx, lcy + 30);

    // Gear & RPM on Center
    const needleAngle = Math.PI * 0.8 + rpmRatio * (Math.PI * 1.4);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(tcx, tcy);
    ctx.lineTo(tcx + Math.cos(needleAngle) * (trad - 12), tcy + Math.sin(needleAngle) * (trad - 12));
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px monospace';
    ctx.fillText(`G${gear}`, tcx, tcy + 45);

    // Temp & Fuel on Right
    const rcx = 412, rcy = 140, rrad = 70;
    ctx.beginPath();
    ctx.arc(rcx, rcy, rrad, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('HAYABUSA', rcx, rcy - 12);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('1300R', rcx, rcy + 18);

  } else if (bikeId === 'scooter') {
    // --- RETRO VESPA CLAMSHELL SPEEDOMETER ---
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 512, 512);

    const cx = 256, cy = 256, radius = 220;
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 10, 0, Math.PI * 2);
    ctx.fillStyle = '#e2e8f0';
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 10;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, radius - 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.font = '900 24px serif';
    ctx.textAlign = 'center';
    ctx.fillText('Vespa 150', cx, cy - 70);

    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 48px monospace';
    ctx.fillText(`${speedInt}`, cx, cy + 40);
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('KM/H', cx, cy + 75);

  } else {
    // --- RACING DIGITAL TFT CONSOLE (Ninja ZX-400R) ---
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, 512, 256);

    // Carbon fiber console texture
    ctx.fillStyle = '#121622';
    for (let y = 0; y < 256; y += 8) {
      for (let x = (y % 16 === 0 ? 0 : 8); x < 512; x += 16) {
        ctx.fillRect(x, y, 8, 8);
      }
    }

    // Top Tachometer Bar
    const barWidth = 472;
    const barHeight = 22;
    const barX = 20;
    const barY = 25;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const fillW = Math.max(0, Math.min(barWidth, barWidth * rpmRatio));
    const rpmGrad = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
    rpmGrad.addColorStop(0, '#10b981');
    rpmGrad.addColorStop(0.65, '#f59e0b');
    rpmGrad.addColorStop(0.85, '#ef4444');
    rpmGrad.addColorStop(1, '#dc2626');
    ctx.fillStyle = rpmGrad;
    ctx.fillRect(barX, barY, fillW, barHeight);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 105px Impact, "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${speedInt}`, 256, 175);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px ui-sans-serif, sans-serif';
    ctx.fillText('KM / H', 256, 210);

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(30, 85, 80, 115, 12);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px ui-monospace, monospace';
    ctx.fillText(`${gear}`, 70, 175);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates realistic procedural side mirror reflections.
 */
export function createMirrorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;

  // Mirror border / glass gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 160);
  skyGrad.addColorStop(0, '#38bdf8');
  skyGrad.addColorStop(0.48, '#bae6fd');
  skyGrad.addColorStop(0.5, '#475569');
  skyGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, 256, 160);

  // Highway perspective vanishing road in mirror
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(90, 80);
  ctx.lineTo(166, 80);
  ctx.lineTo(240, 160);
  ctx.lineTo(16, 160);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 3.5;
  ctx.setLineDash([12, 10]);
  ctx.beginPath();
  ctx.moveTo(128, 80);
  ctx.lineTo(128, 160);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Builds the Authentic 1st-Person Motorcycle Cockpit View matching Traffic Rider Image 2.
 * Includes:
 * - Sweeping chrome ape-hanger / sport handlebars across the lower screen
 * - Realistic biker hands wearing textured black leather gloves firmly holding the grips
 * - Dual chrome rearview wing mirrors angled toward the camera
 * - Centered illuminated speedometer console
 * - Dedicated cockpit light attached directly to the camera for rich gloss & depth!
 */
export function buildCockpitModel(bikeId: BikeId, paintHex: string = '#22c55e'): {
  cockpitGroup: THREE.Group;
  handlebarGroup: THREE.Group;
  leftBrakeLever: THREE.Mesh;
  rightBrakeLever: THREE.Mesh;
  speedometerMesh: THREE.Mesh;
  speedoMaterial: THREE.MeshBasicMaterial;
  leftHand: THREE.Group;
  rightHand: THREE.Group;
  updateCockpitDials: (speed: number, rpm: number, gear: number) => void;
  updateVibration: (time: number, speed: number) => void;
} {
  const cockpitGroup = new THREE.Group();
  cockpitGroup.name = 'RealisticTrafficRiderCockpit';

  // Dedicated warm cockpit fill light so chrome & leather gloves are always illuminated!
  const cockpitLight = new THREE.PointLight(0xfff1e6, 2.4, 3.5);
  cockpitLight.position.set(0, 0.25, -0.2);
  cockpitGroup.add(cockpitLight);

  // Handlebar assembly positioned in sweet spot right in front of rider's eyes
  const handlebarGroup = new THREE.Group();
  handlebarGroup.position.set(0, -0.22, -0.46);
  cockpitGroup.add(handlebarGroup);

  // High quality PBR materials
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    metalness: 0.95,
    roughness: 0.1,
  });

  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    metalness: 0.7,
    roughness: 0.35,
  });

  const gripRubberMat = new THREE.MeshStandardMaterial({
    color: 0x111317,
    roughness: 0.9,
    metalness: 0.05,
  });

  const gloveLeatherMat = new THREE.MeshStandardMaterial({
    color: 0x1c1e24,
    roughness: 0.7,
    metalness: 0.2,
  });

  const knuckleArmorMat = new THREE.MeshStandardMaterial({
    color: 0x090a0d,
    roughness: 0.3,
    metalness: 0.8,
  });

  const isCruiser = bikeId === 'cruiser';

  // 1. Triple-Tree Steering Clamp & Front Headlight Top Dome
  const yoke = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.045, 0.1), isCruiser ? chromeMat : blackMat);
  yoke.position.set(0, -0.06, 0);
  handlebarGroup.add(yoke);

  // Chrome risers (two vertical posts holding the handlebar clamp)
  const riserL = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.09, 16), chromeMat);
  riserL.position.set(-0.09, -0.01, 0);
  handlebarGroup.add(riserL);

  const riserR = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.09, 16), chromeMat);
  riserR.position.set(0.09, -0.01, 0);
  handlebarGroup.add(riserR);

  // Chrome fork caps
  const forkCapL = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.03, 16), chromeMat);
  forkCapL.position.set(-0.16, -0.04, -0.02);
  handlebarGroup.add(forkCapL);

  const forkCapR = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.03, 16), chromeMat);
  forkCapR.position.set(0.16, -0.04, -0.02);
  handlebarGroup.add(forkCapR);

  // Chrome Headlight Shell visible ahead of clamp (adds massive 3D depth!)
  const headlightShell = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2),
    chromeMat
  );
  headlightShell.rotation.x = Math.PI / 2;
  headlightShell.position.set(0, -0.12, -0.15);
  handlebarGroup.add(headlightShell);

  // 2. Continuous Sweeping Handlebars (matching Image 2)
  // Left side handlebar sections
  const barRadius = 0.014;
  const hBarMat = isCruiser ? chromeMat : blackMat;

  // Center straight section
  const centerBar = new THREE.Mesh(new THREE.CylinderGeometry(barRadius, barRadius, 0.22, 16), hBarMat);
  centerBar.rotateZ(Math.PI / 2);
  centerBar.position.set(0, 0.035, 0);
  handlebarGroup.add(centerBar);

  // Left curve rising and sweeping outward
  const leftRise = new THREE.Mesh(new THREE.CylinderGeometry(barRadius, barRadius, 0.32, 16), hBarMat);
  leftRise.position.set(-0.22, 0.08, -0.02);
  leftRise.rotation.z = 0.45;
  leftRise.rotation.y = -0.15;
  handlebarGroup.add(leftRise);

  // Left horizontal grip tube
  const leftGripTube = new THREE.Mesh(new THREE.CylinderGeometry(barRadius, barRadius, 0.24, 16), hBarMat);
  leftGripTube.rotateZ(Math.PI / 2);
  leftGripTube.position.set(-0.46, 0.12, -0.02);
  leftGripTube.rotation.y = -0.08;
  handlebarGroup.add(leftGripTube);

  // Right curve rising and sweeping outward
  const rightRise = new THREE.Mesh(new THREE.CylinderGeometry(barRadius, barRadius, 0.32, 16), hBarMat);
  rightRise.position.set(0.22, 0.08, -0.02);
  rightRise.rotation.z = -0.45;
  rightRise.rotation.y = 0.15;
  handlebarGroup.add(rightRise);

  // Right horizontal grip tube
  const rightGripTube = new THREE.Mesh(new THREE.CylinderGeometry(barRadius, barRadius, 0.24, 16), hBarMat);
  rightGripTube.rotateZ(Math.PI / 2);
  rightGripTube.position.set(0.46, 0.12, -0.02);
  rightGripTube.rotation.y = 0.08;
  handlebarGroup.add(rightGripTube);

  // 3. Thick Textured Rubber Grips
  const gripRadius = 0.022;
  const gripLength = 0.16;

  const leftGrip = new THREE.Mesh(new THREE.CylinderGeometry(gripRadius, gripRadius, gripLength, 18), gripRubberMat);
  leftGrip.rotateZ(Math.PI / 2);
  leftGrip.position.set(-0.46, 0.12, -0.02);
  leftGrip.rotation.y = -0.08;
  handlebarGroup.add(leftGrip);

  // Grip rib rings for tactile texture
  for (let r = -2; r <= 2; r++) {
    const ribL = new THREE.Mesh(new THREE.TorusGeometry(gripRadius + 0.002, 0.002, 8, 16), blackMat);
    ribL.rotateY(Math.PI / 2);
    ribL.position.set(-0.46 + r * 0.025, 0.12, -0.02);
    handlebarGroup.add(ribL);
  }

  const rightGrip = new THREE.Mesh(new THREE.CylinderGeometry(gripRadius, gripRadius, gripLength, 18), gripRubberMat);
  rightGrip.rotateZ(Math.PI / 2);
  rightGrip.position.set(0.46, 0.12, -0.02);
  rightGrip.rotation.y = 0.08;
  handlebarGroup.add(rightGrip);

  for (let r = -2; r <= 2; r++) {
    const ribR = new THREE.Mesh(new THREE.TorusGeometry(gripRadius + 0.002, 0.002, 8, 16), blackMat);
    ribR.rotateY(Math.PI / 2);
    ribR.position.set(0.46 + r * 0.025, 0.12, -0.02);
    handlebarGroup.add(ribR);
  }

  // Chrome Bar-End Weights
  const barEndL = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.035, 16), chromeMat);
  barEndL.rotateZ(Math.PI / 2);
  barEndL.position.set(-0.56, 0.12, -0.01);
  handlebarGroup.add(barEndL);

  const barEndR = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.035, 16), chromeMat);
  barEndR.rotateZ(Math.PI / 2);
  barEndR.position.set(0.56, 0.12, -0.01);
  handlebarGroup.add(barEndR);

  // 4. Levers: Chrome Clutch (Left) and Front Brake (Right)
  const leverMat = chromeMat;
  const leftBrakeLever = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.014, 0.024), leverMat);
  leftBrakeLever.position.set(-0.42, 0.13, -0.06);
  leftBrakeLever.rotation.y = -0.22;
  handlebarGroup.add(leftBrakeLever);

  const rightBrakeLever = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.014, 0.024), leverMat);
  rightBrakeLever.position.set(0.42, 0.13, -0.06);
  rightBrakeLever.rotation.y = 0.22;
  handlebarGroup.add(rightBrakeLever);

  // 5. Rider Hands with Real Black Leather Gauntlet Gloves (matching Image 2)
  function createRiderHand(isLeft: boolean): THREE.Group {
    const handGroup = new THREE.Group();
    const sign = isLeft ? -1 : 1;

    // Palm wrapping around the grip
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.065, 0.095), gloveLeatherMat);
    palm.position.set(0, 0, 0);
    handGroup.add(palm);

    // Molded carbon fiber / reinforced leather knuckle protection
    const knuckle = new THREE.Mesh(new THREE.BoxGeometry(0.082, 0.024, 0.045), knuckleArmorMat);
    knuckle.position.set(0, 0.034, -0.015);
    handGroup.add(knuckle);

    // 4 Distinct Curled Fingers wrapping tightly around the rubber grip
    for (let f = 0; f < 4; f++) {
      const finger = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.065, 10), gloveLeatherMat);
      finger.rotation.x = Math.PI / 2.05;
      finger.position.set((f - 1.5) * 0.021, -0.018, -0.035);
      handGroup.add(finger);
    }

    // Thumb wrapped underneath the grip
    const thumb = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.06, 10), gloveLeatherMat);
    thumb.rotation.z = sign * 0.6;
    thumb.rotation.x = 0.4;
    thumb.position.set(-sign * 0.035, -0.025, 0.015);
    handGroup.add(thumb);

    // Thick leather wrist gauntlet cuff extending downwards toward the rider's body
    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.075, 0.45, 14), gloveLeatherMat);
    forearm.rotation.x = Math.PI / 2.35;
    forearm.rotation.z = -sign * 0.28;
    forearm.position.set(sign * 0.1, -0.16, 0.22);
    handGroup.add(forearm);

    // Leather wrist strap with chrome buckle
    const strap = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.006, 8, 20), blackMat);
    strap.position.set(sign * 0.05, -0.07, 0.1);
    handGroup.add(strap);

    return handGroup;
  }

  const leftHand = createRiderHand(true);
  leftHand.position.set(-0.46, 0.12, 0);
  handlebarGroup.add(leftHand);

  const rightHand = createRiderHand(false);
  rightHand.position.set(0.46, 0.12, 0);
  handlebarGroup.add(rightHand);

  // 6. Dual Chrome Rearview Wing Mirrors (Rising on Stalks as in Image 2)
  const mirrorTex = createMirrorTexture();
  const mirrorSurfaceMat = new THREE.MeshBasicMaterial({ map: mirrorTex });

  function createRearViewMirror(isLeft: boolean): THREE.Group {
    const mirrorGroup = new THREE.Group();
    const sign = isLeft ? -1 : 1;

    // Chrome rising stalk
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.24, 10), chromeMat);
    stalk.position.set(sign * 0.08, 0.1, -0.04);
    stalk.rotation.z = -sign * 0.65;
    stalk.rotation.x = -0.2;
    mirrorGroup.add(stalk);

    // Oval mirror shell
    const shellGeo = new THREE.SphereGeometry(0.07, 16, 12);
    shellGeo.scale(1.4, 0.9, 0.35);
    const shell = new THREE.Mesh(shellGeo, chromeMat);
    shell.position.set(sign * 0.18, 0.2, -0.08);
    shell.rotation.y = sign * 0.25;
    shell.rotation.x = -0.12;
    mirrorGroup.add(shell);

    // Oval reflective glass face
    const glassGeo = new THREE.CircleGeometry(0.065, 20);
    glassGeo.scale(1.35, 0.85, 1);
    const glass = new THREE.Mesh(glassGeo, mirrorSurfaceMat);
    glass.position.set(sign * 0.18, 0.2, -0.065);
    glass.rotation.y = sign * 0.25;
    glass.rotation.x = -0.12;
    mirrorGroup.add(glass);

    return mirrorGroup;
  }

  const leftMirror = createRearViewMirror(true);
  leftMirror.position.set(-0.35, 0.12, 0);
  handlebarGroup.add(leftMirror);

  const rightMirror = createRearViewMirror(false);
  rightMirror.position.set(0.35, 0.12, 0);
  handlebarGroup.add(rightMirror);

  // 7. Speedometer / Dashboard Console
  const speedoCanvasTex = createSpeedometerTexture(bikeId, 0, 0, 1);
  const speedoMaterial = new THREE.MeshBasicMaterial({ map: speedoCanvasTex });

  let speedoGeo: THREE.BufferGeometry;
  let dashHousingGeo: THREE.BufferGeometry;

  if (isCruiser) {
    // Beautiful round chrome analog speedometer sitting right between the handlebars
    speedoGeo = new THREE.CircleGeometry(0.09, 32);
    dashHousingGeo = new THREE.CylinderGeometry(0.098, 0.095, 0.05, 32);
  } else if (bikeId === 'superbike') {
    speedoGeo = new THREE.PlaneGeometry(0.34, 0.17);
    dashHousingGeo = new THREE.BoxGeometry(0.36, 0.19, 0.04);
  } else if (bikeId === 'scooter') {
    speedoGeo = new THREE.CircleGeometry(0.085, 24);
    dashHousingGeo = new THREE.CylinderGeometry(0.092, 0.09, 0.04, 24);
  } else {
    // Modern digital TFT racing console
    speedoGeo = new THREE.PlaneGeometry(0.3, 0.15);
    dashHousingGeo = new THREE.BoxGeometry(0.32, 0.17, 0.04);
  }

  const dashHousing = new THREE.Mesh(dashHousingGeo, isCruiser ? chromeMat : blackMat);
  dashHousing.position.set(0, 0.015, -0.07);
  dashHousing.rotation.x = -Math.PI / 4.2;
  handlebarGroup.add(dashHousing);

  const speedometerMesh = new THREE.Mesh(speedoGeo, speedoMaterial);
  speedometerMesh.position.set(0, 0.02, -0.055);
  speedometerMesh.rotation.x = -Math.PI / 4.2;
  handlebarGroup.add(speedometerMesh);

  // Dynamic speedometer & RPM updates
  let lastSpeed = -1;
  let lastRpm = -1;
  let lastGear = -1;

  const updateCockpitDials = (speed: number, rpm: number, gear: number) => {
    if (Math.abs(speed - lastSpeed) > 1 || Math.abs(rpm - lastRpm) > 0.03 || gear !== lastGear) {
      lastSpeed = speed;
      lastRpm = rpm;
      lastGear = gear;

      const newTex = createSpeedometerTexture(bikeId, speed, rpm, gear);
      speedoMaterial.map?.dispose();
      speedoMaterial.map = newTex;
      speedoMaterial.needsUpdate = true;
    }
  };

  const updateVibration = (time: number, speed: number) => {
    const vibFreq = 30 + (speed / 100) * 40;
    const vibAmp = 0.0005 + (speed / 200) * 0.001;
    handlebarGroup.position.y = -0.22 + Math.sin(time * vibFreq) * vibAmp;
  };

  return {
    cockpitGroup,
    handlebarGroup,
    leftBrakeLever,
    rightBrakeLever,
    speedometerMesh,
    speedoMaterial,
    leftHand,
    rightHand,
    updateCockpitDials,
    updateVibration,
  };
}

/**
 * Builds Full Exterior 3D Motorcycle for Garage Showroom & 3rd-person camera.
 */
export function buildExteriorBikeModel(bikeId: BikeId, paintHex: string = '#22c55e'): {
  bikeGroup: THREE.Group;
  frontWheel: THREE.Group;
  rearWheel: THREE.Group;
  steeringFork: THREE.Group;
  updateColor: (hex: string) => void;
} {
  const bikeGroup = new THREE.Group();
  bikeGroup.name = `ExteriorBike_${bikeId}`;

  const paintColor = new THREE.Color(paintHex);
  const paintMat = new THREE.MeshStandardMaterial({
    color: paintColor,
    metalness: 0.85,
    roughness: 0.25,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xdedfe5,
    metalness: 0.95,
    roughness: 0.12,
  });

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x22262e,
    metalness: 0.7,
    roughness: 0.45,
  });

  const engineMat = new THREE.MeshStandardMaterial({
    color: 0x333842,
    metalness: 0.8,
    roughness: 0.35,
  });

  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x15161a,
    roughness: 0.9,
    metalness: 0.05,
  });

  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.75,
    metalness: 0.1,
  });

  const lightGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    emissive: 0xffeeaa,
    emissiveIntensity: 0.6,
    roughness: 0.1,
    transmission: 0.7,
    transparent: true,
  });

  const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

  function createWheel(): THREE.Group {
    const wheel = new THREE.Group();
    // Authentic motorcycle tire aligned in YZ plane (rolling along Z, axle along X)
    const tireGeo = new THREE.TorusGeometry(0.32, 0.08, 16, 36);
    tireGeo.rotateY(Math.PI / 2);
    const tire = new THREE.Mesh(tireGeo, tireMat);
    wheel.add(tire);

    const rimGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.09, 24);
    rimGeo.rotateZ(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeo, chromeMat);
    wheel.add(rim);

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.11, 16), chromeMat);
    hub.rotateZ(Math.PI / 2);
    wheel.add(hub);

    // Drilled stainless brake rotor disc
    const discGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.015, 24);
    discGeo.rotateZ(Math.PI / 2);
    const disc = new THREE.Mesh(discGeo, chromeMat);
    disc.position.set(0.055, 0, 0);
    wheel.add(disc);

    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5;
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.22, 0.04), chromeMat);
      spoke.position.set(0, Math.cos(angle) * 0.12, Math.sin(angle) * 0.12);
      spoke.rotation.x = angle;
      wheel.add(spoke);
    }

    return wheel;
  }

  // 1. Wheels
  const frontWheel = createWheel();
  const rearWheel = createWheel();
  rearWheel.position.set(0, 0.32, -0.75);
  bikeGroup.add(rearWheel);

  // 2. Front Fork & Handlebar
  const steeringFork = new THREE.Group();
  steeringFork.position.set(0, 0.45, 0.85);

  const forkL = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.68, 16), chromeMat);
  forkL.position.set(-0.12, 0.25, -0.06);
  forkL.rotation.x = -0.32;
  steeringFork.add(forkL);

  const forkR = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.68, 16), chromeMat);
  forkR.position.set(0.12, 0.25, -0.06);
  forkR.rotation.x = -0.32;
  steeringFork.add(forkR);

  // Mudguard
  const fenderGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.16, 16, 1, true, -Math.PI / 3, (Math.PI * 2) / 3);
  fenderGeo.rotateZ(Math.PI / 2);
  const fender = new THREE.Mesh(fenderGeo, paintMat);
  fender.position.set(0, 0.04, 0.05);
  steeringFork.add(fender);

  // Headlight assembly
  const headlight = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.1), lightGlassMat);
  headlight.position.set(0, 0.52, 0.02);
  steeringFork.add(headlight);

  // Handlebars
  const bars = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.025, 0.025), chromeMat);
  bars.position.set(0, 0.55, -0.12);
  steeringFork.add(bars);

  frontWheel.position.set(0, -0.13, 0.05);
  steeringFork.add(frontWheel);
  bikeGroup.add(steeringFork);

  // 3. Main Frame & Swingarm
  const swingarm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.72), frameMat);
  swingarm.position.set(0, 0.38, -0.35);
  swingarm.rotation.x = 0.08;
  bikeGroup.add(swingarm);

  const shock = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.25, 12), new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8 }));
  shock.position.set(0, 0.48, -0.22);
  shock.rotation.x = 0.45;
  bikeGroup.add(shock);

  // 4. Engine Block
  const engineBlock = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.42), engineMat);
  engineBlock.position.set(0, 0.42, 0.05);
  bikeGroup.add(engineBlock);

  // 5. Bodywork
  if (bikeId === 'scooter') {
    const floorboard = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.05, 0.55), paintMat);
    floorboard.position.set(0, 0.28, 0.1);
    bikeGroup.add(floorboard);

    const legShield = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.5, 0.06), paintMat);
    legShield.position.set(0, 0.55, 0.4);
    legShield.rotation.x = -0.15;
    bikeGroup.add(legShield);

    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.55), leatherMat);
    seat.position.set(0, 0.65, -0.3);
    bikeGroup.add(seat);
  } else if (bikeId === 'cruiser') {
    const tankGeo = new THREE.SphereGeometry(0.24, 16, 16);
    tankGeo.scale(0.9, 0.75, 1.4);
    const tank = new THREE.Mesh(tankGeo, paintMat);
    tank.position.set(0, 0.75, 0.25);
    bikeGroup.add(tank);

    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.1, 0.45), leatherMat);
    seat.position.set(0, 0.58, -0.22);
    bikeGroup.add(seat);
  } else {
    // Sport / Superbike aerodynamic body
    const tankGeo = new THREE.SphereGeometry(0.22, 16, 16);
    tankGeo.scale(1.1, 0.9, 1.5);
    const tank = new THREE.Mesh(tankGeo, paintMat);
    tank.position.set(0, 0.8, 0.2);
    bikeGroup.add(tank);

    const sideFairingL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.45, 0.68), paintMat);
    sideFairingL.position.set(-0.21, 0.58, 0.22);
    bikeGroup.add(sideFairingL);

    const sideFairingR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.45, 0.68), paintMat);
    sideFairingR.position.set(0.21, 0.58, 0.22);
    bikeGroup.add(sideFairingR);

    const riderSeat = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.32), leatherMat);
    riderSeat.position.set(0, 0.74, -0.15);
    bikeGroup.add(riderSeat);

    const tailCowl = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.48), paintMat);
    tailCowl.position.set(0, 0.78, -0.45);
    tailCowl.rotation.x = -0.2;
    bikeGroup.add(tailCowl);
  }

  // 6. Exhaust System
  const muffler = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.45, 16), chromeMat);
  muffler.position.set(0.22, 0.44, -0.52);
  muffler.rotation.x = 0.45;
  bikeGroup.add(muffler);

  // 7. Taillight
  const tailLight = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.04), tailLightMat);
  tailLight.position.set(0, 0.72, -0.72);
  bikeGroup.add(tailLight);

  const updateColor = (hex: string) => {
    paintMat.color.set(hex);
  };

  return {
    bikeGroup,
    frontWheel,
    rearWheel,
    steeringFork,
    updateColor,
  };
}
