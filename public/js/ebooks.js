/* ══════════════════════════════════════════════════════════════════════════════
   Kratos E-Books — Purchase & Download Flow
   Handles: buy button clicks → Stripe checkout → success/cancel return → download
   ══════════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── EBOOK PRICE LABELS (for restoring after loading state) ────────────────
  const EBOOK_LABELS = {
    ebook_1: 'Koop nu — €19',
    ebook_2: 'Koop nu — €25',
    ebook_3: 'Koop nu — €17',
  };

  const EBOOK_TITLES = {
    ebook_1: 'Meal Prep Mastery',
    ebook_2: 'Kracht & Spieropbouw',
    ebook_3: 'Vetverlies Zonder Gedoe',
  };

  // ─── EBOOK BUY BUTTON HANDLER (Event Delegation on #ebooks) ────────────────
  const ebooksSection = document.getElementById('ebooks');
  if (ebooksSection) {
    ebooksSection.addEventListener('click', async (e) => {
      const btn = e.target.closest('.ebook-buy-btn');
      if (!btn) return;

      const ebookId = btn.dataset.ebookId;
      if (!ebookId) return;

      const label = btn.querySelector('.btn-label');
      const loader = btn.querySelector('.btn-loader');

      // Loading state
      btn.disabled = true;
      if (label) label.textContent = 'Even laden\u2026';
      if (loader) loader.classList.remove('hidden');

      try {
        const res = await fetch('/api/create-ebook-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ebook_id: ebookId }),
        });

        const data = await res.json();

        if (data.url) {
          window.location = data.url;
        } else {
          throw new Error(data.error || 'Onbekende fout');
        }
      } catch (err) {
        console.error('Ebook checkout error:', err);
        btn.disabled = false;
        if (label) label.textContent = EBOOK_LABELS[ebookId] || 'Koop nu';
        if (loader) loader.classList.add('hidden');
        showEbookToast('error', 'Er ging iets mis bij het openen van de checkout. Probeer opnieuw of neem contact op.');
      }
    });
  }

  // ─── PAYMENT RETURN HANDLER (ebook-specific) ──────────────────────────────
  (function handleEbookReturn() {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    const product = params.get('product');
    const ebookId = params.get('ebook_id');
    const sessionId = params.get('session_id');

    // Only handle ebook returns
    if (product !== 'ebook') return;

    if (payment === 'success' && ebookId && sessionId) {
      showEbookSuccessToast(ebookId, sessionId);
      // Clean URL without reloading
      window.history.replaceState({}, '', window.location.pathname + '#ebooks');
    } else if (payment === 'cancel') {
      showEbookToast('cancel', 'Betaling geannuleerd. Geen probleem. Wil je hulp bij je keuze? Stuur Omar een bericht.');
      window.history.replaceState({}, '', window.location.pathname + '#ebooks');
    }
  })();

  // ─── SUCCESS TOAST WITH DOWNLOAD BUTTON ───────────────────────────────────
  function showEbookSuccessToast(ebookId, sessionId) {
    const title = EBOOK_TITLES[ebookId] || 'E-book';

    // Create a richer success toast with download capability
    const existing = document.getElementById('ebook-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'ebook-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.className = [
      'fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999]',
      'max-w-md w-[90%] rounded-2xl border backdrop-blur-xl',
      'text-white shadow-2xl',
      'transform transition-all duration-500 translate-y-8 opacity-0',
      'border-green-500/40 bg-green-500/10',
    ].join(' ');

    toast.innerHTML = `
      <div class="p-5">
        <div class="flex items-start gap-3 mb-4">
          <span class="material-symbols-outlined text-green-400 text-2xl mt-0.5 shrink-0">check_circle</span>
          <div>
            <p class="font-bold text-base mb-1">Betaling gelukt ✅</p>
            <p class="text-sm text-gray-300">Je e-book <strong>${title}</strong> staat klaar. Klik op Download om je bestand op te halen.</p>
          </div>
        </div>
        <button id="ebook-download-btn" data-ebook-id="${ebookId}" data-session-id="${sessionId}"
          class="w-full flex items-center justify-center gap-2 rounded-full h-12 bg-green-500 hover:bg-green-600 text-white text-sm font-bold transition-all cursor-pointer border-0 focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Download ${title}">
          <span class="material-symbols-outlined text-lg">download</span>
          <span class="btn-label">Download</span>
          <span class="btn-loader hidden" aria-live="polite">
            <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
          </span>
        </button>
        <button id="ebook-toast-close" class="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors p-1" aria-label="Sluiten">
          <span class="material-symbols-outlined text-lg">close</span>
        </button>
      </div>
    `;

    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.remove('translate-y-8', 'opacity-0'));
    });

    // Close button
    const closeBtn = toast.querySelector('#ebook-toast-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        toast.classList.add('translate-y-8', 'opacity-0');
        setTimeout(() => toast.remove(), 500);
      });
    }

    // Download button handler
    const downloadBtn = toast.querySelector('#ebook-download-btn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', async () => {
        const eid = downloadBtn.dataset.ebookId;
        const sid = downloadBtn.dataset.sessionId;

        const label = downloadBtn.querySelector('.btn-label');
        const loader = downloadBtn.querySelector('.btn-loader');

        downloadBtn.disabled = true;
        if (label) label.textContent = 'Even laden\u2026';
        if (loader) loader.classList.remove('hidden');

        try {
          const res = await fetch(`/api/ebook-download-link?ebook_id=${encodeURIComponent(eid)}&session_id=${encodeURIComponent(sid)}`);
          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.error || 'Fout bij ophalen download link.');
          }

          if (data.download_url) {
            // Open download in new tab/window to avoid navigating away
            window.open(data.download_url, '_blank');
            if (label) label.textContent = 'Opnieuw downloaden';
            downloadBtn.disabled = false;
            if (loader) loader.classList.add('hidden');
          } else {
            throw new Error('Geen download URL ontvangen.');
          }
        } catch (err) {
          console.error('Download error:', err);
          downloadBtn.disabled = false;
          if (label) label.textContent = 'Download';
          if (loader) loader.classList.add('hidden');
          showEbookToast('error', err.message || 'Er ging iets mis bij het downloaden. Probeer opnieuw of neem contact op.');
        }
      });
    }

    // Auto-scroll to ebooks section
    setTimeout(() => {
      const section = document.getElementById('ebooks');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 300);
  }

  // ─── GENERIC EBOOK TOAST ──────────────────────────────────────────────────
  function showEbookToast(type, message) {
    // Reuse the existing showPaymentToast pattern but with ebook-specific id
    const existing = document.getElementById('ebook-toast');
    if (existing) existing.remove();

    const colors = {
      success: 'border-green-500/40 bg-green-500/10',
      cancel: 'border-yellow-500/40 bg-yellow-500/10',
      error: 'border-red-500/40 bg-red-500/10',
    };
    const icons = { success: 'check_circle', cancel: 'info', error: 'error' };

    const toast = document.createElement('div');
    toast.id = 'ebook-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.className = `fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] max-w-md w-[90%] px-5 py-4 rounded-2xl border backdrop-blur-xl text-white text-sm font-medium shadow-2xl flex items-start gap-3 transform transition-all duration-500 translate-y-8 opacity-0 ${colors[type] || colors.error}`;
    toast.innerHTML = `
      <span class="material-symbols-outlined text-xl mt-0.5 shrink-0">${icons[type] || icons.error}</span>
      <span>${message}</span>`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.remove('translate-y-8', 'opacity-0'));
    });

    setTimeout(() => {
      toast.classList.add('translate-y-8', 'opacity-0');
      setTimeout(() => toast.remove(), 500);
    }, 8000);
  }
})();
