import OpenAI from 'openai';
import { checkRateLimit } from '@/lib/rate-limit';
import { getIp } from '@/lib/request-utils';
import { logger } from '@/lib/logger';

export const maxDuration = 90;

const deepseek = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY!,
    baseURL: 'https://api.deepseek.com',
});

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': 'https://estudioprompt.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// ── Templates (Steven Straker — MIT license) ────────────────────────────
// https://github.com/straker — minimal canvas games, educational, open source
// Hardcoded to avoid runtime fetch failures in serverless environments

const TEMPLATE_SNAKE = `<!DOCTYPE html>
<html>
<head>
  <title>Basic Snake HTML Game</title>
  <meta charset="UTF-8">
  <style>
  html, body {
    height: 100%;
    margin: 0;
  }

  body {
    background: black;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  canvas {
    border: 1px solid white;
  }
  </style>
</head>
<body>
<canvas width="400" height="400" id="game"></canvas>
<script>
var canvas = document.getElementById('game');
var context = canvas.getContext('2d');

var grid = 16;
var count = 0;

var snake = {
  x: 160,
  y: 160,
  dx: grid,
  dy: 0,
  cells: [],
  maxCells: 4
};
var apple = {
  x: 320,
  y: 320
};

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function loop() {
  requestAnimationFrame(loop);

  if (++count < 4) {
    return;
  }

  count = 0;
  context.clearRect(0,0,canvas.width,canvas.height);

  snake.x += snake.dx;
  snake.y += snake.dy;

  if (snake.x < 0) {
    snake.x = canvas.width - grid;
  }
  else if (snake.x >= canvas.width) {
    snake.x = 0;
  }

  if (snake.y < 0) {
    snake.y = canvas.height - grid;
  }
  else if (snake.y >= canvas.height) {
    snake.y = 0;
  }

  snake.cells.unshift({x: snake.x, y: snake.y});

  if (snake.cells.length > snake.maxCells) {
    snake.cells.pop();
  }

  context.fillStyle = 'red';
  context.fillRect(apple.x, apple.y, grid-1, grid-1);

  context.fillStyle = 'green';
  snake.cells.forEach(function(cell, index) {

    context.fillRect(cell.x, cell.y, grid-1, grid-1);

    if (cell.x === apple.x && cell.y === apple.y) {
      snake.maxCells++;

      apple.x = getRandomInt(0, 25) * grid;
      apple.y = getRandomInt(0, 25) * grid;
    }

    for (var i = index + 1; i < snake.cells.length; i++) {

      if (cell.x === snake.cells[i].x && cell.y === snake.cells[i].y) {
        snake.x = 160;
        snake.y = 160;
        snake.cells = [];
        snake.maxCells = 4;
        snake.dx = grid;
        snake.dy = 0;

        apple.x = getRandomInt(0, 25) * grid;
        apple.y = getRandomInt(0, 25) * grid;
      }
    }
  });
}

document.addEventListener('keydown', function(e) {
  if (e.which === 37 && snake.dx === 0) {
    snake.dx = -grid;
    snake.dy = 0;
  }
  else if (e.which === 38 && snake.dy === 0) {
    snake.dy = -grid;
    snake.dx = 0;
  }
  else if (e.which === 39 && snake.dx === 0) {
    snake.dx = grid;
    snake.dy = 0;
  }
  else if (e.which === 40 && snake.dy === 0) {
    snake.dy = grid;
    snake.dx = 0;
  }
});

requestAnimationFrame(loop);
</script>
</body>
</html>`;

