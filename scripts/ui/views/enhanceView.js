// scripts/ui/views/enhanceView.js

import * as UI from '../uiElements.js';
import { tryUpgrade } from '../../game/enhancement.js';
import { enhanceState, changeGroup, storeCurrentCreature, withdrawCreature } from '../../core/state.js';
import { eventBus } from '../../core/eventBus.js';
import { EVENTS, ENHANCE_GROUPS } from '../../core/config.js';

/* =================================================================
   1. [공통] 통합 뷰 리프레시 분기 함수
================================================================= */
/**
 * 상호작용 후 현재 켜져 있는 화면(메인 강화실 vs 인게임 스테이지)을 
 * 자동으로 감지하여 알맞은 UI를 리프레시합니다.
 */
function refreshActiveUI() {
    // 인게임 전체 화면(stageScreen)이 열려있고 hidden이 없다면
    if (UI.stageScreen && !UI.stageScreen.classList.contains('hidden')) {
        renderForgeUI();
    } else {
        renderEnhanceUI();
    }
}

let upBtn;
let forgeUpBtn;


/* =================================================================
   2. [메인 메뉴] 일반 강화소 초기화 및 렌더링 (기존 유지/보완)
================================================================= */
/** 메인 메뉴 강화소 진입 시 탭 버튼 및 핵심 액션 이벤트 최초 연결 */
export function initEnhanceView() {
    // 1. 상단 그룹 탭 버튼 목록 동적 빌드
    UI.enhanceGroupList.innerHTML = '';
    Object.keys(ENHANCE_GROUPS).forEach(groupKey => {
        const tabBtn = document.createElement('button');
        tabBtn.className = 'enhance-group-tab';
        tabBtn.textContent = ENHANCE_GROUPS[groupKey].name;
        tabBtn.style.padding = '8px 16px';
        tabBtn.style.fontSize = '14px';
        tabBtn.dataset.group = groupKey;
        
        tabBtn.addEventListener('click', () => {
            changeGroup(groupKey);
            renderEnhanceUI();
        });
        UI.enhanceGroupList.appendChild(tabBtn);
    });

    // 2. 하단 컨트롤러 액션 버튼 인터페이스 바인딩
    UI.upgradeBtnContainer.innerHTML = '';
    
    const goUpgradeBtn = document.createElement('button');
    goUpgradeBtn.id = 'action-upgrade-btn';
    goUpgradeBtn.textContent = '강화하기';
    goUpgradeBtn.style.cssText = 'padding:10px 20px; font-size:16px; font-weight:bold; background:#2ecc71; border:none; color:#fff; cursor:pointer; border-radius:4px;';
    goUpgradeBtn.addEventListener('click', () => {
        const groupKey = enhanceState.currentGroup;
        const result = tryUpgrade(groupKey);
        //alert(result.message);
        renderEnhanceUI();
    });
    upBtn = goUpgradeBtn;

    const storeBtn = document.createElement('button');
    storeBtn.id = 'action-store-btn';
    storeBtn.textContent = '보관하기';
    storeBtn.style.cssText = 'padding:10px 20px; font-size:16px; font-weight:bold; background:#9b59b6; border:none; color:#fff; cursor:pointer; border-radius:4px;';
    storeBtn.addEventListener('click', () => {
        const groupKey = enhanceState.currentGroup;
        const result = storeCurrentCreature(groupKey);
        //alert(result.message);
        renderEnhanceUI();
    });

    UI.upgradeBtnContainer.appendChild(goUpgradeBtn);
    UI.upgradeBtnContainer.appendChild(storeBtn);

    // 최초 1회 화면 렌더링 시동
    renderEnhanceUI();
}

