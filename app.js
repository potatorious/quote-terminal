const quoteDataset = window.QUOTE_DATA;

if (!quoteDataset) {
  throw new Error("QUOTE_DATA is not loaded. Check quotes-data.js script order.");
}

const categoryOrder = ["전체", "철학", "삶", "지혜", "진실", "시작", "용기", "변화", "회복", "관계"];

const quotes = quoteDataset.quotes.map((entry) => {
  const author = quoteDataset.authors[entry.authorId];

  if (!author) {
    throw new Error(`Missing author profile: ${entry.authorId}`);
  }

  return {
    ko: {
      quote: entry.ko.quote,
      author: author.ko.name,
      source: entry.ko.source,
      language: author.ko.language,
      life: author.ko.life,
      period: entry.ko.period
    },
    original: {
      quote: entry.original.quote,
      author: author.original.name,
      source: entry.original.source,
      language: author.original.language,
      life: author.original.life,
      period: entry.original.period
    },
    tags: entry.tags
  };
});

const state = {
  activeTags: new Set(["전체"]),
  currentIndex: 0,
  history: [],
  typingTimer: null,
  readHighlightTimer: null,
  readSessionId: 0,
  audio: null,
  audioReady: false,
  lastTypeSound: 0
};

const elements = {
  quoteCount: document.querySelector("#quote-count"),
  languageCount: document.querySelector("#language-count"),
  kstClock: document.querySelector("#kst-clock"),
  quoteText: document.querySelector("#quote-text"),
  originalText: document.querySelector("#original-text"),
  quoteAuthor: document.querySelector("#quote-author"),
  quoteLife: document.querySelector("#quote-life"),
  quoteSource: document.querySelector("#quote-source"),
  quotePeriod: document.querySelector("#quote-period"),
  quoteLanguage: document.querySelector("#quote-language"),
  randomButton: document.querySelector("#random-button"),
  previousButton: document.querySelector("#previous-button"),
  speakKoButton: document.querySelector("#speak-ko-button"),
  speakOriginalButton: document.querySelector("#speak-original-button"),
  copyButton: document.querySelector("#copy-button"),
  resetButton: document.querySelector("#reset-button"),
  tagGrid: document.querySelector("#tag-grid"),
  toast: document.querySelector("#toast"),
  terminalStatus: document.querySelector("#terminal-status"),
  typedCommand: document.querySelector("#typed-command")
};

const readTargets = {
  ko: [
    { key: "quote", label: "명언", readId: "ko-quote" },
    { key: "author", label: "저자", readId: "ko-author" },
    { key: "source", label: "저서명", readId: "ko-source" }
  ],
  original: [
    { key: "quote", label: "원문", readId: "original-quote" },
    { key: "author", label: "원 저자", readId: "original-author" },
    { key: "source", label: "원 저서명", readId: "original-source" }
  ]
};

const categorySet = new Set(categoryOrder);
const tags = categoryOrder;
const languages = new Set(quotes.flatMap((quote) => [quote.ko.language, quote.original.language]));

let cachedVoices = [];

function refreshVoiceCache() {
  if (!("speechSynthesis" in window)) {
    cachedVoices = [];
    return;
  }

  cachedVoices = speechSynthesis.getVoices();
}

if ("speechSynthesis" in window) {
  refreshVoiceCache();
  if ("addEventListener" in speechSynthesis) {
    speechSynthesis.addEventListener("voiceschanged", refreshVoiceCache);
  } else {
    speechSynthesis.onvoiceschanged = refreshVoiceCache;
  }
}

function setupAudio() {
  if (state.audio) {
    return state.audio;
  }

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) {
    return null;
  }

  state.audio = new AudioContext();
  return state.audio;
}

async function unlockAudio() {
  const audio = setupAudio();
  if (!audio) {
    return false;
  }

  if (audio.state === "suspended") {
    await audio.resume();
  }

  state.audioReady = audio.state === "running";
  return state.audioReady;
}