const TEMPLATE_BREAKOUT = `<!DOCTYPE html>
<html>
<head>
  <title>Basic Breakout HTML Game</title>
  <meta charset="UTF-8">
  <style>
  html, body {
    height: 100%;
    margin: 0;
  }

  body {
    background: black;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  </style>
</head>
<body>
<canvas width="400" height="500" id="game"></canvas>
<script>
const canvas = document.getElementById('game');
const context = canvas.getContext('2d');

const level1 = [
  [],
  [],
  [],
  [],
  [],
  [],
  ['R','R','R','R','R','R','R','R','R','R','R','R','R','R'],
  ['R','R','R','R','R','R','R','R','R','R','R','R','R','R'],
  ['O','O','O','O','O','O','O','O','O','O','O','O','O','O'],
  ['O','O','O','O','O','O','O','O','O','O','O','O','O','O'],
  ['G','G','G','G','G','G','G','G','G','G','G','G','G','G'],
  ['G','G','G','G','G','G','G','G','G','G','G','G','G','G'],
  ['Y','Y','Y','Y','Y','Y','Y','Y','Y','Y','Y','Y','Y','Y'],
  ['Y','Y','Y','Y','Y','Y','Y','Y','Y','Y','Y','Y','Y','Y']
];

const colorMap = {
  'R': 'red',
  'O': 'orange',
  'G': 'green',
  'Y': 'yellow'
};

const brickGap = 2;
const brickWidth = 25;
const brickHeight = 12;

const wallSize = 12;
const bricks = [];

for (let row = 0; row < level1.length; row++) {
  for (let col = 0; col < level1[row].length; col++) {
    const colorCode = level1[row][col];

    bricks.push({
      x: wallSize + (brickWidth + brickGap) * col,
      y: wallSize + (brickHeight + brickGap) * row,
      color: colorMap[colorCode],
      width: brickWidth,
      height: brickHeight
    });
  }
}

const paddle = {
  x: canvas.width / 2 - brickWidth / 2,
  y: 440,
  width: brickWidth,
  height: brickHeight,
  dx: 0
};

const ball = {
  x: 130,
  y: 260,
  width: 5,
  height: 5,
  speed: 2,
  dx: 0,
  dy: 0
};

function collides(obj1, obj2) {
  return obj1.x < obj2.x + obj2.width &&
         obj1.x + obj1.width > obj2.x &&
         obj1.y < obj2.y + obj2.height &&
         obj1.y + obj1.height > obj2.y;
}

function loop() {
  requestAnimationFrame(loop);
  context.clearRect(0,0,canvas.width,canvas.height);

  paddle.x += paddle.dx;

  if (paddle.x < wallSize) {
    paddle.x = wallSize;
  }
  else if (paddle.x + brickWidth > canvas.width - wallSize) {
    paddle.x = canvas.width - wallSize - brickWidth;
  }

  ball.x += ball.dx;
  ball.y += ball.dy;

  if (ball.x < wallSize) {
    ball.x = wallSize;
    ball.dx *= -1;
  }
  else if (ball.x + ball.width > canvas.width - wallSize) {
    ball.x = canvas.width - wallSize - ball.width;
    ball.dx *= -1;
  }
  if (ball.y < wallSize) {
    ball.y = wallSize;
    ball.dy *= -1;
  }

  if (ball.y > canvas.height) {
    ball.x = 130;
    ball.y = 260;
    ball.dx = 0;
    ball.dy = 0;
  }

  if (collides(ball, paddle)) {
    ball.dy *= -1;
    ball.y = paddle.y - ball.height;
  }

  for (let i = 0; i < bricks.length; i++) {
    const brick = bricks[i];

    if (collides(ball, brick)) {
      bricks.splice(i, 1);

      if (ball.y + ball.height - ball.speed <= brick.y ||
          ball.y >= brick.y + brick.height - ball.speed) {
        ball.dy *= -1;
      }
      else {
        ball.dx *= -1;
      }

      break;
    }
  }

  context.fillStyle = 'lightgrey';
  context.fillRect(0, 0, canvas.width, wallSize);
  context.fillRect(0, 0, wallSize, canvas.height);
  context.fillRect(canvas.width - wallSize, 0, wallSize, canvas.height);

  if (ball.dx || ball.dy) {
    context.fillRect(ball.x, ball.y, ball.width, ball.height);
  }

  bricks.forEach(function(brick) {
    context.fillStyle = brick.color;
    context.fillRect(brick.x, brick.y, brick.width, brick.height);
  });

  context.fillStyle = 'cyan';
  context.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

document.addEventListener('keydown', function(e) {
  if (e.which === 37) {
    paddle.dx = -3;
  }
  else if (e.which === 39) {
    paddle.dx = 3;
  }

  if (ball.dx === 0 && ball.dy === 0 && e.which === 32) {
    ball.dx = ball.speed;
    ball.dy = ball.speed;
  }
});

document.addEventListener('keyup', function(e) {
  if (e.which === 37 || e.which === 39) {
    paddle.dx = 0;
  }
});

requestAnimationFrame(loop);
</script>
</body>
</html>`;

