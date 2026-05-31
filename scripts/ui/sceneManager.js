// 화면 전환 제어
// scripts/ui/sceneManager.js
import * as UI from './uiElements.js';
import { eventBus } from '../core/eventBus.js';
import { EVENTS } from '../core/config.js';

class SceneManager {
    constructor() {
        this.initNetworkEvents();
    }

    /** 모든 화면을 숨기고 타겟 화면 하나만 활성화 */
    showScreen(targetScreen) {
        UI.screens.forEach(screen => {
            screen.classList.add('hidden');
        });
        targetScreen.classList.remove('hidden');
    }

    /** 소켓 이벤트 버스를 구독하여 네트워크 로딩 레이어 제어 */
    initNetworkEvents() {
        // 서버 연결 시작할 때 로딩 모달 팝업 오픈
        eventBus.on(EVENTS.SOCKET_CONNECTING, () => {
            UI.networkLoadingModal.classList.remove('hidden');
        });

        // 연결 완료되면 로딩창 닫기
        eventBus.on(EVENTS.SOCKET_CONNECTED, () => {
            UI.networkLoadingModal.classList.add('hidden');
        });

        // 네트워크 에러나 끊김 시 로딩 감춤
        eventBus.on('SOCKET_DISCONNECTED', () => UI.networkLoadingModal.classList.add('hidden'));
        eventBus.on('SOCKET_ERROR', () => UI.networkLoadingModal.classList.add('hidden'));
    }
}

export const sceneManager = new SceneManager();
