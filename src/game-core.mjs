export const TILE = Object.freeze({
  EMPTY: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  WOOD: 4,
  CRYSTAL: 5,
});

export const TILE_META = Object.freeze({
  [TILE.GRASS]: { key: "dirt", solid: true, name: "星苔土" },
  [TILE.DIRT]: { key: "dirt", solid: true, name: "泥土" },
  [TILE.STONE]: { key: "stone", solid: true, name: "月纹石" },
  [TILE.WOOD]: { key: "wood", solid: true, name: "暮枝木" },
  [TILE.CRYSTAL]: { key: "crystal", solid: true, name: "蓝晶矿" },
});

export function createInventory() {
  return {
    dirt: 0,
    stone: 0,
    wood: 8,
    crystal: 0,
  };
}

export function createWorld(width = 96, height = 48, seed = 11) {
  const rand = seededRandom(seed);
  const tiles = Array.from({ length: height }, () => Array(width).fill(TILE.EMPTY));
  const surface = [];

  for (let x = 0; x < width; x += 1) {
    const wave = Math.sin(x * 0.23) * 2 + Math.sin(x * 0.07 + 1.8) * 3;
    const jitter = Math.floor(rand() * 3) - 1;
    surface[x] = Math.max(8, Math.min(height - 10, Math.floor(height * 0.38 + wave + jitter)));
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const ground = surface[x];
      if (y === ground) tiles[y][x] = TILE.GRASS;
      else if (y > ground && y < ground + 5) tiles[y][x] = TILE.DIRT;
      else if (y >= ground + 5) tiles[y][x] = rand() > 0.12 ? TILE.STONE : TILE.DIRT;

      if (y > ground + 9 && rand() > 0.965) tiles[y][x] = TILE.CRYSTAL;
    }
  }

  plantTrees(tiles, surface, rand);
  ensureCrystalDeposit(tiles, surface);

  return { width, height, tiles, surface };
}

export function isSolid(tile) {
  return Boolean(TILE_META[tile]?.solid);
}

export function mineTile(world, inventory, x, y) {
  if (!inBounds(world, x, y)) return { ok: false, reason: "out-of-bounds" };

  const tile = world.tiles[y][x];
  if (tile === TILE.EMPTY) return { ok: false, reason: "empty" };

  const itemKey = TILE_META[tile]?.key;
  if (itemKey) inventory[itemKey] = (inventory[itemKey] ?? 0) + 1;
  world.tiles[y][x] = TILE.EMPTY;

  return { ok: true, item: itemKey };
}

export function placeTile(world, inventory, x, y, tile) {
  if (!inBounds(world, x, y)) return { ok: false, reason: "out-of-bounds" };
  if (world.tiles[y][x] !== TILE.EMPTY) return { ok: false, reason: "occupied" };
  if (tile === TILE.EMPTY || !TILE_META[tile]) return { ok: false, reason: "invalid-tile" };

  const itemKey = TILE_META[tile].key;
  if ((inventory[itemKey] ?? 0) <= 0) return { ok: false, reason: "missing-item" };

  inventory[itemKey] -= 1;
  world.tiles[y][x] = tile;

  return { ok: true };
}

export function tileForInventoryKey(key) {
  if (key === "dirt") return TILE.DIRT;
  if (key === "stone") return TILE.STONE;
  if (key === "wood") return TILE.WOOD;
  if (key === "crystal") return TILE.CRYSTAL;
  return TILE.EMPTY;
}

function plantTrees(tiles, surface, rand) {
  for (let x = 5; x < surface.length - 5; x += 7) {
    if (rand() < 0.45) continue;
    const baseY = surface[x] - 1;
    const height = 3 + Math.floor(rand() * 3);
    for (let i = 0; i < height; i += 1) {
      if (baseY - i >= 0) tiles[baseY - i][x] = TILE.WOOD;
    }
  }
}

function ensureCrystalDeposit(tiles, surface) {
  if (tiles.some((row) => row.includes(TILE.CRYSTAL))) return;

  const x = Math.floor(surface.length * 0.68);
  const y = Math.min(tiles.length - 2, surface[x] + 7);
  tiles[y][x] = TILE.CRYSTAL;
}

function inBounds(world, x, y) {
  return x >= 0 && y >= 0 && x < world.width && y < world.height;
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