function playTone({ frequency = 620, duration = 0.025, gain = 0.035 } = {}) {
  const audio = state.audio;
  if (!audio || !state.audioReady) {
    return;
  }

  const oscillator = audio.createOscillator();
  const volume = audio.createGain();
  const start = audio.currentTime;

  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(frequency, start);
  volume.gain.setValueAtTime(0.0001, start);
  volume.gain.exponentialRampToValueAtTime(gain, start + 0.004);
  volume.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(volume);
  volume.connect(audio.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.01);
}

function playButtonSound() {
  playTone({ frequency: 410, duration: 0.045, gain: 0.04 });
  window.setTimeout(() => playTone({ frequency: 760, duration: 0.035, gain: 0.03 }), 36);
}

function playToggleSound(isOn) {
  playTone({ frequency: isOn ? 920 : 310, duration: 0.05, gain: 0.038 });
}

function playSpeechStartSound() {
  playTone({ frequency: 300, duration: 0.04, gain: 0.045 });
  window.setTimeout(() => playTone({ frequency: 520, duration: 0.035, gain: 0.035 }), 48);
  window.setTimeout(() => playTone({ frequency: 760, duration: 0.03, gain: 0.03 }), 94);
}

function playTypeSound() {
  const now = performance.now();
  if (now - state.lastTypeSound < 38) {
    return;
  }

  state.lastTypeSound = now;
  playTone({
    frequency: 520 + Math.random() * 90,
    duration: 0.018,
    gain: 0.022
  });
}

function selectedTags() {
  return [...state.activeTags].filter((tag) => tag !== "전체");
}

function filteredQuotes() {
  const selected = selectedTags();
  if (selected.length === 0) {
    return quotes;
  }

  return quotes.filter((quote) => selected.some((tag) => quote.tags.includes(tag) && categorySet.has(tag)));
}

function pickRandomIndex() {
  const pool = filteredQuotes();
  if (pool.length === 0) {
    return state.currentIndex;
  }

  if (pool.length === 1) {
    return quotes.indexOf(pool[0]);
  }

  let nextQuote = pool[Math.floor(Math.random() * pool.length)];
  while (quotes.indexOf(nextQuote) === state.currentIndex) {
    nextQuote = pool[Math.floor(Math.random() * pool.length)];
  }

  return quotes.indexOf(nextQuote);
}

function filterText() {
  return selectedTags().join("+") || "전체";
}

function updateCommand() {
  elements.typedCommand.textContent = `quote --random --filter=${filterText()}`;
}

