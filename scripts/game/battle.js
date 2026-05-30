// scripts/game/battle.js

import { eventBus } from "../core/eventBus.js";
import { consumeStoredCreature, createBattleSession, enhanceState, getGameState } from "../core/state.js";
import { initForgeView, renderForgeUI } from "../ui/views/enhanceView.js";
import creaturesData from '../../json/creatures.json' with { type: 'json' };
import { EVENTS } from "../core/config.js";
import { initBattleResult, removeCreatureView, renderBaseHp, renderCreature, setCreatureAttackView, setCreatureIdleView, showBattleResult, updateCreatureView } from '../ui/views/gameView.js';
import { field, playerBase, enemyBase, stageScreen, stageSelectorScreen, titleScreen, resultStageBtn, resultTitleBtn, pauseModal, pauseBattleBtn, resumeBattleBtn, exitBattleBtn } from "../ui/uiElements.js";
import { sceneManager } from "../ui/sceneManager.js";

// 내부 타이머 및 큐 상태 (구조적 캡슐화)
let isBattleRunning = false;
let currentStage = null;
let isEventBound = false; // 이벤트 중복 등록 방지용 플래그
let lastFrameTime = 0;
let animationFrameId = null;
let playerMaxHp = 0;
let enemyMaxHp = 0;

let stageTimer = 0; // 스폰 타이머
let spawnQueue = []; // 스폰 큐

let isPaused = false; // 일시정지중 여부

/** 전투 초기화 및 시작 인터페이스 (스테이지 선택 시 호출됨) */
export function startBattle(stageData) {
    applyLandscapeLock();// 전투에서 가로화면 처리

    // 1. 뷰 레이어의 치수 수집 및 세션 생성
    const fieldEl = field || { clientWidth: 800 };
    const pBaseEl = playerBase || { clientWidth: 100 };
    const eBaseEl = enemyBase || { clientWidth: 100 };

    const dimensions = {
        width: fieldEl.clientWidth,
        playerBaseWidth: pBaseEl.clientWidth,
        enemyBaseWidth: eBaseEl.clientWidth
    };

    currentStage = createBattleSession(stageData, dimensions);

    // 2. 이벤트 바인딩 (최초 1회만 등록)
    if (!isEventBound) {
        eventBus.on(EVENTS.REQUEST_STORAGE_SUMMON, handleStorageSummon);
        resultStageBtn.addEventListener('click', () => {
            sceneManager.showScreen(stageSelectorScreen);
        });
        
        resultTitleBtn.addEventListener('click', () => {
            sceneManager.showScreen(titleScreen);
        });

        pauseBattleBtn.addEventListener('click', () => {
            isPaused = true;
            pauseModal.classList.remove('hidden');
        });

        resumeBattleBtn.addEventListener('click', () => {
            isPaused = false;
            pauseModal.classList.add('hidden');
        });

        exitBattleBtn.addEventListener('click', () => {
            isPaused = false;
            pauseModal.classList.add('hidden');
            stopBattleLoop();
            sceneManager.showScreen(stageSelectorScreen);
        });
        isEventBound = true;
    }

    // 2. 우측 30% 영역(강화/보관함) 뷰 초기화 및 렌더링
    // enhanceView.js에 정의된 initForgeView를 호출하여 state.js의 storage 데이터를 화면에 그림
    initForgeView();
    renderForgeUI();
    
    playerMaxHp = currentStage.playerMaxHp;
    enemyMaxHp = stageData.enemyBaseHp || 1000;
    renderBaseHp(currentStage, playerMaxHp, enemyMaxHp);

    initBattleResult();
    stageTimer = 0;
    spawnQueue = [];
    spawnQueue = [...stageData.enemies];

    isPaused = false;
    if (!pauseModal.classList.contains('hidden')) {
        pauseModal.classList.add('hidden');
    }

    // 3. 전투 루프 시작    
    startBattleLoop();
}

function applyLandscapeLock() {
    const docEl = document.documentElement;

    // 1. 전체화면 요청
    const requestFullscreen = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.msRequestFullscreen;
    
    if (requestFullscreen) {
        requestFullscreen.call(docEl).then(() => {
            // 2. 전체화면 진입 성공 후 가로방향 고정 시도
            if (screen.orientation && screen.orientation.lock) {
                screen.orientation.lock("landscape")
                    .catch((err) => {
                        console.warn("화면 방향 잠금 실패 (기기 미지원):", err);
                    });
            }
        }).catch((err) => {
            console.warn("전체화면 진입 실패:", err);
        });
    }
}

