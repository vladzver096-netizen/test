(async () => {
  const MANIFEST_URL = 'data/videos.json';
  const LOAD_RADIUS = 2;

  const feed = document.getElementById('feed');
  const volumeBtn = document.getElementById('volumeBtn');
  const volumeSlider = document.getElementById('volumeSlider');
  const navPrev = document.getElementById('navPrev');
  const navNext = document.getElementById('navNext');

  let muted = true;
  let volume = 1;
  let activeIndex = -1;

  let sources = [];
  try {
    const res = await fetch(MANIFEST_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    sources = await res.json();
    if (!Array.isArray(sources) || sources.length === 0) throw new Error('empty manifest');
  } catch (err) {
    feed.innerHTML = `<div class="feed-error">Failed to load the video list.<br>${err.message}</div>`;
    navPrev.disabled = true;
    navNext.disabled = true;
    return;
  }

  const slides = sources.map((src, index) => {
    const slide = document.createElement('div');
    slide.className = 'slide';
    slide.dataset.index = String(index);

    const video = document.createElement('video');
    video.dataset.src = src;
    video.loop = true;
    video.muted = muted;
    video.volume = volume;
    video.playsInline = true;
    video.preload = 'none';

    const spinner = document.createElement('div');
    spinner.className = 'spinner';

    const errorMsg = document.createElement('div');
    errorMsg.className = 'error-msg';
    errorMsg.textContent = 'Video unavailable';

    const playIcon = document.createElement('div');
    playIcon.className = 'play-icon';
    playIcon.innerHTML = '<img src="img/play.svg" width="32" height="32" alt="" />';

    const seekBar = document.createElement('input');
    seekBar.type = 'range';
    seekBar.className = 'seek-bar';
    seekBar.min = '0';
    seekBar.max = '1';
    seekBar.step = '0.001';
    seekBar.value = '0';
    seekBar.setAttribute('aria-label', 'Seek');

    let isSeeking = false;

    video.addEventListener('canplay', () => slide.classList.add('is-ready'));
    video.addEventListener('waiting', () => slide.classList.remove('is-ready'));

    video.addEventListener('error', () => {
      if (!video.getAttribute('src')) return;
      slide.classList.add('is-error');
      slide.classList.remove('is-ready');
    });

    video.addEventListener('timeupdate', () => {
      if (isSeeking || !video.duration) return;
      seekBar.value = String(video.currentTime / video.duration);
    });

    seekBar.addEventListener('input', () => {
      isSeeking = true;
      if (video.duration) video.currentTime = Number(seekBar.value) * video.duration;
    });

    seekBar.addEventListener('change', () => {
      isSeeking = false;
    });

    seekBar.addEventListener('click', (e) => e.stopPropagation());

    slide.addEventListener('click', () => togglePlay(slide));

    slide.append(video, spinner, errorMsg, playIcon, seekBar);
    feed.appendChild(slide);
    return slide;
  });

  function togglePlay(slide) {
    const video = slide.querySelector('video');
    if (!video.src) return;
    if (video.paused) {
      video.play().catch(() => {});
      slide.classList.remove('is-paused');
    } else {
      video.pause();
      slide.classList.add('is-paused');
    }
  }

  function loadSlide(slide) {
    const video = slide.querySelector('video');
    if (video.src) return;
    slide.classList.remove('is-error');
    video.preload = 'auto';
    video.src = video.dataset.src;
    video.load();
  }

  function unloadSlide(slide) {
    const video = slide.querySelector('video');
    if (!video.src) return;
    video.pause();
    video.removeAttribute('src');
    video.preload = 'none';
    video.load();
    slide.classList.remove('is-ready');
    slide.querySelector('.seek-bar').value = '0';
  }

  function setActive(index) {
    if (index === activeIndex) return;
    activeIndex = index;
    navPrev.disabled = index <= 0;
    navNext.disabled = index >= slides.length - 1;

    slides.forEach((slide, i) => {
      const video = slide.querySelector('video');
      if (Math.abs(i - index) <= LOAD_RADIUS) {
        loadSlide(slide);
      } else {
        unloadSlide(slide);
      }
      if (i === index) {
        video.currentTime = 0;
        video.play().catch(() => {});
        slide.classList.remove('is-paused');
      } else if (video.src) {
        video.pause();
      }
    });
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          setActive(Number(entry.target.dataset.index));
        }
      });
    },
    { root: feed, threshold: [0.6] }
  );

  slides.forEach((slide) => observer.observe(slide));

  function goTo(index) {
    const target = Math.min(Math.max(index, 0), slides.length - 1);
    slides[target].scrollIntoView({ behavior: 'smooth' });
  }

  navPrev.addEventListener('click', () => goTo(activeIndex - 1));
  navNext.addEventListener('click', () => goTo(activeIndex + 1));

  document.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowDown':
      case 'PageDown':
        e.preventDefault();
        goTo(activeIndex + 1);
        break;
      case 'ArrowUp':
      case 'PageUp':
        e.preventDefault();
        goTo(activeIndex - 1);
        break;
      case ' ':
        e.preventDefault();
        if (slides[activeIndex]) togglePlay(slides[activeIndex]);
        break;
    }
  });

  function volumeStateClass() {
    if (muted || volume === 0) return 'vol-mute';
    return volume < 0.5 ? 'vol-low' : 'vol-high';
  }

  function applyVolume() {
    volumeBtn.classList.remove('vol-mute', 'vol-low', 'vol-high');
    volumeBtn.classList.add(volumeStateClass());
    volumeSlider.value = String(volume);
    slides.forEach((slide) => {
      const video = slide.querySelector('video');
      video.muted = muted;
      video.volume = volume;
    });
  }

  volumeBtn.addEventListener('click', () => {
    muted = !muted;
    applyVolume();
  });

  volumeSlider.addEventListener('input', () => {
    volume = Number(volumeSlider.value);
    muted = volume === 0;
    applyVolume();
  });

  applyVolume();
  setActive(0);
})();