function formatKoreanTime(date) {
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  })
    .formatToParts(date)
    .reduce((result, part) => {
      if (part.type !== "literal") {
        result[part.type] = part.value;
      }
      return result;
    }, {});

  return `${parts.year}.${parts.month}.${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

function updateKoreanClock() {
  const now = new Date();
  const text = formatKoreanTime(now);
  elements.kstClock.textContent = `KST ${text}`;
  elements.kstClock.dateTime = now.toISOString();
}

function typeText(text, onComplete) {
  window.clearInterval(state.typingTimer);
  elements.quoteText.textContent = "";
  delete elements.quoteText.dataset.read;
  elements.terminalStatus.textContent = "출력 중";

  let index = 0;
  state.typingTimer = window.setInterval(() => {
    elements.quoteText.textContent += text[index] || "";
    if (text[index] && text[index] !== " ") {
      playTypeSound();
    }
    index += 1;

    if (index > text.length) {
      window.clearInterval(state.typingTimer);
      elements.terminalStatus.textContent = "완료";
      onComplete?.();
    }
  }, 26);
}

function createReadSpan(text, readId) {
  const span = document.createElement("span");
  span.dataset.read = readId;
  span.textContent = text;
  return span;
}

function createReadTokens(text, readId) {
  const fragment = document.createDocumentFragment();
  const tokens = text.match(/\S+\s*/g) || [text];

  tokens.forEach((token, index) => {
    const span = createReadSpan(token, readId);
    span.dataset.tokenIndex = String(index);
    fragment.append(span);
  });

  return fragment;
}

function setMeta(element, koText, originalText, key) {
  const originalSpan = document.createElement("span");
  originalSpan.className = "meta-original";
  originalSpan.append(" / ", createReadTokens(originalText, `original-${key}`));

  element.replaceChildren(createReadTokens(koText, `ko-${key}`), originalSpan);
}

function renderQuote(index) {
  const quote = quotes[index];
  if (!quote) {
    return;
  }

  state.currentIndex = index;

  updateCommand();
  typeText(quote.ko.quote, () => {
    elements.quoteText.replaceChildren(createReadTokens(quote.ko.quote, "ko-quote"));
  });
  elements.originalText.replaceChildren(createReadTokens(quote.original.quote, "original-quote"));
  setMeta(elements.quoteAuthor, quote.ko.author, quote.original.author, "author");
  setMeta(elements.quoteLife, quote.ko.life, quote.original.life, "life");
  setMeta(elements.quoteSource, quote.ko.source, quote.original.source, "source");
  setMeta(elements.quotePeriod, quote.ko.period, quote.original.period, "period");
  setMeta(elements.quoteLanguage, quote.ko.language, quote.original.language, "language");
}

function ensureQuoteTokens() {
  const quote = quotes[state.currentIndex];
  const hasKoreanTokens = elements.quoteText.querySelector("[data-read='ko-quote']");

  if (!quote || hasKoreanTokens) {
    return;
  }

  window.clearInterval(state.typingTimer);
  elements.quoteText.replaceChildren(createReadTokens(quote.ko.quote, "ko-quote"));
  elements.terminalStatus.textContent = "완료";
}

function stopReadHighlightTimer() {
  window.clearTimeout(state.readHighlightTimer);
  state.readHighlightTimer = null;
}

function clearReadHighlight() {
  document.querySelectorAll(".is-reading-text").forEach((element) => {
    element.classList.remove("is-reading-text");
  });
}

function setReadHighlight(target, tokenIndex = 0) {
  clearReadHighlight();
  const element = document.querySelector(`[data-read='${target.readId}'][data-token-index='${tokenIndex}']`);
  if (element) {
    element.classList.add("is-reading-text");
  }
  elements.terminalStatus.textContent = `${target.label} 음성`;
}

function setReadSectionHighlight(target) {
  clearReadHighlight();
  document.querySelectorAll(`[data-read='${target.readId}']`).forEach((element) => {
    element.classList.add("is-reading-text");
  });
  elements.terminalStatus.textContent = `${target.label} 음성`;
}

function tokenRangesForPart(part, partStart) {
  const tokens = part.text.match(/\S+\s*/g) || [part.text];
  let cursor = partStart;

  return tokens.map((token, tokenIndex) => {
    const start = cursor;
    const end = cursor + token.trimEnd().length;
    cursor += token.length;
    return {
      key: part.key,
      tokenIndex,
      start,
      end
    };
  });
}

function waitForVoices() {
  if (!("speechSynthesis" in window)) {
    return Promise.resolve([]);
  }

  refreshVoiceCache();
  if (cachedVoices.length > 0) {
    return Promise.resolve(cachedVoices);
  }

  return new Promise((resolve) => {
    let settled = false;

    const finish = () => {
      if (settled) {
        return;
      }

      settled = true;
      window.clearTimeout(timeout);
      if ("removeEventListener" in speechSynthesis) {
        speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
      }

      refreshVoiceCache();
      resolve(cachedVoices);
    };

    const handleVoicesChanged = () => {
      refreshVoiceCache();
      if (cachedVoices.length > 0) {
        finish();
      }
    };

    const timeout = window.setTimeout(finish, 1200);

    if ("addEventListener" in speechSynthesis) {
      speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);
    } else {
      speechSynthesis.onvoiceschanged = handleVoicesChanged;
    }
  });
}

const speechVoiceSettings = {
  rate: 0.74,
  pitch: 0.36,
  volume: 0.95
};

const speechLanguageProfiles = [
  { test: /한국어|korean/i, lang: "ko-KR", names: [/heami/i, /yuna/i, /korean/i], name: /heami|yuna|korean/i },
  {
    test: /영어|english/i,
    lang: "en-US",
    names: [/david/i, /mark/i, /george/i, /desktop/i, /english/i, /zira/i, /daniel/i, /samantha/i],
    name: /english|samantha|daniel|zira|david/i
  },
  { test: /프랑스어|french/i, lang: "fr-FR", name: /french|thomas|amelie|hortense/i },
  { test: /독일어|german/i, lang: "de-DE", name: /german|anna|katja|markus/i },
  { test: /러시아어|russian/i, lang: "ru-RU", name: /russian|irina|pavel/i },
  { test: /고전 중국어|classical chinese/i, lang: "zh-CN", name: /chinese|huihui|kangkang|ting-ting/i },
  { test: /고대 그리스어|ancient greek/i, lang: "el-GR", name: /greek|helena|nikos/i },
  { test: /라틴어|latin/i, lang: "it-IT", name: /italian|elsa|cosimo/i },
  { test: /팔리어|산스크리트|pali|sanskrit/i, lang: "hi-IN", name: /hindi|heera|kalpana/i }
];

function speechProfileForLanguage(language) {
  return speechLanguageProfiles.find((profile) => profile.test.test(language)) || speechLanguageProfiles[1];
}

function chooseVoiceForLanguage(voices, language) {
  const profile = speechProfileForLanguage(language);
  const normalizedLang = profile.lang.toLowerCase();
  const langPrefix = normalizedLang.split("-")[0];
  const matchingVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith(langPrefix));
  const preferredVoice = (profile.names || [profile.name])
    .map((pattern) => matchingVoices.find((voice) => pattern.test(voice.name)))
    .find(Boolean);

  return (
    preferredVoice ||
    matchingVoices.find((voice) => voice.lang.toLowerCase() === normalizedLang) ||
    matchingVoices[0] ||
    null
  );
}

async function speakQuote(mode) {
  await unlockAudio();
  playSpeechStartSound();

  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
    showToast("이 브라우저에서는 음성 읽기를 지원하지 않습니다.");
    return;
  }

  state.readSessionId += 1;
  const readSessionId = state.readSessionId;

  if (speechSynthesis.speaking || speechSynthesis.pending) {
    speechSynthesis.cancel();
  }
  stopReadHighlightTimer();
  clearReadHighlight();

  const quote = quotes[state.currentIndex];
  const data = quote[mode];
  ensureQuoteTokens();

  const parts = [
    { key: "quote", text: data.quote },
    { key: "author", text: data.author },
    { key: "source", text: data.source }
  ];
  const speechLanguage = mode === "ko" ? "한국어" : "English";
  const speechProfile = speechProfileForLanguage(speechLanguage);
  const voice = chooseVoiceForLanguage(await waitForVoices(), speechLanguage);

  function configureUtterance(utterance) {
    utterance.lang = voice?.lang || speechProfile.lang;
    utterance.rate = speechVoiceSettings.rate;
    utterance.pitch = speechVoiceSettings.pitch;
    utterance.volume = speechVoiceSettings.volume;

    if (voice) {
      utterance.voice = voice;
    }
  }

  function speakPart(partIndex = 0) {
    if (readSessionId !== state.readSessionId) {
      return;
    }

    const part = parts[partIndex];
    if (!part) {
      stopReadHighlightTimer();
      clearReadHighlight();
      elements.terminalStatus.textContent = "완료";
      playTone({ frequency: 260, duration: 0.035, gain: 0.028 });
      return;
    }

    const target = readTargets[mode].find((item) => item.key === part.key);
    const utterance = new SpeechSynthesisUtterance(part.text);
    let highlightStartedAt = 0;

    configureUtterance(utterance);

    function showCurrentSection() {
      if (readSessionId === state.readSessionId && target) {
        if (!highlightStartedAt) {
          highlightStartedAt = performance.now();
        }
        setReadSectionHighlight(target);
      }
    }

    utterance.onstart = () => {
      showCurrentSection();
    };

    utterance.onend = () => {
      if (readSessionId !== state.readSessionId) {
        return;
      }

      stopReadHighlightTimer();
      const minimumVisibleTime = part.key === "quote" ? 700 : 1300;
      const visibleTime = highlightStartedAt ? performance.now() - highlightStartedAt : 0;
      const nextDelay = Math.max(260, minimumVisibleTime - visibleTime);

      window.setTimeout(() => {
        if (readSessionId === state.readSessionId) {
          speakPart(partIndex + 1);
        }
      }, nextDelay);
    };

    utterance.onerror = () => {
      stopReadHighlightTimer();
      clearReadHighlight();
      elements.terminalStatus.textContent = "완료";
      showToast("음성 출력을 완료하지 못했습니다.");
    };

    if (target) {
      showCurrentSection();
    }
    speechSynthesis.speak(utterance);
  }

  window.setTimeout(() => speakPart(), 150);
}

function renderTags() {
  elements.tagGrid.innerHTML = "";
  updateCommand();

  tags.forEach((tag) => {
    const label = document.createElement("label");
    label.className = "tag-toggle";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = state.activeTags.has(tag);

    const switchTrack = document.createElement("span");
    switchTrack.className = "switch";
    switchTrack.setAttribute("aria-hidden", "true");

    const name = document.createElement("span");
    name.className = "tag-name";
    name.textContent = tag;

    input.addEventListener("change", async () => {
      await unlockAudio();
      playToggleSound(input.checked);

      if (tag === "전체") {
        state.activeTags = new Set(["전체"]);
      } else {
        state.activeTags.delete("전체");
        input.checked ? state.activeTags.add(tag) : state.activeTags.delete(tag);

        if (state.activeTags.size === 0) {
          state.activeTags.add("전체");
        }
      }

      renderTags();
    });

    label.append(input, switchTrack, name);
    elements.tagGrid.append(label);
  });
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  window.setTimeout(() => elements.toast.classList.remove("is-visible"), 1500);
}

async function nextQuote() {
  await unlockAudio();
  playButtonSound();
  state.history.push(state.currentIndex);
  renderQuote(pickRandomIndex());
}

async function previousQuote() {
  await unlockAudio();
  playButtonSound();
  const previousIndex = state.history.pop();
  if (previousIndex === undefined) {
    showToast("이전 명언 기록이 없습니다.");
    return;
  }

  renderQuote(previousIndex);
}

function copyWithFallback(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.opacity = "0";
  document.body.append(textArea);
  textArea.select();
  textArea.setSelectionRange(0, text.length);

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } finally {
    textArea.remove();
  }

  return copied;
}

async function copyQuote() {
  await unlockAudio();
  playButtonSound();
  const quote = quotes[state.currentIndex];
  const text = `"${quote.ko.quote}"\n${quote.original.quote}\n- ${quote.ko.author} / ${quote.original.author}, ${quote.ko.source} / ${quote.original.source}`;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else if (!copyWithFallback(text)) {
      throw new Error("Fallback copy failed");
    }
    showToast("명언을 복사했습니다.");
  } catch {
    if (copyWithFallback(text)) {
      showToast("명언을 복사했습니다.");
      return;
    }
    showToast("이 브라우저에서는 복사를 지원하지 않습니다.");
  }
}

elements.quoteCount.textContent = quotes.length;
elements.languageCount.textContent = languages.size;
updateKoreanClock();
window.setInterval(updateKoreanClock, 1000);
elements.randomButton.addEventListener("click", nextQuote);
elements.previousButton.addEventListener("click", previousQuote);
elements.speakKoButton.addEventListener("click", () => speakQuote("ko"));
elements.speakOriginalButton.addEventListener("click", () => speakQuote("original"));
elements.copyButton.addEventListener("click", copyQuote);
elements.resetButton.addEventListener("click", async () => {
  await unlockAudio();
  playButtonSound();
  state.activeTags = new Set(["전체"]);
  renderTags();
});

renderTags();
renderQuote(pickRandomIndex());
