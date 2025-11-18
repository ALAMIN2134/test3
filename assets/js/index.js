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

  // Summary update - tries API then falls back to mock
  const updateSummary = async () => {
    try {
      // Example: when backend available, call summary API for current session
      // const res = await fetch(`${BASE_API_URL}/summary?session_id=...`);
      // const json = await res.json();
      // For now use local mock: read from localStorage latest saved attendance for default batch/class
      const keyPrefix = 'attendance_';
      // find recent key in localStorage that starts with keyPrefix
      let latestKey = null;
      for (let i=0;i<localStorage.length;i++){
        const k = localStorage.key(i);
        if (k && k.startsWith(keyPrefix)) latestKey = k;
      }
      if (latestKey) {
        const raw = JSON.parse(localStorage.getItem(latestKey));
        const attendance = raw.attendance || {};
        const total = Object.keys(attendance).length || 30;
        const present = Object.values(attendance).filter(s => s === 'present').length;
        const absent = total - present;
        const percent = total > 0 ? ((present/total)*100).toFixed(1) : '0.0';
        setSummary(total, present, absent, `${percent}%`);
      } else {
        // Default mock
        setSummary(30, 0, 30, '0.0%');
      }
    } catch (e) {
      console.warn('Failed to update summary', e);
      setSummary(30,0,30,'0.0%');
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

  // Download PDF button (stub for now)
  const downloadBtn = document.getElementById('download-pdf-button');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // For now, simulate visual feedback. PDF generation (jsPDF) will be added later.
      const section = document.getElementById('download-report-section');
      if (section) {
        section.style.backgroundColor = '#ecfdf5';
        setTimeout(()=> section.style.backgroundColor = '#ffffff', 900);
      }
      console.log('PDF download requested (simulate). Implement jsPDF later.');
    });
  }

  updateSummary();
  // Poll summary every 8 seconds so front page updates after mark-attendance save
  setInterval(updateSummary, 8000);
});