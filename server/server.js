// 웹소켓 서버 엔트리 포인트 (환경설정 및 포트 바인딩)

import { createServer } from 'http';
import { WebSocketServer } from 'ws';

const PORT = process.env.PORT || 3000;

// 1. HTTP 서버 생성 (Render의 포트 바인딩 및 상태 체크용)
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

// 멀티플레이 상태 관리용 메모리 변수
const waitingQueue = []; // 매칭 대기열
const rooms = new Map();  // 활성화된 게임방 (roomId -> { player1, player2 })

console.log(`[서버] 웹소켓 서버 초기화 중... 포트: ${PORT}`);

wss.on('connection', (ws) => {
    console.log('[연결] 새로운 클라이언트가 소켓에 접속했습니다.');
    
    // 소켓 인스턴스에 세션 변수 초기화
    ws.roomId = null;
    ws.playerId = null;
    ws.enhanceLevel = 9; // 기본 9단계(가장 낮은 단계)

    // 클라이언트로부터 패킷(메시지) 수신 시
    ws.on('message', (message) => {
        try {
            const packet = JSON.parse(message);
            handlePacket(ws, packet);
        } catch (err) {
            console.error('[에러] 패킷 파싱 실패:', err);
        }
    });

    // 클라이언트 접속 종료 시
    ws.on('close', () => {
        console.log('[해제] 클라이언트 연결이 끊어졌습니다.');
        handleDisconnect(ws);
    });

    ws.on('error', (err) => {
        console.error('[소켓 에러]:', err);
    });
});

// 3. 게임 동기화 패킷 핸들러 (흐름 제어)
function handlePacket(ws, packet) {
    switch (packet.type) {
        case 'MATCH_REQUEST': // 1) 대전 매칭 요청 수신
            ws.playerId = packet.playerId || `User_${Math.random().toString(36).substr(2, 5)}`;
            ws.enhanceLevel = packet.enhanceLevel; // 클라이언트가 보낸 강화 데이터 저장

            if (waitingQueue.length > 0) {
                // 대기실에 먼저 온 유저가 있다면 매칭 성사!
                const opponent = waitingQueue.shift();
                const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
                
                ws.roomId = roomId;
                opponent.roomId = roomId;

                // 방 등록
                rooms.set(roomId, { player1: opponent, player2: ws });

                // 양측 클라이언트에 매칭 완료 및 상대방 정보 전송
                opponent.send(JSON.stringify({
                    type: 'MATCH_FOUND',
                    roomId,
                    isHost: true,
                    opponent: { id: ws.playerId, level: ws.enhanceLevel }
                }));

                ws.send(JSON.stringify({
                    type: 'MATCH_FOUND',
                    roomId,
                    isHost: false,
                    opponent: { id: opponent.playerId, level: opponent.enhanceLevel }
                }));

                console.log(`[매칭] 성사 완료! 방 ID: ${roomId} (${opponent.playerId} VS ${ws.playerId})`);
            } else {
                // 대기자가 없으면 큐에 추가하고 대기 상태 전송
                waitingQueue.push(ws);
                ws.send(JSON.stringify({ type: 'WAITING_FOR_OPPONENT' }));
                console.log(`[매칭] 대기열 진입: ${ws.playerId} (현재 강화레벨: ${ws.enhanceLevel + 1}위)`);
            }
            break;

        case 'SPAWN_CREATURE': // 2) 내가 유닛을 소환했음을 상대에게 동기화
            broadcastToOpponent(ws, {
                type: 'OPPONENT_SPAWN',
                creatureId: packet.creatureId,
                level: packet.level // 강화 등급 전달
            });
            break;

        case 'BASE_DAMAGE': // 3) 상대 기지에 피해를 입혔음을 동기화
            broadcastToOpponent(ws, {
                type: 'OPPONENT_BASE_DAMAGE',
                damage: packet.damage
            });
            break;

        default:
            console.log(`[알림] 처리되지 않은 패킷 타입: ${packet.type}`);
    }
}

// 같은 방에 있는 상대방에게만 패킷을 전송하는 헬퍼 함수
function broadcastToOpponent(ws, data) {
    if (!ws.roomId || !rooms.has(ws.roomId)) return;
    
    const room = rooms.get(ws.roomId);
    const opponent = room.player1 === ws ? room.player2 : room.player1;
    
    if (opponent && opponent.readyState === 1) { // 1 = WebSocket.OPEN
        opponent.send(JSON.stringify(data));
    }
}

// 4. 접속 끊김 예외 처리
function handleDisconnect(ws) {
    // 대기열에 있다가 취소/종료한 경우 제거
    const qIndex = waitingQueue.indexOf(ws);
    if (qIndex !== -1) {
        waitingQueue.splice(qIndex, 1);
        return;
    }

    // 게임 중에 나간 경우 상대방에게 알리고 방 파기
    if (ws.roomId && rooms.has(ws.roomId)) {
        const room = rooms.get(ws.roomId);
        const opponent = room.player1 === ws ? room.player2 : room.player1;

        if (opponent && opponent.readyState === 1) {
            opponent.send(JSON.stringify({ type: 'OPPONENT_DISCONNECTED' }));
            opponent.roomId = null;
        }

        rooms.delete(ws.roomId);
        console.log(`[방 파기] 플레이어 탈주로 인해 방이 제거되었습니다: ${ws.roomId}`);
    }
}

// 서버 리슨 시작
server.listen(PORT, () => {
    console.log(`[서버 구동 완료] http://localhost:${PORT}`);
});