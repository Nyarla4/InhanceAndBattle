// WSS 연결, 자동 재연결(지수 백오프), 핑퐁 처리
// scripts/network/socketClient.js

import { EVENTS } from '../core/config.js';
import { eventBus } from '../core/eventBus.js';

class SocketClient {
    constructor() {
        // 현재 브라우저의 접속 호스트를 감지하여 로컬/배포용 주소를 자동 분기합니다.
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        // 💡 Render 배포 주소 반영 (HTTPS 환경이므로 반드시 WSS 프로토콜 사용)
        this.serverUrl = isLocal ? 'ws://localhost:3000' : 'wss://inhanceandbattle.onrender.com';
        this.socket = null;
        this.isConnected = false;
        this.myPlayerId = localStorage.getItem('battle_player_id') || `User_${crypto.randomUUID().slice(0, 8)}`;
        this.myNickname = localStorage.getItem('battle_player_name') || this.myPlayerId;
        localStorage.setItem('battle_player_id', this.myPlayerId);
    }

    /** 웹소켓 서버 연결 시작 */
    connect() {
        // 이미 연결되어 있거나 연결 중인 경우 중복 실행 방지
        if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
            return;
        }

        console.log(`[네트워크] 서버 연결 시도 중: ${this.serverUrl}`);
        
        // UI 모듈에게 "연결 로딩 바"를 띄우라고 알림 (Render 휴면 상태 감안)
        eventBus.emit(EVENTS.SOCKET_CONNECTING);

        this.socket = new WebSocket(this.serverUrl);

        // ① 소켓 연결 성공 시
        this.socket.onopen = () => {
            this.isConnected = true;
            console.log('[네트워크] 소켓 서버와 연결이 수립되었습니다.');
            eventBus.emit(EVENTS.SOCKET_CONNECTED);
        };

        // ② 서버로부터 메시지 수신 시
        this.socket.onmessage = (event) => {
            try {
                const packet = JSON.parse(event.data);
                this.handlePacket(packet);
            } catch (error) {
                console.error('[네트워크] 수신 패킷 파싱 에러:', error);
            }
        };

        // ③ 소켓 연결이 종료되었을 때
        this.socket.onclose = () => {
            this.isConnected = false;
            console.log('[네트워크] 서버와의 연결이 끊어졌습니다.');
            eventBus.emit('SOCKET_DISCONNECTED');
        };

