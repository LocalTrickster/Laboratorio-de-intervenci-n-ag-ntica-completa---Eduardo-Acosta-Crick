import Phaser from "phaser";
import {
  COVER_POINTS,
  DISTRACTOR_INTERACTION_RANGE,
  GUARD_FIELD_OF_VIEW,
  GUARD_START,
  GUARD_PATROL_POINTS,
  GUARD_VISION_RANGE,
  GRID_HEIGHT,
  GRID_WIDTH,
  LAB_MAP,
  PATROL_PAUSE_DURATION_MS,
  PLAYER_START,
  SOUND_DISTRACTOR_POINTS,
  TILE_SIZE,
} from "../../application/simulation/labLevel";
import { activateNearestSoundDistractor } from "../../application/simulation/soundDistractor";
import {
  advanceGuardSimulation,
  guardNavigationStatus,
  initialGuardSimulation,
  type GuardSimulationState,
} from "../../application/simulation/guardSimulation";
import {
  initialPerceptionState,
  updatePerceptionSimulation,
  withSoundEvent,
  type PerceptionSimulationState,
} from "../../application/simulation/perceptionSimulation";
import { cellCenter, cellKey, isWalkable, worldToCell } from "../../domain/model/grid";
import type { SearchAlgorithm, SearchResult, SearchStatus } from "../../domain/navigation/search";
import { timeSinceLastPerception } from "../../domain/perception/memory";
import type { VisionReason, VisionResult } from "../../domain/perception/perception";
import { GUARD_STATE_COLORS, VISION_COLORS } from "../presentation/guardPresentation";

