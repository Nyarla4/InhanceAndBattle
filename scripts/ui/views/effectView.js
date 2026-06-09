// scripts/ui/views/effectView.js

import { field } from '../uiElements.js';

const DUST_DURATION = 1000; // ms

/**
 * 피격 위치에 먼지 이펙트 스프라이트 표시
 * @param {number} x  - creature.position (field 기준 px)
 * @param {number} bottom - creature의 bottom 값 (px, 기본 0)
 */
export function spawnHitDust(x, bottom = 0) {
    const el = document.createElement('div');
    el.className = 'hit-dust';
    el.style.left = `${x}px`;
    el.style.bottom = `${bottom}px`;

    field.appendChild(el);

    setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
    }, DUST_DURATION);
}