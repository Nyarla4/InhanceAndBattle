// 모듈 간 결합도를 낮추기 위한 글로벌 이벤트 객체

class EventBus {
    constructor() {
        // 이벤트 이름별 콜백 함수들을 저장할 객체
        this.listeners = {};
    }

    /**
     * 특정 이벤트의 구독(Listen)을 시작합니다.
     * @param {string} event - 이벤트 이름 (예: 'MATCH_SUCCESS')
     * @param {Function} callback - 이벤트 발생 시 실행할 함수
     * @returns {Function} 구독을 해제할 수 있는 일회성 함수 반환
     */
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);

        // 반환된 함수를 호출하면 간편하게 구독이 해제됩니다.
        return () => this.off(event, callback);
    }

    /**
     * 특정 이벤트의 구독을 해제(Unlisten)합니다.
     * @param {string} event - 이벤트 이름
     * @param {Function} callback - 제거할 콜백 함수
     */
    off(event, callback) {
        if (!this.listeners[event]) return;
        
        // 해당 콜백 함수를 배열에서 제외합니다.
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }

    /**
     * 이벤트를 발생(Publish/Emit)시키고 필요한 데이터를 전송합니다.
     * @param {string} event - 이벤트 이름 (예: 'SOCKET_CONNECTING')
     * @param {any} data - 전달할 패킷 데이터나 수치 객체
     */
    emit(event, data) {
        if (!this.listeners[event]) return;

        // 실행 도중 구독 해제(off)가 일어나도 루프가 깨지지 않도록 배열 복사본을 만들어 순회합니다.
        [...this.listeners[event]].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`[EventBus] 이벤트 처리 중 에러 발생 (이벤트: ${event}):`, error);
            }
        });
    }

    /**
     * 단 한 번만 실행되고 자동으로 소멸하는 일회성 이벤트를 등록합니다.
     * @param {string} event - 이벤트 이름
     * @param {Function} callback - 실행할 콜백 함수
     */
    once(event, callback) {
        const onceWrapper = (data) => {
            this.off(event, onceWrapper); // 실행되자마자 구독 해제
            callback(data);
        };
        this.on(event, onceWrapper);
    }
}

// 프로젝트 전역에서 공유할 단 하나의 eventBus 인스턴스 수출
export const eventBus = new EventBus();