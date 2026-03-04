/* =============================================
   MelodiTON Telegram Mini App – JavaScript
   아티스트라면 이렇게: 5-Step Flow
   ============================================= */

// ── STATE ──────────────────────────────────────
const state = {
  currentScreen: 'splash',
  selectedGenre: null,
  uploadedFile: null,
  trackTitle: '',
  artistName: '',
  nftQty: 100,
  mintedNFTs: JSON.parse(localStorage.getItem('mintedNFTs') || '[]'),
  stepStatus: { 1: 'pending', 2: 'pending', 3: 'pending', 4: 'pending', 5: 'pending' },
  isPlaying: false,
  mcPlayInterval: null,
};

// ── TELEGRAM WEB APP INIT ───────────────────────
function initTelegramApp() {
  if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
    tg.setHeaderColor('#0a0a14');
    tg.setBackgroundColor('#0a0a14');

    const user = tg.initDataUnsafe?.user;
    if (user) {
      document.getElementById('userName').textContent = user.first_name || '아티스트';
      if (user.photo_url) {
        const av = document.getElementById('userAvatar');
        av.style.background = `url(${user.photo_url}) center/cover`;
        av.textContent = '';
      }
    }
  }
}

// ── SPLASH ──────────────────────────────────────
function showApp() {
  const splash = document.getElementById('splash');
  splash.classList.remove('active');
  splash.classList.add('slide-out');
  setTimeout(() => {
    splash.style.display = 'none';
    document.getElementById('bottomNav').style.display = 'flex';
  }, 400);
  navigateTo('home');
  updateStats();
}

// ── NAVIGATION ──────────────────────────────────
function navigateTo(id) {
  const prev = document.querySelector('.screen.active');
  if (prev && prev.id !== id) {
    prev.classList.remove('active');
    void prev.offsetWidth;
  }

  const next = document.getElementById(id);
  if (!next) return;

  next.classList.add('active');
  state.currentScreen = id;

  updateNavBar(id);

  // Screen-specific setup
  const navScreens = ['home', 'upload', 'myNFTs', 'notifications'];
  const showNav = navScreens.includes(id);
  document.getElementById('bottomNav').style.display = showNav ? 'flex' : 'none';

  if (id === 'myNFTs') renderNFTGrid();
  if (id === 'channel') setupChannelScreen();
  if (id === 'mint') syncMintScreen();
  if (id === 'copyright') {
    resetCopyrightScreen();
    runCopyrightAnalysis();
  }
}

function updateNavBar(id) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navMap = { home: 'nav-home', upload: 'nav-upload', myNFTs: 'nav-myNFTs', notifications: 'nav-notifications' };
  const navEl = document.getElementById(navMap[id]);
  if (navEl) navEl.classList.add('active');
}

// ── UPLOAD ──────────────────────────────────────
function triggerUpload() {
  document.getElementById('fileInput').click();
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  state.uploadedFile = file;
  document.getElementById('uploadZone').classList.add('hidden');
  document.getElementById('filePreview').classList.remove('hidden');
  document.getElementById('fileName').textContent = file.name;
  document.getElementById('fileSize').textContent = formatFileSize(file.size);

  generateWaveform('waveformBars', 40, false);
  showToast('🎵 파일이 선택되었습니다');
}

function removeFile() {
  state.uploadedFile = null;
  document.getElementById('fileInput').value = '';
  document.getElementById('filePreview').classList.add('hidden');
  document.getElementById('uploadZone').classList.remove('hidden');
}

function selectGenre(el, genre) {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  state.selectedGenre = genre;
}

function proceedToVerify() {
  const title = document.getElementById('trackTitle').value.trim();
  const artist = document.getElementById('artistName').value.trim();
  const checked = document.getElementById('originalCheck').checked;

  if (!title) { showToast('❗ 곡 제목을 입력해주세요'); return; }
  if (!artist) { showToast('❗ 아티스트 이름을 입력해주세요'); return; }
  if (!checked) { showToast('❗ 오리지널 창작물 확인에 동의해주세요'); return; }

  state.trackTitle = title;
  state.artistName = artist;

  setStepStatus(1, 'done');
  navigateTo('copyright');
  runCopyrightAnalysis();
}

