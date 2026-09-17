import { guard } from '../core/errors.js';

function getInventory(entity) {
    return guard(() => entity.getComponent('inventory'), undefined);
}

function getContainer(entity) {
    return getInventory(entity)?.container;
}

function add(entity, item) {
    return guard(() => {
        const container = getContainer(entity);
        if (!container) return false;
        container.addItem(item);
        return true;
    }, false) ?? false;
}

function remove(entity, typeId, amount = Infinity) {
    return guard(() => {
        const container = getContainer(entity);
        if (!container) return 0;
        let removed = 0;
        for (let i = 0; i < container.size && removed < amount; i += 1) {
            const slot = container.getItem(i);
            if (!slot || slot.typeId !== typeId) continue;
            const take = Math.min(slot.amount, amount - removed);
            if (take >= slot.amount) {
                container.setItem(i, undefined);
            } else {
                slot.amount -= take;
                container.setItem(i, slot);
            }
            removed += take;
        }
        return removed;
    }, 0) ?? 0;
}

function count(entity, typeId) {
    return guard(() => {
        const container = getContainer(entity);
        if (!container) return 0;
        let total = 0;
        for (let i = 0; i < container.size; i += 1) {
            const slot = container.getItem(i);
            if (slot?.typeId === typeId) total += slot.amount;
        }
        return total;
    }, 0) ?? 0;
}

function has(entity, typeId) {
    return count(entity, typeId) > 0;
}

function clear(entity) {
    return guard(() => {
        const container = getContainer(entity);
        if (!container) return false;
        container.clearAll();
        return true;
    }, false) ?? false;
}

function find(entity, predicate) {
    return guard(() => {
        const container = getContainer(entity);
        if (!container) return -1;
        for (let i = 0; i < container.size; i += 1) {
            const slot = container.getItem(i);
            if (slot && predicate(slot, i)) return i;
        }
        return -1;
    }, -1) ?? -1;
}

export const inventoryApi = { getInventory, getContainer, add, remove, count, has, clear, find };
