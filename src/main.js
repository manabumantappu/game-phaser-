import BootScene from "./scenes/BootScene.js";
import MenuScene from "./scenes/MenuScene.js";
import GameScene from "./scenes/GameScene.js";
import GameOverScene from "./scenes/GameOverScene.js";
import LevelSelectScene from "./scenes/LevelSelectScene.js";

const config = {
  type: Phaser.AUTO,
  width: 480,
  height: 640,
  backgroundColor: "#1e1e1e",

  input: {
    activePointers: 3
  },

  physics: {
    default: "arcade",
    arcade: {
      debug: false
    }
  },

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },

  scene: [
    BootScene,
    MenuScene,
    GameScene,
    GameOverScene
  ]
};

new Phaser.Game(config);
