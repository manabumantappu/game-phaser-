export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.level = 1;
        this.maxLevel = 3;
    }

    create() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.loadLevel(this.level);
    }

    // =====================
    // CLEAR LEVEL
    // =====================
    clearLevel() {
        if (this.player) this.player.destroy();
        if (this.collects) this.collects.clear(true, true);
        if (this.walls) this.walls.clear(true, true);
        if (this.goal) this.goal.destroy();
    }

    // =====================
    // LOAD LEVEL
    // =====================
    loadLevel(level) {
        this.clearLevel();

        this.collects = this.physics.add.group();
        this.walls = this.physics.add.staticGroup();

        // PLAYER
        this.player = this.physics.add.rectangle(50, 50, 28, 28, 0x3498db);
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);

        // LEVEL CONFIG
        if (level === 1) {
            this.createCollects([
                { x: 150, y: 100 },
                { x: 300, y: 150 }
            ]);
            this.createGoal(400, 250);
        }

        if (level === 2) {
            this.createCollects([
                { x: 100, y: 200 },
                { x: 200, y: 100 },
                { x: 350, y: 200 }
            ]);

            this.createRedWalls([
                { x: 200, y: 150, w: 300, h: 20 }
            ]);

            this.createGoal(450, 50);
        }

        if (level === 3) {
            this.createCollects([
                { x: 60, y: 300 },
                { x: 450, y: 80 }
            ]);

            // LABIRIN MERAH
            this.createRedWalls([
                { x: 200, y: 50, w: 350, h: 20 },
                { x: 200, y: 350, w: 350, h: 20 },
                { x: 100, y: 200, w: 20, h: 300 },
                { x: 300, y: 200, w: 20, h: 300 },
                { x: 400, y: 200, w: 20, h: 300 }
            ]);

            this.createGoal(470, 370);
        }

        // COLLIDERS
        this.physics.add.collider(this.player, this.walls);

        this.physics.add.overlap(
            this.player,
            this.collects,
            (player, collect) => {
                collect.destroy();
            }
        );

        this.physics.add.overlap(
            this.player,
            this.goal,
            () => {
                if (this.collects.countActive(true) === 0) {
                    this.nextLevel();
                }
            }
        );
    }

    // =====================
    // NEXT LEVEL
    // =====================
    nextLevel() {
        if (this.level < this.maxLevel) {
            this.level++;
            this.loadLevel(this.level);
        } else {
            alert('🎉 GAME SELESAI!');
            this.level = 1;
            this.loadLevel(this.level);
        }
    }

    // =====================
    // HELPERS
    // =====================
    createCollects(list) {
        list.forEach(pos => {
            const c = this.add.rectangle(pos.x, pos.y, 20, 20, 0xf1c40f);
            this.physics.add.existing(c);
            this.collects.add(c);
        });
    }

    createGoal(x, y) {
        this.goal = this.add.rectangle(x, y, 26, 26, 0x2ecc71);
        this.physics.add.existing(this.goal, true);
    }

    createRedWalls(list) {
        list.forEach(w => {
            const wall = this.add.rectangle(w.x, w.y, w.w, w.h, 0xe74c3c);
            this.physics.add.existing(wall, true);
            this.walls.add(wall);
        });
    }

    // =====================
    // UPDATE
    // =====================
    update() {
        const speed = 200;
        const body = this.player.body;

        body.setVelocity(0);

        if (this.cursors.left.isDown) body.setVelocityX(-speed);
        if (this.cursors.right.isDown) body.setVelocityX(speed);
        if (this.cursors.up.isDown) body.setVelocityY(-speed);
        if (this.cursors.down.isDown) body.setVelocityY(speed);
    }
}
