import { LEVELS } from "../data/levels.js";
import VirtualJoystick from "../ui/VirtualJoystick.js";

const TILE = 32;
const HUD_HEIGHT = 80;
const MOVE_DURATION = 280;
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

    this.currentDir = { x: 0, y: 0 };
    this.nextDir = { x: 0, y: 0 };

    this.tileX = 0;
    this.tileY = 0;
    this.moving = false;

    this.powerMode = false;
    this.ghosts = [];
  }

  /* =====================
     CREATE
  ===================== */
  create() {
    this.level = LEVELS[this.levelIndex];
    if (!this.level) return;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.joystick = new VirtualJoystick(this);

    // 🔊 unlock audio (mobile)
    this.input.once("pointerdown", () => {
      if (this.sound.context.state === "suspended") {
        this.sound.context.resume();
      }
    });

    // 🔊 sounds
    this.sfxCollect = this.sound.add("collect", { volume: 0.8 });
    this.sfxPower = this.sound.add("click", { volume: 0.8 });

    if (!this.sound.get("bgm")) {
      this.bgm = this.sound.add("bgm", { loop: true, volume: 0.4 });
      this.bgm.play();
    }

    this.buildMap();
    this.createPlayer();
    this.createGhosts();
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

    this.hudScore = this.add.text(12, 22, `SCORE ${this.score}`, {
      fontSize: "18px",
      color: "#ffff00",
      fontStyle: "bold"
    });

    this.hudLives = this.add.text(
      this.scale.width / 2,
      22,
      `❤️ ${this.lives}`,
      { fontSize: "18px", color: "#ff4444" }
    ).setOrigin(0.5, 0);

    this.hudLevel = this.add.text(
      this.scale.width - 12,
      22,
      `L${this.levelIndex + 1}`,
      { fontSize: "18px", color: "#ffffff" }
    ).setOrigin(1, 0);
  }

  updateHUD() {
    this.hudScore.setText(`SCORE ${this.score}`);
    this.hudLives.setText(`❤️ ${this.lives}`);
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
        const px = x * TILE + TILE / 2;
        const py = HUD_HEIGHT + y * TILE + TILE / 2;

        if (cell === "1") {
          this.add.image(px, py, "wall").setDisplaySize(TILE, TILE);
          this.pellets[y][x] = null;
        }
        else if (cell === "0") {
          const p = this.add.image(px, py, "pellet");
          p.setDisplaySize(12, 12).setTint(0xffff00);
          this.pellets[y][x] = p;
          this.totalPellets++;
        }
        else if (cell === "2") {
          const p = this.add.image(px, py, "pellet");
          p.setDisplaySize(18, 18).setTint(0x00ffff);
          this.pellets[y][x] = p;
          p.isPower = true;
          this.totalPellets++;
        }
        else {
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
      this.tileX * TILE + TILE / 2,
      HUD_HEIGHT + this.tileY * TILE + TILE / 2,
      "pacman"
    ).setDisplaySize(28, 28);
  }

  /* =====================
     GHOST
  ===================== */
  createGhosts() {
    this.level.ghosts.forEach(g => {
      const ghost = {
        tileX: g.x,
        tileY: g.y,
        moving: false,
        sprite: this.add.sprite(
          g.x * TILE + TILE / 2,
          HUD_HEIGHT + g.y * TILE + TILE / 2,
          "ghost"
        ).setDisplaySize(28, 28)
      };
      this.ghosts.push(ghost);
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
        this.nextDir = { x: this.joystick.forceX > 0 ? 1 : -1, y: 0 };
      } else {
        this.nextDir = { x: 0, y: this.joystick.forceY > 0 ? 1 : -1 };
      }
    }
  }

  /* =====================
     GRID CHECK + PORTAL
  ===================== */
  canMove(x, y) {
    if (x < 0) x = this.mapWidth - 1;
    if (x >= this.mapWidth) x = 0;
    if (y < 0 || y >= this.mapHeight) return false;
    return this.level.map[y][x] !== "1";
  }

  /* =====================
     MOVE PLAYER
  ===================== */
  startMove(dir) {
    this.moving = true;
    this.currentDir = dir;

    let tx = this.tileX + dir.x;
    let ty = this.tileY + dir.y;

    if (tx < 0) tx = this.mapWidth - 1;
    if (tx >= this.mapWidth) tx = 0;

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

        // eat pellet
        const pellet = this.pellets[ty]?.[tx];
        if (pellet) {
          pellet.destroy();
          this.pellets[ty][tx] = null;
          this.totalPellets--;
          this.score += pellet.isPower ? 50 : 10;
          this.sfxCollect.play();

          if (pellet.isPower) {
            this.activatePowerMode();
          }

          this.updateHUD();
        }

        if (this.totalPellets === 0) {
          this.nextLevel();
        }
      }
    });
  }

  /* =====================
     POWER MODE
  ===================== */
  activatePowerMode() {
    this.powerMode = true;
    this.sfxPower.play();

    this.ghosts.forEach(g => {
      g.sprite.setTint(0x00ffff);
    });

    this.time.delayedCall(POWER_TIME, () => {
      this.powerMode = false;
      this.ghosts.forEach(g => g.sprite.clearTint());
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

      let dir =
        Math.abs(dx) > Math.abs(dy)
          ? { x: Math.sign(dx), y: 0 }
          : { x: 0, y: Math.sign(dy) };

      let nx = g.tileX + dir.x;
      let ny = g.tileY + dir.y;

      if (!this.canMove(nx, ny)) {
        const dirs = [
          { x: 1, y: 0 }, { x: -1, y: 0 },
          { x: 0, y: 1 }, { x: 0, y: -1 }
        ];
        Phaser.Utils.Array.Shuffle(dirs);
        dir = dirs.find(d => this.canMove(g.tileX + d.x, g.tileY + d.y));
        if (!dir) return;
        nx = g.tileX + dir.x;
        ny = g.tileY + dir.y;
      }

      g.moving = true;
      this.tweens.add({
        targets: g.sprite,
        x: nx * TILE + TILE / 2,
        y: HUD_HEIGHT + ny * TILE + TILE / 2,
        duration: MOVE_DURATION + 40,
        onComplete: () => {
          g.tileX = nx;
          g.tileY = ny;
          g.moving = false;

          if (g.tileX === this.tileX && g.tileY === this.tileY) {
            this.onHitGhost(g);
          }
        }
      });
    });
  }

  /* =====================
     HIT GHOST
  ===================== */
  onHitGhost(ghost) {
    if (this.powerMode) {
      ghost.sprite.setPosition(
        ghost.tileX * TILE + TILE / 2,
        HUD_HEIGHT + ghost.tileY * TILE + TILE / 2
      );
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

  /* =====================
     NEXT LEVEL
  ===================== */
  nextLevel() {
    this.scene.start("GameScene", {
      level: this.levelIndex + 1,
      score: this.score,
      lives: this.lives
    });
  }

  /* =====================
     UPDATE
  ===================== */
  update() {
    this.readInput();
    if (!this.moving) {
      if (this.canMove(this.tileX + this.nextDir.x, this.tileY + this.nextDir.y)) {
        this.startMove(this.nextDir);
      } else if (this.canMove(this.tileX + this.currentDir.x, this.tileY + this.currentDir.y)) {
        this.startMove(this.currentDir);
      }
    }
    this.moveGhosts();
  }
}
