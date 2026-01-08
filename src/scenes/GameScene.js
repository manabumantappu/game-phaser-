export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  init(data) {
    this.level = data.level || 1;
    this.score = data.score || 0;
  }

  create() {
    const { width, height } = this.scale;

    // LEVEL CONFIG
    this.targetsLeft = this.level + 2;
    this.timeLeft = Math.max(10, 30 - this.level * 2);

    // PLAYER
    this.player = this.add.rectangle(width / 2, height / 2, 32, 32, 0x00aaff);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);

    // TARGET
    this.spawnTarget();

    // UI
    this.uiText = this.add.text(10, 10, "", { color: "#ffffff" });
    this.updateUI();

    // INPUT
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys("W,A,S,D");

    // COLLISION
    this.physics.add.overlap(this.player, this.target, this.collectTarget, null, this);

    // TIMER
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timeLeft--;
        this.updateUI();

        if (this.timeLeft <= 0) {
          this.endGame();
        }
      },
      loop: true
    });

    // MOBILE SWIPE
    this.initSwipe();
  }

  spawnTarget() {
    const { width, height } = this.scale;

    this.target = this.add.rectangle(
      Phaser.Math.Between(40, width - 40),
      Phaser.Math.Between(80, height - 40),
      24,
      24,
      0xffcc00
    );
    this.physics.add.existing(this.target);
  }

  collectTarget() {
    this.score += 10;
    this.targetsLeft--;
    this.target.destroy();

    if (this.targetsLeft <= 0) {
      // NEXT LEVEL
      this.scene.restart({
        level: this.level + 1,
        score: this.score
      });
    } else {
      this.spawnTarget();
    }

    this.updateUI();
  }

  updateUI() {
    this.uiText.setText(
      `Level: ${this.level}\nScore: ${this.score}\nTargets: ${this.targetsLeft}\nTime: ${this.timeLeft}`
    );
  }

  endGame() {
    this.scene.start("GameOverScene", {
      score: this.score
    });
  }

  update() {
    const speed = 200;
    const body = this.player.body;
    body.setVelocity(0);

    if (this.cursors.left.isDown || this.keys.A.isDown) body.setVelocityX(-speed);
    if (this.cursors.right.isDown || this.keys.D.isDown) body.setVelocityX(speed);
    if (this.cursors.up.isDown || this.keys.W.isDown) body.setVelocityY(-speed);
    if (this.cursors.down.isDown || this.keys.S.isDown) body.setVelocityY(speed);
  }

  // 📱 MOBILE SWIPE CONTROL
  initSwipe() {
    let startX, startY;

    this.input.on("pointerdown", p => {
      startX = p.x;
      startY = p.y;
    });

    this.input.on("pointerup", p => {
      const dx = p.x - startX;
      const dy = p.y - startY;

      if (Math.abs(dx) > Math.abs(dy)) {
        this.player.body.setVelocityX(dx > 0 ? 200 : -200);
      } else {
        this.player.body.setVelocityY(dy > 0 ? 200 : -200);
      }
    });
  }
}
