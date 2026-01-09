export default class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    // 🔥 PAKSA INPUT AKTIF
    this.input.enabled = true;
    this.input.addPointer(1);

    const { width, height } = this.scale;

    // background
    this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000
    ).setDepth(0);

    // tombol START (SUPER SIMPLE)
    const btn = this.add.rectangle(
      width / 2,
      height / 2,
      240,
      60,
      0xffff00
    )
    .setDepth(10)
    .setInteractive();

    const txt = this.add.text(
      width / 2,
      height / 2,
      "START",
      {
        fontSize: "24px",
        fontStyle: "bold",
        color: "#000000"
      }
    ).setOrigin(0.5).setDepth(11);

    // 🔥 DEBUG EVENT
    btn.on("pointerup", () => {
      console.log("START CLICKED"); // WAJIB MUNCUL
      this.scene.start("GameScene", {
        level: 0,
        score: 0,
        lives: 3
      });
    });
  }
}
