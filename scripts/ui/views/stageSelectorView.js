import * as UI from '../uiElements.js';
import { sceneManager } from '../sceneManager.js';
import stageData from '../../../json/stageData.json' with { type: 'json' };
import { startBattle } from '../../game/battle.js';

export function renderStageList() {
    if (!UI.stageList) return;
    UI.stageList.innerHTML = '';

    stageData.stages.forEach((stage) => {
        const btn = document.createElement('button');
        btn.className = 'stage-select-btn';
        btn.innerHTML = `<strong>${stage.name}</strong>`;
        
        btn.addEventListener('click', () => {
            sceneManager.showScreen(UI.stageScreen); // 배틀 화면 이동
            stage.isMulti = false;
            startBattle(stage);
        });
        UI.stageList.appendChild(btn);
    });
}