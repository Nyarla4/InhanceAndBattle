// scripts/ui/views/gameView.js

import { field } from '../uiElements.js';

/** 개체(아군/적군)를 필드 DOM에 추가 */
export function renderCreature(creature, sameSideCreatures) {
    const count = sameSideCreatures.filter((target) => target.data.id === creature.data.id).length;
    const sidePrefix = creature.isPlayer ? "player" : "enemy";
    
    creature.element.id = `${sidePrefix}-${creature.data.id}-${count}`;
    creature.element.className = "creature";
    creature.element.style.left = `${creature.position}px`;
    
    // Y축 랜덤 오버랩 방지 (구조적 수치가 아닌 단순 시각적 렌더링 흐름)
    creature.element.style.bottom = (Math.floor(Math.random() * 3) * 10) + "px"; 
    creature.element.innerHTML = `<img src="${creature.data.idle}" alt="${creature.data.name}">`;
    
    setCreatureImageDirection(creature);
    field.appendChild(creature.element);
}

/** 적군 이미지 좌우 반전 처리 */
export function setCreatureImageDirection(creature) {
    const creatureImg = creature.element.querySelector("img");
    if (creatureImg instanceof HTMLImageElement && !creature.isPlayer) {
        creatureImg.style.transform = "scaleX(-1)";
    }
}