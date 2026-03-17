const DEFAULT_FEED = 'https://www.nrk.no/nyheter/siste.rss';
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://api.allorigins.cf/raw?url=',
  'https://thingproxy.freeboard.io/fetch/',
];

const feedUrlEl = document.getElementById('feedUrl');
const loadBtn = document.getElementById('loadBtn');
const refreshIntervalEl = document.getElementById('refreshInterval');
const compactBtn = document.getElementById('compactBtn');
const statusEl = document.getElementById('status');
const nextRefreshEl = document.getElementById('nextRefresh');
const feedEl = document.getElementById('feed');

let autoRefreshTimer = null;
let autoRefreshCountdown = null;
let nextRefreshTime = null;

function formatTime(ms) {
  const seconds = Math.ceil(ms / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

async function fetchWithCorsFallback(url) {
  try {
    return await fetch(url);
  } catch {
    // continue to proxies
  }

  let lastError = null;
  for (const proxy of CORS_PROXIES) {
    try {
      const response = await fetch(proxy + encodeURIComponent(url));
      if (!response.ok) throw new Error(`Proxy ${proxy} returned ${response.status}`);
      return response;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Failed to fetch RSS feed');
}

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.style.color = isError ? '#ff6b6b' : 'var(--muted)';
}

function updateCountdown() {
  if (!nextRefreshTime) {
    nextRefreshEl.textContent = '';
    return;
  }

  const remaining = nextRefreshTime - Date.now();
  if (remaining <= 0) {
    nextRefreshEl.textContent = '';
    return;
  }
  nextRefreshEl.textContent = `Next refresh: ${formatTime(remaining)}`;
}

function scheduleAutoRefresh(minutes) {
  clearInterval(autoRefreshTimer);
  clearInterval(autoRefreshCountdown);
  nextRefreshTime = null;

  if (!minutes || minutes <= 0) {
    nextRefreshEl.textContent = '';
    return;
  }

  const intervalMs = minutes * 60 * 1000;
  nextRefreshTime = Date.now() + intervalMs;

  autoRefreshTimer = setInterval(() => {
    loadFeed();
    nextRefreshTime = Date.now() + intervalMs;
  }, intervalMs);

  autoRefreshCountdown = setInterval(updateCountdown, 1000);
}

function parseFeedXml(xmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');
  const items = Array.from(doc.querySelectorAll('item')).slice(0, 25);
  return items.map((item) => {
    const title = item.querySelector('title')?.textContent?.trim() || 'Untitled';
    const link = item.querySelector('link')?.textContent?.trim() || '';
    const description = item.querySelector('description')?.textContent?.trim() || '';
    const pubDate = item.querySelector('pubDate')?.textContent?.trim() || '';

    return { title, link, description, pubDate };
  });
}

function formatPubDate(pubDate) {
  if (!pubDate) return '';

  const date = new Date(pubDate);
  if (Number.isNaN(date.getTime())) return pubDate;

  return date.toLocaleString('nb-NO', {
    timeZone: 'Europe/Oslo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function renderFeed(entries) {
  feedEl.innerHTML = '';

  if (!entries.length) {
    feedEl.textContent = 'No stories found.';
    return;
  }

  entries.forEach((entry) => {
    const article = document.createElement('article');
    article.className = 'story';

    const title = document.createElement('h2');
    title.className = 'story__title';
    title.innerHTML = `<a href="${entry.link}" target="_blank" rel="noopener">${entry.title}</a>`;

    const meta = document.createElement('div');
    meta.className = 'story__meta';
    meta.innerHTML = `<span>${formatPubDate(entry.pubDate)} (CET)</span><span>${entry.link ? '↗' : ''}</span>`;

    const summary = document.createElement('div');
    summary.className = 'story__summary';
    summary.innerHTML = entry.description || '<em>No description</em>';

    article.append(title, meta, summary);
    feedEl.appendChild(article);
  });
}

function cacheBustedUrl(url) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_=${Date.now()}`;
}

async function loadFeed() {
  const url = (feedUrlEl.value || DEFAULT_FEED).trim();
  if (!url) {
    setStatus('Enter a valid RSS URL.', true);
    return;
  }

  setStatus('Loading…');
  loadBtn.disabled = true;

  try {
    const resp = await fetchWithCorsFallback(cacheBustedUrl(url));
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    const text = await resp.text();
    const entries = parseFeedXml(text);
    renderFeed(entries);

    setStatus(`Loaded ${entries.length} stories`);
  } catch (err) {
    console.error('Feed load error', err);
    setStatus(`Error: ${err.message}`, true);
  } finally {
    loadBtn.disabled = false;
  }
}

function setCompactMode(enabled) {
  document.body.classList.toggle('compact', enabled);
  localStorage.setItem('newsfeedCompactMode', enabled ? '1' : '0');
  compactBtn.textContent = enabled ? 'Compact ✓' : 'Compact';
}

const SYNC_KEY = 'newsfeed_reload_signal';

function broadcastReload() {
  try {
    localStorage.setItem(SYNC_KEY, Date.now().toString());
  } catch {
    // ignore storage errors
  }
}

function listenForReload() {
  window.addEventListener('storage', (event) => {
    if (event.key === SYNC_KEY && event.newValue) {
      loadFeed();
    }
  });
}

function initCompactMode() {
  const saved = localStorage.getItem('newsfeedCompactMode');
  const enabled = saved === '1';
  setCompactMode(enabled);

  if (compactBtn) {
    compactBtn.addEventListener('click', () => {
      setCompactMode(!document.body.classList.contains('compact'));
    });
  }
}

// Boot
loadBtn.addEventListener('click', () => {
  loadFeed();
  broadcastReload();
});
refreshIntervalEl.addEventListener('change', (event) => {
  scheduleAutoRefresh(Number(event.target.value));
});

initCompactMode();
listenForReload();
loadFeed();
scheduleAutoRefresh(Number(refreshIntervalEl.value));
