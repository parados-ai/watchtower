(async function () {
  // Config section: all environment-like variables in one place
  const CONFIG = {
    endpoint: 'https://api.parados.ai/track',
    dnsDomain: 'dns.parados.ai'
  };

  const sessionId = crypto.randomUUID();

  const mouseTrail = [];
  const startTime = Date.now();
  let lastEventTime = 0;

  function recordTrail(x, y, type) {
    mouseTrail.push({
      x,
      y,
      type,
      time: Date.now() - startTime
    });

    if (mouseTrail.length > 1000) {
      mouseTrail.shift();
    }
  }

  const throttleDelay = 50;
  document.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastEventTime > throttleDelay) {
      recordTrail(e.clientX, e.clientY, 'mouse');
      lastEventTime = now;
    }
  });

  document.addEventListener('touchmove', (e) => {
    const now = Date.now();
    if (now - lastEventTime > throttleDelay) {
      const touch = e.touches[0];
      if (touch) recordTrail(touch.clientX, touch.clientY, 'touch');
      lastEventTime = now;
    }
  });

  const fingerprint = await getFingerprint();

  await fetch(CONFIG.endpoint + '/fingerprint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fingerprint)
  });

  setInterval(() => {
    if (mouseTrail.length === 0) return;

    const chunk = mouseTrail.splice(0, mouseTrail.length);

    fetch(CONFIG.endpoint + '/trail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        timestamp: new Date().toISOString(),
        trail: chunk,
        url: window.location.href
      })
    });
  }, 5000);

  window.addEventListener('beforeunload', () => {
    if (mouseTrail.length === 0) return;

    const payload = {
      session_id: sessionId,
      timestamp: new Date().toISOString(),
      trail: mouseTrail,
      url: window.location.href
    };

    navigator.sendBeacon(CONFIG.endpoint + '/trail', JSON.stringify(payload));
  });

    async function getFingerprint() {
      const canvasFingerprint = getCanvasFingerprint();
      const audioFingerprint = await getAudioFingerprint();
      const fonts = detectFonts();
      const battery = await getBatteryInfo();
      const mediaDevices = await getMediaDevicesInfo();

      return {
        session_id: sessionId,
        user_agent: navigator.userAgent,
        language: navigator.language,
        languages: navigator.languages,
        platform: navigator.platform,
        hardware_concurrency: navigator.hardwareConcurrency,
        device_memory: navigator.deviceMemory,
        screen_resolution: `${screen.width}x${screen.height}`,
        color_depth: screen.colorDepth,
        timezone_offset: new Date().getTimezoneOffset(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        touch_support: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        cookie_enabled: navigator.cookieEnabled,
        local_storage: !!window.localStorage,
        session_storage: !!window.sessionStorage,
        indexed_db: !!window.indexedDB,
        canvas_fingerprint: canvasFingerprint,
        audio_fingerprint: audioFingerprint,
        fonts: fonts,
        battery: battery,
        media_devices: mediaDevices,
        webgl_vendor: getWebGLVendor(),
        plugins: Array.from(navigator.plugins).map(p => p.name),
        do_not_track: navigator.doNotTrack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        ref: document.referrer
      };
    }

    function getCanvasFingerprint() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125,1,62,20);
      ctx.fillStyle = '#069';
      ctx.fillText('Browser fingerprint!', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Browser fingerprint!', 4, 17);
      return canvas.toDataURL();
    }

    async function getAudioFingerprint() {
      try {
        const context = new OfflineAudioContext(1, 44100, 44100);
        const oscillator = context.createOscillator();
        const compressor = context.createDynamicsCompressor();

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(10000, context.currentTime);

        oscillator.connect(compressor);
        compressor.connect(context.destination);
        oscillator.start(0);
        context.startRendering();

        const buffer = await new Promise(resolve => {
          context.oncomplete = event => resolve(event.renderedBuffer.getChannelData(0));
        });

        // Simple hash function
        let hash = 0;
        for (let i = 0; i < buffer.length; i++) {
          hash += Math.pow(buffer[i] * 1000, 2);
        }
        return hash.toString();
      } catch (e) {
        return null;
      }
    }

    function detectFonts() {
      const baseFonts = ['monospace', 'sans-serif', 'serif'];
      const testFonts = ['Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia', 'Trebuchet MS'];
      const testString = 'mmmmmmmmmmlli';
      const testSize = '72px';
      const span = document.createElement('span');
      span.style.fontSize = testSize;
      span.innerHTML = testString;
      const defaultWidths = {};

      baseFonts.forEach(base => {
        span.style.fontFamily = base;
        document.body.appendChild(span);
        defaultWidths[base] = span.offsetWidth;
        document.body.removeChild(span);
      });

      return testFonts.filter(font => {
        return baseFonts.some(base => {
          span.style.fontFamily = `${font},${base}`;
          document.body.appendChild(span);
          const matched = span.offsetWidth !== defaultWidths[base];
          document.body.removeChild(span);
          return matched;
        });
      });
    }

    async function getBatteryInfo() {
      try {
        const battery = await navigator.getBattery();
        return {
          charging: battery.charging,
          level: battery.level,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime
        };
      } catch (e) {
        return null;
      }
    }

    async function getMediaDevicesInfo() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.map(d => ({
          kind: d.kind,
          label: d.label,
          deviceId: d.deviceId,
          groupId: d.groupId
        }));
      } catch (e) {
        return null;
      }
    }

    function getWebGLVendor() {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return null;
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        }
        return null;
      } catch (e) {
        return null;
      }
    }
  })();
