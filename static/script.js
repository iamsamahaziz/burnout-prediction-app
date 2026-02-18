document.addEventListener('DOMContentLoaded', function () {
    initSliders();
    loadHistory();
    initThemeToggle();
    loadMoodCalendar();
});


function initSliders() {
    const stressSlider = document.getElementById('stress');
    const stressValue = document.getElementById('stress-value');
    if (stressSlider && stressValue) {
        stressSlider.addEventListener('input', function () {
            stressValue.textContent = this.value;
            updateSliderTrack(this);
        });
        updateSliderTrack(stressSlider);
    }

    const satSlider = document.getElementById('satisfaction');
    const satValue = document.getElementById('satisfaction-value');
    if (satSlider && satValue) {
        satSlider.addEventListener('input', function () {
            satValue.textContent = parseFloat(this.value).toFixed(1);
            updateSliderTrack(this);
        });
        updateSliderTrack(satSlider);
    }
}

function updateSliderTrack(slider) {
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    const val = parseFloat(slider.value);
    const pct = ((val - min) / (max - min)) * 100;
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const trackBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    slider.style.background = 'linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ' + pct + '%, ' + trackBg + ' ' + pct + '%, ' + trackBg + ' 100%)';
}


function animateGauge(targetValue) {
    var gaugeFill = document.querySelector('.gauge-fill');
    var gaugeNumber = document.getElementById('gauge-number');
    if (!gaugeFill || !gaugeNumber) return;

    var circumference = 2 * Math.PI * 85;
    var targetOffset = circumference - (circumference * targetValue / 100);

    requestAnimationFrame(function () {
        gaugeFill.style.strokeDashoffset = targetOffset;
    });

    var duration = 1500;
    var start = performance.now();
    function step(now) {
        var elapsed = now - start;
        var progress = Math.min(elapsed / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var current = Math.round(eased * targetValue * 10) / 10;
        gaugeNumber.textContent = current.toFixed(1) + '%';
        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            gaugeNumber.textContent = targetValue.toFixed(1) + '%';
        }
    }
    requestAnimationFrame(step);
}


function animateFactorBars() {
    var bars = document.querySelectorAll('.factor-bar-fill');
    bars.forEach(function (bar, i) {
        var value = parseInt(bar.getAttribute('data-value'));
        var color;
        if (value >= 70) color = 'linear-gradient(90deg, #dc2626, #ef4444)';
        else if (value >= 45) color = 'linear-gradient(90deg, #e67e22, #f59e0b)';
        else color = 'linear-gradient(90deg, #7c3aed, #a78bfa)';
        bar.style.background = color;
        setTimeout(function () {
            bar.style.width = value + '%';
        }, 200 + i * 150);
    });
}


