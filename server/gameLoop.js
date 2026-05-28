// 멀티플레이 인게임 동기화 및 패킷 송수신 제어 (흐름)

/** 스테이지 루프 */
function gameLoop(now) {
    const deltaTime = (now - lastTime) / 1000;
    lastTime = now;
    gainCost(deltaTime);
    spawnQueuedEnemies(now - stageStartTime);
    updateCreatures(gameState.playerCreatures, gameState.enemyCreatures, true, now, deltaTime, gameState);
    updateCreatures(gameState.enemyCreatures, gameState.playerCreatures, false, now, deltaTime, gameState);
    checkGameOver(gameState.stageData);
    if (isGameRunning) {
        gameLoopId = requestAnimationFrame(gameLoop);
    }
}
/** 큐에 있는 에너미 소환 처리 */
function spawnQueuedEnemies(stageElapsedTime) {
    if (enemyQueue.length === 0 || stageElapsedTime < enemyQueue[0].timing) {
        return;
    }
    const enemyData = enemyQueue.shift();
    const target = creaturesData.find((creature) => creature.id === enemyData?.id);
    if (target && enemyData) {
        summonCreature(gameState, target, false);
        console.log(`Enemy ${enemyData.id} appears!`);
    }
}