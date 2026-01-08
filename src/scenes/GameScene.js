export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  init(data) {
    this.level = data.level || 0;
    this.score = data.score || 0;
  }

  create() {
    /* ======================
       MAZE DEFINITIONS
    ====================== */
    this.mazes = [
      [
        "##########",
        "#P....T..#",
        "#.####.#.#",
        "#....#.#.#",
        "#.##.#.#.#",
        "#.#..#...#",
        "#.#.####.#",
        "#...#..T.#",
        "#.###.##.#",
        "##########"
      ],
      [
        "##########",
        "#P.#....T#",
        "#.#.####.#",
        "#.#......#",
        "#.######.#",
        "#....#...#",
        "####.#.#.#",
        "#T...#.#.#",
        "#.#####..#",
        "##########"
      ]
    ];

    this.tileSize = 48;
    this.map = this.mazes[this.level % this.mazes.length];

    this.createMaze();
    this.createUI();
    this.createControls();
    this.createTimer();
  }

  createMaze() {
    const maze = this.map;
    const tile = this.tileSize;

    this.walls = this.physics.add.staticGroup();
    this.targets = this.physics.add.group();

    maze.forEach((row, y) => {
      [...row].forEach((cell, x) => {
        const px = x * tile + tile / 2;
        const py = y * tile + tile / 2;

        if (cell === "#") {
          const wall = this.add.rectangle(px, py, tile, tile, 0xaa3333);
          this.walls.add(wall);
        }

        if (cell === "P") {
          this.player = this.add.rectangle(px, py, tile * 0.6, tile * 0.6, 0x00aaff);
          this.physics.add.existing(this.player);
          this.player.body.setCollideWorldBounds(true);
        }

        if (cell === "T") {
          const target = this.add.rectangle(px, py, tile * 0.5, tile * 0.5, 0xffcc00);
          this.physics.add.existing(target);
          this.targets.add(target);
        }
      });
    });

    this.targetsLeft = this.targets.getChildren().length;

    this.physics.add.collider(this.player, this.walls);
    this.physics.add.overlap(this.player, this.targets, this.collectTarget, null, this);
  }

  createUI() {
    this.timeLeft = 40;
    this.uiText = this.add.text(10, 10, "", {
      color: "#ffffff",
      fontSize: "14px"
    });
    this.updateUI();
  }

  createControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys("W,A,S,D");
    this.createVirtualPad();
  }

  createTimer() {
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timeLeft--;
        this.updateUI();
        if (this.timeLeft <= 0) this.endGame();
      },
      loop: true
    });
  }

  collectTarget(player, target) {
    target.destroy();
    this.targetsLeft--;
    this.score += 10;
    this.updateUI();

    if (this.targetsLeft <= 0) {
      this.scene.restart({
        level: this.level + 1,
        score: this.score
      });
    }
  }

  updateUI() {
    this.uiText.setText(
      `Level: ${this.level + 1}\nScore: ${this.score}\nTargets: ${this.targetsLeft}\nTime: ${this.timeLeft}`
    );
  }

  endGame() {
    this.scene.start("GameOverScene", { score: this.score });
  }

  update() {
    const speed = 150;
    const body = this.player.body;
    body.setVelocity(0);

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
