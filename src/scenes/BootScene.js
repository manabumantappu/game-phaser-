export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload() {
    /* ======================
       AUDIO
    ====================== */
    this.load.audio("click", "assets/audio/click.wav");
    this.load.audio("collect", "assets/audio/collect.wav");
    this.load.audio("bgm", "assets/audio/bgm.mp3");

    /* ======================
       SPRITE (placeholder)
    ====================== */
    this.load.image("player", "assets/player.png");
    this.load.image("pellet", "assets/pellet.png");
    this.load.image("wall", "assets/wall.png");
    this.load.image("goal", "assets/goal.png");
  }

  create() {
    this.scene.start("MenuScene");
  }
}
