/* ══════════════════════════════════════════════════════════════════════════════
   Kratos Personal Training — Main Application Script
   All UI logic: Coach Chat, QuickScan, Stripe Checkout, Mealplan, Essentials
   ══════════════════════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // ─── 1. Coach Chat Scripted State Machine ────────────────────────────────────
    let chatStep = 0;
    let userChoices = {};

    const chatFlow = [
        {
            id: 'goal',
            question: 'Hey! Tof dat je er bent. Wat is je belangrijkste doel?',
            options: ['Afvallen', 'Spieropbouw', 'In vorm komen'],
        },
        {
            id: 'level',
            question: 'Duidelijk. Wat is je huidige trainingsniveau?',
            options: ['Beginner', 'Gemiddeld', 'Gevorderd'],
        },
        {
            id: 'days',
            question: 'Hoeveel dagen per week zou je realistisch gezien willen trainen?',
            options: ['1-2 dagen', '3-4 dagen', '5-6 dagen'],
        },
        {
            id: 'challenge',
            question: 'Laatste vraag, wat is tot nu toe je grootste uitdaging?',
            options: ['Motivatie behouden', 'Tijd en planning', 'Geen plan/Kennis', 'Voeding/Dieet', 'Blessures'],
        },
    ];

    const PHONE = '32412345678';

    function toggleCoachChat() {
        const drawer = document.getElementById('coach-chat-drawer');
        const overlay = document.getElementById('coach-chat-overlay');
        if (!drawer || !overlay) return;
        const isOpen = !drawer.classList.contains('translate-x-full');

        if (isOpen) {
            drawer.classList.add('translate-x-full');
            overlay.classList.remove('opacity-100');
            overlay.classList.add('opacity-0');
            setTimeout(() => overlay.classList.add('hidden'), 300);
            drawer.setAttribute('aria-hidden', 'true');
        } else {
            overlay.classList.remove('hidden');
            void overlay.offsetWidth; // force reflow
            overlay.classList.remove('opacity-0');
            overlay.classList.add('opacity-100');
            drawer.classList.remove('translate-x-full');
            drawer.setAttribute('aria-hidden', 'false');

            const messagesContainer = document.getElementById('chat-messages');
            if (messagesContainer && messagesContainer.children.length === 0) {
                chatStep = 0;
                userChoices = {};
                messagesContainer.innerHTML = '';
                renderStep();
            }
        }
    }

    // Expose globally for onclick handlers
    window.toggleCoachChat = toggleCoachChat;

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const drawer = document.getElementById('coach-chat-drawer');
            if (drawer && !drawer.classList.contains('translate-x-full')) {
                toggleCoachChat();
            }
        }
    });

    function renderStep() {
        const messagesContainer = document.getElementById('chat-messages');
        const actionsContainer = document.getElementById('chat-actions');
        if (!messagesContainer || !actionsContainer) return;

        if (chatStep >= chatFlow.length) {
            actionsContainer.innerHTML = '';

            const bubble = document.createElement('div');
            bubble.className =
                'bg-[#21201F] text-white p-4 rounded-2xl rounded-tl-sm max-w-[90%] text-sm border border-white/5 shadow-md flex items-start gap-3 transform transition-all translate-y-4 opacity-0';
            bubble.innerHTML = `
        <div class="text-primary mt-0.5 shrink-0"><span class="material-symbols-outlined text-xl">fitness_center</span></div>
        <div>
          <p class="mb-3">Kijk, op basis van wat je me vertelt, stel ik dit voor:</p>
          <p class="font-bold mb-4">Hier is je samenvatting:</p>
          <ul class="text-gray-300 space-y-2 mb-4 text-xs font-medium">
            <li class="flex items-start gap-2"><span class="material-symbols-outlined text-primary text-sm shrink-0">check_circle</span>Doel: <span class="text-white">${userChoices.goal}</span></li>
            <li class="flex items-start gap-2"><span class="material-symbols-outlined text-primary text-sm shrink-0">check_circle</span>Niveau: <span class="text-white">${userChoices.level}</span></li>
            <li class="flex items-start gap-2"><span class="material-symbols-outlined text-primary text-sm shrink-0">check_circle</span>Dagen p/w: <span class="text-white">${userChoices.days}</span></li>
            <li class="flex items-start gap-2"><span class="material-symbols-outlined text-primary text-sm shrink-0">check_circle</span>Uitdaging: <span class="text-white">${userChoices.challenge}</span></li>
          </ul>
          <p class="text-gray-400 italic text-xs mb-1">Een intake of '5 sessies' pakket lijkt me een mooie start voor jou!</p>
        </div>`;
            messagesContainer.appendChild(bubble);
            setTimeout(() => {
                bubble.classList.remove('translate-y-4', 'opacity-0');
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 50);

            setTimeout(() => {
                const template = `Hey Omar! Dit is mijn Coach Chat samenvatting:\n- Doel: ${userChoices.goal}\n- Niveau: ${userChoices.level}\n- Dagen p/w: ${userChoices.days}\n- Uitdaging: ${userChoices.challenge}\n\nIk wil graag starten. Wanneer kan ik een intake plannen?`;
                const btnWrapper = document.createElement('div');
                btnWrapper.className = 'flex justify-center mt-2 transform transition-all translate-y-4 opacity-0 w-full';
                btnWrapper.innerHTML = `
          <a href="https://wa.me/${PHONE}?text=${encodeURIComponent(template)}" target="_blank" class="flex-1 flex items-center justify-center rounded-full h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white text-base font-bold transition-all shadow-xl hover:shadow-[#25D366]/20 gap-2">
            <span class="material-symbols-outlined">send</span>
            Stuur me een berichtje
          </a>`;
                actionsContainer.appendChild(btnWrapper);
                setTimeout(() => {
                    btnWrapper.classList.remove('translate-y-4', 'opacity-0');
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }, 50);
            }, 800);
            return;
        }

        const stepData = chatFlow[chatStep];

        const bubble = document.createElement('div');
        bubble.className =
            'bg-[#21201F] text-white p-4 rounded-2xl rounded-tl-none max-w-[85%] text-sm border border-white/5 shadow-sm transform transition-all translate-y-4 opacity-0 flex items-start gap-3 relative';
        bubble.innerHTML = `
      <div class="text-primary mt-0.5 shrink-0"><span class="material-symbols-outlined text-lg">psychology</span></div>
      <div class="pt-0.5 font-medium leading-relaxed">${stepData.question}</div>`;
        messagesContainer.appendChild(bubble);

        setTimeout(() => {
            bubble.classList.remove('translate-y-4', 'opacity-0');
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 50);

        actionsContainer.innerHTML = '';
        const optsGrid = document.createElement('div');
        optsGrid.className = 'flex flex-col gap-2.5';

        stepData.options.forEach((opt) => {
            const btn = document.createElement('button');
            btn.className =
                'w-full text-left py-3.5 px-5 rounded-xl border border-white/10 bg-white/5 hover:bg-primary/10 hover:border-primary/50 text-white text-sm font-medium transition-all focus:outline-none focus:ring-1 focus:ring-primary shadow-sm';
            btn.innerText = opt;
            btn.onclick = () => handleUserChoice(stepData.id, opt);
            optsGrid.appendChild(btn);
        });
        actionsContainer.appendChild(optsGrid);
    }

    function handleUserChoice(id, choice) {
        userChoices[id] = choice;
        const messagesContainer = document.getElementById('chat-messages');
        const actionsContainer = document.getElementById('chat-actions');
        if (actionsContainer) actionsContainer.innerHTML = '';

        const bubble = document.createElement('div');
        bubble.className =
            'bg-primary text-background-dark font-bold p-3.5 px-5 rounded-2xl rounded-tr-none max-w-[85%] self-end text-sm shadow-md transform transition-all translate-y-4 opacity-0 mt-2';
        bubble.innerText = choice;
        if (messagesContainer) messagesContainer.appendChild(bubble);

        setTimeout(() => {
            bubble.classList.remove('translate-y-4', 'opacity-0');
            if (messagesContainer) messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 50);

        chatStep++;
        setTimeout(renderStep, 600);
    }

    // ─── 2. Macro QuickScan Logic ────────────────────────────────────────────────
    const quickscanForm = document.getElementById('quickscan-form');
    if (quickscanForm) {
        quickscanForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const goal = document.getElementById('qs-doel').value;
            const gender = document.getElementById('qs-geslacht').value;
            const age = parseInt(document.getElementById('qs-leeftijd').value);
            const height = parseInt(document.getElementById('qs-lengte').value);
            const weight = parseInt(document.getElementById('qs-gewicht').value);
            const activity = document.getElementById('qs-activiteit').value;
            const days = parseInt(document.getElementById('qs-dagen').value);

            let bmr = 10 * weight + 6.25 * height - 5 * age;
            if (gender === 'man') bmr += 5;
            else if (gender === 'vrouw') bmr -= 161;
            else bmr -= 78;

            let activityMultiplier = 1.2;
            if (activity === 'laag') activityMultiplier = 1.2;
            if (activity === 'gemiddeld') activityMultiplier = 1.375;
            if (activity === 'hoog') activityMultiplier = 1.55;
            activityMultiplier += days * 0.05;

            let tdee = bmr * activityMultiplier;
            let targetCals = tdee;
            if (goal === 'afvallen') targetCals -= 500;
            else if (goal === 'spieropbouw') targetCals += 300;
            targetCals = Math.round(targetCals);

            const protein = Math.round(weight * 2.2);
            const fats = Math.round((targetCals * 0.25) / 9);
            const carbCals = targetCals - (protein * 4 + fats * 9);
            const carbs = Math.max(0, Math.round(carbCals / 4));

            document.getElementById('qs-res-cals').innerHTML = `${targetCals} <span class="text-lg text-white font-normal">kcal</span>`;
            document.getElementById('qs-res-p').innerText = `${protein}g`;
            document.getElementById('qs-res-c').innerText = `${carbs}g`;
            document.getElementById('qs-res-f').innerText = `${fats}g`;

            const goalLabel = goal === 'afvallen' ? 'Afvallen' : goal === 'spieropbouw' ? 'Spieropbouw' : 'In vorm komen';
            const template = `Hey Omar! Dit is mijn QuickScan samenvatting:\n- Doel: ${goalLabel}\n- Dagen p/w: ${days}\n- Calorieën: ${targetCals} kcal\n- Macro's: Eiwit ${protein}g / Koolh ${carbs}g / Vet ${fats}g\n\nIk wil graag starten. Wanneer kan ik een intake plannen?`;

            const waBtn = document.getElementById('qs-whatsapp-btn');
            if (waBtn) waBtn.href = `https://wa.me/${PHONE}?text=${encodeURIComponent(template)}`;

            const resultsBlock = document.getElementById('quickscan-results');
            if (resultsBlock) {
                resultsBlock.classList.remove('hidden');
                setTimeout(() => resultsBlock.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
            }
        });
    }

    // ─── 3. Logo Scroll Rotation ─────────────────────────────────────────────────
    const kratosLogo = document.getElementById('kratos-logo');
    if (kratosLogo) {
        window.addEventListener('scroll', () => {
            kratosLogo.style.transform = `rotate(${window.scrollY * 0.36}deg)`;
        }, { passive: true });
    }

    // ─── 4. Stripe Checkout Click Handler (Event Delegation) ─────────────────────
    const prijzenSection = document.getElementById('prijzen');
    if (prijzenSection) {
        prijzenSection.addEventListener('click', async (e) => {
            const btn = e.target.closest('.stripe-checkout-btn');
            if (!btn) return;

            const packageId = btn.dataset.packageId;
            if (!packageId) return;

            const label = btn.querySelector('.btn-label');
            const loader = btn.querySelector('.btn-loader');

            btn.disabled = true;
            if (label) label.textContent = 'Even laden\u2026';
            if (loader) loader.classList.remove('hidden');

            try {
                const res = await fetch('/api/create-checkout-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ package_id: packageId }),
                });

                const data = await res.json();

                if (data.url) {
                    window.location = data.url;
                } else {
                    throw new Error(data.error || 'Onbekende fout');
                }
            } catch (err) {
                console.error('Checkout error:', err);
                btn.disabled = false;
                if (label) label.textContent = 'Afrekenen';
                if (loader) loader.classList.add('hidden');
                showPaymentToast('error', 'Er ging iets mis bij het openen van de checkout. Probeer opnieuw of neem contact op.');
            }
        });
    }

    // ─── 5. Payment Return Toast ─────────────────────────────────────────────────
    function showPaymentToast(type, message) {
        const existing = document.getElementById('payment-toast');
        if (existing) existing.remove();

        const colors = {
            success: 'border-green-500/40 bg-green-500/10',
            cancel: 'border-yellow-500/40 bg-yellow-500/10',
            error: 'border-red-500/40 bg-red-500/10',
        };
        const icons = { success: 'check_circle', cancel: 'info', error: 'error' };

        const toast = document.createElement('div');
        toast.id = 'payment-toast';
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

    // Check URL on load for payment return
    (function checkPaymentReturn() {
        const params = new URLSearchParams(window.location.search);
        const payment = params.get('payment');
        if (payment === 'success') {
            showPaymentToast('success', 'Betaling gelukt! We nemen zo snel mogelijk contact met je op. 💪');
            window.history.replaceState({}, '', window.location.pathname + window.location.hash);
        } else if (payment === 'cancel') {
            showPaymentToast('cancel', 'Betaling geannuleerd. Wil je toch starten? Stuur Omar een bericht.');
            window.history.replaceState({}, '', window.location.pathname + window.location.hash);
        }
    })();

    // ─── 6. Meal Plan Widget ─────────────────────────────────────────────────────
    const mpCalSlider = document.getElementById('mp-calories');
    const mpCalDisplay = document.getElementById('mp-cal-display');
    if (mpCalSlider && mpCalDisplay) {
        mpCalSlider.addEventListener('input', () => {
            mpCalDisplay.textContent = mpCalSlider.value;
        });
    }

    document.querySelectorAll('.mealplan-gen-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const timeFrame = btn.dataset.timeframe;
            const calories = document.getElementById('mp-calories').value;
            const diet = document.getElementById('mp-diet').value;
            const exclude = document.getElementById('mp-exclude').value.trim();

            const resultsContainer = document.getElementById('mealplan-results');
            const loadingEl = document.getElementById('mp-loading');
            const contentEl = document.getElementById('mp-content');
            const errorEl = document.getElementById('mp-error');

            if (resultsContainer) resultsContainer.classList.remove('hidden');
            if (loadingEl) loadingEl.classList.remove('hidden');
            if (contentEl) contentEl.classList.add('hidden');
            if (errorEl) errorEl.classList.add('hidden');

            document.querySelectorAll('.mealplan-gen-btn').forEach((b) => (b.disabled = true));

            try {
                const params = new URLSearchParams({ targetCalories: calories, timeFrame });
                if (diet) params.set('diet', diet);
                if (exclude) params.set('exclude', exclude);

                const res = await fetch(`/api/mealplan?${params}`);
                const data = await res.json();

                if (!res.ok) throw new Error(data.error || 'Onbekende fout');

                renderMealPlan(data, timeFrame, calories);
                if (loadingEl) loadingEl.classList.add('hidden');
                if (contentEl) contentEl.classList.remove('hidden');

                setTimeout(() => {
                    if (resultsContainer) resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            } catch (err) {
                console.error('Meal plan error:', err);
                if (loadingEl) loadingEl.classList.add('hidden');
                if (errorEl) errorEl.classList.remove('hidden');
                const errMsg = document.getElementById('mp-error-msg');
                if (errMsg) errMsg.textContent = err.message || 'Oeps, dat lukt nu even niet. Probeer opnieuw of stuur Omar een bericht.';
            } finally {
                document.querySelectorAll('.mealplan-gen-btn').forEach((b) => (b.disabled = false));
            }
        });
    });

    function renderMealPlan(data, timeFrame, targetCals) {
        const mealsList = document.getElementById('mp-meals-list');
        if (!mealsList) return;
        mealsList.innerHTML = '';

        let totalCal = 0,
            totalProtein = 0,
            totalFat = 0;
        let meals = [];

        if (timeFrame === 'day' && data.meals) {
            meals = data.meals;
            const n = data.nutrients || {};
            totalCal = Math.round(n.calories || 0);
            totalProtein = Math.round(n.protein || 0);
            totalFat = Math.round(n.fat || 0);
        } else if (timeFrame === 'week' && data.week) {
            const dayNames = {
                monday: 'Maandag', tuesday: 'Dinsdag', wednesday: 'Woensdag',
                thursday: 'Donderdag', friday: 'Vrijdag', saturday: 'Zaterdag', sunday: 'Zondag',
            };
            Object.entries(data.week).forEach(([dayKey, dayData]) => {
                const dayLabel = dayNames[dayKey] || dayKey;
                const dayCard = document.createElement('div');
                dayCard.className = 'glass-panel p-5 rounded-2xl border-t border-white/5';
                let mealsHtml = '';
                (dayData.meals || []).forEach((m) => {
                    mealsHtml += `<div class="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
            <span class="material-symbols-outlined text-primary text-lg mt-0.5 shrink-0">restaurant</span>
            <div>
              <p class="text-white text-sm font-medium">${m.title}</p>
              <p class="text-gray-500 text-xs mt-1">~${Math.round(m.servings || 1)} portie(s) · Bereidingstijd: ${m.readyInMinutes || '?'} min</p>
            </div>
          </div>`;
                });
                const dn = dayData.nutrients || {};
                totalCal += Math.round(dn.calories || 0);
                totalProtein += Math.round(dn.protein || 0);
                totalFat += Math.round(dn.fat || 0);
                dayCard.innerHTML = `<h4 class="font-display text-lg font-bold text-primary mb-3">${dayLabel}</h4>
          <p class="text-gray-500 text-xs mb-3">${Math.round(dn.calories || 0)} kcal · ${Math.round(dn.protein || 0)}g proteïne · ${Math.round(dn.fat || 0)}g vet</p>
          ${mealsHtml}`;
                mealsList.appendChild(dayCard);
            });
            const dayCount = Object.keys(data.week).length || 1;
            totalCal = Math.round(totalCal / dayCount);
            totalProtein = Math.round(totalProtein / dayCount);
            totalFat = Math.round(totalFat / dayCount);
        }

        if (timeFrame === 'day' && meals.length) {
            const dayCard = document.createElement('div');
            dayCard.className = 'glass-panel p-5 rounded-2xl border-t border-white/5';
            let mealsHtml = '';
            meals.forEach((m) => {
                mealsHtml += `<div class="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
          <span class="material-symbols-outlined text-primary text-lg mt-0.5 shrink-0">restaurant</span>
          <div>
            <p class="text-white text-sm font-medium">${m.title}</p>
            <p class="text-gray-500 text-xs mt-1">~${Math.round(m.servings || 1)} portie(s) · Bereidingstijd: ${m.readyInMinutes || '?'} min</p>
          </div>
        </div>`;
            });
            dayCard.innerHTML = `<h4 class="font-display text-lg font-bold text-primary mb-3">Vandaag</h4>${mealsHtml}`;
            mealsList.appendChild(dayCard);
        }

        const calEl = document.getElementById('mp-total-cal');
        const protEl = document.getElementById('mp-total-protein');
        const fatEl = document.getElementById('mp-total-fat');
        if (calEl) calEl.textContent = totalCal;
        if (protEl) protEl.textContent = totalProtein + 'g';
        if (fatEl) fatEl.textContent = totalFat + 'g';

        const mealTitles =
            timeFrame === 'day' && meals.length ? meals.map((m) => m.title).join(', ') : 'Weekplan (zie website)';
        const waTemplate = `Hey Omar! Hier is mijn meal plan:\\n- Calorie doel: ${targetCals} kcal\\n- Maaltijden: ${mealTitles}\\n- Macro's (gem.): ${totalCal} kcal / ${totalProtein}g proteïne / ${totalFat}g vet\\n\\nKun je me helpen met een gepersonaliseerd plan?`;
        const mpWaBtn = document.getElementById('mp-whatsapp-btn');
        if (mpWaBtn) mpWaBtn.href = `https://wa.me/${PHONE}?text=${encodeURIComponent(waTemplate)}`;
    }

    // ─── 7. Essentials Toggle ────────────────────────────────────────────────────
    const essToggle = document.getElementById('essentials-toggle');
    const essContent = document.getElementById('essentials-content');
    const essChevron = document.getElementById('essentials-chevron');
    if (essToggle && essContent) {
        essToggle.addEventListener('click', () => {
            const isOpen = !essContent.classList.contains('hidden');
            if (isOpen) {
                essContent.classList.add('hidden');
                essToggle.setAttribute('aria-expanded', 'false');
                if (essChevron) essChevron.style.transform = 'rotate(0deg)';
            } else {
                essContent.classList.remove('hidden');
                essToggle.setAttribute('aria-expanded', 'true');
                if (essChevron) essChevron.style.transform = 'rotate(180deg)';
            }
        });
    }
})();
