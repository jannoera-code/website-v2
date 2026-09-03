document.addEventListener('DOMContentLoaded', () => {
    const API_ENDPOINT = 'http://localhost:3000/api/audit';
    let currentTargetUrl = '';

    const formCard = document.getElementById('audit-form-card');
    const loadingCard = document.getElementById('audit-loading-card');
    const resultsCard = document.getElementById('audit-results-card');
    const progressBar = document.getElementById('audit-progress-bar');
    const statusText = document.getElementById('loading-status-text');

    // Initial Form Submit
    const urlForm = document.getElementById('audit-url-form');
    if (urlForm) {
        urlForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            currentTargetUrl = document.getElementById('audit-url-input').value.trim();
            if (!currentTargetUrl) return;

            formCard.classList.add('hidden');
            loadingCard.classList.remove('hidden');

            animateProgress();

            try {
                const response = await fetch(API_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: currentTargetUrl }),
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Audit request failed');

                renderTeaserResults(data);
            } catch (err) {
                alert(`Error: ${err.message}`);
                loadingCard.classList.add('hidden');
                formCard.classList.remove('hidden');
            }
        });
    }

    // Email Unlock Submit
    const unlockForm = document.getElementById('audit-unlock-form');
    if (unlockForm) {
        unlockForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('audit-email-input').value.trim();
            if (!email) return;

            try {
                const response = await fetch(API_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: currentTargetUrl, userEmail: email }),
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Unlock failed');

                document.getElementById('gated-lock-box').classList.add('hidden');
                const fixesBox = document.getElementById('unlocked-fixes-box');
                const fixesList = document.getElementById('fixes-list');

                fixesList.innerHTML = (data.priorityFixes || [])
                    .map(f => `
            <div class="pt-3">
              <div class="font-bold text-cream text-xs font-sans">${f.title}</div>
              <div class="text-cream/60 text-xs mt-1 leading-relaxed">${f.description}</div>
            </div>`)
                    .join('');

                fixesBox.classList.remove('hidden');

                if (data.emailSent) {
                    document.getElementById('email-confirmation-msg').classList.remove('hidden');
                }
            } catch (err) {
                alert(`Error: ${err.message}`);
            }
        });
    }

    function animateProgress() {
        progressBar.style.width = '0%';
        setTimeout(() => { progressBar.style.width = '35%'; statusText.textContent = 'Analyzing layout & visual hierarchy...'; }, 1500);
        setTimeout(() => { progressBar.style.width = '70%'; statusText.textContent = 'Querying PageSpeed metrics...'; }, 3500);
        setTimeout(() => { progressBar.style.width = '90%'; statusText.textContent = 'Finalizing AI UX scores...'; }, 5500);
    }

    function renderTeaserResults(data) {
        loadingCard.classList.add('hidden');
        resultsCard.classList.remove('hidden');

        document.getElementById('audit-summary-text').textContent = data.summary || '';
        document.getElementById('audit-screenshot-img').src = data.screenshot || '';

        if (data.performanceMetrics) {
            document.getElementById('ps-perf').textContent = `${data.performanceMetrics.performanceScore}/100`;
            document.getElementById('ps-seo').textContent = `${data.performanceMetrics.seoScore}/100`;
            document.getElementById('ps-fcp').textContent = data.performanceMetrics.firstContentfulPaint;
            document.getElementById('ps-lcp').textContent = data.performanceMetrics.largestContentfulPaint;
        }

        // Animate overall score counter using anime.js
        const scoreObj = { val: 0 };
        if (typeof anime !== 'undefined') {
            anime({
                targets: scoreObj,
                val: data.overallScore || 0,
                round: 1,
                easing: 'easeOutExpo',
                duration: 2000,
                update: () => {
                    document.getElementById('overall-score-num').textContent = scoreObj.val;
                }
            });
        } else {
            document.getElementById('overall-score-num').textContent = data.overallScore || 0;
        }

        if (data.scores) {
            document.getElementById('score-visual').textContent = `${data.scores.visualDesign}/100`;
            document.getElementById('score-mobile').textContent = `${data.scores.mobileResponsiveness}/100`;
            document.getElementById('score-conversion').textContent = `${data.scores.conversionArchitecture}/100`;
            document.getElementById('score-trust').textContent = `${data.scores.brandTrust}/100`;
        }
    }
});