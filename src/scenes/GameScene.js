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

    /* ======================
       LEVEL CONFIG
    ====================== */
    this.targetsLeft = this.level + 2;
    this.timeLeft = Math.max(10, 30 - this.level * 2);

    /* ======================
       PLAYER
    ====================== */
    this.player = this.add.rectangle(width / 2, height / 2, 32, 32, 0x00aaff);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);

    /* ======================
       TARGET
    ====================== */
    this.spawnTarget();

    /* ======================
       UI
    ====================== */
    this.uiText = this.add.text(10, 10, "", {
      color: "#ffffff",
      fontSize: "14px"
    });
    this.updateUI();

    /* ======================
       INPUT (KEYBOARD)
    ====================== */
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys("W,A,S,D");

    /* ======================
       COLLISION
    ====================== */
    this.physics.add.overlap(
      this.player,
      this.target,
      this.collectTarget,
      null,
      this
    );

    /* ======================
       TIMER
    ====================== */
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timeLeft--;
        this.updateUI();
        if (this.timeLeft <= 0) this.endGame();
      },
      loop: true
    });

    /* ======================
       MOBILE VIRTUAL BUTTON
    ====================== */
    this.createVirtualPad();
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
    this.scene.start("GameOverScene", { score: this.score });
  }

  update() {
    const speed = 180;
    const body = this.player.body;
    body.setVelocity(0);

    /* KEYBOARD */
    if (this.cursors.left.isDown || this.keys.A.isDown || this.moveLeft)
      body.setVelocityX(-speed);
    if (this.cursors.right.isDown || this.keys.D.isDown || this.moveRight)
      body.setVelocityX(speed);
    if (this.cursors.up.isDown || this.keys.W.isDown || this.moveUp)
      body.setVelocityY(-speed);
    if (this.cursors.down.isDown || this.keys.S.isDown || this.moveDown)
      body.setVelocityY(speed);
  }

  /* ======================
     VIRTUAL D-PAD
  ====================== */
  createVirtualPad() {
    const { width, height } = this.scale;

    this.moveLeft = this.moveRight = this.moveUp = this.moveDown = false;

    const size = 48;
    const alpha = 0.4;
    const yBase = height - 100;
    const xBase = 80;

    const createBtn = (x, y, dir) => {
      const btn = this.add
        .rectangle(x, y, size, size, 0xffffff, alpha)
        .setScrollFactor(0)
        .setInteractive();

      btn.on("pointerdown", () => (this[dir] = true));
      btn.on("pointerup", () => (this[dir] = false));
      btn.on("pointerout", () => (this[dir] = false));
    };

    createBtn(xBase - size, yBase, "moveLeft");
    createBtn(xBase + size, yBase, "moveRight");
    createBtn(xBase, yBase - size, "moveUp");
    createBtn(xBase, yBase + size, "moveDown");
  }
}
