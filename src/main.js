import BootScene from "./scenes/BootScene.js";
import MenuScene from "./scenes/MenuScene.js";
import GameScene from "./scenes/GameScene.js";

const config = {
  type: Phaser.AUTO,
  width: 480,
  height: 640,
  backgroundColor: "#000000",
  parent: "game",
  scene: [BootScene, MenuScene, GameScene]
};

new Phaser.Game({
  type: Phaser.AUTO,
  width: 480,
  height: 640,
  backgroundColor: "#000000",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, GameScene]
});
