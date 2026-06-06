// 방 생성, 코드 입장, 로비 상태 관리 (구조)
// server/roomManager.js

/** 클라이언트의 config의 EVENTS 내용 복사해서 처리 */
export const EVENTS = Object.freeze({
     /** 소켓 연결중 */
    SOCKET_CONNECTING: 'SOCKET_CONNECTING',
    /** 소켓 연결 완료 */
    SOCKET_CONNECTED: 'SOCKET_CONNECTED',

    /** 로비 생성 */
    LOBBY_CREATED: 'LOBBY_CREATED',
    /** 로비 참가 */
    LOBBY_JOINED: 'LOBBY_JOINED',

    /** 보관함 상태 변경 알림 */
    STORAGE_STATE_CHANGED: 'STORAGE_STATE_CHANGED',

    /** 플레이어의 소환 이벤트 */
    REQ_SUMMON: 'REQ_SUMMON',
    /** 소환 패킷(플레이어가 소환>상대가 받음) */
    C2S_SUMMON: 'C2S_SUMMON',
    /** 소환 패킷(상대가 소환>플레이어가 받음) */
    S2C_SUMMON: 'S2C_SUMMON',
    /** 상대의 소환 동기화 */
    RES_SUMMON: 'RES_SUMMON',

    /** 플레이어의 "개체 공격" */
    REQ_DAMAGE: 'REQ_DAMAGE',
    /** 공격 패킷(플레이어가 공격>상대 개체 피해) */
    C2S_DAMAGE: 'C2S_DAMAGE',
    /** 공격 패킷(상대가 공격>플레이어 개체 피해) */
    S2C_DAMAGE: 'S2C_DAMAGE',
    /** 상대의 "개체 공격" 동기화 */
    RES_DAMAGE: 'RES_DAMAGE',

    /** 플레이어의 "기지 공격" */
    REQ_BASE_DAMAGE: 'REQ_BASE_DAMAGE',
    /** 공격 패킷(플레이어가 공격>상대 기지 피해) */
    C2S_BASE_DAMAGE: 'C2S_BASE_DAMAGE',
    /** 공격 패킷(상대가 공격>플레이어 기지 피해) */
    S2C_BASE_DAMAGE: 'S2C_BASE_DAMAGE',
    /** 상대의 "기지 공격" 동기화 */
    RES_BASE_DAMAGE: 'RES_BASE_DAMAGE',

    // 멀티 중 상대가 떠났을 때
    OPPONENT_LEFT: 'OPPONENT_LEFT'
});

export const waitingQueue = [];
export const rooms = new Map();

const OPEN = 1;
const COUNTDOWN_START = 5;
const ENTRY_SLOT_ORDER = ['right', 'left', 'spectator'];

function send(ws, data) {
    if (ws && ws.readyState === OPEN) {
        ws.send(JSON.stringify(data));
    }
}

function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';

    do {
        code = '';
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    } while (rooms.has(code));

    return code;
}

function createPlayer(ws, packet, slot) {
    return {
        ws,
        id: packet.playerId || `User_${Math.random().toString(36).substr(2, 5)}`,
        nickname: packet.nickname || packet.playerId || 'Player',
        enhanceLevel: packet.enhanceLevel || 0,
        slot,
        isReady: false,
        joinedAt: Date.now()
    };
}

function serializePlayer(player) {
    return {
        id: player.id,
        nickname: player.nickname,
        enhanceLevel: player.enhanceLevel,
        slot: player.slot,
        isReady: player.isReady
    };
}

function serializeLobby(room) {
    return {
        roomCode: room.code,
        players: room.players.map(serializePlayer),
        countdown: room.countdown,
        isStarted: room.isStarted
    };
}

function broadcastLobby(room) {
    const packet = {
        type: 'LOBBY_SYNC',
        lobby: serializeLobby(room)
    };

    room.players.forEach(player => send(player.ws, packet));
}

function getSlotPlayer(room, slot) {
    return room.players.find(player => player.slot === slot);
}

function getJoinSlot(room) {
    for (const slot of ENTRY_SLOT_ORDER) {
        if (slot === 'spectator' || !getSlotPlayer(room, slot)) {
            return slot;
        }
    }
    return 'spectator';
}

function clearCountdown(room) {
    if (room.countdownTimer) {
        clearInterval(room.countdownTimer);
        room.countdownTimer = null;
    }
    room.countdown = null;
}

function canStartCountdown(room) {
    const left = getSlotPlayer(room, 'left');
    const right = getSlotPlayer(room, 'right');
    return !!left && !!right && left.isReady && right.isReady;
}

function startGame(room) {
    clearCountdown(room);
    room.isStarted = true;

    room.players.forEach(player => {
        player.isReady = false;
        send(player.ws, {
            type: 'LOBBY_GAME_START',
            roomCode: room.code,
            role: player.slot
        });
    });

    broadcastLobby(room);
}