function renderRadarChart(stress, hours, satisfaction, remote) {
    var ctx = document.getElementById('radarChart');
    if (!ctx) return;

    var isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    var gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    var labelColor = isDark ? '#94a3b8' : '#64748b';

    var stressNorm = (stress / 10) * 100;
    var hoursNorm = Math.min((hours / 80) * 100, 100);
    var satNorm = ((5 - satisfaction) / 4) * 100;
    var remoteNorm = ((100 - remote) / 100) * 100;

    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Stress', 'Hours', 'Satisfaction', 'Office'],
            datasets: [{
                label: 'Your Risk Profile',
                data: [stressNorm, hoursNorm, satNorm, remoteNorm],
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                borderColor: '#8b5cf6',
                borderWidth: 2,
                pointBackgroundColor: '#8b5cf6',
                pointBorderColor: '#fff',
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        display: false,
                        stepSize: 25
                    },
                    grid: {
                        color: gridColor
                    },
                    angleLines: {
                        color: gridColor
                    },
                    pointLabels: {
                        color: labelColor,
                        font: { size: 12, family: 'Inter', weight: '500' }
                    }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}


function renderTrendChart() {
    var ctx = document.getElementById('trendChart');
    if (!ctx) return;

    var history = JSON.parse(localStorage.getItem('burnout_history') || '[]');
    var isDark = document.documentElement.getAttribute('data-theme') !== 'light';

    if (history.length === 0) {
        ctx.parentNode.innerHTML = '<p style="text-align:center;color:' + (isDark ? '#64748b' : '#94a3b8') + ';padding:40px 0;">Complete more assessments to see your trend graph 📈</p>';
        return;
    }

    var data = history.slice().reverse();
    var labels = data.map(function (item) { return item.date; });
    var scores = data.map(function (item) { return item.score; });

    var gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 250);
    gradient.addColorStop(0, 'rgba(139, 92, 246, 0.3)');
    gradient.addColorStop(1, 'rgba(139, 92, 246, 0.01)');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Burnout Score',
                data: scores,
                borderColor: '#8b5cf6',
                backgroundColor: gradient,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#8b5cf6',
                pointBorderColor: isDark ? '#111827' : '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' },
                    ticks: {
                        color: isDark ? '#64748b' : '#94a3b8',
                        font: { family: 'Inter' },
                        callback: function (val) { return val + '%'; }
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        color: isDark ? '#64748b' : '#94a3b8',
                        font: { family: 'Inter', size: 10 },
                        maxRotation: 45
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    titleColor: isDark ? '#f1f5f9' : '#1e293b',
                    bodyColor: isDark ? '#94a3b8' : '#64748b',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    borderWidth: 1,
                    displayColors: false,
                    callbacks: {
                        label: function (context) { return 'Score: ' + context.parsed.y.toFixed(1) + '%'; }
                    }
                }
            }
        }
    });
}


function saveToHistory(role, score, riskClass) {
    var history = JSON.parse(localStorage.getItem('burnout_history') || '[]');
    var entry = {
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        role: role,
        score: score,
        riskClass: riskClass
    };
    history.unshift(entry);
    if (history.length > 20) history.length = 20;
    localStorage.setItem('burnout_history', JSON.stringify(history));
    loadHistory();
}

function loadHistory() {
    var historySection = document.getElementById('history-section');
    var historyList = document.getElementById('history-list');
    if (!historySection || !historyList) return;

    var history = JSON.parse(localStorage.getItem('burnout_history') || '[]');

    if (history.length === 0) {
        historySection.style.display = 'none';
        return;
    }

    historySection.style.display = 'block';

    historyList.innerHTML = history.map(function (item) {
        var colorMap = {
            'result-low': '#10b981',
            'result-moderate': '#f59e0b',
            'result-high': '#ef4444',
            'result-critical': '#dc2626'
        };
        var color = colorMap[item.riskClass] || '#94a3b8';
        return '<div class="history-item">' +
            '<span class="hi-date">' + item.date + '</span>' +
            '<span class="hi-role">' + item.role + '</span>' +
            '<span class="hi-score" style="color:' + color + '">' + item.score.toFixed(1) + '%</span>' +
            '</div>';
    }).join('');

    var clearBtn = document.getElementById('btn-clear-history');
    if (clearBtn) {
        clearBtn.onclick = function () {
            localStorage.removeItem('burnout_history');
            loadHistory();
        };
    }
}


