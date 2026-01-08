import { LEVELS } from "../data/levels.js";
import VirtualJoystick from "../ui/VirtualJoystick.js";

const TILE = 32;
const HUD_HEIGHT = 80;
const MOVE_DURATION = 260;
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

    // 👻 speed ghost naik tiap level
    this.ghostSpeedBonus = Math.min(this.levelIndex * 20, 160);

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

    // unlock audio mobile
    this.input.once("pointerdown", () => {
      if (this.sound.context.state === "suspended") {
        this.sound.context.resume();
      }
    });

    // sounds
    this.sfxCollect = this.sound.add("collect", { volume: 0.8 });
    this.sfxPower = this.sound.add("click", { volume: 0.7 });

    this.sfxFrightened = this.sound.add("frightened", {
      loop: true,
      volume: 0.5
    });

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
          p.setDisplaySize(12, 12);
          this.pellets[y][x] = p;
          this.totalPellets++;
        }
        else if (cell === "2") {
          const p = this.add.image(px, py, "pellet");
          p.setDisplaySize(18, 18);
          p.setTint(0x00ff00); // 🟢 POWER PELLET
          p.isPower = true;
          this.pellets[y][x] = p;
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
     GHOSTS
  ===================== */
  createGhosts() {
    this.ghosts = [];

    this.level.ghosts.forEach(g => {
      const ghost = {
        tileX: g.x,
        tileY: g.y,
        spawnX: g.x,
        spawnY: g.y,
        type: g.type || "blinky",
        moving: false,
        sprite: this.add.sprite(
          g.x * TILE + TILE / 2,
          HUD_HEIGHT + g.y * TILE + TILE / 2,
          "ghost"
        ).setDisplaySize(28, 28)
      };

      if (ghost.type === "blinky") ghost.sprite.setTint(0xff0000);
      if (ghost.type === "pinky") ghost.sprite.setTint(0xff77ff);
      if (ghost.type === "inky") ghost.sprite.setTint(0x00ffff);
      if (ghost.type === "clyde") ghost.sprite.setTint(0xffaa00);

      this.ghosts.push(ghost);
    });
  }

  /* =====================
     GHOST TARGET
  ===================== */
  getGhostTarget(ghost) {
    if (this.frightened) {
      return {
        x: ghost.tileX - this.currentDir.x * 4,
        y: ghost.tileY - this.currentDir.y * 4
      };
    }

    const dx = this.currentDir.x;
    const dy = this.currentDir.y;

    switch (ghost.type) {
      case "blinky":
        return { x: this.tileX, y: this.tileY };
      case "pinky":
        return { x: this.tileX + dx * 3, y: this.tileY + dy * 3 };
      case "inky":
        return {
          x: Phaser.Math.Between(1, this.mapWidth - 2),
          y: Phaser.Math.Between(1, this.mapHeight - 2)
        };
      case "clyde":
        const d = Math.abs(this.tileX - ghost.tileX) + Math.abs(this.tileY - ghost.tileY);
        return d < 4 ? { x: 1, y: this.mapHeight - 2 } : { x: this.tileX, y: this.tileY };
    }
  }

  /* =====================
     FRIGHTENED MODE
  ===================== */
  startFrightenedMode() {
    this.frightened = true;
    this.sfxPower.play();

    if (this.bgm.isPlaying) this.bgm.pause();
    if (!this.sfxFrightened.isPlaying) this.sfxFrightened.play();

    this.ghosts.forEach(g => g.sprite.setTint(0x0000ff));

    if (this.frightenedTimer) this.frightenedTimer.remove(false);
    this.frightenedTimer = this.time.delayedCall(POWER_TIME, () => {
      this.endFrightenedMode();
    });
  }

  endFrightenedMode() {
    this.frightened = false;

    if (this.sfxFrightened.isPlaying) this.sfxFrightened.stop();
    if (!this.bgm.isPlaying) this.bgm.resume();

    this.ghosts.forEach(g => {
      g.sprite.clearTint();
      if (g.type === "blinky") g.sprite.setTint(0xff0000);
      if (g.type === "pinky") g.sprite.setTint(0xff77ff);
      if (g.type === "inky") g.sprite.setTint(0x00ffff);
      if (g.type === "clyde") g.sprite.setTint(0xffaa00);
    });
  }

  /* =====================
     LEVEL CLEAR
  ===================== */
  showLevelClear() {
    const text = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2,
      "LEVEL CLEAR",
      {
        fontSize: "36px",
        fontStyle: "bold",
        color: "#ffff00"
      }
    ).setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: text,
      scale: { from: 0.3, to: 1 },
      duration: 400,
      ease: "Back.Out"
    });

    this.time.delayedCall(1200, () => {
      this.scene.start("GameScene", {
        level: this.levelIndex + 1,
        score: this.score,
        lives: this.lives
      });
    });
  }

  /* =====================
     MOVE PLAYER + UPDATE
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

  canMove(x, y) {
    if (x < 0) x = this.mapWidth - 1;
    if (x >= this.mapWidth) x = 0;
    if (y < 0 || y >= this.mapHeight) return false;
    return this.level.map[y][x] !== "1";
  }

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
          if (pellet.isPower) this.startFrightenedMode();
          this.updateHUD();
        }

        if (this.totalPellets === 0) {
          this.showLevelClear();
        }
      }
    });
  }

  moveGhosts() {
    this.ghosts.forEach(g => {
      if (g.moving) return;

      const t = this.getGhostTarget(g);
      const dx = t.x - g.tileX;
      const dy = t.y - g.tileY;

      let dir = Math.abs(dx) > Math.abs(dy)
        ? { x: Math.sign(dx), y: 0 }
        : { x: 0, y: Math.sign(dy) };

      let nx = g.tileX + dir.x;
      let ny = g.tileY + dir.y;

      if (!this.canMove(nx, ny)) return;

      g.moving = true;
      this.tweens.add({
        targets: g.sprite,
        x: nx * TILE + TILE / 2,
        y: HUD_HEIGHT + ny * TILE + TILE / 2,
        duration: this.frightened
          ? MOVE_DURATION + 160
          : MOVE_DURATION + 40 - this.ghostSpeedBonus,
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

  onHitGhost(ghost) {
    if (this.frightened) {
      ghost.tileX = ghost.spawnX;
      ghost.tileY = ghost.spawnY;
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
}
