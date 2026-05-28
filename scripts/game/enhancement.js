// 확률형 강화 및 열화 연산
// scripts/game/enhancement.js

// 1. 강화 그룹 데이터 정의
export const ENHANCE_GROUPS = {
    nezming: {
        name: "네즈밍",
        items: [
            { name: "미도미도 마요", img: "./img/mayo/01_마요.png", percent: 0 },
            { name: "바오밥나무 네즈밍", img: "./img/mayo/02_바오밥나무.png", percent: 10 },
            { name: "볼드의 대형 해머 네즈밍", img: "./img/mayo/03_볼드의대형해머.png", percent: 20 },
            { name: "처형자의 대검 네즈밍", img: "./img/mayo/04_처형자의대검.png", percent: 30 },
            { name: "클레이모어 네즈밍", img: "./img/mayo/05_클레이모어.png", percent: 40 },
            { name: "바스타드 소드 네즈밍", img: "./img/mayo/06_바스타드소드.png", percent: 50 },
            { name: "야구빠따 네즈밍", img: "./img/mayo/07_야구빠따.png", percent: 60 },
            { name: "커터칼 네즈밍", img: "./img/mayo/08_커터칼.png", percent: 70 },
            { name: "눈썹칼 네즈밍", img: "./img/mayo/09_눈썹칼.png", percent: 80 },
            { name: "이쑤시개 네즈밍", img: "./img/mayo/10_이쑤시개.png", percent: 90 }
        ]
    },
    majitomo: {
        name: "마지토모",
        items: [
            { name: "마지나이 쿠로카", img: "./img/slime/01_gold.png", percent: 0 },
            { name: "되어있지않아", img: "./img/slime/02_dia.png", percent: 15 },
            { name: "준비가", img: "./img/slime/03_metal.png", percent: 35 },
            { name: "아직은", img: "./img/slime/04_liquid.png", percent: 60 },
            { name: "미안 마지토모", img: "./img/slime/05_normal.png", percent: 85 }
        ]
    }
};

// 2. 전역 상태 관리 객체 (싱글톤)
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

/** 강화 시도 로직 */
export function tryUpgrade(groupKey) {
    const currentIdx = enhanceState.levels[groupKey];
    if (currentIdx === 0) return { success: false, message: "이미 최고 등급입니다!" };

    const successChance = ENHANCE_GROUPS[groupKey].items[currentIdx].percent;
    const isSuccess = Math.random() * 100 <= successChance;

    if (isSuccess) {
        enhanceState.levels[groupKey] -= 1;
        const newIdx = enhanceState.levels[groupKey];
        
        // 최고 기록 갱신 (인덱스가 작을수록 높은 등급)
        if (newIdx < enhanceState.bestRecords[groupKey]) {
            enhanceState.bestRecords[groupKey] = newIdx;
            localStorage.setItem(`enhance_best_${groupKey}`, newIdx);
        }
        
        localStorage.setItem(`enhance_cur_${groupKey}`, newIdx);
        return { success: true, message: "강화 성공!" };
    } else {
        return { success: false, message: "강화 실패!" };
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

/** 강화실 초기화 */
export function resetGroupProgress(groupKey) {
    const maxIdx = ENHANCE_GROUPS[groupKey].items.length - 1;
    enhanceState.levels[groupKey] = maxIdx;
    localStorage.setItem(`enhance_cur_${groupKey}`, maxIdx);
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

/** 🔥 [신규 추가] 인게임 소환 시 영구 소모 함수 */
export function consumeStoredCreature(storageId) {
    const findIdx = enhanceState.storage.findIndex(item => item.id === storageId);
    if (findIdx === -1) return false;

    // 배열에서 완전히 삭제
    enhanceState.storage.splice(findIdx, 1);
    
    // 즉시 동기화
    localStorage.setItem("enhance_storage", JSON.stringify(enhanceState.storage));
    return true;
}