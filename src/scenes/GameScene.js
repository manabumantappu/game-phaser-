import { LEVELS } from "../data/levels.js";
import VirtualJoystick from "../ui/VirtualJoystick.js";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
  }

  init(data) {
    this.levelIndex = data.level ?? 0;
  }

  create() {
    this.levelData = LEVELS[this.levelIndex];
    this.cursors = this.input.keyboard.createCursorKeys();

    /* ======================
       AUDIO (FIXED)
    ====================== */
    this.sfxCollect = this.sound.add("collect", { volume: 0.8 });
    this.sfxClick = this.sound.add("click", { volume: 0.6 });

    // BGM — hanya dibuat 1x
    if (!this.sound.get("bgm")) {
      this.bgm = this.sound.add("bgm", {
        loop: true,
        volume: 0.4
      });
      this.bgm.play();
    } else {
      this.bgm = this.sound.get("bgm");
    }

    this.createWorld();
    this.createPlayer();
    this.createJoystick();
  }

  createWorld() {
    this.walls = this.physics.add.staticGroup();
    this.pellets = this.physics.add.group();

    // WALLS
    this.levelData.walls.forEach(w => {
      const wall = this.walls.create(w.x, w.y, "wall");
      wall.setDisplaySize(w.w, w.h);
      wall.refreshBody();
    });

    // PELLETS
    this.levelData.pellets.forEach(p => {
      this.pellets.create(p.x, p.y, "pellet");
    });

    // GOAL (muncul setelah pellet habis)
    this.goal = this.physics.add.staticImage(
      this.levelData.goal.x,
      this.levelData.goal.y,
      "goal"
    );
    this.goal.setVisible(false);
  }

  createPlayer() {
    this.player = this.physics.add.sprite(
      this.levelData.player.x,
      this.levelData.player.y,
      "player"
    );

    this.player.setCollideWorldBounds(true);

    this.physics.add.collider(this.player, this.walls);

    this.physics.add.overlap(this.player, this.pellets, (_, pellet) => {
      pellet.destroy();
      this.sfxCollect.play();

      if (this.pellets.countActive(true) === 0) {
        this.goal.setVisible(true);
      }
    });

    this.physics.add.overlap(this.player, this.goal, () => {
      this.sfxClick.play();
      this.nextLevel();
    });
  }

  createJoystick() {
    this.joystick = new VirtualJoystick(this);
  }

  nextLevel() {
    if (this.levelIndex + 1 >= LEVELS.length) {
      this.scene.start("GameOverScene");
    } else {
      this.scene.start("GameScene", {
        level: this.levelIndex + 1
      });
    }
  }

  update() {
    const speed = 160;
    let vx = 0;
    let vy = 0;

    // KEYBOARD
    if (this.cursors.left.isDown) vx = -speed;
    else if (this.cursors.right.isDown) vx = speed;

    if (this.cursors.up.isDown) vy = -speed;
    else if (this.cursors.down.isDown) vy = speed;

    // MOBILE JOYSTICK
    if (this.joystick) {
      vx = this.joystick.forceX * speed;
      vy = this.joystick.forceY * speed;
    }

    this.player.setVelocity(vx, vy);
  }
}
