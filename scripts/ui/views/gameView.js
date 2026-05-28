// scripts/ui/views/gameView.js

/** 개체 렌더 */
function renderCreature(creature, sameSideCreatures) {
    const count = sameSideCreatures.filter((target) => target.data.id === creature.data.id).length;
    const sidePrefix = creature.isPlayer ? "player" : "enemy";
    creature.element.id = `${sidePrefix}-${creature.data.id}-${count}`;
    creature.element.className = "creature";
    creature.element.style.left = `${creature.position}px`;
    creature.element.style.bottom = (Math.floor(Math.random() * 3) * 10) + "px"; // 개체마다 약간씩 위치 달리해서 겹치는 느낌 완화
    creature.element.innerHTML += `<img src="${creature.data.idle}" alt="${creature.data.name}">`;
    setCreatureImageDirection(creature);
    field.appendChild(creature.element);
}
/** 개체 이미지 변경 */
function setCreatureImage(creature, src) {
    const creatureImg = creature.element.querySelector("img");
    if (creatureImg instanceof HTMLImageElement) {
        creatureImg.src = src;
    }
}
/** 적 개체 이미지 방향 반전 */
function setCreatureImageDirection(creature) {
    const creatureImg = creature.element.querySelector("img");
    if (creatureImg instanceof HTMLImageElement && !creature.isPlayer) {
        creatureImg.style.transform = "scaleX(-1)";
    }
}
/** 개체 렌더 */
function renderCreature(creature, sameSideCreatures) {
    const count = sameSideCreatures.filter((target) => target.data.id === creature.data.id).length;
    const sidePrefix = creature.isPlayer ? "player" : "enemy";
    creature.element.id = `${sidePrefix}-${creature.data.id}-${count}`;
    creature.element.className = "creature";
    creature.element.style.left = `${creature.position}px`;
    creature.element.style.bottom = (Math.floor(Math.random() * 3) * 10) + "px"; // 개체마다 약간씩 위치 달리해서 겹치는 느낌 완화
    creature.element.innerHTML += `<img src="${creature.data.idle}" alt="${creature.data.name}">`;
    setCreatureImageDirection(creature);
    field.appendChild(creature.element);
}
/** 개체 사망 */
function killCreature(creature) {
    setCreatureImage(creature, creature.data.die);
    creature.isAlive = false;
    setTimeout(() => {
        creature.element.remove();
    }, REMOVE_DEAD_CREATURE_DELAY);
}