// 유닛 스탯 데이터 및 게임 세션 설정 구조
// scripts/core/config.js

/*
export const CreatureData {
    id: string;
    name: string;
    idle: string;
    attack: string;
    die: string;
    moveSpeed: number;
    attackRange: number;
    attackTerm: number;
    attackDamage: number;
    coolTime: number;
    cost: number;
    maxHp: number;
    canAttackMultipleTargets: boolean;
}

export interface CreatureInstance {
    data: CreatureData;
    position: number;
    lastAttackTime: number;
    element: HTMLDivElement;
    hp: number;
    isPlayer: boolean;
    isAlive: boolean;
    damaged: (damage: number) => void;
}

export interface GameState {
    cost: number;
    playerHp: number;
    playerMaxHp: number;
    enemyHp: number;
    playerCreatures: CreatureInstance[];
    enemyCreatures: CreatureInstance[];
    stageData: StageData;
}

export interface PlayerState {
    currency: number;
    upgrades: PlayerUpgrades;
    creatureLevels: CreatureLevels;
    clearedStages: string[];
}

export interface PlayerUpgrades {
    costPerSec: number;
    rewardMultiplier: number;
    currentHp: number;
}

export interface CreatureLevels {
    [key: string]: number;
}

export interface EnemySpawn {
    id: string;
    timing: number;
}

export interface StageData {
    id: string;
    name: string;
    enemies: EnemySpawn[];
    stageDistance: number;
    reward: number;
    enemyHp: number;
}
*/

/** json 플레이어 데이터 로드 */
async function fetchPlayerData() {
    const response = await fetch("./json/playerData.json");
    if (!response.ok) {
        throw new Error("Failed to load player data: playerData.json");
    }
    return await response.json();
}
/** json 개체 데이터 로드 */
async function fetchCreatureData() {
    const response = await fetch("./json/creatures.json");
    if (!response.ok) {
        throw new Error("Failed to load creature data: creatures.json");
    }
    return await response.json();
}