const test = require('node:test');
const assert = require('node:assert/strict');
const Logic = require('../game-logic.js');

test('normaliza movimiento diagonal sin superar la velocidad máxima', () => {
  const input = Logic.normalizeInput(1, 1);
  assert.ok(Math.abs(input.strength - 1) < 1e-9);
  assert.ok(Math.abs(Math.hypot(input.x, input.z) - 1) < 1e-9);
});

test('conserva movimiento analógico y aplica zona muerta', () => {
  assert.deepEqual(Logic.normalizeInput(0.04, 0.02), { x: 0, z: 0, strength: 0 });
  const input = Logic.normalizeInput(0.5, 0);
  assert.equal(input.x, 0.5);
  assert.equal(input.z, 0);
  assert.equal(input.strength, 0.5);
});

test('encuentra el árbol activo más cercano dentro del radio', () => {
  const near = { x: 2, z: 1, active: true, hp: 3 };
  const far = { x: 5, z: 5, active: true, hp: 3 };
  const dead = { x: 0, z: 0, active: false, hp: 0 };
  assert.equal(Logic.nearestActiveTree({ x: 0, z: 0 }, [far, dead, near], 5.8), near);
  assert.equal(Logic.nearestActiveTree({ x: 0, z: 0 }, [far], 5.8), null);
});

test('un árbol entrega exactamente un tronco después de tres golpes', () => {
  const state = { logs: 0, capacity: 5 };
  const tree = { active: true, hp: 3, regrow: 0 };
  assert.equal(Logic.hitTree(state, tree).harvested, false);
  assert.equal(Logic.hitTree(state, tree).harvested, false);
  const result = Logic.hitTree(state, tree);
  assert.equal(result.harvested, true);
  assert.equal(state.logs, 1);
  assert.equal(tree.active, false);
  assert.equal(Logic.hitTree(state, tree).reason, 'inactive');
  assert.equal(state.logs, 1);
});

test('bloquea la tala cuando la mochila está llena', () => {
  const state = { logs: 5, capacity: 5 };
  const tree = { active: true, hp: 3, regrow: 0 };
  const result = Logic.hitTree(state, tree);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'full');
  assert.equal(tree.hp, 3);
});

test('comprueba proximidad al camión con distancia real en XZ', () => {
  const home = { x: -3.5, z: 8 };
  assert.equal(Logic.isWithin({ x: 0, z: 5 }, home, 6.5), true);
  assert.equal(Logic.isWithin({ x: 5, z: 5 }, home, 6.5), false);
});

test('interpola la ruta del camión y limita el progreso', () => {
  const home = { x: -3.5, z: 8 };
  const dock = { x: 10, z: -14 };
  assert.deepEqual(Logic.interpolateXZ(home, dock, 0), home);
  assert.deepEqual(Logic.interpolateXZ(home, dock, 1), dock);
  assert.deepEqual(Logic.interpolateXZ(home, dock, 2), dock);
});



test('la tala automática golpea por proximidad y entrega un tronco tras tres golpes', () => {
  const state = { logs: 0, capacity: 5 };
  const tree = { x: 1, z: 1, active: true, hp: 3, regrow: 0 };

  const result = Logic.advanceAutoChop(state, [tree], { x: 0, z: 0 }, 0, 1.1);

  assert.equal(result.hits.length, 3);
  assert.equal(result.harvested, true);
  assert.equal(state.logs, 1);
  assert.equal(tree.active, false);
  assert.equal(result.timer, 0);
});

test('la tala automática se detiene fuera de proximidad o con la mochila llena', () => {
  const tree = { x: 1, z: 1, active: true, hp: 3, regrow: 0 };
  const outOfRange = Logic.advanceAutoChop(
    { logs: 0, capacity: 5 }, [tree], { x: 20, z: 20 }, 0.2, 0.1
  );
  assert.equal(outOfRange.hits.length, 0);
  assert.equal(outOfRange.timer, 0);
  assert.equal(tree.hp, 3);

  const full = Logic.advanceAutoChop(
    { logs: 5, capacity: 5 }, [tree], { x: 0, z: 0 }, 0, 1
  );
  assert.equal(full.hits.length, 0);
  assert.equal(tree.hp, 3);
});

