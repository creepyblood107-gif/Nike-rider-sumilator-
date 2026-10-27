/**
 * Core 3D Game Engine for Traffic Rider 3D.
 * Manages Three.js scene, rendering loop, bike kinematics, traffic simulation,
 * collision detection, close-call bonuses, and responsive multi-touch/keyboard inputs.
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { soundEngine } from '../audio/SoundEffects';
import {
  BikeData,
  BikeId,
  BonusNotification,
  EnvironmentType,
  GameMode,
  GameTelemetry,
  TimeOfDay,
  WeatherType,
} from '../types';
import {
  buildCockpitModel,
  buildExteriorBikeModel,
} from './BikeModels';
import {
  HighwayManager,
  TIME_OF_DAY_MODIFIERS,
} from './Environment';
import {
  buildTrafficVehicle,
  TrafficCarInstance,
  TrafficVehicleType,
} from './TrafficCars';

export interface GameEngineOptions {
  canvasMount: HTMLElement;
  bike: BikeData;
  bikeColorHex: string;
  environmentType: EnvironmentType;
  gameMode: GameMode;
  timeOfDay?: TimeOfDay;
  weather?: WeatherType;
  onTelemetry: (telemetry: GameTelemetry) => void;
  onBonus: (bonus: BonusNotification) => void;
  onGameOver: (finalStats: {
    score: number;
    cash: number;
    distanceMeters: number;
    closeOvertakes: number;
    maxSpeedKmh: number;
    highSpeedSeconds: number;
  }) => void;
}

export class GameEngine {
  private container: HTMLElement;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private isSoftwareGl: boolean = false;
  private animationFrameId: number = 0;

  // Options & State
  public bike: BikeData;
  public bikeColorHex: string;
  public envType: EnvironmentType;
  public gameMode: GameMode;
  public timeOfDay: TimeOfDay = 'day';
  public weather: WeatherType = 'clear';
  public isPaused: boolean = false;
  public isDestroyed: boolean = false;
  public isCrashed: boolean = false;
  public cameraView: 'cockpit' | 'thirdPerson' = 'cockpit';

  // Sub-systems
  private highwayManager!: HighwayManager;
  private cockpitModel!: ReturnType<typeof buildCockpitModel>;
  private exteriorModel!: ReturnType<typeof buildExteriorBikeModel>;
  private playerBikeGroup!: THREE.Group;

  // Traffic vehicles
  private trafficCars: TrafficCarInstance[] = [];
  private readonly MAX_TRAFFIC = 14;

  // Physics & Kinematics
  private playerX: number = 1.75;
  private playerZ: number = 0;
  private speedKmh: number = 0;
  private currentGear: number = 1;
  private rpmRatio: number = 0;
  private leanAngle: number = 0;
  private steerInput: number = 0;
  private throttleInput: boolean = false;
  private brakeInput: boolean = false;
  private wheelieInput: boolean = false;
  private hornInput: boolean = false;
  private wheeliePitch: number = 0;
  private crashTimer: number = 0;

  // Score & Stats
  private score: number = 0;
  private cashEarned: number = 0;
  private distanceMeters: number = 0;
  private closeOvertakes: number = 0;
  private maxSpeedKmh: number = 0;
  private highSpeedTimer: number = 0;
  private highSpeedSeconds: number = 0;
  private oppositeTimer: number = 0;
  private timeRemaining: number = 60;
  private comboCount: number = 0;
  private comboTimer: number = 0;

  // Lights
  private dirLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private bikeHeadlight!: THREE.SpotLight;

  // Telemetry throttle
  private lastTelemetryTime: number = 0;

  // Callbacks
  private onTelemetry: (telemetry: GameTelemetry) => void;
  private onBonus: (bonus: BonusNotification) => void;
  private onGameOver: (finalStats: {
    score: number;
    cash: number;
    distanceMeters: number;
    closeOvertakes: number;
    maxSpeedKmh: number;
    highSpeedSeconds: number;
  }) => void;

  constructor(options: GameEngineOptions) {
    this.container = options.canvasMount;
    this.bike = options.bike;
    this.bikeColorHex = options.bikeColorHex;
    this.envType = options.environmentType;
    this.gameMode = options.gameMode;
    this.timeOfDay = options.timeOfDay || 'day';
    this.weather = options.weather || 'clear';
    this.onTelemetry = options.onTelemetry;
    this.onBonus = options.onBonus;
    this.onGameOver = options.onGameOver;

    this.initRenderer();
    this.initScene();
    this.initBike();
    this.initTraffic();
    this.bindInputs();

    // Start engine sound
    soundEngine.startEngine(this.bike.id);
    if (this.weather === 'rain') {
      soundEngine.setRainSound(true);
    } else {
      soundEngine.setRainSound(false);
    }

    // Start loop
    this.lastTime = performance.now();
    this.tick();
  }

  private initRenderer() {
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    window.addEventListener('resize', this.onResize);
  }

  private initScene() {
    this.scene = new THREE.Scene();
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    const aspect = width / height;

    const todMod = TIME_OF_DAY_MODIFIERS[this.timeOfDay];

    // Background & Fog matching time of day
    this.scene.background = new THREE.Color(todMod.fogColor);
    this.scene.fog = new THREE.Fog(todMod.fogColor, 60, 320);

    // Initial camera with adaptive FOV (wider for mobile portrait so handlebars fit!)
    const fov = aspect < 0.9 ? 76 : 65;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 450);
    this.camera.position.set(this.playerX, 1.25, this.playerZ);
    this.camera.lookAt(this.playerX, 1.25, this.playerZ + 50);

    // PMREM RoomEnvironment for metallic motorcycle reflections
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Lighting Rig with Day / Sunset / Night parameters
    this.hemiLight = new THREE.HemisphereLight(0x94a3b8, 0x1e293b, todMod.ambientIntensity);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(todMod.lightColor, todMod.lightIntensity);
    this.dirLight.position.set(40, 60, -30);
    if (!this.isSoftwareGl) {
      this.dirLight.castShadow = true;
      this.dirLight.shadow.mapSize.width = 1024;
      this.dirLight.shadow.mapSize.height = 1024;
      this.dirLight.shadow.camera.near = 10;
      this.dirLight.shadow.camera.far = 160;
      this.dirLight.shadow.camera.left = -30;
      this.dirLight.shadow.camera.right = 30;
      this.dirLight.shadow.camera.top = 30;
      this.dirLight.shadow.camera.bottom = -30;
      this.dirLight.shadow.bias = -0.0005;
    }
    this.scene.add(this.dirLight);

    // Dynamic motorcycle headlight beam
    const headlightIntensity = todMod.isNight ? 7.0 : 3.0;
    this.bikeHeadlight = new THREE.SpotLight(0xfffbeb, headlightIntensity, 85, Math.PI / 4.8, 0.45, 1.2);
    this.bikeHeadlight.position.set(0, 1.1, 0.8);
    this.bikeHeadlight.target.position.set(0, 0.4, 45);
    this.scene.add(this.bikeHeadlight);
    this.scene.add(this.bikeHeadlight.target);

    // Highway Manager with day/night and rain
    this.highwayManager = new HighwayManager(this.scene, this.envType, this.timeOfDay, this.weather);
  }

  private initBike() {
    this.playerBikeGroup = new THREE.Group();
    this.playerBikeGroup.position.set(this.playerX, 0, this.playerZ);

    // 1. Cockpit First-Person Model
    this.cockpitModel = buildCockpitModel(this.bike.id, this.bikeColorHex);
    this.camera.add(this.cockpitModel.cockpitGroup);
    this.scene.add(this.camera);

    // Adapt cockpit scale & position for portrait or landscape
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.adjustCockpitForAspect(width / height);

    // 2. Exterior 3rd-person model
    this.exteriorModel = buildExteriorBikeModel(this.bike.id, this.bikeColorHex);
    this.exteriorModel.bikeGroup.visible = false;
    this.playerBikeGroup.add(this.exteriorModel.bikeGroup);

    this.scene.add(this.playerBikeGroup);
  }

  /**
   * Adapts cockpit size & camera FOV so handlebars, hands, dials, and mirrors
   * are 100% visible on both mobile portrait phones and desktop landscape!
   */
  public adjustCockpitForAspect(aspect: number) {
    if (!this.cockpitModel) return;
    if (aspect < 0.9) {
      // Mobile vertical portrait: scale handlebars so grips and mirrors span naturally across bottom
      const s = Math.min(1.0, Math.max(0.72, aspect * 1.45));
      this.cockpitModel.cockpitGroup.scale.set(s, s, s);
      this.cockpitModel.cockpitGroup.position.set(0, -0.04, -0.06);
      this.camera.fov = 76;
    } else {
      // Desktop / Tablet landscape
      this.cockpitModel.cockpitGroup.scale.set(1, 1, 1);
      this.cockpitModel.cockpitGroup.position.set(0, 0, 0);
      this.camera.fov = 65;
    }
    this.camera.updateProjectionMatrix();
  }

  public setTimeOfDay(tod: TimeOfDay) {
    this.timeOfDay = tod;
    const mod = TIME_OF_DAY_MODIFIERS[tod];
    this.dirLight.color.set(mod.lightColor);
    this.dirLight.intensity = mod.lightIntensity;
    this.hemiLight.intensity = mod.ambientIntensity;
    this.scene.fog?.color.set(mod.fogColor);
    this.scene.background = new THREE.Color(mod.fogColor);
    this.bikeHeadlight.intensity = mod.isNight ? 7.0 : 3.0;
    this.highwayManager.setTimeOfDay(tod);
  }

  public setWeather(w: WeatherType) {
    this.weather = w;
    this.highwayManager.setWeather(w);
    soundEngine.setRainSound(w === 'rain');
  }

  private initTraffic() {
    const types: TrafficVehicleType[] = ['sedan', 'van', 'suv', 'box-truck', 'semi-truck'];
    const laneX = [-5.25, -1.75, 1.75, 5.25];

    for (let i = 0; i < this.MAX_TRAFFIC; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const vehicle = buildTrafficVehicle(type);

      // Distribute along the highway ahead
      const laneIdx = Math.floor(Math.random() * 4);
      const isOncoming = this.gameMode === 'endless-twoway' && laneIdx >= 2;

      const initZ = 40 + i * 28 + Math.random() * 15;
      const x = laneX[laneIdx];

      vehicle.group.position.set(x, 0, initZ);
      if (isOncoming) {
        vehicle.group.rotation.y = Math.PI; // Face player
      }

      this.scene.add(vehicle.group);

      const baseSpeedKmh =
        type === 'semi-truck' ? 65 : type === 'box-truck' ? 75 : 85 + Math.random() * 20;

      this.trafficCars.push({
        group: vehicle.group,
        type,
        lane: laneIdx,
        targetX: x,
        z: initZ,
        speed: (baseSpeedKmh * 1000) / 3600, // in m/s
        isOncoming,
        length: vehicle.length,
        width: vehicle.width,
        height: vehicle.height,
        wheels: vehicle.wheels,
        leftBlinker: vehicle.leftBlinker,
        rightBlinker: vehicle.rightBlinker,
        blinkingTimer: 0,
        isChangingLane: false,
        laneChangeTargetX: x,
        active: true,
        passedPlayer: false,
        closeCallRewarded: false,
      });
    }
  }

  // Input bindings
  private onKeyDown = (e: KeyboardEvent) => {
    if (this.isCrashed) return;

    if (e.code === 'KeyW' || e.code === 'ArrowUp') {
      this.throttleInput = true;
    }
    if (e.code === 'KeyS' || e.code === 'ArrowDown') {
      this.brakeInput = true;
    }
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
      this.steerInput = -1;
    }
    if (e.code === 'KeyD' || e.code === 'ArrowRight') {
      this.steerInput = 1;
    }
    if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      if (this.bike.wheelieCapable) {
        this.wheelieInput = true;
      }
    }
    if (e.code === 'KeyH') {
      this.triggerHorn(true);
    }
    if (e.code === 'KeyC') {
      this.toggleCamera();
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') {
      this.throttleInput = false;
    }
    if (e.code === 'KeyS' || e.code === 'ArrowDown') {
      this.brakeInput = false;
    }
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
      if (this.steerInput < 0) this.steerInput = 0;
    }
    if (e.code === 'KeyD' || e.code === 'ArrowRight') {
      if (this.steerInput > 0) this.steerInput = 0;
    }
    if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      this.wheelieInput = false;
    }
    if (e.code === 'KeyH') {
      this.triggerHorn(false);
    }
  };

  private bindInputs() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
  }

  private onBlur = () => {
    this.throttleInput = false;
    this.brakeInput = false;
    this.steerInput = 0;
    this.wheelieInput = false;
    this.triggerHorn(false);
  };

  // Touch UI Input APIs (called by CockpitOverlay)
  public setThrottle(active: boolean) {
    this.throttleInput = active;
  }

  public setBrake(active: boolean) {
    this.brakeInput = active;
  }

  public setSteer(val: number) {
    this.steerInput = Math.max(-1, Math.min(1, val));
  }

  public setWheelie(active: boolean) {
    if (this.bike.wheelieCapable) {
      this.wheelieInput = active;
    }
  }

  public triggerHorn(active: boolean) {
    this.hornInput = active;
    soundEngine.setHorn(active);

    if (active) {
      // Cause vehicle directly ahead in current lane to consider switching lanes
      for (const car of this.trafficCars) {
        if (!car.isOncoming && Math.abs(car.group.position.x - this.playerX) < 1.8) {
          const distZ = car.group.position.z - this.playerZ;
          if (distZ > 0 && distZ < 35 && !car.isChangingLane) {
            // Signal and change lane away
            this.triggerCarLaneChange(car);
            break;
          }
        }
      }
    }
  }

  public toggleCamera() {
    if (this.cameraView === 'cockpit') {
      this.cameraView = 'thirdPerson';
      this.cockpitModel.cockpitGroup.visible = false;
      this.exteriorModel.bikeGroup.visible = true;
      this.camera.position.set(this.playerX, 1.5, this.playerZ - 3.6);
      this.camera.lookAt(this.playerX, 0.8, this.playerZ + 8);
    } else {
      this.cameraView = 'cockpit';
      this.cockpitModel.cockpitGroup.visible = true;
      this.exteriorModel.bikeGroup.visible = false;
      this.camera.position.set(this.playerX, 1.15, this.playerZ - 0.15);
      this.camera.lookAt(this.playerX, 1.15, this.playerZ + 50);
    }
  }

  private triggerCarLaneChange(car: TrafficCarInstance) {
    const laneX = [-5.25, -1.75, 1.75, 5.25];
    // Find adjacent available lane
    const currentIdx = car.lane;
    const canGoRight = currentIdx < 3;
    const canGoLeft = car.isOncoming ? currentIdx > 0 : currentIdx > 2; // don't push into oncoming lane if one-way

    let targetLane = currentIdx;
    if (canGoRight && canGoLeft) {
      targetLane = Math.random() > 0.5 ? currentIdx + 1 : currentIdx - 1;
    } else if (canGoRight) {
      targetLane = currentIdx + 1;
    } else if (canGoLeft) {
      targetLane = currentIdx - 1;
    }

    if (targetLane !== currentIdx) {
      car.isChangingLane = true;
      car.lane = targetLane;
      car.laneChangeTargetX = laneX[targetLane];
      car.blinkingTimer = 2.5; // Blink for 2.5 seconds
    }
  }

  // Main Animation Tick
  private lastTime: number = 0;
  private tick = () => {
    if (this.isDestroyed) return;

    const now = performance.now();
    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const dt = Math.min(rawDt, 0.05); // Frame-delta clamping

    if (!this.isPaused) {
      if (this.isCrashed) {
        this.updateCrash(dt);
      } else {
        this.updateSimulation(dt, now);
      }
    }

    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      // Safe pacing for software WebGL to avoid frame starvation
      this.afterDrawSoftware(this.tick);
    } else {
      this.animationFrameId = requestAnimationFrame(this.tick);
    }
  };

  private afterDrawSoftware(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        setTimeout(cb, 60);
      }
    };
    setTimeout(poll, 5);
  }

  private updateSimulation(dt: number, now: number) {
    // 1. Acceleration & Speed Physics
    const topSpeed = this.bike.topSpeedKmh;
    const accelRate = 22 * this.bike.accelerationFactor;
    const brakeRate = 45 * this.bike.brakingFactor;
    const coastFriction = 7.0;

    if (this.throttleInput) {
      // Natural diminishing acceleration near top speed
      const headroom = Math.max(0, 1 - this.speedKmh / topSpeed);
      this.speedKmh += accelRate * (0.35 + 0.65 * Math.pow(headroom, 0.7)) * dt;
    } else if (this.brakeInput) {
      this.speedKmh -= brakeRate * dt;
      soundEngine.playBrakeScreech(this.speedKmh > 70);
    } else {
      this.speedKmh -= coastFriction * dt;
    }

    // Wheelie speed boost / drag trade-off
    if (this.wheelieInput && this.speedKmh > 40) {
      this.wheeliePitch = THREE.MathUtils.damp(this.wheeliePitch, 0.45, 8, dt);
    } else {
      this.wheeliePitch = THREE.MathUtils.damp(this.wheeliePitch, 0, 10, dt);
    }

    // Clamp speed
    this.speedKmh = Math.max(0, Math.min(topSpeed * (this.wheeliePitch > 0.2 ? 1.05 : 1.0), this.speedKmh));
    if (this.speedKmh > this.maxSpeedKmh) {
      this.maxSpeedKmh = Math.round(this.speedKmh);
    }

    // Gear & RPM calculations
    this.calculateGears();

    // 2. Lateral Steering & Leaning
    const speedRatio = this.speedKmh / topSpeed;
    const handling = this.bike.handlingFactor;
    // Steering is more responsive at moderate speeds, stable at high speeds
    const steerSpeed = 6.2 * handling * Math.min(1.2, 0.3 + 0.7 * speedRatio);
    // Looking along +Z: -X is to the right, +X is to the left.
    // When steerInput = 1 (Right): playerX decreases (moves right).
    // When steerInput = -1 (Left): playerX increases (moves left).
    this.playerX -= this.steerInput * steerSpeed * dt;

    // Road limits (guardrails at -7.2m and +7.2m)
    if (this.playerX < -7.1 || this.playerX > 7.1) {
      // Hit guardrail!
      this.handleCrash();
      return;
    }

    // Target lean roll angle (radians): positive tilts right towards -X, negative tilts left towards +X
    const targetLean = this.steerInput * 0.42 * (0.4 + 0.6 * speedRatio);
    this.leanAngle = THREE.MathUtils.damp(this.leanAngle, targetLean, 12, dt);

    // 3. Forward Displacement
    const speedMs = (this.speedKmh * 1000) / 3600;
    const deltaZ = speedMs * dt;
    this.playerZ += deltaZ;
    this.distanceMeters += deltaZ;

    // Update score
    this.score += Math.round(speedMs * dt * (this.speedKmh > 100 ? 1.5 : 1.0));

    // High Speed bonus tracking (>100 km/h continuous)
    if (this.speedKmh >= 100) {
      this.highSpeedTimer += dt;
      if (this.highSpeedTimer >= 1.0) {
        this.highSpeedSeconds += 1;
        this.highSpeedTimer -= 1.0;
        this.score += 25;
        this.cashEarned += 10;
        this.onBonus({
          id: Date.now() + Math.random(),
          type: 'high-speed',
          text: 'HIGH SPEED > 100 KM/H',
          pts: 25,
          cashBonus: 10,
        });
      }
    } else {
      this.highSpeedTimer = 0;
    }

    // Opposite lane bonus tracking (driving in oncoming lane x > 0 in two-way mode)
    const isInOppositeLane = this.gameMode === 'endless-twoway' && this.playerX > 0 && this.speedKmh > 60;
    if (isInOppositeLane) {
      this.oppositeTimer += dt;
      if (this.oppositeTimer >= 1.0) {
        this.oppositeTimer -= 1.0;
        this.score += 50;
        this.cashEarned += 20;
        this.onBonus({
          id: Date.now() + Math.random(),
          type: 'opposite',
          text: 'OPPOSITE DIRECTION',
          pts: 50,
          cashBonus: 20,
        });
      }
    } else {
      this.oppositeTimer = 0;
    }

    // Time Attack countdown
    if (this.gameMode === 'time-attack') {
      this.timeRemaining -= dt;
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.handleCrash(); // Out of time
        return;
      }
    }

    // Combo multiplier decay
    if (this.comboCount > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
      }
    }

    // 4. Update Bike Models & Camera Positions
    this.playerBikeGroup.position.set(this.playerX, 0, this.playerZ);

    // Dynamic camera placement
    if (this.cameraView === 'cockpit') {
      this.cockpitModel.cockpitGroup.visible = true;
      this.exteriorModel.bikeGroup.visible = false;

      // First person: Camera sits above fuel tank
      // Subtle pitch forward when braking, back when accelerating, up when wheelie
      const accelPitch = this.throttleInput ? -0.03 : this.brakeInput ? 0.05 : 0;
      const targetCamY = 1.15 + Math.sin(this.wheeliePitch) * 0.4;
      const targetCamZ = this.playerZ - Math.cos(this.wheeliePitch) * 0.15;

      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, this.playerX, 18, dt);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, targetCamY, 14, dt);
      this.camera.position.z = targetCamZ;

      // Look forward along +Z highway (facing ahead into oncoming & forward traffic)
      const lookDist = 50;
      const targetLookX = this.playerX - this.steerInput * 1.6;
      const targetLookY = targetCamY + accelPitch * 8 + Math.sin(this.wheeliePitch) * 2.2;
      const targetLookZ = this.playerZ + lookDist;

      this.camera.lookAt(targetLookX, targetLookY, targetLookZ);

      // Camera roll with motorcycle leaning into turns
      this.camera.rotateZ(this.leanAngle * 0.45);

      // Handlebar & lever animation
      this.cockpitModel.handlebarGroup.rotation.y = -this.steerInput * 0.14;
      this.cockpitModel.rightBrakeLever.rotation.y = this.brakeInput ? 0.28 : 0.12;
      this.cockpitModel.updateCockpitDials(this.speedKmh, this.rpmRatio, this.currentGear);
      this.cockpitModel.updateVibration(now * 0.001, this.speedKmh);
    } else {
      this.cockpitModel.cockpitGroup.visible = false;
      this.exteriorModel.bikeGroup.visible = true;
      // 3rd Person chase camera
      const chaseDist = 3.6;
      const chaseHeight = 1.5 + this.wheeliePitch * 0.8;
      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, this.playerX, 12, dt);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, chaseHeight, 10, dt);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, this.playerZ - chaseDist, 14, dt);
      this.camera.lookAt(this.playerX, 0.8 + this.wheeliePitch * 0.5, this.playerZ + 8);

      // Roll exterior bike
      this.exteriorModel.bikeGroup.rotation.z = this.leanAngle;
      this.exteriorModel.bikeGroup.rotation.x = -this.wheeliePitch;
      this.exteriorModel.steeringFork.rotation.y = -this.steerInput * 0.25;

      // Spin wheels
      const wheelRotation = (speedMs / 0.32) * dt;
      this.exteriorModel.frontWheel.rotation.x += wheelRotation;
      this.exteriorModel.rearWheel.rotation.x += wheelRotation;
    }

    // Bike forward light beam
    this.bikeHeadlight.position.set(this.playerX, 1.1 + this.wheeliePitch * 0.5, this.playerZ + 0.8);
    this.bikeHeadlight.target.position.set(this.playerX, 0.4, this.playerZ + 45);

    // Directional sun light follows player
    this.dirLight.position.set(this.playerX + 40, 60, this.playerZ - 30);
    this.dirLight.target.position.set(this.playerX, 0, this.playerZ + 20);

    // 5. Update Highway Recycling
    this.highwayManager.update(this.playerZ);
    if (this.envType === 'winter') {
      this.highwayManager.updateSnow(this.playerZ, dt);
    }
    if (this.weather === 'rain') {
      this.highwayManager.updateRain(this.playerZ, dt, speedMs);
    }

    // 6. Update Traffic Simulation & Collisions
    this.updateTraffic(dt);

    // 7. Audio update
    soundEngine.updateEngine(this.rpmRatio, this.throttleInput, this.bike.id, speedRatio);

    // 8. Send Telemetry to UI (Throttled to ~20Hz)
    if (now - this.lastTelemetryTime > 50) {
      this.lastTelemetryTime = now;
      this.onTelemetry({
        speedKmh: Math.round(this.speedKmh),
        rpmRatio: this.rpmRatio,
        gear: this.currentGear,
        distanceMeters: Math.round(this.distanceMeters),
        score: this.score,
        cashEarned: this.cashEarned,
        closeOvertakes: this.closeOvertakes,
        timeRemaining: Math.ceil(this.timeRemaining),
        isWheelie: this.wheeliePitch > 0.15,
        isBraking: this.brakeInput,
        isHornActive: this.hornInput,
        oncomingLane: isInOppositeLane,
        comboCount: this.comboCount,
      });
    }
  }

  private calculateGears() {
    const top = this.bike.topSpeedKmh;
    const ratio = Math.max(0, Math.min(1, this.speedKmh / top));

    // 6 distinct gears
    if (ratio < 0.16) {
      this.currentGear = 1;
      this.rpmRatio = ratio / 0.16;
    } else if (ratio < 0.32) {
      this.currentGear = 2;
      this.rpmRatio = (ratio - 0.16) / 0.16;
    } else if (ratio < 0.5) {
      this.currentGear = 3;
      this.rpmRatio = (ratio - 0.32) / 0.18;
    } else if (ratio < 0.68) {
      this.currentGear = 4;
      this.rpmRatio = (ratio - 0.5) / 0.18;
    } else if (ratio < 0.84) {
      this.currentGear = 5;
      this.rpmRatio = (ratio - 0.68) / 0.16;
    } else {
      this.currentGear = 6;
      this.rpmRatio = (ratio - 0.84) / 0.16;
    }
    this.rpmRatio = Math.max(0.12, Math.min(1.0, this.rpmRatio));
  }

  private updateTraffic(dt: number) {
    const laneX = [-5.25, -1.75, 1.75, 5.25];

    for (let i = 0; i < this.trafficCars.length; i++) {
      const car = this.trafficCars[i];

      // Move along Z
      const dir = car.isOncoming ? -1 : 1;
      car.z += dir * car.speed * dt;

      // Handle lane changing
      if (car.isChangingLane) {
        car.group.position.x = THREE.MathUtils.damp(
          car.group.position.x,
          car.laneChangeTargetX,
          2.5,
          dt
        );
        if (Math.abs(car.group.position.x - car.laneChangeTargetX) < 0.05) {
          car.group.position.x = car.laneChangeTargetX;
          car.isChangingLane = false;
        }

        // Blinking indicators
        car.blinkingTimer -= dt;
        const blinkOn = Math.floor(car.blinkingTimer * 5) % 2 === 0;
        const goingLeft = car.laneChangeTargetX < car.group.position.x;
        if (car.leftBlinker) car.leftBlinker.visible = goingLeft && blinkOn;
        if (car.rightBlinker) car.rightBlinker.visible = !goingLeft && blinkOn;
      } else {
        if (car.leftBlinker) car.leftBlinker.visible = false;
        if (car.rightBlinker) car.rightBlinker.visible = false;

        // Occasional random lane change (if car in front is slow)
        if (Math.random() < 0.002) {
          this.triggerCarLaneChange(car);
        }
      }

      car.group.position.z = car.z;

      // Spin car wheels
      const wheelSpin = (car.speed / 0.35) * dt * (car.isOncoming ? -1 : 1);
      for (const w of car.wheels) {
        w.rotation.x += wheelSpin;
      }

      // 1. Collision Check with Player
      const dx = Math.abs(this.playerX - car.group.position.x);
      const dz = Math.abs(this.playerZ - car.z);

      // Hitbox half sizes: bike width ~0.8m, length ~2.0m
      const hitX = (car.width + 0.8) * 0.48;
      const hitZ = (car.length + 1.8) * 0.48;

      if (dx < hitX && dz < hitZ) {
        // Impact!
        this.handleCrash();
        return;
      }

      // 2. "Close Overtake" (Close Call) Detection
      // Occurs when passing closely (lateral distance < 1.4m clearance, within car length) at > 100 km/h
      const lateralClearance = dx - car.width * 0.5 - 0.4;
      if (
        !car.closeCallRewarded &&
        this.speedKmh >= 100 &&
        lateralClearance > 0 &&
        lateralClearance < 1.3 &&
        dz < (car.length * 0.5 + 1.2)
      ) {
        car.closeCallRewarded = true;
        this.closeOvertakes += 1;
        this.comboCount += 1;
        this.comboTimer = 3.5; // 3.5s combo window

        const isWheelieBonus = this.wheeliePitch > 0.2;
        const comboMultiplier = Math.min(4, 1 + (this.comboCount - 1) * 0.5);
        const pts = Math.round(100 * comboMultiplier * (isWheelieBonus ? 2 : 1));
        const cash = Math.round(50 * (isWheelieBonus ? 2 : 1));

        this.score += pts;
        this.cashEarned += cash;

        if (this.gameMode === 'time-attack') {
          this.timeRemaining += 2.0; // Extra time reward!
        }

        soundEngine.playCloseOvertake();

        this.onBonus({
          id: Date.now() + Math.random(),
          type: 'close-overtake',
          text: isWheelieBonus
            ? `WHEELIE CLOSE CALL! x${comboMultiplier.toFixed(1)}`
            : `CLOSE OVERTAKE! x${comboMultiplier.toFixed(1)}`,
          pts,
          cashBonus: cash,
          timeBonus: this.gameMode === 'time-attack' ? 2 : undefined,
        });
      }

      // 3. Recycle cars that are far behind or way ahead
      const relZ = car.z - this.playerZ;
      if (relZ < -45 || relZ > 240) {
        // Respawn ahead of player
        const newLane = Math.floor(Math.random() * 4);
        const isOncoming = this.gameMode === 'endless-twoway' && newLane >= 2;
        const newZ = this.playerZ + 120 + Math.random() * 90;

        car.z = newZ;
        car.lane = newLane;
        car.targetX = laneX[newLane];
        car.group.position.set(laneX[newLane], 0, newZ);
        car.isOncoming = isOncoming;
        car.group.rotation.y = isOncoming ? Math.PI : 0;
        car.closeCallRewarded = false;
        car.isChangingLane = false;
      }
    }
  }

  private handleCrash() {
    if (this.isCrashed) return;
    this.isCrashed = true;
    this.crashTimer = 0;

    // Crash Audio
    soundEngine.stopEngine();
    soundEngine.setHorn(false);
    soundEngine.setRainSound(false);
    soundEngine.playCrash();

    // Switch to exterior model so player sees the bike tumble
    this.cockpitModel.cockpitGroup.visible = false;
    this.exteriorModel.bikeGroup.visible = true;

    // Report game over to UI after dramatic 1.5s crash sequence
    setTimeout(() => {
      this.onGameOver({
        score: this.score,
        cash: this.cashEarned,
        distanceMeters: Math.round(this.distanceMeters),
        closeOvertakes: this.closeOvertakes,
        maxSpeedKmh: this.maxSpeedKmh,
        highSpeedSeconds: this.highSpeedSeconds,
      });
    }, 1500);
  }

  private updateCrash(dt: number) {
    this.crashTimer += dt;
    // Slow down simulation
    this.speedKmh = THREE.MathUtils.damp(this.speedKmh, 0, 4, dt);
    const speedMs = (this.speedKmh * 1000) / 3600;
    this.playerZ += speedMs * dt;

    // Dramatic bike tumbling animation
    this.exteriorModel.bikeGroup.rotation.x += dt * 8;
    this.exteriorModel.bikeGroup.rotation.z += dt * 6;
    this.exteriorModel.bikeGroup.position.y = Math.max(0.2, 0.5 + Math.sin(this.crashTimer * 4) * 0.4);

    // Camera pulls back and looks at the crash site
    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, this.playerX + 2, 4, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, 2.5, 4, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, this.playerZ - 6, 4, dt);
    this.camera.lookAt(this.playerX, 0.4, this.playerZ);
  }

  public pause() {
    this.isPaused = true;
    soundEngine.stopEngine();
    soundEngine.setHorn(false);
    soundEngine.setRainSound(false);
  }

  public resume() {
    this.isPaused = false;
    this.lastTime = performance.now();
    soundEngine.startEngine(this.bike.id);
    if (this.weather === 'rain') {
      soundEngine.setRainSound(true);
    }
  }

  private onResize = () => {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    const aspect = width / height;
    this.camera.aspect = aspect;
    this.adjustCockpitForAspect(aspect);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public dispose() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);

    soundEngine.stopEngine();
    soundEngine.setHorn(false);
    soundEngine.setRainSound(false);

    this.highwayManager.dispose();
    this.renderer.dispose();

    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