// ── COPYRIGHT ────────────────────────────────────
function resetCopyrightScreen() {
  // Reset icon & title
  document.getElementById('copyrightIcon').textContent = '🔍';
  document.getElementById('copyrightTitle').textContent = 'Audio Fingerprinting 분석 중';
  document.getElementById('copyrightDesc').textContent = '업로드된 음원을 전 세계 데이터베이스와 대조하고 있습니다';
  document.getElementById('verifyResult').classList.add('hidden');

  const ring = document.querySelector('.copyright-ring');
  ring.style.borderColor = 'var(--accent-purple)';
  ring.style.animation = 'spin 2s linear infinite';
  document.querySelector('.copyright-icon-wrap').style.background = '';

  // Reset analysis steps
  ['aStep1', 'aStep2', 'aStep3'].forEach((sid, i) => {
    const el = document.getElementById(sid);
    el.className = 'analysis-step';
    el.querySelector('.a-icon').textContent = '⏳';
    el.querySelector('.a-status').textContent = i === 0 ? '분석중' : '대기';
    el.querySelector('.a-status').style.color = '';
  });
}

function runCopyrightAnalysis() {
  const steps = [
    { id: 'aStep1', statusId: 'aStatus1', label: '분석중', doneLabel: '완료', icon: '🔬', delay: 800 },
    { id: 'aStep2', statusId: 'aStatus2', label: '대조중', doneLabel: '완료', icon: '🛡️', delay: 1600 },
    { id: 'aStep3', statusId: 'aStatus3', label: '검증중', doneLabel: '완료', icon: '✅', delay: 2400 },
  ];

  steps.forEach((s, i) => {
    setTimeout(() => {
      // Activate current
      const el = document.getElementById(s.id);
      el.classList.add('active');
      el.querySelector('.a-status').textContent = s.label;
    }, s.delay - 600);

    setTimeout(() => {
      const el = document.getElementById(s.id);
      el.classList.remove('active');
      el.classList.add('done');
      el.querySelector('.a-icon').textContent = s.doneLabel;
      el.querySelector('.a-status').textContent = '완료';
      el.querySelector('.a-status').style.color = 'var(--accent-green)';
    }, s.delay);
  });

  // Show result
  setTimeout(() => {
    document.getElementById('copyrightIcon').textContent = '✅';
    document.querySelector('.copyright-ring').style.borderColor = 'var(--accent-green)';
    document.querySelector('.copyright-ring').style.animation = 'none';
    document.querySelector('.copyright-icon-wrap').style.background = 'rgba(16,185,129,0.1)';
    document.getElementById('copyrightTitle').textContent = '저작권 검증 완료!';
    document.getElementById('copyrightDesc').textContent = '오리지널 창작물로 확인되었습니다 🎉';
    document.getElementById('verifyResult').classList.remove('hidden');
    setStepStatus(2, 'done');
  }, 3200);
}

function proceedToMint() {
  navigateTo('mint');
  syncMintScreen();
}

// ── MINT ──────────────────────────────────────
function syncMintScreen() {
  const title = state.trackTitle || document.getElementById('trackTitle')?.value || '제목 없음';
  const artist = state.artistName || document.getElementById('artistName')?.value || '아티스트';
  document.getElementById('mintTrackName').textContent = title;
  document.getElementById('mintArtistName').textContent = artist;
  document.getElementById('nftName').value = title ? `${title} #Edition` : '';
}

let nftQty = 100;

function changeQty(delta) {
  nftQty = Math.max(1, Math.min(10000, nftQty + delta));
  document.getElementById('qtyDisplay').textContent = nftQty;
  state.nftQty = nftQty;
}

function setQty(val) {
  nftQty = val;
  document.getElementById('qtyDisplay').textContent = nftQty;
  state.nftQty = nftQty;

  document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
  event.target.classList.add('active');
}