const TEMPLATE_PONG = `<!DOCTYPE html>
<html>
<head>
  <title>Basic Pong HTML Game</title>
  <meta charset="UTF-8">
  <style>
  html, body {
    height: 100%;
    margin: 0;
  }

  body {
    background: black;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  </style>
</head>
<body>
<canvas width="750" height="585" id="game"></canvas>
<script>
const canvas = document.getElementById('game');
const context = canvas.getContext('2d');
const grid = 15;
const paddleHeight = grid * 5;
const maxPaddleY = canvas.height - grid - paddleHeight;

var paddleSpeed = 6;
var ballSpeed = 5;

const leftPaddle = {
  x: grid * 2,
  y: canvas.height / 2 - paddleHeight / 2,
  width: grid,
  height: paddleHeight,
  dy: 0
};
const rightPaddle = {
  x: canvas.width - grid * 3,
  y: canvas.height / 2 - paddleHeight / 2,
  width: grid,
  height: paddleHeight,
  dy: 0
};
const ball = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  width: grid,
  height: grid,
  resetting: false,
  dx: ballSpeed,
  dy: -ballSpeed
};

function collides(obj1, obj2) {
  return obj1.x < obj2.x + obj2.width &&
         obj1.x + obj1.width > obj2.x &&
         obj1.y < obj2.y + obj2.height &&
         obj1.y + obj1.height > obj2.y;
}

function loop() {
  requestAnimationFrame(loop);
  context.clearRect(0,0,canvas.width,canvas.height);

  leftPaddle.y += leftPaddle.dy;
  rightPaddle.y += rightPaddle.dy;

  if (leftPaddle.y < grid) {
    leftPaddle.y = grid;
  }
  else if (leftPaddle.y > maxPaddleY) {
    leftPaddle.y = maxPaddleY;
  }

  if (rightPaddle.y < grid) {
    rightPaddle.y = grid;
  }
  else if (rightPaddle.y > maxPaddleY) {
    rightPaddle.y = maxPaddleY;
  }

  context.fillStyle = 'white';
  context.fillRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height);
  context.fillRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height);

  ball.x += ball.dx;
  ball.y += ball.dy;

  if (ball.y < grid) {
    ball.y = grid;
    ball.dy *= -1;
  }
  else if (ball.y + grid > canvas.height - grid) {
    ball.y = canvas.height - grid * 2;
    ball.dy *= -1;
  }

  if ((ball.x < 0 || ball.x > canvas.width) && !ball.resetting) {
    ball.resetting = true;

    setTimeout(() => {
      ball.resetting = false;
      ball.x = canvas.width / 2;
      ball.y = canvas.height / 2;
    }, 400);
  }

  if (collides(ball, leftPaddle)) {
    ball.dx *= -1;
    ball.x = leftPaddle.x + leftPaddle.width;
  }
  else if (collides(ball, rightPaddle)) {
    ball.dx *= -1;
    ball.x = rightPaddle.x - ball.width;
  }

  context.fillRect(ball.x, ball.y, ball.width, ball.height);

  context.fillStyle = 'lightgrey';
  context.fillRect(0, 0, canvas.width, grid);
  context.fillRect(0, canvas.height - grid, canvas.width, canvas.height);

  for (let i = grid; i < canvas.height - grid; i += grid * 2) {
    context.fillRect(canvas.width / 2 - grid / 2, i, grid, grid);
  }
}

document.addEventListener('keydown', function(e) {
  if (e.which === 38) {
    rightPaddle.dy = -paddleSpeed;
  }
  else if (e.which === 40) {
    rightPaddle.dy = paddleSpeed;
  }

  if (e.which === 87) {
    leftPaddle.dy = -paddleSpeed;
  }
  else if (e.which === 83) {
    leftPaddle.dy = paddleSpeed;
  }
});

document.addEventListener('keyup', function(e) {
  if (e.which === 38 || e.which === 40) {
    rightPaddle.dy = 0;
  }

  if (e.which === 83 || e.which === 87) {
    leftPaddle.dy = 0;
  }
});

requestAnimationFrame(loop);
</script>
</body>
</html>`;

