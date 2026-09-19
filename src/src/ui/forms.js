/**
 * Wrapper around @minecraft/server-ui for opening forms with plain objects
 * guard prevents errors from show calls from escaping as unhandled rejections
 */

import { ActionFormData, ModalFormData, MessageFormData } from '@minecraft/server-ui';
import { guard } from '../core/errors.js';

async function actionForm(player, options) {
    return guard(async () => {
        const form = new ActionFormData();
        if (options.title) form.title(options.title);
        if (options.body) form.body(options.body);
        for (const button of options.buttons ?? []) {
            form.button(button.text, button.iconPath);
        }
        return await form.show(player);
    }, undefined);
}

async function modalForm(player, options) {
    return guard(async () => {
        const form = new ModalFormData();
        if (options.title) form.title(options.title);
        for (const field of options.fields ?? []) {
            switch (field.type) {
                case 'toggle':
                    form.toggle(field.label, field.default ?? false);
                    break;
                case 'slider':
                    form.slider(field.label, field.min, field.max, field.step ?? 1, field.default);
                    break;
                case 'dropdown':
                    form.dropdown(field.label, field.options ?? [], field.default ?? 0);
                    break;
                case 'textField':
                    form.textField(field.label, field.placeholder ?? '', field.default ?? '');
                    break;
                default:
                    break;
            }
        }
        return await form.show(player);
    }, undefined);
}

async function messageForm(player, options) {
    return guard(async () => {
        const form = new MessageFormData();
        if (options.title) form.title(options.title);
        if (options.body) form.body(options.body);
        form.button1(options.button1 ?? 'OK');
        if (options.button2) form.button2(options.button2);
        return await form.show(player);
    }, undefined);
}

export const ui = { actionForm, modalForm, messageForm };
