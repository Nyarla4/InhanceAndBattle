// DOM 요소 캐싱 및 맵핑
// scripts/ui/uiElements.js

function getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Missing required element: #${id}`);
    }
    return element;
}

// 1. 화면(스크린) 컨테이너
export const titleScreen = getElement("title");
export const modeSelectorScreen = getElement("modeSelector"); // 추가
export const stageSelectorScreen = getElement("stageSelector");
export const stageScreen = getElement("stage"); // 인게임 전체 화면
export const upgradeScreen = getElement("upgrade");
export const settingsModal = getElement("settings");
export const networkLoadingModal = getElement("network-loading"); // 추가

// 2. 주요 제어 버튼들
export const stageBtn = getElement("stage-btn");       // 타이틀 -> 모드선택 이동 버튼
export const upgradeBtn = getElement("upgrade-btn");   // 타이틀 -> 강화실 이동 버튼
export const settingBtn = getElement("setting-btn");   // 설정 창 오픈 버튼
export const closeSettingsBtn = getElement("close-settings");
export const backBtn = getElement("back-btn");         // 강화실 -> 타이틀 공통 백버튼
export const modeBackBtn = getElement("mode-back-btn"); // 모드선택 -> 타이틀 백버튼
export const stageBackBtn = getElement("stage-back-btn"); // 스테이지선택 -> 모드선택 백버튼

// 3. 모드 선택 화면 버튼들
export const soloModeBtn = getElement("solo-mode-btn");
export const multiModeBtn = getElement("multi-mode-btn");

// 4. 인게임(전투) 내부 UI 구성요소
export const inStage = getElement("inStage");
export const field = getElement("field");
export const costSpan = getElement("cost");
export const playerBase = getElement("playerBase");
export const enemyBase = getElement("enemyBase");
export const playerHp = getElement("playerHp");
export const enemyHp = getElement("enemyHp");
export const creatureBtnContainer = getElement("creature-btn-list");
export const upgradeBtnContainer = getElement("upgrade-btn-list");

// 강화소 다중 그룹 UI 엘리먼트들
export const enhanceGroupList = getElement("enhance-group-list");
export const targetDisplay = getElement("display");
export const enhanceName = getElement("enhance-name");
export const currentLevel = getElement("current-level");
export const enhancePercentage = getElement("enhance-percentage");
export const enhanceRecord = getElement("enhance-record");
export const storageList = getElement("storage-list");

// 인게임(stage) 내 우측 '실시간 강화실' 전용 UI 엘리먼트 캐싱
export const forgeGroupList = getElement("forge-group-list");
export const forgeDisplay = getElement("forge-display");
export const forgeName = getElement("forge-name");
export const forgeLevel = getElement("forge-level");
export const forgePercentage = getElement("forge-percentage");
export const forgeRecord = getElement("forge-record");
export const forgeBtnContainer = getElement("forge-btn-list");
export const forgeStorageList = getElement("forge-storage-list");

export const stageListContainer = getElement("stage-list");