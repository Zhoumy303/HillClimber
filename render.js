/* ============================================================
   Hill Climber - Rendering
   ============================================================ */
function draw() {
  ctx.clearRect(0, 0, cv.width, cv.height);

  // Camera
  var targetX = 0;
  var leadX = 0;
  for (var i = 0; i < aiCars.length; i++)
    if (aiCars[i].alive && aiCars[i].chassis.position.x > leadX)
      leadX = aiCars[i].chassis.position.x;
  if (playerCar && playerCar.alive && playerCar.chassis.position.x > leadX)
    leadX = playerCar.chassis.position.x;

  if (leadX > 0) targetX = leadX - 300;
  if (chaseX - 60 > targetX) targetX = chaseX - 60;
  if (targetX < 0) targetX = 0;
  camX += (targetX - camX) * 0.12;

  var sky = ctx.createLinearGradient(0, 0, 0, cv.height);
  sky.addColorStop(0, "#87CEEB"); sky.addColorStop(1, "#E0F6FF");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, cv.width, cv.height);

  // Terrain
  ctx.beginPath(); ctx.moveTo(0, cv.height);
  for (var x = 0; x <= cv.width; x += 4)
    ctx.lineTo(x, terrainHeightAt(x + camX, currentSeed));
  ctx.lineTo(cv.width, cv.height); ctx.closePath();
  ctx.fillStyle = "#3a7d44"; ctx.fill();
  ctx.strokeStyle = "#2d5f34"; ctx.lineWidth = 2; ctx.stroke();

  // ★ Water surface
  if (currentMap().water) {
    ctx.fillStyle = "rgba(60, 140, 200, 0.72)";
    for (var x = 0; x <= cv.width; x += 2) {
      var wx = x + camX;
      var ty = terrainHeightAt(wx, currentSeed);
      if (ty > WATER_LEVEL) {
        ctx.fillRect(x, WATER_LEVEL, 2, ty - WATER_LEVEL);
      }
    }
    // Water ripples
    ctx.strokeStyle = "rgba(200, 230, 255, 0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var x = 0; x <= cv.width; x += 4) {
      var wx = x + camX;
      var ty = terrainHeightAt(wx, currentSeed);
      if (ty > WATER_LEVEL) {
        if (x === 0 || terrainHeightAt(wx - 4, currentSeed) <= WATER_LEVEL) {
          ctx.moveTo(x, WATER_LEVEL);
        } else {
          ctx.lineTo(x, WATER_LEVEL);
        }
      }
    }
    ctx.stroke();
  }

  // Fuel cans
  var slotStart = Math.floor(camX / FUEL_SLOT_W);
  var slotEnd = Math.floor((camX + cv.width) / FUEL_SLOT_W) + 1;
  for (var s = slotStart; s <= slotEnd; s++) {
    var can = getFuelSlot(s, currentSeed);
    if (can && !can.picked) {
      var sx = can.x - camX;
      if (sx > -30 && sx < cv.width + 30) drawFuelCan(sx, can.y);
    }
  }

  // Chase wall
  var chaseScreenX = chaseX - camX;
  if (chaseScreenX > -200 && chaseScreenX < cv.width + 50) {
    var pulse = 0.6 + 0.4 * Math.sin(chasePulse);
    var w1 = 200;
    var grad = ctx.createLinearGradient(chaseScreenX - w1, 0, chaseScreenX + 10, 0);
    grad.addColorStop(0, "rgba(60,0,0,0)");
    grad.addColorStop(0.6, "rgba(120,0,0," + (0.35 * pulse) + ")");
    grad.addColorStop(1, "rgba(180,0,0," + (0.7 * pulse) + ")");
    ctx.fillStyle = grad;
    ctx.fillRect(chaseScreenX - w1, 0, w1 + 10, cv.height);

    ctx.fillStyle = "#c0392b";
    ctx.fillRect(chaseScreenX, 0, 6, cv.height);
    ctx.fillStyle = "rgba(255,80,80," + pulse + ")";
    ctx.fillRect(chaseScreenX + 6, 0, 3, cv.height);

    ctx.fillStyle = "rgba(255,60,60," + (0.8 * pulse) + ")";
    for (var wy = 0; wy < cv.height; wy += 24) {
      ctx.fillRect(chaseScreenX - 8, wy, 8, 12);
    }
    if (chaseScreenX > -100 && chaseScreenX < cv.width * 0.5) {
      ctx.fillStyle = "rgba(255,60,60," + pulse + ")";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText("⚠ Chase Wall", Math.max(10, chaseScreenX - 40), 30);
    }
  }

  // Vehicles
  for (var i = 0; i < aiCars.length; i++)
    if (aiCars[i].alive) drawCar(aiCars[i], "#FFC600", "#CE9E00", 0.18);
  if (playerCar && playerCar.alive) drawCar(playerCar, "#4FC3F7", "#0288D1", 1.0);

  drawHUD();
}

