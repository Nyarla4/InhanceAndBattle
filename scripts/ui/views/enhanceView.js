// scripts/ui/views/enhanceView.js
import * as UI from '../uiElements.js';

/** 강화 화면 인터페이스 데이터 바인딩 및 업데이트 담당 */
export function updateEnhanceUI(currentLevel, imgUrl) {
    const levelSpan = document.getElementById('current-level');
    const displayImg = document.getElementById('nezming-display');
    
    if (levelSpan) levelSpan.textContent = currentLevel;
    if (displayImg) displayImg.src = imgUrl;
}