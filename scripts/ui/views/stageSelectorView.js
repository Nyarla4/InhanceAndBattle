import * as UI from '../uiElements.js';
import { sceneManager } from '../sceneManager.js';
import { startBattle } from '../../game/battle.js';
import stageData from '../../../json/stageData.json' with { type: 'json' };

export function renderStageList() {
    if (!UI.stageList) return;
    UI.stageList.innerHTML = '';

    stageData.stages.forEach((stage) => {
        const btn = document.createElement('button');
        btn.className = 'stage-select-btn';
        btn.innerHTML = `<strong>${stage.name}</strong> (HP: ${stage.enemyBaseHp})`;
        
        btn.addEventListener('click', () => {
            sceneManager.showScreen(UI.stageScreen); // 배틀 화면 이동
            startBattle(stage); // 배틀 루프 초기화 및 시작
        });
        UI.stageList.appendChild(btn);
    });
}