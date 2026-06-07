// 자원 체크 및 유닛 생성 요청
// scripts/game/summon.js

import { eventBus } from "../core/eventBus.js";
import { EVENTS } from "../core/config.js";
import { consumeStoredCreature, enhanceState, getGameState, setEnemyCreature, setPlayerCreature } from "../core/state.js";
import { renderCreature } from '../ui/views/gameView.js';
import creaturesData from '../../json/creatures.json' with { type: 'json' };
import { socketClient } from "../network/socketClient.js";
import { IsBattleRunning } from "./battle.js";

let stageTimer = 0;
let spawnQueue = [];

/** 소환 처리 등록 */
export function initSummonListener() {
    eventBus.on(EVENTS.REQ_SUMMON, (payload) => { // 자신의 "소환" 요청
        const summonResult = handleStorageSummon(payload, getGameState(), IsBattleRunning());
        if (summonResult && socketClient.isConnected) {
            socketClient.sendSpawnCreature(summonResult.creatureId, summonResult.level, summonResult.syncId);
        }
    });
    eventBus.on(EVENTS.RES_SUMMON, (payload) => { // 상대의 "소환" 요청의 반응
        if (!getGameState() || !IsBattleRunning()) return;
        summonOpponentCreature(payload, getGameState());
    });
}

/** 스테이지 시작 시 적 소환 스케줄 초기화 */
export function initStageSpawnQueue(enemies = []) {
    stageTimer = 0;
    spawnQueue = [...enemies];
}

/** 보관함 개체 클릭 시 실행되는 아군 소환 로직 */
export function handleStorageSummon({ itemId }, gameState, isBattleRunning) {
    // 게임 중이고 소환이 가능할 때만 처리
    if (!gameState || !isBattleRunning) return;
    if (!gameState.canPlayerSummon) return;

    // 강화 보관함에서 소환할 개체 탐색
    const storageItem = enhanceState.storage.find(item => item.id === itemId);
    if (!storageItem) return;

    // 개체 ID 작성 및 DB에서 ID에 맞는 데이터 획득
    const creatureId = `${storageItem.groupKey}_${storageItem.levelIdx}`;
    const template = creaturesData[creatureId];

    if (!template) { // DB에 해당 데이터 없으면 미처리
        console.error("데이터베이스에 해당 개체가 없습니다:", creatureId);
        return;
    }

    // 보관함에서 소모 처리
    const isConsumed = consumeStoredCreature(itemId);
    if (!isConsumed) return;

    // 신규 생성
    const newCreature = createCreatureInstance({
        creatureId,
        template,
        isPlayer: true,
        position: gameState.playerSpawnX
    });

    // 세션에 처리 및 렌더
    var playerCreatures = [...gameState.playerCreatures];
    playerCreatures.push(newCreature);
    setPlayerCreature(playerCreatures);
    renderCreature(newCreature, playerCreatures);

    // 보관함에 소모 처리 요청
    eventBus.emit(EVENTS.STORAGE_STATE_CHANGED, {});
    return { creatureId, level: storageItem.levelIdx, syncId: newCreature.id };
}

/** 멀티용 적 소환 */
export function summonOpponentCreature({ creatureId, level, syncId }, gameState) {
    if (!gameState) return false;

    const template = creaturesData[creatureId];
    if (!template) {
        console.error("데이터베이스에 해당 상대 개체가 없습니다:", creatureId);
        return false;
    }

    const newEnemy = createCreatureInstance({
        creatureId,
        template,
        isPlayer: false,
        position: gameState.enemySpawnX,
        syncId: syncId
    });
    newEnemy.isNetworkOpponent = true;

    var enemyCreatures = [...gameState.enemyCreatures];
    enemyCreatures.push(newEnemy);
    setEnemyCreature(enemyCreatures);
    renderCreature(newEnemy, enemyCreatures);
    return true;
}

/** 스테이지 데이터에서 적 소환 처리 */
export function updateStageSpawner(deltaTime, gameState) {
    if (spawnQueue.length === 0) return;
    stageTimer += deltaTime;

    for (let i = spawnQueue.length - 1; i >= 0; i--) {
        const spawnTarget = spawnQueue[i];

        if (stageTimer >= spawnTarget.spawnTime) {
            summonEnemy(spawnTarget.id, gameState);
            spawnQueue.splice(i, 1);
        }
    }
}

/** 싱글용 적 소환 */
function summonEnemy(creatureId, gameState, syncId) {
    const template = creaturesData[creatureId];
    if (!template) return;

    const newEnemy = createCreatureInstance({
        creatureId,
        template,
        isPlayer: false,
        position: gameState.enemySpawnX
    });

    var enemyCreatures = [...gameState.enemyCreatures];
    enemyCreatures.push(newEnemy);
    setEnemyCreature(enemyCreatures);
    renderCreature(newEnemy, enemyCreatures);
}

/** 개체 인스턴스 생성 */
function createCreatureInstance({ creatureId, template, isPlayer, position, syncId = null }) {
    const creatureData = {
        ...template,
        id: creatureId,
        idle: `./img/battle/${creatureId}_idle.png`,
        walk: `./img/battle/gif/${creatureId}_walk.gif`,
        attack: `./img/battle/gif/${creatureId}_attack.gif`,
        attackFallback: `./img/battle/${creatureId}_attack.png`
    };

    return {
        // 멀티인 경우 syncId, 아닌 경우 기존 ID
        id: syncId || (Date.now() + Math.random()),
        data: creatureData,
        hp: creatureData.maxHp,
        isPlayer,
        isAlive: true,
        position,
        element: document.createElement('div'),
        currentVisualState: 'idle',
        attackCycleStartTime: 0,
        hasDealtDamage: false,
        isAttackingVisual: false
    };
}
