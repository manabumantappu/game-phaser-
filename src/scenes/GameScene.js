import { LEVELS } from "../data/levels.js";
import VirtualJoystick from "../ui/VirtualJoystick.js";

const TILE = 32;
const HUD_HEIGHT = 56;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
  }

  /* =====================
     INIT
  ===================== */
  init(data) {
    this.levelIndex = data.level ?? 0;
    this.score = data.score ?? 0;
    this.powerMode = false;
    this.levelCleared = false;

    // movement (grid based)
    this.currentDir = { x: 0, y: 0 };
    this.nextDir = { x: 0, y: 0 };
  }

  /* =====================
     CREATE
  ===================== */
  create() {
    this.level = LEVELS[this.levelIndex];

    this.cursors = this.input.keyboard.createCursorKeys();
    this.joystick = new VirtualJoystick(this);

    // AUDIO
    this.sfxCollect = this.sound.add("collect", { volume: 0.8 });
    this.sfxLevelClear = this.sound.add("levelclear", { volume: 0.9 });

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
    this.hudBg = this.add.rectangle(
      this.scale.width / 2,
      24,
      this.scale.width,
      48,
      0x000000,
      0.5
    ).setScrollFactor(0).setDepth(20);

    this.hudScore = this.add.text(
      10,
      8,
      `🟡 ${this.score}`,
      {
        fontSize: "20px",
        fontStyle: "bold",
        color: "#ffff00"
      }
    ).setScrollFactor(0).setDepth(21);

    this.hudLevel = this.add.text(
      this.scale.width - 10,
      8,
      `👻 L${this.levelIndex + 1}`,
      {
        fontSize: "20px",
        color: "#ffffff"
      }
    ).setOrigin(1, 0).setScrollFactor(0).setDepth(21);
  }

  updateHUD() {
    this.hudScore.setText(`🟡 ${this.score}`);
  }

  /* =====================
     MAP
  ===================== */
  buildMap() {
    this.walls = this.physics.add.staticGroup();
    this.pellets = this.physics.add.group();
    this.powerPellets = this.physics.add.group();

    this.level.map.forEach((row, y) => {
      [...row].forEach((cell, x) => {
        const px = x * TILE + TILE / 2;
        const py = HUD_HEIGHT + y * TILE + TILE / 2;

        if (cell === "1") {
          const wall = this.walls.create(px, py, "wall");
          wall.setDisplaySize(32, 32);
          wall.refreshBody();
        }

        if (cell === "0") {
          this.pellets.create(px, py, "pellet").setDisplaySize(8, 8);
        }

        if (cell === "2") {
          this.powerPellets.create(px, py, "power").setDisplaySize(14, 14);
        }
      });
    });
  }

  /* =====================
     PLAYER
  ===================== */
  createPlayer() {
    const px = this.level.player.x * TILE + 16;
    const py = HUD_HEIGHT + this.level.player.y * TILE + 16;

    this.player = this.physics.add.sprite(px, py, "pacman");
    this.player.setDisplaySize(28, 28);
    this.player.setCollideWorldBounds(true);

    this.physics.add.collider(this.player, this.walls);

    this.physics.add.overlap(this.player, this.pellets, (_, p) => {
      p.destroy();
      this.score += 10;
      this.sfxCollect.play();
      this.updateHUD();
      this.checkWin();
    });

    this.physics.add.overlap(this.player, this.powerPellets, (_, p) => {
      p.destroy();
      this.score += 50;
      this.powerMode = true;
      this.updateHUD();

      this.time.delayedCall(6000, () => {
        this.powerMode = false;
      });

      this.checkWin();
    });
  }

  /* =====================
     GHOST
  ===================== */
  createGhosts() {
    this.ghosts = this.physics.add.group();

    this.level.ghosts.forEach(g => {
      const ghost = this.ghosts.create(
        g.x * TILE + 16,
        HUD_HEIGHT + g.y * TILE + 16,
        "ghost"
      );
      ghost.setDisplaySize(28, 28);
      ghost.speed = 70;
    });

    this.physics.add.collider(this.ghosts, this.walls);

    this.physics.add.overlap(this.player, this.ghosts, (_, ghost) => {
      if (this.levelCleared) return;

      if (this.powerMode) {
        ghost.destroy();
        this.score += 200;
        this.sfxCollect.play();
        this.updateHUD();
      } else {
        this.scene.restart({
          level: this.levelIndex,
          score: this.score
        });
      }
    });
  }

  /* =====================
     MOVEMENT HELPERS
  ===================== */
  setDirection(dir) {
    this.currentDir = dir;
  }

  isNearCenter(sprite) {
    const tx = Math.round(sprite.x / TILE) * TILE;
    const ty =
      Math.round((sprite.y - HUD_HEIGHT) / TILE) * TILE + HUD_HEIGHT;

    return (
      Math.abs(sprite.x - tx) < 4 &&
      Math.abs(sprite.y - ty) < 4
    );
  }

  canMove(dir) {
    const testX = this.player.x + dir.x * TILE;
    const testY = this.player.y + dir.y * TILE;

    for (let w of this.walls.getChildren()) {
      if (
        Phaser.Geom.Intersects.RectangleToRectangle(
          new Phaser.Geom.Rectangle(
            testX - 14,
            testY - 14,
            28,
            28
          ),
          w.getBounds()
        )
      ) {
        return false;
      }
    }
    return true;
  }

  snapToCenter(sprite) {
  const cx = Math.round(sprite.x / TILE) * TILE;
  const cy =
    Math.round((sprite.y - HUD_HEIGHT) / TILE) * TILE + HUD_HEIGHT;

  sprite.setPosition(cx, cy);
}

  /* =====================
     WIN
  ===================== */
  checkWin() {
    if (
      this.levelCleared ||
      this.pellets.countActive(true) > 0 ||
      this.powerPellets.countActive(true) > 0
    ) return;

    this.levelCleared = true;
    this.showLevelClear();
  }

  showLevelClear() {
    this.player.setVelocity(0);
    this.ghosts.setVelocity(0);

    this.sfxLevelClear.play();

    const { width, height } = this.scale;

    this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000,
      0.6
    ).setDepth(10);

    const text = this.add.text(
      width / 2,
      height / 2,
      "LEVEL CLEAR",
      {
        fontSize: "36px",
        fontStyle: "bold",
        color: "#ffff00"
      }
    ).setOrigin(0.5).setDepth(11);

    text.setScale(0.2);

    this.tweens.add({
      targets: text,
      scale: 1,
      duration: 400,
      ease: "Back.Out"
    });

    this.time.delayedCall(1200, () => {
      this.nextLevel();
    });
  }

  nextLevel() {
    if (this.levelIndex + 1 >= LEVELS.length) {
      this.scene.start("GameOverScene", { score: this.score });
    } else {
      this.scene.start("GameScene", {
        level: this.levelIndex + 1,
        score: this.score
      });
    }
  }

  /* =====================
     UPDATE
  ===================== */
  update() {
    if (this.levelCleared) return;

    const speed = 140;

    // INPUT
    if (this.cursors.left.isDown) this.nextDir = { x: -1, y: 0 };
    else if (this.cursors.right.isDown) this.nextDir = { x: 1, y: 0 };
    else if (this.cursors.up.isDown) this.nextDir = { x: 0, y: -1 };
    else if (this.cursors.down.isDown) this.nextDir = { x: 0, y: 1 };

    if (this.joystick.forceX || this.joystick.forceY) {
      if (Math.abs(this.joystick.forceX) > Math.abs(this.joystick.forceY)) {
        this.nextDir = {
          x: this.joystick.forceX > 0 ? 1 : -1,
          y: 0
        };
      } else {
        this.nextDir = {
          x: 0,
          y: this.joystick.forceY > 0 ? 1 : -1
        };
      }
    }

// TURN / START MOVE
if (
  this.currentDir.x === 0 &&
  this.currentDir.y === 0 &&
  (this.nextDir.x !== 0 || this.nextDir.y !== 0) &&
  this.canMove(this.nextDir)
) {
  // pertama kali mulai jalan
  this.setDirection(this.nextDir);
}
else if (this.isNearCenter(this.player)) {
  if (this.canMove(this.nextDir)) {
    this.setDirection(this.nextDir);
  }
}

    // MOVE
    this.player.setVelocity(
      this.currentDir.x * speed,
      this.currentDir.y * speed
    );

    // ROTATE
    if (this.currentDir.x < 0) this.player.setAngle(180);
    else if (this.currentDir.x > 0) this.player.setAngle(0);
    else if (this.currentDir.y < 0) this.player.setAngle(270);
    else if (this.currentDir.y > 0) this.player.setAngle(90);

    // GHOST AI
    this.ghosts.children.iterate(g => {
      this.physics.moveToObject(g, this.player, g.speed);
    });
  }
}
