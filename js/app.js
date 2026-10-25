/* Interaksi lokal: menu ponsel, check-in, dan penanda navigasi. */
'use strict';
const menuToggle = document.querySelector('#menu-toggle');
const nav = document.querySelector('#navigasi');
function closeMenu() {
  nav.classList.remove('is-open');
  menuToggle.setAttribute('aria-expanded', 'false');
}
menuToggle.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('is-open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});
nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && nav.classList.contains('is-open')) { closeMenu(); menuToggle.focus(); }
});
// Urutan mengikuti gambar check-in pada PPT, termasuk pilihan yang berulang.
const emotions = [
  ['😄', 'Bahagia & Tertawa'], ['😍', 'Cinta & Kagum'], ['😎', 'Keren & Santai'],
  ['🥳', 'Perayaan'], ['🤔', 'Berpikir'], ['😮', 'Terkejut'],
  ['😏', 'Menyeringai'], ['😁', 'Menyeringai'], ['😂', 'Sangat Lucu'],
  ['😢', 'Sedih & Kecewa'], ['😤', 'Marah'], ['😫', 'Lelah'],
  ['😩', 'Lelah'], ['🤢', 'Muak'], ['🤫', 'Diam & Rahasia'],
  ['😴', 'Ngantuk'], ['🤯', 'Bingung'], ['😇', 'Baik & Inosens']
];
const emotionGrid = document.querySelector('#emotion-grid');
const emotionResult = document.querySelector('#emotion-result');
let moodSoundEnabled = true;
function showEmotion(index) {
  emotionGrid.querySelectorAll('button').forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  emotionResult.textContent = emotions[index][0] + ' ' + emotions[index][1];
  emotionResult.classList.add('revealed');
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    emotionResult.animate([{opacity: 0, transform: 'translateY(9px) scale(.96)'}, {opacity: 1, transform: 'translateY(0) scale(1)'}], {duration: 380, easing: 'cubic-bezier(.2,.8,.2,1)'});
  }
}
emotions.forEach(([emoji, label], index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'emotion';
  button.setAttribute('aria-pressed', 'false');
  button.setAttribute('aria-label', 'Emoji pilihan ' + (index + 1));
  const icon = document.createElement('span');
  icon.className = 'emotion-icon'; icon.setAttribute('aria-hidden', 'true'); icon.textContent = emoji;
  button.append(icon);
  button.addEventListener('click', () => {
    showEmotion(index);
    playMood(index);
  });
  emotionGrid.append(button);
});
// Navigasi per halaman: tombol menu mengganti panel yang tampil, bukan menggulir.
const pages = [...document.querySelectorAll('.page')];
const prevPage = document.querySelector('#prev-page');
const nextPage = document.querySelector('#next-page');
let pageIndex = 0;
let transitionTicket = 0;
let activeTransition;
async function showPage() {
  const ticket = ++transitionTicket;
  const id = location.hash.slice(1) || 'beranda';
  const index = pages.findIndex(page => page.id === id);
  const newIndex = index >= 0 ? index : 0;
  const page = pages[newIndex];
  const previous = pages.find(item => !item.hidden);
  const direction = newIndex < pageIndex ? -1 : 1;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (activeTransition) activeTransition.cancel();
  if (previous && previous !== page && !reduced) {
    activeTransition = previous.animate([
      {opacity: 1, transform: 'translateX(0) scale(1)', filter: 'blur(0)'},
      {opacity: 0, transform: 'translateX(' + (-direction * 35) + 'px) scale(.98)', filter: 'blur(3px)'}
    ], {duration: 160, easing: 'ease-in', fill: 'forwards'});
    await activeTransition.finished.catch(() => {});
    if (ticket !== transitionTicket) return;
    activeTransition.cancel();
  }
  if (ticket !== transitionTicket) return;
  pageIndex = newIndex;
  pages.forEach((item, i) => { item.hidden = i !== pageIndex; });
  document.querySelector('main').dataset.theme = page.dataset.group;
  page.querySelector('.page-content').scrollTop = 0;
  nav.querySelectorAll('a').forEach(link => {
    const destination = pages.find(p => '#' + p.id === link.getAttribute('href'));
    if (destination && destination.dataset.group === page.dataset.group) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  prevPage.disabled = pageIndex === 0;
  nextPage.disabled = pageIndex === pages.length - 1;
  document.querySelector('#page-indicator').textContent = (pageIndex + 1) + ' / ' + pages.length;
  document.title = page.querySelector('.page-heading h1').textContent + ' · Bimtek Digitalisasi';
  closeMenu();
  page.querySelector('.page-heading h1').focus({preventScroll: true});
  if (!reduced) {
    activeTransition = page.animate([
      {opacity: 0, transform: 'translateX(' + (direction * 45) + 'px) scale(.98)', filter: 'blur(3px)'},
      {opacity: 1, transform: 'translateX(0) scale(1)', filter: 'blur(0)'}
    ], {duration: 380, easing: 'cubic-bezier(.18,.75,.2,1)'});
  }
}
// Clicking an already active menu also replays the transition.
document.addEventListener('click', event => {
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;
  const hash = link.getAttribute('href');
  if (hash === '#konten') { event.preventDefault(); document.querySelector('main').focus({preventScroll:true}); return; }
  if (!pages.some(page => '#' + page.id === hash)) return;
  event.preventDefault();
  if (location.hash === hash) showPage();
  else location.hash = hash;
});
function navigateTo(index) {
  if (index >= 0 && index < pages.length) location.hash = pages[index].id;
}
function requestedIndex() { const i = pages.findIndex(page => '#' + page.id === location.hash); return i >= 0 ? i : pageIndex; }
prevPage.addEventListener('click', () => navigateTo(requestedIndex() - 1));
nextPage.addEventListener('click', () => navigateTo(requestedIndex() + 1));
window.addEventListener('hashchange', showPage);
// Tab dapat dioperasikan dengan klik, tombol panah, Home, dan End.
document.querySelectorAll('[role="tablist"]').forEach(list => {
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  function selectTab(tab) {
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      const panel = document.getElementById(item.dataset.tab);
      panel.hidden = !selected;
      if (selected && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) panel.animate([{opacity:0, transform:'translateY(10px)'}, {opacity:1, transform:'translateY(0)'}], {duration:300, easing:'ease-out'});
    });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      let target;
      if (event.key === 'ArrowRight') target = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') target = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') target = 0;
      if (event.key === 'End') target = tabs.length - 1;
      if (target !== undefined) { event.preventDefault(); selectTab(tabs[target]); tabs[target].focus(); }
    });
  });
});
showPage();