const PLAYER_SPEED = 190;
const GUARD_SPEED = 115;
const SOUND_RADIUS = 190;
const SOUND_DURATION_MS = 800;
const SEARCH_DURATION_MS = 6_000;
const SEARCH_RADIUS_IN_CELLS = 2;
const STATUS_LABELS: Readonly<Record<SearchStatus, string>> = {
  success: "EXITO",
  unreachable: "INALCANZABLE",
  "invalid-start": "INICIO INVALIDO",
  "invalid-goal": "DESTINO INVALIDO",
};
const VISION_LABELS: Readonly<Record<VisionReason, string>> = {
  visible: "VISIBLE",
  "out-of-range": "FUERA DE RANGO",
  "outside-cone": "FUERA DEL CONO",
  occluded: "OCLUIDO",
  "invalid-facing": "DIRECCION INVALIDA",
  concealed: "OCULTO",
};
export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private playerBody!: Phaser.Physics.Arcade.Body;
  private guard!: Phaser.GameObjects.Arc;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private moveUp!: Phaser.Input.Keyboard.Key;
  private moveDown!: Phaser.Input.Keyboard.Key;
  private moveLeft!: Phaser.Input.Keyboard.Key;
  private moveRight!: Phaser.Input.Keyboard.Key;
  private reset!: Phaser.Input.Keyboard.Key;
  private toggleAlgorithm!: Phaser.Input.Keyboard.Key;
  private emitSound!: Phaser.Input.Keyboard.Key;
  private hidePlayer!: Phaser.Input.Keyboard.Key;
  private emitDistractor!: Phaser.Input.Keyboard.Key;
  private navigationGraphics!: Phaser.GameObjects.Graphics;
  private perceptionGraphics!: Phaser.GameObjects.Graphics;
  private targetMarker!: Phaser.GameObjects.Arc;
  private lastKnownMarker!: Phaser.GameObjects.Arc;
  private navigationHud!: Phaser.GameObjects.Text;
  private guardTween: Phaser.Tweens.Tween | null = null;
  private navigationAlgorithm: SearchAlgorithm = "astar";
  private guardSimulation!: GuardSimulationState;
  private perceptionState: PerceptionSimulationState = initialPerceptionState();
  private concealed = false;
  private interactionMessage = "";
  private interactionMessageUntilMs = 0;
  private lastPresentedTransition = "";

  public constructor() {
    super("GameScene");
  }

  public create(): void {
    this.navigationAlgorithm = "astar";
    this.perceptionState = initialPerceptionState();
    this.concealed = false;
    this.interactionMessage = "";
    this.interactionMessageUntilMs = 0;
    this.lastPresentedTransition = "";
    this.guardTween = null;
    this.cameras.main.setBackgroundColor("#10161c");
    this.drawGrid();

    const walls = this.physics.add.staticGroup();
    for (let y = 0; y < GRID_HEIGHT; y += 1) {
      for (let x = 0; x < GRID_WIDTH; x += 1) {
        if (!isWalkable(LAB_MAP, { x, y })) {
          const center = cellCenter({ x, y }, TILE_SIZE);
          const wall = this.add.rectangle(center.x, center.y, TILE_SIZE, TILE_SIZE, 0x27333d);
          wall.setStrokeStyle(1, 0x3a4c58);
          walls.add(wall);
        }
      }
    }

    const spawn = cellCenter(PLAYER_START, TILE_SIZE);
    this.player = this.add.rectangle(spawn.x, spawn.y, 20, 20, 0xe5b454);
    this.player.setStrokeStyle(2, 0xffd98a);
    this.player.setDepth(4);
    this.physics.add.existing(this.player);
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, walls);

    const keyboard = this.input.keyboard;
    if (!keyboard) {
      throw new Error("Keyboard input is unavailable.");
    }

    this.cursors = keyboard.createCursorKeys();
    this.moveUp = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.moveDown = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.moveLeft = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.moveRight = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.reset = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.toggleAlgorithm = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.emitSound = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.hidePlayer = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H);
    this.emitDistractor = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.perceptionGraphics = this.add.graphics().setDepth(1);
    this.navigationGraphics = this.add.graphics().setDepth(2);
    this.drawCoverAndDistractors();
    const guardPosition = cellCenter(GUARD_START, TILE_SIZE);
    this.guard = this.add
      .circle(guardPosition.x, guardPosition.y, 11, 0x6b8afd)
      .setStrokeStyle(2, 0xb9c5ff)
      .setDepth(4);
    this.guardSimulation = initialGuardSimulation(
      LAB_MAP,
      TILE_SIZE,
      GUARD_START,
      GUARD_PATROL_POINTS,
    );
    this.targetMarker = this.add
      .circle(0, 0, 10, 0x000000, 0)
      .setStrokeStyle(3, 0x73c991)
      .setDepth(5);
    this.lastKnownMarker = this.add
      .circle(0, 0, 7, 0x000000, 0)
      .setStrokeStyle(2, 0xe16969)
      .setDepth(5)
      .setVisible(false);

    this.add
      .text(16, 14, "H4 / CONDUCTA DEL GUARDIA", {
        color: "#9eb4c2",
        fontFamily: "monospace",
        fontSize: "14px",
      })
      .setDepth(10);

    this.navigationHud = this.add
      .text(GRID_WIDTH * TILE_SIZE - 16, 14, "", {
        align: "right",
        backgroundColor: "#10161ccc",
        color: "#d9e4ea",
        fontFamily: "monospace",
        fontSize: "13px",
        padding: { x: 8, y: 6 },
      })
      .setOrigin(1, 0)
      .setDepth(10);

    this.renderGuardNavigation();
    const initialFrame = this.updatePerception(0);
    this.drawPerception(initialFrame.vision);
    this.updateTelemetry(0, initialFrame.vision, initialFrame.soundHeard);
  }

  public update(time: number, delta: number): void {
    if (Phaser.Input.Keyboard.JustDown(this.reset)) {
      this.scene.restart();
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.toggleAlgorithm)) {
      this.navigationAlgorithm = this.navigationAlgorithm === "astar" ? "bfs" : "astar";
    }

    if (Phaser.Input.Keyboard.JustDown(this.emitSound)) {
      this.perceptionState = withSoundEvent(this.perceptionState, {
        position: { x: this.player.x, y: this.player.y },
        radius: SOUND_RADIUS,
        emittedAtMs: time,
        durationMs: SOUND_DURATION_MS,
      });
    }

    if (Phaser.Input.Keyboard.JustDown(this.hidePlayer)) {
      this.toggleConcealment(time);
    }
    if (Phaser.Input.Keyboard.JustDown(this.emitDistractor)) {
      this.activateNearestDistractor(time);
    }

    const horizontal = Number(this.cursors.right.isDown || this.moveRight.isDown)
      - Number(this.cursors.left.isDown || this.moveLeft.isDown);
    const vertical = Number(this.cursors.down.isDown || this.moveDown.isDown)
      - Number(this.cursors.up.isDown || this.moveUp.isDown);
    const velocity = new Phaser.Math.Vector2(horizontal, vertical);

    if (velocity.lengthSq() > 0) {
      velocity.normalize().scale(PLAYER_SPEED);
      if (this.concealed) {
        this.concealed = false;
        this.player.setFillStyle(0xe5b454);
        this.interactionMessage = "MOVIMIENTO: OCULTAMIENTO CANCELADO";
        this.interactionMessageUntilMs = time + 1_500;
      }
    }

    this.playerBody.setVelocity(velocity.x, velocity.y);
    const decisionFrame = this.updatePerception(time);
    this.updateGuardMovement(time, delta, decisionFrame);
    const displayFrame = this.updatePerception(time);
    this.applyGuardTransitionFeedback();
    this.drawPerception(displayFrame.vision);
    this.renderGuardNavigation();
    this.updateTelemetry(time, displayFrame.vision, displayFrame.soundHeard);
  }

  private drawGrid(): void {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x1b252d, 1);

    for (let x = 0; x <= GRID_WIDTH; x += 1) {
      graphics.lineBetween(x * TILE_SIZE, 0, x * TILE_SIZE, GRID_HEIGHT * TILE_SIZE);
    }
    for (let y = 0; y <= GRID_HEIGHT; y += 1) {
      graphics.lineBetween(0, y * TILE_SIZE, GRID_WIDTH * TILE_SIZE, y * TILE_SIZE);
    }
  }

  private drawCoverAndDistractors(): void {
    for (const point of COVER_POINTS) {
      const center = cellCenter(point, TILE_SIZE);
      this.add.rectangle(center.x, center.y, TILE_SIZE - 8, TILE_SIZE - 8, 0x36594a, 0.8)
        .setStrokeStyle(2, 0x73c991)
        .setDepth(3);
      this.add.text(center.x, center.y, "H", {
        color: "#d7ffe6",
        fontFamily: "monospace",
        fontSize: "12px",
      }).setOrigin(0.5).setDepth(3);
    }

    for (const point of SOUND_DISTRACTOR_POINTS) {
      const center = cellCenter(point, TILE_SIZE);
      this.add.circle(center.x, center.y, 9, 0xe5b454, 0.9)
        .setStrokeStyle(2, 0xffe1a0)
        .setDepth(3);
      this.add.text(center.x, center.y, "!", {
        color: "#10161c",
        fontFamily: "monospace",
        fontSize: "12px",
        fontStyle: "bold",
      }).setOrigin(0.5).setDepth(4);
    }

    this.add.text(16, 34, "H: ocultarse  E: distractor  Q: sonido propio", {
      color: "#d9e4ea",
      fontFamily: "monospace",
      fontSize: "12px",
    }).setDepth(10);
  }

  private toggleConcealment(time: number): void {
    const cell = worldToCell({ x: this.player.x, y: this.player.y }, TILE_SIZE);
    if (!COVER_POINTS.some((cover) => cellKey(cover) === cellKey(cell))) {
      this.concealed = false;
      this.interactionMessage = "SIN COBERTURA";
    } else {
      this.concealed = !this.concealed;
      this.interactionMessage = this.concealed ? "OCULTO EN COBERTURA" : "EXPUESTO";
    }
    this.interactionMessageUntilMs = time + 1_500;
    this.player.setFillStyle(this.concealed ? 0x526b61 : 0xe5b454);
  }

  private activateNearestDistractor(time: number): void {
    const activation = activateNearestSoundDistractor(
      { x: this.player.x, y: this.player.y },
      SOUND_DISTRACTOR_POINTS.map((point) => cellCenter(point, TILE_SIZE)),
      time,
      DISTRACTOR_INTERACTION_RANGE,
      SOUND_RADIUS,
      SOUND_DURATION_MS,
    );
    if (!activation.event || !activation.result.position) {
      this.interactionMessage = "SIN DISTRACTOR CERCANO";
      this.interactionMessageUntilMs = time + 1_500;
      return;
    }

    this.perceptionState = withSoundEvent(this.perceptionState, activation.event);
    const cell = worldToCell(activation.result.position, TILE_SIZE);
    this.interactionMessage = `DISTRACTOR ${cellKey(cell)} ACTIVADO`;
    this.interactionMessageUntilMs = time + 1_500;
  }

  private applyGuardTransitionFeedback(): void {
    const transition = this.guardSimulation.transitions.at(-1);
    if (!transition) {
      return;
    }
    const key = `${transition.atMs}:${transition.event}:${transition.to}:${this.guardSimulation.transitions.length}`;
    if (key === this.lastPresentedTransition) {
      return;
    }
    this.lastPresentedTransition = key;
    this.guardTween?.stop();
    this.guard.setFillStyle(GUARD_STATE_COLORS[transition.to]).setScale(1);
    this.guardTween = this.tweens.add({
      targets: this.guard,
      scale: 1.2,
      duration: 140,
      yoyo: true,
      ease: "Sine.easeInOut",
    });
  }

  private renderGuardNavigation(): void {
    const result = this.guardSimulation.routeResult;
    this.navigationGraphics.clear();
    if (result) {
      this.drawSearchResult(result);
    }

    const target = this.guardSimulation.behavior.target;
    this.targetMarker.setVisible(target !== null);
    if (target) {
      const targetPosition = cellCenter(target, TILE_SIZE);
      this.targetMarker.setPosition(targetPosition.x, targetPosition.y);
      this.targetMarker.setStrokeStyle(
        3,
        this.guardSimulation.routeFailed ? 0xe16969 : 0x73c991,
      );
    }
  }

  private drawSearchResult(result: SearchResult): void {
    this.navigationGraphics.clear();
    this.navigationGraphics.fillStyle(0x3b819c, 0.22);
    for (const point of result.explored) {
      this.navigationGraphics.fillRect(
        point.x * TILE_SIZE + 3,
        point.y * TILE_SIZE + 3,
        TILE_SIZE - 6,
        TILE_SIZE - 6,
      );
    }

    const firstPoint = result.path[0];
    if (!firstPoint) {
      return;
    }

    const firstCenter = cellCenter(firstPoint, TILE_SIZE);
    this.navigationGraphics.lineStyle(4, 0x62d0e8, 0.9);
    this.navigationGraphics.beginPath();
    this.navigationGraphics.moveTo(firstCenter.x, firstCenter.y);
    for (const point of result.path.slice(1)) {
      const center = cellCenter(point, TILE_SIZE);
      this.navigationGraphics.lineTo(center.x, center.y);
    }
    this.navigationGraphics.strokePath();
  }

  private updateGuardMovement(
    time: number,
    delta: number,
    frame: ReturnType<typeof updatePerceptionSimulation>,
  ): void {
    const soundPosition = frame.soundHeard && frame.state.soundEvent
      ? worldToCell(frame.state.soundEvent.position, TILE_SIZE)
      : null;
    this.guardSimulation = advanceGuardSimulation(this.guardSimulation, {
      map: LAB_MAP,
      tileSize: TILE_SIZE,
      patrolPoints: GUARD_PATROL_POINTS,
      timeMs: time,
      deltaMs: delta,
      speed: GUARD_SPEED,
      algorithm: this.navigationAlgorithm,
      searchDurationMs: SEARCH_DURATION_MS,
      searchRadiusInCells: SEARCH_RADIUS_IN_CELLS,
      patrolPauseDurationMs: PATROL_PAUSE_DURATION_MS,
      visiblePosition: frame.vision.visible
        ? worldToCell({ x: this.player.x, y: this.player.y }, TILE_SIZE)
        : null,
      heardPosition: soundPosition,
      lastKnownPosition: frame.state.memory.lastKnownPosition,
    });
    this.guard.setPosition(
      this.guardSimulation.position.x,
      this.guardSimulation.position.y,
    );
  }

  private updatePerception(time: number): ReturnType<typeof updatePerceptionSimulation> {
    const observer = { x: this.guard.x, y: this.guard.y };
    const target = { x: this.player.x, y: this.player.y };
    const frame = updatePerceptionSimulation(this.perceptionState, {
      map: LAB_MAP,
      tileSize: TILE_SIZE,
      observer,
      facing: this.guardSimulation.facing,
      target,
      visionRange: GUARD_VISION_RANGE,
      fieldOfViewRadians: GUARD_FIELD_OF_VIEW,
      timeMs: time,
      targetConcealed: this.concealed,
    });
    this.perceptionState = frame.state;
    return frame;
  }

  private drawPerception(vision: VisionResult): void {
    this.perceptionGraphics.clear();
    const facingAngle = Math.atan2(
      this.guardSimulation.facing.y,
      this.guardSimulation.facing.x,
    );
    const halfFieldOfView = GUARD_FIELD_OF_VIEW / 2;
    this.perceptionGraphics.fillStyle(VISION_COLORS[vision.reason], 0.16);
    this.perceptionGraphics.beginPath();
    this.perceptionGraphics.moveTo(this.guard.x, this.guard.y);
    this.perceptionGraphics.arc(
      this.guard.x,
      this.guard.y,
      GUARD_VISION_RANGE,
      facingAngle - halfFieldOfView,
      facingAngle + halfFieldOfView,
    );
    this.perceptionGraphics.closePath();
    this.perceptionGraphics.fillPath();
    this.perceptionGraphics.lineStyle(1, VISION_COLORS[vision.reason], 0.65);
    this.perceptionGraphics.strokePath();

    if (this.perceptionState.soundEvent) {
      this.perceptionGraphics.lineStyle(2, 0xe5b454, 0.8);
      this.perceptionGraphics.strokeCircle(
        this.perceptionState.soundEvent.position.x,
        this.perceptionState.soundEvent.position.y,
        this.perceptionState.soundEvent.radius,
      );
    }

    const lastKnown = this.perceptionState.memory.lastKnownPosition;
    this.lastKnownMarker.setVisible(lastKnown !== null);
    if (lastKnown) {
      this.lastKnownMarker.setPosition(lastKnown.x, lastKnown.y);
    }
  }

  private updateTelemetry(time: number, vision: VisionResult, soundHeard: boolean): void {
    const age = timeSinceLastPerception(this.perceptionState.memory, time);
    const memory = age === null
      ? "memoria -"
      : `memoria ${this.perceptionState.memory.source} ${(age / 1000).toFixed(1)}s`;
    const sound = this.perceptionState.soundEvent
      ? (soundHeard ? "OIDO" : "FUERA DE RANGO")
      : "-";
    const status = guardNavigationStatus(this.guardSimulation);
    const navigation = status === "idle" ? "SIN DESTINO" : STATUS_LABELS[status];
    const lastTransition = this.guardSimulation.transitions.at(-1);
    const transitionText = this.guardSimulation.transitions
      .slice(-3)
      .map((transition) =>
        `${transition.from ?? "INICIO"}>${transition.to} ${transition.event}`,
      );
    const route = this.guardSimulation.routeResult;
    const routeSummary = route
      ? `${route.algorithm.toUpperCase()} / ${navigation} costo ${route.totalCost ?? "-"} nodos ${route.expandedNodes}`
      : `RUTA / ${navigation}`;
    const interaction = time <= this.interactionMessageUntilMs
      ? this.interactionMessage
      : this.concealed
        ? "OCULTO EN COBERTURA"
        : "H: ocultarse | E: distractor | Q: sonido";

    this.navigationHud.setText([
      `estado ${this.guardSimulation.behavior.mode.toUpperCase()}`,
      routeSummary,
      ...transitionText.map((transition) => `evento ${transition}`),
      ...(lastTransition ? [`causa ${lastTransition.reason.slice(0, 48)}`] : []),
      `vision ${VISION_LABELS[vision.reason]}`,
      `sonido ${sound}`,
      memory,
      interaction,
    ]);
  }
}
