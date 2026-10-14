/* ============================================================
   Hill Climber - Infinite terrain + fuel cans
   ============================================================ */
var CHUNK_W = 400;
var currentSeed = Math.random() * 10;
var START_FLAT = 800, START_BLEND = 300, GROUND_Y = 300;

function seededRandom(x, seed) {
  var n = Math.sin(x * 12.9898 + seed * 78.233) * 43758.5453;
  return n - Math.floor(n);
}
function baseHeightAt(worldX, seed) {
  return currentMap().baseHeight(worldX, seed);
}
function terrainHeightAt(worldX, seed) {
  if (worldX < START_FLAT) return GROUND_Y;
  if (worldX < START_FLAT + START_BLEND) {
    var t = (worldX - START_FLAT) / START_BLEND;
    t = t * t * (3 - 2 * t);
    return GROUND_Y * (1 - t) + baseHeightAt(worldX, seed) * t;
  }
  return baseHeightAt(worldX, seed);
}
function terrainAngleAt(worldX, seed) {
  var dx = 16;
  var y1 = terrainHeightAt(worldX - dx, seed);
  var y2 = terrainHeightAt(worldX + dx, seed);
  return Math.atan2(y2 - y1, dx * 2);
}

var FUEL_SLOT_W = 600;
var fuelSlots = new Map();
function getFuelSlot(slot, seed) {
  if (fuelSlots.has(slot)) return fuelSlots.get(slot);
  var rand = seededRandom(slot * 17 + 11, seed);
  if (rand > 0.75) { fuelSlots.set(slot, null); return null; }
  var localX = seededRandom(slot * 31 + 7, seed) * (FUEL_SLOT_W - 200) + 100;
  var fx = slot * FUEL_SLOT_W + localX;
  if (fx < START_FLAT + 200) { fuelSlots.set(slot, null); return null; }
  // Don't place fuel cans inside water pools
  if (currentMap().water) {
    var wSlot = Math.floor(fx / 500);
    var wRand = seededRandom(wSlot * 23 + 7, seed);
    if (wRand < 0.5) {
      var wcx = wSlot * 500 + 250;
      if (Math.abs(fx - wcx) / 180 < 1) {
        fuelSlots.set(slot, null);
        return null;
      }
    }
  }
  var fy = terrainHeightAt(fx, seed) - 22;
  var can = { x: fx, y: fy, picked: false, slot: slot };
  fuelSlots.set(slot, can);
  return can;
}
function getNearestFuelCan(x) {
  var slot = Math.floor(x / FUEL_SLOT_W);
  for (var i = 0; i < 6; i++) {
    var can = getFuelSlot(slot + i, currentSeed);
    if (can && !can.picked && can.x > x) return can;
  }
  return null;
}
function clearFuelCans() { fuelSlots.clear(); }