function drawFuelCan(sx, sy) {
  ctx.save();
  ctx.translate(sx, sy);
  ctx.fillStyle = "#e74c3c";
  ctx.strokeStyle = "#7b241c";
  ctx.lineWidth = 2;
  ctx.fillRect(-10, -12, 20, 24);
  ctx.strokeRect(-10, -12, 20, 24);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 14px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("F", 0, 5);
  ctx.textAlign = "left";
  ctx.restore();
}

function drawCar(car, fill, stroke, alpha) {
  alpha = alpha === undefined ? 1.0 : alpha;
  var c = car.chassis;
  var sx = c.position.x - camX;
  if (sx < -120 || sx > cv.width + 120) return;

  ctx.globalAlpha = alpha;

  ctx.save();
  ctx.translate(sx, c.position.y);
  ctx.rotate(c.angle);
  ctx.fillStyle = fill; ctx.strokeStyle = stroke; ctx.lineWidth = 2;
  ctx.fillRect(-35, -9, 70, 18);
  ctx.strokeRect(-35, -9, 70, 18);
  var fr = car.fuel / settings.fuelMax;
  ctx.fillStyle = "#222";
  ctx.fillRect(-30, -7, 60, 4);
  ctx.fillStyle = fr > 0.5 ? "#4CAF50" : fr > 0.2 ? "#FFC107" : "#F44336";
  ctx.fillRect(-30, -7, 60 * Math.max(0, fr), 4);
  ctx.restore();

  [car.wheelA, car.wheelB].forEach(w => {
    ctx.save();
    ctx.translate(w.position.x - camX, w.position.y);
    ctx.rotate(w.angle);
    ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fillStyle = "#333"; ctx.fill();
    ctx.strokeStyle = "#888"; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, 0); ctx.lineTo(10, 0);
    ctx.moveTo(0, -10); ctx.lineTo(0, 10);
    ctx.stroke();
    ctx.restore();
  });

  ctx.globalAlpha = 1.0;
}

