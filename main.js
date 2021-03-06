import { Canvas } from "https://deno.land/x/sdl2@0.1-alpha.6/src/canvas.ts";

const canvas = new Canvas({
  title: "Flappy Bird in Deno 🦕",
  height: 400,
  width: 800,
  centered: true,
  fullscreen: false,
  hidden: false,
  resizable: false,
  minimized: false,
  maximized: false,
});

// Create a class Entity
class Entity {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
}

const birdSurfaceGameOver = canvas.loadSurface(
  "sprites/yellowbird-gameover.png",
);
const birdTextureGameOver = canvas.createTextureFromSurface(
  birdSurfaceGameOver,
);
// Use class Entity and make class Player
class Player extends Entity {
  dead = false;
  constructor() {
    super(170, 100, 34, 24);

    const birdSurfaceMidflap = canvas.loadSurface(
      "sprites/yellowbird-midflap.png",
    );
    const birdTextureMidflap = canvas.createTextureFromSurface(
      birdSurfaceMidflap,
    );

    const birdSurfaceUpflap = canvas.loadSurface(
      "sprites/yellowbird-upflap.png",
    );
    const birdTextureUpflap = canvas.createTextureFromSurface(
      birdSurfaceUpflap,
    );

    const birdSurfaceDownflap = canvas.loadSurface(
      "sprites/yellowbird-downflap.png",
    );
    const birdTextureDownflap = canvas.createTextureFromSurface(
      birdSurfaceDownflap,
    );

    this.textures = [
      birdTextureUpflap,
      birdTextureMidflap,
      birdTextureDownflap,
    ];

    this.animationCycle = 0;
  }

  render() {
    const texture = this.dead
      ? birdTextureGameOver
      : this.textures[this.animationCycle];
    canvas.copy(texture, {
      x: 0,
      y: 0,
      width: this.dead ? 34 : this.width,
      height: this.dead ? 41 : this.height,
    }, {
      x: this.x,
      y: this.y,
      width: this.dead ? 34 : this.width,
      height: this.dead ? 41 : this.height,
    });

    // Wing animation
    this.animationCycle += 1;
    if (this.animationCycle >= 3) {
      this.animationCycle = 0;
    }
  }

  die() {
    this.dead = true;
    this.y += 1;
  }
}

canvas.setCursor("sprites/cursor.png");

function checkCollision(
  x1,
  y1,
  w1,
  h1,
  x2,
  y2,
  w2,
  h2,
) {
  return !(x2 > w1 + x1 || x1 > w2 + x2 || y2 > h1 + y1 || y1 > h2 + y2);
}

const font = canvas.loadFont(
  "./fonts/mainfont.ttf",
  128,
  { style: "normal" },
);

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

let is_space = false;
let score_value = 0;

const gravity = 1;
const fps = 9;

const upperPipes = [];
const lowerPipes = [];

const UPPER_PIPE_Y = 0;
const LOWER_PIPE_Y_BASE = 800;
const PIPE_WIDTH = 52;
const PIPE_DISTANCE = 100;
const GAP = 130;

const bgScreenSurface = canvas.loadSurface("sprites/background.png");
const bgScreenTexture = canvas.createTextureFromSurface(bgScreenSurface);

const startSurface = canvas.loadSurface("sprites/start.png");
const startTexture = canvas.createTextureFromSurface(startSurface);

const pipeSurfaceUp = canvas.loadSurface("sprites/pipe-up.png");
const pipeTextureUp = canvas.createTextureFromSurface(pipeSurfaceUp);

const pipeSurfaceDown = canvas.loadSurface("sprites/pipe-down.png");
const pipeTextureDown = canvas.createTextureFromSurface(pipeSurfaceDown);

const bird = new Player();

let gameOver = false;
let intro = true;


for (let i = 1; i < 6; i++) {
  const height = getRandomInt(100, 300);
  const distance = (i == 1) ? 0 : PIPE_DISTANCE;
  upperPipes.push({ x: 400 + (PIPE_WIDTH * i) + (distance * i), height });

  // Screen width - Corresponding upper pipe height - Random Gap
  lowerPipes.push({
    x: 400 + (PIPE_WIDTH * i) + (distance * i),
    height: 800 - height - GAP,
  });
}
canvas.clear();