// GAME KARAKTERISTIK MPI. Soal dapat diedit di daftar challenges.
const challenges = [
  { question: 'Murid menekan tombol lalu media merespons pilihannya. Karakteristik apa yang ditunjukkan?', options: ['Interaktivitas', 'Integrasi Multimedia'], answer: 0, explanation: 'Interaktivitas: media merespons tindakan pengguna.' },
  { question: 'Media menggabungkan teks, gambar, animasi, dan suara. Ini contoh apa?', options: ['Non-Linearitas', 'Integrasi Multimedia'], answer: 1, explanation: 'Integrasi multimedia menggabungkan beberapa bentuk media dalam pembelajaran.' },
  { question: 'Setelah menjawab, murid langsung melihat benar atau salah beserta penjelasannya. Ini contoh apa?', options: ['Feedback Langsung', 'Non-Linearitas'], answer: 0, explanation: 'Feedback langsung memberikan respons dan penjelasan setelah murid menjawab.' },
  { question: 'Murid bebas memilih topik melalui menu tanpa mengikuti urutan tetap. Ini contoh apa?', options: ['Integrasi Multimedia', 'Non-Linearitas'], answer: 1, explanation: 'Non-linearitas memungkinkan murid memilih jalur belajar sesuai kebutuhan.' }
];
let gameIndex = 0, score = 0, answered = false, soundEnabled = true, audioContext;
const gameOptions = document.querySelector('#game-options');
const gameQuestion = document.querySelector('#game-question');
const gameFeedback = document.querySelector('#game-feedback');
const gameNext = document.querySelector('#game-next');
const gameStage = document.querySelector('#game-stage');
const soundToggle = document.querySelector('#sound-toggle');
const mascot = document.querySelector('#game-mascot');
let celebrationTimer;
// Nada dibuat di perangkat menggunakan Web Audio API, tanpa unduhan suara.
function playSound(type) {
  if (!soundEnabled) return;
  try {
    const AudioEngine = window.AudioContext || window.webkitAudioContext;
    if (!AudioEngine) return;
    audioContext = audioContext || new AudioEngine();
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    const notes = type === 'correct' ? [523.25, 659.25, 783.99] : type === 'finish' ? [523.25, 659.25, 783.99, 1046.5] : type === 'wrong' ? [260, 200] : [660];
    notes.forEach((frequency, i) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const start = audioContext.currentTime + i * 0.13;
      oscillator.type = 'sine'; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.21);
      oscillator.connect(gain); gain.connect(audioContext.destination);
      oscillator.start(start); oscillator.stop(start + 0.23);
    });
  } catch (_) { /* Game tetap dapat dimainkan jika browser tidak mendukung audio. */ }
}
soundToggle.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  soundToggle.setAttribute('aria-pressed', String(soundEnabled));
  soundToggle.textContent = soundEnabled ? 'Suara: Aktif 🔊' : 'Suara: Mati 🔇';
  if (soundEnabled) playSound('tap');
});
function celebrate() {
  const layer = document.querySelector('#game-celebration');
  clearTimeout(celebrationTimer);
  layer.replaceChildren();
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    for (let i = 0; i < 22; i++) {
      const piece = document.createElement('span'); piece.className = 'confetti';
      piece.style.left = (i * 4.7) + '%';
      piece.style.background = ['#ffe568', '#2aa3ee', '#39bc8b', '#f390bc'][i % 4];
      piece.style.animationDelay = (i % 5) * 0.06 + 's';
      layer.append(piece);
    }
    celebrationTimer = setTimeout(() => layer.replaceChildren(), 1700);
  }
}
function renderChallenge() {
  answered = false;
  gameStage.classList.remove('is-correct', 'is-wrong');
  mascot.textContent = '🎯';
  document.querySelector('#game-celebration').replaceChildren();
  document.querySelector('#game-progress').textContent = 'Tantangan ' + (gameIndex + 1) + ' dari ' + challenges.length;
  document.querySelector('#game-score').textContent = 'Skor: ' + score;
  gameQuestion.textContent = challenges[gameIndex].question;
  gameFeedback.textContent = 'Pilih jawaban. Suara berbunyi setelah Anda berinteraksi.';
  gameNext.hidden = true; gameOptions.replaceChildren();
  challenges[gameIndex].options.forEach((text, index) => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'game-option'; button.textContent = text;
    button.addEventListener('click', () => answerChallenge(index, button));
    gameOptions.append(button);
  });
}
function answerChallenge(index, selectedButton) {
  if (answered) return;
  answered = true;
  const challenge = challenges[gameIndex];
  const correct = index === challenge.answer;
  if (correct) score += 25;
  document.querySelector('#game-score').textContent = 'Skor: ' + score;
  [...gameOptions.children].forEach((button, i) => {
    button.disabled = true;
    if (i === challenge.answer) button.classList.add('correct');
  });
  if (!correct) selectedButton.classList.add('wrong');
  mascot.textContent = correct ? '🌟' : '💡';
  gameStage.classList.add(correct ? 'is-correct' : 'is-wrong');
  gameFeedback.textContent = (correct ? 'Benar! ' : 'Belum tepat. ') + challenge.explanation;
  playSound(correct ? 'correct' : 'wrong');
  if (correct) celebrate();
  gameNext.textContent = gameIndex === challenges.length - 1 ? 'Lihat hasil →' : 'Lanjut tantangan →';
  gameNext.hidden = false;
}
gameNext.addEventListener('click', () => {
  if (gameIndex === challenges.length) {
    gameIndex = 0; score = 0; renderChallenge(); return;
  }
  gameIndex++;
  if (gameIndex < challenges.length) { renderChallenge(); gameOptions.querySelector('button').focus(); return; }
  gameQuestion.textContent = 'Permainan selesai!';
  document.querySelector('#game-progress').textContent = 'Selesai · 4 tantangan';
  gameOptions.replaceChildren();
  gameFeedback.textContent = 'Skor Anda ' + score + ' dari 100. Anda sudah mencoba interaksi, suara, animasi, dan umpan balik langsung.';
  mascot.textContent = score === 100 ? '🏆' : '👏';
  gameStage.classList.remove('is-wrong'); gameStage.classList.add('is-correct');
  gameNext.textContent = 'Main lagi ↻';
  playSound('finish'); celebrate();
});
renderChallenge();

