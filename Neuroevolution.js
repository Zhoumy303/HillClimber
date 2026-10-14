/* ============================================================
   Hill Climber - Neuroevolution framework
   ============================================================ */
function Neuroevolution(opts) {
  var self = this;
  self.options = {
    activation: a => 1 / (1 + Math.exp(-a)),
    randomClamped: () => Math.random() * 2 - 1,
    network: [8, [10, 6], 2],
    population: 50, elitism: 0.15, randomBehaviour: 0.20,
    mutationRate: 0.10, mutationRange: 0.5, nbChild: 1
  };
  Object.assign(self.options, opts || {});

  function Neuron() { this.value = 0; this.weights = []; }
  Neuron.prototype.populate = function (n) {
    this.weights = [];
    for (var i = 0; i < n; i++) this.weights.push(self.options.randomClamped());
  };
  function Layer(idx) { this.id = idx; this.neurons = []; }
  Layer.prototype.populate = function (nb, nbIn) {
    this.neurons = [];
    for (var i = 0; i < nb; i++) {
      var n = new Neuron(); n.populate(nbIn); this.neurons.push(n);
    }
  };
  function Network() { this.layers = []; }
  Network.prototype.build = function (input, hiddens, output) {
    var idx = 0, prev = 0;
    var l = new Layer(idx++); l.populate(input, prev); prev = input; this.layers.push(l);
    for (var i in hiddens) {
      var l2 = new Layer(idx++); l2.populate(hiddens[i], prev); prev = hiddens[i]; this.layers.push(l2);
    }
    var l3 = new Layer(idx++); l3.populate(output, prev); this.layers.push(l3);
  };
  Network.prototype.compute = function (inputs) {
    for (var i in inputs)
      if (this.layers[0].neurons[i]) this.layers[0].neurons[i].value = inputs[i];
    var prev = this.layers[0];
    for (var i = 1; i < this.layers.length; i++) {
      for (var j in this.layers[i].neurons) {
        var sum = 0;
        for (var k in prev.neurons)
          sum += prev.neurons[k].value * this.layers[i].neurons[j].weights[k];
        this.layers[i].neurons[j].value = self.options.activation(sum);
      }
      prev = this.layers[i];
    }
    return this.layers[this.layers.length - 1].neurons.map(n => n.value);
  };
  Network.prototype.getSave = function () {
    var d = { neurons: [], weights: [] };
    for (var i in this.layers) {
      d.neurons.push(this.layers[i].neurons.length);
      for (var j in this.layers[i].neurons)
        for (var k in this.layers[i].neurons[j].weights)
          d.weights.push(this.layers[i].neurons[j].weights[k]);
    }
    return d;
  };
  Network.prototype.setSave = function (s) {
    var prev = 0, idx = 0, w = 0;
    this.layers = [];
    for (var i in s.neurons) {
      var l = new Layer(idx++); l.populate(s.neurons[i], prev);
      for (var j in l.neurons)
        for (var k in l.neurons[j].weights)
          l.neurons[j].weights[k] = s.weights[w++];
      prev = s.neurons[i];
      this.layers.push(l);
    }
  };

  function Genome(score, network) { this.score = score || 0; this.network = network || null; }
  function Generation() { this.genomes = []; }
  Generation.prototype.add = function (g) {
    var i = 0;
    for (; i < this.genomes.length; i++)
      if (g.score > this.genomes[i].score) break;
    this.genomes.splice(i, 0, g);
  };
  Generation.prototype.breed = function (g1, g2, nb) {
    var out = [];
    for (var n = 0; n < nb; n++) {
      var d = JSON.parse(JSON.stringify(g1));
      for (var i in g2.network.weights)
        if (Math.random() <= 0.5) d.network.weights[i] = g2.network.weights[i];
      for (var i in d.network.weights)
        if (Math.random() <= self.options.mutationRate)
          d.network.weights[i] += Math.random() * self.options.mutationRange * 2 - self.options.mutationRange;
      out.push(d);
    }
    return out;
  };
  Generation.prototype.next = function () {
    var nexts = [];
    var pop = self.options.population;
    for (var i = 0; i < Math.round(self.options.elitism * pop); i++)
      if (nexts.length < pop && this.genomes[i])
        nexts.push(JSON.parse(JSON.stringify(this.genomes[i].network)));
    for (var i = 0; i < Math.round(self.options.randomBehaviour * pop); i++) {
      var base = this.genomes[0] || { network: { weights: [] } };
      var n = JSON.parse(JSON.stringify(base.network));
      if (!n.weights) n.weights = [];
      for (var k in n.weights) n.weights[k] = self.options.randomClamped();
      if (nexts.length < pop) nexts.push(n);
    }
    var max = 0, guard = 0;
    while (nexts.length < pop && guard++ < 10000) {
      for (var i = 0; i < max && nexts.length < pop; i++) {
        if (!this.genomes[i] || !this.genomes[max]) continue;
        var childs = this.breed(this.genomes[i], this.genomes[max],
          self.options.nbChild > 0 ? self.options.nbChild : 1);
        for (var c in childs) {
          if (nexts.length >= pop) break;
          nexts.push(childs[c].network);
        }
      }
      max++;
      if (max >= Math.max(1, this.genomes.length - 1)) max = 0;
    }
    while (nexts.length < pop) {
      var src = nexts[0] || { weights: [] };
      nexts.push(JSON.parse(JSON.stringify(src)));
    }
    return nexts;
  };

  function Generations() { this.list = []; }
  Generations.prototype.first = function () {
    var out = [];
    for (var i = 0; i < self.options.population; i++) {
      var nn = new Network();
      nn.build(self.options.network[0], self.options.network[1], self.options.network[2]);
      out.push(nn.getSave());
    }
    this.list.push(new Generation());
    return out;
  };
  Generations.prototype.next = function () {
    var g = this.list[this.list.length - 1].next();
    this.list.push(new Generation());
    return g;
  };
  Generations.prototype.add = function (g) {
    if (!this.list.length) return false;
    return this.list[this.list.length - 1].add(g);
  };

  self.generations = new Generations();
  self.nextGeneration = function () {
    var networks = self.generations.list.length === 0
      ? self.generations.first()
      : self.generations.next();
    var nns = [];
    for (var i in networks) {
      var nn = new Network(); nn.setSave(networks[i]); nns.push(nn);
    }
    return nns;
  };
  self.networkScore = function (network, score) {
    self.generations.add(new Genome(score, network.getSave()));
  };

  self.exportState = function () {
    return self.generations.list.map(gen => ({
      genomes: gen.genomes.map(g => ({ score: g.score, network: g.network }))
    }));
  };
  self.importState = function (state) {
    var list = [];
    for (var i = 0; i < state.length; i++) {
      var gen = new Generation();
      for (var j = 0; j < state[i].genomes.length; j++) {
        var g = state[i].genomes[j];
        gen.genomes.push(new Genome(g.score, g.network));
      }
      list.push(gen);
    }
    self.generations.list = list;
  };
}