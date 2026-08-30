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
      },
      availability: {
        openingHour: 9,
        closingHour: 21
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
      children: 5,
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

    function animateNumber(el, next) {
      const current = Number(el.dataset.value || 0);
      const start = performance.now();
      const duration = 320;
      const tick = (now) => {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        const value = current + (next - current) * eased;
        el.textContent = euro.format(value);
        if (p < 1) requestAnimationFrame(tick); else el.dataset.value = next;
      };
      requestAnimationFrame(tick);
    }

    function updateQuote() {
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
      if (document.getElementById('journeySummaryPrice')) updateJourneySummary();
    }

    function quoteText() {
      const q = latestQuote || calculateQuote();
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
        calc.extras.has('childcare') ? `Kinderbetreuung: ${calc.children} Kinder` : '',
        calc.preferredDate ? `Wunschtermin: ${formatLongDate(calc.preferredDate)}${calc.preferredTime ? ` · ${calc.preferredTime} Uhr` : ''}` : '',
        calc.note ? `Besonderer Wunsch: ${calc.note}` : '',
        `Berechenbarer Richtwert: ${q.openItems.length ? 'ab ' : ''}${euro.format(q.total)}`,
        q.openItems.length ? `Noch individuell zu kalkulieren: ${q.openItems.join('; ')}` : '',
        '',
        'Hinweis: Der endgültige Preis wird individuell angeboten.'
      ].filter(Boolean).join('\n');
    }

    function setStep(step, options = {}) {
      calc.step = Math.max(1, Math.min(4, step));
      document.querySelectorAll('.calc-step').forEach(el => el.classList.toggle('active', Number(el.dataset.step) === calc.step));
      document.querySelectorAll('.step-dot').forEach((el, idx) => el.classList.toggle('active', idx + 1 === calc.step));
      const titles = [
        ['Anlass auswählen', 'Für welchen Rahmen planen wir Ihren Einsatz?'],
        ['Umfang bestimmen', 'Gästezahl, Dauer und Entfernung bestimmen Grundpaket und Anfahrt.'],
        ['Genuss zusammenstellen', 'Kaffee-Flatrate, Upgrades und Genussleistungen auswählen.'],
        ['Extras ergänzen', 'Nur ergänzen, was echten Mehrwert bringt.']
      ];
      document.getElementById('stepTitle').textContent = titles[calc.step - 1][0];
      document.getElementById('stepHint').textContent = titles[calc.step - 1][1];
      document.getElementById('stepNumber').textContent = calc.step;
      document.getElementById('prevStep').disabled = false;
      document.getElementById('prevStep').textContent = calc.step === 1 ? 'Zurück zum Termin' : 'Zurück';
      document.getElementById('nextStep').textContent = calc.step === 1 ? 'Weiter: Umfang' : calc.step === 2 ? 'Weiter: Genuss' : calc.step === 3 ? 'Weiter: Extras' : 'Zur Anfrage';
      document.getElementById('durationContext').textContent = `${calc.duration} Stunden`;
      document.getElementById('timeContext').textContent = calc.preferredTime ? `Beginn um ${calc.preferredTime} Uhr` : 'Startzeit noch offen';
      if (options.syncJourney !== false) {
        const stage = calc.step === 1 ? 2 : calc.step === 2 ? 3 : 4;
        setJourneyStage(stage, { unlock: true, scroll: false, syncStep: false });
      }
      updateJourneySummary();
    }

    document.querySelectorAll('input[name="event"]').forEach(input => input.addEventListener('change', () => { calc.event = input.value; updateQuote(); updateJourneySummary(); }));
    const guestInput = document.getElementById('guests');
    guestInput.addEventListener('input', () => { calc.guests = Number(guestInput.value); document.getElementById('guestOutput').textContent = calc.guests; updateQuote(); updateJourneySummary(); });
    document.getElementById('duration').addEventListener('change', e => { calc.duration = Number(e.target.value); document.getElementById('calendarDuration').value = String(calc.duration); applyScheduleTimeBounds(); updateQuote(); updateJourneySummary(); });
    document.getElementById('distance').addEventListener('input', e => { calc.distance = Math.max(0, Number(e.target.value || 0)); updateQuote(); updateJourneySummary(); });
    document.getElementById('note').addEventListener('input', e => calc.note = e.target.value.trim());
    document.querySelectorAll('input[name="service"]').forEach(input => input.addEventListener('change', () => {
      if (input.checked) calc.services.add(input.value); else calc.services.delete(input.value);
      document.querySelectorAll('.package-card').forEach(btn => btn.classList.remove('active'));
      updateQuote();
    }));
    function syncConditionalExtras() {
      const wrap = document.getElementById('childcareOptions');
      if (wrap) wrap.hidden = !calc.extras.has('childcare');
    }
    document.querySelectorAll('input[name="extra"]').forEach(input => input.addEventListener('change', () => {
      if (input.checked) calc.extras.add(input.value); else calc.extras.delete(input.value);
      syncConditionalExtras();
      updateQuote();
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
      updateQuote();
    }));
    syncConditionalExtras();
    document.getElementById('prevStep').addEventListener('click', () => {
      if (calc.step === 1) setJourneyStage(1, { scroll: true });
      else setStep(calc.step - 1);
    });
    document.getElementById('nextStep').addEventListener('click', () => {
      if (calc.step < 4) setStep(calc.step + 1);
      else { fillContactFromQuote(); setJourneyStage(5, { unlock: true, scroll: true }); }
    });

    function fillContactFromQuote() {
      document.getElementById('contactEvent').value = eventData[calc.event].label;
      if (calc.preferredDate) document.getElementById('contactDate').value = calc.preferredDate;
      if (calc.preferredTime) document.getElementById('contactTime').value = calc.preferredTime;
      document.getElementById('contactMessage').value = quoteText();
      showToast('Konfiguration wurde in die Anfrage übernommen.');
    }
    document.getElementById('useQuote').addEventListener('click', () => { fillContactFromQuote(); setJourneyStage(5, { unlock: true, scroll: true }); });
    document.getElementById('copyQuote').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(quoteText()); showToast('Kalkulation kopiert.'); }
      catch { showToast('Kopieren nicht möglich – bitte Text in der Anfrage verwenden.'); }
    });


    const availabilityState = { selectedDate: '', selectedTime: '' };
    const journeyState = { current: 1, maxUnlocked: 1 };

    function localDateKey(date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    function parseLocalDate(value) {
      if (!value) return null;
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T12:00:00`);
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    function formatLongDate(value) {
      const date = parseLocalDate(value);
      return date ? new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(date) : value;
    }
    function applyScheduleTimeBounds() {
      const cfg = CONFIG.availability || {};
      const opening = Number(cfg.openingHour ?? 9);
      const closing = Math.max(opening, Number(cfg.closingHour ?? 21) - calc.duration);
      const input = document.getElementById('scheduleTime');
      input.min = `${String(opening).padStart(2, '0')}:00`;
      input.max = `${String(closing).padStart(2, '0')}:00`;
    }
    function updateAvailabilitySelection() {
      const title = document.getElementById('availabilitySelectionTitle');
      const hint = document.getElementById('availabilitySelectionHint');
      const button = document.getElementById('continueToCalculator');
      if (!availabilityState.selectedDate || !availabilityState.selectedTime) {
        title.textContent = 'Noch kein Termin ausgewählt';
        hint.textContent = 'Wählen Sie Datum und Startzeit aus.';
        button.disabled = true;
        return;
      }
      title.textContent = `${formatLongDate(availabilityState.selectedDate)} · ${availabilityState.selectedTime} Uhr`;
      hint.textContent = `${calc.duration} Stunden vorgemerkt – die Bestätigung folgt mit dem Angebot.`;
      button.disabled = false;
      document.getElementById('calculatorDateContext').textContent = `${formatLongDate(availabilityState.selectedDate)} · ${availabilityState.selectedTime} Uhr · ${calc.duration} Std.`;
      document.getElementById('durationContext').textContent = `${calc.duration} Stunden`;
      document.getElementById('timeContext').textContent = `Beginn um ${availabilityState.selectedTime} Uhr`;
    }
    function selectAvailabilityDate(value) {
      availabilityState.selectedDate = value;
      calc.preferredDate = value;
      document.getElementById('contactDate').value = value;
      updateAvailabilitySelection();
      updateJourneySummary();
    }
    function selectAvailabilityTime(value) {
      availabilityState.selectedTime = value;
      calc.preferredTime = value;
      document.getElementById('contactTime').value = value;
      updateAvailabilitySelection();
      updateJourneySummary();
    }
    function updateJourneySummary() {
      const q = latestQuote || calculateQuote();
      const dateText = calc.preferredDate
        ? `${new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(parseLocalDate(calc.preferredDate))}${calc.preferredTime ? ` · ${calc.preferredTime} Uhr` : ''}`
        : 'Noch offen';
      const dateEl = document.getElementById('journeySummaryDate');
      const eventEl = document.getElementById('journeySummaryEvent');
      const scopeEl = document.getElementById('journeySummaryScope');
      const priceEl = document.getElementById('journeySummaryPrice');
      if (dateEl) dateEl.textContent = dateText;
      if (eventEl) eventEl.textContent = eventData[calc.event].label;
      if (scopeEl) scopeEl.textContent = `${calc.guests} Gäste · ${calc.duration} Std. · ${calc.distance} km`;
      if (priceEl) priceEl.textContent = `${q.openItems.length ? 'ab ' : ''}${euro.format(q.total)}`;
    }
    function showSalesStage(stage) {
      const calendar = document.getElementById('kalender');
      const prices = document.getElementById('preise');
      const contact = document.getElementById('kontakt');
      calendar.classList.toggle('is-active', stage === 1);
      prices.classList.toggle('is-active', stage >= 2 && stage <= 4);
      contact.classList.toggle('is-active', stage === 5);
      calendar.setAttribute('aria-hidden', String(stage !== 1));
      prices.setAttribute('aria-hidden', String(!(stage >= 2 && stage <= 4)));
      contact.setAttribute('aria-hidden', String(stage !== 5));
    }
    function setJourneyStage(stage, options = {}) {
      const labels = [
        ['Termin & Uhrzeit', 'Datum, Startzeit und Dauer wählen.'],
        ['Anlass', 'Anlass auswählen.'],
        ['Umfang', 'Gästezahl und Entfernung angeben.'],
        ['Genuss & Extras', 'Leistungen wählen und Preisrahmen prüfen.'],
        ['Anfrage', 'Auswahl prüfen und Kontaktdaten ergänzen.']
      ];
      const safe = Math.max(1, Math.min(5, Number(stage) || 1));
      if (options.unlock) journeyState.maxUnlocked = Math.max(journeyState.maxUnlocked, safe);
      if (safe > journeyState.maxUnlocked) {
        showToast('Schließen Sie bitte zuerst den aktuellen Schritt ab.');
        return;
      }
      journeyState.current = safe;
      document.querySelectorAll('.journey-step').forEach(button => {
        const current = Number(button.dataset.journey);
        button.classList.toggle('active', current === safe);
        button.classList.toggle('done', current < safe);
        button.classList.toggle('locked', current > journeyState.maxUnlocked);
        button.disabled = current > journeyState.maxUnlocked;
      });
      const label = document.getElementById('journeyProgressLabel');
      const bar = document.getElementById('journeyProgressBar');
      if (label) label.textContent = `Schritt ${safe} von 5 · ${labels[safe - 1][0]}`;
      if (bar) bar.style.width = `${safe * 20}%`;
      document.getElementById('journeyCurrentTitle').textContent = labels[safe - 1][0];
      document.getElementById('journeyCurrentHint').textContent = labels[safe - 1][1];
      showSalesStage(safe);
      if (options.syncStep !== false) {
        if (safe === 2) setStep(1, { syncJourney: false });
        if (safe === 3) setStep(2, { syncJourney: false });
        if (safe === 4 && calc.step < 3) setStep(3, { syncJourney: false });
        if (safe === 5) fillContactFromQuote();
      }
      updateJourneySummary();
      if (options.scroll) document.getElementById('salesJourneyPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    function openScheduleStep() {
      setJourneyStage(1, { scroll: true });
    }
    function setupSalesJourney() {
      document.body.classList.add('sales-flow-ready');
      document.querySelectorAll('.journey-step').forEach(button => button.addEventListener('click', () => setJourneyStage(Number(button.dataset.journey), { scroll: true })));
      document.getElementById('scheduleDate').addEventListener('change', event => selectAvailabilityDate(event.target.value));
      document.getElementById('scheduleTime').addEventListener('change', event => selectAvailabilityTime(event.target.value));
      document.getElementById('calendarDuration').addEventListener('change', event => {
        calc.duration = Number(event.target.value);
        document.getElementById('duration').value = String(calc.duration);
        applyScheduleTimeBounds();
        updateQuote();
        updateJourneySummary();
      });
      document.getElementById('continueToCalculator').addEventListener('click', () => {
        if (!calc.preferredDate || !calc.preferredTime) return;
        journeyState.maxUnlocked = Math.max(journeyState.maxUnlocked, 2);
        setJourneyStage(2, { unlock: true, scroll: true });
      });
      document.getElementById('changeSchedule').addEventListener('click', openScheduleStep);
      document.getElementById('changeScheduleInline').addEventListener('click', openScheduleStep);
      const today = localDateKey(new Date());
      document.getElementById('contactDate').min = today;
      document.getElementById('scheduleDate').min = today;
      applyScheduleTimeBounds();
      setJourneyStage(1, { unlock: true, scroll: false });
    }

    setupSalesJourney();

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

    document.getElementById('contactForm').addEventListener('submit', e => {
      e.preventDefault();
      const form = e.currentTarget;
      if (!form.reportValidity()) return;
      const name = document.getElementById('contactName').value.trim();
      const email = document.getElementById('contactEmail').value.trim();
      const phone = document.getElementById('contactPhone').value.trim();
      const date = document.getElementById('contactDate').value;
      const time = document.getElementById('contactTime').value;
      const event = document.getElementById('contactEvent').value;
      const message = document.getElementById('contactMessage').value.trim();
      const subject = encodeURIComponent(`Unverbindliche Anfrage${event ? ' – ' + event : ''}`);
      const body = encodeURIComponent(`Name: ${name}\nE-Mail: ${email}\nTelefon: ${phone || '-'}\nWunschtermin: ${date || '-'}${time ? ' · ' + time + ' Uhr' : ''}\nAnlass: ${event || '-'}\n\n${message}`);
      document.getElementById('formStatus').textContent = 'Die vorbereitete E-Mail wird geöffnet …';
      window.location.href = `mailto:${CONFIG.email}?subject=${subject}&body=${body}`;
      showToast('E-Mail-Anfrage wurde vorbereitet.');
    });

    document.getElementById('instagramLink').href = CONFIG.instagramUrl;
    document.getElementById('instagramLink').target = '_blank';
    document.getElementById('instagramLink').rel = 'noopener';
    document.getElementById('whatsappLink').addEventListener('click', e => {
      e.preventDefault();
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

    // Befund 7: kompakte Preisleiste auf Mobile auf- und zuklappen
    const resultCard = document.querySelector('.result-card');
    const resultToggle = document.getElementById('resultToggle');
    if (resultCard && resultToggle) {
      resultToggle.addEventListener('click', () => {
        const open = resultCard.classList.toggle('is-open');
        resultToggle.setAttribute('aria-expanded', String(open));
        resultToggle.firstChild.nodeValue = open ? 'Details ausblenden' : 'Details';
      });
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
    setStep(1, { syncJourney: false }); updateQuote(); updateJourneySummary();
