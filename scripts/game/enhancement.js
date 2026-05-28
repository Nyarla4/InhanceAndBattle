// 확률형 강화 및 열화 연산
// scripts/game/enhancement.js

import { enhanceState } from "../core/state";

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