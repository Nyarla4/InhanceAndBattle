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

/** 현재 프레임 ID(루프) */
let animationFrameId = null;
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
            if (socketClient.isConnected) { // 연결된 경우
                socketClient.sendBaseDamage(damage);
            }
        });
        eventBus.on(EVENTS.RES_BASE_DAMAGE, ({ damage }) => { // 상대의 "기지 공격" 요청의 반응
            if (!getGameState() || !isBattleRunning) return;
            setPlayerHp(getGameState().playerHp - damage);
            renderBaseHp(getGameState(), playerMaxHp, enemyMaxHp);
            checkGameOver();
        });
        eventBus.on(EVENTS.REQ_DAMAGE, ({targetId, damage})=> { // 자신의 "개체 공격" 요청
            if (socketClient.isConnected) { // 연결된 경우
                socketClient.sendDamage(targetId, damage);
            }
        })
        eventBus.on(EVENTS.RES_DAMAGE, ({ targetId, damage }) => { // 상대의 "개체 공격" 요청의 반응
            if (!getGameState() || !isBattleRunning) return;
            var playerCreatures = [...getGameState().playerCreatures];
            var target = playerCreatures.find(f => f.id === targetId);
            target.hp -= damage;
            if (target.hp <= 0) {
                target.isAlive = false;
                removeCreatureView(target);
                playerCreatures.splice(i, 1);
            }
            setPlayerCreature(playerCreatures);
        })
        eventBus.on(EVENTS.OPPONENT_LEFT, handleOpponentLeft);

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

/** 상대 탈주 처리(승리 처리) */
function handleOpponentLeft() {
    stopBattleLoop();
    alert("상대방이 게임에서 퇴장했습니다. 당신의 승리입니다!");
    showBattleResult(true, isMulti);
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

        if (isPaused && !isMulti) { // 일시정지 중 연산 차단 및 시간 동기화(싱글에서만)
            lastFrameTime = now; // 델타타임 누적 차단
            animationFrameId = requestAnimationFrame(loop);
            return;
        } // 멀티에서는 일시정지를 눌러도 modal만 나오고 정지되지 않음

        // 델타타임 처리
        const deltaTime = now - lastFrameTime;
        lastFrameTime = now;

        if(!isMulti) // 싱글 플레이
            // 적군 스폰 스케줄 처리
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
    // 현재 세션의 개체들
    const players = [...getGameState().playerCreatures];
    const enemies = [...getGameState().enemyCreatures];
    const allCreatures = [...players, ...enemies];

    // 각 개체에 대한 처리
    allCreatures.forEach(creature => {
        if (!creature.isAlive) return; // 죽었으면 행동 없음

        // 후딜(공격 마무리, 공격 이미지 끝나면 이동가능 처리)
        if (creature.isAttackingVisual) {
            const duration = creature.data.attackDuration || 200;

            if (now - creature.lastAttackTime >= duration) {
                creature.isAttackingVisual = false;
                setCreatureIdleView(creature); // 뷰 레이어에 idle 상태 복구 요청
            }
        }

        // 적 개체
        const opponents = creature.isPlayer ? enemies : players;

        // 사거리 내 대상
        const target = findTargetInRange(creature, opponents); // 공격 대상
        const isBaseInRange = checkBaseInRange(creature); // 기지 공격 가능 여부
        const isTargetExist = target.length > 0; // 공격 대상 존재여부
        if (isTargetExist || isBaseInRange) { // 대상이 있는 경우: 이동 중지 및 쿨타임 체크
            // 마지막 공격 시간 undefine이나 null이면 0으로 초기화
            if (!creature.lastAttackTime) creature.lastAttackTime = 0;

            if (now - creature.lastAttackTime >= creature.data.attackTerm) { // 공격 쿨이 돌았음

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

    // 처리된 내용 세션에 적용
    setPlayerCreature(players);
    setEnemyCreature(enemies);
}

/** 기본 레이아웃 처리 */
function applyBaseLayout(playerSide) {
    if (playerSide === 'left') { // 멀티에서 왼쪽에 위치하는 경우
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

        if (distance <= attacker.data.attackRange) { // 사거리 내인 경우
            targets.push(opponent); // 공격 대상으로 넣는다
            if (!attacker.data.canAttackMultipleTargets) // 다중 공격이 아닌 경우
                return targets; // 첫 번째만 반환
        }
    }
    return targets; // 공격 대상 반환
}

/** 기지가 사거리 내에 있는지 확인 */
function checkBaseInRange(creature) {
    // 아군의 목표는 적 기지 좌표(enemySpawnX), 적군의 목표는 아군 기지 좌표(playerSpawnX)
    const targetBasePos = creature.isPlayer ? getGameState().enemySpawnX : getGameState().playerSpawnX;

    // 절대값으로 거리 연산
    const distance = Math.abs(creature.position - targetBasePos);

    return distance <= creature.data.attackRange;
}

/** 기지 타격 처리 (상태값 변경 및 콘솔 출력)
 @param creature  공격자
 */
function attackBase(creature) {
    const damage = creature.data.attackDamage;

    if (creature.isPlayer) {
        setEnemyHp(getGameState().enemyHp - damage);
        if (isMulti)
            eventBus.emit(EVENTS.REQ_BASE_DAMAGE, { damage: damage });
    } else {
        if (!isMulti) { // 멀티가 아닌 경우
            setPlayerHp(getGameState().playerHp - damage);
        }
    }
    renderBaseHp(getGameState(), playerMaxHp, enemyMaxHp);
}

/** 대상 공격 */
function attackTarget(attacker, targets) {
    const damage = attacker.data.attackDamage;
    if(attacker.isPlayer) { // 플레이어가 때릴 때
        for (let idx = 0; idx < targets.length; idx++) {
            const target = targets[idx]
            target.hp -= damage;
            if (isMulti) {
                eventBus.emit(EVENTS.REQ_DAMAGE, {targetId: target.id, damage: damage });
            }
        }
    }
    else { // 플레이어가 맞을 때
        if (!isMulti) {
            for (let idx = 0; idx < targets.length; idx++) {
                const target = targets[idx]
                target.hp -= damage;
            }
        }
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

/** 배틀 루프 종료 */
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
    // 세션 정리
    clearBattleSession();
}
