// 유닛 이동/전투 및 베이스 파괴 판정
// scripts/game/battle.js

import { EVENTS } from "../core/config";
import { eventBus } from "../core/eventBus";

/** 개체 업데이트 */
export function updateCreatures(creatures, opponents, isPlayerSide, now, deltaTime, gameState) {
    creatures.forEach((creature) => {
        if (!creature.isAlive) {
            return;
        }
        const isBlockedByCreature = attackOpponentsInRange(creature, opponents, isPlayerSide, now);
        const isBlockedByBase = !isBlockedByCreature && attackBaseIfInRange(gameState, creature, isPlayerSide, now);
        if (!isBlockedByCreature && !isBlockedByBase) {
            moveCreature(creature, isPlayerSide, deltaTime);
        }
    });
}
/** 공격 범위 내 상대 개체 공격 */
function attackOpponentsInRange(creature, opponents, isPlayerSide, now) {
    const targets = getAttackableOpponents(creature, opponents, isPlayerSide);
    if (targets.length <= 0) {
        return false;
    }
    attackCreatures(creature, getAttackTargets(creature, targets), now);
    return true;
}
/** 공격 가능한 상대 개체 목록 */
function getAttackableOpponents(creature, opponents, isPlayerSide) {
    return opponents.filter((opponent) => {
        if (!opponent.isAlive) {
            return false;
        }
        return isPlayerSide
            ? creature.position <= opponent.position + creature.data.attackRange
            : creature.position > opponent.position - creature.data.attackRange;
    });
}
/** 실제 공격 대상 목록 */
function getAttackTargets(creature, targets) {
    return creature.data.canAttackMultipleTargets ? targets : targets.slice(0, 1);
}
/** 베이스 공격 범위 확인 */
function attackBaseIfInRange(gameState, creature, isPlayerSide, now) {
    const isBaseInRange = isPlayerSide
        ? creature.position - creature.data.attackRange <= enemyBase.clientWidth
        : creature.position + creature.data.attackRange >= field.clientWidth - playerBase.clientWidth - playerBase.clientWidth;
    if (!isBaseInRange) {
        return false;
    }
    attackBase(gameState, creature, isPlayerSide, now);
    return true;
}
/** 공격 가능 여부 */
function canAttack(creature, now) {
    return now - creature.lastAttackTime >= creature.data.attackTerm;
}

let storageSummonUnsubscribe = null;
/** 전투 시스템 초기화 및 이벤트 바인딩 (Construction) */
export function initBattleEvents() {
    // 중복 등록 방지 안전장치
    if (storageSummonUnsubscribe) storageSummonUnsubscribe();

    // eventBus.on은 구독 해제 함수를 반환하므로 이를 보관
    storageSummonUnsubscribe =
        eventBus.on(EVENTS.REQUEST_STORAGE_SUMMON, ({ itemId }) => {
            // 1. 시스템 구조체(배틀 세션) 검증
            const gameState = window.currentGameState || null;
            if (!gameState) {
                console.error("현재 진행 중인 전투 데이터 세션을 찾을 수 없습니다.");
                return;
            }

            // 2. 구조(State) 데이터 조회
            const item = enhanceState.storage.find(i => i.id === itemId);
            if (!item) return;

            // 3. 스탯 데이터 조립 (Data Injection)
            // 외부 데이터 기반 스탯 연산 주입 로직 필요
            const summonTarget = {
                id: item.id,
                name: item.name,
                idle: item.img,
                cost: 0,
                attackRange: 100, // TODO: 외부 데이터 연동
                canAttackMultipleTargets: false
            };

            // 4. 소환 로직 실행
            summonCreature(gameState, summonTarget, true, () => {
                // 소환 성공 시 상태 제어 및 스토리지 동기화 (구조 레이어)
                const isConsumed = consumeStoredCreature(itemId);

                if (isConsumed) {
                    // 상태가 변경되었음을 알리는 이벤트 전파 (데이터 전달 가능)
                    eventBus.emit(EVENTS.STORAGE_STATE_CHANGED, { currentCost: gameState.cost });
                }
            });
        });
}

/** 전투 종료 시 해제 파이프라인 (Memory Cleanup) */
export function clearBattleEvents() {
    if (storageSummonUnsubscribe) {
        storageSummonUnsubscribe();
        storageSummonUnsubscribe = null;
    }
}