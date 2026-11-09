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

test('el script principal del juego conserva sintaxis JavaScript válida', () => {
  const fs = require('node:fs');
  const vm = require('node:vm');
  const path = require('node:path');
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const inlineScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .map(match => match[1])
    .filter(source => source.trim());
  assert.ok(inlineScripts.length > 0, 'debe existir el script principal');
  for (const source of inlineScripts) new vm.Script(source, { filename: 'index.html:inline-script' });
  assert.match(html, /src="\.\/game-logic\.js"/);
  assert.match(html, /addEventListener\('touchstart'/);
  assert.match(html, /addEventListener\('pointerdown'/);
});

test('el joystick responde al arrastre Pointer Events y se centra al soltar', () => {
  const listeners = {};
  const zone = {
    addEventListener(name, handler) { listeners[name] = handler; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 100 }; },
    setPointerCapture(id) { this.captured = id; },
    emit(name, event) { listeners[name](event); }
  };
  const knob = { style: {} };
  const moves = [];
  const joystick = Logic.bindJoystick(zone, knob, value => moves.push(value));
  let prevented = false;
  zone.emit('pointerdown', { pointerId: 3, pointerType: 'mouse', button: 0, clientX: 80, clientY: 50, preventDefault() { prevented = true; } });
  assert.ok(moves.at(-1).x > 0.7);
  assert.equal(zone.captured, 3);
  zone.emit('pointermove', { pointerId: 3, clientX: 50, clientY: 80, preventDefault() {} });
  assert.ok(moves.at(-1).z > 0.7);
  zone.emit('pointerup', { pointerId: 3 });
  assert.deepEqual(moves.at(-1), { x: 0, z: 0 });
  assert.ok(prevented);
  assert.match(knob.style.left, /50%/);
  joystick.reset();
});

test('el joystick conserva compatibilidad con eventos táctiles nativos', () => {
  const listeners = {};
  const zone = {
    addEventListener(name, handler) { listeners[name] = handler; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 100 }; },
    emit(name, event) { listeners[name](event); }
  };
  const knob = { style: {} };
  const moves = [];
  Logic.bindJoystick(zone, knob, value => moves.push(value));
  let prevented = false;
  zone.emit('touchstart', { changedTouches: [{ identifier: 9, clientX: 50, clientY: 20 }], preventDefault() { prevented = true; } });
  zone.emit('touchmove', { changedTouches: [{ identifier: 9, clientX: 80, clientY: 50 }], preventDefault() {} });
  assert.ok(moves.at(-1).x > 0.7);
  zone.emit('touchend', { changedTouches: [{ identifier: 9 }] });
  assert.deepEqual(moves.at(-1), { x: 0, z: 0 });
  assert.ok(prevented);
});

