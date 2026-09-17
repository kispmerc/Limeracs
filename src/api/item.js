import { ItemStack } from '@minecraft/server';
import { guard } from '../core/errors.js';

function create(typeId, amount = 1) {
    return guard(() => new ItemStack(typeId, amount), undefined);
}

function clone(item) {
    return guard(() => item.clone(), undefined);
}

function getId(item) {
    return item.typeId;
}

function getTypeId(item) {
    return item.typeId;
}

function getAmount(item) {
    return item.amount;
}

function setAmount(item, amount) {
    return guard(() => {
        item.amount = amount;
        return true;
    }, false) ?? false;
}

function getLore(item) {
    return guard(() => item.getLore(), []) ?? [];
}

function setLore(item, lore) {
    return guard(() => {
        item.setLore(lore);
        return true;
    }, false) ?? false;
}

function addLore(item, line) {
    return guard(() => {
        const lore = item.getLore();
        lore.push(line);
        item.setLore(lore);
        return true;
    }, false) ?? false;
}

function clearLore(item) {
    return setLore(item, []);
}

function getNameTag(item) {
    return guard(() => item.nameTag, undefined);
}

function setNameTag(item, name) {
    return guard(() => {
        item.nameTag = name;
        return true;
    }, false) ?? false;
}

export const itemApi = { create, clone, getId, getTypeId, getAmount, setAmount, getLore, setLore, addLore, clearLore, getNameTag, setNameTag };