function fakeEventTarget() {
  const listeners = {};
  return {
    listeners,
    style: {},
    captured: null,
    addEventListener(type, handler) {
      (listeners[type] ||= []).push(handler);
    },
    getBoundingClientRect() {
      return { left: 0, top: 0, width: 100, height: 100 };
    },
    setPointerCapture(id) { this.captured = id; },
    hasPointerCapture(id) { return this.captured === id; },
    releasePointerCapture(id) { if (this.captured === id) this.captured = null; },
    dispatch(type, event) {
      for (const handler of listeners[type] || []) handler(event);
    }
  };
}

test('el joystick procesa arrastre Pointer Events y se centra al soltar', () => {
  const zone = fakeEventTarget();
  const knob = { style: {} };
  const values = [];
  const joystick = Logic.bindJoystick(zone, knob, value => values.push(value));
  const event = (x, y) => ({
    pointerId: 7, pointerType: 'touch', isPrimary: true, button: 0,
    clientX: x, clientY: y, preventDefault() { this.defaultPrevented = true; }
  });

  zone.dispatch('pointerdown', event(50, 50));
  zone.dispatch('pointermove', event(80, 50));
  assert.ok(values.at(-1).x > 0.9);
  assert.equal(values.at(-1).z, 0);
  assert.equal(zone.captured, 7);

  zone.dispatch('pointerup', event(80, 50));
  assert.deepEqual(values.at(-1), { x: 0, z: 0 });
  assert.equal(zone.captured, null);
  assert.equal(knob.style.left, 'calc(50% - 21px)');
  joystick.reset();
});

test('el joystick conserva compatibilidad con Touch Events y touchcancel', () => {
  const zone = fakeEventTarget();
  const knob = { style: {} };
  const values = [];
  Logic.bindJoystick(zone, knob, value => values.push(value));
  const touch = (id, x, y) => ({ identifier: id, clientX: x, clientY: y });
  const event = touches => ({ changedTouches: touches, preventDefault() {} });

  zone.dispatch('touchstart', event([touch(4, 50, 50)]));
  zone.dispatch('touchmove', event([touch(4, 20, 50)]));
  assert.ok(values.at(-1).x < -0.9);

  zone.dispatch('touchcancel', event([touch(4, 20, 50)]));
  assert.deepEqual(values.at(-1), { x: 0, z: 0 });
  assert.equal(knob.style.top, 'calc(50% - 21px)');
});

test('el camión carga, viaja al aserradero, descarga y regresa al patio', () => {
  const home = { x: -3.5, z: 8 };
  const dock = { x: 10, z: -14 };
  const job = { t: 0, n: 2, phase: 0 };

  let update = Logic.advanceTruckJob(job, 0.5, home, dock);
  assert.equal(update.load, false);
  assert.equal(job.phase, 0);

  update = Logic.advanceTruckJob(job, 0.5, home, dock);
  assert.equal(update.load, true);
  assert.equal(job.phase, 1);
  assert.deepEqual(update.position, home);

  update = Logic.advanceTruckJob(job, 2.5, home, dock);
  assert.equal(update.unload, false);
  assert.deepEqual(update.position, { x: 3.25, z: -3 });

  update = Logic.advanceTruckJob(job, 2.5, home, dock);
  assert.equal(update.unload, true);
  assert.equal(job.phase, 2);
  assert.deepEqual(update.position, dock);

  update = Logic.advanceTruckJob(job, 2.5, home, dock);
  assert.equal(update.complete, false);
  assert.deepEqual(update.position, { x: 3.25, z: -3 });

  update = Logic.advanceTruckJob(job, 2.5, home, dock);
  assert.equal(update.complete, true);
  assert.deepEqual(update.position, home);
});


