/**
 * By Janno. — Digital Studio Master Animation Database
 * =====================================================
 * A comprehensive GSAP animation engine combining:
 *   - All existing studio animations
 *   - Techniques inspired by a-chen.webflow.io (sticky reveals, variable fonts, SVG hovers)
 *   - Techniques inspired by monarqeg.com (counters, scroll fade-ins, section entrances)
 *   - Techniques inspired by cipher.tv (page loader, canvas effects, mix-blend cursor)
 *
 * GSAP Methods Used:
 *   Core:         gsap.to, gsap.from, gsap.fromTo, gsap.set, gsap.timeline
 *   Performance:  gsap.quickTo, gsap.quickSetter, gsap.ticker
 *   Plugins:      ScrollTrigger.create, ScrollTrigger.batch, ScrollTrigger.create
 *   Easing:       power1-4.out, back.out, elastic.out, sine.inOut, none
 *   Params:       duration, delay, stagger, repeat, yoyo, autoAlpha, clearProps,
 *                 transformOrigin, overwrite
 */

document.addEventListener('DOMContentLoaded', () => {

  // ===============================================================
  // 0. SAFETY CHECK & PLUGIN REGISTRATION
  // ===============================================================
  if (typeof gsap === 'undefined') {
    console.error('[By Janno.] GSAP missing. Ensure GSAP core is loaded before animations.js');
    return;
  }

  if (typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // ===============================================================
  // 1. PAGE LOADER  [inspired by cipher.tv]
  // ---------------------------------------------------------------
  // cipher.tv uses a full-screen canvas loader that fades out
  // as assets are ready. We recreate this with a CSS overlay +
  // GSAP timeline so each page feels polished on entry.
  // ===============================================================
  const initPageLoader = () => {
    // Build loader overlay if it doesn't exist
    if (document.getElementById('page-loader')) return;

    const loader = document.createElement('div');
    loader.id = 'page-loader';
    Object.assign(loader.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '99999',
      background: '#0E161B',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      pointerEvents: 'none'
    });

    const bar = document.createElement('div');
    bar.id = 'loader-bar';
    Object.assign(bar.style, {
      width: '120px',
      height: '1px',
      background: 'rgba(255,253,208,0.15)',
      position: 'relative',
      overflow: 'hidden'
    });

    const fill = document.createElement('div');
    fill.id = 'loader-fill';
    Object.assign(fill.style, {
      position: 'absolute',
      inset: '0',
      background: '#AA4628',
      transformOrigin: 'left center',
      scaleX: '0'
    });

    bar.appendChild(fill);
    loader.appendChild(bar);
    document.body.appendChild(loader);

    // gsap.timeline() → staged loader sequence
    const loaderTl = gsap.timeline({
      defaults: { ease: 'power3.out' }
    });

    loaderTl
      // Animate the progress bar fill
      .to(fill, { scaleX: 1, duration: 0.9, ease: 'power2.inOut' })
      // Brief pause at 100%
      .to({}, { duration: 0.2 })
      // Fade out entire loader
      .to(loader, {
        autoAlpha: 0,
        duration: 0.5,
        ease: 'power2.in',
        onComplete: () => loader.remove()
      });
  };

  initPageLoader();

  // ===============================================================
  // 2. CUSTOM CURSOR SYSTEM  [existing + cipher.tv cube style]
  // ---------------------------------------------------------------
  // Uses gsap.quickSetter() for zero-overhead direct property
  // mutation (Row 30) and gsap.quickTo() for physics-spring
  // tracking on the ring (Row 29). On hover we scale the ring
  // (Row 22 overwrite). cipher.tv adds a tiny square cursor "cube".
  // ===============================================================
  const initCustomCursor = () => {
    if (isTouch) return;

    let dot = document.getElementById('cursor-dot');
    let ring = document.getElementById('cursor-ring');

    if (!dot || !ring) {
      dot = document.createElement('div');
      dot.id = 'cursor-dot';
      dot.className = 'fixed top-0 left-0 w-2 h-2 bg-cream rounded-full pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 mix-blend-difference';

      ring = document.createElement('div');
      ring.id = 'cursor-ring';
      ring.className = 'fixed top-0 left-0 w-8 h-8 border border-cream/40 rounded-full pointer-events-none z-[9998] -translate-x-1/2 -translate-y-1/2';

      document.body.appendChild(dot);
      document.body.appendChild(ring);
    }

    // Row 30: gsap.quickSetter() → Direct memory-optimized property mutation
    const setDotX = gsap.quickSetter(dot, 'x', 'px');
    const setDotY = gsap.quickSetter(dot, 'y', 'px');

    // Row 29: gsap.quickTo() → Physics spring tracking
    // Row 24: power3.out → Smooth deceleration
    const setRingX = gsap.quickTo(ring, 'x', { duration: 0.2, ease: 'power3.out' });
    const setRingY = gsap.quickTo(ring, 'y', { duration: 0.2, ease: 'power3.out' });

    window.addEventListener('mousemove', (e) => {
      setDotX(e.clientX);
      setDotY(e.clientY);
      setRingX(e.clientX);
      setRingY(e.clientY);
    });

    // Row 22: overwrite → Active hover & tracking conflicts resolved
    const interactables = document.querySelectorAll('a, button, input, textarea, .btn-magnetic, [data-open-modal], .trigger-enquiry');
    interactables.forEach((el) => {
      el.addEventListener('mouseenter', () => {
        gsap.to(ring, { scale: 1.8, borderColor: '#AA4628', backgroundColor: 'rgba(170,70,40,0.10)', duration: 0.2, overwrite: 'auto' });
        gsap.to(dot, { scale: 0.4, backgroundColor: '#AA4628', duration: 0.2, overwrite: 'auto' });
      });
      el.addEventListener('mouseleave', () => {
        gsap.to(ring, { scale: 1, borderColor: 'rgba(255,253,208,0.4)', backgroundColor: 'transparent', duration: 0.3, overwrite: 'auto' });
        gsap.to(dot, { scale: 1, backgroundColor: '#FFFDD0', duration: 0.2, overwrite: 'auto' });
      });
    });
  };

  initCustomCursor();

  // ===============================================================
  // 3. 2D/3D WIREFRAME CANVAS ORBIT ENGINE  [existing]
  // ---------------------------------------------------------------
  // Row 31: gsap.ticker → Central clock loop syncing canvas vectors
  // Row 27: none (linear ease) → Constant rotation speed
  // Row 37: Site Matrix Wireframe Canvas implementation
  // ===============================================================
  const initWireframeCanvas = () => {
    const canvas = document.getElementById('wireframe-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = (canvas.width = canvas.parentElement.offsetWidth);
    let height = (canvas.height = canvas.parentElement.offsetHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = canvas.parentElement.offsetWidth;
      height = canvas.height = canvas.parentElement.offsetHeight;
    });

    const numPoints = 22;
    const points = [];
    for (let i = 0; i < numPoints; i++) {
      points.push({
        angle: (i / numPoints) * Math.PI * 2,
        radius: 80 + Math.random() * 45,
        speed: 0.004 + Math.random() * 0.006
      });
    }

    // Row 31: gsap.ticker → Updates every rAF frame
    gsap.ticker.add(() => {
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      ctx.save();
      ctx.translate(cx, cy);

      points.forEach((pt) => {
        pt.angle += pt.speed;
      });

      // Draw orbit rings
      ctx.strokeStyle = 'rgba(170, 70, 40, 0.18)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(0, 0, 100, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 253, 208, 0.06)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(0, 0, 140, 0, Math.PI * 2);
      ctx.stroke();

      // Draw radial spokes
      ctx.strokeStyle = 'rgba(170, 70, 40, 0.12)';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      points.forEach((pt) => {
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(pt.angle) * pt.radius, Math.sin(pt.angle) * pt.radius);
      });
      ctx.stroke();

      // Draw orbit nodes
      points.forEach((pt) => {
        const x = Math.cos(pt.angle) * pt.radius;
        const y = Math.sin(pt.angle) * pt.radius;
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(170, 70, 40, 0.5)';
        ctx.fill();
      });

      ctx.restore();
    });
  };

  initWireframeCanvas();

  // ===============================================================
  // 4. HERO SEQUENCE & SCREEN EFFECTS  [existing, enhanced]
  // ---------------------------------------------------------------
  // Row 10: gsap.timeline() → Multi-stage master entrance
  // Row 3:  gsap.from()     → Animate from starting state
  // Row 4:  gsap.fromTo()   → Defines explicit start + end
  // Row 15: stagger         → Sequential text/element reveals
  // Row 18: yoyo            → Breathing ambient glow loop
  // Row 28: sine.inOut      → Smooth sinusoidal oscillation
  // ===============================================================
  const heroTl = gsap.timeline({ defaults: { duration: 0.9, ease: 'power3.out' } });

  heroTl
    .from('header', { y: -20, opacity: 0, duration: 0.7 })
    .fromTo('#hero-monitor',
      { scale: 0.9, opacity: 0, y: 40 },
      { scale: 1, opacity: 1, y: 0, ease: 'power4.out', duration: 1.2 },
      '-=0.4'
    )
    .fromTo('.hero-screen-title', { y: 20, opacity: 0 }, { y: 0, opacity: 1 }, '-=0.6')
    .fromTo('.hero-screen-sub',   { y: 15, opacity: 0 }, { y: 0, opacity: 1 }, '-=0.4');

  // Add ambient screen breathing glow loop
  heroTl.add(() => {
    gsap.to('.screen-glow', {
      opacity: 0.9,
      duration: 2.8,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'  // Row 28
    });
  });

  // 3D Tilt & SVG Arc path morphing on monitor hover
  const monitor = document.getElementById('hero-monitor');
  const arcText = document.querySelector('#textArcPath');

  if (monitor) {
    monitor.addEventListener('mousemove', (e) => {
      const rect = monitor.getBoundingClientRect();
      const tiltX = ((e.clientY - rect.top)  / rect.height - 0.5) * -14;
      const tiltY = ((e.clientX - rect.left) / rect.width  - 0.5) * 14;

      // Row 2: gsap.to() + Row 23: power2.out → Smooth 3D tilt tracking
      gsap.to(monitor, {
        rotateX: tiltX,
        rotateY: tiltY,
        transformPerspective: 900,
        duration: 0.4,
        ease: 'power2.out',
        overwrite: 'auto'  // Row 22
      });

      // SVG path morphing (inspired by a-chen.webflow.io arrow SVG hover)
      if (arcText) {
        gsap.to(arcText, {
          attr: { d: `M 20,85 A 120,${60 + tiltX} 0 0,1 280,85` },
          duration: 0.3,
          ease: 'power1.out'
        });
      }
    });

    monitor.addEventListener('mouseleave', () => {
      gsap.to(monitor, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.8,
        ease: 'power3.out'
      });
      if (arcText) {
        gsap.to(arcText, {
          attr: { d: 'M 30,80 A 120,60 0 0,1 270,80' },
          duration: 0.6,
          ease: 'power2.out'
        });
      }
    });
  }

  // ===============================================================
  // 5. MAGNETIC NAV & CTAs  [existing]
  // ---------------------------------------------------------------
  // Row 23: power2.out         → Smooth magnetic pull
  // Row 26: elastic.out(1,0.3) → Spring snap back
  // Row 33: Site Matrix — Magnetic Nav & CTA interaction
  // ===============================================================
  if (!isTouch) {
    const magneticButtons = document.querySelectorAll('.btn-magnetic, nav a, .trigger-enquiry');
    magneticButtons.forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top  - rect.height / 2;
        gsap.to(btn, {
          x: x * 0.32,
          y: y * 0.32,
          duration: 0.25,
          ease: 'power2.out',
          overwrite: 'auto'
        });
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, {
          x: 0,
          y: 0,
          duration: 0.65,
          ease: 'elastic.out(1, 0.3)'  // Row 26
        });
      });
    });
  }

  // ===============================================================
  // 6. SCROLLTRIGGER BATCH & SCROLL TRACKING  [existing + enhanced]
  // ---------------------------------------------------------------
  // Row 7:  ScrollTrigger plugin  → Scroll-driven animation
  // Row 8:  ScrollTrigger.create  → Standalone scroll observer
  // Row 9:  ScrollTrigger.batch   → Batch entrance for cards
  // Row 21: clearProps            → Wipes inline styles post-anim
  // Row 36: Site Matrix Scroll Cards
  // ===============================================================
  if (typeof ScrollTrigger !== 'undefined') {

    // Batch entrance for darkcard elements
    ScrollTrigger.batch('.bg-darkcard, [data-card]', {
      onEnter: (batch) => {
        gsap.fromTo(
          batch,
          { y: 45, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.85,
            stagger: 0.12,
            ease: 'power3.out',
            clearProps: 'transform,opacity'  // Row 21
          }
        );
      },
      once: true
    });

    // Generic scroll-reveal for any element with [data-reveal]
    // (inspired by monarqeg.com section fade-ins)
    ScrollTrigger.batch('[data-reveal]', {
      onEnter: (batch) => {
        gsap.fromTo(
          batch,
          { y: 30, opacity: 0, scale: 0.98 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.7,
            stagger: 0.1,
            ease: 'power2.out'
          }
        );
      },
      once: true
    });

    // Scroll header hide/show
    ScrollTrigger.create({
      start: 'top top',
      end: 'max',
      onUpdate: (self) => {
        if (self.direction === 1 && self.scroll() > 80) {
          gsap.to('header', { y: -10, opacity: 0.8, duration: 0.3 });
        } else {
          gsap.to('header', { y: 0, opacity: 1, duration: 0.3 });
        }
      }
    });

    // ---------------------------------------------------------------
    // SPLIT-TEXT HEADING REVEALS  [inspired by a-chen.webflow.io]
    // a-chen uses variable font weight (wght) transitions + y-reveals
    // on each heading word. We do a word-by-word stagger.
    // ---------------------------------------------------------------
    document.querySelectorAll('[data-split-heading]').forEach((el) => {
      const words = el.textContent.trim().split(' ');
      el.innerHTML = words.map(w =>
        `<span class="inline-block overflow-hidden"><span class="inline-block word-reveal" style="transform:translateY(100%);opacity:0">${w}\u00a0</span></span>`
      ).join('');

      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        onEnter: () => {
          gsap.to(el.querySelectorAll('.word-reveal'), {
            y: 0,
            opacity: 1,
            duration: 0.7,
            stagger: 0.08,
            ease: 'power3.out'
          });
        },
        once: true
      });
    });

    // ---------------------------------------------------------------
    // PARALLAX SECTION BACKGROUNDS  [inspired by monarqeg.com]
    // Sections with [data-parallax] get a subtle vertical shift.
    // ---------------------------------------------------------------
    document.querySelectorAll('[data-parallax]').forEach((el) => {
      const speed = parseFloat(el.dataset.parallax) || 0.15;
      gsap.to(el, {
        yPercent: () => -100 * speed,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    });

    // ---------------------------------------------------------------
    // STICKY SCROLL IMAGE REVEALS  [inspired by a-chen.webflow.io]
    // a-chen's works section uses sticky panels that reveal project
    // images as the user scrolls. Any element with [data-sticky-reveal]
    // inside a [data-sticky-section] gets this behaviour.
    // ---------------------------------------------------------------
    document.querySelectorAll('[data-sticky-section]').forEach((section) => {
      const items = section.querySelectorAll('[data-sticky-reveal]');
      items.forEach((item, idx) => {
        ScrollTrigger.create({
          trigger: item,
          start: 'top center',
          end: 'bottom center',
          onEnter: () => {
            gsap.to(item, {
              opacity: 1,
              y: 0,
              duration: 0.6,
              ease: 'power2.out'
            });
          },
          onLeave: () => {
            if (idx < items.length - 1) {
              gsap.to(item, { opacity: 0.3, duration: 0.4 });
            }
          },
          onEnterBack: () => {
            gsap.to(item, { opacity: 1, y: 0, duration: 0.4 });
          }
        });
        // Set initial state
        gsap.set(item, { opacity: idx === 0 ? 1 : 0, y: idx === 0 ? 0 : 20 });
      });
    });

  } // end ScrollTrigger block

  // ===============================================================
  // 7. ENQUIRY MODAL OVERLAY ENGINE  [existing]
  // ---------------------------------------------------------------
  // Row 5:  gsap.set()     → Initial modal state (autoAlpha: 0)
  // Row 19: autoAlpha      → opacity + visibility combined
  // Row 10: gsap.timeline  → Staged modal open/close
  // Row 12: .play()/.reverse() → Programmatic timeline control
  // Row 25: back.out(1.7)  → Overshoot elasticity pop-in
  // Row 34: Site Matrix — Enquiry Modal Overlay
  // ===============================================================
  const modal       = document.getElementById('enquiry-modal');
  const modalCloser = document.getElementById('close-modal');
  const modalOpeners = document.querySelectorAll('[data-open-modal], .trigger-enquiry, #open-modal-btn');

  if (modal) {
    const modalCard = modal.querySelector('.modal-content') || modal.firstElementChild;

    gsap.set(modal, { autoAlpha: 0 });      // Row 5 + Row 19
    gsap.set(modalCard, { scale: 0.88, y: 30 });

    const modalTl = gsap.timeline({ paused: true });
    modalTl
      .to(modal, { autoAlpha: 1, duration: 0.3, ease: 'power2.out' })
      .to(modalCard, { scale: 1, y: 0, opacity: 1, duration: 0.45, ease: 'back.out(1.7)' }, '-=0.2');  // Row 25

    const openModal  = () => { document.body.style.overflow = 'hidden'; modalTl.play(); };     // Row 12
    const closeModal = () => { document.body.style.overflow = '';       modalTl.reverse(); };  // Row 12

    modalOpeners.forEach((btn) => btn.addEventListener('click', (e) => { e.preventDefault(); openModal(); }));
    if (modalCloser) modalCloser.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modalTl.progress() > 0) closeModal(); });
  }

  // ===============================================================
  // 8. DYNAMIC TYPEWRITER ENGINE  [existing]
  // ===============================================================
  const typewriterTarget = document.getElementById('typewriter-text');
  if (typewriterTarget) {
    const phrases = [
      'brand ecosystems',
      'digital platforms',
      'custom web apps',
      'direct booking engines',
      'bespoke web design'
    ];

    let phraseIdx = 0, charIdx = 0, isDeleting = false;
    const typeSpeed = 80, deleteSpeed = 40, pauseTime = 1800;

    function typeLoop() {
      const current = phrases[phraseIdx];
      typewriterTarget.textContent = isDeleting
        ? current.substring(0, charIdx - 1)
        : current.substring(0, charIdx + 1);

      isDeleting ? charIdx-- : charIdx++;

      if (!isDeleting && charIdx === current.length) {
        isDeleting = true;
        setTimeout(typeLoop, pauseTime);
        return;
      }
      if (isDeleting && charIdx === 0) {
        isDeleting = false;
        phraseIdx = (phraseIdx + 1) % phrases.length;
      }
      setTimeout(typeLoop, isDeleting ? deleteSpeed : typeSpeed);
    }
    setTimeout(typeLoop, 1000);
  }

  // ===============================================================
  // 9. KINETIC NUMERICAL COUNTER  [inspired by monarqeg.com + web-dev page]
  // ---------------------------------------------------------------
  // monarqeg.com uses animated stats counters on scroll.
  // Targets any [data-counter] element — set data-counter="value"
  // and optionally data-counter-prefix="$" or data-counter-suffix="%"
  // ===============================================================
  const initCounters = () => {
    if (typeof ScrollTrigger === 'undefined') return;

    document.querySelectorAll('[data-counter]').forEach((el) => {
      const target  = parseFloat(el.dataset.counter) || 0;
      const prefix  = el.dataset.counterPrefix  || '';
      const suffix  = el.dataset.counterSuffix  || '';
      const decimals = (el.dataset.counter.includes('.')) ? 1 : 0;

      const obj = { val: 0 };
      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          gsap.to(obj, {
            val: target,
            duration: 2,
            ease: 'power3.out',
            onUpdate: () => {
              el.textContent = prefix + obj.val.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + suffix;
            }
          });
        }
      });
    });
  };
  initCounters();

  // ===============================================================
  // 10. CYBERPUNK TEXT SCRAMBLER  [inspired by a-chen / web-dev existing]
  // ---------------------------------------------------------------
  // Targets any [data-scramble] element on mouseenter,
  // or [data-scramble-auto] for automatic scramble on scroll-reveal.
  // ===============================================================
  const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$&*%';

  const scrambleText = (el, finalText) => {
    let iterations = 0;
    const original = finalText || el.dataset.scrambleText || el.textContent;
    el.dataset.scrambleText = original;

    const interval = setInterval(() => {
      el.textContent = original.split('').map((char, i) => {
        if (char === ' ') return ' ';
        if (i < iterations) return original[i];
        return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      }).join('');

      if (iterations >= original.length) clearInterval(interval);
      iterations += 0.5;
    }, 35);
  };

  // Hover scramble
  document.querySelectorAll('[data-scramble]').forEach((el) => {
    el.addEventListener('mouseenter', () => scrambleText(el));
  });

  // Auto scramble on scroll-reveal
  if (typeof ScrollTrigger !== 'undefined') {
    document.querySelectorAll('[data-scramble-auto]').forEach((el) => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter: () => scrambleText(el)
      });
    });
  }

  // ===============================================================
  // 11. VARIABLE FONT WEIGHT ANIMATION  [inspired by a-chen.webflow.io]
  // ---------------------------------------------------------------
  // a-chen uses CSS font-variation-settings with GSAP for dynamic
  // weight morphing from 100 → 900 on hover/scroll.
  // Targets [data-varfont] elements.
  // ===============================================================
  document.querySelectorAll('[data-varfont]').forEach((el) => {
    const light  = parseInt(el.dataset.varfontLight)  || 100;
    const bold   = parseInt(el.dataset.varfontBold)   || 800;
    const inEl = { wght: light };

    el.addEventListener('mouseenter', () => {
      gsap.to(inEl, {
        wght: bold,
        duration: 0.4,
        ease: 'power2.out',
        onUpdate: () => {
          el.style.fontVariationSettings = `"wght" ${Math.round(inEl.wght)}`;
        }
      });
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(inEl, {
        wght: light,
        duration: 0.5,
        ease: 'power3.out',
        onUpdate: () => {
          el.style.fontVariationSettings = `"wght" ${Math.round(inEl.wght)}`;
        }
      });
    });
  });

  // ===============================================================
  // 12. HORIZONTAL MARQUEE / TICKER  [inspired by cipher.tv / premium agencies]
  // ---------------------------------------------------------------
  // Any [data-marquee] element gets its children duplicated and
  // scrolled infinitely left. Uses gsap.to() with repeat: -1 and
  // ease: 'none' for perfectly linear motion.
  // ===============================================================
  const initMarquee = () => {
    document.querySelectorAll('[data-marquee]').forEach((track) => {
      const speed = parseFloat(track.dataset.marqueeSpeed) || 40; // px per second
      const inner = track.querySelector('[data-marquee-inner]') || track.firstElementChild;
      if (!inner) return;

      // Duplicate content for seamless loop
      inner.innerHTML = inner.innerHTML + inner.innerHTML;
      const totalWidth = inner.scrollWidth / 2;

      gsap.to(inner, {
        x: -totalWidth,
        duration: totalWidth / speed,
        ease: 'none',
        repeat: -1,
        modifiers: {
          x: gsap.utils.unitize((x) => parseFloat(x) % totalWidth)
        }
      });
    });
  };
  initMarquee();

  // ===============================================================
  // 13. HOVER IMAGE REVEAL  [inspired by a-chen.webflow.io works section]
  // ---------------------------------------------------------------
  // a-chen shows a floating project image that follows the cursor
  // as you hover over work list items.
  // Targets [data-hover-reveal] links with data-hover-image="url".
  // ===============================================================
  const initHoverImageReveal = () => {
    if (isTouch) return;

    const follower = document.createElement('div');
    follower.id = 'hover-image-follower';
    Object.assign(follower.style, {
      position: 'fixed',
      width: '280px',
      height: '190px',
      pointerEvents: 'none',
      zIndex: '9990',
      borderRadius: '4px',
      overflow: 'hidden',
      opacity: '0',
      transform: 'translate(-50%, -50%) scale(0.85)'
    });

    const img = document.createElement('img');
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
    follower.appendChild(img);
    document.body.appendChild(follower);

    const followerX = gsap.quickTo(follower, 'x', { duration: 0.55, ease: 'power2.out' });
    const followerY = gsap.quickTo(follower, 'y', { duration: 0.55, ease: 'power2.out' });

    document.querySelectorAll('[data-hover-reveal]').forEach((el) => {
      const imgUrl = el.dataset.hoverImage;
      if (!imgUrl) return;

      el.addEventListener('mouseenter', () => {
        img.src = imgUrl;
        gsap.to(follower, { opacity: 1, scale: 1, duration: 0.35, ease: 'power2.out', overwrite: 'auto' });
      });
      el.addEventListener('mousemove', (e) => {
        followerX(e.clientX);
        followerY(e.clientY);
      });
      el.addEventListener('mouseleave', () => {
        gsap.to(follower, { opacity: 0, scale: 0.85, duration: 0.3, ease: 'power2.in', overwrite: 'auto' });
      });
    });
  };
  initHoverImageReveal();

  // ===============================================================
  // 14. SMOOTH SCROLL PROGRESS INDICATOR  [inspired by cipher.tv]
  // ---------------------------------------------------------------
  // cipher.tv shows a bottom progress_shader element at 0%.
  // We animate a top progress bar that fills as the user scrolls.
  // ===============================================================
  const initScrollProgress = () => {
    if (typeof ScrollTrigger === 'undefined') return;

    const bar = document.createElement('div');
    bar.id = 'scroll-progress-bar';
    Object.assign(bar.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      height: '2px',
      width: '0%',
      background: 'linear-gradient(90deg, #AA4628, #923A1F)',
      zIndex: '99998',
      pointerEvents: 'none',
      transformOrigin: 'left center'
    });
    document.body.appendChild(bar);

    ScrollTrigger.create({
      start: 'top top',
      end: 'max',
      onUpdate: (self) => {
        gsap.set(bar, { width: (self.progress * 100) + '%' });
      }
    });
  };
  initScrollProgress();

  // ===============================================================
  // 15. AMBIENT BUTTON PULSE  [micro-animation]
  // ---------------------------------------------------------------
  // CTA buttons with class .btn-pulse get a subtle ring pulse to
  // draw attention — using yoyo + sine.inOut infinite.
  // ===============================================================
  document.querySelectorAll('.btn-pulse').forEach((btn) => {
    gsap.to(btn, {
      boxShadow: '0 0 0 8px rgba(170,70,40,0)',
      duration: 1.4,
      repeat: -1,
      ease: 'sine.inOut',
      yoyo: true,
      delay: Math.random() * 0.8
    });
  });

  // ===============================================================
  // 16. SECTION ENTRANCE FADE + SLIDE  [monarqeg.com style]
  // ---------------------------------------------------------------
  // Every <section> with [data-section-reveal] animates in from
  // below on scroll. Uses stagger for nested children if present.
  // ===============================================================
  if (typeof ScrollTrigger !== 'undefined') {
    document.querySelectorAll('[data-section-reveal]').forEach((section) => {
      const children = section.querySelectorAll('h1,h2,h3,p,[data-item]');
      const targets = children.length > 0 ? children : [section];

      gsap.fromTo(targets,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            once: true
          }
        }
      );
    });
  }

  // ===============================================================
  // 17. GSAP TICKER-DRIVEN AMBIENT PARTICLE SYSTEM
  // ---------------------------------------------------------------
  // On the index hero, tiny floating particles reinforce the
  // terracotta-to-dark gradient background. Uses gsap.ticker for
  // smooth canvas rendering (Row 31).
  // ===============================================================
  const initParticles = () => {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    });

    const particles = Array.from({ length: 30 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 1 + Math.random() * 2,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      alpha: 0.1 + Math.random() * 0.25
    }));

    gsap.ticker.add(() => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach((p) => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(170, 70, 40, ${p.alpha})`;
        ctx.fill();
      });
    });
  };
  initParticles();

  // ===============================================================
  // MERGED: Monitor + Playground (from antimations) — injected
  // ===============================================================
  function safeRegisterLocal() {
    try { if (typeof gsap !== 'undefined') gsap.registerPlugin?.(window.ScrollTrigger, window.TextPlugin); } catch(e){}
  }

  function initMonitor() {
    const el = document.getElementById('monitor-demo');
    if (!el || typeof gsap === 'undefined') return;

    const screenImg = el.querySelector('#monitor-screen-img');
    const iframe = el.querySelector('#monitor-iframe');
    const hotspots = Array.from(el.querySelectorAll('.monitor-hotspot'));

    const screenToX = gsap.quickTo(screenImg || el, 'rotationY', { duration: 0.35, ease: 'power3.out' });
    const screenToY = gsap.quickTo(screenImg || el, 'rotationX', { duration: 0.35, ease: 'power3.out' });
    const screenToTX = gsap.quickTo(screenImg || el, 'x', { duration: 0.45, ease: 'power3.out' });
    const screenToTY = gsap.quickTo(screenImg || el, 'y', { duration: 0.45, ease: 'power3.out' });

    function onMove(e) {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const rotY = (x - 0.5) * 18;
      const rotX = (y - 0.5) * -12;
      const tx = (x - 0.5) * 18;
      const ty = (y - 0.5) * 10;
      screenToX(rotY);
      screenToY(rotX);
      screenToTX(tx);
      screenToTY(ty);
      Array.from(el.querySelectorAll('[data-depth]')).forEach(layer => {
        const depth = Number(layer.dataset.depth) || 0.5;
        gsap.to(layer, { x: (x - 0.5) * (20 * depth), y: (y - 0.5) * (12 * depth), duration: 0.6, ease: 'power3.out' });
      });
    }

    function onLeave() {
      screenToX(0); screenToY(0); screenToTX(0); screenToTY(0);
      gsap.to(el.querySelectorAll('[data-depth]'), { x: 0, y: 0, duration: 0.6, ease: 'power2.out' });
    }

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);

    const tooltip = document.createElement('div');
    tooltip.className = 'ant-tooltip';
    Object.assign(tooltip.style, { position: 'fixed', pointerEvents: 'none', padding: '6px 10px', background: 'rgba(12,12,12,0.85)', color: 'white', fontSize: '12px', borderRadius: '6px', zIndex: 9999, transform: 'translate(-50%, -120%)', transition: 'opacity 0.14s ease', opacity: '0' });
    document.body.appendChild(tooltip);

    hotspots.forEach(hot => {
      const label = hot.dataset.label || 'Open';
      hot.addEventListener('mouseenter', (ev) => { tooltip.innerText = label; tooltip.style.opacity = '1'; positionTooltip(ev); });
      hot.addEventListener('mousemove', positionTooltip);
      hot.addEventListener('mouseleave', () => { tooltip.style.opacity = '0'; });

      hot.addEventListener('click', (ev) => {
        const src = hot.dataset.src; const mode = hot.dataset.mode || 'img';
        gsap.fromTo(hot, { scale: 1 }, { scale: 0.96, duration: 0.08, yoyo: true, repeat: 1, ease: 'power2.inOut' });
        if (mode === 'iframe' && iframe) { if (src) { iframe.src = src; iframe.classList.remove('hidden'); if (screenImg) screenImg.classList.add('hidden'); } return; }
        if (src && screenImg) {
          const temp = document.createElement('img'); temp.src = src; Object.assign(temp.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', objectFit: 'cover', opacity: '0', pointerEvents: 'none' });
          el.querySelector('.monitor-screen').appendChild(temp);
          gsap.to(temp, { opacity: 1, duration: 0.45, ease: 'power2.out' });
          gsap.to(screenImg, { opacity: 0, duration: 0.45, ease: 'power2.in', onComplete: () => { screenImg.src = src; screenImg.style.opacity = '1'; temp.remove(); } });
        }
      });

      hot.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hot.click(); } });
    });

    function positionTooltip(e) { tooltip.style.left = (e.clientX) + 'px'; tooltip.style.top = (e.clientY) + 'px'; }
    gsap.from(el, { y: 18, opacity: 0, duration: 0.9, ease: 'power3.out' });
  }

  function initPlayground() {
    const lab = document.getElementById('gsap-lab'); if (!lab) return; if (document.getElementById('ant-play-panel')) return;
    const panel = document.createElement('div'); panel.id = 'ant-play-panel'; Object.assign(panel.style, { position: 'fixed', right: '18px', bottom: '18px', width: '220px', background: 'rgba(12,12,12,0.85)', color: 'white', padding: '10px', borderRadius: '10px', fontFamily: 'Inter, sans-serif', zIndex: 9999, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' });
    panel.innerHTML = `\n      <div style="font-weight:700;margin-bottom:8px;">GSAP Playground</div>\n      <button id="ant-trigger-wave" style="width:100%;padding:8px;border-radius:6px;margin-bottom:6px;background:#C85A32;border:none;color:white;cursor:pointer">Trigger Wave</button>\n      <button id="ant-trigger-scramble" style="width:100%;padding:8px;border-radius:6px;margin-bottom:6px;background:#1C252E;border:none;color:white;cursor:pointer">Scramble Text</button>\n      <button id="ant-toggle-effects" style="width:100%;padding:8px;border-radius:6px;margin-bottom:6px;background:#10BB82;border:none;color:white;cursor:pointer">Toggle Glow</button>\n      <div style="font-size:11px;opacity:0.85;margin-top:8px">Quick shortcuts bridge to lab controls.</div>\n    `;
    document.body.appendChild(panel);
    const btnWave = panel.querySelector('#ant-trigger-wave'); const btnScramble = panel.querySelector('#ant-trigger-scramble'); const btnToggle = panel.querySelector('#ant-toggle-effects');
    btnWave.addEventListener('click', () => { const labBtn = document.getElementById('trigger-wave-btn'); if (labBtn) { labBtn.click(); return; } gsap.to('.grid-node', { scale: 0.7, backgroundColor: '#C85A32', color: '#fff', yoyo: true, repeat: 1, duration: 0.3, stagger: { grid: [4,4], from: 'center', amount: 0.6 }, ease: 'power2.inOut' }); });
    btnScramble.addEventListener('click', () => { const scrBtn = document.getElementById('trigger-scramble-btn'); if (scrBtn) { scrBtn.click(); return; } const el = document.getElementById('scramble-text'); if (!el) return; const original = el.textContent; const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$&%'; let iterations = 0; const interval = setInterval(() => { el.innerText = original.split('').map((c, i) => i < iterations ? original[i] : chars[Math.floor(Math.random()*chars.length)]).join(''); if (iterations >= original.length) clearInterval(interval); iterations += 1/2; }, 30); });
    let glowOn = false; btnToggle.addEventListener('click', () => { glowOn = !glowOn; if (glowOn) { gsap.to(lab, { boxShadow: '0 30px 80px rgba(200,90,50,0.12)', duration: 0.6 }); document.body.style.transition = 'filter 0.6s'; document.body.style.filter = 'saturate(1.05) contrast(1.03)'; } else { gsap.to(lab, { boxShadow: 'none', duration: 0.6 }); document.body.style.filter = ''; } });
    let isDown = false, startY = 0, startX = 0, origBottom = 0, origRight = 0;
    panel.addEventListener('pointerdown', (e) => { isDown = true; panel.setPointerCapture(e.pointerId); startX = e.clientX; startY = e.clientY; origBottom = parseFloat(panel.style.bottom); origRight = parseFloat(panel.style.right); });
    window.addEventListener('pointermove', (e) => { if (!isDown) return; const dx = e.clientX - startX; const dy = e.clientY - startY; panel.style.right = Math.max(6, origRight - dx) + 'px'; panel.style.bottom = Math.max(6, origBottom - dy) + 'px'; });
    window.addEventListener('pointerup', (e) => { isDown = false; try { panel.releasePointerCapture(e.pointerId);} catch(e){} });
  }

  try { safeRegisterLocal(); } catch (e) {}
  try { initMonitor(); } catch (e) {}
  try { initPlayground(); } catch (e) {}

});
