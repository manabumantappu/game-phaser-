export default class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    // IMAGE
    this.load.image("pacman", "assets/pacman.png");
    this.load.image("ghost", "assets/ghost.png");
    this.load.image("wall", "assets/wall.png");
    this.load.image("pellet", "assets/pellet.png");

    // AUDIO
    this.load.audio("bgm", "assets/bgm.mp3");
    this.load.audio("collect", "assets/collect.wav");
    this.load.audio("click", "assets/click.wav");
    this.load.audio("frightened", "assets/frightened.mp3");
  }

  create() {
    this.scene.start("MenuScene");
  }
}
