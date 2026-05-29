// scripts/game/battle.js

import { createBattleSession, getGameState } from "../core/state.js";
import { initForgeView, renderForgeUI } from "../ui/views/enhanceView.js";

// 내부 타이머 및 큐 상태 (구조적 캡슐화)
let isBattleRunning = false;
let currentStage = null;

/** 전투 초기화 및 시작 인터페이스 (스테이지 선택 시 호출됨) */
export function startBattle(stageData) {
    // 1. [구조] 뷰 레이어의 치수 수집 및 세션 생성
    const fieldEl = document.getElementById('field') || { clientWidth: 800 };
    const pBaseEl = document.getElementById('playerBase') || { clientWidth: 100 };
    const eBaseEl = document.getElementById('enemyBase') || { clientWidth: 100 };
    
    const dimensions = {
        width: fieldEl.clientWidth,
        playerBaseWidth: pBaseEl.clientWidth,
        enemyBaseWidth: eBaseEl.clientWidth
    };

    currentStage = createBattleSession(stageData, dimensions);

    // 2. [흐름] 우측 30% 영역(강화/보관함) 뷰 초기화 및 렌더링
    // enhanceView.js에 정의된 initForgeView를 호출하여 state.js의 storage 데이터를 화면에 그림
    initForgeView();
    renderForgeUI();

    // 3. [흐름] 전투 루프 시작 (현재는 빈 루프)
    isBattleRunning = true;
    startBattleLoop();
}

/** 메인 전투 루프 */
function startBattleLoop() {
    function loop(now) {
        if (!isBattleRunning) return;
        
        // TODO: updateCreatures 등 전투 로직 흐름 추가 예정

        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}

export function stopBattleLoop() {
    isBattleRunning = false;
}