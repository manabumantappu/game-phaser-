import { LEVELS } from "../data/levels.js";
import VirtualJoystick from "../ui/VirtualJoystick.js";

const TILE = 32;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
  }

  init(data) {
    this.levelIndex = data.level ?? 0;
    this.score = data.score ?? 0;
    this.powerMode = false;
    this.levelCleared = false;
  }

  create() {
    this.level = LEVELS[this.levelIndex];

    this.cursors = this.input.keyboard.createCursorKeys();
    this.joystick = new VirtualJoystick(this);

    /* =====================
       AUDIO
    ===================== */
    this.sfxCollect = this.sound.add("collect", { volume: 0.8 });
    this.sfxClick = this.sound.add("click", { volume: 0.6 });
    this.sfxLevelClear = this.sound.add("levelclear", { volume: 0.9 });

    if (!this.sound.get("bgm")) {
      this.bgm = this.sound.add("bgm", {
        loop: true,
        volume: 0.4
      });
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
  const padding = 10;

  // Background HUD (semi transparan)
  this.hudBg = this.add.rectangle(
    this.scale.width / 2,
    24,
    this.scale.width,
    48,
    0x000000,
    0.5
  )
  .setOrigin(0.5)
  .setScrollFactor(0)
  .setDepth(20);

  // SCORE
  this.hudScore = this.add.text(
    padding,
    8,
    `🟡 ${this.score}`,
    {
      fontSize: "20px",
      fontStyle: "bold",
      color: "#ffff00"
    }
  )
  .setScrollFactor(0)
  .setDepth(21);

  // LEVEL
  this.hudLevel = this.add.text(
    this.scale.width - padding,
    8,
    `👻 L${this.levelIndex + 1}`,
    {
      fontSize: "20px",
      fontStyle: "bold",
      color: "#ffffff"
    }
  )
  .setOrigin(1, 0)
  .setScrollFactor(0)
  .setDepth(21);
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
        const py = y * TILE + TILE / 2;

        if (cell === "1") {
          const wall = this.walls.create(px, py, "wall");
          wall.setDisplaySize(32, 32);
          wall.refreshBody();
        }

        if (cell === "0") {
          const p = this.pellets.create(px, py, "pellet");
          p.setDisplaySize(8, 8);
        }

        if (cell === "2") {
          const p = this.powerPellets.create(px, py, "power");
          p.setDisplaySize(14, 14);
        }
      });
    });
  }

  /* =====================
     PLAYER
  ===================== */
  createPlayer() {
    const px = this.level.player.x * TILE + 16;
    const py = this.level.player.y * TILE + 16;

    this.player = this.physics.add.sprite(px, py, "pacman");
    this.player.setDisplaySize(28, 28);
    this.player.setCollideWorldBounds(true);

    this.physics.add.collider(this.player, this.walls);

    // Pellet
    this.physics.add.overlap(this.player, this.pellets, (_, p) => {
      p.destroy();
      this.score += 10;
      this.sfxCollect.play();
      this.updateHUD();
      this.checkWin();
    });

    // Power pellet
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
        g.y * TILE + 16,
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
     WIN CHECK
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

  /* =====================
     LEVEL CLEAR ANIMATION
  ===================== */
  showLevelClear() {
    this.player.setVelocity(0);
    this.ghosts.setVelocityX(0);
    this.ghosts.setVelocityY(0);

    this.sfxLevelClear.play();

    const { width, height } = this.scale;

    const overlay = this.add.rectangle(
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

  /* =====================
     NEXT LEVEL
  ===================== */
  nextLevel() {
    if (this.levelIndex + 1 >= LEVELS.length) {
      this.scene.start("GameOverScene", {
        score: this.score
      });
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

    let vx = 0, vy = 0;
    const speed = 140;

    // Keyboard
    if (this.cursors.left.isDown) vx = -speed;
    else if (this.cursors.right.isDown) vx = speed;
    if (this.cursors.up.isDown) vy = -speed;
    else if (this.cursors.down.isDown) vy = speed;

    // Mobile joystick
    if (this.joystick.forceX || this.joystick.forceY) {
      vx = this.joystick.forceX * speed;
      vy = this.joystick.forceY * speed;
    }

    this.player.setVelocity(vx, vy);

    // Rotate Pac-Man
    if (vx < 0) this.player.setAngle(180);
    else if (vx > 0) this.player.setAngle(0);
    else if (vy < 0) this.player.setAngle(270);
    else if (vy > 0) this.player.setAngle(90);

    // Ghost chase AI
    this.ghosts.children.iterate(g => {
      this.physics.moveToObject(g, this.player, g.speed);
    });
  }
}