/** 메인 메뉴 강화소 스크린 상태 리프레시 */
export function renderEnhanceUI() {
    const groupKey = enhanceState.currentGroup;
    const currentIdx = enhanceState.levels[groupKey];
    
    const groupData = ENHANCE_GROUPS[groupKey];
    const currentItem = groupData.items[currentIdx];
    const totalLevels = groupData.items.length;

    // 활성화된 탭 하이라이트 토글
    const tabs = UI.enhanceGroupList.querySelectorAll('.enhance-group-tab');
    tabs.forEach(btn => {
        if (btn.dataset.group === groupKey) {
            btn.style.background = '#3498db';
            btn.style.color = '#fff';
        } else {
            btn.style.background = '#ecf0f1';
            btn.style.color = '#333';
        }
    });

    if (!currentItem) {
        if (UI.targetDisplay instanceof HTMLImageElement) {
            UI.targetDisplay.src = '';
            UI.targetDisplay.alt = '비었음';
        }
        if (UI.enhanceName) UI.enhanceName.textContent = '비었음';
        if (UI.currentLevel) UI.currentLevel.textContent = '-';
        if (UI.enhancePercentage) UI.enhancePercentage.textContent = '확률: -';
        if (UI.dropPercentage) UI.dropPercentage.classList.add('hidden');
        
        if (upBtn instanceof HTMLButtonElement) {
            upBtn.disabled = true;
            upBtn.style.opacity = "0.5";
        }
        renderStorageUI();
        return;
    }

    // 핵심 레이아웃 노드 데이터 매핑
    if (UI.targetDisplay instanceof HTMLImageElement) {
        UI.targetDisplay.src = currentItem.img;
        UI.targetDisplay.alt = currentItem.name;
    }
    if (UI.enhanceName) UI.enhanceName.textContent = currentItem.name;
    
    const currentGrade = totalLevels - currentIdx;
    if (UI.currentLevel) UI.currentLevel.textContent = currentGrade.toString();
    if (UI.enhancePercentage) UI.enhancePercentage.textContent = `확률: ${currentItem.percent}%`;
    if (UI.dropPercentage) {
        if (currentItem.dropPercentage > 0) {
            if (UI.dropPercentage.classList.contains('hidden')) {
                UI.dropPercentage.classList.remove('hidden');
            }
            UI.dropPercentage.textContent = `하락 확률: ${currentItem.dropPercentage}%`;
        }
        else {
            if (!UI.dropPercentage.classList.contains('hidden')) {
                UI.dropPercentage.classList.add('hidden');
            }
        }
    }
    
    // 완강(최고등급 0번 인덱스) 도달 시 버튼 잠금 제어
    if (upBtn instanceof HTMLButtonElement) {
        upBtn.disabled = (currentIdx === 0);
        upBtn.style.opacity = (currentIdx === 0) ? "0.5" : "1";
    }

    // 메인 창고 목록 렌더링 호출
    renderStorageUI();
}

/** 메인 메뉴 전용 창고 리스트 그리개 */
function renderStorageUI() {
    if (!UI.storageList) return;
    UI.storageList.innerHTML = '';

    if (enhanceState.storage.length === 0) {
        UI.storageList.innerHTML = '<p style="color:#aaa; font-size:12px; margin:10px auto;">보관소 창고가 비어 있습니다.</p>';
        return;
    }

    enhanceState.storage.forEach((item) => {
        const card = document.createElement('div');
        card.style.cssText = 'background: #34495e; padding: 10px; border-radius: 6px; text-align: center; width: 90px; box-shadow: 0 2px 5px rgba(0,0,0,0.3);';
        card.innerHTML = `
            <img src="${item.img}" style="width: 40px; height: 40px; object-fit: contain; display:block; margin:0 auto 5px;">
            <div style="font-size: 11px; color: #fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.name}</div>
        `;

        const withdrawBtn = document.createElement('button');
        withdrawBtn.textContent = '꺼내기';
        withdrawBtn.style.cssText = 'margin-top: 5px; font-size: 10px; padding: 2px 6px; background: #e67e22; border: none; color: white; cursor: pointer; border-radius:3px;';
        withdrawBtn.addEventListener('click', () => {
            const result = withdrawCreature(item.id);
            //alert(result.message);
            renderEnhanceUI(); // 리프레시
        });
        
        card.appendChild(withdrawBtn);
        UI.storageList.appendChild(card);
    });
}


/* =================================================================
   3. [인게임 전용] 실시간 강화실 (`forge-`) 시스템 (신규 통합)
================================================================= */
/** * 인게임(stage) 스크린 전입 직후 최초 1회 실행하는 초기화 함수.
 * 우측 패널의 그룹 탭과 컨트롤러 버튼 이벤트를 개별 바인딩합니다.
 */
export function initForgeView() {
    if (!UI.forgeGroupList || !UI.forgeBtnContainer) return;

    // 1. 좌측 패널 상단 그룹 탭 버튼 목록 빌드
    UI.forgeGroupList.innerHTML = '';
    Object.keys(ENHANCE_GROUPS).forEach(groupKey => {
        const tabBtn = document.createElement('button');
        tabBtn.className = 'forge-group-tab';
        tabBtn.textContent = ENHANCE_GROUPS[groupKey].name;
        tabBtn.style.padding = '6px 12px';
        tabBtn.style.fontSize = '12px';
        tabBtn.style.cursor = 'pointer';
        tabBtn.dataset.group = groupKey;

        tabBtn.addEventListener('click', () => {
            changeGroup(groupKey);
            renderForgeUI();
        });
        UI.forgeGroupList.appendChild(tabBtn);
    });

    // 2. 좌측 패널 중앙 컨트롤러 액션 버튼 동적 배치
    UI.forgeBtnContainer.innerHTML = '';

    const forgeUpgradeBtn = document.createElement('button');
    forgeUpgradeBtn.id = 'forge-action-upgrade-btn';
    forgeUpgradeBtn.textContent = '실시간 강화';
    forgeUpgradeBtn.style.cssText = 'padding:8px; font-size:13px; font-weight:bold; background:#2ecc71; border:none; color:#fff; cursor:pointer; border-radius:4px;';
    forgeUpgradeBtn.addEventListener('click', () => {
        const groupKey = enhanceState.currentGroup;
        const result = tryUpgrade(groupKey);
        console.log(result.message);
        renderForgeUI();
    });
    forgeUpBtn = forgeUpgradeBtn;

    const forgeStoreBtn = document.createElement('button');
    forgeStoreBtn.id = 'forge-action-store-btn';
    forgeStoreBtn.textContent = '보관하기';
    forgeStoreBtn.style.cssText = 'padding:8px; font-size:13px; font-weight:bold; background:#9b59b6; border:none; color:#fff; cursor:pointer; border-radius:4px;';
    forgeStoreBtn.addEventListener('click', () => {
        const groupKey = enhanceState.currentGroup;
        const result = storeCurrentCreature(groupKey);
        console.log(result.message);
        renderForgeUI();
    });

    UI.forgeBtnContainer.appendChild(forgeUpgradeBtn);
    UI.forgeBtnContainer.appendChild(forgeStoreBtn);

    renderForgeUI();
}

