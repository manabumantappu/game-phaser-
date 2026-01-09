import { LEVELS } from "../data/levels.js";
import VirtualJoystick from "../ui/VirtualJoystick.js";

/* =====================
   CONSTANTS (STABLE)
===================== */
const TILE = 32;
const HUD_HEIGHT = 80;

const PLAYER_SPEED = 180;
const GHOST_BASE_SPEED = 150;
const POWER_TIME = 6000;

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

    this.isPaused = false;
    this.isMuted = false;
    this.frightened = false;

    this.currentDir = { x: 0, y: 0 };
    this.nextDir = { x: 0, y: 0 };
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
    this.joystick = new VirtualJoystick(this);

    /* ===== AUDIO SAFE ===== */
    this.sfxCollect = this.sound.add("collect", { volume: 0.7 });
    this.sfxClick = this.sound.add("click", { volume: 0.6 });
    this.sfxFrightened = this.sound.add("frightened", { loop: true, volume: 0.5 });
    this.sfxLevelClear = this.sound.add("levelclear", { volume: 0.8 });

    if (!this.sound.get("bgm")) {
      this.bgm = this.sound.add("bgm", { loop: true, volume: 0.4 });
      this.bgm.play();
    }

    this.buildMap();
    this.createPlayer();
    this.createGhosts();
    this.createHUD();
    this.createUIButtons();
  }

  /* =====================
     MAP
  ===================== */
  buildMap() {
    this.walls = this.physics.add.staticGroup();
    this.pellets = this.physics.add.group();

    this.mapWidth = this.level.map[0].length;
    this.mapHeight = this.level.map.length;

    this.level.map.forEach((row, y) => {
      [...row].forEach((cell, x) => {
        const px = x * TILE + TILE / 2;
        const py = HUD_HEIGHT + y * TILE + TILE / 2;

        if (cell === "1") {
          const w = this.walls.create(px, py, "wall");
          w.setDisplaySize(TILE, TILE).refreshBody();
        }

        if (cell === "0" || cell === "2") {
          const p = this.pellets.create(px, py, "pellet");
          p.setDisplaySize(cell === "2" ? 18 : 10, cell === "2" ? 18 : 10);
          p.isPower = cell === "2";
          if (p.isPower) p.setTint(0x00ff00); // 🟢 power pellet
        }
      });
    });
  }

  /* =====================
     PLAYER
  ===================== */
  createPlayer() {
    const { x, y } = this.level.player;

    this.player = this.physics.add.sprite(
      x * TILE + TILE / 2,
      HUD_HEIGHT + y * TILE + TILE / 2,
      "pacman"
    );

    this.player.setDisplaySize(28, 28);
    this.player.setCollideWorldBounds(false);

    this.physics.add.collider(this.player, this.walls);
    this.physics.add.overlap(this.player, this.pellets, this.onEatPellet, null, this);
  }

  /* =====================
     GHOSTS
  ===================== */
  createGhosts() {
    this.ghosts = this.physics.add.group();
    const speedBonus = Math.min(this.levelIndex * 12, 100);

    this.level.ghosts.forEach(g => {
      const ghost = this.ghosts.create(
        g.x * TILE + TILE / 2,
        HUD_HEIGHT + g.y * TILE + TILE / 2,
        "ghost"
      );

      ghost.setDisplaySize(28, 28);
      ghost.spawnX = ghost.x;
      ghost.spawnY = ghost.y;
      ghost.baseSpeed = GHOST_BASE_SPEED + speedBonus;

      this.physics.add.collider(ghost, this.walls);
    });

    this.physics.add.overlap(this.player, this.ghosts, this.onHitGhost, null, this);
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
      color: "#ffff00",
      fontStyle: "bold"
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
     UI BUTTONS
  ===================== */
  createUIButtons() {
    // MUTE
    const mute = this.add.text(
      this.scale.width - 44,
      this.scale.height - 40,
      "🔊",
      { fontSize: "22px" }
    ).setInteractive();

    mute.on("pointerdown", () => {
      this.isMuted = !this.isMuted;
      this.sound.mute = this.isMuted;
      mute.setText(this.isMuted ? "🔇" : "🔊");
    });

    // PAUSE
    const pause = this.add.text(
      12,
      this.scale.height - 40,
      "⏸",
      { fontSize: "22px" }
    ).setInteractive();

    pause.on("pointerdown", () => {
      this.isPaused = !this.isPaused;
      this.physics.world.isPaused = this.isPaused;
    });

    // marquee
    const marquee = this.add.text(
      this.scale.width / 2,
      this.scale.height - 40,
      "GOOD LUCK!",
      { fontSize: "14px", color: "#ffffff" }
    ).setOrigin(0.5);

    this.tweens.add({
      targets: marquee,
      x: { from: this.scale.width + 100, to: -100 },
      duration: 9000,
      repeat: -1
    });
  }

  /* =====================
     UPDATE
  ===================== */
  update() {
    if (this.isPaused) return;

  this.nextDir = { x: 0, y: 0 };

// KEYBOARD
if (this.cursors.left?.isDown) this.nextDir = { x: -1, y: 0 };
else if (this.cursors.right?.isDown) this.nextDir = { x: 1, y: 0 };
else if (this.cursors.up?.isDown) this.nextDir = { x: 0, y: -1 };
else if (this.cursors.down?.isDown) this.nextDir = { x: 0, y: 1 };

// JOYSTICK
if (this.joystick && (this.joystick.forceX || this.joystick.forceY)) {
  if (Math.abs(this.joystick.forceX) > Math.abs(this.joystick.forceY)) {
    this.nextDir = { x: Math.sign(this.joystick.forceX), y: 0 };
  } else {
    this.nextDir = { x: 0, y: Math.sign(this.joystick.forceY) };
  }
}

this.player.setVelocity(
  this.nextDir.x * PLAYER_SPEED,
  this.nextDir.y * PLAYER_SPEED
);


    // simpan arah terakhir
    if (this.nextDir.x !== 0 || this.nextDir.y !== 0) {
      this.currentDir = this.nextDir;
    }

    this.player.setVelocity(
      this.currentDir.x * PLAYER_SPEED,
      this.currentDir.y * PLAYER_SPEED
    );

    this.moveGhosts();
  }

  /* =====================
     GHOST MOVE
  ===================== */
  moveGhosts() {
    this.ghosts.children.iterate(g => {
      this.physics.moveToObject(
        g,
        this.player,
        this.frightened ? g.baseSpeed * 0.45 : g.baseSpeed
      );
    });
  }

  /* =====================
     EVENTS
  ===================== */
  onEatPellet(player, pellet) {
    pellet.destroy();
    this.score += pellet.isPower ? 50 : 10;
    this.updateHUD();
    this.sfxCollect.play();

    if (pellet.isPower) this.startFrightened();
    if (this.pellets.countActive(true) === 0) this.levelClear();
  }

  startFrightened() {
    this.frightened = true;

    if (this.bgm.isPlaying) this.bgm.pause();
    if (!this.sfxFrightened.isPlaying) this.sfxFrightened.play();

    this.ghosts.children.iterate(g => g.setTint(0x0000ff));

    this.time.delayedCall(POWER_TIME, () => {
      this.frightened = false;
      this.sfxFrightened.stop();
      this.bgm.resume();
      this.ghosts.children.iterate(g => g.clearTint());
    });
  }

  onHitGhost(player, ghost) {
    if (this.frightened) {
      ghost.setPosition(ghost.spawnX, ghost.spawnY);
      this.score += 200;
      this.updateHUD();
    } else {
      this.lives--;
      this.updateHUD();

      if (this.lives <= 0) {
        this.scene.start("MenuScene");
      } else {
        this.scene.restart({
          level: this.levelIndex,
          score: this.score,
          lives: this.lives
        });
      }
    }
  }

  levelClear() {
    this.player.setVelocity(0);
    this.sfxLevelClear.play();

    const txt = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2,
      "LEVEL CLEAR",
      { fontSize: "36px", color: "#ffff00", fontStyle: "bold" }
    ).setOrigin(0.5);

    this.time.delayedCall(1200, () => {
      this.scene.start("GameScene", {
        level: this.levelIndex + 1,
        score: this.score,
        lives: this.lives
      });
    });
  }
}