const TEMPLATE_DOODLE_JUMP = `<!DOCTYPE html>
<html>
<head>
  <title>Basic Doodle Jump HTML Game</title>
  <meta charset="UTF-8">
  <style>
  html, body {
    height: 100%;
    margin: 0;
  }

  body {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  canvas {
    border: 1px solid black;
  }
  </style>
</head>
<body>
<canvas width="375" height="667" id="game"></canvas>
<script>
const canvas = document.getElementById('game');
const context = canvas.getContext('2d');

const platformWidth = 65;
const platformHeight = 20;
const platformStart = canvas.height - 50;

const gravity = 0.33;
const drag = 0.3;
const bounceVelocity = -12.5;

let minPlatformSpace = 15;
let maxPlatformSpace = 20;

let platforms = [{
  x: canvas.width / 2 - platformWidth / 2,
  y: platformStart
}];

function random(min, max) {
  return Math.random() * (max - min) + min;
}

let y = platformStart;
while (y > 0) {
  y -= platformHeight + random(minPlatformSpace, maxPlatformSpace);

  let x;
  do {
    x = random(25, canvas.width - 25 - platformWidth);
  } while (
    y > canvas.height / 2 &&
    x > canvas.width / 2 - platformWidth * 1.5 &&
    x < canvas.width / 2 + platformWidth / 2
  );

  platforms.push({ x, y });
}

const doodle = {
  width: 40,
  height: 60,
  x: canvas.width / 2 - 20,
  y: platformStart - 60,
  dx: 0,
  dy: 0
};

let playerDir = 0;
let keydown = false;
let prevDoodleY = doodle.y;

function loop() {
  requestAnimationFrame(loop);
  context.clearRect(0,0,canvas.width,canvas.height);

  doodle.dy += gravity;

  if (doodle.y < canvas.height / 2 && doodle.dy < 0) {
    platforms.forEach(function(platform) {
      platform.y += -doodle.dy;
    });

    while (platforms[platforms.length - 1].y > 0) {
      platforms.push({
        x: random(25, canvas.width - 25 - platformWidth),
        y: platforms[platforms.length - 1].y - (platformHeight + random(minPlatformSpace, maxPlatformSpace))
      });

      minPlatformSpace += 0.5;
      maxPlatformSpace += 0.5;

      maxPlatformSpace = Math.min(maxPlatformSpace, canvas.height / 2);
    }
  }
  else {
    doodle.y += doodle.dy;
  }

  if (!keydown) {
    if (playerDir < 0) {
      doodle.dx += drag;

      if (doodle.dx > 0) {
        doodle.dx = 0;
        playerDir = 0;
      }
    }
    else if (playerDir > 0) {
      doodle.dx -= drag;

      if (doodle.dx < 0) {
        doodle.dx = 0;
        playerDir = 0;
      }
    }
  }

  doodle.x += doodle.dx;

  if (doodle.x + doodle.width < 0) {
    doodle.x = canvas.width;
  }
  else if (doodle.x > canvas.width) {
    doodle.x = -doodle.width;
  }

  context.fillStyle = 'green';
  platforms.forEach(function(platform) {
    context.fillRect(platform.x, platform.y, platformWidth, platformHeight);

    if (
      doodle.dy > 0 &&
      prevDoodleY + doodle.height <= platform.y &&
      doodle.x < platform.x + platformWidth &&
      doodle.x + doodle.width > platform.x &&
      doodle.y < platform.y + platformHeight &&
      doodle.y + doodle.height > platform.y
    ) {
      doodle.y = platform.y - doodle.height;
      doodle.dy = bounceVelocity;
    }
  });

  context.fillStyle = 'yellow';
  context.fillRect(doodle.x, doodle.y, doodle.width, doodle.height);

  prevDoodleY = doodle.y;

  platforms = platforms.filter(function(platform) {
    return platform.y < canvas.height;
  });
}

document.addEventListener('keydown', function(e) {
  if (e.which === 37) {
    keydown = true;
    playerDir = -1;
    doodle.dx = -3;
  }
  else if (e.which === 39) {
    keydown = true;
    playerDir = 1;
    doodle.dx = 3;
  }
});

document.addEventListener('keyup', function(e) {
  keydown = false;
});

requestAnimationFrame(loop);
</script>
</body>
</html>`;

