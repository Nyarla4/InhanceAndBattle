// scripts/ui/views/modeView.js
import * as UI from '../uiElements.js';
import { sceneManager } from '../sceneManager.js';
import { socketClient } from '../../network/socketClient.js';
import { eventBus } from '../../core/eventBus.js';
import { renderStageList } from './stageSelectorView.js';
import { EVENTS } from '../../core/config.js';

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
        requestCreateRoom();
    });
    UI.joinRoomBtn.addEventListener('click', () => {
        const roomCode = UI.roomCodeInput.value.trim();
        if (!roomCode) {
            UI.roomCodeInput.focus();
            return;
        }
        requestJoinRoom(roomCode);
    });
    UI.multiRoomBackBtn.addEventListener('click', () => {
        sceneManager.showScreen(UI.modeSelectorScreen);
    });

    const roomCode = new URLSearchParams(location.search).get('room');
    if (roomCode) {
        sceneManager.showScreen(UI.multiRoomScreen);
        UI.roomCodeInput.value = roomCode;
        requestJoinRoom(roomCode);
    }
}

function requestCreateRoom() {
    requestLobbyAction(() => {
        socketClient.createRoom(socketClient.myNickname, getCurrentEnhanceLevel());
    });
}

function requestJoinRoom(roomCode) {
    requestLobbyAction(() => {
        socketClient.joinRoom(roomCode, socketClient.myNickname, getCurrentEnhanceLevel());
    });
}

function requestLobbyAction(action) {
    if (socketClient.isConnected) {
        action();
    } else {
        eventBus.once(EVENTS.SOCKET_CONNECTED, action);
        socketClient.connect();
    }
}

function getCurrentEnhanceLevel() {
    return Number(localStorage.getItem('enhance_cur_nezming')) || 0;
}
