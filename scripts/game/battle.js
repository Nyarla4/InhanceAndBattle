// 유닛 이동/전투 및 베이스 파괴 판정
// scripts/game/battle.js

import { EVENTS } from "../core/config";
import { eventBus } from "../core/eventBus";
import creaturesData from '../../data/creatures.json' with { type: 'json' }; // 마스터 스탯 데이터
import { summonCreature } from "./summon";

// 배틀 세션 내부 상태 상태 관리 변수
let stageTimer = 0;
let spawnQueue = [];
let currentStage = null;

// daisensou에서 가져온 것들
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
            const summonId = `${item.groupKey}_${item.levelIdx}`;
            const statTemplate = creaturesData[summonId];

            if(!statTemplate) {
                console.error(`스탯 데이터를 찾을 수 없습니다: ${summonId}`);
                return;
            }

            const summonTarget = {
                id: item.id,
                name: statTemplate.name,
                idle: `./img/battle/${summonId}_idle.png`,
                attack: `./img/battle/${summonId}_battle.png`,
                die: `./img/battle/${summonId}_die.png`,
                cost: statTemplate.cost,
                maxHp: statTemplate.maxHp,
                attackDamage: statTemplate.attackDamage,
                attackRange: statTemplate.attackRange,
                attackTerm: statTemplate.attackTerm,
                moveSpeed: statTemplate.moveSpeed,
                canAttackMultipleTargets: statTemplate.canAttackMultipleTargets
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

/** 전투 초기화 및 시작 (외부 UI에서 호출) */
export function startBattle(stageData) {
    stageTimer = 0;
    currentStage = stageData;
    // 에너미 스폰 스케줄 데이터 복사
    spawnQueue = JSON.parse(JSON.stringify(stageData.enemies));
    
    // 필요 시 현재 전장 세션 상태 초기화 코드 추가 (window.currentGameState 설정 등)
}

/** 메인 게임 루프 또는 프레임 업데이트에서 매번 호출해야 하는 스폰 타이머 함수 */
export function updateStageSpawner(deltaTime, gameState) {
    if (!currentStage || spawnQueue.length === 0) return;

    stageTimer += deltaTime; // 누적 경과 시간 (ms 단위 기준)

    for (let i = spawnQueue.length - 1; i >= 0; i--) {
        const spawnGroup = spawnQueue[i];

        if (stageTimer >= spawnGroup.spawnTime && spawnGroup.count > 0) {
            const template = creaturesData[spawnGroup.id];
            if (!template) continue;

            // 에너미 인스턴스 전용 규격 바인딩
            const enemyTarget = {
                id: spawnGroup.id,
                name: template.name,
                idle: template.idle || "./img/default_enemy.png", 
                attack: template.attack || "./img/default_enemy.png", 
                die: template.die || "./img/default_enemy.png", 
                cost: 0,
                maxHp: template.maxHp,
                attackDamage: template.attackDamage,
                attackRange: template.attackRange,
                attackTerm: template.attackTerm,
                moveSpeed: template.moveSpeed,
                canAttackMultipleTargets: template.canAttackMultipleTargets
            };

            // summon.js 인터페이스 호출 (isPlayer = false)
            summonCreature(gameState, enemyTarget, false);

            spawnGroup.count--;
            if (spawnGroup.count <= 0) {
                spawnQueue.splice(i, 1); // 스폰 완료된 큐 제거
            }
        }
    }
}