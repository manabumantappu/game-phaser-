export default class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  preload() {
    // Ganti path sesuai aset kamu
    this.load.audio("intro", "assets/sound/intro.mp3");
    this.load.audio("click", "assets/sound/click.wav");
  }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.cameras.main.setBackgroundColor("#000000");

    // ===== SOUND INTRO =====
    this.introSound = this.sound.add("intro", {
      volume: 0.6,
      loop: false,
    });
    this.introSound.play();

    // ===== JUDUL GAME =====
    const title = this.add.text(cx, cy - 140, "KEJAR TIKUS!", {
      fontSize: "36px",
      fontFamily: "Arial",
      color: "#ffff00",
    })
    .setOrigin(0.5)
    .setAlpha(0);

    // Animasi judul (fade + scale)
    this.tweens.add({
      targets: title,
      alpha: 1,
      scale: { from: 0.8, to: 1 },
      duration: 800,
      ease: "Back.Out",
    });

    // ===== BRAND =====
    const brand = this.add.text(cx, cy - 95, "manabu mantappu game", {
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

    // ===== TOMBOL START =====
    const startBtn = this.add.text(cx, cy + 20, "START", {
      fontSize: "24px",
      color: "#ffffff",
      backgroundColor: "#333333",
      padding: { x: 30, y: 12 },
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .setAlpha(0);

    // Muncul setelah intro
    this.tweens.add({
      targets: startBtn,
      alpha: 1,
      y: cy,
      delay: 800,
      duration: 500,
      ease: "Power2",
    });

    // Hover effect
    startBtn.on("pointerover", () => {
      startBtn.setStyle({ backgroundColor: "#555555" });
    });

    startBtn.on("pointerout", () => {
      startBtn.setStyle({ backgroundColor: "#333333" });
    });

    // Klik START
    startBtn.on("pointerdown", () => {
      this.sound.play("click");

      // Stop intro sound
      if (this.introSound.isPlaying) {
        this.introSound.stop();
      }

      // Animasi keluar sebelum pindah scene
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
