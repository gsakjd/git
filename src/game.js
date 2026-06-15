import {
  TILE,
  TILE_META,
  createInventory,
  createWorld,
  isSolid,
  mineTile,
  placeTile,
  tileForInventoryKey,
} from "./game-core.mjs";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const toolReadout = document.querySelector("#toolReadout");
const inventoryEl = document.querySelector("#inventory");
const tileSize = 18;
const world = createWorld(112, 58, 29);
const inventory = createInventory();
let selectedKey = "dirt";
let lastTime = 0;

const player = {
  x: 8 * tileSize,
  y: 8 * tileSize,
  w: 14,
  h: 26,
  vx: 0,
  vy: 0,
  onGround: false,
  facing: 1,
};

const keys = new Set();
const camera = { x: 0, y: 0 };

window.addEventListener("keydown", (event) => {
  keys.add(event.key.toLowerCase());
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

inventoryEl.addEventListener("click", (event) => {
  const slot = event.target.closest(".slot");
  if (!slot) return;
  selectedKey = slot.dataset.key;
  updateInventory();
});

canvas.addEventListener("contextmenu", (event) => event.preventDefault());
canvas.addEventListener("mousedown", (event) => {
  const tile = pointerToTile(event);
  if (event.button === 0) {
    mineTile(world, inventory, tile.x, tile.y);
  } else if (event.button === 2) {
    placeTile(world, inventory, tile.x, tile.y, tileForInventoryKey(selectedKey));
  }
  updateInventory();
});

function loop(time) {
  const delta = Math.min(32, time - lastTime || 16) / 1000;
  lastTime = time;
  update(delta);
  draw();
  requestAnimationFrame(loop);
}

function update(delta) {
  const left = keys.has("a") || keys.has("arrowleft");
  const right = keys.has("d") || keys.has("arrowright");
  const jump = keys.has("w") || keys.has("arrowup") || keys.has(" ");

  player.vx = 0;
  if (left) {
    player.vx = -142;
    player.facing = -1;
  }
  if (right) {
    player.vx = 142;
    player.facing = 1;
  }
  if (jump && player.onGround) {
    player.vy = -330;
    player.onGround = false;
  }

  player.vy += 820 * delta;
  move(player.vx * delta, 0);
  move(0, player.vy * delta);

  camera.x = clamp(player.x - canvas.width / 2, 0, world.width * tileSize - canvas.width);
  camera.y = clamp(player.y - canvas.height / 2, 0, world.height * tileSize - canvas.height);
}

function move(dx, dy) {
  player.x += dx;
  if (collides()) {
    player.x -= dx;
    player.vx = 0;
  }

  player.y += dy;
  player.onGround = false;
  if (collides()) {
    player.y -= dy;
    if (dy > 0) player.onGround = true;
    player.vy = 0;
  }
}

function collides() {
  const left = Math.floor(player.x / tileSize);
  const right = Math.floor((player.x + player.w) / tileSize);
  const top = Math.floor(player.y / tileSize);
  const bottom = Math.floor((player.y + player.h) / tileSize);

  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x <= right; x += 1) {
      if (y >= world.height || x < 0 || x >= world.width) return true;
      if (y >= 0 && isSolid(world.tiles[y][x])) return true;
    }
  }
  return false;
}

function draw() {
  drawSky();
  drawTiles();
  drawPlayer();
  drawCrosshair();
}

function drawSky() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#162b3c");
  gradient.addColorStop(0.55, "#214552");
  gradient.addColorStop(1, "#0f151a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(248, 223, 122, 0.9)";
  ctx.fillRect(86 - camera.x * 0.08, 52, 5, 5);
  ctx.fillRect(280 - camera.x * 0.04, 92, 3, 3);
  ctx.fillRect(610 - camera.x * 0.06, 64, 4, 4);
}

function drawTiles() {
  const startX = Math.floor(camera.x / tileSize);
  const endX = Math.ceil((camera.x + canvas.width) / tileSize);
  const startY = Math.floor(camera.y / tileSize);
  const endY = Math.ceil((camera.y + canvas.height) / tileSize);

  for (let y = startY; y <= endY; y += 1) {
    for (let x = startX; x <= endX; x += 1) {
      if (x < 0 || y < 0 || x >= world.width || y >= world.height) continue;
      const tile = world.tiles[y][x];
      if (tile === TILE.EMPTY) continue;
      drawTile(tile, x * tileSize - camera.x, y * tileSize - camera.y);
    }
  }
}

function drawTile(tile, x, y) {
  const palette = {
    [TILE.GRASS]: ["#4fb06f", "#2f7d50", "#8f5c38"],
    [TILE.DIRT]: ["#8f5c38", "#6f4029", "#b8794c"],
    [TILE.STONE]: ["#78858e", "#58666f", "#9aa7ae"],
    [TILE.WOOD]: ["#a56a3a", "#6d4027", "#d09154"],
    [TILE.CRYSTAL]: ["#43e6d4", "#157f91", "#d7fff6"],
  }[tile];

  ctx.fillStyle = palette[0];
  ctx.fillRect(x, y, tileSize, tileSize);
  ctx.fillStyle = palette[1];
  ctx.fillRect(x, y + tileSize - 5, tileSize, 5);
  ctx.fillStyle = palette[2];
  ctx.fillRect(x + 3, y + 3, 5, 4);
  if (tile === TILE.CRYSTAL) {
    ctx.fillStyle = "rgba(67, 230, 212, 0.36)";
    ctx.fillRect(x - 3, y - 3, tileSize + 6, tileSize + 6);
  }
}

function drawPlayer() {
  const x = Math.round(player.x - camera.x);
  const y = Math.round(player.y - camera.y);
  ctx.fillStyle = "#1d2a31";
  ctx.fillRect(x + 3, y + 8, 8, 15);
  ctx.fillStyle = "#f1c58f";
  ctx.fillRect(x + 3, y, 9, 8);
  ctx.fillStyle = "#36c7a7";
  ctx.fillRect(x + 2, y + 9, 11, 9);
  ctx.fillStyle = "#f8df7a";
  ctx.fillRect(x + (player.facing > 0 ? 11 : 0), y + 3, 3, 3);
  ctx.fillStyle = "#496f7a";
  ctx.fillRect(x + 3, y + 23, 4, 3);
  ctx.fillRect(x + 9, y + 23, 4, 3);
}

function drawCrosshair() {
  const hovered = pointerState.tile;
  if (!hovered) return;
  ctx.strokeStyle = "rgba(248, 223, 122, 0.85)";
  ctx.lineWidth = 2;
  ctx.strokeRect(
    hovered.x * tileSize - camera.x + 1,
    hovered.y * tileSize - camera.y + 1,
    tileSize - 2,
    tileSize - 2,
  );
}

const pointerState = { tile: null };
canvas.addEventListener("mousemove", (event) => {
  pointerState.tile = pointerToTile(event);
});

function pointerToTile(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: Math.floor((event.clientX - rect.left) * scaleX + camera.x) / tileSize | 0,
    y: Math.floor((event.clientY - rect.top) * scaleY + camera.y) / tileSize | 0,
  };
}

function updateInventory() {
  for (const key of Object.keys(inventory)) {
    document.querySelector(`#count-${key}`).textContent = inventory[key];
  }
  document.querySelectorAll(".slot").forEach((slot) => {
    slot.classList.toggle("active", slot.dataset.key === selectedKey);
  });
  const selectedTile = tileForInventoryKey(selectedKey);
  toolReadout.textContent = `当前：${TILE_META[selectedTile].name}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

updateInventory();
requestAnimationFrame(loop);
