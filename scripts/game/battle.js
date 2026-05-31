// scripts/game/battle.js

import { eventBus } from "../core/eventBus.js";
import { createBattleSession, clearBattleSession, getGameState, setPlayerHp, setEnemyHp, setPlayerCreature, setEnemyCreature } from "../core/state.js";
import { initForgeView } from "../ui/views/enhanceView.js";
import { EVENTS } from "../core/config.js";
import { initBattleResult, removeCreatureView, renderBaseHp, setCreatureAttackView, setCreatureIdleView, showBattleResult, updateCreatureView } from '../ui/views/gameView.js';
import { initStageSpawnQueue, updateStageSpawner } from './summon.js';
import { socketClient } from "../network/socketClient.js";
import { field, playerBase, enemyBase, stageScreen, stageSelectorScreen, titleScreen, resultStageBtn, resultTitleBtn, pauseModal, pauseBattleBtn, resumeBattleBtn, exitBattleBtn, multiLobbyScreen } from "../ui/uiElements.js";
import { sceneManager } from "../ui/sceneManager.js";

/** 전투 중 여부 */
let isBattleRunning = false;
export function IsBattleRunning() { return isBattleRunning; }
/** 이벤트 중복 등록 방지용 플래그 */
let isEventBound = false;
/** deltaTime 계산용 */
let lastFrameTime = 0;

let animationFrameId = null; // 루프 프레임 ID
let isMulti = false; // 멀티 여부
let playerMaxHp = 0; // 플레이어 기지 HP
let enemyMaxHp = 0; // 적대측 기지 HP

let isPaused = false; // 일시정지중 여부

/** 전투 초기화 및 시작 인터페이스 (스테이지 선택 및 멀티에서 양측 준비시 호출) */
export function startBattle(stageData) {
    applyLandscapeLock(); // 가로화면 처리

    // 뷰 레이어의 치수 수집
    const fieldEl = field || { clientWidth: 800 };
    const pBaseEl = playerBase || { clientWidth: 100 };
    const eBaseEl = enemyBase || { clientWidth: 100 };

    const dimensions = {
        width: fieldEl.clientWidth,
        playerBaseWidth: pBaseEl.clientWidth,
        enemyBaseWidth: eBaseEl.clientWidth
    };

    // 수집한 치수를 바탕으로 gameState 신규 생성
    createBattleSession(stageData, dimensions);
    isMulti = getGameState().isMulti;

    // 기지 레이아웃 설정
    applyBaseLayout(getGameState().playerSide);

    // 2. 이벤트 바인딩 (최초 1회 등록)
    if (!isEventBound) {
        // 멀티 처리
        eventBus.on(EVENTS.REQ_BASE_DAMAGE, ({ damage }) => { // 자신의 "기지 공격" 요청
            if (socketClient.isConnected) { // 멀티인 경우
                socketClient.sendBaseDamage(damage);
            }
        });
        eventBus.on(EVENTS.RES_BASE_DAMAGE, ({ damage }) => { // 상대의 "기지 공격" 요청의 반응
            if (!getGameState() || !isBattleRunning) return;
            setPlayerHp(getGameState().playerHp - damage);
            renderBaseHp(getGameState(), playerMaxHp, enemyMaxHp);
            checkGameOver();
        });

        // 일시정지 버튼 처리
        pauseBattleBtn.addEventListener('click', () => {
            pause(true);
        });
        resumeBattleBtn.addEventListener('click', () => {
            pause(false);
        });
        
        isEventBound = true;
    }

    // 결과창 버튼 처리
    if (getGameState() && isMulti) { // 멀티인 경우
        resultStageBtn.textContent = "대기실로 이동";
        resultStageBtn.addEventListener('click', () => {
            sceneManager.showScreen(multiLobbyScreen);
        }, { once: true });

        exitBattleBtn.addEventListener('click', () => {
            pause(false);
            stopBattleLoop();
            sceneManager.showScreen(multiLobbyScreen);
        }, { once: true });

        eventBus.on(EVENTS.MULTIPLAYER_OPPONENT_LEFT, handleOpponentLeft);
    }
    else { // 싱글인 경우
        resultStageBtn.textContent = "스테이지 선택";
        resultStageBtn.addEventListener('click', () => {
            sceneManager.showScreen(stageSelectorScreen);
        }, { once: true });

        exitBattleBtn.addEventListener('click', () => {
            pause(false);
            stopBattleLoop();
            sceneManager.showScreen(stageSelectorScreen);
        }, { once: true });
    }

    // enhanceView 초기화
    initForgeView();
    // gameView 초기화
    initBattleResult();
    // summon 초기화
    initStageSpawnQueue(stageData.enemies);

    playerMaxHp = getGameState().playerMaxHp;
    enemyMaxHp = stageData.enemyBaseHp || 1000;
    renderBaseHp(getGameState(), playerMaxHp, enemyMaxHp);

    // 일시정지 해제(초기화)
    pause(false);

    // 3. 전투 루프 시작    
    startBattleLoop();
}

