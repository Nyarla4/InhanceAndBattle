// 클라이언트 전체 엔트리 포인트 (초기화 및 앱 구동)
// scripts/main.js

import * as UI from './ui/uiElements.js';
import { sceneManager } from './ui/sceneManager.js';
import { initModeView } from './ui/views/modeView.js';
import { initLobbyView } from './ui/views/lobbyView.js';
import { initEnhancement, initPersonalEnhancement } from './core/state.js';
import { initBattleStorageListener, initEnhanceView } from './ui/views/enhanceView.js';
import { initSummonListener } from './game/summon.js';

/** 게임 전체 시스템 초기화 및 시동 */
function initGame() {
    console.log("[시스템] 구동 완료.");

    // localStorage 기반 로드
    initEnhancement();
    initPersonalEnhancement();

    // 1. 하위 뷰 모듈 초기화 (솔로/멀티 모드 버튼 이벤트 바인딩)
    initModeView();
    initLobbyView();

    // 리스너 등록
    initSummonListener();
    initBattleStorageListener();
    
    // [출전하기] 버튼 클릭 -> 모드 선택 화면으로 이동
    setButtonToScreen(UI.stageBtn, UI.modeSelectorScreen);

    // [강화실] 버튼 클릭 -> 강화 화면으로 이동
    setButtonToScreen(UI.upgradeBtn, UI.upgradeScreen);
    UI.upgradeBtn.addEventListener('click', () => {
        initEnhanceView(); // 강화실 진입 시 활성화된 그룹(기본값 nezming) 상태로 화면 갱신
    });

    // 도감 화면 이동
    setButtonToScreen(UI.dictionaryBtn, UI.dictionaryScreen);

    // [설정] 버튼 클릭 -> 설정 모달 팝업 열기
    UI.settingBtn.addEventListener('click', () => {
        UI.settingsModal.classList.remove('hidden');
    });

    // [설정 닫기] 버튼 클릭 -> 설정 모달 팝업 닫기
    UI.closeSettingsBtn.addEventListener('click', () => {
        UI.settingsModal.classList.add('hidden');
    });

    // 모드 선택 창 -> 타이틀 화면으로 돌아가기
    setButtonToScreen(UI.modeBackBtn, UI.titleScreen);

    // 강화실 화면 -> 타이틀 화면으로 돌아가기
    setButtonToScreen(UI.backBtn, UI.titleScreen);

    // 스테이지 선택 창 -> 모드 선택 화면으로 돌아가기
    setButtonToScreen(UI.stageBackBtn, UI.modeSelectorScreen);

    // 도감 -> 타이틀
    setButtonToScreen(UI.dictionaryBackBtn, UI.titleScreen);

    // 전투 종료 -> 타이틀
    setButtonToScreen(UI.resultTitleBtn, UI.titleScreen);

    // 타이틀 스크린만 보이도록 초기화
    sceneManager.showScreen(UI.titleScreen);
}

// 버튼으로 이동할 화면 등록 처리
function setButtonToScreen(btn, screen) {
    if (btn) { // 해당 버튼이 있을 경우
        btn.addEventListener('click', () => {
            sceneManager.showScreen(screen);
        });
    }
}

// 브라우저의 DOM 구조가 완전히 로드되면 게임 초기화 프로세스 시작
window.addEventListener('DOMContentLoaded', initGame);
