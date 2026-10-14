/* ============================================================
   Hill Climber - AI inputs / round / evolution / physics step / main loop
   ============================================================ */
function getAIInputs(car) {
  var chassis = car.chassis;
  var speedNorm = Math.max(-1, Math.min(1, chassis.velocity.x / 10));
  var angleNorm = Math.max(-1, Math.min(1, chassis.angle / 1.5));

  var x = chassis.position.x;
  var yHere = terrainHeightAt(x, currentSeed);
  var yFront30 = terrainHeightAt(x + 30, currentSeed);
  var yFront80 = terrainHeightAt(x + 80, currentSeed);

  var slope = Math.atan2(yFront30 - yHere, 30) / 1.2;
  slope = Math.max(-1, Math.min(1, slope));
  var dh = (yHere - yFront80) / 100;
  dh = Math.max(-1, Math.min(1, dh));

  // Airborne or in water both count as "no grip"
  var airborne = (carOnGround(car) && !isInWater(car)) ? 0 : 1;
  var fuelNorm = car.fuel / settings.fuelMax;
  var chaseGap = Math.max(-1, Math.min(1, (x - chaseX) / settings.chaseGap));

  var can = getNearestFuelCan(x);
  var canDx = can ? Math.max(-1, Math.min(1, (can.x - x) / 400)) : 0;
  var canDy = can ? Math.max(-1, Math.min(1, (yHere - can.y) / 100)) : 0;

  return [angleNorm, speedNorm, slope, dh, airborne, fuelNorm, chaseGap, canDx * 0.5 + canDy * 0.5];
}

function restart(keepHistory) {
  for (var i = 0; i < aiCars.length; i++) destroyCarPhysics(aiCars[i]);
  if (playerCar) destroyCarPhysics(playerCar);
  aiCars = []; playerCar = null;
  clearAllChunks();
  clearFuelCans();

  if (!keepHistory) {
    currentSeed = Math.random() * 10;
    generation = 0; bestEver = 0; playerBest = 0;
    trainHistory = { best: [], avg: [] };
  }
  generationEnding = false; playerDeadTimer = 0;

  Neuvol = new Neuroevolution({
    population: settings.population,
    network: [8, [10, 6], 2],
    mutationRate: settings.mutationRate,
    elitism: settings.elitism,
    randomBehaviour: settings.randomBehaviour
  });

  startGeneration();
}

function startGeneration() {
  generationEnding = false;
  playerDeadTimer = 0;

  for (var i = 0; i < aiCars.length; i++) destroyCarPhysics(aiCars[i]);
  aiCars = [];
  if (playerCar) { destroyCarPhysics(playerCar); playerCar = null; }
  clearAllChunks();
  clearFuelCans();

  if (mode !== "player") currentSeed = Math.random() * 10;

  var START_X = 100, START_Y = GROUND_Y - 26;
  chaseX = START_X - settings.chaseGap;

  if (mode === "ai" || mode === "versus") {
    aiNets = Neuvol.nextGeneration();
    for (var i = 0; i < aiNets.length; i++)
      aiCars.push(createCarPhysics(START_X, START_Y));
    aliveCount = aiCars.length;
  } else {
    aiNets = []; aliveCount = 0;
  }

  if (mode === "player" || mode === "versus")
    playerCar = createCarPhysics(START_X, START_Y);

  maxDistThisGen = 0;
  generation++;
  ensureChunksAround(START_X);
}

