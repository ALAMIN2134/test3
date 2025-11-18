// mark-attendance.js
// Features implemented:
// - API-ready fetch stubs (BASE_API_URL variable)
// - LocalStorage persistence (attendance_{batch}_{class}_{YYYY-MM-DD})
// - Accessibility: tiles are focusable, role="button", aria-pressed, keyboard toggle (Enter/Space)
// - Save -> POST to /api/attendance/save (fallback: localStorage) and shows modal with focus management
// - Reset clears local state and localStorage

const BASE_API_URL = '/api'; // change to '/attendance/api' or your php path when backend ready

document.addEventListener('DOMContentLoaded', () => {
  if (typeof lucide !== 'undefined') lucide.createIcons();

  // Params (from URL or defaults)
  const urlParams = new URLSearchParams(window.location.search);
  const classCode = urlParams.get('class') || 'CSE210';
  const className = urlParams.get('name') || 'Data Structure';
  const batchId = urlParams.get('batch') || '1';
  const batchKey = `batch_${batchId}_${classCode}`;
  const todayKeySuffix = (new Date()).toDateString(); // human readable date
  const STORAGE_KEY = `attendance_${batchKey}_${todayKeySuffix}`;

  document.getElementById('class-header').textContent = `${classCode} • ${className}`;

  // State
  const totalStudents = 30;
  let attendanceStatus = {}; // key: studentId (string) -> 'present'|'pending'

  // Utility: generate dummy students
  const generateDummyStudents = (count) => {
    const arr = [];
    for (let i = 1; i <= count; i++) {
      arr.push({ id: i, student_code: i.toString().padStart(2, '0'), name: `Student ${i}` });
    }
    return arr;
  };

  // Load from localStorage if available
  const loadFromStorage = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.attendance) {
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse storage', e);
    }
    return null;
  };

  const saveToStorage = (sessionInfo = null) => {
    try {
      const payload = {
        batch: batchId,
        classCode,
        timestamp: new Date().toISOString(),
        attendance: attendanceStatus,
        session: sessionInfo
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to save to storage', e);
    }
  };

  // Initialize attendance
  const initializeAttendance = (count) => {
    attendanceStatus = {};
    for (let i = 1; i <= count; i++) attendanceStatus[i] = 'pending';
  };

  // Fetch students + session + existing attendance (try API, else fallback)
  const fetchInitialData = async () => {
    let students = [];
    let session = null;
    let saved = loadFromStorage();

    try {
      // Attempt API calls (expect backend later)
      // const sRes = await fetch(`${BASE_API_URL}/session/current?batch_id=${batchId}`);
      // session = await sRes.json();
      // const stRes = await fetch(`${BASE_API_URL}/students?batch_id=${batchId}`);
      // students = await stRes.json();
      // const aRes = await fetch(`${BASE_API_URL}/attendance?session_id=${session.id}`);
      // const attendanceFromApi = await aRes.json();

      // For now use mock
      session = {
        id: 1,
        batch_id: batchId,
        subject: className,
        teacher: 'Ms. Rahman',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // +1 hour
        room: 'L-201'
      };
      students = generateDummyStudents(totalStudents);

      // If saved in localStorage, restore that
      if (saved) {
        attendanceStatus = saved.attendance;
      } else {
        initializeAttendance(totalStudents);
      }

    } catch (e) {
      console.warn('API fetch failed, using mock data', e);
      students = generateDummyStudents(totalStudents);
      if (saved) attendanceStatus = saved.attendance;
      else initializeAttendance(totalStudents);
    }

    renderStudentTiles(students);
    updateStats();
  };

  // Update stats area
  const updateStats = () => {
    const presentCount = Object.values(attendanceStatus).filter(s => s === 'present').length;
    const absentCount = totalStudents - presentCount;
    const percent = totalStudents > 0 ? ((presentCount / totalStudents) * 100).toFixed(1) : '0.0';
    const presentEl = document.getElementById('present-count');
    const absentEl = document.getElementById('absent-count');
    const totalEl = document.getElementById('total-count');
    const percentEl = document.getElementById('attendance-percent');
    if (presentEl) presentEl.textContent = presentCount;
    if (absentEl) absentEl.textContent = absentCount;
    if (totalEl) totalEl.textContent = totalStudents;
    if (percentEl) percentEl.textContent = `${percent}%`;
  };

  // Toggle attendance and persist to storage
  const toggleAttendance = (tile, studentId) => {
    const key = String(studentId);
    const prev = attendanceStatus[key];
    if (prev === 'pending') {
      attendanceStatus[key] = 'present';
      tile.classList.remove('attendance-tile-pending');
      tile.classList.add('attendance-tile-present');
      tile.setAttribute('aria-pressed', 'true');
      tile.setAttribute('aria-label', `Student ${tile.textContent} present`);
    } else {
      attendanceStatus[key] = 'pending';
      tile.classList.remove('attendance-tile-present');
      tile.classList.add('attendance-tile-pending');
      tile.setAttribute('aria-pressed', 'false');
      tile.setAttribute('aria-label', `Student ${tile.textContent} not marked`);
    }
    saveToStorage();
    updateStats();
  };

  // Render student tiles (accessible)
  const renderStudentTiles = (students) => {
    const grid = document.getElementById('student-grid');
    grid.innerHTML = '';
    for (let s of students) {
      const id = s.id;
      const status = attendanceStatus[id] === 'present' ? 'attendance-tile-present' : 'attendance-tile-pending';
      const tile = document.createElement('div');
      tile.id = `student-tile-${id}`;
      tile.classList.add('attendance-tile', status);
      tile.textContent = String(s.student_code).padStart(2, '0');
      tile.dataset.studentId = id;

      // Accessibility
      tile.setAttribute('role', 'button');
      tile.setAttribute('tabindex', '0');
      tile.setAttribute('aria-pressed', attendanceStatus[id] === 'present' ? 'true' : 'false');
      tile.setAttribute('aria-label', `Student ${tile.textContent} ${attendanceStatus[id] === 'present' ? 'present' : 'not marked'}`);

      // Click handler
      tile.addEventListener('click', () => toggleAttendance(tile, id));
      // Keyboard support
      tile.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          tile.click();
        }
      });

      grid.appendChild(tile);
    }
  };

  // Reset handler
  document.getElementById('reset-button').addEventListener('click', () => {
    if (!confirm('Reset session locally? This will clear your local marks.')) return;
    initializeAttendance(totalStudents);
    saveToStorage();
    // Re-render using dummy students
    renderStudentTiles(generateDummyStudents(totalStudents));
    updateStats();
  });

  // Save handler
  document.getElementById('save-button').addEventListener('click', async () => {
    // prepare payload
    const attendanceArray = Object.keys(attendanceStatus).map(k => ({ student_id: Number(k), status: attendanceStatus[k] }));
    const payload = {
      session_id: 1, // will be real session id when backend integrated
      marked_by: null,
      attendance: attendanceArray
    };

    try {
      // Try POST to backend API (if available)
      const res = await fetch(`${BASE_API_URL}/attendance/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('API save failed');
      const json = await res.json();
      if (json && json.success) {
        saveToStorage(payload.session_id);
        showSuccessModal();
      } else {
        // fallback: treat as success locally
        console.warn('API returned non-success, saving locally');
        saveToStorage();
        showSuccessModal();
      }
    } catch (e) {
      // If backend not available, persist locally and show modal
      console.warn('Save API unavailable, saving locally only', e);
      saveToStorage();
      showSuccessModal();
    }
  });

  // Modal management
  const modal = document.getElementById('success-modal');
  const modalCloseBtn = document.getElementById('modal-close-button');
  const showSuccessModal = () => {
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    // focus on close button
    modalCloseBtn.focus();
    // trap focus simple approach
    document.addEventListener('keydown', modalEscHandler);
  };
  const hideSuccessModal = () => {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.removeEventListener('keydown', modalEscHandler);
  };
  const modalEscHandler = (e) => {
    if (e.key === 'Escape') hideSuccessModal();
  };
  modalCloseBtn.addEventListener('click', () => {
    hideSuccessModal();
    // navigate back to dashboard quickly
    setTimeout(() => { window.location.href = 'index.html'; }, 200);
  });

  // initial load
  fetchInitialData();
});