// PDF.js setup
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const RSS_FEED_URL = 'https://www.nrk.no/toppsaker.rss';
const RSS_ITEM_LIMIT = 25;

// CORS proxy list; the app will try them in order if the feed cannot be fetched directly.
const CORS_PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://api.allorigins.cf/raw?url=',
    'https://thingproxy.freeboard.io/fetch/',
];

const AUTO_REFRESH_DEFAULT_MINUTES = 10;
const AUTO_REFRESH_OPTIONS = [
    { value: 0, label: 'Off' },
    { value: 5, label: 'Every 5 min' },
    { value: 10, label: 'Every 10 min' },
    { value: 30, label: 'Every 30 min' },
];

const DEFAULT_SLIDES = [
    {
        title: "Slide 1",
        content: "Welcome to the Slide Viewer"
    },
    {
        title: "Slide 2",
        content: "Upload your PowerPoint presentation to get started"
    },
    {
        title: "Slide 3",
        content: "Use the navigation buttons to move between slides"
    }
];

let slides = [...DEFAULT_SLIDES];

let currentSlideIndex = 0;
let currentPDF = null;
let isPlaying = false;
let slideshowTimer = null;
let countdownInterval = null;
const SLIDESHOW_DURATION = 45; // seconds

let currentFeedUrl = RSS_FEED_URL;
let autoRefreshTimer = null;
let autoRefreshCountdown = null;
let nextAutoRefreshAt = null;

// DOM Elements
const slideElement = document.getElementById('slide');
const currentSlideSpan = document.getElementById('currentSlide');
const totalSlidesSpan = document.getElementById('totalSlides');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const fileInput = document.getElementById('fileInput');
const pdfCanvas = document.getElementById('pdfCanvas');
const fileInfo = document.getElementById('fileInfo');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const playBtn = document.getElementById('playBtn');
const refreshBtn = document.getElementById('refreshBtn');
const feedUrlInput = document.getElementById('feedUrlInput');
const loadFeedBtn = document.getElementById('loadFeedBtn');
const refreshIntervalSelect = document.getElementById('refreshInterval');
const autoRefreshInfo = document.getElementById('autoRefreshInfo');
const storyList = document.getElementById('storyList');
const toggleIndexBtn = document.getElementById('toggleIndexBtn');
const timerDisplay = document.getElementById('timer');

// Initialize
function init() {
    // Show a temporary loading slide while the RSS fetch is in progress
    slides = [{ title: 'Loading…', content: 'Fetching latest news from NRK...' }];
    currentSlideIndex = 0;
    totalSlidesSpan.textContent = slides.length;
    displaySlide();
    updateButtons();
    renderStoryIndex();

    // Wire up RSS feed controls
    refreshBtn.addEventListener('click', () => loadRssFeed(currentFeedUrl));

    if (feedUrlInput) {
        feedUrlInput.value = currentFeedUrl;
    }
    if (loadFeedBtn) {
        loadFeedBtn.addEventListener('click', () => loadRssFeed(feedUrlInput.value));
    }

    if (refreshIntervalSelect) {
        refreshIntervalSelect.value = String(AUTO_REFRESH_DEFAULT_MINUTES);
        refreshIntervalSelect.addEventListener('change', (e) => {
            setAutoRefresh(Number(e.target.value));
        });
    }

    if (toggleIndexBtn) {
        toggleIndexBtn.addEventListener('click', () => {
            const indexElem = document.getElementById('storyIndex');
            if (!indexElem) return;
            const collapsed = indexElem.classList.toggle('collapsed');
            toggleIndexBtn.textContent = collapsed ? 'Show' : 'Hide';
        });
    }

    // Load RSS feed immediately
    loadRssFeed();
    setAutoRefresh(AUTO_REFRESH_DEFAULT_MINUTES);

    // Try to enter fullscreen on load (may be blocked by browser policy)
    requestFullscreen();
}

// Try fetching the RSS feed, using CORS proxies if needed.
async function fetchWithCorsFallback(targetUrl) {
    // Try direct fetch first
    try {
        return await fetch(targetUrl);
    } catch {
        // fall through to proxies
    }

    let lastError = null;
    for (const proxy of CORS_PROXIES) {
        try {
            const resp = await fetch(proxy + encodeURIComponent(targetUrl));
            if (!resp.ok) throw new Error(`Proxy ${proxy} returned ${resp.status}`);
            return resp;
        } catch (err) {
            lastError = err;
        }
    }

    throw lastError || new Error('Failed to fetch feed, and no proxy succeeded.');
}

