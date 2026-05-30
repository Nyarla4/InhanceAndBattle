// 자원 체크 및 유닛 생성 요청
// scripts/game/summon.js

import { eventBus } from "../core/eventBus.js";
import { EVENTS } from "../core/config.js";
import { consumeStoredCreature, enhanceState } from "../core/state.js";
import { renderCreature } from '../ui/views/gameView.js';
import creaturesData from '../../json/creatures.json' with { type: 'json' };

let stageTimer = 0;
let spawnQueue = [];

/** 스테이지 시작 시 적 소환 스케줄을 초기화합니다. */
export function initStageSpawnQueue(enemies = []) {
    stageTimer = 0;
    spawnQueue = [...enemies];
}

/** 보관함 개체 클릭 시 실행되는 아군 소환 로직 */
export function handleStorageSummon({ itemId }, gameState, isBattleRunning) {
    if (!gameState || !isBattleRunning) return;
    if (!gameState.canPlayerSummon) return;

    const storageItem = enhanceState.storage.find(item => item.id === itemId);
    if (!storageItem) return;

    const creatureId = `${storageItem.groupKey}_${storageItem.levelIdx}`;
    const template = creaturesData[creatureId];

    if (!template) {
        console.error("데이터베이스에 해당 개체가 없습니다:", creatureId);
        return;
    }

    const isConsumed = consumeStoredCreature(itemId);
    if (!isConsumed) return;

    const newCreature = createCreatureInstance({
        creatureId,
        template,
        isPlayer: true,
        position: gameState.playerSpawnX
    });

    gameState.playerCreatures.push(newCreature);
    renderCreature(newCreature, gameState.playerCreatures);

    eventBus.emit(EVENTS.STORAGE_STATE_CHANGED, {});
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

function summonEnemy(creatureId, gameState) {
    const template = creaturesData[creatureId];
    if (!template) return;

    const newEnemy = createCreatureInstance({
        creatureId,
        template,
        isPlayer: false,
        position: gameState.enemySpawnX
    });

    gameState.enemyCreatures.push(newEnemy);
    renderCreature(newEnemy, gameState.enemyCreatures);
}

function createCreatureInstance({ creatureId, template, isPlayer, position }) {
    const creatureData = {
        ...template,
        id: creatureId,
        idle: `./img/battle/${creatureId}_idle.png`,
        attack: `./img/battle/${creatureId}_attack.png`
    };

    return {
        id: Date.now() + Math.random(),
        data: creatureData,
        hp: creatureData.maxHp,
        isPlayer,
        isAlive: true,
        position,
        element: document.createElement('div'),
        currentVisualState: 'idle',
        lastAttackTime: 0,
        isAttackingVisual: false
    };
}