test('el aserradero convierte cada tronco una sola vez y lo almacena una sola vez', () => {
  const item = { x: -3.1, converted: false, stored: false };
  let conversions = 0;
  let stored = 0;
  for (let i = 0; i < 300; i++) {
    const step = Logic.advanceProductionItem(item, 0.05);
    if (step.converted) conversions++;
    if (step.stored) stored++;
    if (step.stored) break;
  }
  assert.equal(conversions, 1);
  assert.equal(stored, 1);
  assert.equal(item.converted, true);
  assert.equal(item.stored, true);
  assert.ok(item.x >= 9.1);
});

test('el comprador captura el precio al iniciar y paga una sola vez al terminar su ruta', () => {
  const job = Logic.createBuyerJob(3, 12);
  assert.equal(job.revenue, 72);

  let step = Logic.advanceBuyerJob(job, 1);
  assert.equal(step.phase, 0);
  assert.equal(step.payout, 0);

  step = Logic.advanceBuyerJob(job, 1);
  assert.equal(step.arrived, true);
  assert.equal(step.phase, 1);
  assert.equal(step.payout, 0);

  step = Logic.advanceBuyerJob(job, 1);
  assert.equal(step.complete, false);
  assert.equal(step.payout, 0);

  step = Logic.advanceBuyerJob(job, 1);
  assert.equal(step.complete, true);
  assert.equal(step.payout, 72);
  assert.equal(job.paid, true);

  step = Logic.advanceBuyerJob(job, 1);
  assert.equal(step.complete, true);
  assert.equal(step.payout, 0);
});

test('ciclo lógico completo: camión, aserradero, almacén y venta', () => {
  const home = { x: -3.5, z: 8 };
  const dock = { x: 10, z: -14 };
  const truckJob = { t: 0, n: 2, phase: 0 };
  let loaded = false;
  let unloaded = false;
  const belt = [];

  for (let i = 0; i < 22; i++) {
    const step = Logic.advanceTruckJob(truckJob, 0.5, home, dock);
    if (step.load) loaded = true;
    if (step.unload) {
      unloaded = true;
      for (let n = 0; n < truckJob.n; n++) {
        belt.push({ x: -3.1, converted: false, stored: false });
      }
    }
  }
  assert.equal(loaded, true);
  assert.equal(unloaded, true);
  assert.equal(belt.length, 2);

  let planks = 0;
  for (const item of belt) {
    for (let i = 0; i < 300; i++) {
      const step = Logic.advanceProductionItem(item, 0.05);
      if (step.stored) { planks++; break; }
    }
  }
  assert.equal(planks, 2);

  const sale = Logic.createBuyerJob(planks, 12);
  let payout = 0;
  for (let i = 0; i < 8; i++) {
    payout += Logic.advanceBuyerJob(sale, 0.5).payout;
  }
  assert.equal(payout, 48);
  assert.equal(sale.paid, true);
});

test('el script principal y el controlador de joystick conservan sintaxis válida', () => {
  const fs = require('node:fs');
  const vm = require('node:vm');
  const path = require('node:path');
  const root = path.join(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const logicSource = fs.readFileSync(path.join(root, 'game-logic.js'), 'utf8');
  const inlineScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .map(match => match[1])
    .filter(source => source.trim());
  assert.ok(inlineScripts.length > 0, 'debe existir el script principal');
  for (const source of inlineScripts) new vm.Script(source, { filename: 'index.html:inline-script' });
  new vm.Script(logicSource, { filename: 'game-logic.js' });
  assert.match(html, /src="\.\/game-logic\.js"/);
  assert.match(html, /ImperioLogic\.bindJoystick/);
  assert.match(html, /ImperioLogic\.advanceAutoChop/);
  assert.match(html, /ImperioLogic\.advanceProductionItem/);
  assert.match(html, /ImperioLogic\.createBuyerJob/);
  assert.match(html, /ImperioLogic\.advanceBuyerJob/);
  assert.match(logicSource, /addEventListener\('touchstart'/);
  assert.match(logicSource, /addEventListener\('pointerdown'/);
});
