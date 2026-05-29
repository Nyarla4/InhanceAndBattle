// scripts/ui/views/modeView.js
import * as UI from '../uiElements.js';
import { sceneManager } from '../sceneManager.js';
import { socketClient } from '../../network/socketClient.js';
import { renderStageList } from './stageSelectorView.js';

export function initModeView() {
    // 솔로 모드 선택 시 -> 스테이지 선택창 오픈
    UI.soloModeBtn.addEventListener('click', () => {
        sceneManager.showScreen(UI.stageSelectorScreen);
        renderStageList();
    });

    // 멀티 대전 모드 선택 시 -> 소켓 서버 접속 연동 시도
    UI.multiModeBtn.addEventListener('click', () => {
        // 임시 플레이어 정보 및 강화 수치 로컬스토리지 등에서 파싱하여 전달 예정
        const tempPlayerId = `User_${Math.random().toString(36).substr(2, 4)}`;
        const currentEnhanceLevel = Number(localStorage.getItem('nezming_level')) || 0;

        socketClient.connect();
        socketClient.requestMatch(tempPlayerId, currentEnhanceLevel);
    });
}