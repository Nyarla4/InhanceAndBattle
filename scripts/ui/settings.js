// scripts/ui/settings.js

import { settingsModal, closeSettingsBtn, applySettingsBtn, settingsTrigger, settingsMenuEl, settingsTriggerDots, settingsTriggerName, settingsStripEl } from './uiElements.js';

// ─────────────────────────────────────────────
// 팔레트 정의
// ─────────────────────────────────────────────
const PALETTES = [
  {
    id: 'forest', name: '먹녹', desc: '기본 — 밤 숲 계열',
    dots:  ['#131a16', '#c8a86b', '#8b3a2a'],
    strip: ['#0d0f0e', '#131a16', '#1e2820', '#2a342c', '#c8a86b', '#8b3a2a', '#2d5c3a'],
    vars: {
      // 배경
      '--color-bg-root':       '#0d0f0e',
      '--color-bg-base':       '#131a16',
      '--color-bg-panel-dark': '#0f1512',
      '--color-bg-surface':    '#1e2820',
      // 액센트
      '--color-accent':        '#c8a86b',
      '--color-accent-hover':  '#dbbf82',
      // 버튼
      '--color-btn-primary':       '#8b3a2a',
      '--color-btn-primary-hover': '#a84432',
      '--color-btn-copy':          '#5a4a30',
      '--color-btn-copy-hover':    '#6e5c3c',
      '--color-btn-secondary':       '#2e3530',
      '--color-btn-secondary-hover': '#3a4238',
      '--color-btn-blue':       '#2d4a5e',
      '--color-btn-blue-hover': '#365a72',
      '--color-btn-success':       '#2d5c3a',
      '--color-btn-success-hover': '#38724a',
      '--color-btn-danger': '#6b2020',
      // 테두리
      '--color-border':        '#2a342c',
      '--color-border-slot':   '#374039',
      '--color-border-light':  '#3a3530',
      '--color-border-accent': '#5a4e34',
      // 필드
      '--color-field-sky':    '#4a5c4e',
      '--color-field-sky-bg': '#3d5040',
      // 오버레이
      '--color-shadow':        'rgba(0, 0, 0, 0.6)',
      '--color-shadow-heavy':  'rgba(0, 0, 0, 0.8)',
      '--color-overlay':       'rgba(0, 0, 0, 0.82)',
    },
  },
  {
    id: 'slate', name: '석판', desc: '차가운 회청 계열',
    dots:  ['#111418', '#7ba8c4', '#7c3a28'],
    strip: ['#0c0e10', '#111418', '#1a2028', '#252e38', '#7ba8c4', '#7c3a28', '#2a4a5c'],
    vars: {
      '--color-bg-root':       '#0c0e10',
      '--color-bg-base':       '#111418',
      '--color-bg-panel-dark': '#0d1014',
      '--color-bg-surface':    '#1a2028',
      '--color-accent':        '#7ba8c4',
      '--color-accent-hover':  '#9bbdd6',
      '--color-btn-primary':       '#7c3a28',
      '--color-btn-primary-hover': '#964830',
      '--color-btn-copy':          '#3a4858',
      '--color-btn-copy-hover':    '#4a5c6e',
      '--color-btn-secondary':       '#202830',
      '--color-btn-secondary-hover': '#2c3640',
      '--color-btn-blue':       '#2a4a5c',
      '--color-btn-blue-hover': '#365a72',
      '--color-btn-success':       '#2a4a5c',
      '--color-btn-success-hover': '#365a72',
      '--color-btn-danger': '#6b2020',
      '--color-border':        '#222a32',
      '--color-border-slot':   '#2e3a46',
      '--color-border-light':  '#2a3440',
      '--color-border-accent': '#3a5264',
      '--color-field-sky':    '#3c5060',
      '--color-field-sky-bg': '#2e4050',
      '--color-shadow':        'rgba(0, 0, 0, 0.65)',
      '--color-shadow-heavy':  'rgba(0, 0, 0, 0.82)',
      '--color-overlay':       'rgba(0, 0, 0, 0.84)',
    },
  },
  {
    id: 'ember', name: '잿불', desc: '어두운 적갈 계열',
    dots:  ['#180f0e', '#c4845a', '#7a2a1c'],
    strip: ['#100808', '#180f0e', '#281810', '#382018', '#c4845a', '#7a2a1c', '#4a2c18'],
    vars: {
      '--color-bg-root':       '#100808',
      '--color-bg-base':       '#180f0e',
      '--color-bg-panel-dark': '#120c0a',
      '--color-bg-surface':    '#281810',
      '--color-accent':        '#c4845a',
      '--color-accent-hover':  '#d4986e',
      '--color-btn-primary':       '#7a2a1c',
      '--color-btn-primary-hover': '#923222',
      '--color-btn-copy':          '#5a3820',
      '--color-btn-copy-hover':    '#6e4828',
      '--color-btn-secondary':       '#302018',
      '--color-btn-secondary-hover': '#3e2a20',
      '--color-btn-blue':       '#3a2c48',
      '--color-btn-blue-hover': '#4a3858',
      '--color-btn-success':       '#4a2c18',
      '--color-btn-success-hover': '#5a3820',
      '--color-btn-danger': '#7a1c1c',
      '--color-border':        '#2e1810',
      '--color-border-slot':   '#3e2818',
      '--color-border-light':  '#382010',
      '--color-border-accent': '#5a3820',
      '--color-field-sky':    '#4a3c2c',
      '--color-field-sky-bg': '#3a2c1c',
      '--color-shadow':        'rgba(0, 0, 0, 0.65)',
      '--color-shadow-heavy':  'rgba(0, 0, 0, 0.85)',
      '--color-overlay':       'rgba(0, 0, 0, 0.85)',
    },
  },
  {
    id: 'void', name: '허공', desc: '순흑 무채색 계열',
    dots:  ['#111111', '#a09a92', '#583a38'],
    strip: ['#090909', '#111111', '#1c1c1c', '#2a2a2a', '#a09a92', '#583a38', '#2e3232'],
    vars: {
      '--color-bg-root':       '#090909',
      '--color-bg-base':       '#111111',
      '--color-bg-panel-dark': '#0c0c0c',
      '--color-bg-surface':    '#1c1c1c',
      '--color-accent':        '#a09a92',
      '--color-accent-hover':  '#b8b2aa',
      '--color-btn-primary':       '#583a38',
      '--color-btn-primary-hover': '#6a4844',
      '--color-btn-copy':          '#3a3632',
      '--color-btn-copy-hover':    '#4a4440',
      '--color-btn-secondary':       '#242424',
      '--color-btn-secondary-hover': '#303030',
      '--color-btn-blue':       '#2a3040',
      '--color-btn-blue-hover': '#363c50',
      '--color-btn-success':       '#2e3232',
      '--color-btn-success-hover': '#3a3e3e',
      '--color-btn-danger': '#5a1e1e',
      '--color-border':        '#242424',
      '--color-border-slot':   '#303030',
      '--color-border-light':  '#2e2e2e',
      '--color-border-accent': '#484038',
      '--color-field-sky':    '#3a3a3a',
      '--color-field-sky-bg': '#2e2e2e',
      '--color-shadow':        'rgba(0, 0, 0, 0.7)',
      '--color-shadow-heavy':  'rgba(0, 0, 0, 0.88)',
      '--color-overlay':       'rgba(0, 0, 0, 0.88)',
    },
  },
  {
    id: 'ink', name: '심야', desc: '남청 계열',
    dots:  ['#0b0e14', '#8891b8', '#7c3a28'],
    strip: ['#080b10', '#0b0e14', '#141824', '#1e2438', '#8891b8', '#7c3a28', '#1c2c48'],
    vars: {
      '--color-bg-root':       '#080b10',
      '--color-bg-base':       '#0b0e14',
      '--color-bg-panel-dark': '#080b12',
      '--color-bg-surface':    '#141824',
      '--color-accent':        '#8891b8',
      '--color-accent-hover':  '#a0aad0',
      '--color-btn-primary':       '#7c3a28',
      '--color-btn-primary-hover': '#944830',
      '--color-btn-copy':          '#2e3850',
      '--color-btn-copy-hover':    '#3a4862',
      '--color-btn-secondary':       '#181e2c',
      '--color-btn-secondary-hover': '#222a3a',
      '--color-btn-blue':       '#1c2c48',
      '--color-btn-blue-hover': '#24385c',
      '--color-btn-success':       '#1c2c48',
      '--color-btn-success-hover': '#24385c',
      '--color-btn-danger': '#621e1e',
      '--color-border':        '#1c2030',
      '--color-border-slot':   '#28303e',
      '--color-border-light':  '#222a38',
      '--color-border-accent': '#3a4460',
      '--color-field-sky':    '#283850',
      '--color-field-sky-bg': '#1e2c40',
      '--color-shadow':        'rgba(0, 0, 0, 0.68)',
      '--color-shadow-heavy':  'rgba(0, 0, 0, 0.86)',
      '--color-overlay':       'rgba(0, 0, 0, 0.86)',
    },
  },
];

