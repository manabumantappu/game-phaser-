import { LEVELS } from "../data/levels.js";
import VirtualJoystick from "../ui/VirtualJoystick.js";

const TILE = 32;
const HUD_HEIGHT = 80;
const MOVE_TIME = 180;
const POWER_TIME = 6000;

const MAP_WIDTH = 13 * TILE;
const MAP_OFFSET_X = (480 - MAP_WIDTH) / 2;

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
    this.lives = data.lives ?? 3;

    this.tileX = 0;
    this.tileY = 0;
    this.moving = false;

    this.currentDir = { x: 0, y: 0 };
    this.nextDir = { x: 0, y: 0 };

    this.isPaused = false;
    this.isMuted = false;
    this.frightened = false;
  }

  /* =====================
     CREATE
  ===================== */
  create() {
    this.level = LEVELS[this.levelIndex];
    if (!this.level) {
      this.scene.start("MenuScene");
      return;
    }

    this.cursors = this.input.keyboard.createCursorKeys();

    // 🎮 joystick tengah bawah
    this.joystick = new VirtualJoystick(this, {
      x: this.scale.width / 2,
      y: this.scale.height - 120
    });

    /* 🔊 AUDIO SAFE */
    this.sfxCollect = this.sound.add("collect", { volume: 0.6 });
    this.sfxFrightened = this.sound.add("frightened", { loop: true, volume: 0.5 });

    if (!this.sound.get("bgm")) {
      this.bgm = this.sound.add("bgm", { loop: true, volume: 0.4 });
      this.bgm.play();
    }

    this.buildMap();
    this.createPlayer();
    this.createGhosts();
    this.createHUD();
    this.createUI();
  }

  /* =====================
     MAP
  ===================== */
  buildMap() {
    this.pellets = [];
    this.totalPellets = 0;

    this.mapWidth = this.level.map[0].length;
    this.mapHeight = this.level.map.length;

    this.level.map.forEach((row, y) => {
      this.pellets[y] = [];
      [...row].forEach((cell, x) => {
        const px = MAP_OFFSET_X + x * TILE + TILE / 2;
        const py = HUD_HEIGHT + y * TILE + TILE / 2;

        if (cell === "1") {
          this.add.image(px, py, "wall").setDisplaySize(TILE, TILE);
          this.pellets[y][x] = null;
        } else if (cell === "0" || cell === "2") {
          const p = this.add.image(px, py, "pellet");
          p.setDisplaySize(cell === "2" ? 18 : 10);
          p.isPower = cell === "2";
          if (p.isPower) p.setTint(0x00ff00);
          this.pellets[y][x] = p;
          this.totalPellets++;
        } else {
          this.pellets[y][x] = null;
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
      MAP_OFFSET_X + this.tileX * TILE + TILE / 2,
      HUD_HEIGHT + this.tileY * TILE + TILE / 2,
      "pacman"
    ).setDisplaySize(28, 28);
  }

  /* =====================
     GHOSTS
  ===================== */
  createGhosts() {
    this.ghosts = [];

    this.level.ghosts.forEach(g => {
      const ghost = {
        tileX: g.x,
        tileY: g.y,
        sprite: this.add.sprite(
          MAP_OFFSET_X + g.x * TILE + TILE / 2,
          HUD_HEIGHT + g.y * TILE + TILE / 2,
          "ghost"
        ).setDisplaySize(28, 28),
        moving: false
      };
      this.ghosts.push(ghost);
    });
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

    this.txtScore = this.add.text(12, 24, `SCORE ${this.score}`, {
      fontSize: "18px",
      color: "#ffff00"
    });

    this.txtLives = this.add.text(
      this.scale.width / 2,
      24,
      `❤️ ${this.lives}`,
      { fontSize: "18px", color: "#ff4444" }
    ).setOrigin(0.5, 0);

    this.txtLevel = this.add.text(
      this.scale.width - 12,
      24,
      `L${this.levelIndex + 1}`,
      { fontSize: "18px", color: "#ffffff" }
    ).setOrigin(1, 0);
  }

  updateHUD() {
    this.txtScore.setText(`SCORE ${this.score}`);
    this.txtLives.setText(`❤️ ${this.lives}`);
  }

  /* =====================
     UI (PAUSE, MUTE, TEXT)
  ===================== */
  createUI() {
    // pause
    const pause = this.add.text(12, this.scale.height - 40, "⏸", {
      fontSize: "22px"
    }).setInteractive();

    pause.on("pointerdown", () => {
      this.isPaused = !this.isPaused;
    });

    // mute
    const mute = this.add.text(this.scale.width - 40, this.scale.height - 40, "🔊", {
      fontSize: "22px"
    }).setInteractive();

    mute.on("pointerdown", () => {
      this.isMuted = !this.isMuted;
      this.sound.mute = this.isMuted;
      mute.setText(this.isMuted ? "🔇" : "🔊");
    });

    // marquee
    this.marquee = this.add.text(
      this.scale.width,
      this.scale.height - 40,
      "GOOD LUCK!",
      { fontSize: "14px", color: "#ffffff" }
    );

    this.tweens.add({
      targets: this.marquee,
      x: -120,
      duration: 8000,
      repeat: -1
    });
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
        this.nextDir = { x: Math.sign(this.joystick.forceX), y: 0 };
      } else {
        this.nextDir = { x: 0, y: Math.sign(this.joystick.forceY) };
      }
    }
  }

  canMove(x, y) {
    if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) return false;
    return this.level.map[y][x] !== "1";
  }

  /* =====================
     UPDATE
  ===================== */
  update() {
    if (this.isPaused) return;

    this.readInput();

    if (!this.moving) {
      if (this.canMove(this.tileX + this.nextDir.x, this.tileY + this.nextDir.y)) {
        this.startMove(this.nextDir);
      } else if (this.canMove(this.tileX + this.currentDir.x, this.tileY + this.currentDir.y)) {
        this.startMove(this.currentDir);
      }
    }
  }

  startMove(dir) {
    this.moving = true;
    this.currentDir = dir;

    const tx = this.tileX + dir.x;
    const ty = this.tileY + dir.y;

    this.tweens.add({
      targets: this.player,
      x: MAP_OFFSET_X + tx * TILE + TILE / 2,
      y: HUD_HEIGHT + ty * TILE + TILE / 2,
      duration: MOVE_TIME,
      onComplete: () => {
        this.tileX = tx;
        this.tileY = ty;
        this.moving = false;

        const pellet = this.pellets[ty]?.[tx];
        if (pellet) {
          pellet.destroy();
          this.pellets[ty][tx] = null;
          this.totalPellets--;
          this.score += pellet.isPower ? 50 : 10;
          this.sfxCollect.play();
          this.updateHUD();
        }
      }
    });
  }
}
