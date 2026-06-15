import assert from "node:assert/strict";
import {
  createWorld,
  createInventory,
  mineTile,
  placeTile,
  TILE,
} from "../src/game-core.mjs";

const world = createWorld(32, 18, 7);

assert.equal(world.width, 32);
assert.equal(world.height, 18);
assert.ok(world.tiles.some((row) => row.includes(TILE.GRASS)), "world should include grass");
assert.ok(world.tiles.some((row) => row.includes(TILE.CRYSTAL)), "world should include crystal ore");

const inventory = createInventory();
const target = { x: 4, y: 10 };
world.tiles[target.y][target.x] = TILE.STONE;

const mined = mineTile(world, inventory, target.x, target.y);
assert.equal(mined.ok, true);
assert.equal(world.tiles[target.y][target.x], TILE.EMPTY);
assert.equal(inventory.stone, 1);

const placed = placeTile(world, inventory, target.x, target.y, TILE.STONE);
assert.equal(placed.ok, true);
assert.equal(world.tiles[target.y][target.x], TILE.STONE);
assert.equal(inventory.stone, 0);

const blocked = placeTile(world, inventory, target.x, target.y, TILE.DIRT);
assert.equal(blocked.ok, false);
assert.equal(blocked.reason, "occupied");
