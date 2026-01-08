import { LEVELS } from "../data/levels.js";
import VirtualJoystick from "../ui/VirtualJoystick.js";
import { LEVELS } from "../data/levels.js";
import VirtualJoystick from "../ui/VirtualJoystick.js";

const TILE = 32;
const HUD_HEIGHT = 56;
const MOVE_DURATION = 220; // kecepatan pacman

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  /* =====================
     INIT
  ===================== */
  init(data) {
    this.levelIndex = data.level ?? 0;
    this.score = data.score ?? 0;

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

    // unlock audio (mobile)
    this.input.once("pointerdown", () => {
      if (this.sound.context.state === "suspended") {
        this.sound.context.resume();
      }
    });

    // sound
    this.sfxCollect = this.sound.add("collect", { volume: 0.8 });
    this.sfxLevelClear = this.sound.add("levelclear", { volume: 0.9 });

    this.buildMap();
    this.createPlayer();
    this.createHUD();
  }

  /* =====================
     HUD
  ===================== */
  createHUD() {
    this.add.rectangle(
      this.scale.width / 2,
      HUD_HEIGHT / 2,
      this.scale.width,
      HUD_HEIGHT,
      0x000000,
      0.6
    );

    this.hudScore = this.add.text(
      10,
      16,
      `SCORE: ${this.score}`,
      { fontSize: "18px", color: "#ffff00", fontStyle: "bold" }
    );

    this.hudLevel = this.add.text(
      this.scale.width - 10,
      16,
      `LEVEL: ${this.levelIndex + 1}`,
      { fontSize: "18px", color: "#ffffff", fontStyle: "bold" }
    ).setOrigin(1, 0);
  }

  updateHUD() {
    this.hudScore.setText(`SCORE: ${this.score}`);
  }

  /* =====================
     MAP & PELLET
  ===================== */
  buildMap() {
    this.pellets = [];
    this.totalPellets = 0;

    this.level.map.forEach((row, y) => {
      this.pellets[y] = [];

      [...row].forEach((cell, x) => {
        const px = x * TILE + TILE / 2;
        const py = HUD_HEIGHT + y * TILE + TILE / 2;

        if (cell === "1") {
          this.add.image(px, py, "wall").setDisplaySize(TILE, TILE);
          this.pellets[y][x] = null;
        }

        if (cell === "0") {
          const pellet = this.add.image(px, py, "pellet");
          pellet.setDisplaySize(8, 8);
          this.pellets[y][x] = pellet;
          this.totalPellets++;
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
    ).setDisplaySize(28, 28);
  }

  /* =====================
     INPUT
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

    const tx = this.tileX + dir.x;
    const ty = this.tileY + dir.y;

    this.tweens.add({
      targets: this.player,
      x: tx * TILE + TILE / 2,
      y: HUD_HEIGHT + ty * TILE + TILE / 2,
      duration: MOVE_DURATION,
      ease: "Linear",
      onComplete: () => {
        this.tileX = tx;
        this.tileY = ty;
        this.moving = false;

        // makan pellet
        const pellet = this.pellets[ty]?.[tx];
        if (pellet) {
          pellet.destroy();
          this.pellets[ty][tx] = null;
          this.totalPellets--;
          this.score += 10;
          this.updateHUD();
          this.sfxCollect.play();
        }

        // win
        if (this.totalPellets === 0) {
          this.levelClear();
        }
      }
    });

    // rotasi
    if (dir.x < 0) this.player.setAngle(180);
    else if (dir.x > 0) this.player.setAngle(0);
    else if (dir.y < 0) this.player.setAngle(270);
    else if (dir.y > 0) this.player.setAngle(90);
  }

  /* =====================
     LEVEL CLEAR
  ===================== */
  levelClear() {
    this.sfxLevelClear.play();

    const text = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2,
      "LEVEL CLEAR",
      {
        fontSize: "36px",
        color: "#ffff00",
        fontStyle: "bold"
      }
    ).setOrigin(0.5);

    this.time.delayedCall(1200, () => {
      this.scene.start("GameScene", {
        level: this.levelIndex + 1,
        score: this.score
      });
    });
  }

  /* =====================
     UPDATE
  ===================== */
  update() {
    this.readInput();
    if (this.moving) return;

    if (this.canMove(this.nextDir)) {
      this.startMove(this.nextDir);
    } else if (this.canMove(this.currentDir)) {
      this.startMove(this.currentDir);
    }
  }
}

const TILE = 32;
const HUD_HEIGHT = 56;
const MOVE_DURATION = 220; // kecepatan pacman

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  /* =====================
     INIT
  ===================== */
  init(data) {
    this.levelIndex = data.level ?? 0;
    this.score = data.score ?? 0;

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

    // unlock audio (mobile)
    this.input.once("pointerdown", () => {
      if (this.sound.context.state === "suspended") {
        this.sound.context.resume();
      }
    });

    // sound
    this.sfxCollect = this.sound.add("collect", { volume: 0.8 });
    this.sfxLevelClear = this.sound.add("levelclear", { volume: 0.9 });

    this.buildMap();
    this.createPlayer();
    this.createHUD();
  }

  /* =====================
     HUD
  ===================== */
  createHUD() {
    this.add.rectangle(
      this.scale.width / 2,
      HUD_HEIGHT / 2,
      this.scale.width,
      HUD_HEIGHT,
      0x000000,
      0.6
    );

    this.hudScore = this.add.text(
      10,
      16,
      `SCORE: ${this.score}`,
      { fontSize: "18px", color: "#ffff00", fontStyle: "bold" }
    );

    this.hudLevel = this.add.text(
      this.scale.width - 10,
      16,
      `LEVEL: ${this.levelIndex + 1}`,
      { fontSize: "18px", color: "#ffffff", fontStyle: "bold" }
    ).setOrigin(1, 0);
  }

  updateHUD() {
    this.hudScore.setText(`SCORE: ${this.score}`);
  }

  /* =====================
     MAP & PELLET
  ===================== */
  buildMap() {
    this.pellets = [];
    this.totalPellets = 0;

    this.level.map.forEach((row, y) => {
      this.pellets[y] = [];

      [...row].forEach((cell, x) => {
        const px = x * TILE + TILE / 2;
        const py = HUD_HEIGHT + y * TILE + TILE / 2;

        if (cell === "1") {
          this.add.image(px, py, "wall").setDisplaySize(TILE, TILE);
          this.pellets[y][x] = null;
        }

        if (cell === "0") {
          const pellet = this.add.image(px, py, "pellet");
          pellet.setDisplaySize(8, 8);
          this.pellets[y][x] = pellet;
          this.totalPellets++;
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
    ).setDisplaySize(28, 28);
  }

  /* =====================
     INPUT
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

    const tx = this.tileX + dir.x;
    const ty = this.tileY + dir.y;

    this.tweens.add({
      targets: this.player,
      x: tx * TILE + TILE / 2,
      y: HUD_HEIGHT + ty * TILE + TILE / 2,
      duration: MOVE_DURATION,
      ease: "Linear",
      onComplete: () => {
        this.tileX = tx;
        this.tileY = ty;
        this.moving = false;

        // makan pellet
        const pellet = this.pellets[ty]?.[tx];
        if (pellet) {
          pellet.destroy();
          this.pellets[ty][tx] = null;
          this.totalPellets--;
          this.score += 10;
          this.updateHUD();
          this.sfxCollect.play();
        }

        // win
        if (this.totalPellets === 0) {
          this.levelClear();
        }
      }
    });

    // rotasi
    if (dir.x < 0) this.player.setAngle(180);
    else if (dir.x > 0) this.player.setAngle(0);
    else if (dir.y < 0) this.player.setAngle(270);
    else if (dir.y > 0) this.player.setAngle(90);
  }

  /* =====================
     LEVEL CLEAR
  ===================== */
  levelClear() {
    this.sfxLevelClear.play();

    const text = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2,
      "LEVEL CLEAR",
      {
        fontSize: "36px",
        color: "#ffff00",
        fontStyle: "bold"
      }
    ).setOrigin(0.5);

    this.time.delayedCall(1200, () => {
      this.scene.start("GameScene", {
        level: this.levelIndex + 1,
        score: this.score
      });
    });
  }

  /* =====================
     UPDATE
  ===================== */
  update() {
    this.readInput();
    if (this.moving) return;

    if (this.canMove(this.nextDir)) {
      this.startMove(this.nextDir);
    } else if (this.canMove(this.currentDir)) {
      this.startMove(this.currentDir);
    }
  }
}
