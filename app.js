(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  let lastResult = null;
  let drawing = false;
  let drawController = null;
  let closing = false;
  const locationText = food => food.type === 'store'
    ? ['独立店铺', food.location].filter(Boolean).join(' · ')
    : [food.placeName, food.floor].filter(Boolean).join(' · ');
  const defaultFoodImage = './assets/other/food-placeholder.svg';
  function showFoodImage(food) {
    const files = window.foodImageFiles;
    const file = files[food.name] || files[window.foodImageMap[food.name]];
    const image = $('#result-image');
    image.alt = file ? `${food.name}示意插画` : '暂无食物插画';
    image.onerror = () => {
      image.onerror = null; // 默认图加载失败也不循环重试。
      image.alt = '暂无食物插画';
      image.src = defaultFoodImage;
    };
    image.src = file ? `./assets/food/${encodeURIComponent(file)}` : defaultFoodImage;
  }
  let toastTimer;
  function toast(message) {
    $('#toast').textContent = message;
    $('#toast').hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 2600);
  }
  function updatePool() {
    $('#pool-summary').textContent = `全部 · ${window.systemFoods.length} 个吃饭选项`;
  }
  function showPage() {
    let page = location.hash.slice(1) || 'home';
    if (!['home', 'result'].includes(page) || (page === 'result' && !lastResult)) page = 'home';
    if (drawing) drawController?.abort();
    const isResult = page === 'result';
    document.body.classList.add('is-home');
    document.body.classList.toggle('is-opening', isResult);
    $('#opening-overlay').hidden = !isResult;
    $('#opening-overlay').classList.toggle('is-result', isResult);
    $('#opening-overlay').classList.remove('is-closing');
    $('#opening-overlay').setAttribute('aria-label', isResult ? '抽取结果' : '扭蛋打开');
    $('#result').hidden = !isResult;
    $('#result').inert = false;
    $('.app').inert = isResult;
    $('#reveal-result').hidden = true;
    if (page === 'home' && !drawing) machinePlayer.reset();
    $('#home').hidden = false;
    updatePool();
    window.scrollTo(0, 0);
    $(isResult ? '#result-name' : '#home-title').focus({ preventScroll: true });
  }
  function navigate(page) {
    if (location.hash !== `#${page}`) history.pushState(null, '', `#${page}`);
    showPage();
  }

  // 透明帧图集替代自动循环 GIF。只缓存当前、下一张图集，避免手机解码全部帧。
  function createFramePlayer(canvasSelector, posterSelector, assetDirectory, manifestPath) {
    const canvas = $(canvasSelector);
    const context = canvas.getContext('2d');
    const poster = $(posterSelector);
    const cache = new Map();
    let playbackRate = 1;
    let manifestPromise;
    const manifest = () => manifestPromise ||= fetch(manifestPath)
      .then(response => { if (!response.ok) throw new Error('Animation unavailable'); return response.json(); })
      .catch(error => { manifestPromise = null; throw error; });
    function sheet(name) {
      if (!cache.has(name)) {
        const image = new Image();
        image.src = `${assetDirectory}/${name}`;
        // 预取失败也有处理器，真正使用时统一向播放流程报错。
        cache.set(name, image.decode().then(() => image).catch(() => null));
      }
      return cache.get(name);
    }
    function reset() {
      playbackRate = 1;
      canvas.hidden = true;
      poster.hidden = false;
      canvas.dataset.frame = '0';
    }
    async function play(signal) {
      if (!context) throw new Error('Canvas unavailable');
      const data = await manifest();
      canvas.width = data.width;
      canvas.height = data.height;
      for (let group = 0; group < data.sheets.length; group++) {
        signal.throwIfAborted();
        const name = data.sheets[group];
        const image = await sheet(name);
        signal.throwIfAborted();
        if (!image) { cache.delete(name); throw new Error('Animation image unavailable'); }
        if (data.sheets[group + 1]) sheet(data.sheets[group + 1]);
        for (const key of cache.keys()) {
          if (key !== name && key !== data.sheets[group + 1]) cache.delete(key);
        }
        const start = group * data.perSheet;
        const durations = data.durations.slice(start, start + data.perSheet);
        await new Promise((resolve, reject) => {
          let request, elapsed = 0, previousTime = null, painted = -1;
          const total = durations.reduce((sum, duration) => sum + duration, 0);
          function cleanup() {
            cancelAnimationFrame(request);
            signal.removeEventListener('abort', abort);
            document.removeEventListener('visibilitychange', visibility);
          }
          function abort() { cleanup(); reject(new DOMException('Playback cancelled', 'AbortError')); }
          function visibility() { previousTime = null; }
          function tick(time) {
            if (!document.hidden) {
              if (previousTime !== null) elapsed += Math.min(time - previousTime, 100) * playbackRate;
              previousTime = time;
              let cell = 0, end = durations[0];
              while (cell < durations.length - 1 && elapsed >= end) end += durations[++cell];
              if (cell !== painted) {
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.drawImage(image, (cell % data.columns) * data.width, Math.floor(cell / data.columns) * data.height,
                  data.width, data.height, 0, 0, data.width, data.height);
                canvas.dataset.frame = String(start + cell);
                canvas.hidden = false;
                poster.hidden = true;
                painted = cell;
              }
              if (elapsed >= total) { cleanup(); resolve(); return; }
            }
            request = requestAnimationFrame(tick);
          }
          signal.addEventListener('abort', abort, { once: true });
          document.addEventListener('visibilitychange', visibility);
          if (signal.aborted) abort();
          else request = requestAnimationFrame(tick);
        });
      }
      // 最后一帧保持在 canvas 中，不启动下一轮，也不在结束前切走。
    }
    async function prepare() {
      const data = await manifest();
      // 抽取阶段提前准备打开动画首张图集，让两个动画连续衔接。
      const first = await sheet(data.sheets[0]);
      if (!first) { cache.delete(data.sheets[0]); throw new Error('Animation image unavailable'); }
    }
    return { play, reset, prepare, fastForward: () => { playbackRate = 4; } };
  }
  const machinePlayer = createFramePlayer('#machine-animation', '#machine-idle', './assets/machine', './machine-manifest.json');
  const openingPlayer = createFramePlayer('#opening-animation', '#opening-idle', './assets/opening', './opening-manifest.json');
  $('#opening-overlay').addEventListener('click', () => {
    // 仅打开阶段响应：点击加速剩余动画，末帧之后的点击仍用于查看结果。
    if (!drawing || $('#opening-overlay').hidden || !$('#reveal-result').hidden || !$('#result').hidden) return;
    openingPlayer.fastForward();
    $('#opening-overlay').getAnimations({ subtree: true }).forEach(animation => animation.updatePlaybackRate(4));
  });

  function waitForResultClick(signal) {
    return new Promise((resolve, reject) => {
      const button = $('#reveal-result');
      function cleanup() {
        button.removeEventListener('click', reveal);
        signal.removeEventListener('abort', abort);
      }
      function reveal() { cleanup(); resolve(); }
      function abort() { cleanup(); reject(new DOMException('Reveal cancelled', 'AbortError')); }
      if (signal.aborted) { abort(); return; }
      button.hidden = false;
      button.addEventListener('click', reveal, { once: true });
      signal.addEventListener('abort', abort, { once: true });
      button.focus({ preventScroll: true });
    });
  }

  async function openCapsule(signal, openingReady) {
    signal.throwIfAborted();
    openingPlayer.reset();
    $('#reveal-result').hidden = true;
    $('#opening-overlay').hidden = false;
    document.body.classList.add('is-opening');
    $('.app').inert = true;
    $('#opening-overlay').focus({ preventScroll: true });
    // 等入场动画真正完成后再打开球壳；减少动态效果时 CSS 不产生动画，直接继续。
    const entrance = new Promise((resolve, reject) => {
      const animations = $('#opening-overlay').getAnimations({ subtree: true });
      function abort() {
        animations.forEach(animation => animation.cancel());
        reject(new DOMException('Entrance cancelled', 'AbortError'));
      }
      signal.addEventListener('abort', abort, { once: true });
      Promise.all(animations.map(animation => animation.finished)).then(resolve, reject)
        .finally(() => signal.removeEventListener('abort', abort));
      if (signal.aborted) abort();
    });
    const [preloadError] = await Promise.all([openingReady, entrance]);
    signal.throwIfAborted();
    if (preloadError) throw preloadError;
    await openingPlayer.play(signal);
    signal.throwIfAborted();
    await waitForResultClick(signal);
  }
  async function draw() {
    if (drawing || closing) return;
    const pool = window.systemFoods;
    if (!pool.length) { toast('暂无吃饭选项。'); return; }
    const candidates = pool.length > 1 ? pool.filter(food => food.id !== lastResult?.id) : pool;
    const selectedFood = candidates[Math.floor(Math.random() * candidates.length)];
    $('#result-name').textContent = selectedFood.name;
    $('#result-place').textContent = locationText(selectedFood);
    showFoodImage(selectedFood); // 在动画期间加载结果图片，避免弹窗出现时才请求大图。
    let completed = false;
    drawing = true;
    drawController = new AbortController();
    const { signal } = drawController;
    $('#draw').disabled = true;
    $('#home').setAttribute('aria-busy', 'true');
    $('#home-draw-status').textContent = '扭一扭，今天吃什么…';
    $('#home-draw-status').hidden = false;
    try {
      // 立即处理预取错误，播放结束后统一恢复 UI，避免未处理的 Promise。
      const openingReady = openingPlayer.prepare().then(() => null, error => error);
      await machinePlayer.play(signal);
      signal.throwIfAborted();
      await openCapsule(signal, openingReady);
      signal.throwIfAborted();
      lastResult = selectedFood;
      completed = true;
    } catch (error) {
      machinePlayer.reset();
      if (error.name !== 'AbortError') toast('动画加载失败，请检查网络后重新抽取。');
      return;
    } finally {
      drawing = false;
      drawController = null;
      if (!completed) $('#opening-overlay').hidden = true;
      $('#reveal-result').hidden = true;
      if (!completed) document.body.classList.remove('is-opening');
      $('#draw').disabled = false;
      $('#home').removeAttribute('aria-busy');
      $('#home-draw-status').hidden = true;
      $('.app').inert = completed;
    }
    navigate('result');
  }
  async function closeResult(redraw = false) {
    if (closing || drawing || $('#result').hidden) return;
    closing = true;
    $('#result').inert = true;
    $('#opening-overlay').classList.add('is-closing');
    await Promise.allSettled($('#opening-overlay').getAnimations({ subtree: true }).map(animation => animation.finished));
    // 如已通过浏览器返回离开弹窗，不再触发一次额外抽取。
    const stayedOnResult = location.hash === '#result';
    if (stayedOnResult) navigate('home');
    closing = false;
    if (redraw && stayedOnResult) draw();
  }
  $('#draw').addEventListener('click', draw);
  $('#redraw').addEventListener('click', () => closeResult(true));
  $('#choose').addEventListener('click', () => closeResult());
  $('#close-result').addEventListener('click', () => closeResult());
  $('#opening-overlay').addEventListener('keydown', event => {
    if ($('#result').hidden) return;
    if (event.key === 'Escape') closeResult();
    if (event.key === 'Tab') {
      const buttons = [$('#redraw'), $('#choose'), $('#close-result')];
      const index = buttons.indexOf(document.activeElement);
      event.preventDefault();
      buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus();
    }
  });

  window.addEventListener('hashchange', showPage);
  showPage();
})();