// Fetch and parse RSS feed
async function loadRssFeed(feedUrl = currentFeedUrl) {
    try {
        const normalizedUrl = (feedUrl || '').trim();
        if (!normalizedUrl) throw new Error('RSS feed URL is empty');

        currentFeedUrl = normalizedUrl;
        feedUrlInput.value = currentFeedUrl;

        fileInfo.textContent = 'Loading RSS feed...';
        loadFeedBtn.disabled = true;

        const response = await fetchWithCorsFallback(currentFeedUrl);
        if (!response.ok) throw new Error(`Network error: ${response.status}`);

        const text = await response.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'application/xml');

        const items = Array.from(xml.querySelectorAll('item')).slice(0, RSS_ITEM_LIMIT);
        if (!items.length) throw new Error('No items found in RSS feed.');

        slides = items.map((item) => {
            const title = item.querySelector('title')?.textContent?.trim() || 'No title';
            const description = item.querySelector('description')?.textContent?.trim() || '';
            const link = item.querySelector('link')?.textContent?.trim() || '';
            const pubDate = item.querySelector('pubDate')?.textContent?.trim() || '';

            const contentParts = [];
            if (description) contentParts.push(`<p>${description}</p>`);
            if (link) contentParts.push(`<p><a href="${link}" target="_blank" rel="noopener">Read full story</a></p>`);
            if (pubDate) contentParts.push(`<p class="meta">Published: ${pubDate}</p>`);

            return {
                title,
                content: contentParts.join('')
            };
        });

        currentSlideIndex = 0;
        totalSlidesSpan.textContent = slides.length;
        displaySlide();
        updateButtons();
        renderStoryIndex();

        fileInfo.textContent = `Loaded ${slides.length} stories from NRK.`;
    } catch (error) {
        console.error('RSS load error:', error);

        let errorMessage = 'Failed to load RSS feed — showing default slides.';
        if (error?.message) {
            errorMessage = `Failed to load RSS feed: ${error.message}`;
        }

        fileInfo.innerHTML = `${errorMessage} <a href="${currentFeedUrl}" target="_blank" rel="noopener">Open feed</a>`;

        slides = [...DEFAULT_SLIDES];
        currentSlideIndex = 0;
        totalSlidesSpan.textContent = slides.length;
        displaySlide();
        updateButtons();
        renderStoryIndex();
    } finally {
        loadFeedBtn.disabled = false;
    }
}


// Display current slide
function displaySlide() {
    const slide = slides[currentSlideIndex];
    currentSlideSpan.textContent = currentSlideIndex + 1;

    if (currentPDF) {
        // Display PDF page
        renderPDFPage(currentSlideIndex + 1);
        return;
    }

    // Display text slide
    slideElement.style.display = 'flex';
    slideElement.innerHTML = '';

    const titleEl = document.createElement('h1');
    titleEl.textContent = slide.title;

    const contentEl = document.createElement('div');
    contentEl.className = 'slide-content';
    contentEl.innerHTML = slide.content || '';

    slideElement.appendChild(titleEl);
    slideElement.appendChild(contentEl);

    updateStoryIndexSelection();
}

function renderStoryIndex() {
    if (!storyList) return;

    storyList.innerHTML = '';
    slides.forEach((slide, idx) => {
        const li = document.createElement('li');
        li.textContent = slide.title || `Slide ${idx + 1}`;
        li.dataset.index = String(idx);
        li.addEventListener('click', () => {
            currentSlideIndex = idx;
            displaySlide();
            updateButtons();
        });

        storyList.appendChild(li);
    });

    updateStoryIndexSelection();
}

function updateStoryIndexSelection() {
    if (!storyList) return;

    const items = storyList.querySelectorAll('li');
    items.forEach((li) => {
        const idx = Number(li.dataset.index);
        li.classList.toggle('active', idx === currentSlideIndex);
    });
}

