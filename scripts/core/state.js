// playerState 메모리 객체 관리 및 localStorage 연동
// scripts/core/state.js

import { ENHANCE_GROUPS } from "./config.js";

// 전역 상태 관리 객체 (싱글톤)
export const enhanceState = {
    currentGroup: 'nezming',
    levels: {},        // 그룹별 현재 강화 단계 (인덱스)
    bestRecords: {},   // 그룹별 최고 기록
    storage: []        // 공유 보관함
};

/** 초기화: 로컬스토리지에서 데이터를 불러옵니다. */
export function initEnhancement() {
    Object.keys(ENHANCE_GROUPS).forEach(key => {
        const savedLevel = localStorage.getItem(`enhance_cur_${key}`);
        enhanceState.levels[key] = savedLevel ? parseInt(savedLevel) : ENHANCE_GROUPS[key].items.length - 1;
        
        const savedBest = localStorage.getItem(`enhance_best_${key}`);
        enhanceState.bestRecords[key] = savedBest ? parseInt(savedBest) : ENHANCE_GROUPS[key].items.length - 1;
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
        img: item.img
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
    
    // 현재 강화실이 최고 등급이 아니면 복귀 불가 처리 등 로직 추가 가능
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