function startMinting() {
  const nftNameVal = document.getElementById('nftName').value.trim();
  if (!nftNameVal) { showToast('❗ NFT 이름을 입력해주세요'); return; }

  document.getElementById('mintBtn').classList.add('hidden');
  document.getElementById('mintingProgress').classList.remove('hidden');

  const mintSteps = ['mStep1', 'mStep2', 'mStep3', 'mStep4'];
  mintSteps.forEach((sid, i) => {
    setTimeout(() => {
      if (i > 0) {
        const prev = document.getElementById(mintSteps[i - 1]);
        prev.classList.remove('active');
        prev.classList.add('done');
      }
      document.getElementById(sid).classList.add('active');
    }, i * 900);
  });

  setTimeout(() => {
    const lastStep = document.getElementById('mStep4');
    lastStep.classList.remove('active');
    lastStep.classList.add('done');

    const track = {
      id: Date.now(),
      name: nftNameVal,
      artist: state.artistName || '아티스트',
      qty: nftQty,
      mintedAt: new Date().toISOString(),
    };
    state.mintedNFTs.push(track);
    localStorage.setItem('mintedNFTs', JSON.stringify(state.mintedNFTs));

    updateStats();
    setStepStatus(3, 'done');

    document.getElementById('mintResultDesc').textContent = `${nftQty}개의 소장형 NFT가 TON 블록체인에 영구 기록되었습니다`;
    document.getElementById('mintResult').classList.remove('hidden');
    document.getElementById('mintingProgress').classList.add('hidden');
    showToast('💎 NFT 발행이 완료되었습니다!');
  }, 4000);
}

function proceedToBenefits() {
  navigateTo('benefits');
}

// ── BENEFITS ──────────────────────────────────
function toggleBenefit(num) {
  const config = document.getElementById(`bcConfig${num}`);
  const card = document.getElementById(`bc${num}`);
  const checked = document.getElementById(`bt${num}`).checked;

  if (checked) {
    config.classList.remove('hidden');
    card.classList.add('active-card');
  } else {
    config.classList.add('hidden');
    card.classList.remove('active-card');
  }
}

function updateSlider(inputId, displayId, suffix) {
  const val = document.getElementById(inputId).value;
  document.getElementById(displayId).textContent = val + suffix;
}

function saveBenefits() {
  const anyEnabled = ['bt1', 'bt2', 'bt3', 'bt4', 'bt5'].some(id => document.getElementById(id).checked);
  if (!anyEnabled) { showToast('❗ 최소 1개 이상의 혜택을 설정해주세요'); return; }
  setStepStatus(4, 'done');
  showToast('🎁 팬 혜택이 저장되었습니다!');
  navigateTo('channel');
}

// ── CHANNEL ────────────────────────────────────
function setupChannelScreen() {
  const title = state.trackTitle || '음악';
  const artist = state.artistName || '아티스트';
  document.getElementById('mcTrackName').textContent = title;
  document.getElementById('mcArtistName').textContent = artist;
  generateMcBars();
  setStepStatus(5, 'active');
}

function togglePlay() {
  state.isPlaying = !state.isPlaying;
  const btn = document.getElementById('mcPlayBtn');
  btn.textContent = state.isPlaying ? '⏸' : '▶';

  if (state.isPlaying) {
    animateMcBars();
  } else {
    clearInterval(state.mcPlayInterval);
  }
}

function generateMcBars() {
  const container = document.getElementById('mcBars');
  container.innerHTML = '';
  const total = 36;
  for (let i = 0; i < total; i++) {
    const bar = document.createElement('div');
    bar.classList.add('mcbar');
    const h = Math.floor(Math.random() * 20) + 4;
    bar.style.cssText = `width: ${100 / total * 0.8}%; height: ${h}px;`;
    container.appendChild(bar);
  }
}

function animateMcBars() {
  const bars = document.querySelectorAll('.mcbar');
  let pos = 0;

  state.mcPlayInterval = setInterval(() => {
    bars.forEach((b, i) => {
      if (i <= pos) b.classList.add('played');
      const h = Math.floor(Math.random() * 24) + 4;
      b.style.height = h + 'px';
    });
    pos = (pos + 1) % bars.length;
  }, 120);
}

function shareToChannel() {
  const title = state.trackTitle || '음악';
  const msg = `🎵 ${title} - TON NFT로 소장하세요!\n팬 혜택: 티켓 할인, 굿즈, 프라이빗 채팅방`;
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.switchInlineQuery(msg, ['channels']);
  }
  showToast('📢 채널에 공유되었습니다!');
}

function shareToFriends() {
  const title = state.trackTitle || '음악';
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.switchInlineQuery(`🎵 ${title} NFT를 확인해보세요!`);
  }
  showToast('👥 친구에게 전달되었습니다!');
}

