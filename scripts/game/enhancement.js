// 확률형 강화 및 열화 연산
// scripts/game/enhancement.js
import { ENHANCE_GROUPS } from "../core/config.js";
import { enhanceState } from "../core/state.js";

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