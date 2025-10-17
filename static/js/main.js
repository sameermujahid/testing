// main.js - handles thumbnails, drag/drop preview, viewer controls, and theme transitions

window.handleFiles = function(fileList) {
    const thumbs = document.getElementById('thumbs');
    const live = document.getElementById('livePreview');
    if (!thumbs || !live) return;
    thumbs.innerHTML = '';
    live.innerHTML = '<div class="text-white/50">Preview area</div>';
  
    const files = Array.from(fileList).filter(f => f.type.startsWith('image'));
    if (!files.length) {
      live.innerHTML = '<div class="text-white/50">No images yet</div>';
      return;
    }
  
    files.forEach((file, i) => {
      const reader = new FileReader();
      reader.onload = function(e) {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.title = file.name;
        img.className = 'rounded';
        img.style.width = '100%';
        img.style.height = '80px';
        img.style.objectFit = 'cover';
        img.addEventListener('click', ()=> {
          live.innerHTML = '';
          const big = new Image();
          big.src = e.target.result;
          big.style.maxWidth = '100%';
          big.style.maxHeight = '100%';
          live.appendChild(big);
        });
        const wrap = document.createElement('div');
        wrap.appendChild(img);
        thumbs.appendChild(wrap);
        if (i === 0) {
          live.innerHTML = '';
          const big = new Image();
          big.src = e.target.result;
          big.style.maxWidth = '100%';
          big.style.maxHeight = '100%';
          live.appendChild(big);
        }
      };
      reader.readAsDataURL(file);
    });
  };
  
  window.openPreview = function(images, theme, song) {
    const win = window.open('', '_blank', 'width=900,height=600');
    win.document.write('<title>Preview</title>');
    win.document.write('<style>body{margin:0;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh} img{max-width:90%;max-height:90%;object-fit:contain;transition:opacity .8s,transform .8s}</style>');
    const img = new Image();
    let idx = 0;
    img.src = images[0];
    win.document.body.appendChild(img);
    let timer = setInterval(()=> {
      idx = (idx+1) % images.length;
      img.style.opacity = 0;
      setTimeout(()=> { img.src = images[idx]; img.style.opacity = 1; }, 500);
    }, theme === 'vibrant' ? 2200 : 3000);
  
    win.onbeforeunload = ()=> clearInterval(timer);
  };
  
  window.handleDragOver = function(e) {
    e.preventDefault();
    e.stopPropagation();
  };
  
  window.handleDrop = function(e) {
    e.preventDefault();
    e.stopPropagation();
    const dt = e.dataTransfer;
    if (dt && dt.files) {
      document.getElementById('imagesInput').files = dt.files;
      window.handleFiles(dt.files);
    }
  };
  
  // Viewer logic
  window.initViewer = function(images, theme, song) {
    console.log('initViewer called with:', { images, theme, song });
    const viewer = document.getElementById('viewer');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const playPause = document.getElementById('playPause');
    const fsBtn = document.getElementById('fsBtn');
    const bgAudio = document.getElementById('bgAudio');

    // Check if we have images
    if (!images || images.length === 0) {
      console.error('No images provided to viewer');
      viewer.innerHTML = '<div class="text-white/50 text-center">No images to display</div>';
      return;
    }

    let idx = 0;
    let timer = null;
    let playing = true;
    let progressTimer = null;
    let slideStartTime = 0;
  
    function show(i) {
      viewer.innerHTML = '';
      const src = images[i];
      console.log('Showing image:', src, 'at index:', i);
      
      if (!src) {
        console.error('No image source at index:', i);
        viewer.innerHTML = '<div class="text-white/50 text-center">Image not found</div>';
        return;
      }
      
      // Create container with professional styling
      const container = document.createElement('div');
      container.className = 'slide-container';
      container.style.cssText = `
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border-radius: 16px;
        border: 2px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3), 
                    0 0 0 1px rgba(255, 255, 255, 0.05),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1);
        background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
        backdrop-filter: blur(10px);
        transition: all 1.2s cubic-bezier(0.4, 0, 0.2, 1);
      `;
      
      const el = document.createElement('img');
      el.src = src;
      el.style.cssText = `
        max-width: 100%;
        max-height: 100%;
        width: auto;
        height: auto;
        border-radius: 14px;
        transition: all 1.2s cubic-bezier(0.4, 0, 0.2, 1);
        transform: scale(1);
      `;
      
      // Add error handling for image loading
      el.onerror = function() {
        console.error('Failed to load image:', src);
        viewer.innerHTML = '<div class="text-white/50 text-center">Failed to load image</div>';
      };
      
      el.onload = function() {
        console.log('Image loaded successfully:', src);
        // Add entrance animation
        container.style.opacity = '0';
        container.style.transform = 'scale(0.95) translateY(20px)';
        setTimeout(() => {
          container.style.opacity = '1';
          container.style.transform = 'scale(1) translateY(0)';
        }, 50);
        
        // Update slide counter
        const slideCounter = document.getElementById('slideCounter');
        if (slideCounter) {
          slideCounter.textContent = `${i + 1} / ${images.length}`;
        }
        
        // Reset progress bar
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
          progressBar.style.width = '0%';
        }
        
        slideStartTime = Date.now();
      };
      
      // Professional theme effects
      if (theme === 'vibrant') {
        el.style.filter = 'saturate(1.2) contrast(1.1) brightness(1.05)';
        el.style.transform = 'scale(1.02)';
        container.style.boxShadow = '0 25px 50px rgba(255, 0, 150, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1)';
      } else if (theme === 'retro') {
        el.style.filter = 'sepia(0.15) contrast(0.9) saturate(0.8) brightness(0.95)';
        el.style.transform = 'scale(1.01)';
        container.style.boxShadow = '0 20px 40px rgba(139, 69, 19, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)';
      } else if (theme === 'minimal') {
        el.style.filter = 'none';
        el.style.transform = 'scale(1)';
        container.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1)';
      } else { // cinematic
        el.style.filter = 'brightness(0.98) contrast(1.05) saturate(1.1)';
        el.style.transform = 'scale(1.01)';
        container.style.boxShadow = '0 30px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.08)';
      }
      
      container.appendChild(el);
      viewer.appendChild(container);
    }
  
    function next() { 
      // Add exit animation before changing
      const currentSlide = viewer.querySelector('.slide-container');
      if (currentSlide) {
        currentSlide.style.opacity = '0';
        currentSlide.style.transform = 'scale(0.95) translateX(-20px)';
        setTimeout(() => {
          idx = (idx+1) % images.length; 
          show(idx);
        }, 300);
      } else {
        idx = (idx+1) % images.length; 
        show(idx);
      }
    }
    
    function prev() { 
      // Add exit animation before changing
      const currentSlide = viewer.querySelector('.slide-container');
      if (currentSlide) {
        currentSlide.style.opacity = '0';
        currentSlide.style.transform = 'scale(0.95) translateX(20px)';
        setTimeout(() => {
          idx = (idx-1+images.length) % images.length; 
          show(idx);
        }, 300);
      } else {
        idx = (idx-1+images.length) % images.length; 
        show(idx);
      }
    }
  
    function start() {
      stop();
      const interval = theme === 'vibrant' ? 2500 : theme === 'cinematic' ? 3500 : 3000;
      timer = setInterval(next, interval);
      playing = true;
      playPause.textContent = '⏸️ Pause';
      
      // Start progress animation
      startProgressAnimation(interval);
      
      if (bgAudio && bgAudio.src) bgAudio.play().catch(()=>{});
    }
    
    function stop() {
      if (timer) clearInterval(timer);
      if (progressTimer) clearInterval(progressTimer);
      timer = null;
      progressTimer = null;
      playing = false;
      playPause.textContent = '▶️ Play';
      if (bgAudio) bgAudio.pause();
    }
    
    function startProgressAnimation(duration) {
      if (progressTimer) clearInterval(progressTimer);
      const progressBar = document.getElementById('progressBar');
      if (!progressBar) return;
      
      let startTime = Date.now();
      progressTimer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / duration) * 100, 100);
        progressBar.style.width = progress + '%';
        
        if (progress >= 100) {
          clearInterval(progressTimer);
        }
      }, 50);
    }
  
    prevBtn.addEventListener('click', ()=> { prev(); if (playing) start(); });
    nextBtn.addEventListener('click', ()=> { next(); if (playing) start(); });
    playPause.addEventListener('click', ()=> { if (playing) stop(); else start(); });
    fsBtn.addEventListener('click', ()=> {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen();
      else document.exitFullscreen();
    });
  
    // touch
    let startX = 0;
    viewer.addEventListener('touchstart', (e)=> startX = e.touches[0].clientX);
    viewer.addEventListener('touchend', (e)=> {
      const endX = e.changedTouches[0].clientX;
      if (endX - startX > 30) prev();
      else if (startX - endX > 30) next();
    });
  
    // audio
    if (song) {
      try {
        bgAudio.src = song;
        bgAudio.load();
        bgAudio.volume = 0.9;
      } catch (err) { console.warn(err); }
    }
  
    show(0);
    start();
  };
  