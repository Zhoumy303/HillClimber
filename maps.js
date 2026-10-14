/* ============================================================
   Hill Climber - Map definitions
   ============================================================ */
var WATER_LEVEL = 340;

var maps = {
  gentle: {
    name: "Gentle",
    water: false,
    baseHeight: function(x, seed) {
      var y = 300;
      y += Math.sin(x * 0.005 + seed) * 20;
      y += Math.sin(x * 0.02 + seed * 2) * 8;
      return Math.max(220, Math.min(360, y));
    }
  },
  hills: {
    name: "Hills",
    water: false,
    baseHeight: function(x, seed) {
      var y = 300;
      y += Math.sin(x * 0.004 + seed) * 55;
      y += Math.sin(x * 0.013 + seed * 2) * 25;
      y += Math.sin(x * 0.045 + seed * 3) * 6;
      var segIndex = Math.floor(x / 400);
      var segRand = seededRandom(segIndex, seed);
      if (segRand > 0.55) {
        var local = ((x % 400) + 400) % 400 / 400;
        var shape = Math.sin(local * Math.PI);
        var dir = segRand > 0.78 ? 1 : -1;
        y += dir * shape * 60;
      }
      return Math.max(140, Math.min(380, y));
    }
  },
  mountains: {
    name: "Mountains",
    water: false,
    baseHeight: function(x, seed) {
      var y = 300;
      y += Math.sin(x * 0.003 + seed) * 100;
      y += Math.sin(x * 0.011 + seed * 2) * 50;
      y += Math.sin(x * 0.04 + seed * 3) * 12;
      var segIndex = Math.floor(x / 300);
      var segRand = seededRandom(segIndex, seed);
      if (segRand > 0.40) {
        var local = ((x % 300) + 300) % 300 / 300;
        var shape = Math.sin(local * Math.PI);
        var dir = segRand > 0.70 ? 1 : -1;
        y += dir * shape * 80;
      }
      return Math.max(120, Math.min(420, y));
    }
  },
  watery: {
    name: "Pools",
    water: true,
    baseHeight: function(x, seed) {
      var y = 300;
      y += Math.sin(x * 0.004 + seed) * 40;
      y += Math.sin(x * 0.013 + seed * 2) * 20;
      // Water pools: one check every 500px
      var slot = Math.floor(x / 500);
      var rand = seededRandom(slot * 23 + 7, seed);
      if (rand < 0.5) {
        var cx = slot * 500 + 250;
        var t = Math.abs(x - cx) / 180;
        if (t < 1) {
          y += (1 - t * t) * 130;   // dip down to 430
        }
      }
      return Math.max(140, Math.min(430, y));
    }
  }
};

function currentMap() {
  return maps[settings.mapKey] || maps.hills;
}