const TEMPLATE_HELICOPTER = `<!DOCTYPE html>
<html>
<head>
  <title>Basic Helicopter HTML Game</title>
  <meta charset="UTF-8">
  <style>
  html, body {
    height: 100%;
    margin: 0;
  }

  body {
    background: black;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  </style>
</head>
<body>
<canvas width="800" height="550" id="game"></canvas>
<script>
const canvas = document.getElementById('game');
const context = canvas.getContext('2d');

const minTunnelWidth = 400;
const maxTunnelWidth = canvas.width;
const minHeight = 10;
const maxHeight = 100;

const obstacleWidth = 65;
const obstacleHeight = 135;

const moveSpeed = 7;
const gravity = 0.35;

let spacePressed = false;

function clamp(num, min, max) {
  return Math.min( Math.max(min, num), max);
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const helicopter = {
  x: 200,
  y: 100,
  width: 100,
  height: 60,
  dy: 0,
  ddy: 0
};

let tunnels = [{
  x: 0,
  width: canvas.width,
  start: 50,
  end: 50
},
{
  x: canvas.width,
  width: randInt(minTunnelWidth, maxTunnelWidth),
  start: 50,
  end: randInt(minHeight, maxHeight)
}];

let obstacles = [{
  x: canvas.width,
  y: canvas.height / 2
},
{
  x: canvas.width * 2,
  y: canvas.height / 2
}];

const wallColor = 'green';
context.fillStyle = wallColor;
context.fillRect(0, 0, 1, 1);

const wallData = context.getImageData(0, 0, 1, 1);
const [ wallRed, wallGreen, wallBlue ] = wallData.data;

let rAF;
function loop() {
  rAF = requestAnimationFrame(loop);
  context.clearRect(0,0,canvas.width,canvas.height);

  if (spacePressed) {
    helicopter.ddy = -0.7;
  }
  else {
    helicopter.ddy = 0;
  }

  helicopter.dy += helicopter.ddy + gravity;
  helicopter.dy = clamp(helicopter.dy, -8, 8);
  helicopter.y += helicopter.dy;

  context.fillStyle = 'white';
  context.fillRect(helicopter.x, helicopter.y, helicopter.width, helicopter.height);

  context.fillStyle = 'green';
  tunnels.forEach((tunnel, index) => {
    tunnel.x -= moveSpeed;

    if (
      index === tunnels.length - 1 &&
      tunnel.x + tunnel.width <= canvas.width
    ) {
      tunnels.push({
        x: tunnel.x + tunnel.width,
        width: randInt(minTunnelWidth, maxTunnelWidth),
        start: tunnel.end,
        end: randInt(minHeight, maxHeight)
      });
    }

    context.beginPath();
    context.moveTo(tunnel.x, 0);
    context.lineTo(tunnel.x, tunnel.start);
    context.lineTo(tunnel.x + tunnel.width, tunnel.end);
    context.lineTo(tunnel.x + tunnel.width, 0);
    context.closePath();
    context.fill();

    context.beginPath();
    context.moveTo(tunnel.x, canvas.height);
    context.lineTo(tunnel.x, tunnel.start + 450);
    context.lineTo(tunnel.x + tunnel.width, tunnel.end + 450);
    context.lineTo(tunnel.x + tunnel.width, canvas.height);
    context.closePath();
    context.fill();
  });

  obstacles.forEach((obstacle, index) => {
    obstacle.x -= moveSpeed;
    context.fillRect(obstacle.x, obstacle.y, obstacleWidth, obstacleHeight);

    if (
      index === obstacles.length - 1 &&
      obstacle.x + obstacleWidth <= canvas.width
    ) {
      obstacles.push({
        x: canvas.width * 2,
        y: randInt(maxHeight + 50, canvas.height - obstacleHeight - maxHeight - 50)
      });
    }
  });

  tunnels = tunnels.filter(tunnel => tunnel.x + tunnel.width > 0);
  obstacles = obstacles.filter(obstacle => obstacle.x + obstacleWidth > 0);

  const { data } = context.getImageData(helicopter.x, helicopter.y, helicopter.width, helicopter.height);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (r === wallRed && g === wallGreen && b === wallBlue) {
      context.strokeStyle = 'red';
      context.setLineDash([5, 15]);
      context.lineWidth = 4;

      context.beginPath();
      context.arc(helicopter.x + helicopter.width / 2, helicopter.y + helicopter.height / 2, helicopter.width, 0, 2 * Math.PI);
      context.stroke();

      cancelAnimationFrame(rAF);
    }
  }
}

document.addEventListener('keydown', function(e) {
  if (e.code === 'Space') {
    spacePressed = true;
  }
});
document.addEventListener('keyup', function(e) {
  if (e.code === 'Space') {
    spacePressed = false;
  }
});

rAF = requestAnimationFrame(loop);
</script>
</body>
</html>`;