/** 일시정지 처리
 * isPaused 및 모달 처리
 * @param {boolean} isPause - 정지여부(true: 일시정지, false: 일시정지해제)
 */
function pause(isPause) {
    if(isPause) {
        isPaused = true;
        if (pauseModal.classList.contains('hidden')) {
            pauseModal.classList.remove('hidden');
        }
    }
    else {
        isPaused = false;
        if (!pauseModal.classList.contains('hidden')) {
            pauseModal.classList.add('hidden');
        }
    }
}

// 탈주 처리
function handleOpponentLeft() {
    if(!isBattleRunning) return;

    stopBattleLoop();

    alert("상대방이 게임에서 퇴장했습니다. 당신의 승리입니다!");
    showBattleResult(true, true);

    // 등록했던 이벤트 해제 (메모리 누수 방지)
    eventBus.off("MULTIPLAYER_OPPONENT_LEFT", handleOpponentLeft);
}

/** 모바일에서 전체화면 가로 처리 */
function applyLandscapeLock() {
    const isMobile = window.matchMedia('(pointer: coarse)').matches;
    if (!isMobile) return;

    const docEl = document.documentElement;
    const requestFullscreen = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.msRequestFullscreen;
    
    if (requestFullscreen) {
        requestFullscreen.call(docEl).then(() => {
            // 전체화면 진입 후 가로방향 고정 시도
            if (screen.orientation && screen.orientation.lock) {
                screen.orientation.lock("landscape")
                    .catch((err) => {
                        console.warn("화면 방향 잠금 실패:", err);
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
        if (!isBattleRunning || !getGameState()) return;

        if (isPaused) { // 일시정지 중 연산 차단 및 시간 동기화
            lastFrameTime = now; // 델타타임 누적 차단
            animationFrameId = requestAnimationFrame(loop);
            return;
        }

        // 델타타임
        const deltaTime = now - lastFrameTime;
        lastFrameTime = now;

        // 2. 적군 스폰 스케줄 처리 (흐름: 데이터 상태 갱신)
        updateStageSpawner(deltaTime, getGameState());

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
    const players = getGameState().playerCreatures;
    const enemies = getGameState().enemyCreatures;
    const allCreatures = [...players, ...enemies];

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

            const direction = creature.isPlayer ? getGameState().playerDirection : getGameState().enemyDirection;
            creature.position += moveDistance * direction;
        }
    });
}

function applyBaseLayout(playerSide) {
    if (playerSide === 'left') {
        playerBase.style.left = '0';
        playerBase.style.right = 'auto';
        playerBase.style.borderRadius = '0 20px 0 0';
        enemyBase.style.left = 'auto';
        enemyBase.style.right = '0';
        enemyBase.style.borderRadius = '20px 0 0 0';
        return;
    }

    playerBase.style.left = 'auto';
    playerBase.style.right = '0';
    playerBase.style.borderRadius = '20px 0 0 0';
    enemyBase.style.left = '0';
    enemyBase.style.right = 'auto';
    enemyBase.style.borderRadius = '0 20px 0 0';
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
    const targetBasePos = creature.isPlayer ? getGameState().enemySpawnX : getGameState().playerSpawnX;

    // 절대값으로 거리 연산
    const distance = Math.abs(creature.position - targetBasePos);

    return distance <= creature.data.attackRange;
}

/** 기지 타격 처리 (상태값 변경 및 콘솔 출력) */
function attackBase(creature) {
    const damage = creature.data.attackDamage;

    if (creature.isPlayer) {
        setEnemyHp(getGameState().enemyHp - damage);
        eventBus.emit(EVENTS.REQ_BASE_DAMAGE, { damage: damage });
    } else {
        if (!isMulti) { // 멀티가 아닌 경우
            setPlayerHp(getGameState().playerHp - damage);
        }
    }
    renderBaseHp(getGameState(), playerMaxHp, enemyMaxHp);
}

/** 공격 연산 처리 및 콘솔 출력 */
function attackTarget(attacker, targets) {
    const damage = attacker.data.attackDamage;
    for (let idx = 0; idx < targets.length; idx++) {
        const target = targets[idx]
        target.hp -= damage;
        // 멀티의 경우 이것도 기지 타격처럼 eventBus로 처리해야 양측에서 개체 처리 동기화가 잘 될듯

        const attackerName = `[${attacker.isPlayer ? '아군' : '적군'}] ${attacker.data.name}`;
        const targetName = `[${target.isPlayer ? '아군' : '적군'}] ${target.data.name}`;

        console.log(`⚔️ ${attackerName} -> ${targetName} 공격! (피해량: ${damage}, 남은 HP: ${Math.max(0, target.hp)})`);
    }
}

/** 체력이 0 이하인 개체 처리 */
function cleanupDeadCreatures() {
    var playerCreatures = [...getGameState().playerCreatures];
    // 아군 정리
    for (let i = playerCreatures.length - 1; i >= 0; i--) {
        const creature = playerCreatures[i];
        if (creature.hp <= 0) {
            creature.isAlive = false;
            removeCreatureView(creature); // 뷰에서 제거
            playerCreatures.splice(i, 1); // 상태 배열에서 제거
        }
    }
    setPlayerCreature(playerCreatures);

    var enemyCreatures = [...getGameState().enemyCreatures];
    // 적군 정리 (동일 로직)
    for (let i = enemyCreatures.length - 1; i >= 0; i--) {
        const creature = enemyCreatures[i];
        if (creature.hp <= 0) {
            creature.isAlive = false;
            removeCreatureView(creature);
            enemyCreatures.splice(i, 1);
        }
    }
    setEnemyCreature(enemyCreatures);
}

/** 승패 판정 */
function checkGameOver() {
    if (getGameState().enemyHp <= 0) {
        // 플레이어 승리
        stopBattleLoop();
        showBattleResult(true, isMulti);
    }
    else if (getGameState().playerHp <= 0) {
        // 적 승리
        stopBattleLoop();
        showBattleResult(false, isMulti);
    }
}

/** 데이터 변경 결과를 화면에 동기화 */
function syncView() {
    const allCreatures = [...getGameState().playerCreatures, ...getGameState().enemyCreatures];
    allCreatures.forEach(creature => {
        // gameView.js의 함수를 호출하여 화면 갱신
        updateCreatureView(creature);
    });
}

export function stopBattleLoop() {
    isBattleRunning = false;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    // 개체 정리
    var playerCreatures = [...getGameState().playerCreatures];
    for (let i = playerCreatures.length - 1; i >= 0; i--) {
        const creature = playerCreatures[i];
        creature.isAlive = false;
        removeCreatureView(creature); // 뷰에서 제거
        playerCreatures.splice(i, 1); // 상태 배열에서 제거
    }
    setPlayerCreature(playerCreatures);
    var enemyCreatures = [...getGameState().enemyCreatures];
    for (let i = enemyCreatures.length - 1; i >= 0; i--) {
        const creature = enemyCreatures[i];
        creature.isAlive = false;
        removeCreatureView(creature);
        enemyCreatures.splice(i, 1);
    }
    setEnemyCreature(enemyCreatures);
    clearBattleSession();
}