function drawHUD() {
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(8, 8, 340, 156);
  ctx.fillStyle = "#fff"; ctx.font = "15px sans-serif";
  ctx.fillText("Mode : " +
    (mode === "ai" ? "AI Training" : mode === "player" ? "Player Mode" : "AI vs Player"), 18, 32);
  ctx.fillStyle = "#FFC600";
  ctx.fillText("Map : " + currentMap().name, 18, 56);
  ctx.fillStyle = "#fff";
  ctx.fillText("Generation : " + generation, 18, 80);
  ctx.fillText("Alive : " + aliveCount + " / " + aiCars.length, 18, 104);
  ctx.fillText("AI best this gen : " + Math.floor(maxDistThisGen), 18, 128);
  ctx.fillText("AI best ever : " + Math.floor(bestEver), 18, 152);

  // Chase gap bar
  var refX = 0;
  for (var i = 0; i < aiCars.length; i++)
    if (aiCars[i].alive && aiCars[i].chassis.position.x > refX)
      refX = aiCars[i].chassis.position.x;
  if (playerCar && playerCar.alive && playerCar.chassis.position.x > refX)
    refX = playerCar.chassis.position.x;

  if (refX > 0) {
    var gap = refX - chaseX;
    var bw = 240, bh = 18;
    var bx = cv.width - bw - 20;
    var by = cv.height - 40;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(bx - 4, by - 4, bw + 8, bh + 8);

    var ratio = Math.max(0, Math.min(1, gap / settings.chaseGap));
    var col = ratio > 0.6 ? "#4CAF50" : ratio > 0.3 ? "#FFC107" : "#F44336";
    ctx.fillStyle = "#222";
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = col;
    ctx.fillRect(bx, by, bw * ratio, bh);
    ctx.fillStyle = "#fff";
    ctx.font = "12px sans-serif";
    ctx.fillText("Chase gap " + Math.floor(gap), bx + 6, by + 14);

    if (ratio < 0.25) {
      ctx.strokeStyle = "rgba(255,60,60," + (0.5 + 0.5 * Math.sin(chasePulse)) + ")";
      ctx.lineWidth = 3;
      ctx.strokeRect(bx - 4, by - 4, bw + 8, bh + 8);
    }
  }

  if (mode === "player" || mode === "versus") {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(cv.width - 280, 8, 272, 94);
    ctx.fillStyle = "#4FC3F7"; ctx.font = "15px sans-serif";
    ctx.fillText("Player (blue)", cv.width - 270, 32);
    ctx.fillStyle = "#fff";
    if (playerCar && playerCar.alive) {
      ctx.fillText("Distance : " + Math.floor(playerCar.score), cv.width - 270, 56);
      if (isInWater(playerCar)) {
        ctx.fillStyle = "#4FC3F7";
        ctx.fillText("💧 In water", cv.width - 270, 78);
      }
    } else ctx.fillText("Dead", cv.width - 270, 56);
    ctx.fillStyle = "#fff";
    ctx.fillText("Best : " + Math.floor(playerBest), cv.width - 270, 78);
  }
}

/* ============================================================
   Hill Climber - Training curve
   ============================================================ */
function drawCurve() {
  var cv2 = document.getElementById('curve');
  if (!cv2) return;
  var cx = cv2.getContext('2d');
  cx.clearRect(0, 0, cv2.width, cv2.height);
  cx.fillStyle = "#1a1a2e";
  cx.fillRect(0, 0, cv2.width, cv2.height);

  if (!trainHistory || !trainHistory.best || trainHistory.best.length < 2) {
    cx.fillStyle = "#555";
    cx.font = "12px sans-serif";
    cx.fillText("Waiting for first generation...", 10, 50);
    return;
  }

  var maxV = Math.max(1, ...trainHistory.best);
  var w = cv2.width, h = cv2.height;
  var n = trainHistory.best.length;

  cx.strokeStyle = "#FFC600";
  cx.lineWidth = 1.5;
  cx.beginPath();
  for (var i = 0; i < n; i++) {
    var x = i / (n - 1) * w;
    var y = h - (trainHistory.best[i] / maxV) * (h - 6) - 3;
    if (i === 0) cx.moveTo(x, y); else cx.lineTo(x, y);
  }
  cx.stroke();

  cx.strokeStyle = "#4FC3F7";
  cx.lineWidth = 1;
  cx.beginPath();
  for (var i = 0; i < n; i++) {
    var x = i / (n - 1) * w;
    var y = h - (trainHistory.avg[i] / maxV) * (h - 6) - 3;
    if (i === 0) cx.moveTo(x, y); else cx.lineTo(x, y);
  }
  cx.stroke();

  cx.fillStyle = "#FFC600";
  cx.font = "10px sans-serif";
  cx.fillText("best " + Math.floor(trainHistory.best[n - 1]), 4, 12);
  cx.fillStyle = "#4FC3F7";
  cx.fillText("avg " + Math.floor(trainHistory.avg[n - 1]), 4, 24);

  var last10 = trainHistory.best.slice(-10);
  var avg10 = last10.reduce((a, b) => a + b, 0) / last10.length;
  document.getElementById('stats').innerHTML =
    "Generations trained: " + generation + " | Best: " + Math.floor(bestEver) +
    "<br>Avg score (last 10 gens): " + Math.floor(avg10);
}