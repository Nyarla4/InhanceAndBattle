// playerState 메모리 객체 관리 및 localStorage 연동
// scripts/core/state.js

import { ENHANCE_GROUPS } from "./config.js";

// 전역 상태 관리 객체 (싱글톤)
export const enhanceState = {
    currentGroup: 'nezming',
    levels: {},        // 그룹별 현재 강화 단계 (인덱스)
    storage: []        // 공유 보관함
};

/** 초기화: 로컬스토리지에서 데이터를 불러옵니다. */
export function initEnhancement() {
    Object.keys(ENHANCE_GROUPS).forEach(key => {
        const savedLevel = localStorage.getItem(`enhance_cur_${key}`);
        enhanceState.levels[key] = savedLevel ? parseInt(savedLevel) : ENHANCE_GROUPS[key].items.length - 1;
    });

    const savedStorage = localStorage.getItem("enhance_storage");
    enhanceState.storage = savedStorage ? JSON.parse(savedStorage) : [];
}

/** 그룹 전환 */
export function changeGroup(groupKey) {
    if (ENHANCE_GROUPS[groupKey]) {
        enhanceState.currentGroup = groupKey;
    }
}

/** 현재 개체 창고 보관 (초기화) */
export function storeCurrentCreature(groupKey) {
    const currentIdx = enhanceState.levels[groupKey];
    const groupData = ENHANCE_GROUPS[groupKey];
    const item = groupData.items[currentIdx];

    const storageItem = {
        id: Date.now(), // 고유 ID 부여
        groupKey: groupKey,
        name: item.name,
        img: item.img,
        levelIdx: currentIdx
    };

    enhanceState.storage.push(storageItem);
    resetGroupProgress(groupKey); // 강화실 초기화
    
    localStorage.setItem("enhance_storage", JSON.stringify(enhanceState.storage));
    return { success: true, message: `[${item.name}] 보관 완료!` };
}

/** 창고에서 꺼내기 (강화실로 복귀) */
export function withdrawCreature(storageId) {
    const findIdx = enhanceState.storage.findIndex(item => item.id === storageId);
    if (findIdx === -1) return { success: false, message: "아이템 없음" };

    const item = enhanceState.storage[findIdx];
    const groupKey = item.groupKey;
    const maxIdx = ENHANCE_GROUPS[groupKey].items.length - 1;
    
    if (enhanceState.levels[groupKey] !== maxIdx) {
        return { 
            success: false, 
            message: "현재 강화실에 이미 강화 중인 개체가 있습니다. 먼저 보관하거나 복귀 시켜주세요." 
        };
    }

    // 그룹 강제 전환
    enhanceState.currentGroup = groupKey;

    // 1. 핵심 구조(State) 복구: 강화실 현재 단계를 저장된 levelIdx로 변경
    enhanceState.levels[groupKey] = item.levelIdx;
    localStorage.setItem(`enhance_cur_${groupKey}`, item.levelIdx);

    // 2. 보관함(창고) 배열에서 제거 및 로컬스토리지 저장
    enhanceState.storage.splice(findIdx, 1);
    localStorage.setItem("enhance_storage", JSON.stringify(enhanceState.storage));
    
    return { success: true, message: "보관소에서 꺼냈습니다." };
}

/** 인게임 소환 시 영구 소모 함수 */
export function consumeStoredCreature(storageId) {
    const findIdx = enhanceState.storage.findIndex(item => item.id === storageId);
    if (findIdx === -1) return false;

    // 배열에서 완전히 삭제
    enhanceState.storage.splice(findIdx, 1);
    
    // 즉시 동기화
    localStorage.setItem("enhance_storage", JSON.stringify(enhanceState.storage));
    return true;
}

/** 강화실 초기화 */
export function resetGroupProgress(groupKey) {
    const maxIdx = ENHANCE_GROUPS[groupKey].items.length - 1;
    enhanceState.levels[groupKey] = maxIdx;
    localStorage.setItem(`enhance_cur_${groupKey}`, maxIdx);
}

/** 강화 등급 하락 (페널티 처리) */
export function downgradeGroupProgress(groupKey, maxIdx) {
    const currentIdx = enhanceState.levels[groupKey];
    
    // 이미 최하위 등급(기본 상태)이라면 더 하락하지 않음
    if (currentIdx >= maxIdx) {
        return false; 
    }

    // 인덱스 증가 = 등급 하락
    enhanceState.levels[groupKey] += 1;
    localStorage.setItem(`enhance_cur_${groupKey}`, enhanceState.levels[groupKey]);
    return true;
}

// [구조: 데이터 저장소] 외부에서 직접 수정할 수 없도록 내부(캡슐화) 변수로 관리
let currentGameState = null;

/** [구조: 세션 생성] 전투 시작 시 새로운 세션 데이터 구조 구축 */
export function createBattleSession(stageData, fieldDimensions = { width: 800, playerBaseWidth: 100, enemyBaseWidth: 100 }) {
    const playerSide = stageData.playerSide === 'left' ? 'left' : 'right';
    const isPlayerLeft = playerSide === 'left';

    currentGameState = {
        playerHp: 1000,
        playerMaxHp: 1000,
        enemyHp: stageData.enemyBaseHp || 1000,
        playerCreatures: [],
        enemyCreatures: [],
        stageData: stageData,
        isGameOver: false,
        canPlayerSummon: stageData.canPlayerSummon !== false,
        playerSide,
        playerDirection: isPlayerLeft ? 1 : -1,
        enemyDirection: isPlayerLeft ? -1 : 1,
        playerSpawnX: isPlayerLeft ? fieldDimensions.enemyBaseWidth : fieldDimensions.width - fieldDimensions.playerBaseWidth,
        enemySpawnX: isPlayerLeft ? fieldDimensions.width - fieldDimensions.playerBaseWidth : fieldDimensions.enemyBaseWidth,
        fieldWidth: fieldDimensions.width,
        playerBaseWidth: fieldDimensions.playerBaseWidth,
        enemyBaseWidth: fieldDimensions.enemyBaseWidth
    };
    return currentGameState;
}

/** [구조: 데이터 제공] 안전한 조회를 위한 Getter */
export function getGameState() {
    return currentGameState;
}

/** [구조: 세션 종료] 전투 종료 시 메모리 해제 및 구조 초기화 */
export function clearBattleSession() {
    currentGameState = null;
}
