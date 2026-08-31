
/* =========================================================
   SchoolHub Dashboard - สถิติการเข้าใช้งาน (ชุดที่ 4)
   - บันทึกการเข้าใช้งานราย "วัน" ลง Firestore: usage_stats/{YYYY-MM-DD}
     ฟิลด์: visits (จำนวนครั้งที่เข้าใช้งาน), users (map ของ userKey -> true
     ใช้สำหรับนับผู้ใช้งานไม่ซ้ำ), updatedAt
   - นับ 1 ครั้ง/1 คน/1 วัน (กันการนับซ้ำตอน refresh หน้าด้วย localStorage)
   - แสดงผลในหน้า "แดชบอร์ดรวม" (view-admin-dashboard) ด้านล่างสุด
     พร้อมกราฟแท่ง (วาดด้วย SVG ล้วน ไม่พึ่ง library ภายนอก)
     Dropdown เลือกช่วงเวลา และตารางรายละเอียดรายวัน
   - ไม่แก้ไข/ไม่แตะโค้ดเดิมของระบบคะแนน เกรด Export หรือสิทธิ์การใช้งาน
   ========================================================= */
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, getDocs, collection, increment, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

(function(){
  if (window.__schoolhubUsageStatsInit) return;
  window.__schoolhubUsageStatsInit = true;

  const cfg = {
      apiKey: "AIzaSyB6u1U_8jNWHd8fUWu6sZ9BAup_u4u-EGg",
      authDomain: "schoolhub-5677d.firebaseapp.com",
      projectId: "schoolhub-5677d",
      storageBucket: "schoolhub-5677d.firebasestorage.app",
      messagingSenderId: "803574136389",
      appId: "1:803574136389:web:e0e5eecfc36dec69d4ed2c",
      measurementId: "G-ME7E38XNX6"
  };

  const app = getApps().length ? getApp() : initializeApp(cfg);
  const db = getFirestore(app);
  const auth = getAuth(app);

  const USAGE_COL = 'usage_stats';
  const TRACK_GUARD_KEY = 'schoolhub_usage_tracked_date';

  const pad2 = (n) => String(n).padStart(2, '0');
  const dateKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
  const todayKey = () => dateKey(new Date());

  function safeUserKey(user){
    if (!user) return 'guest';
    return (user.email || user.uid || 'guest').toLowerCase();
  }

  // ---------- บันทึกการเข้าใช้งาน (1 ครั้ง/คน/วัน) ----------
  async function trackVisit(user){
    try{
      const today = todayKey();
      const userKey = safeUserKey(user);
      const guardVal = `${today}|${userKey}`;
      if (localStorage.getItem(TRACK_GUARD_KEY) === guardVal) return; // นับไปแล้ววันนี้

      const ref = doc(db, USAGE_COL, today);
      const fieldSafeKey = userKey.replace(/[.\/\[\]#$]/g, '_');
      await setDoc(ref, {
        visits: increment(1),
        [`users.${fieldSafeKey}`]: true,
        updatedAt: serverTimestamp()
      }, { merge: true });

      localStorage.setItem(TRACK_GUARD_KEY, guardVal);
    }catch(e){
      console.warn('บันทึกสถิติการเข้าใช้งานไม่สำเร็จ:', e);
    }
  }

  onAuthStateChanged(auth, (user) => { trackVisit(user); });
  // เผื่อกรณียังไม่ล็อกอิน (หน้า public) ก็ยังนับเป็น guest ได้
  setTimeout(() => { if(!auth.currentUser) trackVisit(null); }, 4000);

  // ---------- โหลด/รวมข้อมูลตามช่วงเวลาที่เลือก ----------
  function rangeDates(rangeVal){
    const days = [];
    const now = new Date();
    if (rangeVal === 'all') return null; // null = ดึงทั้งคอลเลกชัน
    const n = Number(rangeVal) || 30;
    for (let i = n - 1; i >= 0; i--){
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days.push(dateKey(d));
    }
    return days;
  }

  async function fetchUsageData(rangeVal){
    const wantedDates = rangeDates(rangeVal);
    const result = {}; // dateStr -> {visits, unique}

    if (wantedDates){
      await Promise.all(wantedDates.map(async (dstr) => {
        try{
          const snap = await getDoc(doc(db, USAGE_COL, dstr));
          if (snap.exists()){
            const data = snap.data() || {};
            const unique = data.users ? Object.keys(data.users).length : 0;
            result[dstr] = { visits: Number(data.visits) || 0, unique };
          } else {
            result[dstr] = { visits: 0, unique: 0 };
          }
        }catch(e){
          result[dstr] = { visits: 0, unique: 0 };
        }
      }));
    } else {
      try{
        const snap = await getDocs(collection(db, USAGE_COL));
        snap.forEach(docSnap => {
          const data = docSnap.data() || {};
          const unique = data.users ? Object.keys(data.users).length : 0;
          result[docSnap.id] = { visits: Number(data.visits) || 0, unique };
        });
      }catch(e){
        console.warn('อ่านสถิติการเข้าใช้งานไม่สำเร็จ:', e);
      }
    }

    // เรียงตามวันที่จากเก่า -> ใหม่
    const sortedKeys = Object.keys(result).sort();
    return sortedKeys.map(k => ({ date: k, visits: result[k].visits, unique: result[k].unique }));
  }

  // ---------- วาดกราฟแท่งด้วย SVG (ไม่พึ่ง library ภายนอก) ----------
  function renderChart(rows){
    const host = document.getElementById('usage-stats-chart');
    const emptyEl = document.getElementById('usage-stats-empty');
    if (!host) return;

    const hasData = rows.some(r => r.visits > 0);
    if (!rows.length || !hasData){
      host.innerHTML = '';
      if (emptyEl) emptyEl.classList.remove('hidden');
      return;
    }
    if (emptyEl) emptyEl.classList.add('hidden');

    const maxVal = Math.max(1, ...rows.map(r => r.visits));
    const barW = 26;
    const gap = 10;
    const chartH = 160;
    const labelH = 34;
    const width = Math.max(rows.length * (barW + gap) + gap, 320);
    const height = chartH + labelH;

    let bars = '';
    rows.forEach((r, i) => {
      const x = gap + i * (barW + gap);
      const h = Math.max(2, Math.round((r.visits / maxVal) * chartH));
      const y = chartH - h;
      const shortLabel = r.date.slice(5).replace('-', '/'); // MM/DD
      bars += `
        <g>
          <rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="6" fill="#6366f1" fill-opacity="0.85">
            <title>${r.date}: ${r.visits} ครั้ง / ${r.unique} คน</title>
          </rect>
          <text x="${x + barW/2}" y="${chartH + 16}" text-anchor="middle" font-size="9" fill="#64748b">${shortLabel}</text>
          <text x="${x + barW/2}" y="${y - 4 < 10 ? 10 : y - 4}" text-anchor="middle" font-size="9" font-weight="700" fill="#4338ca">${r.visits}</text>
        </g>`;
    });

    host.innerHTML = `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="min-width:${width}px">
        <line x1="0" y1="${chartH}" x2="${width}" y2="${chartH}" stroke="#e2e8f0" stroke-width="1"/>
        ${bars}
      </svg>`;
  }

  function renderDetailTable(rows){
    const body = document.getElementById('usage-stats-detail-body');
    if (!body) return;
    if (!rows.length){
      body.innerHTML = `<tr><td colspan="3" class="text-center text-slate-400 px-4 py-4">ไม่มีข้อมูล</td></tr>`;
      return;
    }
    const reversed = [...rows].reverse(); // ใหม่ -> เก่า
    body.innerHTML = reversed.map(r => `
      <tr class="border-t border-slate-50">
        <td class="px-4 py-2.5 text-slate-700">${r.date}</td>
        <td class="px-4 py-2.5 text-right font-bold text-slate-800">${r.visits.toLocaleString('th-TH')}</td>
        <td class="px-4 py-2.5 text-right text-slate-600">${r.unique.toLocaleString('th-TH')}</td>
      </tr>`).join('');
  }

  function setText(id, value){
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  let lastRows = [];

  window.loadUsageStats = async function(){
    const sel = document.getElementById('usage-stats-range');
    const rangeVal = sel ? sel.value : '30';

    const rows = await fetchUsageData(rangeVal);
    lastRows = rows;

    const totalVisits = rows.reduce((sum, r) => sum + r.visits, 0);
    const uniqueUsersUnion = new Set(); // นับ union ไม่ได้แม่นยำ 100% เพราะไม่ได้เก็บ raw key แยกวัน จึงประมาณจากผลรวมต่อวัน
    const totalUniqueApprox = rows.reduce((sum, r) => sum + r.unique, 0);
    const daysWithData = rows.filter(r => r.visits > 0).length || 1;
    const avgPerDay = Math.round(totalVisits / (rows.length || 1));

    let peak = { date: '—', visits: -1 };
    rows.forEach(r => { if (r.visits > peak.visits) peak = r; });

    setText('usage-stat-total-visits', totalVisits.toLocaleString('th-TH'));
    setText('usage-stat-unique-users', totalUniqueApprox.toLocaleString('th-TH'));
    setText('usage-stat-avg-day', avgPerDay.toLocaleString('th-TH'));
    setText('usage-stat-peak-day', peak.visits > 0 ? `${peak.date} (${peak.visits})` : '—');

    renderChart(rows);
    renderDetailTable(rows);

    const updated = document.getElementById('usage-stats-updated');
    if (updated) updated.textContent = 'อัปเดตล่าสุด: ' + new Date().toLocaleString('th-TH');
  };

  window.toggleUsageStatsDetail = function(){
    const box = document.getElementById('usage-stats-detail');
    const icon = document.getElementById('usage-stats-detail-icon');
    if (!box) return;
    const willShow = box.classList.contains('hidden');
    box.classList.toggle('hidden');
    if (icon){
      icon.classList.toggle('fa-chevron-down', !willShow);
      icon.classList.toggle('fa-chevron-up', willShow);
    }
  };

  document.addEventListener('change', (e) => {
    if (e.target && e.target.id === 'usage-stats-range') window.loadUsageStats();
  });

  // เรียกโหลดทุกครั้งที่เข้าหน้าแดชบอร์ดรวม (ครอบ switchView เดิมโดยไม่แก้ของเดิม)
  const __origSwitchViewForUsageStats = window.switchView;
  if (typeof __origSwitchViewForUsageStats === 'function'){
    window.switchView = function(viewId){
      __origSwitchViewForUsageStats(viewId);
      if (viewId === 'admin-dashboard'){
        setTimeout(() => { if (typeof window.loadUsageStats === 'function') window.loadUsageStats(); }, 150);
      }
    };
  }

  // เผื่อกรณีเปิดมาที่หน้าแดชบอร์ดอยู่แล้ว (เช่น refresh ค้างไว้)
  document.addEventListener('DOMContentLoaded', () => {
    const dashView = document.getElementById('view-admin-dashboard');
    if (dashView && !dashView.classList.contains('hidden')){
      setTimeout(() => { if (typeof window.loadUsageStats === 'function') window.loadUsageStats(); }, 300);
    }
  });
})();