/** 메인 전투 루프 */
function startBattleLoop() {
    isBattleRunning = true;
    lastFrameTime = performance.now();

    function loop(now) {
        if (!isBattleRunning || !currentStage) return;

        if (isPaused) { // 일시정지 중 연산 차단 및 시간 동기화
            lastFrameTime = now; // 델타타임 누적 차단
            animationFrameId = requestAnimationFrame(loop);
            return;
        }

        // 델타타임
        const deltaTime = now - lastFrameTime;
        lastFrameTime = now;

        // 2. 적군 스폰 스케줄 처리 (흐름: 데이터 상태 갱신)
        updateStageSpawner(deltaTime, currentStage);

        // 이동 및 전투
        processCreatures(deltaTime, now);

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
function processCreatures(deltaTime, now) {
    const players = currentStage.playerCreatures;
    const enemies = currentStage.enemyCreatures;
    const allCreatures = [...currentStage.playerCreatures, ...currentStage.enemyCreatures];

    allCreatures.forEach(creature => {
        if (!creature.isAlive) return;

        // [흐름 1] 시각적 공격 연출 유지 시간 체크 및 복구
        if (creature.isAttackingVisual) {
            const duration = creature.data.attackDuration || 200;

            if (now - creature.lastAttackTime >= duration) {
                creature.isAttackingVisual = false;
                setCreatureIdleView(creature); // 뷰 레이어에 idle 상태 복구 요청
            }
        }

        // 적대 대상
        const opponents = creature.isPlayer ? enemies : players;

        // 사거리 내 대상
        const target = findTargetInRange(creature, opponents);
        const isBaseInRange = checkBaseInRange(creature);
        const isTargetExist = target.length > 0;
        if (isTargetExist || isBaseInRange) { // 대상이 있는 경우: 이동 중지 및 쿨타임 체크
            if (!creature.lastAttackTime) creature.lastAttackTime = 0;

            if (now - creature.lastAttackTime >= creature.data.attackTerm) {

                if (isTargetExist) { // 대상이 있다면 대상 공격
                    attackTarget(creature, target);
                    if (creature.data.canAttackMultipleTargets && isBaseInRange) { // 다중 공격이 가능한 경우 기지도 공격
                        attackBase(creature);
                    }
                }
                else if (isBaseInRange) { // 대상이 없고 기지가 있다면 기지 공격
                    attackBase(creature);
                }


                creature.lastAttackTime = now; // 쿨타임 초기화
                creature.isAttackingVisual = true; // 공격 이미지로 변환 요청
                setCreatureAttackView(creature); // 뷰 레이어에 attack 상태 전환 요청
            }
        } else if (!creature.isAttackingVisual) { // 대상이 없고 공격 이미지가 아닌 경우에만 이동
            // 초당 이동 속도 보정
            const moveDistance = creature.data.moveSpeed * (deltaTime / 1000);

            if (creature.isPlayer) {
                creature.position -= moveDistance; // 아군은 우측에서 좌측으로 이동 (-)
            } else {
                creature.position += moveDistance; // 적군은 좌측에서 우측으로 이동 (+)
            }
        }
    });
}

/** 사거리 내의 적 탐색 */
function findTargetInRange(attacker, opponents) {
    const targets = [];
    for (let i = 0; i < opponents.length; i++) {
        const opponent = opponents[i];
        if (!opponent.isAlive) continue;

        // 절대값으로 거리 연산 (서로 마주보고 전진하므로 단순 좌표 차이 사용)
        const distance = Math.abs(attacker.position - opponent.position);

        if (distance <= attacker.data.attackRange) {
            targets.push(opponent);
            if (!attacker.data.canAttackMultipleTargets) // 다중 공격이 아닌 경우
                return targets; // 사거리 내에 들어온 첫 번째 대상 반환
        }
    }
    return targets; // 사거리 내에 들어온 모든 대상 반환
}

/** 기지가 사거리 내에 있는지 확인 */
function checkBaseInRange(creature) {
    // 아군의 목표는 적 기지 좌표(enemySpawnX), 적군의 목표는 아군 기지 좌표(playerSpawnX)
    const targetBasePos = creature.isPlayer ? currentStage.enemySpawnX : currentStage.playerSpawnX;

    // 절대값으로 거리 연산
    const distance = Math.abs(creature.position - targetBasePos);

    return distance <= creature.data.attackRange;
}

/** 기지 타격 처리 (상태값 변경 및 콘솔 출력) */
function attackBase(creature) {
    const damage = creature.data.attackDamage;

    if (creature.isPlayer) {
        currentStage.enemyHp -= damage;
        console.log(`💥 아군 -> 적 기지 타격! (피해량: ${damage}, 남은 HP: ${currentStage.enemyHp})`);
    } else {
        currentStage.playerHp -= damage;
        console.log(`💥 적군 -> 아군 기지 타격! (피해량: ${damage}, 남은 HP: ${currentStage.playerHp})`);
    }
    renderBaseHp(currentStage, playerMaxHp, enemyMaxHp);
}

/** 공격 연산 처리 및 콘솔 출력 */
function attackTarget(attacker, targets) {
    const damage = attacker.data.attackDamage;
    for (let idx = 0; idx < targets.length; idx++) {
        const target = targets[idx]
        target.hp -= damage;

        const attackerName = `[${attacker.isPlayer ? '아군' : '적군'}] ${attacker.data.name}`;
        const targetName = `[${target.isPlayer ? '아군' : '적군'}] ${target.data.name}`;

        console.log(`⚔️ ${attackerName} -> ${targetName} 공격! (피해량: ${damage}, 남은 HP: ${Math.max(0, target.hp)})`);
    }
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
    if (currentStage.enemyHp <= 0) {
        // 플레이어 승리
        stopBattleLoop();
        showBattleResult(true);
    }
    else if (currentStage.playerHp <= 0) {
        // 적 승리
        stopBattleLoop();
        showBattleResult(false);
    }
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
    // 개체 정리
    for (let i = currentStage.playerCreatures.length - 1; i >= 0; i--) {
        const creature = currentStage.playerCreatures[i];
        creature.isAlive = false;
        removeCreatureView(creature); // 뷰에서 제거
        currentStage.playerCreatures.splice(i, 1); // 상태 배열에서 제거
    }
    for (let i = currentStage.enemyCreatures.length - 1; i >= 0; i--) {
        const creature = currentStage.enemyCreatures[i];
        creature.isAlive = false;
        removeCreatureView(creature);
        currentStage.enemyCreatures.splice(i, 1);
    }
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
        lastAttackTime: 0,
        isAttackingVisual: false
    };

    // 스프라이트 경로 동적 할당
    newCreature.data.id = creatureId;
    newCreature.data.idle = `./img/battle/${creatureId}_idle.png`;
    newCreature.data.attack = `./img/battle/${creatureId}_attack.png`;

    currentStage.playerCreatures.push(newCreature);

    // 5. DOM 렌더링 요청
    renderCreature(newCreature, currentStage.playerCreatures);

    // 6. UI 동기화 이벤트 발송 (보관함 뷰 갱신)
    eventBus.emit(EVENTS.STORAGE_STATE_CHANGED, {});
}

/** 스테이지 데이터에서 적 소환 처리 */
function updateStageSpawner(deltaTime, gameState) {
    if (spawnQueue.length === 0) return;
    stageTimer += deltaTime;

    // 배열 순회 중 요소를 삭제하기 위해 역순 순회
    for (let i = spawnQueue.length - 1; i >= 0; i--) {
        const spawnTarget = spawnQueue[i];
        
        if (stageTimer >= spawnTarget.spawnTime) {
            const template = creaturesData[spawnTarget.id];
            
            if (template) {
                // 1. 인스턴스 생성
                const newEnemy = {
                    id: Date.now() + Math.random(),
                    data: template,
                    hp: template.maxHp,
                    isAlive: true,
                    isPlayer: false,
                    position: gameState.enemySpawnX,
                    element: document.createElement('div'),
                    isAttackingVisual: false
                };

                // (스프라이트 경로는 프로젝트 규칙에 맞게 맵핑)
                newEnemy.data.id = spawnTarget.id;
                newEnemy.data.idle = `./img/battle/${spawnTarget.id}_idle.png`;
                newEnemy.data.attack = `./img/battle/${spawnTarget.id}_battle.png`;

                // 2. 상태 반영 및 렌더링
                gameState.enemyCreatures.push(newEnemy);
                renderCreature(newEnemy, gameState.enemyCreatures);
            }

            // 3. 소환된 요소는 스케줄 큐에서 제거 (count 로직 삭제됨)
            spawnQueue.splice(i, 1);
        }
    }
}