/** 인게임 실시간 강화실 패널 스크린 데이터 바인딩 및 갱신 */
function renderForgeUI() {
    if (!UI.forgeGroupList) return;

    const groupKey = enhanceState.currentGroup;
    const currentIdx = enhanceState.levels[groupKey];

    const groupData = ENHANCE_GROUPS[groupKey];
    const currentItem = groupData.items[currentIdx];
    const totalLevels = groupData.items.length;

    const tabs = UI.forgeGroupList.querySelectorAll('.forge-group-tab');
    tabs.forEach(btn => {
        if (btn.dataset.group === groupKey) {
            btn.style.background = '#f1c40f';
            btn.style.color = '#000';
        } else {
            btn.style.background = '#34495e';
            btn.style.color = '#fff';
        }
    });

    if (!currentItem) {
        if (UI.forgeDisplay instanceof HTMLImageElement) {
            UI.forgeDisplay.src = '';
            UI.forgeDisplay.alt = '비었음';
        }
        if (UI.forgeName) UI.forgeName.textContent = '비었음';
        if (UI.forgeLevel) UI.forgeLevel.textContent = '-';

        if (forgeUpBtn instanceof HTMLButtonElement) {
            forgeUpBtn.disabled = true;
            forgeUpBtn.style.opacity = "0.5";
        }
        renderForgeStorageUI();
        return;
    }

    if (UI.forgeDisplay instanceof HTMLImageElement) {
        UI.forgeDisplay.src = currentItem.img;
        UI.forgeDisplay.alt = currentItem.name;
    }
    if (UI.forgeName) UI.forgeName.textContent = currentItem.name;

    const currentGrade = totalLevels - currentIdx;
    if (UI.forgeLevel) UI.forgeLevel.textContent = `${currentGrade}강 (${currentIdx + 1}위)`;

    if (forgeUpBtn instanceof HTMLButtonElement) {
        forgeUpBtn.disabled = (currentIdx === 0);
        forgeUpBtn.style.opacity = (currentIdx === 0) ? "0.5" : "1";
    }

    renderForgeStorageUI();
}

/** 인게임 전용 실시간 보관함 창고 그리기 (★소환 연동 및 영구 소모 뼈대 탑재) */
function renderForgeStorageUI() {
    if (!UI.forgeStorageList) return;
    UI.forgeStorageList.innerHTML = '';

    if (enhanceState.storage.length === 0) {
        UI.forgeStorageList.innerHTML = '<p style="color:#7f8c8d; font-size:11px; margin:10px auto;">보관된 개체가 없습니다.</p>';
        return;
    }

    enhanceState.storage.forEach((item) => {
        const card = document.createElement('div');
        // 클릭해서 즉시 전장에 내보낼 수 있는 느낌을 주도록 인터랙티브 스타일링 적용
        card.style.cssText = `
            background: #2c3e50; border: 1px solid #34495e; padding: 6px; 
            border-radius: 6px; text-align: center; width: 75px; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.5); cursor: pointer; transition: transform 0.1s;
        `;
        card.title = "클릭 시 코스트를 소모해 전장에 소환합니다!";

        card.innerHTML = `
            <img src="${item.img}" style="width: 35px; height: 35px; object-fit: contain; display:block; margin:0 auto 3px;">
            <div style="font-size: 10px; color: #f1c40f; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:bold;">${item.name}</div>
            <div style="font-size: 9px; color: #2ecc71; margin-top:2px;">소환(소모)</div>
        `;

        // 마우스 호버 효과
        card.addEventListener('mouseenter', () => card.style.transform = 'scale(1.05)');
        card.addEventListener('mouseleave', () => card.style.transform = 'scale(1)');

        // 🔥 [핵심 기획 반영] 인게임 보관함 개체 클릭 -> 소환 및 소모 처리
        card.addEventListener('click', () => {
            eventBus.emit(EVENTS.REQ_SUMMON,{itemId:item.id});
        });

        UI.forgeStorageList.appendChild(card);
    });
}

// 인게임 세션 중 데이터 변경 흐름을 감지하는 리스너 등록
export function initBattleStorageListener() {
    eventBus.on(EVENTS.STORAGE_STATE_CHANGED, () => {
        // 앞서 구현한 현재 활성화된 보관함 화면(인게임 vs 메인) 분기 업데이트 함수 호출
        renderForgeStorageUI(); 
    });
}
