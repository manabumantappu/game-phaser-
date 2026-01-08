export default class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    // No external assets (placeholder only)
  }

  create() {
    this.scene.start("MenuScene");
  }
}
