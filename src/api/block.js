import { guard } from '../core/errors.js';

function get(dimension, location) {
    return guard(() => dimension.getBlock(location), undefined);
}

function set(dimension, location, permutationOrTypeId) {
    return guard(() => {
        const block = dimension.getBlock(location);
        if (!block) return false;
        if (typeof permutationOrTypeId === 'string') {
            block.setType(permutationOrTypeId);
        } else {
            block.setPermutation(permutationOrTypeId);
        }
        return true;
    }, false) ?? false;
}

function replace(dimension, location, matchTypeId, replacementTypeId) {
    return guard(() => {
        const block = dimension.getBlock(location);
        if (!block || block.typeId !== matchTypeId) return false;
        block.setType(replacementTypeId);
        return true;
    }, false) ?? false;
}

function is(block, typeId) {
    return guard(() => block.typeId === typeId, false) ?? false;
}

function getPermutation(block) {
    return guard(() => block.permutation, undefined);
}

function getTypeId(block) {
    return guard(() => block.typeId, undefined);
}

export const blockApi = { get, set, replace, is, getPermutation, getTypeId };
