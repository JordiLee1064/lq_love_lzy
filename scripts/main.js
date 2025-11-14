(() => {
  const SECTIONS = document.querySelectorAll(".page");
  const TIMELINE_ITEMS = document.querySelectorAll(".timeline-item");
  const LETTER_ELEMENT = document.getElementById("letter-content");
  const COUNTUP_DISPLAY = document.getElementById("countup-display");
  const LETTER_RESTART = document.getElementById("letter-restart");
  const YES_BUTTON = document.getElementById("btn-yes");
  const THINK_BUTTON = document.getElementById("btn-think");
  const TOP_BUTTON = document.getElementById("btn-top");
  const BACK_STORY_BUTTON = document.getElementById("btn-back-story");
  const GENTLE_NOTE = document.getElementById("gentle-note");
  const CELEBRATION_OVERLAY = document.getElementById("celebration-overlay");
  const TOGETHER_COUNTER = document.getElementById("together-counter");
  const FIREWORKS_CANVAS = document.getElementById("fireworks-canvas");
  const BGM = document.getElementById("bgm");
  const PAGES_CONTAINER = document.querySelector("main.pages");
  const TIMELINE_INDEX = [...SECTIONS].findIndex(
    (section) => section.id === "memory-timeline"
  );

  const START_DATE = new Date("2025-10-22T17:00:00");
  let countupInterval = null;
  let letterTimer = null;
  let letterIndex = 0;
  let celebrationStarted = false;
  let togetherInterval = null;
  let togetherStart = null;
  let currentSectionIndex = 0;
  let wheelLocked = false;

  /**
   * Utilities
   */
  const padNumber = (value) => (value < 10 ? `0${value}` : value);

  const formatDuration = (ms) => {
    const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
    const days = Math.floor(totalSeconds / (60 * 60 * 24));
    const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${days} 天 ${padNumber(hours)} 小时 ${padNumber(minutes)} 分钟 ${padNumber(
      seconds
    )} 秒`;
  };

  /**
   * Intersection Observers
   */
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          currentSectionIndex = [...SECTIONS].indexOf(entry.target);
          if (entry.target.id === "love-letter") {
            startLetterTyping();
          }
        }
      });
    },
    { threshold: 0.25, rootMargin: "0px 0px -100px 0px" }
  );

  SECTIONS.forEach((section) => sectionObserver.observe(section));

  // 确保页面加载时所有可见的section立即显示
  const checkInitialSections = () => {
    SECTIONS.forEach((section, index) => {
      if (section.classList.contains("in-view")) return; // 已经显示
      const rect = section.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight * 0.5 && rect.bottom > 0;
      if (isVisible) {
        section.classList.add("in-view");
        currentSectionIndex = index;
      }
    });
  };
  
  // 页面加载完成后检查
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      checkInitialSections();
      // 延迟再次检查，确保布局完成
      setTimeout(checkInitialSections, 100);
    });
  } else {
    checkInitialSections();
    setTimeout(checkInitialSections, 100);
  }
  
  // 也使用requestAnimationFrame确保在布局完成后检查
  requestAnimationFrame(() => {
    checkInitialSections();
    requestAnimationFrame(checkInitialSections);
  });

  const timelineObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          timelineObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.35 }
  );

  TIMELINE_ITEMS.forEach((item, index) => {
    item.style.transitionDelay = `${index * 0.15}s`;
    timelineObserver.observe(item);
  });

  /**
   * Count-up timer
   */
  const updateCountup = () => {
    const duration = Date.now() - START_DATE.getTime();
    COUNTUP_DISPLAY.textContent = `我们认识了 ${formatDuration(duration)}`;
  };

  const beginCountup = () => {
    if (countupInterval) {
      clearInterval(countupInterval);
    }
    updateCountup();
    countupInterval = setInterval(updateCountup, 1000);
  };

  beginCountup();

  /**
   * Full-page wheel navigation
   */
  const scrollToSection = (index) => {
    if (index < 0 || index >= SECTIONS.length) return;
    currentSectionIndex = index;
    SECTIONS[index].scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const unlockWheel = () => {
    wheelLocked = false;
  };

  const handleWheel = (event) => {
    if (!PAGES_CONTAINER || celebrationStarted) return;
    if (wheelLocked) {
      event.preventDefault();
      return;
    }
    const delta = event.deltaY;
    
    // 检查是否在timeline section，如果是，检查是否已经滚动到底部
    if (
      typeof TIMELINE_INDEX === "number" &&
      TIMELINE_INDEX !== -1 &&
      currentSectionIndex === TIMELINE_INDEX &&
      delta > 0
    ) {
      const timelineSection = SECTIONS[TIMELINE_INDEX];
      if (timelineSection) {
        const rect = timelineSection.getBoundingClientRect();
        const isAtBottom = rect.bottom <= window.innerHeight + 50; // 允许50px的容差
        // 如果不在底部，允许正常滚动；如果在底部，允许滚动到下一个section
        if (!isAtBottom) {
          return; // 允许在timeline section内部滚动
        }
        // 如果在底部，继续执行下面的逻辑，滚动到下一个section
      }
    }
    
    if (Math.abs(delta) < 30) return;
    const targetIndex =
      delta > 0 ? currentSectionIndex + 1 : currentSectionIndex - 1;
    if (targetIndex < 0 || targetIndex >= SECTIONS.length) return;
    event.preventDefault();
    wheelLocked = true;
    scrollToSection(targetIndex);
    setTimeout(unlockWheel, 900);
  };

  if (PAGES_CONTAINER) {
    PAGES_CONTAINER.addEventListener(
      "wheel",
      (event) => {
        handleWheel(event);
      },
      { passive: false }
    );
  }

  /**
   * Letter typing effect
   */
  const letterText = LETTER_ELEMENT?.dataset.letter ?? "";

  const typeLetter = () => {
    if (!LETTER_ELEMENT) return;
    if (letterIndex <= letterText.length) {
      LETTER_ELEMENT.textContent = letterText.slice(0, letterIndex);
      letterIndex += 1;
      letterTimer = setTimeout(typeLetter, 80);
    }
  };

  const startLetterTyping = () => {
    if (!LETTER_ELEMENT) return;
    clearTimeout(letterTimer);
    letterIndex = LETTER_ELEMENT.textContent.length;

    if (letterIndex >= letterText.length) return; // Already finished

    letterTimer = setTimeout(() => {
      letterIndex = 0;
      LETTER_ELEMENT.textContent = "";
      typeLetter();
    }, 100);
  };

  if (LETTER_RESTART) {
    LETTER_RESTART.addEventListener("click", () => {
      if (!LETTER_ELEMENT) return;
      LETTER_ELEMENT.textContent = "";
      letterIndex = 0;
      clearTimeout(letterTimer);
      typeLetter();
    });
  }

  /**
   * Proposal interaction
   */
  if (THINK_BUTTON) {
    THINK_BUTTON.addEventListener("click", () => {
      GENTLE_NOTE.textContent = "慢慢来，我会在这里等你。";
      setTimeout(() => {
        GENTLE_NOTE.textContent = "";
      }, 5000);
    });
  }

  if (YES_BUTTON) {
    YES_BUTTON.addEventListener("click", async () => {
      if (celebrationStarted) return;
      celebrationStarted = true;
      CELEBRATION_OVERLAY.classList.add("visible");
      CELEBRATION_OVERLAY.setAttribute("aria-hidden", "false");
      togetherStart = new Date();
      updateCelebrationDate();
      beginTogetherCounter();
      launchFireworks();
      tryPlayMusic();
    });
  }

  /**
   * Together counter
   */
  const updateTogetherCounter = () => {
    if (!togetherStart || !TOGETHER_COUNTER) return;
    const duration = Date.now() - togetherStart.getTime();
    TOGETHER_COUNTER.textContent = `一起计时：${formatDuration(duration)}`;
  };

  const beginTogetherCounter = () => {
    if (togetherInterval) {
      clearInterval(togetherInterval);
    }
    updateTogetherCounter();
    togetherInterval = setInterval(updateTogetherCounter, 1000);
  };

  /**
   * Update celebration date display
   */
  const updateCelebrationDate = () => {
    const CELEBRATION_DATE = document.getElementById("celebration-date");
    if (!CELEBRATION_DATE) return;
    const stamp = new Date();
    const year = stamp.getFullYear();
    const month = padNumber(stamp.getMonth() + 1);
    const date = padNumber(stamp.getDate());
    const hours = padNumber(stamp.getHours());
    const minutes = padNumber(stamp.getMinutes());
    CELEBRATION_DATE.textContent = `${year}年${month}月${date}日 ${hours}:${minutes}`;
  };

  /**
   * Background music
   */
  const tryPlayMusic = () => {
    if (!BGM) return;
    BGM.currentTime = 0;
    BGM.volume = 0.5;
    BGM
      .play()
      .catch(() => {
        console.warn("自动播放失败，等待用户交互。");
      });
  };

  /**
   * Fireworks Canvas Animation
   */
  let fireworksAnimationId = null;
  const ctx = FIREWORKS_CANVAS?.getContext("2d");
  const particles = [];

  const resizeCanvas = () => {
    if (!FIREWORKS_CANVAS) return;
    const dpr = window.devicePixelRatio || 1;
    const { clientWidth, clientHeight } = FIREWORKS_CANVAS;
    FIREWORKS_CANVAS.width = clientWidth * dpr;
    FIREWORKS_CANVAS.height = clientHeight * dpr;
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }
  };

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  class Particle {
    constructor(x, y, velocityX, velocityY, hue) {
      this.x = x;
      this.y = y;
      this.vx = velocityX;
      this.vy = velocityY;
      this.alpha = 1;
      this.decay = 0.015 + Math.random() * 0.02;
      this.size = 2 + Math.random() * 2;
      this.hue = hue;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vx *= 0.98;
      this.vy *= 0.98;
      this.vy += 0.04;
      this.alpha -= this.decay;
    }

    draw(context) {
      context.save();
      context.globalCompositeOperation = "lighter";
      context.globalAlpha = Math.max(this.alpha, 0);
      context.fillStyle = `hsl(${this.hue}, 90%, 65%)`;
      context.beginPath();
      context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }

    get isAlive() {
      return this.alpha > 0;
    }
  }

  const spawnFirework = () => {
    if (!FIREWORKS_CANVAS) return;
    const { clientWidth, clientHeight } = FIREWORKS_CANVAS;
    const x = Math.random() * clientWidth * 0.8 + clientWidth * 0.1;
    const y = Math.random() * clientHeight * 0.5 + clientHeight * 0.1;
    const hue = Math.floor(Math.random() * 360);
    const particleCount = 32;
    for (let i = 0; i < particleCount; i += 1) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 2 + Math.random() * 2.5;
      particles.push(
        new Particle(
          x,
          y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          hue + Math.random() * 40 - 20
        )
      );
    }
  };

  const renderFireworks = () => {
    if (!ctx || !FIREWORKS_CANVAS) return;
    ctx.clearRect(0, 0, FIREWORKS_CANVAS.clientWidth, FIREWORKS_CANVAS.clientHeight);
    if (particles.length < 300 && Math.random() < 0.16) {
      spawnFirework();
    }

    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const particle = particles[i];
      particle.update();
      particle.draw(ctx);
      if (!particle.isAlive) {
        particles.splice(i, 1);
      }
    }

    fireworksAnimationId = requestAnimationFrame(renderFireworks);
  };

  const launchFireworks = () => {
    cancelAnimationFrame(fireworksAnimationId);
    particles.length = 0;
    resizeCanvas();
    renderFireworks();
  };

  /**
   * Back to top button
   */
  if (TOP_BUTTON) {
    TOP_BUTTON.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (SECTIONS.length > 0) {
        scrollToSection(0);
      }
    });
  }

  /**
   * Back to story button
   */
  if (BACK_STORY_BUTTON) {
    BACK_STORY_BUTTON.addEventListener("click", () => {
      if (typeof TIMELINE_INDEX === "number" && TIMELINE_INDEX !== -1) {
        CELEBRATION_OVERLAY.classList.remove("visible");
        CELEBRATION_OVERLAY.setAttribute("aria-hidden", "true");
        scrollToSection(TIMELINE_INDEX);
      }
    });
  }

  /**
   * Cleanup on page hide/unload
   */
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (countupInterval) {
        clearInterval(countupInterval);
        countupInterval = null;
      }
      if (togetherInterval) {
        clearInterval(togetherInterval);
        togetherInterval = null;
      }
    } else {
      if (!countupInterval) beginCountup();
      if (celebrationStarted && !togetherInterval) beginTogetherCounter();
    }
  });
})();

