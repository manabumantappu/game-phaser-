export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  create() {
    this.score = 0;
    this.timeLeft = 30;

    const { width, height } = this.scale;

    // Player (blue square)
    this.player = this.add.rectangle(240, 320, 32, 32, 0x00aaff);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);

    // Target (yellow square)
    this.target = this.add.rectangle(100, 100, 24, 24, 0xffcc00);
    this.physics.add.existing(this.target);

    // Text UI
    this.scoreText = this.add.text(10, 10, "Score: 0", { color: "#fff" });
    this.timerText = this.add.text(10, 30, "Time: 30", { color: "#fff" });

    // Keyboard input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys("W,A,S,D");

    // Overlap
    this.physics.add.overlap(this.player, this.target, this.collectTarget, null, this);

    // Timer countdown
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timeLeft--;
        this.timerText.setText("Time: " + this.timeLeft);

        if (this.timeLeft <= 0) {
          this.scene.start("GameOverScene", { score: this.score });
        }
      },
      loop: true
    });
  }

  collectTarget() {
    this.score++;
    this.scoreText.setText("Score: " + this.score);

    // Move target to random position
    this.target.x = Phaser.Math.Between(40, 440);
    this.target.y = Phaser.Math.Between(80, 600);
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
}
