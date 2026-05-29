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

export const EVENTS = Object.freeze({
    // 시스템 및 네트워크 관련
    SOCKET_CONNECTED: 'SOCKET_CONNECTED',

    // 전투 및 소환 관련 (구조 -> 흐름 요청)
    REQUEST_STORAGE_SUMMON: 'REQUEST_STORAGE_SUMMON',

    // 상태 변경 및 UI 갱신 관련 (흐름 -> 구조 통지)
    STORAGE_STATE_CHANGED: 'STORAGE_STATE_CHANGED'
});

// 1. 강화 그룹 데이터 정의
export const ENHANCE_GROUPS = {
    nezming: {
        name: "네즈밍",
        items: [
            {
                name: "미도미도 마요",
                img: "./img/mayo/01_마요.png",
                percent: 0,
                antiPercent: 100
            },
            {
                name: "바오밥나무 네즈밍",
                img: "./img/mayo/02_바오밥나무.png",
                percent: 10,
                antiPercent: 80
            },
            {
                name: "볼드의 대형 해머 네즈밍",
                img: "./img/mayo/03_볼드의대형해머.png",
                percent: 20,
                antiPercent: 60
            },
            {
                name: "처형자의 대검 네즈밍",
                img: "./img/mayo/04_처형자의대검.png",
                percent: 30,
                antiPercent: 40
            },
            {
                name: "클레이모어 네즈밍",
                img: "./img/mayo/05_클레이모어.png",
                percent: 40,
                antiPercent: 20
            },
            {
                name: "바스타드 소드 네즈밍",
                img: "./img/mayo/06_바스타드소드.png",
                percent: 50,
                antiPercent: 0
            },
            {
                name: "야구빠따 네즈밍",
                img: "./img/mayo/07_야구빠따.png",
                percent: 60,
                antiPercent: 0
            },
            {
                name: "커터칼 네즈밍",
                img: "./img/mayo/08_커터칼.png",
                percent: 70,
                antiPercent: 0
            },
            {
                name: "눈썹칼 네즈밍",
                img: "./img/mayo/09_눈썹칼.png",
                percent: 80,
                antiPercent: 0
            },
            {
                name: "이쑤시개 네즈밍",
                img: "./img/mayo/10_이쑤시개.png",
                percent: 90,
                antiPercent: 0
            }
        ]
    },
    majitomo: {
        name: "마지토모",
        items: [
            {
                name: "마지나이 쿠로카",
                img: "./img/slime/01_gold.png",
                percent: 0
            },
            {
                name: "되어있지않아",
                img: "./img/slime/02_dia.png",
                percent: 15
            },
            {
                name: "준비가",
                img: "./img/slime/03_metal.png",
                percent: 35
            },
            {
                name: "아직은",
                img: "./img/slime/04_liquid.png",
                percent: 60
            },
            {
                name: "미안 마지토모",
                img: "./img/slime/05_normal.png",
                percent: 85
            }
        ]
    }
};