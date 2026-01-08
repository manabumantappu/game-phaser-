export default class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    const { width, height } = this.scale;

    /* ======================
       BACKGROUND
    ====================== */
    this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x111111
    );

    /* ======================
       TITLE
    ====================== */
    this.add.text(
      width / 2,
      height * 0.3,
      "PUZZLE\nMAZE",
      {
        fontSize: "40px",
        color: "#ffffff",
        align: "center",
        fontStyle: "bold"
      }
    ).setOrigin(0.5);

    this.add.text(
      width / 2,
      height * 0.42,
      "Mobile Puzzle Game",
      {
        fontSize: "14px",
        color: "#aaaaaa"
      }
    ).setOrigin(0.5);

    /* ======================
       START BUTTON
    ====================== */
    const btnWidth = width * 0.6;
    const btnHeight = 56;

    const startBtn = this.add.rectangle(
      width / 2,
      height * 0.6,
      btnWidth,
      btnHeight,
      0x00bfa5,
      1
    )
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const startText = this.add.text(
      width / 2,
      height * 0.6,
      "START",
      {
        fontSize: "20px",
        color: "#000000",
        fontStyle: "bold"
      }
    ).setOrigin(0.5);

    /* ======================
       BUTTON FEEDBACK
    ====================== */
    startBtn.on("pointerdown", () => {
      startBtn.setScale(0.95);
      if (navigator.vibrate) navigator.vibrate(30);
    });

    startBtn.on("pointerup", () => {
      startBtn.setScale(1);
      this.startGame();
    });

    startBtn.on("pointerout", () => {
      startBtn.setScale(1);
    });

    /* ======================
       FOOTER
    ====================== */
    this.add.text(
      width / 2,
      height - 40,
      "Tap START to play",
      {
        fontSize: "12px",
        color: "#777777"
      }
    ).setOrigin(0.5);
  }

  startGame() {
    this.scene.start("GameScene", {
      level: 0,
      score: 0
    });
  }
}
