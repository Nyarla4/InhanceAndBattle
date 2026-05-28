// 유닛 이동/전투 및 베이스 파괴 판정

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