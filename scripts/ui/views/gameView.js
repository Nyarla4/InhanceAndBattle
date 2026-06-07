// scripts/ui/views/gameView.js

import { getGameState } from '../../core/state.js';
import { enemyBaseHp, field, playerBaseHp, battleResultPanel, battleResultMessage } from '../uiElements.js';

/** 개체(아군/적군)를 필드 DOM에 추가 */
export function renderCreature(creature, sameSideCreatures) {
    const count = sameSideCreatures.filter((target) => target.data.id === creature.data.id).length;
    const sidePrefix = creature.isPlayer ? "player" : "enemy";

    creature.element.id = `${sidePrefix}-${creature.data.id}-${count}`;
    creature.element.className = "creature";
    creature.element.style.left = `${creature.position}px`;

    // Y축 랜덤 오버랩 방지 (구조적 수치가 아닌 단순 시각적 렌더링 흐름)
    creature.element.style.bottom = (Math.floor(Math.random() * 3) * 10) + "px";
    
    var innerHTML = "";
    if(creature.isPlayer) {
        innerHTML = `<img src="${creature.data.walk}" alt="${creature.data.name}" onerror="this.onerror=null; this.src='${creature.data.idle}';">`;
    }
    else {
        innerHTML = `<img src="${creature.data.idle}" alt="${creature.data.name}">`;
    }
    creature.element.innerHTML = innerHTML;

    setCreatureImageDirection(creature);
    field.appendChild(creature.element);
}

/** 적군 이미지 좌우 반전 처리 */
export function setCreatureImageDirection(creature) {
    const creatureImg = creature.element.querySelector("img");
    if (!(creatureImg instanceof HTMLImageElement)) return;

    const gameState = getGameState();
    if (!gameState) return;

    // 해당 개체의 실제 전진 방향 (1: 우측 전진, -1: 좌측 전진)
    const direction = creature.isPlayer ? gameState.playerDirection : gameState.enemyDirection;

    // 기본 에셋이 [좌측]을 보므로, 우측(1)으로 전진할 때만 이미지를 반전
    if (direction === 1) {
        creatureImg.style.transform = "scaleX(-1)"; // 우측 전진 시 반전 (우측 바라봄)
    } else {
        creatureImg.style.transform = "scaleX(1)";  // 좌측 전진 시 원본 (좌측 바라봄)
    }
}

/** 루프에서 개체 상태 동기화 */
export function updateCreatureView(creature) {
    if (!creature.element) return;

    // 1. 위치 이동 동기화
    creature.element.style.left = `${creature.position}px`;
}

/** 사망한 개체를 전장 DOM에서 제거 */
export function removeCreatureView(creature) {
    if (creature.element && creature.element.parentNode) {
        creature.element.parentNode.removeChild(creature.element);
    }
}

/** 개체를 공격 연출 이미지 또는 필터 상태로 변경 */
export function setCreatureAttackView(creature, restart = false) {
    if (!creature.element) return;
    const imgEl = creature.element.querySelector("img");
    if (!imgEl) return;

    const attackTarget = creature.data.attack;

    if (!attackTarget) {
        creature.element.style.filter = "invert(100%)";
    } else {
        if (restart) {
            imgEl.src = '';
            void imgEl.offsetWidth;
        }
        imgEl.src = attackTarget;

        imgEl.onerror = () => {
            if (creature.data.attackFallback && imgEl.src !== creature.data.attackFallback) {
                imgEl.src = creature.data.attackFallback;
                return;
            }
            imgEl.src = creature.data.idle;
            creature.element.style.filter = "invert(100%)";
        }
    }
    setCreatureImageDirection(creature);
}

/** 개체를 기본 대기(idle) 상태로 복구 */
export function setCreatureIdleView(creature) {
    if (!creature.element) return;
    const imgEl = creature.element.querySelector("img");
    if (!imgEl) return;

    // 공격 시 적용되었던 필터와 이미지를 모두 원래대로 원복
    creature.element.style.filter = "none";

    if (creature.isPlayer) {
        imgEl.src = creature.data.walk;
        imgEl.onerror = () => {
            imgEl.onerror = null;
            imgEl.src = creature.data.idle;
        };
    }
    setCreatureImageDirection(creature);
}

export function renderBaseHp(currentStage, playerMaxHp, enemyMaxHp) {
    playerBaseHp.textContent = `${currentStage.playerHp}/${playerMaxHp}`
    enemyBaseHp.textContent = `${currentStage.enemyHp}/${enemyMaxHp}`
}

/** 전투 결과창 출력 */
export function showBattleResult(isVictory, isMulti) {
   if (!battleResultPanel) return;
    
    battleResultMessage.textContent = isVictory ? (isMulti ? "WIN" : "STAGE CLEAR!") : (isMulti ? "LOSE" : "GAME OVER...");
    battleResultMessage.classList.toggle('battle-result--victory', isVictory);
    battleResultMessage.classList.toggle('battle-result--defeat', !isVictory);

    // 패널 노출
    battleResultPanel.classList.remove('hidden');
}

/** 전투 결과창 초기화 */
export function initBattleResult() {
    if (!battleResultPanel) return;
    if(battleResultPanel.classList.contains('hidden')) return;

    battleResultPanel.classList.add('hidden');
}
