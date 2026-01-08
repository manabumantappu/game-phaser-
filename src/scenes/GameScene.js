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

    // SOUNDS
    this.sfxEat = this.sound.add("eat");
    this.sfxWin = this.sound.add("win");

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

    // GOAL
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

    this.physics.add.overlap(this.player, this.pellets, (_, p) => {
      p.destroy();
      this.sfxEat.play();

      if (this.pellets.countActive(true) === 0) {
        this.goal.setVisible(true);
      }
    });

    this.physics.add.overlap(this.player, this.goal, () => {
      this.sfxWin.play();
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
