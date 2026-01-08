import { LEVELS } from "../data/levels.js";
import VirtualJoystick from "../ui/VirtualJoystick.js";

const TILE = 32;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
  }

  init(data) {
    this.levelIndex = data.level ?? 0;
    this.powerMode = false;
  }

  create() {
    this.level = LEVELS[this.levelIndex];
    this.cursors = this.input.keyboard.createCursorKeys();
    this.joystick = new VirtualJoystick(this);

    // AUDIO
    this.sfxCollect = this.sound.add("collect", { volume: 0.8 });
    this.sfxClick = this.sound.add("click", { volume: 0.6 });

    if (!this.sound.get("bgm")) {
      this.bgm = this.sound.add("bgm", { loop: true, volume: 0.4 });
      this.bgm.play();
    }

    // ANIM
    this.anims.create({
      key: "chomp",
      frames: this.anims.generateFrameNumbers("pacman", { start: 0, end: 2 }),
      frameRate: 10,
      repeat: -1
    });

    this.buildMap();
    this.createPlayer();
    this.createGhosts();
  }

  buildMap() {
    this.walls = this.physics.add.staticGroup();
    this.pellets = this.physics.add.group();
    this.powerPellets = this.physics.add.group();

    this.level.map.forEach((row, y) => {
      [...row].forEach((cell, x) => {
        const px = x * TILE + TILE / 2;
        const py = y * TILE + TILE / 2;

        if (cell === "1") this.walls.create(px, py, "wall").refreshBody();
        if (cell === "0") this.pellets.create(px, py, "pellet");
        if (cell === "2") this.powerPellets.create(px, py, "power");
      });
    });
  }

  createPlayer() {
    this.player = this.physics.add.sprite(
      this.level.player.x * TILE + 16,
      this.level.player.y * TILE + 16,
      "pacman"
    );

    this.player.play("chomp");
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.walls);

    this.physics.add.overlap(this.player, this.pellets, (_, p) => {
      p.destroy();
      this.sfxCollect.play();
    });

    this.physics.add.overlap(this.player, this.powerPellets, (_, p) => {
      p.destroy();
      this.powerMode = true;
      this.time.delayedCall(6000, () => (this.powerMode = false));
    });
  }

  createGhosts() {
    this.ghosts = this.physics.add.group();

    this.level.ghosts.forEach(g => {
      const ghost = this.ghosts.create(
        g.x * TILE + 16,
        g.y * TILE + 16,
        "ghost"
      );
      ghost.speed = 70;
    });

    this.physics.add.collider(this.ghosts, this.walls);

    this.physics.add.overlap(this.player, this.ghosts, (_, ghost) => {
      if (this.powerMode) {
        ghost.destroy();
        this.sfxCollect.play();
      } else {
        this.scene.restart({ level: this.levelIndex });
      }
    });
  }

  update() {
    let vx = 0, vy = 0, speed = 140;

    if (this.cursors.left.isDown) vx = -speed;
    else if (this.cursors.right.isDown) vx = speed;
    if (this.cursors.up.isDown) vy = -speed;
    else if (this.cursors.down.isDown) vy = speed;

    if (this.joystick.forceX || this.joystick.forceY) {
      vx = this.joystick.forceX * speed;
      vy = this.joystick.forceY * speed;
    }

    this.player.setVelocity(vx, vy);

    // arah mulut
    if (vx < 0) this.player.setAngle(180);
    else if (vx > 0) this.player.setAngle(0);
    else if (vy < 0) this.player.setAngle(270);
    else if (vy > 0) this.player.setAngle(90);

    // GHOST CHASE AI
    this.ghosts.children.iterate(g => {
      this.physics.moveToObject(g, this.player, g.speed);
    });
  }
}