function initShareButtons(score, resultText) {
    var baseUrl = window.location.origin;
    var shareText = "I just assessed my burnout risk: " + score.toFixed(1) + "% - " + resultText + " 🔥 Check yours at " + baseUrl;

    var btnLink = document.getElementById('btn-share-link');
    if (btnLink) {
        btnLink.onclick = function () {
            navigator.clipboard.writeText(baseUrl).then(function () {
                var toast = document.getElementById('share-toast');
                if (toast) {
                    toast.classList.add('show');
                    setTimeout(function () { toast.classList.remove('show'); }, 2000);
                }
            });
        };
    }

    var btnLinkedin = document.getElementById('btn-share-linkedin');
    if (btnLinkedin) {
        btnLinkedin.onclick = function () {
            var url = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(baseUrl) +
                '&summary=' + encodeURIComponent(shareText);
            window.open(url, '_blank', 'width=600,height=500');
        };
    }

    var btnTwitter = document.getElementById('btn-share-twitter');
    if (btnTwitter) {
        btnTwitter.onclick = function () {
            var url = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(shareText);
            window.open(url, '_blank', 'width=600,height=400');
        };
    }

    var btnPdf = document.getElementById('btn-download-pdf');
    if (btnPdf) {
        btnPdf.onclick = function () {
            generatePDF(score, resultText);
        };
    }
}


function generatePDF(score, resultText) {
    var factors = [];
    document.querySelectorAll('.factor-row').forEach(function (row) {
        factors.push({
            name: row.querySelector('.factor-name').textContent,
            val: row.querySelector('.factor-val').textContent,
            tip: row.querySelector('.factor-tip').textContent
        });
    });

    var recs = [];
    document.querySelectorAll('.rec-item span:last-child').forEach(function (el) {
        recs.push(el.textContent);
    });

    var weeks = [];
    document.querySelectorAll('.plan-week').forEach(function (week) {
        var title = week.querySelector('.plan-week-title').textContent;
        var tasks = [];
        week.querySelectorAll('.plan-task label').forEach(function (t) {
            tasks.push(t.textContent);
        });
        weeks.push({ title: title, tasks: tasks });
    });

    var dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
        '<title>Burnout Assessment Report</title>' +
        '<style>' +
        'body { font-family: Arial, Helvetica, sans-serif; color: #1e293b; padding: 40px; line-height: 1.6; }' +
        '.header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; padding: 30px 40px; border-radius: 12px; margin-bottom: 30px; }' +
        '.header h1 { margin: 0 0 8px 0; font-size: 24px; }' +
        '.header p { margin: 0; opacity: 0.9; font-size: 13px; }' +
        '.score-section { text-align: center; margin: 30px 0; padding: 20px; border: 2px solid #e2e8f0; border-radius: 12px; }' +
        '.score-num { font-size: 56px; font-weight: 800; color: #8b5cf6; margin: 0; }' +
        '.score-label { font-size: 16px; color: #64748b; margin: 8px 0 0 0; }' +
        'h2 { font-size: 16px; text-transform: uppercase; letter-spacing: 1px; color: #8b5cf6; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 30px; }' +
        '.factor { margin: 12px 0; }' +
        '.factor-head { font-weight: 700; font-size: 14px; }' +
        '.factor-bar { height: 8px; background: #e2e8f0; border-radius: 4px; margin: 4px 0; }' +
        '.factor-fill { height: 8px; background: #8b5cf6; border-radius: 4px; }' +
        '.factor-tip { font-size: 12px; color: #94a3b8; font-style: italic; }' +
        '.rec { padding: 8px 0; font-size: 13px; border-bottom: 1px solid #f1f5f9; }' +
        '.week { margin: 16px 0; }' +
        '.week-title { font-weight: 700; font-size: 14px; color: #6366f1; margin-bottom: 6px; }' +
        '.task { font-size: 13px; padding: 3px 0; color: #475569; }' +
        '.footer { text-align: center; margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; }' +
        '@media print { body { padding: 20px; } .header { break-inside: avoid; } }' +
        '</style></head><body>' +
        '<div class="header"><h1>Burnout Risk Assessment Report</h1><p>Generated on ' + dateStr + '</p></div>' +
        '<div class="score-section"><p class="score-num">' + score.toFixed(1) + '%</p>' +
        '<p class="score-label">' + resultText.replace(/[^\x20-\x7E]/g, '') + '</p></div>';

    html += '<h2>Risk Factor Breakdown</h2>';
    factors.forEach(function (f) {
        var val = parseInt(f.val);
        html += '<div class="factor"><div class="factor-head">' + f.name + ' - ' + f.val +
            '</div><div class="factor-bar"><div class="factor-fill" style="width:' + val + '%"></div></div>' +
            '<div class="factor-tip">' + f.tip + '</div></div>';
    });

    html += '<h2>Recommendations</h2>';
    recs.forEach(function (r) {
        html += '<div class="rec">' + r + '</div>';
    });

    html += '<h2>30-Day Wellness Plan</h2>';
    weeks.forEach(function (w, i) {
        html += '<div class="week"><div class="week-title">Week ' + (i + 1) + ' - ' + w.title + '</div>';
        w.tasks.forEach(function (t) {
            html += '<div class="task">&#9744; ' + t + '</div>';
        });
        html += '</div>';
    });

    html += '<div class="footer">Burnout Prediction App - Built by Samah AZIZ</div>';
    html += '</body></html>';

    var printWin = window.open('', '_blank', 'width=800,height=900');
    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    setTimeout(function () {
        printWin.print();
    }, 300);
}