const TEMPLATES: Record<string, { code: string; genre: string; description: string }> = {
    snake: {
        code: TEMPLATE_SNAKE,
        genre: 'arcade',
        description: 'Snake that grows eating food, avoid walls and itself. Arrow keys.',
    },
    breakout: {
        code: TEMPLATE_BREAKOUT,
        genre: 'arcade',
        description: 'Bounce a ball to break bricks. Mouse/keyboard paddle. Space to launch.',
    },
    pong: {
        code: TEMPLATE_PONG,
        genre: 'arcade',
        description: 'Classic Pong: player vs AI, bounce ball back and forth. Arrow keys + W/S.',
    },
    'doodle-jump': {
        code: TEMPLATE_DOODLE_JUMP,
        genre: 'platformer',
        description: 'Jump upward on platforms infinitely. Arrow keys. Score = height.',
    },
    helicopter: {
        code: TEMPLATE_HELICOPTER,
        genre: 'endless',
        description: 'Fly helicopter through cave obstacles. Hold space/click to go up.',
    },
};

// Fase 1: R1 elige el template más apropiado y planifica los cambios
const DESIGN_SYSTEM = `You are a creative game customizer. Given 3 elements and a list of game templates, choose the best template and plan SPECIFIC changes to theme it around the elements.

Available templates:
${Object.entries(TEMPLATES).map(([k, v]) => `- ${k}: ${v.description}`).join('\n')}

Respond ONLY with valid JSON (no markdown, no extra text):
{
  "template": "<template name from list above>",
  "title": "<creative game title incorporating the elements>",
  "changes": [
    "<specific change 1: e.g. 'Replace snake color #00ff00 with #ff6b35'>",
    "<specific change 2: e.g. 'Rename food to [element]'>",
    "<specific change 3>",
    "<specific change 4>",
    "<specific change 5>"
  ]
}

CHANGE RULES:
- Max 6 changes. Be SPECIFIC (mention exact things to change, not vague instructions).
- Prefer: color changes, label/text changes, speed tweaks (+20% faster), rename objects.
- Avoid: structural changes, new game mechanics, adding new systems.
- The 3 elements must appear in the title and at least 2 changes.`;

