/* ============================================================
   Hill Climber - Save / import
   ============================================================ */
function saveToLocal() {
  try {
    var data = {
      settings: settings, generation: generation,
      bestEver: bestEver, trainHistory: trainHistory,
      state: Neuvol.exportState()
    };
    localStorage.setItem('nevo-car-v1', JSON.stringify(data));
    alert("Saved to browser!");
  } catch (e) { alert("Save failed: " + e.message); }
}
function loadFromLocal() {
  try {
    var raw = localStorage.getItem('nevo-car-v1');
    if (!raw) { alert("No saved data found."); return; }
    importData(JSON.parse(raw));
    alert("Loaded successfully!");
  } catch (e) { alert("Load failed: " + e.message); }
}
function exportToFile() {
  var data = {
    settings: settings, generation: generation,
    bestEver: bestEver, trainHistory: trainHistory,
    state: Neuvol.exportState()
  };
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'hill-climber-' + settings.mapKey + '-gen' + generation + '.json';
  a.click();
  URL.revokeObjectURL(url);
}
function importFromFile(ev) {
  var file = ev.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function (e) {
    try {
      importData(JSON.parse(e.target.result));
      alert("Import successful!");
    } catch (err) { alert("Import failed: " + err.message); }
  };
  reader.readAsText(file);
  ev.target.value = '';
}
function importData(data) {
  if (data.settings) Object.assign(settings, data.settings);
  writeSettings();
  engine.gravity.y = settings.gravity;
  generation = data.generation || 0;
  bestEver = data.bestEver || 0;
  trainHistory = data.trainHistory || data.history || { best: [], avg: [] };

  Neuvol = new Neuroevolution({
    population: settings.population,
    network: [8, [10, 6], 2],
    mutationRate: settings.mutationRate,
    elitism: settings.elitism,
    randomBehaviour: settings.randomBehaviour
  });
  if (data.state) Neuvol.importState(data.state);

  drawCurve();

  for (var i = 0; i < aiCars.length; i++) destroyCarPhysics(aiCars[i]);
  if (playerCar) destroyCarPhysics(playerCar);
  aiCars = []; playerCar = null;
  clearAllChunks();
  clearFuelCans();
  generationEnding = false;
  startGeneration();
}
function applyEvolutionSettings() {
  readSettings();
  if (!confirm("Applying the new settings will restart training. Continue?")) return;
  restart(false);
}
function resetAll() {
  if (!confirm("Erase all training data?")) return;
  localStorage.removeItem('nevo-car-v1');
  trainHistory = { best: [], avg: [] };
  restart(false);
  drawCurve();
}