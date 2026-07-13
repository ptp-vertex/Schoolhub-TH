/* ================================================================
   SchoolHub — Share History System (นักเรียน) V4
   130_schoolhub-share-history.js

   การแก้ไข V4:
   1. ดึงข้อมูลจาก Firebase โดย Query ตาม course.id (เพื่อให้ผ่าน Permission)
   2. แสดงปุ่มสร้าง Index หาก Firestore แจ้งว่าต้องใช้
   3. ปรับปรุง UI การแสดงผลข้อมูลจาก Firebase ให้สมบูรณ์
   ================================================================ */

(function(){
'use strict';

// ── Constants ────────────────────────────────────────────────────
var SHARE_HISTORY_Z = 2147483500;

// ── Helpers ──────────────────────────────────────────────────────
function eid(id){ return document.getElementById(id); }

function getCid(){
  if(typeof window.currentActiveCourseId !== 'undefined' && window.currentActiveCourseId) return window.currentActiveCourseId;
  var modal = document.getElementById('share-student-modal');
  return String(modal?.dataset?.courseId || '').trim() || null;
}

function getState(){ return window.state || {}; }

function esc(v){
  return String(v||'').replace(/[&<>"']/g,function(m){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];
  });
}

function alert2(title,msg){
  if(typeof window.showCustomAlert === 'function') window.showCustomAlert(title,msg,true);
  else alert(title + ': ' + msg);
}

function confirm2(title,msg,cb){
  if(typeof window.showCustomConfirm === 'function') window.showCustomConfirm(title,msg,cb);
  else { if(confirm(title + '\n' + msg)) cb(); }
}

// Firebase helpers (exposed by 007.js)
function getFirebaseHelpers(){
  return {
    db: window.__shDB || null,
    doc: window.__shDoc || null,
    getDoc: window.__shGetDoc || null,
    getDocs: window.__shGetDocs || null,
    collection: window.__shCollection || null,
    query: window.__shQuery || null,
    where: window.__shWhere || null,
    orderBy: window.__shOrderBy || null,
    deleteDoc: typeof window.deleteDoc === 'function' ? window.deleteDoc : null,
    setDoc: typeof window.setDoc === 'function' ? window.setDoc : null
  };
}

// ── Fetch share links from Firebase ──────────────────────────────
var _allShareTokens = null;

async function fetchShareTokensFromFirebase(cid){
  var fh = getFirebaseHelpers();
  if(!fh.db || !fh.collection || !fh.getDocs || !fh.query || !fh.where){
    console.warn('130.js: Firebase helpers not ready');
    return [];
  }
  try {
    var col = fh.collection(fh.db, 'shared_student_views');
    // Query by course.id to bypass "read all" restriction
    var q = fh.query(
      col, 
      fh.where('course.id', '==', String(cid)),
      fh.orderBy('createdAt', 'desc')
    );
    
    var snap = await fh.getDocs(q);
    var docs = [];
    snap.forEach(function(d){
      var data = d.data();
      docs.push({
        token: d.id,
        id: d.id,
        data: data,
        createdAt: data.createdAt || 0,
        studentName: data.student?.name || data.student?.fullName || '-',
        studentCode: data.student?.code || data.student?.studentCode || '',
        courseCode: data.course?.code || '',
        courseName: data.course?.name || '',
        expireMinutes: data.expireMinutes || 1,
        note: data.note || '',
        firstViewedAt: data.firstViewedAt || null,
        expiresAt: data.expiresAt || null,
        teacherName: data.teacherName || 'ครูผู้สอน',
        isActive: true
      });
    });
    return docs;
  } catch(e){
    console.error('130.js: Failed to fetch share tokens:', e);
    
    // Handle Missing Index Error
    if(e.message && e.message.indexOf('index') !== -1 && e.message.indexOf('https://') !== -1){
      var url = e.message.match(/https:\/\/console\.firebase\.google\.com[^\s]*/);
      if(url){
        return { error: 'INDEX_REQUIRED', url: url[0] };
      }
    }
    
    // Fallback to simple query without orderBy if index is missing
    try {
        var col2 = fh.collection(fh.db, 'shared_student_views');
        var q2 = fh.query(col2, fh.where('course.id', '==', String(cid)));
        var snap2 = await fh.getDocs(q2);
        var docs2 = [];
        snap2.forEach(function(d){
            var data = d.data();
            docs2.push({
                token: d.id, id: d.id, data: data,
                createdAt: data.createdAt || 0,
                studentName: data.student?.name || '-',
                studentCode: data.student?.code || '',
                courseCode: data.course?.code || '',
                courseName: data.course?.name || '',
                expireMinutes: data.expireMinutes || 1,
                note: data.note || '',
                isActive: true
            });
        });
        return docs2;
    } catch(e2){
        return [];
    }
  }
}

// ── Open Share History Popup ─────────────────────────────────────
window.openShareHistory = async function(){
  var cid = getCid();
  if(!cid){ alert2('กรุณาเลือกรายวิชา','กรุณาเปิดรายวิชาก่อนใช้งาน'); return; }

  var popup = eid('share-history-popup');
  if(!popup) { alert2('ไม่พบ popup','ระบบยังไม่โหลดสมบูรณ์ กรุณารีเฟรชหน้า'); return; }

  // BRING TO FRONT
  document.body.appendChild(popup);
  popup.style.position = 'fixed';
  popup.style.inset = '0';
  popup.style.zIndex = String(SHARE_HISTORY_Z);

  popup.classList.remove('hidden');
  popup.classList.remove('share-history-popup-closing');

  // Render with Firebase data
  await renderShareHistoryWithFirebase(cid);
};

window.closeShareHistory = function(){
  var popup = eid('share-history-popup');
  if(popup) popup.classList.add('hidden');
};

// ── Render Share History from Firebase ───────────────────────────
async function renderShareHistoryWithFirebase(cid){
  var container = eid('share-history-list');
  if(!container) return;

  container.innerHTML = '<div style="text-align:center;padding:40px 20px">'
    + '<i class="fas fa-circle-notch fa-spin" style="font-size:24px;color:#a5b4fc"></i>'
    + '<div style="font-size:13px;color:#94a3b8;margin-top:8px">กำลังโหลดข้อมูลจาก Firebase...</div>'
    + '</div>';

  var records = await fetchShareTokensFromFirebase(cid);

  // Check for Index Error
  if(records && records.error === 'INDEX_REQUIRED'){
    container.innerHTML = '<div style="text-align:center;padding:30px 20px;background:#fff7ed;border:1px solid #ffedd5;border-radius:20px">'
      + '<i class="fas fa-triangle-exclamation" style="font-size:32px;color:#f97316;margin-bottom:12px"></i>'
      + '<div style="font-weight:800;color:#9a3412;margin-bottom:8px">ต้องสร้างดัชนี (Firestore Index)</div>'
      + '<div style="font-size:12px;color:#c2410c;line-height:1.5;margin-bottom:15px">เพื่อให้ค้นหาข้อมูลประวัติได้ถูกต้อง คุณต้องกดปุ่มด้านล่างเพื่อสร้าง Index ใน Firebase Console (ทำเพียงครั้งเดียว)</div>'
      + '<a href="' + records.url + '" target="_blank" class="sh-hist-btn sh-hist-btn-manage" style="display:inline-flex;background:#f97316;color:white;border:none;padding:10px 20px;text-decoration:none"><i class="fas fa-external-link-alt mr-2"></i>กดที่นี่เพื่อสร้าง Index</a>'
      + '</div>';
    return;
  }

  var now = Date.now();
  var sorted = Array.isArray(records) ? [...records].sort(function(a,b){ return b.createdAt - a.createdAt; }) : [];

  if(sorted.length === 0){
    container.innerHTML = '<div style="text-align:center;color:#94a3b8;padding:40px 20px;background:#f8fafc;border-radius:20px;border:2px dashed #e2e8f0">'
      + '<i class="fas fa-link" style="font-size:32px;display:block;margin-bottom:12px;color:#cbd5e1"></i>'
      + '<div style="font-size:14px">ยังไม่มีประวัติการแชร์ในรายวิชานี้</div>'
      + '</div>';
    eid('share-history-summary').textContent = '';
    return;
  }

  var activeCount = 0;
  var expiredCount = 0;
  sorted.forEach(function(r){
    var expiresAt = r.expiresAt || (r.data && r.data.expiresAt) || null;
    var isActive = r.isActive && (expiresAt ? expiresAt > now : true);
    if(isActive) activeCount++; else expiredCount++;
  });

  eid('share-history-summary').innerHTML =
    '<span style="color:#059669;font-weight:700">' + activeCount + ' รายการใช้งานได้</span> | '
    + '<span style="color:#ef4444;font-weight:700">' + expiredCount + ' รายการหมดอายุ</span> | '
    + 'รวม ' + sorted.length + ' รายการ';

  container.innerHTML = sorted.map(function(r){
    var createdAt = r.createdAt || 0;
    var expiresAt = r.expiresAt || (r.data && r.data.expiresAt) || null;
    var firstViewedAt = r.firstViewedAt || (r.data && r.data.firstViewedAt) || null;
    var expireMinutes = r.expireMinutes || 1;
    
    // A link is active if it hasn't expired yet
    var isActive = expiresAt ? (expiresAt > now) : true;
    var remaining = expiresAt ? Math.max(0, expiresAt - now) : (expireMinutes * 60 * 1000);
    var totalSec = Math.ceil(remaining / 1000);
    var min = Math.floor(totalSec / 60);
    var sec = totalSec % 60;

    var statusClass = isActive ? 'sh-hist-active' : 'sh-hist-expired';
    var statusText = isActive ? (expiresAt ? 'ใช้งานได้' : 'ยังไม่ถูกเปิดดู') : 'หมดอายุแล้ว';
    var statusIcon = isActive ? (expiresAt ? 'fa-circle-check' : 'fa-link') : 'fa-circle-xmark';
    var statusColor = isActive ? '#059669' : '#ef4444';

    var countdownDisplay = isActive
      ? (expiresAt 
          ? '<span class="sh-hist-countdown" data-expires="' + expiresAt + '" data-token="' + r.token + '"><i class="fas fa-clock mr-1"></i>' + min + ' นาที ' + sec + ' วินาที</span>'
          : '<span style="color:#6366f1;font-size:11px"><i class="fas fa-info-circle mr-1"></i>รอเปิดดูครั้งแรก</span>')
      : '<span style="color:#94a3b8;font-size:11px"><i class="fas fa-hourglass-end mr-1"></i>หมดอายุ</span>';

    var createdDate = new Date(createdAt);
    var dateStr = createdDate.toLocaleDateString('th-TH',{ day:'numeric', month:'short', year:'2-digit' })
      + ' ' + createdDate.toLocaleTimeString('th-TH',{ hour:'2-digit', minute:'2-digit' });

    var noteHtml = r.note ? '<div class="sh-hist-note"><i class="fas fa-comment text-slate-400 mr-1.5"></i>' + esc(r.note) + '</div>' : '';
    var viewedHtml = firstViewedAt ? '<div style="font-size:10px;color:#94a3b8;margin-top:4px"><i class="fas fa-eye mr-1"></i>เปิดดูเมื่อ ' + new Date(firstViewedAt).toLocaleTimeString('th-TH',{ hour:'2-digit', minute:'2-digit' }) + '</div>' : '';

    var token = r.token || '';

    return '<div class="sh-hist-card ' + statusClass + '" data-token="' + token + '">'
      + '<div class="sh-hist-card-top">'
        + '<div class="sh-hist-info">'
          + '<div class="sh-hist-student"><i class="fas fa-user text-indigo-400 mr-1.5"></i><b>' + esc(r.studentName) + '</b>' + (r.studentCode ? ' <span style="color:#94a3b8;font-size:11px">(' + esc(r.studentCode) + ')</span>' : '') + '</div>'
          + '<div class="sh-hist-course"><i class="fas fa-book text-slate-400 mr-1.5"></i>' + esc(r.courseCode) + ' ' + esc(r.courseName) + '</div>'
          + '<div class="sh-hist-time"><i class="fas fa-calendar text-slate-400 mr-1.5"></i>สร้างเมื่อ ' + dateStr + ' | อายุ ' + expireMinutes + ' นาที</div>'
          + noteHtml
        + '</div>'
        + '<div class="sh-hist-status">'
          + '<div class="sh-hist-status-badge" style="background:' + statusColor + '1a;color:' + statusColor + ';border:1.5px solid ' + statusColor + '33"><i class="fas ' + statusIcon + ' mr-1"></i>' + statusText + '</div>'
          + countdownDisplay
          + viewedHtml
        + '</div>'
      + '</div>'
      + '<div class="sh-hist-card-bottom">'
        + '<div class="sh-hist-url">'
          + '<code style="font-size:10px;color:#64748b;word-break:break-all">' + esc('https://' + location.host + location.pathname + '?share=' + token) + '</code>'
        + '</div>'
        + '<div class="sh-hist-actions">'
          + '<button type="button" onclick="toggleManageMenu(this,\'' + token + '\')" class="sh-hist-btn sh-hist-btn-manage" title="จัดการ"><i class="fas fa-ellipsis-vertical mr-1"></i>จัดการ</button>'
          + '<div class="sh-hist-manage-menu" id="manage-menu-' + token + '">'
            + '<button type="button" onclick="copyShareHistoryLink(\'' + token + '\');closeManageMenu(\'' + token + '\')" class="sh-hist-menu-item"><i class="fas fa-copy text-indigo-500 mr-2"></i>คัดลอกลิงก์</button>'
            + (isActive ? '<button type="button" onclick="disableShareRecord(\'' + token + '\');closeManageMenu(\'' + token + '\')" class="sh-hist-menu-item sh-hist-menu-danger"><i class="fas fa-ban text-red-500 mr-2"></i>ปิดใช้งาน</button>' : '')
            + '<button type="button" onclick="viewShareRecord(\'' + token + '\');closeManageMenu(\'' + token + '\')" class="sh-hist-menu-item"><i class="fas fa-eye text-emerald-500 mr-2"></i>ดูข้อมูล</button>'
          + '</div>'
        + '</div>'
      + '</div>'
      + '</div>';
  }).join('');

  startShareHistoryCountdown();
}

// ── Manage Menu (Submenu) ────────────────────────────────────────
window.toggleManageMenu = function(btn, token){
  var menu = document.getElementById('manage-menu-' + token);
  if(!menu) return;
  document.querySelectorAll('.sh-hist-manage-menu.open').forEach(function(m){
    if(m.id !== 'manage-menu-' + token) m.classList.remove('open');
  });
  menu.classList.toggle('open');
  btn.classList.toggle('active');
};

window.closeManageMenu = function(token){
  var menu = document.getElementById('manage-menu-' + token);
  if(menu) menu.classList.remove('open');
};

document.addEventListener('click', function(e){
  if(!e.target.closest('.sh-hist-manage-menu') && !e.target.closest('.sh-hist-btn-manage')){
    document.querySelectorAll('.sh-hist-manage-menu.open').forEach(function(m){ m.classList.remove('open'); });
  }
});

// ── Countdown Timer ──────────────────────────────────────────────
var _shareHistoryCountdownInterval = null;

function startShareHistoryCountdown(){
  if(_shareHistoryCountdownInterval) clearInterval(_shareHistoryCountdownInterval);
  _shareHistoryCountdownInterval = setInterval(function(){
    var now = Date.now();
    var countdowns = document.querySelectorAll('.sh-hist-countdown');
    countdowns.forEach(function(el){
      var expiresAt = parseInt(el.getAttribute('data-expires'), 10);
      var remaining = Math.max(0, expiresAt - now);
      var totalSec = Math.ceil(remaining / 1000);
      var min = Math.floor(totalSec / 60);
      var sec = totalSec % 60;
      if(remaining <= 0){
        el.innerHTML = '<i class="fas fa-hourglass-end mr-1"></i>หมดอายุ';
        el.style.color = '#94a3b8';
        var card = el.closest('.sh-hist-card');
        if(card){ card.classList.remove('sh-hist-active'); card.classList.add('sh-hist-expired'); }
      } else {
        el.innerHTML = '<i class="fas fa-clock mr-1"></i>' + min + ' นาที ' + sec + ' วินาที';
      }
    });
  }, 1000);
}

// ── View share record ────────────────────────────────────────────
window.viewShareRecord = async function(token){
  var fh = getFirebaseHelpers();
  if(!fh.db || !fh.doc || !fh.getDoc) return;
  try {
    var ref = fh.doc(fh.db, 'shared_student_views', token);
    var snap = await fh.getDoc(ref);
    if(!snap.exists()){ alert2('ไม่พบข้อมูล','ลิงก์นี้ถูกปิดหรือถูกลบไปแล้ว'); return; }
    var data = snap.data();
    var msg = '📌 ข้อมูลลิงก์แชร์\n\n'
      + 'นักเรียน: ' + (data.student?.name || '-') + '\n'
      + 'รายวิชา: ' + (data.course?.code || '') + ' ' + (data.course?.name || '') + '\n'
      + 'สร้างเมื่อ: ' + new Date(data.createdAt).toLocaleString('th-TH') + '\n'
      + 'หมายเหตุ: ' + (data.note || '-') + '\n\n'
      + '📊 สรุปคะแนน: ' + (data.summary?.totalScore || 0) + '/' + (data.summary?.totalMax || 0);
    alert2('ข้อมูลลิงก์แชร์', msg);
  } catch(e){ alert2('เปิดดูไม่ได้', e.message); }
};

// ── Disable (close) a single share record ────────────────────────
window.disableShareRecord = async function(token){
  confirm2('ยืนยันปิดลิงก์','ต้องการปิดลิงก์แชร์นี้ใช่หรือไม่? ลิงก์จะใช้งานไม่ได้อีกต่อไป', async function(){
    var fh = getFirebaseHelpers();
    if(fh.db && fh.doc && fh.deleteDoc){
      try {
        var ref = fh.doc(fh.db, 'shared_student_views', token);
        if(ref) await fh.deleteDoc(ref);
      } catch(e) { console.warn('Failed to delete share doc:', e); }
    }
    renderShareHistoryWithFirebase(getCid());
    alert2('ปิดลิงก์แล้ว','ลิงก์แชร์นี้ถูกปิดเรียบร้อยแล้ว');
  });
};

// ── Copy link from history ───────────────────────────────────────
window.copyShareHistoryLink = function(token){
  var url = location.origin + location.pathname + '?share=' + token;
  try {
    navigator.clipboard.writeText(url).then(function(){ alert2('คัดลอกแล้ว','คัดลอกลิงก์เรียบร้อยแล้ว'); })
    .catch(function(){
      var tmp = document.createElement('textarea'); tmp.value = url; document.body.appendChild(tmp); tmp.select(); document.execCommand('copy'); document.body.removeChild(tmp);
      alert2('คัดลอกแล้ว','คัดลอกลิงก์เรียบร้อยแล้ว');
    });
  } catch(e) { alert2('คัดลอกไม่ได้','กรุณาคัดลอกลิงก์ด้วยตนเอง'); }
};

// ── Clear all history ────────────────────────────────────────────
window.clearShareHistory = function(){
  var cid = getCid();
  if(!cid) return;
  confirm2('ยืนยันล้างประวัติ','ต้องการล้างประวัติในรายวิชานี้ใช่หรือไม่? (ไม่กระทบ Firebase)', async function(){
    var st = getState();
    if(st.shareHistory && st.shareHistory[cid]) st.shareHistory[cid] = [];
    if(typeof window.dbSave === 'function') await window.dbSave();
    renderShareHistoryWithFirebase(cid);
    alert2('ล้างประวัติแล้ว','ล้างประวัติเรียบร้อยแล้ว');
  });
};

})();
