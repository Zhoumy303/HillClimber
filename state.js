/* ============================================================
   Hill Climber - Global state + input
   ============================================================ */
var Neuvol;
var aiCars = [], aiNets = [];
var playerCar = null;
var generation = 0, aliveCount = 0;
var maxDistThisGen = 0, bestEver = 0, playerBest = 0;
var mode = "ai", speedMult = 1;
var playerGas = false, playerBrake = false;
var generationEnding = false, playerDeadTimer = 0;
var chaseX = 0;
var chasePulse = 0;

var cv = document.getElementById("cv");
var ctx = cv.getContext("2d");
var camX = 0;

var trainHistory = { best: [], avg: [] };

function setSpeed(s) {
  speedMult = s;
  ["btnSpeed1","btnSpeed2","btnSpeed3","btnSpeedMax"].forEach(id =>
    document.getElementById(id).classList.remove("on"));
  var btn = s === 1 ? "btnSpeed1" : s === 2 ? "btnSpeed2" : s === 3 ? "btnSpeed3" : "btnSpeedMax";
  document.getElementById(btn).classList.add("on");
}
function setMode(m) {
  mode = m;
  ["modePlayer","modeAI","modeVersus"].forEach(id =>
    document.getElementById(id).classList.remove("on"));
  var btn = m === "player" ? "modePlayer" : m === "ai" ? "modeAI" : "modeVersus";
  document.getElementById(btn).classList.add("on");
  restart();
}
window.addEventListener("keydown", e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  if (e.code === "KeyD" || e.code === "ArrowRight" || e.code === "Space") { playerGas = true; e.preventDefault(); }
  if (e.code === "KeyA" || e.code === "ArrowLeft") { playerBrake = true; e.preventDefault(); }
});
window.addEventListener("keyup", e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  if (e.code === "KeyD" || e.code === "ArrowRight" || e.code === "Space") { playerGas = false; e.preventDefault(); }
  if (e.code === "KeyA" || e.code === "ArrowLeft") { playerBrake = false; e.preventDefault(); }
});