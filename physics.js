/* ============================================================
   Hill Climber - Matter.js world + terrain chunks
   ============================================================ */
var Engine = Matter.Engine, World = Matter.World, Bodies = Matter.Bodies,
    Body = Matter.Body, Composite = Matter.Composite, Constraint = Matter.Constraint;

var engine = Engine.create();
var world = engine.world;
engine.gravity.y = settings.gravity;
engine.positionIterations = 8;
engine.velocityIterations = 6;

var TERRAIN_STEP = 8, TERRAIN_COL_H = 800;
var terrainBodies = new Map();
var terrainBodySet = new Set();

function buildChunkPhysics(chunkIndex, seed) {
  var bodies = [];
  var startX = chunkIndex * CHUNK_W;
  for (var x = startX; x < startX + CHUNK_W; x += TERRAIN_STEP) {
    var topY = terrainHeightAt(x + TERRAIN_STEP / 2, seed);
    var body = Bodies.rectangle(x + TERRAIN_STEP / 2, topY + TERRAIN_COL_H / 2,
      TERRAIN_STEP + 2, TERRAIN_COL_H, {
      isStatic: true, friction: 0.95, frictionStatic: 1.2, restitution: 0,
      label: "terrain"
    });
    bodies.push(body);
    terrainBodySet.add(body.id);
  }
  var comp = Composite.create({ bodies: bodies });
  Composite.add(world, comp);
  terrainBodies.set(chunkIndex, comp);
}
function ensureChunksAround(x) {
  var center = Math.floor(x / CHUNK_W);
  for (var i = center - 2; i <= center + 5; i++)
    if (!terrainBodies.has(i)) buildChunkPhysics(i, currentSeed);
  for (var [idx, comp] of terrainBodies) {
    if (idx < center - 4 || idx > center + 8) {
      comp.bodies.forEach(b => terrainBodySet.delete(b.id));
      Composite.remove(world, comp, true);
      terrainBodies.delete(idx);
    }
  }
}
function clearAllChunks() {
  for (var [idx, comp] of terrainBodies) {
    comp.bodies.forEach(b => terrainBodySet.delete(b.id));
    Composite.remove(world, comp, true);
  }
  terrainBodies.clear();
  terrainBodySet.clear();
}