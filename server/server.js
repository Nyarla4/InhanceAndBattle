// 웹소켓 서버 엔트리 포인트 (환경설정 및 포트 바인딩)
// server/server.js

import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import {
    handleChangeLobbySlot,
    handleCreateRoom,
    handleDisconnect,
    handleJoinRoom,
    handleMatchRequest,
    handleUpdateLobbyPlayer,
    broadcastToOpponent
} from './roomManager.js';
import { EVENTS } from './roomManager.js';

const PORT = process.env.PORT || 3000;

// 1. HTTP 서버 생성 (Render 상태 체크용)
const server = createServer((req, res) => {
    if (req.url === '/health' || req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Server is running and healthy');
    } else {
        res.writeHead(404);
        res.end();
    }
});

// 2. 웹소켓 서버를 HTTP 서버 위에 구동
const wss = new WebSocketServer({ server });

console.log(`[네트워크] 웹소켓 서버 네트워크 초기화 중... 포트: ${PORT}`);

wss.on('connection', (ws) => {
    console.log('[접속] 새로운 클라이언트가 네트워크에 연결되었습니다.');
    
    // 소켓 세션 초기화
    ws.roomId = null;
    ws.playerId = null;
    ws.enhanceLevel = 9;

    // 클라이언트로부터 패킷 수신 시 라우팅
    ws.on('message', (message) => {
        try {
            const packet = JSON.parse(message);
            
            switch (packet.type) {
                case EVENTS.LOBBY_CREATED:
                    handleCreateRoom(ws, packet);
                    break;
                case EVENTS.LOBBY_JOINED:
                    handleJoinRoom(ws, packet);
                    break;
                case 'CHANGE_LOBBY_SLOT':
                    handleChangeLobbySlot(ws, packet);
                    break;
                case 'UPDATE_LOBBY_PLAYER':
                    handleUpdateLobbyPlayer(ws, packet);
                    break;
                case 'MATCH_REQUEST':
                    handleMatchRequest(ws, packet);
                    break;
                case EVENTS.C2S_SUMMON:
                    broadcastToOpponent(ws, {
                        type: EVENTS.S2C_SUMMON,
                        creatureId: packet.creatureId,
                        level: packet.level,
                        syncId: packet.syncId
                    });
                    break;
                case EVENTS.C2S_BASE_DAMAGE:
                    broadcastToOpponent(ws, {
                        type: EVENTS.S2C_BASE_DAMAGE,
                        damage: packet.damage
                    });
                    break;
                case EVENTS.C2S_DAMAGE:
                     broadcastToOpponent(ws, {
                        type: EVENTS.S2C_DAMAGE,
                        targetId: packet.targetId,
                        damage: packet.damage
                    });
                    break;
                default:
                    console.log(`[알림] 정의되지 않은 패킷 요청: ${packet.type}`);
            }
        } catch (err) {
            console.error('[에러] 패킷 해석 실패:', err);
        }
    });

    // 접속 해제 이벤트 핸들링
    ws.on('close', () => {
        handleDisconnect(ws);
    });

    ws.on('error', (err) => {
        console.error('[소켓 내부 에러]:', err);
    });
});

// 서버 리슨 시작
server.listen(PORT, () => {
    console.log(`[서버 가동 완료] 포트 주소: http://localhost:${PORT}`);
});