function initThemeToggle() {
    var toggle = document.getElementById('theme-toggle');
    var icon = document.getElementById('theme-icon');
    if (!toggle || !icon) return;

    var saved = localStorage.getItem('burnout_theme');
    if (saved === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        icon.textContent = '🌙';
    }

    toggle.onclick = function () {
        var current = document.documentElement.getAttribute('data-theme');
        if (current === 'light') {
            document.documentElement.setAttribute('data-theme', 'dark');
            icon.textContent = '☀️';
            localStorage.setItem('burnout_theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            icon.textContent = '🌙';
            localStorage.setItem('burnout_theme', 'light');
        }
        var sliders = document.querySelectorAll('input[type="range"]');
        sliders.forEach(function (s) { updateSliderTrack(s); });
    };
}


var breathingActive = false;
var breathingTimeout = null;
var breathingCycles = 0;

function toggleBreathing() {
    if (breathingActive) {
        stopBreathing();
    } else {
        startBreathing();
    }
}

function startBreathing() {
    breathingActive = true;
    breathingCycles = 0;
    var btn = document.getElementById('btn-breathing');
    if (btn) btn.innerHTML = '⏸️ Pause';
    runBreathingCycle();
}

function stopBreathing() {
    breathingActive = false;
    if (breathingTimeout) clearTimeout(breathingTimeout);
    var circle = document.getElementById('breathing-circle');
    var text = document.getElementById('breathing-text');
    var timer = document.getElementById('breathing-timer');
    var btn = document.getElementById('btn-breathing');
    if (circle) { circle.className = 'breathing-circle'; }
    if (text) text.textContent = 'Start';
    if (timer) timer.textContent = '';
    if (btn) btn.innerHTML = '▶️ Begin Session';
}

function runBreathingCycle() {
    if (!breathingActive) return;
    breathingCycles++;
    updateCycleCounter();
    breathePhase('Breathe In...', 'inhale', 4, function () {
        breathePhase('Hold...', 'hold', 7, function () {
            breathePhase('Breathe Out...', 'exhale', 8, function () {
                if (breathingActive && breathingCycles < 4) {
                    runBreathingCycle();
                } else {
                    var text = document.getElementById('breathing-text');
                    if (text) text.textContent = 'Well Done! 🌟';
                    setTimeout(function () { stopBreathing(); }, 2000);
                }
            });
        });
    });
}

function breathePhase(label, phaseClass, seconds, callback) {
    var circle = document.getElementById('breathing-circle');
    var text = document.getElementById('breathing-text');
    var timer = document.getElementById('breathing-timer');
    if (circle) { circle.className = 'breathing-circle ' + phaseClass; }
    if (text) text.textContent = label;

    var remaining = seconds;
    function tick() {
        if (!breathingActive) return;
        if (timer) timer.textContent = remaining + 's';
        if (remaining <= 0) {
            callback();
            return;
        }
        remaining--;
        breathingTimeout = setTimeout(tick, 1000);
    }
    tick();
}

function updateCycleCounter() {
    var el = document.getElementById('breathing-cycles');
    if (el) el.textContent = 'Cycle ' + breathingCycles + ' / 4';
}


var selectedMood = null;

function selectMood(btn) {
    document.querySelectorAll('.mood-btn').forEach(function (b) {
        b.classList.remove('mood-selected');
    });
    btn.classList.add('mood-selected');
    selectedMood = {
        mood: parseInt(btn.getAttribute('data-mood')),
        emoji: btn.getAttribute('data-emoji')
    };
    var saveBtn = document.getElementById('btn-mood-save');
    if (saveBtn) saveBtn.disabled = false;
}

function saveMood() {
    if (!selectedMood) return;
    var note = document.getElementById('mood-note');
    var payload = {
        mood: selectedMood.mood,
        emoji: selectedMood.emoji,
        note: note ? note.value : ''
    };

    fetch('/api/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
        .then(function (r) { return r.json(); })
        .then(function () {
            document.querySelectorAll('.mood-btn').forEach(function (b) {
                b.classList.remove('mood-selected');
            });
            selectedMood = null;
            if (note) note.value = '';
            var saveBtn = document.getElementById('btn-mood-save');
            if (saveBtn) saveBtn.disabled = true;

            var saveBtn2 = document.getElementById('btn-mood-save');
            if (saveBtn2) {
                saveBtn2.textContent = '✅ Saved!';
                setTimeout(function () { saveBtn2.textContent = 'Save'; }, 1500);
            }

            loadMoodCalendar();
        });
}

function loadMoodCalendar() {
    var calEl = document.getElementById('mood-calendar');
    var streakEl = document.getElementById('mood-streak');
    if (!calEl) return;

    fetch('/api/mood')
        .then(function (r) { return r.json(); })
        .then(function (moods) {
            if (moods.length === 0) {
                calEl.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:16px;">No mood entries yet. Start tracking today!</p>';
                if (streakEl) streakEl.textContent = '';
                return;
            }

            var today = new Date();
            var moodMap = {};
            moods.forEach(function (m) { moodMap[m.date] = m; });

            var html = '<div class="mood-grid">';
            for (var i = 29; i >= 0; i--) {
                var d = new Date(today);
                d.setDate(d.getDate() - i);
                var key = d.toISOString().split('T')[0];
                var entry = moodMap[key];
                var dayLabel = d.getDate();
                if (entry) {
                    var colors = ['', '#ef4444', '#f59e0b', '#94a3b8', '#10b981', '#8b5cf6'];
                    var color = colors[entry.mood] || '#94a3b8';
                    html += '<div class="mood-day has-mood" style="background:' + color + '" title="' + key + ': ' + entry.emoji + (entry.note ? ' - ' + entry.note : '') + '">' +
                        '<span class="mood-day-num">' + dayLabel + '</span>' +
                        '<span class="mood-day-emoji">' + entry.emoji + '</span></div>';
                } else {
                    html += '<div class="mood-day"><span class="mood-day-num">' + dayLabel + '</span></div>';
                }
            }
            html += '</div>';
            calEl.innerHTML = html;

            var streak = 0;
            for (var j = 0; j < 30; j++) {
                var sd = new Date(today);
                sd.setDate(sd.getDate() - j);
                var sk = sd.toISOString().split('T')[0];
                if (moodMap[sk]) streak++;
                else break;
            }
            if (streakEl && streak > 0) {
                streakEl.innerHTML = '🔥 <strong>' + streak + ' day' + (streak > 1 ? 's' : '') + '</strong> tracking streak!';
            }
        })
        .catch(function () {
            calEl.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:16px;">Mood tracking available when running the server</p>';
        });
}
