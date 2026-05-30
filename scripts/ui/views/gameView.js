// scripts/ui/views/gameView.js

import { enemyBaseHp, field, playerBaseHp } from '../uiElements.js';

const ENEMY_FALLBACK_IMAGE = './img/default_enemy.png';

/** 개체(아군/적군)를 필드 DOM에 추가 */
export function renderCreature(creature, sameSideCreatures) {
    const count = sameSideCreatures.filter((target) => target.data.id === creature.data.id).length;
    const sidePrefix = creature.isPlayer ? "player" : "enemy";

    creature.element.id = `${sidePrefix}-${creature.data.id}-${count}`;
    creature.element.className = "creature";
    creature.element.style.left = `${creature.position}px`;

    // Y축 랜덤 오버랩 방지 (구조적 수치가 아닌 단순 시각적 렌더링 흐름)
    creature.element.style.bottom = (Math.floor(Math.random() * 3) * 10) + "px";
    
    creature.element.innerHTML = `<img src="${creature.data.idle}" alt="${creature.data.name}"`;
    if(!creature.isPlayer) {
        creature.element.innerHTML += ` onerror="this.onerror=null; this.src='${ENEMY_FALLBACK_IMAGE}';">`;
    }
    else {
        creature.element.innerHTML += ">";
    }

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

/** 루프에서 개체 상태 동기화 */
export function updateCreatureView(creature) {
    if (!creature.element) return;

    // 1. 위치 이동 동기화
    creature.element.style.left = `${creature.position}px`;

    // Todo: HP 바 갱신, 피격 이펙트 등 시각적 처리
}

/** 사망한 개체를 전장 DOM에서 제거 */
export function removeCreatureView(creature) {
    if (creature.element && creature.element.parentNode) {
        creature.element.parentNode.removeChild(creature.element);
    }
}

/** 개체를 공격 연출 이미지 또는 필터 상태로 변경 */
export function setCreatureAttackView(creature) {
    if (!creature.element) return;
    const imgEl = creature.element.querySelector("img");
    if (!imgEl) return;

    const attackTarget = creature.data.attack;

    if (attackTarget === "invert") {
        // 조건이 invert인 경우 색상 반전 필터 적용
        creature.element.style.filter = "invert(100%)";
    } else if (attackTarget) {
        // 일반 주소인 경우 이미지 경로 변경
        imgEl.src = attackTarget;

        imgEl.onerror = () => { // attack 이미지가 없는 경우
            imgEl.onerror = null; // 반복 방지
            imgEl.src = creature.data.idle; // idle 이미지로 처리
            creature.element.style.filter = "invert(100%)"; // idle에 이미지 반전 처리
        }
    }
}

/** 개체를 기본 대기(idle) 상태로 복구 */
export function setCreatureIdleView(creature) {
    if (!creature.element) return;
    const imgEl = creature.element.querySelector("img");
    if (!imgEl) return;

    // 공격 시 적용되었던 필터와 이미지를 모두 원래대로 원복
    creature.element.style.filter = "none";
    imgEl.src = creature.data.idle;

    if(!creature.isPlayer) { // enemy가
        imgEl.onerror = () => { // idle 이미지가 없는 경우
            imgEl.onerror = null;
            imgEl.src = ENEMY_FALLBACK_IMAGE; // 임시 이미지 처리
        };
    }
}

export function renderBaseHp(currentStage, playerMaxHp, enemyMaxHp) {
    playerBaseHp.textContent = `${currentStage.playerHp}/${playerMaxHp}`
    enemyBaseHp.textContent = `${currentStage.enemyHp}/${enemyMaxHp}`
}