function stepPhysics(dt) {
  chaseX += settings.chaseSpeed;
  chasePulse += 0.15;

  for (var i = 0; i < aiCars.length; i++) {
    var car = aiCars[i];
    if (!car.alive) continue;
    var out = aiNets[i].compute(getAIInputs(car));
    var gas = out[0] > 0.5;
    var brake = out[1] > 0.5;
    controlCar(car, gas, brake);
    if (consumeFuel(car, gas, brake)) {
      car.alive = false;
      car.deathReason = "fuel";
      aliveCount--;
      Neuvol.networkScore(aiNets[i], car.score);
    }
  }

  if (playerCar && playerCar.alive) {
    controlCar(playerCar, playerGas, playerBrake);
    if (consumeFuel(playerCar, playerGas, playerBrake)) playerCar.alive = false;
  }

  Engine.update(engine, dt);

  for (var i = 0; i < aiCars.length; i++) {
    var car = aiCars[i];
    if (!car.alive) continue;
    tryPickupFuel(car);
    if (car.chassis.position.x > car.maxX) car.maxX = car.chassis.position.x;
    car.score = Math.max(0, car.maxX - car.startX);
    if (car.score > maxDistThisGen) maxDistThisGen = car.score;

    var speed = Math.abs(car.chassis.velocity.x);
    if (speed < 0.3 && carOnGround(car) && !isInWater(car)) {
      car.stuckTimer++;
      if (car.stuckTimer > settings.stuckTime) {
        car.alive = false;
        car.deathReason = "stuck";
        aliveCount--;
        Neuvol.networkScore(aiNets[i], car.score);
        continue;
      }
    } else {
      car.stuckTimer = 0;
    }

    var dead = false;
    if (carIsFlipped(car)) { dead = true; car.deathReason = "flip"; }
    if (car.chassis.position.x < chaseX) { dead = true; car.deathReason = "chase"; }
    if (dead) {
      car.alive = false;
      aliveCount--;
      Neuvol.networkScore(aiNets[i], car.score);
    }
  }

  if (playerCar && playerCar.alive) {
    tryPickupFuel(playerCar);
    if (playerCar.chassis.position.x > playerCar.maxX)
      playerCar.maxX = playerCar.chassis.position.x;
    playerCar.score = Math.max(0, playerCar.maxX - playerCar.startX);
    if (playerCar.score > playerBest) playerBest = playerCar.score;
    if (carIsFlipped(playerCar) || playerCar.chassis.position.x < chaseX)
      playerCar.alive = false;
  }

  var focusX = 0;
  for (var i = 0; i < aiCars.length; i++)
    if (aiCars[i].alive && aiCars[i].chassis.position.x > focusX)
      focusX = aiCars[i].chassis.position.x;
  if (playerCar && playerCar.alive && playerCar.chassis.position.x > focusX)
    focusX = playerCar.chassis.position.x;
  if (focusX > 0) ensureChunksAround(focusX);

  if (mode === "ai") {
    if (aliveCount <= 0 && !generationEnding) {
      generationEnding = true;
      if (maxDistThisGen > bestEver) bestEver = maxDistThisGen;
      var avg = 0;
      for (var i = 0; i < aiCars.length; i++) avg += aiCars[i].score;
      avg /= aiCars.length;
      trainHistory.best.push(maxDistThisGen);
      trainHistory.avg.push(avg);
      if (trainHistory.best.length > 200) {
        trainHistory.best.shift();
        trainHistory.avg.shift();
      }
      drawCurve();
      setTimeout(startGeneration, 50);
    }
  } else if (mode === "versus") {
    var playerDead = !playerCar || !playerCar.alive;
    if ((aliveCount <= 0 || playerDead) && !generationEnding) {
      generationEnding = true;
      if (maxDistThisGen > bestEver) bestEver = maxDistThisGen;
      setTimeout(startGeneration, 800);
    }
  } else if (mode === "player") {
    if (playerCar && !playerCar.alive) {
      playerDeadTimer++;
      if (playerDeadTimer > 90) {
        generationEnding = true;
        setTimeout(() => restart(true), 0);
      }
    }
  }
}

var FIXED_DT = 1000 / 60;
function update(now) {
  if (!now) now = performance.now();
  var steps = speedMult === 0 ? 4 : speedMult;
  for (var s = 0; s < steps; s++) stepPhysics(FIXED_DT);
  draw();
  if (speedMult === 0) setTimeout(() => update(performance.now()), 0);
  else requestAnimationFrame(update);
}