// CHECK-IN: motif nada singkat disesuaikan dengan suasana emoji.
// Nada bersifat ilustratif, bukan rekaman suara manusia.
let moodAudio;
let moodSources = [];
const moodPatterns = [
  [523,659,784,1047], [523,659,880,659], [392,494,587], [523,784,1047,1319],
  [392,440,392], [330,660,990], [440,554,494], [523,659,784], [659,784,659,1047],
  [392,330,294], [220,233,220], [330,294,247], [294,247,220], [262,247,233],
  [440,392], [330,294,262], [392,554,440,622], [523,659,784,659,523]
];
function playMood(index) {
  if (!moodSoundEnabled) return;
  try {
    const Engine = window.AudioContext || window.webkitAudioContext;
    if (!Engine) return;
    moodAudio = moodAudio || new Engine();
    moodAudio.resume().catch(() => {});
    moodSources.forEach(source => { try { source.stop(); } catch (_) {} });
    moodSources = [];
    const mellow = [9,11,12,13,14,15].includes(index);
    const pace = mellow ? 0.19 : index === 3 ? 0.10 : 0.13;
    moodPatterns[index].forEach((frequency, i) => {
      const oscillator = moodAudio.createOscillator();
      const gain = moodAudio.createGain();
      const start = moodAudio.currentTime + i * pace;
      oscillator.type = index === 10 ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(mellow ? 0.08 : 0.12, start + .02);
      gain.gain.exponentialRampToValueAtTime(.001, start + pace + .10);
      oscillator.connect(gain); gain.connect(moodAudio.destination);
      oscillator.start(start); oscillator.stop(start + pace + .12);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      moodSources.push(oscillator);
    });
  } catch (_) { /* Check-in tetap berfungsi jika audio tidak didukung. */ }
}
document.querySelector('#emotion-sound').addEventListener('click', event => {
  moodSoundEnabled = !moodSoundEnabled;
  event.currentTarget.setAttribute('aria-pressed', String(moodSoundEnabled));
  event.currentTarget.textContent = moodSoundEnabled ? 'Nada: Aktif 🔊' : 'Nada: Mati 🔇';
  if (!moodSoundEnabled) moodSources.forEach(source => { try { source.stop(); } catch (_) {} });
});
