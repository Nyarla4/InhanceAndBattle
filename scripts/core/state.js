// localStorage 연동
// scripts/core/state.js

import { ENHANCE_GROUPS } from "./config.js";

// 강화 상태(싱글톤 처리)
export const enhanceState = {
    currentGroup: 'nezming',
    levels: {},        // 그룹별 현재 강화 단계 (인덱스)
    storage: []        // 공유 보관함
};

/** 초기화: localStorage 기반 기존 데이터 확인 및 불러오기 */
export function initEnhancement() {
    Object.keys(ENHANCE_GROUPS).forEach(key => {// 각 그룹별 현재 강화단계 확인
        const savedLevel = localStorage.getItem(`enhance_cur_${key}`);
        // 저장된 강화단계가 없는 경우 가장 낮은 단계로 처리
        enhanceState.levels[key] = savedLevel ? parseInt(savedLevel) : ENHANCE_GROUPS[key].items.length - 1;
    });

    // 보관함 불러오기
    const savedStorage = localStorage.getItem("enhance_storage");
    enhanceState.storage = savedStorage ? JSON.parse(savedStorage) : [];
}

/** 그룹 전환 */
export function changeGroup(groupKey) {
    if (ENHANCE_GROUPS[groupKey]) {// 해당 그룹이 있다면
        enhanceState.currentGroup = groupKey;
    }
}

/** 현재 개체 창고 보관 (초기화) */
export function storeCurrentCreature(groupKey) {
    const currentIdx = enhanceState.levels[groupKey];
    const groupData = ENHANCE_GROUPS[groupKey];
    const item = groupData.items[currentIdx];

    const storageItem = {
        id: Date.now(), // 고유 ID 부여(보관-꺼내기-보관 하면 ID 달라짐)
        groupKey: groupKey, // 해당 개체의 그룹
        name: item.name, // 개체 이름
        img: item.img, // 개체 이미지
        levelIdx: currentIdx // 개체 강화 단계
    };

    enhanceState.storage.push(storageItem); // 보관함에 개체 추가
    resetGroupProgress(groupKey); // 강화실 초기화
    
    localStorage.setItem("enhance_storage", JSON.stringify(enhanceState.storage));
    return { success: true, message: `[${item.name}] 보관 완료!` };
}

/** 창고에서 꺼내기 (강화실로 복귀) */
export function withdrawCreature(storageId) { // 보관할때 부여한 고유ID로 조회
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
export function consumeStoredCreature(storageId) { // 해당 고유 ID의 개체를 보관함에서 제거
    const findIdx = enhanceState.storage.findIndex(item => item.id === storageId);
    if (findIdx === -1) return false; // 해당 ID가 없으면 return

    // 배열에서 삭제
    enhanceState.storage.splice(findIdx, 1);
    
    // localStorage 처리
    localStorage.setItem("enhance_storage", JSON.stringify(enhanceState.storage));
    return true;
}

/** 강화실 초기화 */
export function resetGroupProgress(groupKey) {
    const maxIdx = ENHANCE_GROUPS[groupKey].items.length - 1;
    enhanceState.levels[groupKey] = maxIdx; // 가장 낮은 단계로 처리
    localStorage.setItem(`enhance_cur_${groupKey}`, maxIdx);
}

/** 강화 등급 하락 */
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

// 외부에서 직접 수정할 수 없도록 내부(캡슐화) 변수로 관리
let currentGameState = null;

/** 전투 시작 시 새로운 세션 데이터 구조 생성 */
export function createBattleSession(stageData, fieldDimensions = { width: 800, playerBaseWidth: 100, enemyBaseWidth: 100 }) {
    const playerSide = stageData.playerSide === 'left' ? 'left' : 'right';
    const isPlayerLeft = playerSide === 'left';

    currentGameState = {
        playerHp: personalEnhanceState.playerMaxHp,
        playerMaxHp: personalEnhanceState.playerMaxHp,
        enemyHp: stageData.enemyBaseHp || 1000,
        playerCreatures: [],
        enemyCreatures: [],
        stageData: stageData,
        isGameOver: false,
        canPlayerSummon: stageData.canPlayerSummon !== false,
        playerSide: playerSide,
        playerDirection: isPlayerLeft ? 1 : -1,
        enemyDirection: isPlayerLeft ? -1 : 1,
        playerSpawnX: isPlayerLeft ? fieldDimensions.enemyBaseWidth : fieldDimensions.width - fieldDimensions.playerBaseWidth,
        enemySpawnX: isPlayerLeft ? fieldDimensions.width - fieldDimensions.playerBaseWidth : fieldDimensions.enemyBaseWidth,
        fieldWidth: fieldDimensions.width,
        playerBaseWidth: fieldDimensions.playerBaseWidth,
        enemyBaseWidth: fieldDimensions.enemyBaseWidth,
        isMulti: !!stageData.isMulti
    };
    return currentGameState;
}

/** 게임 상태 Getter */
export function getGameState() {
    return currentGameState;
}

/** 플레이어 체력 Setter */
export function setPlayerHp(value) {
    currentGameState.playerHp = value;
}

/** 상대 체력 Setter */
export function setEnemyHp(value) {
    currentGameState.enemyHp = value;
}

/** 플레이어 개체 Setter */
export function setPlayerCreature(value) {
    currentGameState.playerCreatures = value;
}

/** 상대 개체 Setter */
export function setEnemyCreature(value) {
    currentGameState.enemyCreatures = value;
}

/** 전투 종료 시 메모리 해제 및 구조 초기화 */
export function clearBattleSession() {
    currentGameState = null;
}

// 개인 강화 상태(싱글톤 처리)
export const personalEnhanceState = {
    gold: 0, // 재화
    playerMaxHp: 1000 // 최대 체력
};

/** 초기화: localStorage 기반 기존 데이터 확인 및 불러오기 */
export function initPersonalEnhancement() {
    // 재화 불러오기
    const savedGold = localStorage.getItem("gold");
    personalEnhanceState.gold = savedGold ? parseInt(savedGold) : 0;

    // 최대 체력 불러오기
    const savedMaxhp = localStorage.getItem("playerMaxHp");
    personalEnhanceState.playerMaxHp = savedMaxhp ? parseInt(savedMaxhp) : 1000;
}

/** 재화 획득 */
export function getGold(value) {
    personalEnhanceState.gold += value;
    localStorage.setItem("gold", personalEnhanceState.gold);
}

/** 재화 소모 */
export function useGold(value) {
    if(personalEnhanceState.gold < value)
        return false;
    personalEnhanceState.gold -= value;
    localStorage.setItem("gold", personalEnhanceState.gold);
    return true;
}

/** 최대 체력 증가 */
export function increaseMaxHp(value) {
    personalEnhanceState.playerMaxHp += value;
    localStorage.setItem("playerMaxHp", personalEnhanceState.playerMaxHp);
}