function copyShareLink() {
  const link = `https://t.me/meloditon_bot?start=nft_${Date.now()}`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(link);
  }
  showToast('🔗 링크가 복사되었습니다!');
}

function sendFanMessage() {
  const msg = document.getElementById('fanMessage').value.trim();
  if (!msg) { showToast('❗ 메시지를 입력해주세요'); return; }
  document.getElementById('fanMessage').value = '';
  showToast('📨 소장자 팬들에게 전송되었습니다!');
}

function finishAll() {
  setStepStatus(5, 'done');
  // Add demo fan data
  addDemoFans();
  navigateTo('home');
  showToast('🎉 모든 설정이 완료되었습니다!');
}

function addDemoFans() {
  const fansEmpty = document.getElementById('fansEmpty');
  const fansList = document.getElementById('fansList');
  const fansCount = document.getElementById('fansCount');

  const fans = [
    { name: 'melody_fan92', emoji: '🎸' },
    { name: 'k_music_lover', emoji: '🎤' },
    { name: 'night_owl_jin', emoji: '🌙' },
  ];

  fansEmpty.classList.add('hidden');
  fansList.classList.remove('hidden');
  fansList.innerHTML = '';
  fansCount.textContent = `${fans.length}명`;

  fans.forEach(f => {
    const item = document.createElement('div');
    item.classList.add('fan-item');
    item.innerHTML = `
      <div class="fan-avatar">${f.emoji}</div>
      <div>
        <p class="fan-username">@${f.name}</p>
        <p class="fan-date">방금 소장</p>
      </div>
    `;
    fansList.appendChild(item);
  });
}

// ── NFT GRID ──────────────────────────────────
function renderNFTGrid() {
  const grid = document.getElementById('nftGrid');
  const empty = document.getElementById('nftEmpty');

  if (state.mintedNFTs.length === 0) {
    empty.classList.remove('hidden');
    grid.classList.add('hidden');
    return;
  }

  empty.classList.add('hidden');
  grid.classList.remove('hidden');
  grid.innerHTML = '';

  state.mintedNFTs.forEach(nft => {
    const item = document.createElement('div');
    item.classList.add('nft-item');
    item.innerHTML = `
      <div class="nft-art">💎</div>
      <p class="nft-name">${nft.name}</p>
      <p class="nft-qty">${nft.qty}개 발행</p>
      <span class="nft-status">✅ 활성</span>
    `;
    grid.appendChild(item);
  });
}

// ── STEP STATUS ────────────────────────────────
function setStepStatus(step, status) {
  state.stepStatus[step] = status;
  const el = document.getElementById(`step${step}Status`);
  if (!el) return;
  el.className = `flow-status ${status}`;
  const labels = { pending: '대기', active: '진행중', done: '완료' };
  el.textContent = labels[status] || status;
}

// ── STATS ──────────────────────────────────────
function updateStats() {
  document.getElementById('totalTracks').textContent = state.mintedNFTs.length;
  document.getElementById('totalNFTs').textContent = state.mintedNFTs.reduce((sum, n) => sum + n.qty, 0);
  document.getElementById('totalFans').textContent = state.mintedNFTs.length > 0 ? Math.floor(state.mintedNFTs.length * 2.7) : 0;
}

// ── HELPERS ────────────────────────────────────
function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function generateWaveform(containerId, count, animated = true) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  for (let i = 0; i < count; i++) {
    const bar = document.createElement('div');
    bar.classList.add('wbar');
    const h = Math.floor(Math.random() * 28) + 4;
    bar.style.cssText = `width: ${96 / count}%; height: ${h}px; flex-shrink:0; border-radius:2px;`;
    if (animated) {
      bar.style.animationDuration = (Math.random() * 0.5 + 0.3) + 's';
    }
    container.appendChild(bar);
  }
}

let toastTimeout;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  void toast.offsetWidth;
  toast.classList.add('show');

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, 2500);
}

// ── INIT ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initTelegramApp();

  // Hide bottom nav until splash done
  document.getElementById('bottomNav').style.display = 'none';
  document.getElementById('splash').classList.add('active');

  updateStats();

  // Auto-dismiss splash
  setTimeout(showApp, 2400);
});
