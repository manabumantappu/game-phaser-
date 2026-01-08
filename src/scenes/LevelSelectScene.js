export default class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super("LevelSelectScene");
  }

  create() {
    this.add.text(100, 100, "LEVEL SELECT", {
      fontSize: "24px",
      color: "#ffffff"
    });

    this.input.once("pointerdown", () => {
      this.scene.start("GameScene", { level: 1, score: 0 });
    });
  }
}
