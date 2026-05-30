// scripts/ui/views/modeView.js
import * as UI from '../uiElements.js';
import { sceneManager } from '../sceneManager.js';
import { socketClient } from '../../network/socketClient.js';
import { eventBus } from '../../core/eventBus.js';
import { renderStageList } from './stageSelectorView.js';

export function initModeView() {
    // 솔로 모드 선택 시 -> 스테이지 선택창 오픈
    UI.soloModeBtn.addEventListener('click', () => {
        sceneManager.showScreen(UI.stageSelectorScreen);
        renderStageList();
    });

    // 멀티 대전 모드 선택 시 -> 방 생성/진입 화면 오픈
    UI.multiModeBtn.addEventListener('click', () => {
        sceneManager.showScreen(UI.multiRoomScreen);
    });

    UI.createRoomBtn.addEventListener('click', () => {
        requestMultiMatch();
    });

    UI.joinRoomBtn.addEventListener('click', () => {
        const roomCode = UI.roomCodeInput.value.trim();
        if (!roomCode) {
            UI.roomCodeInput.focus();
            return;
        }
        requestMultiMatch(roomCode);
    });

    UI.multiRoomBackBtn.addEventListener('click', () => {
        sceneManager.showScreen(UI.modeSelectorScreen);
    });
}

function requestMultiMatch(roomCode = '') {
    // 임시 플레이어 정보 및 강화 수치 로컬스토리지 등에서 파싱하여 전달 예정
    const tempPlayerId = `User_${Math.random().toString(36).substr(2, 4)}`;
    const currentEnhanceLevel = Number(localStorage.getItem('nezming_level')) || 0;

    if (roomCode) {
        console.log(`[네트워크] 방 코드 진입 요청: ${roomCode}`);
    }

    const sendMatchRequest = () => {
        socketClient.requestMatch(tempPlayerId, currentEnhanceLevel, roomCode);
    };

    if (socketClient.isConnected) {
        sendMatchRequest();
    } else {
        eventBus.once('SOCKET_CONNECTED', sendMatchRequest);
        socketClient.connect();
    }
}
