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

  const api = {
    normalizeInput,
    distanceXZ,
    nearestActiveTree,
    hitTree,
    isWithin,
    interpolateXZ
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.ImperioLogic = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
