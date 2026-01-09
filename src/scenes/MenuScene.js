export default class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(width/2, height/2, width, height, 0x000000);

    this.add.text(
      width/2,
      height*0.3,
      "MANABU\nMANTAPPU",
      {
        fontSize: "42px",
        fontStyle: "bold",
        color: "#ffff00",
        align: "center"
      }
    ).setOrigin(0.5);

    const btn = this.add.rectangle(
      width/2,
      height*0.6,
      220,
      54,
      0xffff00
    )
    .setInteractive({ useHandCursor: true });

    this.add.text(
      width/2,
      height*0.6,
      "START",
      {
        fontSize: "20px",
        fontStyle: "bold",
        color: "#000000"
      }
    ).setOrigin(0.5);

    btn.on("pointerdown", () => {
      this.sound.play("click");
      this.scene.start("GameScene", {
        level: 0,
        score: 0,
        lives: 3
      });
    });
  }
}
