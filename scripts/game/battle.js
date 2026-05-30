// scripts/game/battle.js

import { eventBus } from "../core/eventBus.js";
import { consumeStoredCreature, createBattleSession, enhanceState, getGameState } from "../core/state.js";
import { initForgeView, renderForgeUI } from "../ui/views/enhanceView.js";
import creaturesData from '../../json/creatures.json' with { type: 'json' };
import { EVENTS } from "../core/config.js";
import { renderCreature } from '../ui/views/gameView.js';

// 내부 타이머 및 큐 상태 (구조적 캡슐화)
let isBattleRunning = false;
let currentStage = null;
let isEventBound = false; // 이벤트 중복 등록 방지용 플래그

/** 전투 초기화 및 시작 인터페이스 (스테이지 선택 시 호출됨) */
export function startBattle(stageData) {
    // 1. 뷰 레이어의 치수 수집 및 세션 생성
    const fieldEl = document.getElementById('field') || { clientWidth: 800 };
    const pBaseEl = document.getElementById('playerBase') || { clientWidth: 100 };
    const eBaseEl = document.getElementById('enemyBase') || { clientWidth: 100 };
    
    const dimensions = {
        width: fieldEl.clientWidth,
        playerBaseWidth: pBaseEl.clientWidth,
        enemyBaseWidth: eBaseEl.clientWidth
    };

    currentStage = createBattleSession(stageData, dimensions);

    // 2. 이벤트 바인딩 (최초 1회만 등록)
    if (!isEventBound) {
        eventBus.on(EVENTS.REQUEST_STORAGE_SUMMON, handleStorageSummon);
        isEventBound = true;
    }

    // 2. 우측 30% 영역(강화/보관함) 뷰 초기화 및 렌더링
    // enhanceView.js에 정의된 initForgeView를 호출하여 state.js의 storage 데이터를 화면에 그림
    initForgeView();
    renderForgeUI();

    // 3. 전투 루프 시작 (현재는 빈 루프)
    isBattleRunning = true;
    startBattleLoop();
}

/** 메인 전투 루프 */
function startBattleLoop() {
    function loop(now) {
        if (!isBattleRunning) return;
        console.log(`전투 루프 테스트${now}`)
        // TODO: updateCreatures 등 전투 로직 흐름 추가 예정

        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}

export function stopBattleLoop() {
    isBattleRunning = false;
}

/** 보관함 개체 클릭 시 실행되는 소환 로직 
 * View에서 데이터 구조 결정을 하지 않고, 전달받은 ID를 기반으로 여기서 검증 및 처리합니다.
 */
function handleStorageSummon({ itemId }) {
    if (!currentStage || !isBattleRunning) return;

    // 1. 데이터 검증 (Structure 조회)
    const storageItem = enhanceState.storage.find(item => item.id === itemId);
    if (!storageItem) return;

    // 2. 마스터 데이터(JSON) 매핑: groupKey(예: nezming)와 levelIdx(예: 3)를 조합하여 ID 추론
    const creatureId = `${storageItem.groupKey}_${storageItem.levelIdx}`;
    const template = creaturesData[creatureId];

    if (!template) {
        console.error("데이터베이스에 해당 개체가 없습니다:", creatureId);
        return;
    }

    // 3. 상태 변경: 보관함에서 영구 소모
    const isConsumed = consumeStoredCreature(itemId);
    if (!isConsumed) return;

    // 4. 엔티티 인스턴스 생성 및 상태 편입
    const newCreature = {
        id: Date.now() + Math.random(), // 고유 인스턴스 식별자
        data: template,
        hp: template.maxHp,
        isPlayer: true,
        isAlive: true,
        position: currentStage.playerSpawnX, // 우측 아군 기지 앞 좌표
        element: document.createElement('div'),
        currentVisualState: 'idle',
        lastAttackTime: 0
    };

    // 스프라이트 경로 동적 할당
    newCreature.data.idle = `./img/battle/${creatureId}_idle.png`;
    newCreature.data.attack = `./img/battle/${creatureId}_battle.png`;
    
    currentStage.playerCreatures.push(newCreature);

    // 5. DOM 렌더링 요청
    renderCreature(newCreature, currentStage.playerCreatures);
    
    // 6. UI 동기화 이벤트 발송 (보관함 뷰 갱신)
    eventBus.emit(EVENTS.STORAGE_STATE_CHANGED, {});
}