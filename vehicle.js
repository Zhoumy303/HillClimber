/* ============================================================
   Hill Climber - Vehicle
   ============================================================ */
var CAR_GROUP = -1;

function createCarPhysics(x, y) {
  var filter = { group: CAR_GROUP };

  var chassis = Bodies.rectangle(x, y, 70, 18, {
    density: 0.002, friction: 0.05, frictionAir: 0.005,
    chamfer: { radius: 4 }, collisionFilter: filter
  });
  var wheelOpts = {
    density: 0.005,
    friction: settings.friction,
    frictionStatic: settings.friction * 1.4,
    frictionAir: 0.001, restitution: 0.05,
    collisionFilter: filter
  };
  var wheelA = Bodies.circle(x - 24, y + 13, 13, wheelOpts);
  var wheelB = Bodies.circle(x + 24, y + 13, 13, wheelOpts);

  var cA = Constraint.create({
    bodyA: chassis, pointA: { x: -24, y: 13 },
    bodyB: wheelA, pointB: { x: 0, y: 0 },
    stiffness: 1.0, length: 0, damping: 0.1
  });
  var cB = Constraint.create({
    bodyA: chassis, pointA: { x: 24, y: 13 },
    bodyB: wheelB, pointB: { x: 0, y: 0 },
    stiffness: 1.0, length: 0, damping: 0.1
  });

  var comp = Composite.create({
    bodies: [chassis, wheelA, wheelB],
    constraints: [cA, cB]
  });
  Composite.add(world, comp);

  return {
    composite: comp, chassis, wheelA, wheelB,
    alive: true, startX: x, maxX: x, score: 0,
    fuel: settings.fuelMax,
    stuckTimer: 0,
    deathReason: null
  };
}
function destroyCarPhysics(car) {
  Composite.remove(world, car.composite, true);
}
function wheelTouchingTerrain(wheel) {
  var pairs = engine.pairs.list;
  for (var i = 0; i < pairs.length; i++) {
    var p = pairs[i];
    if (!p.isActive) continue;
    var a = p.bodyA, b = p.bodyB;
    var other = null;
    if (a.id === wheel.id) other = b;
    else if (b.id === wheel.id) other = a;
    else continue;
    if (terrainBodySet.has(other.id)) return true;
  }
  return false;
}
function carOnGround(car) {
  return wheelTouchingTerrain(car.wheelA) || wheelTouchingTerrain(car.wheelB);
}

function carUpVector(car) {
  var a = car.chassis.angle;
  return { x: Math.sin(a), y: -Math.cos(a) };
}

/* ★ Is the car in water? */
function isInWater(car) {
  if (!currentMap().water) return false;
  return car.chassis.position.y > WATER_LEVEL;
}

function controlCar(car, gas, brake) {
  var up = carUpVector(car);
  if (up.y > 0.3) return;

  var onGround = carOnGround(car);
  var inWater = isInWater(car);
  var wheelA = car.wheelA, wheelB = car.wheelB;

  if (onGround || inWater) {
    var speedFactor = inWater ? settings.waterSpeed : 1.0;
    var target = (gas ? settings.maxWheelAV : (brake ? -settings.maxWheelAV * 0.55 : 0)) * speedFactor;
    var cur = wheelA.angularVelocity;
    var next = cur + (target - cur) * 0.3;
    Body.setAngularVelocity(wheelA, next);
    Body.setAngularVelocity(wheelB, next);
  } else {
    var av = car.chassis.angularVelocity;
    var t = settings.airTorque;
    if (gas) Body.setAngularVelocity(car.chassis, av + t);
    if (brake) Body.setAngularVelocity(car.chassis, av - t);
  }
}

function carIsFlipped(car) {
  if (car.chassis.position.y > 700) return true;

  var cos = Math.cos(car.chassis.angle);
  var sin = Math.sin(car.chassis.angle);
  var px = car.chassis.position.x;
  var py = car.chassis.position.y;

  var roofPoints = [
    { lx: -30, ly: -9 },
    { lx:  30, ly: -9 }
  ];

  for (var i = 0; i < 2; i++) {
    var p = roofPoints[i];
    var wx = px + p.lx * cos - p.ly * sin;
    var wy = py + p.lx * sin + p.ly * cos;
    var terrainY = terrainHeightAt(wx, currentSeed);
    if (wy > terrainY - 2) {
      return true;
    }
  }
  return false;
}

function consumeFuel(car, gas, brake) {
  var use = settings.fuelIdle;
  if (gas) use += settings.fuelGas;
  if (isInWater(car)) use *= settings.waterFuel;
  car.fuel -= use;
  if (car.fuel <= 0) { car.fuel = 0; return true; }
  return false;
}
function tryPickupFuel(car) {
  var can = getNearestFuelCan(car.chassis.position.x - 100);
  if (can && !can.picked) {
    var dx = can.x - car.chassis.position.x;
    var dy = can.y - car.chassis.position.y;
    if (dx * dx + dy * dy < 40 * 40) {
      can.picked = true;
      car.fuel = Math.min(settings.fuelMax, car.fuel + settings.fuelPickup);
    }
  }
}