/* ============================================================
   Hill Climber - Global settings
   ============================================================ */
var settings = {
  mapKey: "hills",
  maxWheelAV: 0.95, friction: 1.3, gravity: 1.1, airTorque: 0.030,
  stuckTime: 90,
  waterSpeed: 0.25, waterFuel: 1.5,
  fuelMax: 120, fuelIdle: 0.015, fuelGas: 0.025, fuelPickup: 80,
  chaseSpeed: 1.6, chaseGap: 500,
  population: 50, mutationRate: 0.10, elitism: 0.15, randomBehaviour: 0.20
};

function readSettings() {
  function n(id, def) {
    var v = parseFloat(document.getElementById(id).value);
    return isNaN(v) ? def : v;
  }
  settings.mapKey = document.getElementById('set-mapKey').value;
  settings.maxWheelAV = n('set-maxWheelAV', 0.95);
  settings.friction = n('set-friction', 1.3);
  settings.gravity = n('set-gravity', 1.1);
  settings.airTorque = n('set-airTorque', 0.030);
  settings.stuckTime = n('set-stuckTime', 90);
  settings.waterSpeed = n('set-waterSpeed', 0.25);
  settings.waterFuel = n('set-waterFuel', 1.5);
  settings.fuelMax = n('set-fuelMax', 120);
  settings.fuelIdle = n('set-fuelIdle', 0.015);
  settings.fuelGas = n('set-fuelGas', 0.025);
  settings.fuelPickup = n('set-fuelPickup', 80);
  settings.chaseSpeed = n('set-chaseSpeed', 1.6);
  settings.chaseGap = n('set-chaseGap', 500);
  settings.population = n('set-population', 50);
  settings.mutationRate = n('set-mutationRate', 0.10);
  settings.elitism = n('set-elitism', 0.15);
  settings.randomBehaviour = n('set-randomBehaviour', 0.20);
  engine.gravity.y = settings.gravity;
}
function writeSettings() {
  document.getElementById('set-mapKey').value = settings.mapKey;
  document.getElementById('set-maxWheelAV').value = settings.maxWheelAV;
  document.getElementById('set-friction').value = settings.friction;
  document.getElementById('set-gravity').value = settings.gravity;
  document.getElementById('set-airTorque').value = settings.airTorque;
  document.getElementById('set-stuckTime').value = settings.stuckTime;
  document.getElementById('set-waterSpeed').value = settings.waterSpeed;
  document.getElementById('set-waterFuel').value = settings.waterFuel;
  document.getElementById('set-fuelMax').value = settings.fuelMax;
  document.getElementById('set-fuelIdle').value = settings.fuelIdle;
  document.getElementById('set-fuelGas').value = settings.fuelGas;
  document.getElementById('set-fuelPickup').value = settings.fuelPickup;
  document.getElementById('set-chaseSpeed').value = settings.chaseSpeed;
  document.getElementById('set-chaseGap').value = settings.chaseGap;
  document.getElementById('set-population').value = settings.population;
  document.getElementById('set-mutationRate').value = settings.mutationRate;
  document.getElementById('set-elitism').value = settings.elitism;
  document.getElementById('set-randomBehaviour').value = settings.randomBehaviour;
}
function onMapChange() {
  readSettings();
  if (!confirm("Switching maps will restart training. Continue?")) {
    writeSettings();
    return;
  }
  restart(false);
}
document.querySelectorAll('#side input[type=number]').forEach(inp => {
  inp.addEventListener('input', () => { readSettings(); drawCurve(); });
});