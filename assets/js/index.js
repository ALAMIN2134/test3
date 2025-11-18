// index.js - front page interactions (API-ready, mock fallback)
// Base API URL (change when backend available)
const BASE_API_URL = '/api';

document.addEventListener('DOMContentLoaded', () => {
  if (typeof lucide !== 'undefined') lucide.createIcons();

  // Mobile menu toggle
  const mobileBtn = document.getElementById('mobile-menu-button');
  if (mobileBtn) {
    mobileBtn.addEventListener('click', () => {
      const menu = document.getElementById('mobile-menu');
      if (menu) menu.classList.toggle('hidden');
    });
  }

  // Date/time update
  const updateDateTime = () => {
    const now = new Date();
    const dateFormatter = new Intl.DateTimeFormat('en-US', { year:'numeric', month:'long', day:'numeric' });
    const dayFormatter = new Intl.DateTimeFormat('en-US', { weekday:'long' });
    const timeFormatter = new Intl.DateTimeFormat('en-US', { hour:'numeric', minute:'numeric', second:'numeric', hour12:true });
    const dateEl = document.getElementById('current-date');
    const dayEl = document.getElementById('current-day');
    const timeEl = document.getElementById('current-time');
    if (dateEl) dateEl.textContent = dateFormatter.format(now);
    if (dayEl) dayEl.textContent = dayFormatter.format(now);
    if (timeEl) timeEl.textContent = timeFormatter.format(now);
  };
  updateDateTime();
  setInterval(updateDateTime, 1000);

  // Summary update - tries API then falls back to mock/localStorage
  const updateSummary = async () => {
    try {
      // Try to find latest saved attendance in localStorage
      const latest = findLatestAttendanceData();
      if (latest) {
        const attendance = latest.attendance || {};
        const total = Object.keys(attendance).length || 30;
        const present = Object.values(attendance).filter(s => s === 'present').length;
        const absent = total - present;
        const percent = total > 0 ? ((present/total)*100).toFixed(1) : '0.0';
        setSummary(total, present, absent, `${percent}%`);
        renderHomeAttendancePreview(attendance, total);
      } else {
        // Default mock
        setSummary(30, 0, 30, '0.0%');
        renderHomeAttendancePreview(null, 30);
      }
    } catch (e) {
      console.warn('Failed to update summary', e);
      setSummary(30,0,30,'0.0%');
      renderHomeAttendancePreview(null, 30);
    }
  };

  const setSummary = (total, present, absent, percentText) => {
    const ts = document.getElementById('total-students');
    const ps = document.getElementById('attended-students');
    const abs = document.getElementById('absent-students');
    const per = document.getElementById('attendance-percentage');
    if (ts) ts.textContent = total;
    if (ps) ps.textContent = present;
    if (abs) abs.textContent = absent;
    if (per) per.textContent = percentText;
  };

  // Find latest attendance data in localStorage (by timestamp inside stored JSON)
  const findLatestAttendanceData = () => {
    const prefix = 'attendance_';
    let latest = null;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(prefix)) continue;
      try {
        const raw = localStorage.getItem(key);
        const parsed = JSON.parse(raw);
        if (!parsed) continue;
        const ts = parsed.timestamp ? new Date(parsed.timestamp).getTime() : 0;
        if (!latest || ts > latest._ts) {
          parsed._key = key;
          parsed._ts = ts;
          latest = parsed;
        }
      } catch (e) { continue; }
    }
    return latest;
  };

  // Render read-only attendance tiles on home page
  const renderHomeAttendancePreview = (attendanceObj, totalCount) => {
    const grid = document.getElementById('home-attendance-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const count = totalCount || 30;
    // If attendanceObj exists, use its keys; else generate numbers 1..count
    const ids = attendanceObj ? Object.keys(attendanceObj).map(k => parseInt(k,10)).sort((a,b)=>a-b) : Array.from({length:count}, (_,i)=>i+1);
    // Ensure we have at least 'count' ids
    if (ids.length < count) {
      for (let i = ids.length+1; i <= count; i++) ids.push(i);
    }
    for (let id of ids.slice(0, count)) {
      const status = attendanceObj && attendanceObj[id] ? attendanceObj[id] : 'pending';
      const tile = document.createElement('div');
      tile.classList.add('attendance-tile', status === 'present' ? 'attendance-tile-present' : 'attendance-tile-pending', 'attendance-tile-readonly');
      tile.textContent = String(id).padStart(2,'0');
      tile.setAttribute('aria-label', `Student ${String(id).padStart(2,'0')} ${status}`);
      grid.appendChild(tile);
    }
  };

  // Listen to storage events (when mark-attendance page saves in other tab/window)
  window.addEventListener('storage', (e) => {
    if (!e.key) return;
    if (e.key.startsWith('attendance_')) {
      // Update immediately
      updateSummary();
    }
  });

  // Poll as fallback in case storage events are not fired across contexts
  updateSummary();
  setInterval(updateSummary, 5000);

  // Download PDF button (stub for now)
  const downloadBtn = document.getElementById('download-pdf-button');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const section = document.getElementById('download-report-section');
      if (section) {
        section.style.backgroundColor = '#ecfdf5';
        setTimeout(()=> section.style.backgroundColor = '#ffffff', 900);
      }
      console.log('PDF download requested (simulate). Implement jsPDF later.');
    });
  }

});