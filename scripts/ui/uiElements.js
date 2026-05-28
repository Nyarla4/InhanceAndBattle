// DOM 요소 캐싱 및 맵핑
// scripts/ui/uiElements.js

function getElement(id) {
    const element = document.getElementById(id);

    if (!element) {
        throw new Error(`Missing required element: #${id}`);
    }

    return element;
}

export const titleScreen = getElement<HTMLDivElement>("title");
export const stageBtn = getElement<HTMLButtonElement>("stage-btn");
export const stageScreen = getElement<HTMLDivElement>("stage");
export const creatureBtnContainer = getElement<HTMLDivElement>("creature-btn-list");
export const stageSelector = getElement<HTMLDivElement>("stageSelector");
export const inStage = getElement<HTMLDivElement>("inStage");
export const costSpan = getElement<HTMLSpanElement>("cost");
export const field = getElement<HTMLDivElement>("field");
export const enemyBase = getElement<HTMLDivElement>("enemyBase");
export const playerBase = getElement<HTMLDivElement>("playerBase");
export const enemyHp = getElement<HTMLDivElement>("enemyHp");
export const playerHp = getElement<HTMLDivElement>("playerHp");
export const upgradeBtn = getElement<HTMLButtonElement>("upgrade-btn");
export const upgradeScreen = getElement<HTMLDivElement>("upgrade");
export const upgradeBtnContainer = getElement<HTMLDivElement>("upgrade-btn-list");
export const backBtn = getElement<HTMLButtonElement>("back-btn"); // 스테이지 선택>타이틀, 업그레이드>타이틀 공통
export const settingBtn = getElement<HTMLButtonElement>("setting-btn");
export const settingsModal = getElement<HTMLDivElement>("settings");
export const closeSettingsBtn = getElement<HTMLButtonElement>("close-settings");