function refreshCountdown(room) {
    if (room.isStarted) return;

    if (!canStartCountdown(room)) {
        clearCountdown(room);
        broadcastLobby(room);
        return;
    }

    if (room.countdownTimer) {
        broadcastLobby(room);
        return;
    }

    room.countdown = COUNTDOWN_START;
    broadcastLobby(room);

    room.countdownTimer = setInterval(() => {
        if (!canStartCountdown(room)) {
            clearCountdown(room);
            broadcastLobby(room);
            return;
        }

        room.countdown -= 1;
        broadcastLobby(room);

        if (room.countdown <= 0) {
            startGame(room);
        }
    }, 1000);
}

function attachPlayerToRoom(room, player) {
    room.players.push(player);
    player.ws.roomId = room.code;
    player.ws.playerId = player.id;
    player.ws.lobbySlot = player.slot;
}

export function handleCreateRoom(ws, packet) {
    const roomCode = generateRoomCode();
    const room = {
        code: roomCode,
        players: [],
        countdown: null,
        countdownTimer: null,
        isStarted: false,
        createdAt: Date.now()
    };

    rooms.set(roomCode, room);
    attachPlayerToRoom(room, createPlayer(ws, packet, 'right'));

    send(ws, {
        type: EVENTS.LOBBY_CREATED,
        roomCode,
        role: 'right',
        lobby: serializeLobby(room)
    });
    broadcastLobby(room);
}

export function handleJoinRoom(ws, packet) {
    const roomCode = String(packet.roomCode || '').trim().toUpperCase();
    const room = rooms.get(roomCode);

    if (!room) {
        send(ws, { type: 'ROOM_JOIN_FAILED', reason: 'ROOM_NOT_FOUND', roomCode });
        return;
    }

    const existing = room.players.find(player => player.ws === ws || player.id === packet.playerId);
    if (existing) {
        send(ws, {
            type: EVENTS.LOBBY_JOINED,
            roomCode,
            role: existing.slot,
            lobby: serializeLobby(room)
        });
        return;
    }

    const slot = getJoinSlot(room);
    attachPlayerToRoom(room, createPlayer(ws, packet, slot));

    send(ws, {
        type: EVENTS.LOBBY_JOINED,
        roomCode,
        role: slot,
        lobby: serializeLobby(room)
    });
    refreshCountdown(room);
}

export function handleChangeLobbySlot(ws, packet) {
    const room = rooms.get(ws.roomId);
    const player = room?.players.find(target => target.ws === ws);
    const targetSlot = packet.slot;

    if (!room || !player || !['left', 'right', 'spectator'].includes(targetSlot)) return;

    if (targetSlot !== 'spectator') {
        const occupied = room.players.find(target => target.slot === targetSlot && target.ws !== ws);
        if (occupied) {
            send(ws, { type: 'LOBBY_ACTION_FAILED', reason: 'SLOT_OCCUPIED', slot: targetSlot });
            return;
        }
    }

    player.slot = targetSlot;
    player.isReady = false;
    ws.lobbySlot = targetSlot;
    refreshCountdown(room);
}

export function handleUpdateLobbyPlayer(ws, packet) {
    const room = rooms.get(ws.roomId);
    const player = room?.players.find(target => target.ws === ws);

    if (!room || !player) return;

    if (typeof packet.nickname === 'string') {
        const nickname = packet.nickname.trim().slice(0, 12);
        if (nickname) player.nickname = nickname;
    }

    if (typeof packet.isReady === 'boolean') {
        player.isReady = player.slot === 'left' || player.slot === 'right'
            ? packet.isReady
            : false;
    }

    refreshCountdown(room);
}

export function handleReturnToLobby(ws) {
    const room = rooms.get(ws.roomId);
    const player = room?.players.find(target => target.ws === ws);

    if (!room || !player) return;

    clearCountdown(room);
    room.isStarted = false;
    room.players.forEach(target => {
        target.isReady = false;
    });
    broadcastLobby(room);
}

/** 기존 대기열 매칭 요청 처리: 현재는 코드방 로비로 유도하기 전 호환용으로 유지 */
export function handleMatchRequest(ws, packet) {
    if (packet.roomCode) {
        handleJoinRoom(ws, packet);
        return;
    }

    handleCreateRoom(ws, packet);
}

export function handleDisconnect(ws) {
    const qIndex = waitingQueue.indexOf(ws);
    if (qIndex !== -1) {
        waitingQueue.splice(qIndex, 1);
        return;
    }

    if (!ws.roomId || !rooms.has(ws.roomId)) return;

    const room = rooms.get(ws.roomId);
    room.players = room.players.filter(player => player.ws !== ws);

    if (room.players.length === 0) {
        clearCountdown(room);
        rooms.delete(ws.roomId);
        console.log(`[방 파기] 빈 방 제거: ${ws.roomId}`);
        return;
    }

    refreshCountdown(room);
}

export function broadcastToOpponent(ws, data) {
    if (!ws.roomId || !rooms.has(ws.roomId)) return;

    const room = rooms.get(ws.roomId);
    const me = room.players.find(player => player.ws === ws);
    if (!me || !['left', 'right'].includes(me.slot)) return;

    const opponentSlot = me.slot === 'left' ? 'right' : 'left';
    const opponent = getSlotPlayer(room, opponentSlot);
    send(opponent?.ws, data);
}
