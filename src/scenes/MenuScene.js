export default class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  preload() {
    // === AUDIO (PATH BENAR) ===
    this.load.audio("intro", "assets/audio/intro.mp3");
    this.load.audio("click", "assets/audio/click.wav");
  }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.cameras.main.setBackgroundColor("#000000");

    // ===== INTRO SOUND =====
    this.introSound = this.sound.add("intro", {
      volume: 0.6,
      loop: false,
    });
    this.introSound.play();

    // ===== TITLE =====
    const title = this.add.text(cx, cy - 140, "KEJAR TIKUS!", {
      fontSize: "36px",
      fontFamily: "Arial",
      color: "#ffff00",
    })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: title,
      alpha: 1,
      scale: { from: 0.8, to: 1 },
      duration: 800,
      ease: "Back.Out",
    });

    // ===== BRAND =====
    const brand = this.add.text(cx, cy - 95, "Tikus lapar ambil makanan...!!!", {
      fontSize: "14px",
      fontFamily: "Arial",
      color: "#00ffff",
    })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: brand,
      alpha: 1,
      delay: 400,
      duration: 600,
    });

    // ===== START BUTTON =====
    const startBtn = this.add.text(cx, cy + 20, "START", {
      fontSize: "24px",
      color: "#ffffff",
      backgroundColor: "#333333",
      padding: { x: 30, y: 12 },
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0);

    this.tweens.add({
      targets: startBtn,
      alpha: 1,
      delay: 800,
      duration: 500,
    });

    startBtn.on("pointerover", () => {
      startBtn.setStyle({ backgroundColor: "#555555" });
    });

    startBtn.on("pointerout", () => {
      startBtn.setStyle({ backgroundColor: "#333333" });
    });

    startBtn.on("pointerdown", () => {
      this.sound.play("click");

      if (this.introSound?.isPlaying) {
        this.introSound.stop();
      }

      this.tweens.add({
        targets: [title, brand, startBtn],
        alpha: 0,
        duration: 300,
        onComplete: () => {
          this.scene.start("GameScene", { level: 0 });
        },
      });
    });

    // ===== FOOTER =====
    this.add.text(cx, height - 30, "© 2026 manabu mantappu game", {
      fontSize: "10px",
      color: "#666666",
    }).setOrigin(0.5);
  }
}
