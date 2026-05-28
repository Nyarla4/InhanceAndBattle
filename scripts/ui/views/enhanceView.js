// scripts/ui/views/enhanceView.js

import * as UI from '../uiElements.js';
import { ENHANCE_GROUPS, enhanceState, changeGroup, tryUpgrade, resetGroupProgress } from '../../game/enhancement.js';

/** 강화소 진입 시 탭 버튼 및 핵심 액션 이벤트 최초 연결 */
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
    goUpgradeBtn.addEventListener('click', () => {
        tryUpgrade();
        renderEnhanceUI();
    });

    const goResetBtn = document.createElement('button');
    goResetBtn.id = 'action-reset-btn';
    goResetBtn.textContent = '초기화';
    goResetBtn.style.backgroundColor = '#7f8c8d';
    goResetBtn.style.boxShadow = '0 4px 0 #95a5a6';
    goResetBtn.addEventListener('click', () => {
        if (confirm('정말 이 대상의 강화 기록을 초기화하시겠습니까? (최고기록은 유지됩니다)')) {
            resetGroupProgress();
            renderEnhanceUI();
        }
    });

    UI.upgradeBtnContainer.appendChild(goUpgradeBtn);
    UI.upgradeBtnContainer.appendChild(goResetBtn);

    // 3. 첫 초기 화면 렌더링 가동
    renderEnhanceUI();
}

/** 데이터 모델의 최신 상태를 화면 엘리먼트들에 반영 */
export function renderEnhanceUI() {
    const groupKey = enhanceState.currentGroup;
    const currentIdx = enhanceState.levels[groupKey];
    const bestIdx = enhanceState.bestRecords[groupKey];
    
    const groupData = ENHANCE_GROUPS[groupKey];
    const currentItem = groupData.items[currentIdx];
    
    const totalLevels = groupData.items.length;

    // 1. 선택된 상단 그룹 탭 버튼 활성화 시각 효과 부여
    const tabs = UI.enhanceGroupList.querySelectorAll('.enhance-group-tab');
    tabs.forEach(tab => {
        if (tab.dataset.group === groupKey) {
            tab.style.backgroundColor = '#f1c40f'; // 노란색으로 활성화 표시
            tab.style.color = '#1a1a1a';
        } else {
            tab.style.backgroundColor = '#e74c3c'; // 기본 비활성 색상
            tab.style.color = '#ffffff';
        }
    });

    // 2. 중앙 이미지 카드 정보 데이터 매핑
    // 인덱스가 낮을수록 최종 고성능이므로 (전체 개수 - 현재 인덱스)로 등급 역산 표기
    const calculatedLevel = totalLevels - currentIdx;
    const calculatedBest = totalLevels - bestIdx;

    UI.targetDisplay.src = currentItem.img;
    UI.targetDisplay.alt = currentItem.name;
    UI.enhanceName.textContent = currentItem.name;
    UI.currentLevel.textContent = `${calculatedLevel}강 (순위: ${currentIdx + 1}위)`;
    UI.enhancePercentage.textContent = `강화 성공 확률: ${currentItem.percent}%`;
    UI.enhanceRecord.textContent = `최고 기록: ${calculatedBest}강 (${bestIdx + 1}위)`;

    // 3. 만약 완강(인덱스 0) 상태라면 강화하기 버튼 잠금
    const upgradeButton = document.getElementById('action-upgrade-btn');
    if (upgradeButton) {
        if (currentIdx === 0) {
            upgradeButton.textContent = '최대 강화 도달';
            upgradeButton.disabled = true;
            upgradeButton.style.opacity = '0.5';
            upgradeButton.style.cursor = 'not-allowed';
        } else {
            upgradeButton.textContent = '강화하기';
            upgradeButton.disabled = false;
            upgradeButton.style.opacity = '1';
            upgradeButton.style.cursor = 'pointer';
        }
    }
}