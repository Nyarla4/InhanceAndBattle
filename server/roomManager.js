// 방 생성, 패스워드 검증, 플레이어 매칭 관리 (구조)
// server/roomManager.js

export const waitingQueue = []; // 매칭 대기열
export const rooms = new Map();  // 활성화된 게임방 (roomId -> { player1, player2 })

/** 1. 대전 매칭 요청 처리 */
export function handleMatchRequest(ws, packet) {
    ws.playerId = packet.playerId || `User_${Math.random().toString(36).substr(2, 5)}`;
    ws.enhanceLevel = packet.enhanceLevel;

    if (waitingQueue.length > 0) {
        // 대기실에 먼저 온 유저가 있다면 매칭 성사
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

        console.log(`[매칭 성공] 방 ID: ${roomId} (${opponent.playerId} VS ${ws.playerId})`);
    } else {
        // 대기자가 없으면 큐에 추가하고 대기 상태 전송
        waitingQueue.push(ws);
        ws.send(JSON.stringify({ type: 'WAITING_FOR_OPPONENT' }));
        console.log(`[매칭 대기진입] ${ws.playerId} (강화레벨 가중치: ${ws.enhanceLevel})`);
    }
}

/** 2. 연결 종료 시 방 파기 및 대기열 제거 */
export function handleDisconnect(ws) {
    // 대기열에 있다가 나간 경우 제거
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
        console.log(`[방 파기] 플레이어 접속 해제로 인해 방이 제거되었습니다: ${ws.roomId}`);
    }
}

/** 3. 같은 방의 상대방에게 데이터 패스스루 중계 (Helper) */
export function broadcastToOpponent(ws, data) {
    if (!ws.roomId || !rooms.has(ws.roomId)) return;
    
    const room = rooms.get(ws.roomId);
    const opponent = room.player1 === ws ? room.player2 : room.player1;
    
    if (opponent && opponent.readyState === 1) { // 1 = WebSocket.OPEN
        opponent.send(JSON.stringify(data));
    }
}