// Fase 2: V3 aplica los cambios al template existente
const EDIT_SYSTEM = `You are a code editor. Your job is to apply a short list of changes to an existing HTML game file.

RULES:
1. Output ONLY the complete modified HTML. Start with <!DOCTYPE html>. Zero text outside.
2. Apply ALL the listed changes. Keep everything else IDENTICAL.
3. Add touch support if missing:
   - Tap/touchstart = spacebar or primary action
   - Touch left half of canvas = left arrow; right half = right arrow
   - Add: canvas.addEventListener('touchstart', e => { e.preventDefault(); ... }, {passive:false})
4. Make canvas responsive: add this after canvas is created:
   function resizeCanvas() { const s = Math.min(400, window.innerWidth - 16); canvas.width = s; canvas.height = s; }
   window.addEventListener('resize', resizeCanvas); resizeCanvas();
   (Only if canvas is square — for non-square games, resize only width proportionally)
5. Show the custom title on the start screen.
6. Keep the code compact. Do not add comments unless already present.`;

export async function OPTIONS() {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
    const ip = getIp(request);
    const rateLimit = await checkRateLimit(ip, 'gamegen', 5, 60);
    if (!rateLimit.success) {
        return Response.json(
            { error: 'Máximo 5 juegos por minuto. Esperá un momento.' },
            { status: 429, headers: CORS_HEADERS }
        );
    }

    let triggers: string[];
    try {
        const body = await request.json();
        triggers = (body.triggers as string[])?.filter((t: string) => t?.trim());
        if (!triggers?.length) {
            return Response.json({ error: 'Se requiere al menos un elemento.' }, { status: 400, headers: CORS_HEADERS });
        }
    } catch {
        return Response.json({ error: 'JSON inválido.' }, { status: 400, headers: CORS_HEADERS });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const send = (data: object) => {
                try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)); }
                catch { /* cerrado */ }
            };

            try {
                // ── FASE 1: R1 elige template y planifica cambios ──────────────────
                send({ type: 'phase', phase: 'design' });

                const planRes = await deepseek.chat.completions.create({
                    model: 'deepseek-reasoner',
                    messages: [
                        { role: 'system', content: DESIGN_SYSTEM },
                        { role: 'user', content: `Elements: ${triggers.join(', ')}` },
                    ],
                    max_tokens: 500,
                });

                const raw = planRes.choices[0].message.content || '{}';
                let plan: { template: string; title: string; changes: string[] };
                try {
                    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
                    plan = JSON.parse(cleaned);
                } catch {
                    plan = {
                        template: 'snake',
                        title: triggers.join(' & '),
                        changes: [`Rename "Snake" to "${triggers[0]}"`, `Change food color to orange`],
                    };
                }

                // Validar que el template existe
                if (!TEMPLATES[plan.template]) plan.template = 'snake';

                send({ type: 'plan', content: { title: plan.title, template: plan.template, changes: plan.changes } });

                // ── FASE 2: V3 aplica los cambios en streaming ────────────────────
                send({ type: 'phase', phase: 'code' });

                const templateCode = TEMPLATES[plan.template].code;
                const changesText = plan.changes.map((c, i) => `${i + 1}. ${c}`).join('\n');

                const codeStream = await deepseek.chat.completions.create({
                    model: 'deepseek-chat',
                    messages: [
                        { role: 'system', content: EDIT_SYSTEM },
                        {
                            role: 'user',
                            content: [
                                `Game title: "${plan.title}"`,
                                ``,
                                `Changes to apply:`,
                                changesText,
                                ``,
                                `Original game code:`,
                                `\`\`\`html`,
                                templateCode,
                                `\`\`\``,
                                ``,
                                `Output the complete modified HTML file.`,
                            ].join('\n'),
                        },
                    ],
                    max_tokens: 2800,
                    temperature: 0.15,
                    stream: true,
                });

                for await (const chunk of codeStream) {
                    const content = chunk.choices[0]?.delta?.content || '';
                    if (content) send({ type: 'code', content });
                    if (chunk.choices[0]?.finish_reason) send({ type: 'done' });
                }

                send({ type: 'done' }); // red de seguridad

            } catch (err) {
                logger.error('gamegen error:', err);
                send({ type: 'done' });
            } finally {
                try { controller.close(); } catch { /* ya cerrado */ }
            }
        },
    });

    return new Response(stream, {
        headers: {
            ...CORS_HEADERS,
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
