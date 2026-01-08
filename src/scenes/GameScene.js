import { LEVELS } from "../data/levels.js";
import VirtualJoystick from "../ui/VirtualJoystick.js";

const TILE = 32;
const HUD_HEIGHT = 56;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  /* =====================
     INIT
  ===================== */
  init(data) {
    this.levelIndex = data.level ?? 0;

    this.currentDir = { x: 0, y: 0 };
    this.nextDir = { x: 0, y: 0 };

    this.tileX = 0;
    this.tileY = 0;
    this.moving = false;
  }

  /* =====================
     CREATE
  ===================== */
  create() {
    this.level = LEVELS[this.levelIndex];

    this.cursors = this.input.keyboard.createCursorKeys();
    this.joystick = new VirtualJoystick(this);

    this.buildMap();
    this.createPlayer();
  }

  /* =====================
     MAP
  ===================== */
  buildMap() {
    this.walls = this.add.group();

    this.level.map.forEach((row, y) => {
      [...row].forEach((cell, x) => {
        if (cell === "1") {
          this.add.image(
            x * TILE + TILE / 2,
            HUD_HEIGHT + y * TILE + TILE / 2,
            "wall"
          ).setDisplaySize(TILE, TILE);
        }
      });
    });
  }

  /* =====================
     PLAYER
  ===================== */
  createPlayer() {
    this.tileX = this.level.player.x;
    this.tileY = this.level.player.y;

    this.player = this.add.sprite(
      this.tileX * TILE + TILE / 2,
      HUD_HEIGHT + this.tileY * TILE + TILE / 2,
      "pacman"
    );

    this.player.setDisplaySize(28, 28);
  }

  /* =====================
     INPUT BUFFER
  ===================== */
  readInput() {
    if (this.cursors.left.isDown) this.nextDir = { x: -1, y: 0 };
    else if (this.cursors.right.isDown) this.nextDir = { x: 1, y: 0 };
    else if (this.cursors.up.isDown) this.nextDir = { x: 0, y: -1 };
    else if (this.cursors.down.isDown) this.nextDir = { x: 0, y: 1 };

    if (this.joystick.forceX || this.joystick.forceY) {
      if (Math.abs(this.joystick.forceX) > Math.abs(this.joystick.forceY)) {
        this.nextDir = { x: this.joystick.forceX > 0 ? 1 : -1, y: 0 };
      } else {
        this.nextDir = { x: 0, y: this.joystick.forceY > 0 ? 1 : -1 };
      }
    }
  }

  /* =====================
     GRID CHECK
  ===================== */
  canMove(dir) {
    if (!dir || (dir.x === 0 && dir.y === 0)) return false;

    const nx = this.tileX + dir.x;
    const ny = this.tileY + dir.y;

    if (
      ny < 0 ||
      ny >= this.level.map.length ||
      nx < 0 ||
      nx >= this.level.map[0].length
    ) return false;

    return this.level.map[ny][nx] !== "1";
  }

  /* =====================
     MOVE 1 TILE
  ===================== */
  startMove(dir) {
    this.currentDir = dir;
    this.moving = true;

    const targetX = this.tileX + dir.x;
    const targetY = this.tileY + dir.y;

    this.tweens.add({
      targets: this.player,
      x: targetX * TILE + TILE / 2,
      y: HUD_HEIGHT + targetY * TILE + TILE / 2,
      duration: 140,
      ease: "Linear",
      onComplete: () => {
        this.tileX = targetX;
        this.tileY = targetY;
        this.moving = false;
      }
    });

    // ROTASI
    if (dir.x < 0) this.player.setAngle(180);
    else if (dir.x > 0) this.player.setAngle(0);
    else if (dir.y < 0) this.player.setAngle(270);
    else if (dir.y > 0) this.player.setAngle(90);
  }

  /* =====================
     UPDATE
  ===================== */
  update() {
    this.readInput();

    if (this.moving) return;

    // PRIORITAS BEL0K
    if (this.canMove(this.nextDir)) {
      this.startMove(this.nextDir);
    }
    // LANJUTKAN ARAH LAMA
    else if (this.canMove(this.currentDir)) {
      this.startMove(this.currentDir);
    }
  }
}
