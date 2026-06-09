// scripts/ui/views/gameView.js

import { getGameState } from '../../core/state.js';
import { enemyBaseHp, field, playerBaseHp, battleResultPanel, battleResultMessage } from '../uiElements.js';
import { spawnHitDust } from './effectView.js';

/** 개체(아군/적군)를 필드 DOM에 추가 */
export function renderCreature(creature, sameSideCreatures) {
    const count = sameSideCreatures.filter((target) => target.data.id === creature.data.id).length;
    const sidePrefix = creature.isPlayer ? "player" : "enemy";

    creature.element.id = `${sidePrefix}-${creature.data.id}-${count}`;
    creature.element.className = "creature";
    creature.element.style.left = `${creature.position}px`;

    // Y축 랜덤 오버랩 방지 (구조적 수치가 아닌 단순 시각적 렌더링 흐름)
    creature.element.style.bottom = (Math.floor(Math.random() * 3) * 10) + "px";
    
    const isUserCreature = creature.isPlayer || creature.isNetworkOpponent;
    const direction = getGameState() ? (creature.isPlayer ? getGameState().playerDirection : getGameState().enemyDirection) : -1;
    
    creature.idle = direction === 1 ? creature.data.rev_idle : creature.data.idle;
    creature.walk = direction === 1 ? creature.data.rev_walk : creature.data.walk;
    creature.attack = direction === 1 ? creature.data.rev_attack : creature.data.attack;
    creature.attackFallback = direction === 1 ? creature.data.rev_attackFallback : creature.data.attackFallback;

    creature.isRevMissing = false; // _rev 에셋이 깨진 적이 있는 개체인지 여부
    creature.isWalkMissing = false; // walk 에셋이 깨진 적이 있는 개체인지 여부
    creature.isAttackMissing = false; // attack 에셋이 깨진 적이 있는 개체인지 여부

    var innerHTML = `<img src="" alt="${creature.data.name}">`;
    creature.element.innerHTML = innerHTML;

    const imgImg = creature.element.querySelector("img");
    if(imgImg) {
        imgImg.onerror = () => {
            const curState = creature.currentVisualState || (isUserCreature ? "walk" : "idle");
            if(imgImg.src.includes("_rev")) { // _rev 에셋이 깨진 경우
                creature.isRevMissing = true; // 플래그 처리
                setCreatureSrc(creature, curState); // 현재 상태 그대로 통상 버전 재출력 요청
            }
            else if(imgImg.src.includes("walk") || imgImg.src === creature.data.walk) { // walk 에셋이 깨진 경우
                creature.isWalkMissing = true;
                setCreatureSrc(creature, curState); // 내부 로직에 의해 idle로 우회
            }
            else if(imgImg.src.includes("attack") || imgImg.src === creature.data.attack) { // attack 에셋이 깨진 경우
                creature.isAttackMissing = true;
                setCreatureSrc(creature, curState); // 내부 로직에 의해 fallback으로 우회
            }
            else {
                imgImg.onerror = null; // 무한 루프 방지 위해 onerror 제거
                imgImg.src = creature.data.idle; // 일단 idle로 대체 시도
            }
        };
    }

    const initStateType = isUserCreature ? "walk" : "idle";
    setCreatureSrc(creature, initStateType);

    field.appendChild(creature.element);

    const size = creature.data.size ?? 1;
    const basePx = 60;
    const px = size * basePx;
    creature.element.style.width = `${px}px`;
    creature.element.style.height = `${px}px`;
}

/** 개체 이미지 소스 설정 */
export function setCreatureSrc(creature, stateType) {
    const imgImg = creature.element.querySelector("img");
    if (!imgImg) return;

    // battle.js의 allCreatures.forEach에서 설정하고는 있는데 쓰긴하나싶다
    creature.currentVisualState = stateType;

    const gameState = getGameState();
    const direction = gameState ? (creature.isPlayer ? gameState.playerDirection : gameState.enemyDirection) : -1;

    // 최종 상태
    let finalState = stateType;

    if(stateType === 'walk' && creature.isWalkMissing) {
        finalState = 'idle'; // walk 에셋이 깨진 경우 idle로 대체
    }
    else if(stateType === 'attack' && creature.isAttackMissing) {
        finalState = 'attackFallback'; // attack 에셋이 깨진 경우 fallback으로 대체
    }

    // 만약 한 번이라도 _rev 에셋이 깨진 적이 있는 개체라면
    if (creature.isRevMissing && direction === 1) {
        imgImg.style.transform = "scaleX(-1)";        // CSS 반전 강제 적용
        imgImg.src = creature.data[finalState];         // 통상 에셋 경로
    } else {
        // 정상 상태 (좌측 전진이거나, _rev 에셋이 잘 존재하는 경우)
        imgImg.style.transform = direction === 1 ? "scaleX(1)" : "scaleX(1)"; // _rev 에셋 자체에 이미 방향이 반영되어 있으므로 기본은 scaleX(1)
        imgImg.src = creature[finalState];              // direction에 따라 계산되어 있던 경로
    }
}

/** 루프에서 개체 상태 동기화 */
export function updateCreatureView(creature) {
    if (!creature.element) return;

    // 1. 위치 이동 동기화
    creature.element.style.left = `${creature.position}px`;
}

/**
 * 피격 처리 시 호출 — 데미지 적용 후 이펙트 발생
 * battle.js의 attackTarget / RES_DAMAGE 핸들러에서 호출
 */
export function onCreatureHit(target) {
    const bottomPx = parseInt(target.element?.style.bottom) || 0;
    spawnHitDust(target.position, bottomPx);
}

/** 사망한 개체를 전장 DOM에서 제거 */
export function removeCreatureView(creature) {
    if (creature.element && creature.element.parentNode) {
        creature.element.parentNode.removeChild(creature.element);
    }
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
