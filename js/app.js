(() => {
  const VIDEO_FILES = [
    '-1381854028232193089.MP4',
    '-2466797579047759691.MP4',
    '-2635594312504430960.MP4',
    '-425148686832983381.MP4',
    '-6974447037748169156.MP4',
    '3698940505591559678.MP4',
    '3746059563046546718.MP4',
    '6702137189532704568.MP4',
    '6737137111559968548.MP4',
    '7578542087815133230.MP4',
    '7870372071727092435.MP4',
  ];

  const LOAD_RADIUS = 1; // how many neighbours (before/after active) keep their src loaded

  const feed = document.getElementById('feed');
  const volumeBtn = document.getElementById('volumeBtn');
  const volumeSlider = document.getElementById('volumeSlider');

  let muted = true;
  let volume = 1;
  let activeIndex = -1;

  const slides = VIDEO_FILES.map((file, index) => {
    const slide = document.createElement('div');
    slide.className = 'slide';
    slide.dataset.index = String(index);

    const video = document.createElement('video');
    video.dataset.src = `video/${file}`;
    video.loop = true;
    video.muted = muted;
    video.volume = volume;
    video.playsInline = true;
    video.preload = 'none';

    const spinner = document.createElement('div');
    spinner.className = 'spinner';

    const playIcon = document.createElement('div');
    playIcon.className = 'play-icon';
    playIcon.innerHTML = '<img src="icons/play.svg" width="32" height="32" alt="" />';

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

    slide.addEventListener('click', () => {
      if (video.paused) {
        video.play().catch(() => {});
        slide.classList.remove('is-paused');
      } else {
        video.pause();
        slide.classList.add('is-paused');
      }
    });

    slide.append(video, spinner, playIcon, seekBar);
    feed.appendChild(slide);
    return slide;
  });

  function loadSlide(slide) {
    const video = slide.querySelector('video');
    if (video.src) return;
    video.src = video.dataset.src;
    video.load();
  }

  function unloadSlide(slide) {
    const video = slide.querySelector('video');
    if (!video.src) return;
    video.pause();
    video.removeAttribute('src');
    video.load();
    slide.classList.remove('is-ready');
    slide.querySelector('.seek-bar').value = '0';
  }

  function setActive(index) {
    if (index === activeIndex) return;
    activeIndex = index;

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
