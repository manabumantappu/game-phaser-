import { LEVELS } from "../data/levels.js";
import VirtualJoystick from "../ui/VirtualJoystick.js";

/* =====================
   CONSTANTS
===================== */
const TILE = 32;
const HUD_HEIGHT = 80;
const MOVE_TIME = 260;
const POWER_TIME = 6000;

/* =====================
   GAME SCENE
===================== */
export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  /* =====================
     INIT
  ===================== */
  init(data = {}) {
    this.levelIndex = data.level ?? 0;
    this.score = data.score ?? 0;
    this.lives = data.lives ?? 3;

    this.tx = 0;
    this.ty = 0;
    this.moving = false;

    this.dir = { x: 0, y: 0 };
    this.nextDir = { x: 0, y: 0 };

    this.frightened = false;
    this.frightTimer = null;

    this.ghostSpeedBonus = Math.min(this.levelIndex * 20, 160);

    this.ghosts = [];
    this.isPaused = false;
    this.isMuted = false;
  }

  /* =====================
     CREATE
  ===================== */
  create() {
    // === LEVEL SAFETY ===
    this.level = LEVELS[this.levelIndex];
    if (!this.level) {
      console.error("LEVEL NOT FOUND");
      return;
    }

    // === INPUT ===
    this.cursors = this.input.keyboard.createCursorKeys();

    // === JOYSTICK (SAFE) ===
    try {
      this.joystick = new VirtualJoystick(this);
    } catch (e) {
      console.warn("Joystick disabled:", e);
      this.joystick = null;
    }

    // === AUDIO SAFE ===
    this.safeAudio("bgm", true, 0.4);
    this.sfxCollect = this.safeAudio("collect");
    this.sfxPower = this.safeAudio("click");
    this.sfxFright = this.safeAudio("frightened", true, 0.5);

    // === BUILD WORLD ===
    this.buildMap();
    this.createPlayer();
    this.createGhosts();
    this.createHUD();
    this.createUIButtons();
    this.createRunningText();
  }

  /* =====================
     SAFE AUDIO
  ===================== */
  safeAudio(key, loop = false, volume = 0.8) {
    try {
      let s = this.sound.get(key);
      if (!s) {
        s = this.sound.add(key, { loop, volume });
        if (loop) s.play();
      }
      return s;
    } catch {
      return null;
    }
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

    this.txtScore = this.add.text(12, 22, "", { color: "#ffff00" });
    this.txtLives = this.add.text(this.scale.width / 2, 22, "", { color: "#ff4444" }).setOrigin(0.5, 0);
    this.txtLevel = this.add.text(this.scale.width - 12, 22, "", { color: "#ffffff" }).setOrigin(1, 0);

    this.updateHUD();
  }

  updateHUD() {
    this.txtScore.setText(`SCORE ${this.score}`);
    this.txtLives.setText(`❤️ ${this.lives}`);
    this.txtLevel.setText(`L${this.levelIndex + 1}`);
  }

  /* =====================
     UI BUTTONS
  ===================== */
  createUIButtons() {
    // PAUSE
    const pauseBtn = this.add.text(12, HUD_HEIGHT - 24, "⏸", { fontSize: "18px" })
      .setInteractive()
      .on("pointerdown", () => {
        this.isPaused = !this.isPaused;
      });

    // MUTE
    const muteBtn = this.add.text(40, HUD_HEIGHT - 24, "🔊", { fontSize: "18px" })
      .setInteractive()
      .on("pointerdown", () => {
        this.isMuted = !this.isMuted;
        this.sound.mute = this.isMuted;
        muteBtn.setText(this.isMuted ? "🔇" : "🔊");
      });
  }

  /* =====================
     RUNNING TEXT
  ===================== */
  createRunningText() {
    const txt = this.add.text(
      this.scale.width - 10,
      this.scale.height - 40,
      "MANABU MANTAPPU",
      { color: "#ffffff" }
    ).setOrigin(1, 0);

    this.tweens.add({
      targets: txt,
      x: -200,
      duration: 8000,
      repeat: -1
    });
  }

  /* =====================
     MAP
  ===================== */
  buildMap() {
    this.pellets = [];
    this.totalPellets = 0;

    this.mapW = this.level.map[0].length;
    this.mapH = this.level.map.length;

    this.level.map.forEach((row, y) => {
      this.pellets[y] = [];
      [...row].forEach((c, x) => {
        const px = x * TILE + TILE / 2;
        const py = HUD_HEIGHT + y * TILE + TILE / 2;

        if (c === "1") {
          this.add.image(px, py, "wall").setDisplaySize(TILE, TILE);
        } else if (c === "0" || c === "2") {
          const p = this.add.image(px, py, "pellet");
          p.isPower = c === "2";
          if (p.isPower) p.setTint(0x00ff00);
          this.pellets[y][x] = p;
          this.totalPellets++;
        }
      });
    });
  }

  /* =====================
     PLAYER
  ===================== */
  createPlayer() {
    this.tx = this.level.player.x;
    this.ty = this.level.player.y;

    this.player = this.add.sprite(
      this.tx * TILE + TILE / 2,
      HUD_HEIGHT + this.ty * TILE + TILE / 2,
      "pacman"
    );
  }

  /* =====================
     GHOSTS
  ===================== */
  createGhosts() {
    this.ghosts = this.level.ghosts.map(g => ({
      tx: g.x,
      ty: g.y,
      sx: g.x,
      sy: g.y,
      type: g.type || "blinky",
      moving: false,
      s: this.add.sprite(
        g.x * TILE + TILE / 2,
        HUD_HEIGHT + g.y * TILE + TILE / 2,
        "ghost"
      )
    }));
  }

  /* =====================
     INPUT
  ===================== */
  readInput() {
    if (this.cursors.left.isDown) this.nextDir = { x: -1, y: 0 };
    else if (this.cursors.right.isDown) this.nextDir = { x: 1, y: 0 };
    else if (this.cursors.up.isDown) this.nextDir = { x: 0, y: -1 };
    else if (this.cursors.down.isDown) this.nextDir = { x: 0, y: 1 };

    if (this.joystick) {
      const fx = this.joystick.forceX;
      const fy = this.joystick.forceY;
      if (Math.abs(fx) > Math.abs(fy)) this.nextDir = { x: Math.sign(fx), y: 0 };
      else if (Math.abs(fy) > 0) this.nextDir = { x: 0, y: Math.sign(fy) };
    }
  }

  /* =====================
     GRID CHECK
  ===================== */
  canMove(x, y) {
    if (x < 0) x = this.mapW - 1;
    if (x >= this.mapW) x = 0;
    if (y < 0 || y >= this.mapH) return false;
    return this.level.map[y][x] !== "1";
  }

  /* =====================
     UPDATE
  ===================== */
  update() {
    if (this.isPaused) return;

    this.readInput();

    if (!this.moving && this.canMove(this.tx + this.nextDir.x, this.ty + this.nextDir.y)) {
      this.movePlayer(this.nextDir);
    }

    this.moveGhosts();
  }

  /* =====================
     MOVE PLAYER
  ===================== */
  movePlayer(d) {
    this.moving = true;
    this.dir = d;

    let nx = this.tx + d.x;
    let ny = this.ty + d.y;

    if (nx < 0) nx = this.mapW - 1;
    if (nx >= this.mapW) nx = 0;

    this.tweens.add({
      targets: this.player,
      x: nx * TILE + TILE / 2,
      y: HUD_HEIGHT + ny * TILE + TILE / 2,
      duration: MOVE_TIME,
      onComplete: () => {
        this.tx = nx;
        this.ty = ny;
        this.moving = false;

        const p = this.pellets[ny]?.[nx];
        if (p) {
          p.destroy();
          this.pellets[ny][nx] = null;
          this.totalPellets--;
          this.score += p.isPower ? 50 : 10;
          if (p.isPower) this.startFrightened();
          this.updateHUD();
        }

        if (this.totalPellets === 0) this.levelClear();
      }
    });
  }

  /* =====================
     GHOST MOVE
  ===================== */
  moveGhosts() {
    this.ghosts.forEach(g => {
      if (g.moving) return;

      const dx = this.tx - g.tx;
      const dy = this.ty - g.ty;
      const d = Math.abs(dx) > Math.abs(dy)
        ? { x: Math.sign(dx), y: 0 }
        : { x: 0, y: Math.sign(dy) };

      const nx = g.tx + d.x;
      const ny = g.ty + d.y;

      if (!this.canMove(nx, ny)) return;

      g.moving = true;
      this.tweens.add({
        targets: g.s,
        x: nx * TILE + TILE / 2,
        y: HUD_HEIGHT + ny * TILE + TILE / 2,
        duration: MOVE_TIME + 40 - this.ghostSpeedBonus,
        onComplete: () => {
          g.tx = nx;
          g.ty = ny;
          g.moving = false;

          if (g.tx === this.tx && g.ty === this.ty) this.hitGhost(g);
        }
      });
    });
  }

  /* =====================
     FRIGHTENED
  ===================== */
  startFrightened() {
    this.frightened = true;
    if (this.sfxFright && !this.sfxFright.isPlaying) this.sfxFright.play();

    this.time.delayedCall(POWER_TIME, () => {
      this.frightened = false;
      if (this.sfxFright) this.sfxFright.stop();
    });
  }

  hitGhost(g) {
    if (this.frightened) {
      g.tx = g.sx;
      g.ty = g.sy;
      g.s.setPosition(
        g.tx * TILE + TILE / 2,
        HUD_HEIGHT + g.ty * TILE + TILE / 2
      );
      this.score += 200;
      this.updateHUD();
    } else {
      this.lives--;
      this.updateHUD();
      if (this.lives <= 0) this.scene.start("MenuScene");
    }
  }

  /* =====================
     LEVEL CLEAR
  ===================== */
  levelClear() {
    const t = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2,
      "LEVEL CLEAR",
      { fontSize: "32px", color: "#ffff00" }
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
