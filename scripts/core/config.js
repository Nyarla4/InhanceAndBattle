// 게임 세션 설정 구조
// scripts/core/config.js

export { default as ENHANCE_GROUPS } from '../../json/enhanceGroups.json' with { type: 'json' };

// EVENTS 수정 시 server의 roomManager에서도 수정할 것
/** eventBus에 사용할 콜백함수 정의 */
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