canvas.copy(bgScreenTexture, { x: 0, y: 0, width: 400, height: 800 }, {
  x: 0,
  y: 0,
  width: 400,
  height: 800,
});
canvas.copy(startTexture, { x: 0, y: 0, width: 400, height: 800 }, {
  x: 100,
  y: 230,
  width: 210,
  height: 300,
});

canvas.present();

for await (const event of canvas) {
  switch (event.type) {
    case "draw":
      if (intro) {
        break;
      }

      canvas.copy(bgScreenTexture, { x: 0, y: 0, width: 400, height: 800 }, {
        x: 0,
        y: 0,
        width: 400,
        height: 800,
      });

      for (let idx = 0; idx < upperPipes.length; idx++) {
        if (
          checkCollision(
            bird.x,
            bird.y,
            34,
            24,
            upperPipes[idx].x,
            UPPER_PIPE_Y,
            PIPE_WIDTH,
            upperPipes[idx].height,
          ) ||
          checkCollision(
            bird.x,
            bird.y,
            34,
            24,
            lowerPipes[idx].x,
            LOWER_PIPE_Y_BASE - lowerPipes[idx].height,
            PIPE_WIDTH,
            lowerPipes[idx].height,
          )
        ) {
          // Only runs once
          if (!gameOver) {
            gameOver = true;
            canvas.playMusic(
              "./audio/game_over.wav",
            );
            canvas.present();
          }
        }
        if (
          checkCollision(
            bird.x + 50 / 2,
            bird.y,
            0,
            50,
            upperPipes[idx].x + PIPE_WIDTH / 2,
            upperPipes[idx].height,
            0,
            800 - upperPipes[idx].height - lowerPipes[idx].height,
          )
        ) {
          score_value += 1;
          const score_effects = ["scored_1.wav", "scored_2.wav"];
          canvas.playMusic(
            "./audio/" + score_effects[Math.floor(Math.random() * 2)],
          );
        }

        // Debug:
        // canvas.fillRect(playerX + 50 / 2, playerY, 0, 50)
        // canvas.fillRect(upperPipes[idx].x + PIPE_WIDTH / 2, upperPipes[idx].height, 0, 800 - upperPipes[idx].height - lowerPipes[idx].height);

        // Pipes
        canvas.copy(pipeTextureDown, { x: 0, y: 0, width: 52, height: 320 }, {
          x: upperPipes[idx].x,
          y: UPPER_PIPE_Y,
          width: PIPE_WIDTH,
          height: upperPipes[idx].height,
        });
        canvas.copy(pipeTextureUp, { x: 0, y: 0, width: 52, height: 320 }, {
          x: lowerPipes[idx].x,
          y: LOWER_PIPE_Y_BASE - lowerPipes[idx].height,
          width: PIPE_WIDTH,
          height: lowerPipes[idx].height,
        });
        if (!gameOver) {
          bird.render();

          upperPipes[idx].x -= 1;
          lowerPipes[idx].x -= 1;
          if (upperPipes[idx].x <= -PIPE_WIDTH) {
            upperPipes[idx].x = 800 + PIPE_WIDTH;
            upperPipes[idx].height = getRandomInt(100, 190);
            lowerPipes[idx].x = 800 + PIPE_WIDTH;
            lowerPipes[idx].height = 800 - upperPipes[idx].height - GAP;
          }

          if (bird.y >= 800 - 50) {
            gameOver = true;

            canvas.playMusic(
              "./audio/game_over.wav",
            );
          }
        } else {
          bird.die();
          bird.render();
        }
      }

      canvas.renderFont(font, score_value.toString(), {
        blended: { color: { r: 255, g: 255, b: 255, a: 255 } },
      }, {
        x: 10,
        y: -20,
      });

      // Game physics
      if (is_space) {
        bird.y -= 50;
        is_space = false;
      } else {
        // Give player downwards acceleration
        bird.y += gravity;
      }
      if (bird.y >= 800 - 50) {
        bird.y = 800 - 50;
      }
      canvas.present();
      Deno.sleepSync(fps);
      break;
    case "quit":
      canvas.quit();
      break;
    case "key_down":
      // Space
      if (event.keycode == 32 && !gameOver) {
        intro = false;
        is_space = true;
      }
      if (event.keycode == 114 && gameOver) {
        intro = true;
        gameOver = false;
      }
      break;
    case "mouse_button_down":
      if (event.button == 1 && !gameOver) {
        // Left click
        intro = false;
        is_space = true;
      }
      break;
    default:
      break;
  }
}