const STORAGE_KEY = 'palette';

// ─────────────────────────────────────────────
// CSS 변수 적용 (닫기가 아닌 적용 버튼에서만 호출)
// ─────────────────────────────────────────────
function applyPalette(id) {
  const p = PALETTES.find(x => x.id === id);
  if (!p) return;
  for (const [k, v] of Object.entries(p.vars)) {
    document.documentElement.style.setProperty(k, v);
  }
  localStorage.setItem(STORAGE_KEY, id);
}

// ─────────────────────────────────────────────
// 드롭다운 DOM 헬퍼
// ─────────────────────────────────────────────
function renderDots(palette, container) {
  container.innerHTML = '';
  palette.dots.forEach(color => {
    const dot = document.createElement('span');
    dot.className = 'palette-dot';
    dot.style.background = color;
    container.appendChild(dot);
  });
}

function renderStrip(palette, stripEl) {
  stripEl.innerHTML = '';
  palette.strip.forEach(color => {
    const seg = document.createElement('div');
    seg.className = 'palette-preview-seg';
    seg.style.background = color;
    stripEl.appendChild(seg);
  });
}

function buildMenu(menuEl, currentId, onSelect) {
  menuEl.innerHTML = '';
  PALETTES.forEach(p => {
    const opt = document.createElement('div');
    opt.className = 'palette-dd-option' + (p.id === currentId ? ' is-selected' : '');
    opt.innerHTML = `
      <div class="palette-dots">
        ${p.dots.map(c => `<span class="palette-dot" style="background:${c}"></span>`).join('')}
      </div>
      <div class="palette-dd-option-text">
        <span class="palette-dd-option-name">${p.name}</span>
        <span class="palette-dd-option-desc">${p.desc}</span>
      </div>
      <span class="palette-dd-check">✓</span>
    `;
    opt.addEventListener('click', () => onSelect(p.id));
    menuEl.appendChild(opt);
  });
}

