// scripts/ui/views/gameView.js
import { field } from '../uiElements.js';

const REMOVE_DEAD_CREATURE_DELAY = 1000; // 사망 후 소멸까지의 딜레이 ms

/** 1. 필드상에 개체(유닛/에너미) 생성 및 렌더 */
export function renderCreature(creature, sameSideCreatures) {
    const count = sameSideCreatures.filter((target) => target.data.id === creature.data.id).length;
    const sidePrefix = creature.isPlayer ? "player" : "enemy";
    
    creature.element.id = `${sidePrefix}-${creature.data.id}-${count}`;
    creature.element.className = "creature";
    creature.element.style.left = `${creature.position}px`;
    
    // 개체마다 Y축을 살짝 다르게 배치하여 오버랩(겹침) 뭉개짐 연출 완화
    creature.element.style.bottom = (Math.floor(Math.random() * 3) * 10) + "px"; 
    creature.element.innerHTML = `<img src="${creature.data.idle}" alt="${creature.data.name}">`;
    
    setCreatureImageDirection(creature);
    field.appendChild(creature.element);
}

/** 2. 상태 변경 시 개체 이미지 스왑 (공격, 피격 등) */
export function setCreatureImage(creature, src) {
    const creatureImg = creature.element.querySelector("img");
    if (creatureImg instanceof HTMLImageElement) {
        creatureImg.src = src;
    }
}

/** 3. 적군 개체의 경우 좌우 이미지 반전 처리 */
export function setCreatureImageDirection(creature) {
    const creatureImg = creature.element.querySelector("img");
    if (creatureImg instanceof HTMLImageElement && !creature.isPlayer) {
        creatureImg.style.transform = "scaleX(-1)";
    }
}

/** 4. 개체 체력 소진 시 데스 애니메이션 연출 및 소멸 연산 */
export function killCreature(creature) {
    setCreatureImage(creature, creature.data.die);
    creature.isAlive = false;
    setTimeout(() => {
        creature.element.remove();
    }, REMOVE_DEAD_CREATURE_DELAY);
}