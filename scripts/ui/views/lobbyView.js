// scripts/ui/views/lobbyView.js

import { eventBus } from '../../core/eventBus.js';
import { startBattle } from '../../game/battle.js';
import { socketClient } from '../../network/socketClient.js';
import { sceneManager } from '../sceneManager.js';
import * as UI from '../uiElements.js';

const SLOT_LABELS = {
    left: '좌측',
    right: '우측',
    spectator: '관전'
};

let currentLobby = null;
let hasRequestedLobbyReset = false;

export function initLobbyView() {
    observeLobbyScreenReturn();

    UI.moveLeftSlotBtn.addEventListener('click', () => socketClient.changeLobbySlot('left'));
    UI.moveRightSlotBtn.addEventListener('click', () => socketClient.changeLobbySlot('right'));
    UI.moveSpectatorSlotBtn.addEventListener('click', () => socketClient.changeLobbySlot('spectator'));

    UI.lobbyReadyBtn.addEventListener('click', () => {
        const me = getMe();
        if (!me || me.slot === 'spectator') return;
        socketClient.updateLobbyPlayer({ isReady: !me.isReady });
    });

    UI.lobbyNameChangeBtn.addEventListener('click', updateNickname);
    UI.lobbyNameInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') updateNickname();
    });

    UI.lobbyBackBtn.addEventListener('click', () => {
        socketClient.disconnect();
        currentLobby = null;
        sceneManager.showScreen(UI.multiRoomScreen);
    });

    UI.resultTitleBtn.addEventListener('click', () => {
        if (socketClient.isConnected) {
            socketClient.disconnect();
            currentLobby = null;
        }
    });

    UI.copyRoomCodeBtn.addEventListener('click', () => {
        window.navigator.clipboard.writeText(UI.lobbyRoomCodeDisplay.value);
    });

    UI.copyRoomAddressBtn.addEventListener('click', () => {
        alert("기능 미구현");
    });

    eventBus.on('LOBBY_ENTERED', ({ lobby }) => {
        currentLobby = lobby;
        UI.lobbyNameInput.value = socketClient.myNickname;
        renderLobby();
        sceneManager.showScreen(UI.multiLobbyScreen);
    });

    eventBus.on('LOBBY_SYNC', (lobby) => {
        currentLobby = lobby;
        if (!currentLobby.isStarted) {
            hasRequestedLobbyReset = false;
        }
        renderLobby();
    });

    eventBus.on('LOBBY_JOIN_FAILED', ({ reason }) => {
        alert(reason === 'ROOM_NOT_FOUND' ? '존재하지 않는 방 코드입니다.' : '방 진입에 실패했습니다.');
        UI.roomCodeInput.focus();
    });

    eventBus.on('LOBBY_ACTION_FAILED', ({ reason }) => {
        if (reason === 'SLOT_OCCUPIED') {
            alert('이미 다른 플레이어가 맡은 위치입니다.');
        }
    });

    eventBus.on('LOBBY_GAME_START', ({ role }) => {
        hasRequestedLobbyReset = false;
        console.log(`[로비] ${SLOT_LABELS[role] || '관전'} 역할로 게임을 시작합니다.`);
        sceneManager.showScreen(UI.stageScreen);
        startBattle({
            id: 'multi_battle',
            name: '멀티 대전',
            playerSide: role === 'left' ? 'left' : 'right',
            canPlayerSummon: role !== 'spectator',
            enemyBaseHp: 1000,
            enemies: [],
            isMulti: true
        });
    });
}

function observeLobbyScreenReturn() {
    if (!UI.multiLobbyScreen) return;

    const observer = new MutationObserver(() => {
        requestLobbyResetIfNeeded();
    });
    observer.observe(UI.multiLobbyScreen, {
        attributes: true,
        attributeFilter: ['class']
    });
}

function requestLobbyResetIfNeeded() {
    if (UI.multiLobbyScreen.classList.contains('hidden')) return;
    if (!currentLobby?.isStarted) return;
    if (hasRequestedLobbyReset) return;

    hasRequestedLobbyReset = true;
    socketClient.returnToLobby();
}

function updateNickname() {
    const nickname = UI.lobbyNameInput.value.trim();
    if (!nickname) {
        UI.lobbyNameInput.focus();
        return;
    }
    socketClient.updateLobbyPlayer({ nickname });
}

function renderLobby() {
    if (!currentLobby) return;

    const left = findSlotPlayer('left');
    const right = findSlotPlayer('right');
    const spectators = currentLobby.players.filter(player => player.slot === 'spectator');
    const me = getMe();

    UI.lobbyRoomCodeDisplay.value = currentLobby.roomCode || '----';
    UI.leftPlayerDisplay.value = formatPlayer(left);
    UI.rightPlayerDisplay.value = formatPlayer(right);
    UI.spectatorPlayerDisplay.value = spectators.length > 0
        ? spectators.map(player => player.nickname || player.id).join(', ')
        : '관전자 없음';
    UI.lobbyMyRoleDisplay.value = me ? SLOT_LABELS[me.slot] : '관전';

    UI.lobbyLogDisplay.value = [
        `우측: ${formatPlayer(right)}`,
        `좌측: ${formatPlayer(left)}`,
        `관전: ${UI.spectatorPlayerDisplay.value}`
    ].join('\n');

    UI.moveLeftSlotBtn.disabled = !!left && left.id !== socketClient.myPlayerId;
    UI.moveRightSlotBtn.disabled = !!right && right.id !== socketClient.myPlayerId;

    const isPlayableSlot = me?.slot === 'left' || me?.slot === 'right';
    UI.lobbyReadyBtn.disabled = !isPlayableSlot;
    UI.lobbyReadyBtn.textContent = !isPlayableSlot
        ? '관전 중'
        : me.isReady ? '준비 해제' : '준비';

    UI.lobbyCountdownDisplay.textContent = currentLobby.countdown ?? '-';
}

function findSlotPlayer(slot) {
    return currentLobby?.players.find(player => player.slot === slot) || null;
}

function getMe() {
    return currentLobby?.players.find(player => player.id === socketClient.myPlayerId) || null;
}

function formatPlayer(player) {
    if (!player) return '비어 있음';

    const readyLabel = player.slot === 'spectator'
        ? '관전'
        : player.isReady ? '준비' : '대기';
    const meLabel = player.id === socketClient.myPlayerId ? ' / 나' : '';
    return `${player.nickname || player.id} (${readyLabel}${meLabel})`;
}
