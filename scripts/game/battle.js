// scripts/game/battle.js

import { eventBus } from "../core/eventBus.js";
import { consumeStoredCreature, createBattleSession, enhanceState, getGameState } from "../core/state.js";
import { initForgeView, renderForgeUI } from "../ui/views/enhanceView.js";
import creaturesData from '../../json/creatures.json' with { type: 'json' };
import { EVENTS } from "../core/config.js";
import { removeCreatureView, renderCreature, updateCreatureView } from '../ui/views/gameView.js';
import { stageScreen } from "../ui/uiElements.js";

// 내부 타이머 및 큐 상태 (구조적 캡슐화)
let isBattleRunning = false;
let currentStage = null;
let isEventBound = false; // 이벤트 중복 등록 방지용 플래그
let lastFrameTime = 0;
let animationFrameId = null;

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

    // 테스트 버튼 추가
    createDebugEnemySpawnButton();

    // 2. 이벤트 바인딩 (최초 1회만 등록)
    if (!isEventBound) {
        eventBus.on(EVENTS.REQUEST_STORAGE_SUMMON, handleStorageSummon);
        isEventBound = true;
    }

    // 2. 우측 30% 영역(강화/보관함) 뷰 초기화 및 렌더링
    // enhanceView.js에 정의된 initForgeView를 호출하여 state.js의 storage 데이터를 화면에 그림
    initForgeView();
    renderForgeUI();

    // 3. 전투 루프 시작    
    startBattleLoop();
}

/** 메인 전투 루프 */
function startBattleLoop() {
    isBattleRunning = true;
    lastFrameTime = performance.now();

    function loop(now) {
        if (!isBattleRunning || !currentStage) return;

        // 델타타임
        const deltaTime = now - lastFrameTime;
        lastFrameTime = now;

        // 이동 및 전투
        processCreatures(deltaTime);

        // 죽은 개체 처리
        cleanupDeadCreatures();

        // 승패 확인
        checkGameOver();

        // 뷰 동기화
        syncView();

        animationFrameId = requestAnimationFrame(loop);
    }
    animationFrameId = requestAnimationFrame(loop);
}

/** 개체별 이동 및 공격 처리 */
function processCreatures(deltaTime) {
    const allCreatures = [...currentStage.playerCreatures, ...currentStage.enemyCreatures];

    allCreatures.forEach(creature => {
        if (!creature.isAlive) return;

        // 초당 이동 속도 보정
        const moveDistance = creature.data.moveSpeed * (deltaTime / 1000);

        // TODO: 향후 공격 사거리 탐색 로직이 여기에 추가됩니다.
        // 현재는 적 탐색 없이 앞으로 전진만 하도록 구현합니다.
        const isAttacking = false;

        if (!isAttacking) {
            if (creature.isPlayer) {
                creature.position -= moveDistance; // 아군은 우측에서 좌측으로 이동 (-)
            } else {
                creature.position += moveDistance; // 적군은 좌측에서 우측으로 이동 (+)
            }
        }
    });
}

/** 체력이 0 이하인 개체 처리 */
function cleanupDeadCreatures() {
    // 아군 정리
    for (let i = currentStage.playerCreatures.length - 1; i >= 0; i--) {
        const creature = currentStage.playerCreatures[i];
        if (creature.hp <= 0) {
            creature.isAlive = false;
            removeCreatureView(creature); // 뷰에서 제거
            currentStage.playerCreatures.splice(i, 1); // 상태 배열에서 제거
        }
    }

    // 적군 정리 (동일 로직)
    for (let i = currentStage.enemyCreatures.length - 1; i >= 0; i--) {
        const creature = currentStage.enemyCreatures[i];
        if (creature.hp <= 0) {
            creature.isAlive = false;
            removeCreatureView(creature);
            currentStage.enemyCreatures.splice(i, 1);
        }
    }
}

/** 승패 판정 */
function checkGameOver() {
    // Todo: 적 기지 체력 0 되었는지 체크
}

/** 데이터 변경 결과를 화면에 동기화 */
function syncView() {
    const allCreatures = [...currentStage.playerCreatures, ...currentStage.enemyCreatures];
    allCreatures.forEach(creature => {
        // gameView.js의 함수를 호출하여 화면 갱신
        updateCreatureView(creature);
    });
}

export function stopBattleLoop() {
    isBattleRunning = false;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
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
    newCreature.data.id = creatureId;
    newCreature.data.idle = `./img/battle/${creatureId}_idle.png`;
    newCreature.data.attack = `./img/battle/${creatureId}_battle.png`;

    currentStage.playerCreatures.push(newCreature);

    // 5. DOM 렌더링 요청
    renderCreature(newCreature, currentStage.playerCreatures);

    // 6. UI 동기화 이벤트 발송 (보관함 뷰 갱신)
    eventBus.emit(EVENTS.STORAGE_STATE_CHANGED, {});
}

/** 테스트용 적 소환 버튼(추후 삭제) */
function createDebugEnemySpawnButton() {
    const buttonId = 'debug-spawn-enemy-btn';
    if (document.getElementById(buttonId)) return;
    const btn = document.createElement('button');
    btn.id = buttonId;
    btn.textContent = '적 소환 버튼(디버그)';
    btn.style.cssText = 'position: absolute; top: 20px; left: 50%; transform: translateX(-50%); z-index: 9999; padding: 10px 20px; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 14px;';
    btn.addEventListener('click', () => {
        if (!currentStage) return;

        const enemyData = creaturesData["enemy_01"];
        if (!enemyData) {
            console.error("enemy_01 데이터 없음");
            return;
        }

        const newEnemy = {
            id: Math.random().toString(36).substring(2, 9), // 고유 식별자 발급
            data: enemyData,
            hp: enemyData.maxHp,
            isAlive: true,
            isPlayer: false, // 적측 플래그
            position: currentStage.enemySpawnX // 적측 시작 좌표
        };

        data.id = "enemy_01";

        // 생성된 적 개체 추가
        currentStage.enemyCreatures.push(newEnemy);
        renderCreature(newEnemy, currentStage.enemyCreatures);
    });

    stageScreen.appendChild(btn);
}