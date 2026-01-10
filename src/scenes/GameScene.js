import { LEVELS } from "../data/levels.js";
import VirtualJoystick from "../ui/VirtualJoystick.js";

const TILE = 32;
const HUD_HEIGHT = 80;
const MOVE_TIME = 240;
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

    this.tileX = 0;
    this.tileY = 0;
    this.moving = false;

    this.currentDir = { x: 0, y: 0 };
    this.nextDir = { x: 0, y: 0 };

    this.frightened = false;
    this.frightenedTimer = null;
    this.ghosts = [];
 /* ==========================================
     Mode bisa mati false - mode hidup terus true
  ============================================ */
    this.allowDeath = false; // default: pacman=tikus tidak bisa mati 

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

    // ===== INPUT =====
    this.cursors = this.input.keyboard.createCursorKeys();
    this.joystick = new VirtualJoystick(this);

    // ===== AUDIO SAFE =====
    this.sfxCollect = this.sound.add("collect", { volume: 0.7 });
    this.sfxPower = this.sound.add("click", { volume: 0.6 });
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
    this.createUI();
  }

  /* =====================
     MAP (CENTERED)
  ===================== */
  buildMap() {
    this.pellets = [];
    this.totalPellets = 0;

    this.mapWidth = this.level.map[0].length;
    this.mapHeight = this.level.map.length;

    // ⬅️ CENTER MAP HORIZONTAL
    this.mapOffsetX =
      (this.scale.width - this.mapWidth * TILE) / 2;

    this.level.map.forEach((row, y) => {
      this.pellets[y] = [];

      [...row].forEach((cell, x) => {
        const px = this.mapOffsetX + x * TILE + TILE / 2;
        const py = HUD_HEIGHT + y * TILE + TILE / 2;

        if (cell === "1") {
          this.add.image(px, py, "wall").setDisplaySize(TILE, TILE);
          this.pellets[y][x] = null;
        }

        if (cell === "0" || cell === "2") {
          const p = this.add.image(px, py, "pellet").setDepth(2);
          p.isPower = cell === "2";
          p.setDisplaySize(p.isPower ? 18 : 10, p.isPower ? 18 : 10);
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
    this.tileX = this.level.player.x;
    this.tileY = this.level.player.y;

    this.player = this.add.sprite(
      this.mapOffsetX + this.tileX * TILE + TILE / 2,
      HUD_HEIGHT + this.tileY * TILE + TILE / 2,
      "pacman"
    ).setDisplaySize(28, 28);
  }

  /* =====================
     GHOSTS
  ===================== */
  createGhosts() {
    this.level.ghosts.forEach(g => {
      const ghost = {
        tileX: g.x,
        tileY: g.y,
        moving: false,
        sprite: this.add.sprite(
          this.mapOffsetX + g.x * TILE + TILE / 2,
          HUD_HEIGHT + g.y * TILE + TILE / 2,
          "ghost"
        ).setDisplaySize(28, 28)
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
     UI (MUTE + PAUSE + TEXT)
  ===================== */
  createUI() {
    // PAUSE
    this.add.text(12, this.scale.height - 36, "⏸", {
      fontSize: "24px"
    }).setInteractive().on("pointerdown", () => {
      this.scene.pause();
      this.scene.launch("MenuScene");
    });

    // MUTE
    const mute = this.add.text(
      this.scale.width - 36,
      this.scale.height - 36,
      "🔊",
      { fontSize: "24px" }
    ).setInteractive();

    mute.on("pointerdown", () => {
      this.sound.mute = !this.sound.mute;
      mute.setText(this.sound.mute ? "🔇" : "🔊");
    });

      /* ===============================================================
     TEXT BERJALAN ..BISA KIRIM SALAM..HAHAHAHAHAHAHHAHAHAHAHAH
  ====================================================================== */
    const text = this.add.text(
      this.scale.width / 2,
      this.scale.height - 36,
      "GOOD LUCK! KELUARGA CEMARA SEBENTAR LAGI LULUS ",
      { fontSize: "14px", color: "#ffffff" }
    ).setOrigin(0.5);

    this.tweens.add({
      targets: text,
      x: { from: this.scale.width + 80, to: -80 },
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
    return (
      x >= 0 &&
      y >= 0 &&
      x < this.mapWidth &&
      y < this.mapHeight &&
      this.level.map[y][x] !== "1"
    );
  }

  /* =====================
     UPDATE
  ===================== */
  update() {
    this.readInput();

    if (!this.moving && (this.nextDir.x || this.nextDir.y)) {
      if (this.canMove(this.tileX + this.nextDir.x, this.tileY + this.nextDir.y)) {
        this.startMove(this.nextDir);
      }
    }

    this.moveGhosts();
   // ⭐ TAMBAHKAN BARIS INI
  this.checkGhostCollision();
}
   /* =====================
     GHOST COLLISION CHECK
  ===================== */
  checkGhostCollision() {
    this.ghosts.forEach(g => {
      if (g.tileX === this.tileX && g.tileY === this.tileY) {
        if (!this.frightened) {
          this.handlePlayerHit();
        }
      }
    });
  }
/* =====================
     HANDLE PLAYER HIT
     (MODE CASUAL / CLASSIC)
  ===================== */
  handlePlayerHit() {
    if (!this.allowDeath) {
      // MODE AMAN: pacman tidak mati
      this.cameras.main.shake(150, 0.01);
      return;
    }

    // MODE CLASSIC (belum aktif)
    this.lives--;
    this.updateHUD();

    if (this.lives <= 0) {
      this.gameOver();
    } else {
      this.respawnPlayer();
    }
  }
  /* =====================
     MOVE PLAYER
  ===================== */
  startMove(dir) {
    this.moving = true;
    this.currentDir = dir;

    const tx = this.tileX + dir.x;
    const ty = this.tileY + dir.y;

    this.tweens.add({
      targets: this.player,
      x: this.mapOffsetX + tx * TILE + TILE / 2,
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
          if (pellet.isPower) this.startFrightened();
          this.updateHUD();
        }

        if (this.totalPellets === 0) this.levelClear();
      }
    });
  }

  /* =====================
     MOVE GHOSTS
  ===================== */
  moveGhosts() {
    this.ghosts.forEach(g => {
      if (g.moving) return;

      const dx = this.tileX - g.tileX;
      const dy = this.tileY - g.tileY;

      const dir =
        Math.abs(dx) > Math.abs(dy)
          ? { x: Math.sign(dx), y: 0 }
          : { x: 0, y: Math.sign(dy) };

      const nx = g.tileX + dir.x;
      const ny = g.tileY + dir.y;

      if (!this.canMove(nx, ny)) return;

      g.moving = true;
      this.tweens.add({
        targets: g.sprite,
        x: this.mapOffsetX + nx * TILE + TILE / 2,
        y: HUD_HEIGHT + ny * TILE + TILE / 2,
        duration: MOVE_TIME + 60,
        onComplete: () => {
          g.tileX = nx;
          g.tileY = ny;
          g.moving = false;
        }
      });
    });
  }

  /* =====================
     FRIGHTENED
  ===================== */
 startFrightened() {
  // Jika power aktif → reset timer saja
  if (this.frightened) {
    if (this.frightenedTimer) {
      this.frightenedTimer.remove(false);
    }
  } else {
    this.frightened = true;

    if (this.bgm && this.bgm.isPlaying) {
      this.bgm.pause();
    }

    if (!this.sfxFrightened.isPlaying) {
      this.sfxFrightened.play();
    }

    this.ghosts.forEach(g => g.sprite.setTint(0x0000ff));
  }

  // Set ulang timer
  this.frightenedTimer = this.time.delayedCall(
    POWER_TIME,
    () => this.endFrightened(),
    [],
    this
  );
}
endFrightened() {
  this.frightened = false;

  if (this.sfxFrightened.isPlaying) {
    this.sfxFrightened.stop();
  }

  if (this.bgm && !this.bgm.isPlaying) {
    this.bgm.resume();
  }

  this.ghosts.forEach(g => g.sprite.clearTint());
}

  /* =====================
     LEVEL CLEAR
  ===================== */
  levelClear() {
    this.endFrightened();
    this.sfxLevelClear.play();

    this.add.text(
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
