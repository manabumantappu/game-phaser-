export default class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super("LevelSelectScene");
  }

  create() {
    this.add.text(80, 120, "LEVEL SELECT OK", {
      fontSize: "24px",
      color: "#ffffff"
    });

    this.input.once("pointerdown", () => {
      this.scene.start("GameScene", { level: 1, score: 0 });
    });
  }
}
