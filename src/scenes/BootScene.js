export default class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    // === SPRITES ===
    this.load.image("pacman", "assets/sprites/pacman.png");
    this.load.image("ghost", "assets/sprites/ghost.png");
    this.load.image("pellet", "assets/sprites/pellet.png");
    this.load.image("wall", "assets/sprites/wall.png");
    this.load.image("goal", "assets/sprites/goal.png");

    // === AUDIO (SAFE) ===
    this.load.audio("bgm", "assets/audio/bgm.mp3");
    this.load.audio("collect", "assets/audio/collect.mp3");
    this.load.audio("click", "assets/audio/click.mp3");
    this.load.audio("frightened", "assets/audio/frightened.mp3");
  }

  create() {
    this.scene.start("MenuScene");
  }
}
