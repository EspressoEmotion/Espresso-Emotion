    const CONFIG = {
      businessName: 'Espresso & Emotion',
      email: 'Liebe.espresso.emotion@gmail.com',
      phone: '+49 155 10233830',
      whatsappNumber: '4915510233830',
      instagramUrl: 'https://instagram.com/espresso_and_emotion',
      serviceArea: 'Dortmund & Umgebung',
      pricing: {
        basePackages: [
          { maxHours: 2, price: 150 },
          { maxHours: 4, price: 250 },
          { maxHours: 6, price: 400 }
        ],
        travel: { includedKm: 30, upTo50: 20, upTo100: 50 },
        coffeePerGuestHour: 5,
        matchaPerGuestHour: 3,
        sparklingPerGuest: 6.5,
        wafflesPerGuest: 3,
        childcarePerChildHour: 20
      }
    };

    const euro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 2 });
    const calc = {
      step: 1,
      event: 'wedding',
      guests: 60,
      duration: 4,
      distance: 25,
      services: new Set(['coffee']),
      extras: new Set(),
      children: 1,
      note: '',
      preferredDate: '',
      preferredTime: ''
    };
    const eventData = {
      wedding: { label: 'Hochzeit' },
      birthday: { label: 'Geburtstag' },
      company: { label: 'Firmenfeier' },
      fair: { label: 'Messe / Tagung' },
      funeral: { label: 'Trauerfeier' },
      other: { label: 'Private Veranstaltung' }
    };
    const serviceData = {
      coffee: { label: 'Kaffee-Flatrate', perGuestHour: CONFIG.pricing.coffeePerGuestHour },
      matcha: { label: 'Matcha-Upgrade', perGuestHour: CONFIG.pricing.matchaPerGuestHour },
      sparkling: { label: 'Sektempfang inkl. Sekt (Flatrate)', perGuest: CONFIG.pricing.sparklingPerGuest },
      waffles: { label: 'Waffeln am Stiel (Flatrate)', perGuest: CONFIG.pricing.wafflesPerGuest },
      cold: { label: 'Kaltgetränke', variable: 'nach Verbrauch' }
    };
    const extraData = {
      childcare: { label: 'Kinderbetreuung inkl. Material', perChildHour: CONFIG.pricing.childcarePerChildHour },
      decor: { label: 'Dekoration & Floristik', variable: 'nach individueller Absprache' }
    };
    let latestQuote = null;

    function money(value) { return Math.round((value + Number.EPSILON) * 100) / 100; }
    function basePackageFor(hours) {
      return CONFIG.pricing.basePackages.find(pkg => hours <= pkg.maxHours) || null;
    }
    function calculateQuote() {
      const pkg = basePackageFor(calc.duration);
      const base = pkg ? pkg.price : 0;
      const serviceCost = [...calc.services].reduce((sum, key) => {
        const item = serviceData[key];
        if (!item) return sum;
        return sum + (item.perGuestHour || 0) * calc.guests * calc.duration + (item.perGuest || 0) * calc.guests;
      }, 0);
      const extrasCost = [...calc.extras].reduce((sum, key) => {
        const item = extraData[key];
        if (!item) return sum;
        return sum + (item.perChildHour || 0) * calc.children * calc.duration;
      }, 0);
      let travelCost = 0;
      const openItems = [];
      if (calc.distance <= CONFIG.pricing.travel.includedKm) travelCost = 0;
      else if (calc.distance <= 50) travelCost = CONFIG.pricing.travel.upTo50;
      else if (calc.distance <= 100) travelCost = CONFIG.pricing.travel.upTo100;
      else openItems.push('Anfahrt über 100 km');
      if (!pkg) openItems.push('Einsatzdauer über 6 Stunden');
      [...calc.services].forEach(key => { if (serviceData[key]?.variable) openItems.push(`${serviceData[key].label}: ${serviceData[key].variable}`); });
      [...calc.extras].forEach(key => { if (extraData[key]?.variable) openItems.push(`${extraData[key].label}: ${extraData[key].variable}`); });
      const total = money(base + serviceCost + extrasCost + travelCost);
      return { base, serviceCost: money(serviceCost), extrasCost: money(extrasCost), travelCost: money(travelCost), total, openItems, packageHours: pkg?.maxHours || null };
    }

    /* Der Richtwert ist die wichtigste Zahl der Seite. Die Animation ist nur
       Beiwerk: der Endwert wird immer gesetzt -- auch wenn requestAnimationFrame
       gar nicht laeuft (Hintergrund-Tab) oder die Zeitbasis abweicht. */
    function animateNumber(el, next) {
      if (el._anim) cancelAnimationFrame(el._anim);
      clearTimeout(el._animFallback);
      const from = Number(el.dataset.value);
      const current = Number.isFinite(from) ? from : next;
      el.dataset.value = next;
      const finish = () => { el.textContent = euro.format(next); };
      el._animFallback = setTimeout(finish, 400);
      if (current === next || !window.requestAnimationFrame
          || matchMedia('(prefers-reduced-motion: reduce)').matches) { finish(); return; }
      const start = performance.now();
      const duration = 320;
      const tick = (now) => {
        const p = Math.min(1, Math.max(0, (now - start) / duration));
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = euro.format(current + (next - current) * eased);
        if (p < 1) el._anim = requestAnimationFrame(tick); else finish();
      };
      el._anim = requestAnimationFrame(tick);
    }

    function updateQuote() {
      syncServiceDependencies();
      latestQuote = calculateQuote();
      const q = latestQuote;
      const priceEl = document.getElementById('priceTotal');
      if (q.openItems.length) {
        priceEl.textContent = `ab ${euro.format(q.total)}`;
        priceEl.dataset.value = q.total;
      } else {
        animateNumber(priceEl, q.total);
      }
      document.getElementById('priceRange').textContent = q.openItems.length
        ? `berechenbarer Richtwert · ${q.openItems.length} Position${q.openItems.length === 1 ? '' : 'en'} werden individuell ergänzt`
        : 'vorläufiger Richtwert gemäß Ihrer Auswahl';
      document.getElementById('baseBreakdown').textContent = euro.format(q.base);
      document.getElementById('serviceBreakdown').textContent = euro.format(q.serviceCost);
      document.getElementById('eventBreakdown').textContent = euro.format(q.extrasCost);
      document.getElementById('extraBreakdown').textContent = q.openItems.includes('Anfahrt über 100 km') ? 'auf Anfrage' : euro.format(q.travelCost);
      document.getElementById('totalBreakdown').textContent = q.openItems.length ? `ab ${euro.format(q.total)}` : euro.format(q.total);
      const note = document.getElementById('openPriceNote');
      if (note) note.textContent = q.openItems.length
        ? `Noch offen: ${q.openItems.join(' · ')}. Diese Positionen ergänzen wir im individuellen Angebot.`
        : 'Unverbindlicher Brutto-Richtwert auf Basis Ihrer Auswahl. Den finalen Preis bestätigen wir mit dem individuellen Angebot.';
      const childcarePreview = document.getElementById('childcarePricePreview');
      if (childcarePreview) childcarePreview.textContent = euro.format(CONFIG.pricing.childcarePerChildHour * calc.children * calc.duration);
      updateJourneySummary();
    }

    function quoteText() {
      const q = calculateQuote();
      const services = [...calc.services].map(k => serviceData[k].label).join(', ');
      const extras = calc.extras.size ? [...calc.extras].map(k => extraData[k].label).join(', ') : 'keine';
      return [
        `Unverbindliche Konfiguration – ${CONFIG.businessName}`,
        `Anlass: ${eventData[calc.event].label}`,
        `Gäste: ${calc.guests}`,
        `Dauer: ${calc.duration} Stunden`,
        `Grundpaket: ${euro.format(q.base)} inkl. Aufbau, Abbau, Servicepersonal und mobiler Kaffeebar`,
        `Entfernung: ${calc.distance} km einfache Strecke ab Dortmund-Mengede`,
        `Leistungen: ${services}`,
        `Zusatzleistungen: ${extras}`,
        calc.extras.has('childcare') ? `Kinderbetreuung: ${calc.children} ${calc.children === 1 ? 'Kind' : 'Kinder'}` : '',
        calc.preferredDate ? `Wunschtermin: ${formatLongDate(calc.preferredDate)}${calc.preferredTime ? ` · ${calc.preferredTime} Uhr` : ''}` : '',
        calc.note ? `Besonderer Wunsch: ${calc.note}` : '',
        `Berechenbarer Richtwert: ${q.openItems.length ? 'ab ' : ''}${euro.format(q.total)}`,
        q.openItems.length ? `Noch individuell zu kalkulieren: ${q.openItems.join('; ')}` : '',
        '',
        'Hinweis: Der endgültige Preis wird individuell angeboten.'
      ].filter(Boolean).join('\n');
    }

    /* ---------------------------------------------------------------
       Konfigurator: eine Sektion, links die Schrittleiste mit Preis,
       rechts der jeweils aktive Schritt.
       --------------------------------------------------------------- */
    const STEP_META = [
      ['Termin & Uhrzeit', 'Datum, Startzeit und Dauer wählen.', 'Weiter: Anlass'],
      ['Anlass', 'Damit Aufwand und Ablauf passend kalkuliert werden.', 'Weiter: Umfang'],
      ['Umfang', 'Gästezahl und Entfernung konkretisieren.', 'Weiter: Genuss'],
      ['Genuss', 'Kaffee, Upgrades und Genussleistungen wählen.', 'Weiter: Extras'],
      ['Extras', 'Nur ergänzen, was echten Mehrwert bringt.', 'Zur Anfrage'],
      ['Anfrage', 'Kontaktdaten ergänzen und unverbindlich senden.', 'Anfrage senden']
    ];
    const TOTAL_STEPS = STEP_META.length;
    let maxUnlocked = 1;

    function stepSummary(n) {
      if (n === 1) return calc.preferredDate
        ? formatLongDate(calc.preferredDate)
          + (calc.preferredTime ? ' · ' + calc.preferredTime + ' Uhr' : '')
          + ' · ' + calc.duration + ' Std.'
        : 'Noch offen';
      if (n === 2) return eventData[calc.event].label;
      if (n === 3) return calc.guests + ' Gäste · ' + calc.distance + ' km';
      if (n === 4) return [...calc.services].map(k => serviceData[k].label).join(', ') || 'Keine Auswahl';
      if (n === 5) return calc.extras.size
        ? [...calc.extras].map(k => extraData[k].label).join(', ')
        : 'Keine Extras';
      return 'Kontaktdaten ergänzen';
    }

    function renderRail() {
      document.querySelectorAll('.rail-step').forEach(btn => {
        const n = Number(btn.dataset.journey);
        btn.classList.toggle('is-active', n === calc.step);
        btn.classList.toggle('is-done', n < maxUnlocked);
        btn.disabled = n > maxUnlocked;
        const hint = btn.querySelector('[data-rail-hint]');
        if (hint) hint.textContent = n < calc.step || (n < maxUnlocked && n !== calc.step)
          ? stepSummary(n) : STEP_META[n - 1][1];
      });
    }

    function renderRecap() {
      const box = document.getElementById('recap');
      if (!box) return;
      box.innerHTML = STEP_META.slice(0, 5).map((meta, i) => {
        const n = i + 1;
        return '<div class="recap-row"><small>' + meta[0] + '</small><span>' + stepSummary(n)
          + '</span><button class="link-button" data-recap="' + n + '" type="button">ändern</button></div>';
      }).join('');
      box.querySelectorAll('[data-recap]').forEach(btn =>
        btn.addEventListener('click', () => setStep(Number(btn.dataset.recap), { scroll: true })));
    }

    function setStep(step, options = {}) {
      if (step > 1 && !validateSchedule(calc.step === TOTAL_STEPS)) return;
      calc.step = Math.max(1, Math.min(TOTAL_STEPS, step));
      maxUnlocked = Math.max(maxUnlocked, calc.step);
      document.querySelectorAll('.cfg-step').forEach(el =>
        el.classList.toggle('is-active', Number(el.dataset.step) === calc.step));
      const meta = STEP_META[calc.step - 1];
      document.getElementById('stepTitle').textContent = meta[0];
      document.getElementById('stepHint').textContent = meta[1];
      document.getElementById('prevStep').disabled = calc.step === 1;
      document.getElementById('nextStep').textContent = meta[2];
      if (calc.step === TOTAL_STEPS) renderRecap();
      renderRail();
      updateJourneySummary();
      if (options.scroll !== false) {
        // Position the new panel after layout, independently of scroll anchoring.
        requestAnimationFrame(() => {
          const title = document.getElementById('stepTitle');
          title.focus({ preventScroll: true });
          title.closest('.stage').scrollIntoView({ behavior: 'instant', block: 'start' });
        });
      }
    }

    document.querySelectorAll('input[name="event"]').forEach(input => input.addEventListener('change', () => { calc.event = input.value; updateQuote(); renderRail(); }));
    const guestInput = document.getElementById('guests');
    guestInput.addEventListener('input', () => { calc.guests = Number(guestInput.value); document.getElementById('guestOutput').textContent = calc.guests; updateQuote(); renderRail(); });
    document.getElementById('duration').addEventListener('change', e => {
      calc.duration = Number(e.target.value);
      updateQuote(); updateJourneySummary(); renderRail();
    });
    document.getElementById('distance').addEventListener('input', e => { calc.distance = Math.max(0, Number(e.target.value || 0)); updateQuote(); renderRail(); });
    document.getElementById('note').addEventListener('input', e => {
      calc.note = e.target.value.trim();
      updateJourneySummary();
    });
    document.querySelectorAll('input[name="service"]').forEach(input => input.addEventListener('change', () => {
      if (input.checked) calc.services.add(input.value); else calc.services.delete(input.value);
      document.querySelectorAll('.package-card').forEach(btn => btn.classList.remove('active'));
      updateQuote(); renderRail();
    }));
    function syncServiceDependencies() {
      const hasCoffee = calc.services.has('coffee');
      if (!hasCoffee) calc.services.delete('matcha');
      const matcha = document.querySelector('input[name="service"][value="matcha"]');
      matcha.disabled = !hasCoffee;
      matcha.checked = calc.services.has('matcha');
    }
    function syncConditionalExtras() {
      const wrap = document.getElementById('childcareOptions');
      if (wrap) wrap.hidden = !calc.extras.has('childcare');
    }
    document.querySelectorAll('input[name="extra"]').forEach(input => input.addEventListener('change', () => {
      if (input.checked) calc.extras.add(input.value); else calc.extras.delete(input.value);
      syncConditionalExtras(); updateQuote(); renderRail();
    }));
    document.getElementById('childrenCount').addEventListener('input', event => {
      calc.children = Math.min(20, Math.max(1, Number(event.target.value || 1)));
      event.target.value = String(calc.children);
      updateQuote();
    });
    document.querySelectorAll('.package-card').forEach(button => button.addEventListener('click', () => {
      const type = button.dataset.package;
      calc.services = new Set(
        type === 'matcha' ? ['coffee', 'matcha']
          : type === 'waffle' ? ['coffee', 'waffles']
            : type === 'sparkling' ? ['sparkling']
              : ['coffee']
      );
      document.querySelectorAll('input[name="service"]').forEach(input => input.checked = calc.services.has(input.value));
      document.querySelectorAll('.package-card').forEach(btn => btn.classList.toggle('active', btn === button));
      updateQuote(); renderRail();
    }));
    syncConditionalExtras();

    document.getElementById('prevStep').addEventListener('click', () => setStep(calc.step - 1));
    document.getElementById('nextStep').addEventListener('click', () => {
      if (calc.step < TOTAL_STEPS) {
        if (calc.step === TOTAL_STEPS - 1) fillContactFromQuote({ silent: true });
        setStep(calc.step + 1);
      } else {
        document.getElementById('contactForm').requestSubmit();
      }
    });
    document.querySelectorAll('.rail-step').forEach(btn =>
      btn.addEventListener('click', () => { if (!btn.disabled) setStep(Number(btn.dataset.journey)); }));

    function fillContactFromQuote(options = {}) {
      if (!validateSchedule(calc.step === TOTAL_STEPS)) return false;
      syncContactFromQuote();
      if (!options.silent) showToast('Konfiguration wurde in die Anfrage übernommen.');
      return true;
    }
    function syncContactFromQuote() {
      document.getElementById('contactEvent').value = calc.event;
      syncFieldValue('contactDate', calc.preferredDate);
      syncFieldValue('contactTime', calc.preferredTime);
      document.getElementById('contactQuote').value = quoteText();
    }
    function syncFieldValue(id, value) {
      const input = document.getElementById(id);
      // Do not reset a date/time input while the user is editing a segment.
      if (input.value !== value) input.value = value;
    }
    document.getElementById('useQuote').addEventListener('click', () => {
      if (fillContactFromQuote()) setStep(TOTAL_STEPS);
    });
    document.getElementById('copyQuote').addEventListener('click', async () => {
      if (!validateSchedule(calc.step === TOTAL_STEPS)) return;
      try { await navigator.clipboard.writeText(quoteText()); showToast('Kalkulation kopiert.'); }
      catch { showToast('Kopieren nicht möglich – bitte Text in der Anfrage verwenden.'); }
    });

    function localDateKey(date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    function parseLocalDate(value) {
      if (!value) return null;
      const [y, m, d] = value.split('-').map(Number);
      if (!y || !m || !d) return null;
      return new Date(y, m - 1, d);
    }
    function formatLongDate(value) {
      const date = parseLocalDate(value);
      if (!date) return '';
      return date.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    function applyScheduleDateBounds() {
      const today = localDateKey(new Date());
      ['scheduleDate', 'contactDate'].forEach(id => {
        const input = document.getElementById(id);
        input.min = today;
        input.setCustomValidity(input.value && input.value < today
          ? 'Bitte wählen Sie heute oder ein Datum in der Zukunft.' : '');
      });
    }

    function validateSchedule(inContact = false) {
      applyScheduleDateBounds();
      const prefix = inContact ? 'contact' : 'schedule';
      const invalid = ['Date', 'Time'].map(part => document.getElementById(prefix + part))
        .find(input => !input.checkValidity());
      if (!invalid) return true;
      // Reveal the date/time fields before invoking native browser validation.
      if (!inContact && calc.step !== 1) setStep(1, { scroll: true });
      invalid.reportValidity();
      return false;
    }

    function updateJourneySummary() {
      const durationContext = document.getElementById('durationContext');
      if (durationContext) durationContext.textContent = `${calc.duration} Stunden`;
      const timeContext = document.getElementById('timeContext');
      if (timeContext) timeContext.textContent = calc.preferredTime
        ? `Beginn um ${calc.preferredTime} Uhr` : 'Startzeit noch offen';
      syncContactFromQuote();
      if (calc.step === TOTAL_STEPS) renderRecap();
    }

    ['schedule', 'contact'].forEach(prefix => {
      document.getElementById(prefix + 'Date').addEventListener('input', event => {
        calc.preferredDate = event.target.value;
        syncFieldValue('scheduleDate', calc.preferredDate);
        updateJourneySummary(); renderRail(); applyScheduleDateBounds();
      });
      document.getElementById(prefix + 'Time').addEventListener('input', event => {
        calc.preferredTime = event.target.value;
        syncFieldValue('scheduleTime', calc.preferredTime);
        updateJourneySummary(); renderRail();
      });
    });
    document.getElementById('contactEvent').addEventListener('change', event => {
      if (!eventData[event.target.value]) return;
      calc.event = event.target.value;
      document.querySelectorAll('input[name="event"]').forEach(input => {
        input.checked = input.value === calc.event;
      });
      updateQuote(); renderRail();
    });
    applyScheduleDateBounds();

    document.querySelectorAll('.faq-trigger').forEach(button => button.addEventListener('click', () => {
      const item = button.closest('.faq-item'); const open = item.classList.toggle('open'); button.setAttribute('aria-expanded', String(open));
    }));

    const menuOpen = document.getElementById('menuOpen');
    const menuDrawer = document.getElementById('menuDrawer');
    function toggleMenu(open) { document.body.classList.toggle('menu-open', open); menuOpen.setAttribute('aria-expanded', String(open)); menuDrawer.setAttribute('aria-hidden', String(!open)); }
    menuOpen.addEventListener('click', () => toggleMenu(true));
    document.getElementById('menuClose').addEventListener('click', () => toggleMenu(false));
    document.getElementById('menuOverlay').addEventListener('click', () => toggleMenu(false));
    document.querySelectorAll('.drawer-nav a').forEach(a => a.addEventListener('click', () => toggleMenu(false)));

    const galleryModal = document.getElementById('galleryModal');
    function closeModal() { galleryModal.classList.remove('open'); document.body.classList.remove('modal-open'); }
    document.querySelectorAll('.gallery-item').forEach(item => item.addEventListener('click', () => {
      document.getElementById('modalImage').src = item.dataset.image;
      document.getElementById('modalImage').alt = item.dataset.caption;
      document.getElementById('modalCaption').textContent = item.dataset.caption;
      galleryModal.classList.add('open'); document.body.classList.add('modal-open');
    }));
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalBackdrop').addEventListener('click', closeModal);

    const toast = document.getElementById('toast'); let toastTimer;
    function showToast(message) { clearTimeout(toastTimer); toast.textContent = message; toast.classList.add('show'); toastTimer = setTimeout(() => toast.classList.remove('show'), 3200); }

    function buildInquiryMailto() {
      const name = document.getElementById('contactName').value.trim();
      const email = document.getElementById('contactEmail').value.trim();
      const phone = document.getElementById('contactPhone').value.trim();
      const date = document.getElementById('contactDate').value;
      const time = document.getElementById('contactTime').value;
      const event = eventData[calc.event].label;
      const personalMessage = document.getElementById('contactMessage').value.trim();
      const message = quoteText() + (personalMessage ? '\n\nPersönliche Nachricht:\n' + personalMessage : '');
      const subject = encodeURIComponent(`Unverbindliche Anfrage${event ? ' – ' + event : ''}`);
      const body = encodeURIComponent(`Name: ${name}\nE-Mail: ${email}\nTelefon: ${phone || '-'}\nWunschtermin: ${date || '-'}${time ? ' · ' + time + ' Uhr' : ''}\nAnlass: ${event || '-'}\n\n${message}`);
      return `mailto:${CONFIG.email}?subject=${subject}&body=${body}`;
    }

    document.getElementById('contactForm').addEventListener('submit', e => {
      e.preventDefault();
      const form = e.currentTarget;
      if (!validateSchedule(true)) return;
      if (!form.reportValidity()) return;
      document.getElementById('formStatus').textContent = 'Die vorbereitete E-Mail wird geöffnet …';
      window.location.href = buildInquiryMailto();
      showToast('E-Mail-Anfrage wurde vorbereitet.');
    });

    document.getElementById('instagramLink').href = CONFIG.instagramUrl;
    document.getElementById('instagramLink').target = '_blank';
    document.getElementById('instagramLink').rel = 'noopener';
    document.getElementById('whatsappLink').addEventListener('click', e => {
      e.preventDefault();
      if (!validateSchedule(calc.step === TOTAL_STEPS)) return;
      const url = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(quoteText())}`;
      window.open(url, '_blank', 'noopener');
    });

    const revealTargets = [...document.querySelectorAll('[data-reveal]')];
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('revealed'); observer.unobserve(entry.target); } }), { threshold: .12 });
    revealTargets.forEach(el => observer.observe(el));
    // Sicherheitsnetz: bleibt der Observer aus (Fehler, alter Browser), waere die
    // Seite sonst dauerhaft leer -- nach 2s wird alles sichtbar gemacht.
    setTimeout(() => revealTargets.forEach(el => el.classList.add('revealed')), 2000);

    // Befund 5: schwebender Button erst zeigen, wenn der Hero durch ist --
    // im Hero steht bereits ein Button mit demselben Text.
    const floatingCta = document.querySelector('.floating-cta');
    const heroSection = document.getElementById('start');
    const planSection = document.getElementById('planen');
    if (floatingCta && heroSection) {
      // Der Button ist nur dort sinnvoll, wo gerade KEIN echter Anfrage-Button
      // sichtbar ist -- also weder im Hero noch im Konfigurator.
      const inView = new Set();
      const ctaSpy = new IntersectionObserver(entries => {
        entries.forEach(e => e.isIntersecting ? inView.add(e.target) : inView.delete(e.target));
        floatingCta.classList.toggle('is-visible', inView.size === 0);
      }, { rootMargin: '-120px 0px 0px 0px' });
      ctaSpy.observe(heroSection);
      if (planSection) ctaSpy.observe(planSection);
    }

    const sections = [...document.querySelectorAll('main section[id]')];
    const navLinks = [...document.querySelectorAll('.drawer-nav a')];
    const spy = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id)); }), { rootMargin: '-38% 0px -55% 0px' });
    sections.forEach(section => spy.observe(section));

    const header = document.getElementById('siteHeader');
    window.addEventListener('scroll', () => header.classList.toggle('scrolled', scrollY > 20), { passive: true });

    const heroStage = document.getElementById('heroStage');
    const heroCard = document.getElementById('heroCard');
    if (matchMedia('(pointer:fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      heroStage.addEventListener('mousemove', e => {
        const r = heroStage.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5; const y = (e.clientY - r.top) / r.height - .5;
        heroCard.style.transform = `rotateY(${x * 7}deg) rotateX(${-y * 6}deg) translateZ(0)`;
      });
      heroStage.addEventListener('mouseleave', () => heroCard.style.transform = '');
    }

    document.addEventListener('keydown', e => { if (e.key === 'Escape') { toggleMenu(false); closeModal(); } });
    document.querySelectorAll('[data-instagram-direct]').forEach(link => { link.href = CONFIG.instagramUrl; link.target = '_blank'; link.rel = 'noopener'; });
    document.querySelectorAll('[data-whatsapp-direct]').forEach(link => { link.href = `https://wa.me/${CONFIG.whatsappNumber}`; link.target = '_blank'; link.rel = 'noopener'; });
    document.getElementById('year').textContent = new Date().getFullYear();
    setStep(1, { scroll: false }); updateQuote(); updateJourneySummary();
