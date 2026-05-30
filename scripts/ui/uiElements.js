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
export const titleScreen = getElement("title-screen");
export const modeSelectorScreen = getElement("modeSelector-screen");
export const stageSelectorScreen = getElement("stageSelector-screen");
export const stageScreen = getElement("stage-screen"); // 인게임 전체 화면
export const upgradeScreen = getElement("upgrade-screen");
export const dictionaryScreen = getElement("dictionary-screen");
export const settingsModal = getElement("settings-modal");
export const networkLoadingModal = getElement("network-loading");

// 2. 주요 제어 버튼들
export const stageBtn = getElement("stage-btn");       // 타이틀 -> 모드선택 이동 버튼
export const upgradeBtn = getElement("upgrade-btn");   // 타이틀 -> 강화실 이동 버튼
export const dictionaryBtn = getElement("dictionary-btn");   // 타이틀 -> 도감 이동 버튼
export const settingBtn = getElement("setting-btn");   // 설정 창 오픈 버튼
export const closeSettingsBtn = getElement("close-settings");
export const backBtn = getElement("back-btn");         // 강화실 -> 타이틀 공통 백버튼
export const modeBackBtn = getElement("mode-back-btn"); // 모드선택 -> 타이틀 백버튼
export const stageBackBtn = getElement("stage-back-btn"); // 스테이지선택 -> 모드선택 백버튼
export const dictionaryBackBtn = getElement("dictionary-back-btn"); // 도감 -> 모드선택 백버튼

// 3. 모드 선택 화면 버튼들
export const soloModeBtn = getElement("solo-mode-btn");
export const multiModeBtn = getElement("multi-mode-btn");
export const stageList = getElement("stage-list");

// 4. 인게임(전투) 내부 UI 구성요소
export const inStage = getElement("battle-field-container");
export const field = getElement("field");
export const playerBase = getElement("playerBase");
export const enemyBase = getElement("enemyBase");
export const playerBaseHp = getElement("playerBaseHp");
export const enemyBaseHp = getElement("enemyBaseHp");
export const upgradeBtnContainer = getElement("upgrade-btn-list");

// 강화소 다중 그룹 UI 엘리먼트들
export const enhanceGroupList = getElement("enhance-group-list");
export const targetDisplay = getElement("display");
export const enhanceName = getElement("enhance-name");
export const currentLevel = getElement("current-level");
export const enhancePercentage = getElement("enhance-percentage");
export const dropPercentage = getElement("drop-percentage");
export const storageList = getElement("storage-list");

// 인게임(stage) 내 우측 '실시간 강화실' 전용 UI 엘리먼트 캐싱
export const forgeGroupList = getElement("forge-group-list");
export const forgeDisplay = getElement("forge-display");
export const forgeName = getElement("forge-name");
export const forgeLevel = getElement("forge-level");
export const forgeBtnContainer = document.getElementById('forge-btn-container');
export const forgeStorageList = getElement("forge-storage-list");


export const loadingText = getElement("loading-text");

// 결과창 엘리먼트
export const battleResultPanel = document.getElementById('battle-result-panel');
export const battleResultMessage = document.getElementById('battle-result-message');
export const resultStageBtn = document.getElementById('result-stage-btn');
export const resultTitleBtn = document.getElementById('result-title-btn');

// 일시정지 엘리먼트
export const pauseBattleBtn = document.getElementById('pause-battle-btn');
export const pauseModal = document.getElementById('pause-modal');
export const resumeBattleBtn = document.getElementById('resume-battle-btn');
export const exitBattleBtn = document.getElementById('exit-battle-btn');