        // ④ 에러 발생 시
        this.socket.onerror = (error) => {
            console.error('[네트워크] 소켓 에러:', error);
            eventBus.emit('SOCKET_ERROR', error);
        };
    }

    /** [공통] 서버로 데이터(JSON 문자열)를 발송하는 헬퍼 함수 */
    sendPacket(type, data = {}) {
        if (!this.isConnected || !this.socket) {
            console.warn('[네트워크] 서버에 연결되지 않아 패킷 발송을 실패했습니다.');
            return;
        }
        const packet = { type, ...data };
        this.socket.send(JSON.stringify(packet));
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.isConnected = false;
    }

    /* =================================================================
       [클라이언트 -> 서버] 이벤트 발송 메서드 인터페이스
    ================================================================= */

    createRoom(playerName, enhanceLevel) {
        this.setNickname(playerName);
        this.sendPacket(EVENTS.LOBBY_CREATED, {
            playerId: this.myPlayerId,
            nickname: this.myNickname,
            enhanceLevel
        });
    }

    joinRoom(roomCode, playerName, enhanceLevel) {
        this.setNickname(playerName);
        this.sendPacket(EVENTS.LOBBY_JOINED, {
            roomCode,
            playerId: this.myPlayerId,
            nickname: this.myNickname,
            enhanceLevel: enhanceLevel
        });
    }

    changeLobbySlot(slot) {
        this.sendPacket('CHANGE_LOBBY_SLOT', { slot });
    }

    updateLobbyPlayer(data = {}) {
        if (typeof data.nickname === 'string') {
            this.setNickname(data.nickname);
        }
        this.sendPacket('UPDATE_LOBBY_PLAYER', data);
    }

    returnToLobby() {
        this.sendPacket('RETURN_TO_LOBBY');
    }

    setNickname(nickname) {
        const nextName = String(nickname || '').trim();
        if (!nextName) return;

        this.myNickname = nextName.slice(0, 12);
        localStorage.setItem('battle_player_name', this.myNickname);
    }

    /** 내 유닛 소환 이벤트 상대방에게 동기화 요청 */
    sendSpawnCreature(creatureId, level, syncId) {
        this.sendPacket(EVENTS.C2S_SUMMON, { creatureId, level, syncId });
    }

    /** 상대방 타격(데미지 판정) 동기화 요청 */
    sendDamage(targetId, damage) {
        this.sendPacket(EVENTS.C2S_DAMAGE, { targetId, damage });
    }

    /** 상대방 기지 타격(데미지 판정) 동기화 요청 */
    sendBaseDamage(damage) {
        this.sendPacket(EVENTS.C2S_BASE_DAMAGE, { damage });
    }


    /* =================================================================
       [서버 -> 클라이언트] 수신 패킷 수신 및 흐름 제어 (EventBus 전송)
    ================================================================= */
    handlePacket(packet) {
        switch (packet.type) {
            case EVENTS.LOBBY_CREATED:
            case EVENTS.LOBBY_JOINED:
                eventBus.emit('LOBBY_ENTERED', {
                    roomCode: packet.roomCode,
                    role: packet.role,
                    lobby: packet.lobby
                });
                break;

            case 'ROOM_JOIN_FAILED':
                eventBus.emit('LOBBY_JOIN_FAILED', {
                    roomCode: packet.roomCode,
                    reason: packet.reason
                });
                break;

            case 'LOBBY_SYNC':
                eventBus.emit('LOBBY_SYNC', packet.lobby);
                break;

            case 'LOBBY_ACTION_FAILED':
                eventBus.emit('LOBBY_ACTION_FAILED', {
                    reason: packet.reason,
                    slot: packet.slot
                });
                break;

            case 'LOBBY_GAME_START':
                eventBus.emit('LOBBY_GAME_START', {
                    roomCode: packet.roomCode,
                    role: packet.role
                });
                break;

            case EVENTS.S2C_SUMMON:
                console.log('[네트워크] 상대방이 유닛을 소환했습니다.');
                // game/battle.js 또는 ui/views/gameView.js 등에서 구독하여 필드에 생성
                eventBus.emit(EVENTS.RES_SUMMON, {
                    creatureId: packet.creatureId,
                    level: packet.level,
                    syncId: packet.syncId
                });
                break;

            case EVENTS.S2C_BASE_DAMAGE:
                console.log('[네트워크] 내 기지가 데미지를 입었습니다.');
                // 내 체력 차감 로직 연동
                eventBus.emit(EVENTS.RES_BASE_DAMAGE, { damage: packet.damage });
                break;
            case EVENTS.S2C_DAMAGE:
                console.log(`[네트워크] 내 ${packet.targetId}가 데미지를 입었습니다.`);
                // 내 개체 체력 차감 로직 연동
                eventBus.emit(EVENTS.RES_DAMAGE, { targetId:packet.targetId, damage: packet.damage });
                break;

            case 'OPPONENT_DISCONNECTED':
                console.log('[네트워크] 상대방이 게임을 종료(탈주)했습니다.');
                eventBus.emit(EVENTS.OPPONENT_LEFT);
                break;

            default:
                console.log(`[네트워크] 알 수 없는 패킷 수신: ${packet.type}`);
        }
    }
}

// 싱글톤 인스턴스로 내보내어 프로젝트 전역에서 동일한 소켓 스트림을 공유하게 합니다.
export const socketClient = new SocketClient();
