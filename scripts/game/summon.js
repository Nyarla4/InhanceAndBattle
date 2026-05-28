// 자원 체크 및 유닛 생성 요청

/** 개체 소환 함수 */
export function summonCreature(gameState, creature, isPlayer, updateCost) {
    if (isPlayer && gameState.cost < creature.cost) {
        console.log(`Not enough cost to set ${creature.name}!`);
        return;
    }
    if (isPlayer) {
        gameState.cost -= creature.cost;
        updateCost?.();
    }
    const targetArray = isPlayer ? gameState.playerCreatures : gameState.enemyCreatures;
    const newCreature = createCreatureInstance(creature, isPlayer);
    targetArray.push(newCreature);
    renderCreature(newCreature, targetArray);
    console.log(`Set ${newCreature.data.name} to field!`);
}