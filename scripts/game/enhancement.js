// 확률형 강화 및 열화 연산
// scripts/game/enhancement.js

// 1. 다중 그룹 통합 데이터베이스 정의 (확장을 원하시면 여기에 새 그룹 데이터를 추가하세요)
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

// 2. 실시간 강화 시스템 런타임 상태 관리 객체
export const enhanceState = {
    currentGroup: "nezming", // 기본값은 요구사항대로 'nezming' 처리
    levels: {},        // 각 그룹의 현재 인덱스 저장 { nezming: 9, slime: 4 }
    bestRecords: {}    // 각 그룹의 최고 기록 인덱스 저장
};

/** 게임 기동 시 로컬스토리지에서 모든 그룹의 강화 상태 로드 */
export function initEnhancement() {
    Object.keys(ENHANCE_GROUPS).forEach(groupKey => {
        const maxIdx = ENHANCE_GROUPS[groupKey].items.length - 1; // 가장 낮은 등급 (끝 인덱스)
        
        // 현재 진행도 로드 (없으면 최하위 등급 지정)
        const savedLevel = localStorage.getItem(`enhance_cur_${groupKey}`);
        enhanceState.levels[groupKey] = savedLevel !== null ? parseInt(savedLevel) : maxIdx;

        // 최고 기록 로드
        const savedBest = localStorage.getItem(`enhance_best_${groupKey}`);
        enhanceState.bestRecords[groupKey] = savedBest !== null ? parseInt(savedBest) : maxIdx;
    });
}

/** 탭 선택 시 활성화된 그룹 변경 */
export function changeGroup(groupKey) {
    if (ENHANCE_GROUPS[groupKey]) {
        enhanceState.currentGroup = groupKey;
    }
}

/** 현재 활성화된 그룹의 강화 연산 수행 */
export function tryUpgrade() {
    const groupKey = enhanceState.currentGroup;
    const currentIdx = enhanceState.levels[groupKey];
    const groupData = ENHANCE_GROUPS[groupKey];
    
    // 이미 최고 등급(인덱스 0)이면 연산 중단
    if (currentIdx <= 0) return { success: false, isMax: true };

    const successChance = groupData.items[currentIdx].percent;
    const randomVal = Math.floor(Math.random() * 100);

    let isSuccess = false;
    if (randomVal <= successChance) {
        // 성공: 숫자가 작아지는 것이 강화 등급 상승 (9 -> 8 -> 7 -> ... -> 0)
        enhanceState.levels[groupKey] -= 1;
        isSuccess = true;
    } else {
        // 실패: 50% 확률로 다운그레이드 (하한선은 데이터 배열의 마지막 인덱스)
        const failRandom = Math.floor(Math.random() * 100);
        const maxIdx = groupData.items.length - 1;
        if (failRandom <= 50 && enhanceState.levels[groupKey] < maxIdx) {
            enhanceState.levels[groupKey] += 1;
        }
    }

    // 결과 디스크에 동기화
    const nextIdx = enhanceState.levels[groupKey];
    localStorage.setItem(`enhance_cur_${groupKey}`, nextIdx);

    // 최고 기록 갱신 여부 판정 (인덱스 숫자가 작을수록 고등급)
    if (nextIdx < enhanceState.bestRecords[groupKey]) {
        enhanceState.bestRecords[groupKey] = nextIdx;
        localStorage.setItem(`enhance_best_${groupKey}`, nextIdx);
    }

    return { success: isSuccess };
}

/** 현재 활성화된 그룹 진행도 완전 초기화 */
export function resetGroupProgress() {
    const groupKey = enhanceState.currentGroup;
    const maxIdx = ENHANCE_GROUPS[groupKey].items.length - 1;
    
    enhanceState.levels[groupKey] = maxIdx;
    localStorage.setItem(`enhance_cur_${groupKey}`, maxIdx);
}