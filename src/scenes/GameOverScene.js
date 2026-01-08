export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOverScene");
  }

  init(data) {
    this.score = data.score;
  }

  create() {
    const { width, height } = this.scale;

    const bestScore = Math.max(
      this.score,
      localStorage.getItem("bestScore") || 0
    );
    localStorage.setItem("bestScore", bestScore);

    this.add.text(width / 2, height / 2 - 60, "GAME OVER", {
      fontSize: "32px",
      color: "#ff5555"
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 10,
      `Score: ${this.score}\nBest: ${bestScore}`, {
      fontSize: "18px",
      align: "center",
      color: "#ffffff"
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 60,
      "TAP or PRESS SPACE", {
      fontSize: "14px",
      color: "#00ffcc"
    }).setOrigin(0.5);

    this.input.once("pointerdown", () => this.scene.start("MenuScene"));
    this.input.keyboard.once("keydown-SPACE", () => this.scene.start("MenuScene"));
  }
}
