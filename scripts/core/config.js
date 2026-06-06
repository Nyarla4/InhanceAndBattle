// 게임 세션 설정 구조
// scripts/core/config.js

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

// 강화 그룹 데이터 정의
export const ENHANCE_GROUPS = {
    nezming: {
        name: "네즈밍",
        items: [
            {
                name: "미도미도 마요",
                img: "./img/mayo/01_마요.png",
                percent: 0,
                dropPercentage: 100
            },
            {
                name: "바오밥나무 네즈밍",
                img: "./img/mayo/02_바오밥나무.png",
                percent: 10,
                dropPercentage: 80
            },
            {
                name: "볼드의 대형 해머 네즈밍",
                img: "./img/mayo/03_볼드의대형해머.png",
                percent: 20,
                dropPercentage: 60
            },
            {
                name: "처형자의 대검 네즈밍",
                img: "./img/mayo/04_처형자의대검.png",
                percent: 30,
                dropPercentage: 40
            },
            {
                name: "클레이모어 네즈밍",
                img: "./img/mayo/05_클레이모어.png",
                percent: 40,
                dropPercentage: 20
            },
            {
                name: "바스타드 소드 네즈밍",
                img: "./img/mayo/06_바스타드소드.png",
                percent: 50,
                dropPercentage: 0
            },
            {
                name: "야구빠따 네즈밍",
                img: "./img/mayo/07_야구빠따.png",
                percent: 60,
                dropPercentage: 0
            },
            {
                name: "커터칼 네즈밍",
                img: "./img/mayo/08_커터칼.png",
                percent: 70,
                dropPercentage: 0
            },
            {
                name: "눈썹칼 네즈밍",
                img: "./img/mayo/09_눈썹칼.png",
                percent: 80,
                dropPercentage: 0
            },
            {
                name: "이쑤시개 네즈밍",
                img: "./img/mayo/10_이쑤시개.png",
                percent: 90,
                dropPercentage: 0
            }
        ]
    },
    majitomo: {
        name: "마지토모",
        items: [
            {
                name: "마지나이 쿠로카",
                img: "./img/kuroka/majitomo01.png",
                percent: 0,
                dropPercentage: 0
            },
            {
                name: "되어있지않아",
                img: "./img/kuroka/majitomo02.png",
                percent: 15,
                dropPercentage: 0
            },
            {
                name: "준비가",
                img: "./img/kuroka/majitomo03.png",
                percent: 35,
                dropPercentage: 0
            },
            {
                name: "아직은",
                img: "./img/kuroka/majitomo04.png",
                percent: 60,
                dropPercentage: 0
            },
            {
                name: "미안 마지토모",
                img: "./img/kuroka/majitomo05.png",
                percent: 85,
                dropPercentage: 0
            }
        ]
    }
};