(function (root) {
  'use strict';

  function normalizeInput(x, z, deadZone = 0.08) {
    const length = Math.hypot(x, z);
    if (!Number.isFinite(length) || length <= deadZone) {
      return { x: 0, z: 0, strength: 0 };
    }
    const strength = Math.min(1, length);
    return {
      x: (x / length) * strength,
      z: (z / length) * strength,
      strength
    };
  }

  function distanceXZ(a, b) {
    return Math.hypot((a.x || 0) - (b.x || 0), (a.z || 0) - (b.z || 0));
  }

  function nearestActiveTree(position, trees, radius = 5.8) {
    let nearest = null;
    let nearestDistance = Infinity;
    for (const tree of trees) {
      if (!tree || !tree.active) continue;
      const distance = distanceXZ(position, tree);
      if (distance < nearestDistance) {
        nearest = tree;
        nearestDistance = distance;
      }
    }
    return nearest && nearestDistance <= radius ? nearest : null;
  }

  function hitTree(state, tree) {
    if (!tree || !tree.active) return { ok: false, harvested: false, reason: 'inactive' };
    if (state.logs >= state.capacity) return { ok: false, harvested: false, reason: 'full' };

    tree.hp = Math.max(0, Number(tree.hp) || 0) - 1;
    if (tree.hp === 0) {
      tree.active = false;
      tree.regrow = 35;
      state.logs += 1;
      return { ok: true, harvested: true, reason: null };
    }
    return { ok: true, harvested: false, reason: null };
  }

  function advanceAutoChop(state, trees, position, timer, deltaSeconds, intervalSeconds = 0.55, radius = 5.8) {
    const target = nearestActiveTree(position, trees, radius);
    if (!target || state.logs >= state.capacity) {
      return { timer: 0, target: null, hits: [], harvested: false };
    }

    let cooldown = Math.max(0, Number(timer) || 0);
    let remaining = Math.max(0, Number(deltaSeconds) || 0);
    const interval = Math.max(0.05, Number(intervalSeconds) || 0.55);
    const hits = [];
    let guard = 0;

    // El delta del juego se limita a 50 ms; el guard evita bucles enormes
    // si esta función recibe accidentalmente un salto de tiempo anormal.
    while (remaining + 1e-9 >= cooldown && guard < 8) {
      remaining = Math.max(0, remaining - cooldown);
      const result = hitTree(state, target);
      hits.push(result);
      guard += 1;

      if (!result.ok || result.harvested) {
        cooldown = 0;
        break;
      }
      cooldown = interval;
    }

    if (cooldown > 0) cooldown = Math.max(0, cooldown - remaining);
    return {
      timer: cooldown,
      target,
      hits,
      harvested: hits.some(result => result.harvested)
    };
  }

  function isWithin(position, target, radius) {
    return distanceXZ(position, target) <= radius;
  }

  function interpolateXZ(from, to, progress) {
    const t = Math.max(0, Math.min(1, Number(progress) || 0));
    return {
      x: from.x + (to.x - from.x) * t,
      z: from.z + (to.z - from.z) * t
    };
  }


  function bindJoystick(zone, knob, onMove) {
    let activePointer = null;
    let activeTouch = null;

    function update(clientX, clientY) {
      const rect = zone.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const dx = clientX - rect.left - rect.width / 2;
      const dy = clientY - rect.top - rect.height / 2;
      const travel = Math.max(1, Math.min(rect.width, rect.height) * 0.31);
      const distance = Math.hypot(dx, dy);
      const scale = distance > travel ? travel / distance : 1;
      const limitedX = dx * scale;
      const limitedY = dy * scale;
      const vector = normalizeInput(limitedX / travel, limitedY / travel, 0.04);

      onMove({ x: vector.x, z: vector.z });
      knob.style.left = 'calc(50% - 21px + ' + limitedX + 'px)';
      knob.style.top = 'calc(50% - 21px + ' + limitedY + 'px)';
    }

    function reset() {
      const pointerId = activePointer;
      activePointer = null;
      activeTouch = null;

      if (pointerId !== null && zone.releasePointerCapture) {
        try {
          if (!zone.hasPointerCapture || zone.hasPointerCapture(pointerId)) {
            zone.releasePointerCapture(pointerId);
          }
        } catch (_) {}
      }

      onMove({ x: 0, z: 0 });
      knob.style.left = 'calc(50% - 21px)';
      knob.style.top = 'calc(50% - 21px)';
    }

    function onPointerDown(event) {
      if (activePointer !== null || activeTouch !== null) return;
      if (event.isPrimary === false) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      event.preventDefault();
      activePointer = event.pointerId;
      try {
        if (zone.setPointerCapture) zone.setPointerCapture(event.pointerId);
      } catch (_) {}
      update(event.clientX, event.clientY);
    }

    function onPointerMove(event) {
      if (event.pointerId !== activePointer) return;
      event.preventDefault();
      update(event.clientX, event.clientY);
    }

    function onPointerEnd(event) {
      if (event.pointerId === activePointer) reset();
    }

    zone.addEventListener('pointerdown', onPointerDown);
    zone.addEventListener('pointermove', onPointerMove);
    zone.addEventListener('pointerup', onPointerEnd);
    zone.addEventListener('pointercancel', onPointerEnd);
    zone.addEventListener('lostpointercapture', onPointerEnd);

    zone.addEventListener('touchstart', event => {
      if (activePointer !== null || activeTouch !== null) return;
      const touch = event.changedTouches[0];
      if (!touch) return;
      event.preventDefault();
      activeTouch = touch.identifier;
      update(touch.clientX, touch.clientY);
    }, { passive: false });

    zone.addEventListener('touchmove', event => {
      if (activeTouch === null) return;
      event.preventDefault();
      for (const touch of event.changedTouches) {
        if (touch.identifier === activeTouch) {
          update(touch.clientX, touch.clientY);
          break;
        }
      }
    }, { passive: false });

    function endTouch(event) {
      if (activeTouch === null) return;
      for (const touch of event.changedTouches) {
        if (touch.identifier === activeTouch) {
          reset();
          break;
        }
      }
    }

    zone.addEventListener('touchend', endTouch, { passive: false });
    zone.addEventListener('touchcancel', endTouch, { passive: false });
    zone.addEventListener('contextmenu', event => event.preventDefault());

    return { reset };
  }

  function advanceTruckJob(job, deltaSeconds, home, dock, loadSeconds = 1, travelSeconds = 5) {
    if (!job) return { position: home, load: false, unload: false, complete: true };
    job.t = (job.t || 0) + Math.max(0, Number(deltaSeconds) || 0);

    if (job.phase === 0) {
      if (job.t < loadSeconds) return { position: home, load: false, unload: false, complete: false };
      job.phase = 1;
      job.t = 0;
      return { position: home, load: true, unload: false, complete: false };
    }

    if (job.phase === 1) {
      const progress = Math.min(1, job.t / travelSeconds);
      const position = interpolateXZ(home, dock, progress);
      if (progress >= 1) {
        job.phase = 2;
        job.t = 0;
        return { position: dock, load: false, unload: true, complete: false };
      }
      return { position, load: false, unload: false, complete: false };
    }

    if (job.phase === 2) {
      const progress = Math.min(1, job.t / travelSeconds);
      const position = interpolateXZ(dock, home, progress);
      if (progress >= 1) return { position: home, load: false, unload: false, complete: true };
      return { position, load: false, unload: false, complete: false };
    }

    return { position: home, load: false, unload: false, complete: true };
  }

  const api = {
    normalizeInput,
    distanceXZ,
    nearestActiveTree,
    hitTree,
    advanceAutoChop,
    isWithin,
    interpolateXZ,
    bindJoystick,
    advanceTruckJob
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.ImperioLogic = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
