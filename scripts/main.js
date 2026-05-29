// 클라이언트 전체 엔트리 포인트 (초기화 및 앱 구동)
// scripts/main.js

import * as UI from './ui/uiElements.js';
import { sceneManager } from './ui/sceneManager.js';
import { initModeView } from './ui/views/modeView.js';
import { initEnhancement } from './core/state.js';
import { initEnhanceView } from './ui/views/enhanceView.js';

/** 게임 전체 시스템 초기화 및 시동 */
function initGame() {
    console.log("[시스템] 구동 완료.");

    // 저장소 세팅 로드
    initEnhancement();

    // 1. 하위 뷰 모듈 초기화 (솔로/멀티 모드 버튼 이벤트 바인딩)
    initModeView();

    /* =================================================================
       2. 타이틀 화면 메인 버튼 이벤트 리스너
    ================================================================= */

    // [출전하기] 버튼 클릭 -> 모드 선택 화면으로 이동
    UI.stageBtn.addEventListener('click', () => {
        sceneManager.showScreen(UI.modeSelectorScreen);
    });

    // [네즈밍 강화실] 버튼 클릭 -> 강화 화면으로 이동
    UI.upgradeBtn.addEventListener('click', () => {
        sceneManager.showScreen(UI.upgradeScreen);
        initEnhanceView(); // 🔥 매번 강화실 진입 시 활성화된 그룹(기본값 nezming) 상태로 화면 갱신
    });
    UI.dictionaryBtn.addEventListener('click', () => {
        sceneManager.showScreen(UI.dictionaryScreen);
    });
    // [설정] 버튼 클릭 -> 설정 모달 팝업 열기
    UI.settingBtn.addEventListener('click', () => {
        UI.settingsModal.classList.remove('hidden');
    });

    // [설정 닫기] 버튼 클릭 -> 설정 모달 팝업 닫기
    UI.closeSettingsBtn.addEventListener('click', () => {
        UI.settingsModal.classList.add('hidden');
    });


    /* =================================================================
       3. 각 화면별 뒤로가기(백버튼) 이벤트 리스너
    ================================================================= */

    // 모드 선택 창 -> 타이틀 화면으로 돌아가기
    UI.modeBackBtn.addEventListener('click', () => {
        sceneManager.showScreen(UI.titleScreen);
    });

    // 강화실 화면 -> 타이틀 화면으로 돌아가기
    UI.backBtn.addEventListener('click', () => {
        sceneManager.showScreen(UI.titleScreen);
    });

    // 스테이지 선택 창 -> 모드 선택 화면으로 돌아가기
    if (UI.stageBackBtn) {
        UI.stageBackBtn.addEventListener('click', () => {
            sceneManager.showScreen(UI.modeSelectorScreen);
        });
    }

    if (UI.dictionaryBackBtn) {
        UI.dictionaryBackBtn.addEventListener('click', () => {
            sceneManager.showScreen(UI.titleScreen);
        });
    }

    /* =================================================================
       4. 초기 진입 화면 설정
    ================================================================= */
    // 첫 실행 시 모든 화면을 숨기고 '타이틀 화면'만 기본으로 노출합니다.
    sceneManager.showScreen(UI.titleScreen);
}

// 브라우저의 DOM 구조가 완전히 로드되면 게임 초기화 프로세스 시작
window.addEventListener('DOMContentLoaded', initGame);