// ─────────────────────────────────────────────
// 드롭다운 초기화
// ─────────────────────────────────────────────
function initDropdown(currentId, onChange) {
  // 드롭다운 DOM이 없으면 조용히 종료 (HTML 미적용 환경 방어)
  if (!settingsTrigger || !settingsMenuEl) return;

  let isOpen = false;

  function updateTrigger(id) {
    const p = PALETTES.find(x => x.id === id);
    if (!p) return;
    renderDots(p, settingsTriggerDots);
    settingsTriggerName.textContent = p.name;
    renderStrip(p, settingsStripEl);
  }

  function openMenu() {
    isOpen = true;
    settingsTrigger.classList.add('is-open');
    settingsMenuEl.classList.add('is-open');
  }

  function closeMenu() {
    isOpen = false;
    settingsTrigger.classList.remove('is-open');
    settingsMenuEl.classList.remove('is-open');
  }

  function onSelect(id) {
    onChange(id);          // 상위로 선택값 전달
    updateTrigger(id);
    buildMenu(settingsMenuEl, id, onSelect);
    closeMenu();
  }

  settingsTrigger.addEventListener('click', e => {
    e.stopPropagation();
    isOpen ? closeMenu() : openMenu();
  });
  settingsMenuEl.addEventListener('click', e => e.stopPropagation());
  document.addEventListener('click', () => { if (isOpen) closeMenu(); });

  // 초기 렌더
  updateTrigger(currentId);
  buildMenu(settingsMenuEl, currentId, onSelect);

  return { closeMenu };
}

// ─────────────────────────────────────────────
// 토글 초기화
// ─────────────────────────────────────────────
function initToggles() {
  document.querySelectorAll('.settings-toggle').forEach(el => {
    el.addEventListener('click', () => {
      el.dataset.on = String(el.dataset.on !== 'true');
    });
  });
}

// ─────────────────────────────────────────────
// 공개 API
// ─────────────────────────────────────────────
export function initSettings() {
  // 저장된 팔레트 복원 (페이지 로드 시점에 즉시 적용)
  const savedId = localStorage.getItem(STORAGE_KEY) || 'forest';
  applyPalette(savedId);

  // 드롭다운에서 선택만 했을 때는 미리보기만 갱신, 실제 적용은 하지 않음
  let pendingId = savedId;

  const { closeMenu } = initDropdown(savedId, id => {
    pendingId = id;
  }) ?? {};

  initToggles();

  // uiElements에서 가져온 캐시된 엘리먼트 사용
  // close-settings 는 uiElements의 closeSettingsBtn 과 동일한 엘리먼트
  closeSettingsBtn.addEventListener('click', () => {
    pendingId = savedId;          // 미적용 선택 롤백
    settingsModal.classList.add('hidden');
    closeMenu?.();
  });

  applySettingsBtn?.addEventListener('click', () => {
    applyPalette(pendingId);
    settingsModal.classList.add('hidden');
    closeMenu?.();
  });
}