function setAutoRefresh(minutes) {
    clearInterval(autoRefreshTimer);
    clearInterval(autoRefreshCountdown);
    nextAutoRefreshAt = null;

    if (!autoRefreshInfo) return;

    if (!minutes || minutes <= 0) {
        autoRefreshInfo.textContent = '';
        return;
    }

    const intervalMs = minutes * 60 * 1000;
    nextAutoRefreshAt = Date.now() + intervalMs;

    autoRefreshTimer = setInterval(() => {
        loadRssFeed();
        nextAutoRefreshAt = Date.now() + intervalMs;
    }, intervalMs);

    autoRefreshCountdown = setInterval(() => {
        if (!nextAutoRefreshAt) return;
        const remaining = Math.max(0, nextAutoRefreshAt - Date.now());
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        autoRefreshInfo.textContent = `Next refresh in ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }, 1000);
}

// Render PDF page
async function renderPDFPage(pageNum) {
    try {
        slideElement.style.display = 'none';
        const page = await currentPDF.getPage(pageNum);
        const scale = 2;
        const viewport = page.getViewport({ scale: scale });
        const context = pdfCanvas.getContext('2d');
        pdfCanvas.width = viewport.width;
        pdfCanvas.height = viewport.height;
        pdfCanvas.style.display = 'block';

        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;
    } catch (error) {
        console.error('Error rendering PDF page:', error);
    }
}

// Update button states
function updateButtons() {
    prevBtn.disabled = currentSlideIndex === 0;
    nextBtn.disabled = currentSlideIndex === (currentPDF ? currentPDF.numPages : slides.length) - 1;
}

// Navigation functions
function nextSlide() {
    const totalPages = currentPDF ? currentPDF.numPages : slides.length;
    if (currentSlideIndex < totalPages - 1) {
        currentSlideIndex++;
        displaySlide();
        updateButtons();
    }
}

function prevSlide() {
    if (currentSlideIndex > 0) {
        currentSlideIndex--;
        displaySlide();
        updateButtons();
    }
}

// Event listeners
nextBtn.addEventListener('click', nextSlide);
prevBtn.addEventListener('click', prevSlide);

// Fullscreen toggle
fullscreenBtn.addEventListener('click', toggleFullscreen);

// Play/Pause slideshow
playBtn.addEventListener('click', toggleSlideshow);

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') nextSlide();
    if (e.key === 'ArrowLeft') prevSlide();
    if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    if (e.key === 'Escape') exitFullscreen();
    if (e.key === ' ') {
        e.preventDefault();
        toggleSlideshow();
    }
});

// Fullscreen functions
function requestFullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => console.log('Fullscreen request denied'));
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
    }
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        requestFullscreen();
    } else {
        exitFullscreen();
    }
}

function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    }
}

// Slideshow functions
function toggleSlideshow() {
    if (isPlaying) {
        stopSlideshow();
    } else {
        startSlideshow();
    }
}

function startSlideshow() {
    isPlaying = true;
    playBtn.textContent = '⏸ Pause';
    playBtn.classList.add('playing');
    timerDisplay.style.display = 'inline-block';
    
    // Disable manual navigation buttons
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    
    startCountdown();
}

function stopSlideshow() {
    isPlaying = false;
    playBtn.textContent = '▶ Play';
    playBtn.classList.remove('playing');
    timerDisplay.style.display = 'none';
    timerDisplay.textContent = '45s';
    
    // Enable manual navigation buttons
    prevBtn.disabled = false;
    nextBtn.disabled = false;
    
    clearTimeout(slideshowTimer);
    clearInterval(countdownInterval);
}

function startCountdown() {
    let secondsRemaining = SLIDESHOW_DURATION;
    timerDisplay.textContent = secondsRemaining + 's';

    countdownInterval = setInterval(() => {
        secondsRemaining--;
        timerDisplay.textContent = secondsRemaining + 's';

        if (secondsRemaining <= 0) {
            clearInterval(countdownInterval);

            const totalSlides = currentPDF ? currentPDF.numPages : slides.length;
            if (currentSlideIndex < totalSlides - 1) {
                currentSlideIndex++;
                displaySlide();
                startCountdown();
            } else {
                // Reached end, stop slideshow
                stopSlideshow();
            }
        }
    }, 1000);
}

// File upload handler
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.pdf')) {
        // Handle PDF files
        try {
            const fileReader = new FileReader();
            fileReader.onload = async (event) => {
                const typedarray = new Uint8Array(event.target.result);
                const pdf = await pdfjsLib.getDocument(typedarray).promise;
                currentPDF = pdf;
                currentSlideIndex = 0;
                totalSlidesSpan.textContent = pdf.numPages;
                fileInfo.textContent = `PDF loaded: ${pdf.numPages} pages`;
                displaySlide();
                updateButtons();
            };
            fileReader.readAsArrayBuffer(file);
        } catch (error) {
            alert('Error loading PDF: ' + error.message);
            fileInfo.textContent = '';
        }
    } else if (fileName.endsWith('.pptx') || fileName.endsWith('.ppt')) {
        alert('PowerPoint support requires a server-side conversion or the pptxjs library.\n\nTip: Convert to PDF for full support!');
        fileInfo.textContent = 'Please convert PowerPoint to PDF';
    } else if (fileName.endsWith('.odp')) {
        alert('ODP files require a specialized library.\n\nTip: Export as PDF for easier viewing!');
        fileInfo.textContent = 'Please export ODP as PDF';
    } else {
        alert('Please upload a PDF file (.pdf)');
        fileInfo.textContent = '';
    }
});

// Initialize on page load
init();
