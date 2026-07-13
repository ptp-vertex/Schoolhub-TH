/* ================================================================
   SchoolHub — Share History System (นักเรียน) V5
   130_schoolhub-share-history.js

   การแก้ไข V5 (Final):
   1. ใช้ Local History (ใน state) เป็นหลักเพื่อให้ข้อมูลขึ้นทันทีและแม่นยำ
   2. ดึงข้อมูลจาก Cloud (Firebase) มาเสริม โดยใช้ Query ที่เรียบง่ายที่สุด
   3. จัดการกรณี Permission Denied หรือ Missing Index ให้แสดงผลบอกผู้ใช้
   4. ปรับปรุง z-index และปุ่มจัดการให้สมบูรณ์
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
async function fetchShareTokensFromFirebase(cid){
  var fh = getFirebaseHelpers();
  if(!fh.db || !fh.collection || !fh.getDocs || !fh.query || !fh.where){
    return { error: 'FIREBASE_NOT_READY' };
  }
  try {
    var col = fh.collection(fh.db, 'shared_student_views');
    // Simple query first (most likely to work without index)
    var q = fh.query(col, fh.where('course.id', '==', String(cid)));
    var snap = await fh.getDocs(q);
    var docs = [];
    snap.forEach(function(d){
      var data = d.data();
      docs.push({
        token: d.id, id: d.id, data: data,
        createdAt: data.createdAt || 0,
        studentName: data.student?.name || data.student?.fullName || '-',
        studentCode: data.student?.code || data.student?.studentCode || '',
        courseCode: data.course?.code || '',
        courseName: data.course?.name || '',
        expireMinutes: data.expireMinutes || 1,
        note: data.note || '',
        expiresAt: data.expiresAt || null,
        isActive: true
      });
    });
    return docs;
  } catch(e){
    console.warn('130.js Cloud fetch error:', e);
    if(e.message && e.message.indexOf('index') !== -1 && e.message.indexOf('https://') !== -1){
      var url = e.message.match(/https:\/\/console\.firebase\.google\.com[^\s]*/);
      return { error: 'INDEX_REQUIRED', url: url ? url[0] : null };
    }
    if(e.code === 'permission-denied' || (e.message && e.message.toLowerCase().indexOf('permission') !== -1)){
      return { error: 'PERMISSION_DENIED' };
    }
    return { error: 'UNKNOWN_ERROR', message: e.message };
  }
}

// ── Open Share History Popup ─────────────────────────────────────
window.openShareHistory = async function(){
  var cid = getCid();
  if(!cid){ alert2('กรุณาเลือกรายวิชา','กรุณาเปิดรายวิชาก่อนใช้งาน'); return; }

  var popup = eid('share-history-popup');
  if(!popup) return;

  // BRING TO FRONT
  document.body.appendChild(popup);
  popup.style.position = 'fixed';
  popup.style.inset = '0';
  popup.style.zIndex = String(SHARE_HISTORY_Z);
  popup.classList.remove('hidden');

  await renderShareHistory(cid);
};

window.closeShareHistory = function(){
  var popup = eid('share-history-popup');
  if(popup) popup.classList.add('hidden');
};

// ── Render Share History ─────────────────────────────────────────
async function renderShareHistory(cid){
  var container = eid('share-history-list');
  if(!container) return;

  // 1. Get Local History
  var st = getState();
  if(!st.shareHistory) st.shareHistory = {};
  var localRecords = st.shareHistory[cid] || [];

  // 2. Try to fetch Cloud History
  container.innerHTML = '<div style="text-align:center;padding:20px">'
    + '<i class="fas fa-circle-notch fa-spin" style="color:#a5b4fc"></i>'
    + '<div style="font-size:12px;color:#94a3b8;margin-top:5px">กำลังซิงค์ข้อมูลกับ Cloud...</div>'
    + '</div>';
    
  var cloudResult = await fetchShareTokensFromFirebase(cid);
  var cloudRecords = Array.isArray(cloudResult) ? cloudResult : [];
  
  // 3. Merge Local and Cloud (Unique by token)
  var recordMap = {};
  cloudRecords.forEach(function(r){ recordMap[r.id] = r; });
  localRecords.forEach(function(r){ 
    var id = r.id || r.token;
    if(!recordMap[id] || (r.createdAt > (recordMap[id].createdAt || 0))){
        recordMap[id] = r; 
    }
  });
  
  var allRecords = Object.values(recordMap).sort(function(a,b){
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  // 4. Update Summary and Render List
  var now = Date.now();
  var activeCount = 0;
  allRecords.forEach(function(r){
    var expiresAt = r.expiresAt || (r.data && r.data.expiresAt) || null;
    if(!expiresAt || expiresAt > now) activeCount++;
  });

  var summaryHtml = '<span style="color:#059669;font-weight:700">' + activeCount + ' รายการใช้งานได้</span> | รวม ' + allRecords.length + ' รายการ';
  
  // Add Cloud Status Info
  if(cloudResult.error === 'PERMISSION_DENIED'){
    summaryHtml += ' <span style="color:#f59e0b" title="Firestore Rules ไม่อนุญาตให้ดึงประวัติเก่าจาก Cloud"><i class="fas fa-shield-halved ml-1"></i> ติดสิทธิ์ Cloud</span>';
  } else if(cloudResult.error === 'INDEX_REQUIRED'){
    summaryHtml += ' <span style="color:#f59e0b" title="ต้องสร้าง Index ใน Firebase เพื่อดึงประวัติจาก Cloud"><i class="fas fa-triangle-exclamation ml-1"></i> ต้องสร้าง Index</span>';
  }

  eid('share-history-summary').innerHTML = summaryHtml;

  if(allRecords.length === 0){
    container.innerHTML = '<div style="text-align:center;color:#94a3b8;padding:40px 20px;background:#f8fafc;border-radius:20px;border:2px dashed #e2e8f0">'
      + '<i class="fas fa-link" style="font-size:32px;display:block;margin-bottom:12px;color:#cbd5e1"></i>'
      + '<div style="font-size:14px">ยังไม่มีประวัติการแชร์</div>'
      + '</div>';
    return;
  }

  container.innerHTML = allRecords.map(function(r){
    var createdAt = r.createdAt || 0;
    var expiresAt = r.expiresAt || (r.data && r.data.expiresAt) || null;
    var expireMinutes = r.expireMinutes || 1;
    var isActive = expiresAt ? (expiresAt > now) : true;
    var remaining = expiresAt ? Math.max(0, expiresAt - now) : (expireMinutes * 60 * 1000);
    var totalSec = Math.ceil(remaining / 1000);
    var min = Math.floor(totalSec / 60);
    var sec = totalSec % 60;

    var statusClass = isActive ? 'sh-hist-active' : 'sh-hist-expired';
    var statusText = isActive ? (expiresAt ? 'ใช้งานได้' : 'รอเปิดดู') : 'หมดอายุแล้ว';
    var statusColor = isActive ? '#059669' : '#ef4444';
    var token = r.id || r.token || '';

    return '<div class="sh-hist-card ' + statusClass + '" data-token="' + token + '">'
      + '<div class="sh-hist-card-top">'
        + '<div class="sh-hist-info">'
          + '<div class="sh-hist-student"><i class="fas fa-user text-indigo-400 mr-1.5"></i><b>' + esc(r.studentName) + '</b>' + (r.studentCode ? ' <span style="color:#94a3b8;font-size:11px">(' + esc(r.studentCode) + ')</span>' : '') + '</div>'
          + '<div class="sh-hist-course"><i class="fas fa-book text-slate-400 mr-1.5"></i>' + esc(r.courseCode) + ' ' + esc(r.courseName) + '</div>'
          + '<div class="sh-hist-time">สร้างเมื่อ ' + new Date(createdAt).toLocaleString('th-TH',{day:'numeric',month:'short',year:'2-digit',hour:'2-digit',minute:'2-digit'}) + '</div>'
        + '</div>'
        + '<div class="sh-hist-status">'
          + '<div class="sh-hist-status-badge" style="background:' + statusColor + '1a;color:' + statusColor + ';border:1.5px solid ' + statusColor + '33">' + statusText + '</div>'
          + (isActive ? '<div class="sh-hist-countdown" data-expires="' + (expiresAt||0) + '" data-token="' + token + '" style="font-size:11px;color:#64748b"><i class="fas fa-clock mr-1"></i>' + min + ':' + (sec<10?'0':'') + sec + '</div>' : '')
        + '</div>'
      + '</div>'
      + '<div class="sh-hist-card-bottom">'
        + '<code style="font-size:10px;color:#94a3b8;flex:1;overflow:hidden;text-overflow:ellipsis">' + token + '</code>'
        + '<div class="sh-hist-actions">'
          + '<button type="button" onclick="toggleManageMenu(this,\'' + token + '\')" class="sh-hist-btn-manage"><i class="fas fa-ellipsis-vertical mr-1"></i>จัดการ</button>'
          + '<div class="sh-hist-manage-menu" id="manage-menu-' + token + '">'
            + '<button type="button" onclick="copyShareHistoryLink(\'' + token + '\');closeManageMenu(\'' + token + '\')" class="sh-hist-menu-item"><i class="fas fa-copy text-indigo-500 mr-2"></i>คัดลอกลิงก์</button>'
            + (isActive ? '<button type="button" onclick="disableShareRecord(\'' + token + '\');closeManageMenu(\'' + token + '\')" class="sh-hist-menu-item sh-hist-menu-danger"><i class="fas fa-ban text-red-500 mr-2"></i>ปิดใช้งาน</button>' : '')
            + '<button type="button" onclick="viewShareRecord(\'' + token + '\');closeManageMenu(\'' + token + '\')" class="sh-hist-menu-item"><i class="fas fa-eye text-emerald-500 mr-2"></i>ดูข้อมูล</button>'
            + '<button type="button" onclick="deleteShareRecord(\'' + token + '\');closeManageMenu(\'' + token + '\')" class="sh-hist-menu-item sh-hist-menu-danger"><i class="fas fa-trash-can text-red-500 mr-2"></i>ลบจากประวัติ</button>'
          + '</div>'
        + '</div>'
      + '</div>'
      + '</div>';
  }).join('');

  startCountdown();
}

function startCountdown(){
  if(window._shHistInterval) clearInterval(window._shHistInterval);
  window._shHistInterval = setInterval(function(){
    var now = Date.now();
    document.querySelectorAll('.sh-hist-countdown').forEach(function(el){
      var exp = parseInt(el.getAttribute('data-expires'), 10);
      if(!exp) return;
      var rem = Math.max(0, exp - now);
      var sec = Math.ceil(rem/1000);
      if(sec <= 0){ el.innerHTML = 'หมดอายุ'; el.closest('.sh-hist-card')?.classList.add('sh-hist-expired'); }
      else { el.innerHTML = '<i class="fas fa-clock mr-1"></i>' + Math.floor(sec/60) + ':' + (sec%60<10?'0':'') + (sec%60); }
    });
  }, 1000);
}

window.toggleManageMenu = function(btn, token){
  var menu = eid('manage-menu-' + token);
  if(!menu) return;
  document.querySelectorAll('.sh-hist-manage-menu.open').forEach(function(m){ if(m.id !== menu.id) m.classList.remove('open'); });
  menu.classList.toggle('open');
  btn.classList.toggle('active');
};

window.closeManageMenu = function(token){ eid('manage-menu-' + token)?.classList.remove('open'); };

document.addEventListener('click', function(e){
  if(!e.target.closest('.sh-hist-manage-menu') && !e.target.closest('.sh-hist-btn-manage')){
    document.querySelectorAll('.sh-hist-manage-menu.open').forEach(function(m){ m.classList.remove('open'); });
  }
});

window.copyShareHistoryLink = function(token){
  var url = location.origin + location.pathname + '?share=' + token;
  navigator.clipboard.writeText(url).then(function(){ alert2('คัดลอกแล้ว','คัดลอกลิงก์เรียบร้อยแล้ว'); });
};

window.disableShareRecord = async function(token){
  confirm2('ยืนยันปิดลิงก์','ต้องการปิดลิงก์แชร์นี้ใช่หรือไม่?', async function(){
    var fh = getFirebaseHelpers();
    if(fh.db && fh.doc && fh.deleteDoc){
        try { await fh.deleteDoc(fh.doc(fh.db, 'shared_student_views', token)); } catch(e){}
    }
    // Update Local
    var cid = getCid();
    if(cid && getState().shareHistory?.[cid]){
        var r = getState().shareHistory[cid].find(x=>(x.id||x.token)===token);
        if(r) r.isActive = false;
        if(window.dbSave) await window.dbSave();
    }
    renderShareHistory(cid);
  });
};

window.deleteShareRecord = async function(token){
  confirm2('ยืนยันลบประวัติ','ต้องการลบรายการนี้จากประวัติใช่หรือไม่?', async function(){
    var cid = getCid();
    if(cid && getState().shareHistory?.[cid]){
        getState().shareHistory[cid] = getState().shareHistory[cid].filter(x=>(x.id||x.token)!==token);
        if(window.dbSave) await window.dbSave();
    }
    renderShareHistory(cid);
  });
};

window.viewShareRecord = async function(token){
  var fh = getFirebaseHelpers();
  if(!fh.db || !fh.doc || !fh.getDoc) return;
  try {
    var snap = await fh.getDoc(fh.doc(fh.db, 'shared_student_views', token));
    if(!snap.exists()){ alert2('ไม่พบข้อมูล','ลิงก์นี้ถูกปิดหรือถูกลบไปแล้ว'); return; }
    var d = snap.data();
    alert2('ข้อมูลลิงก์แชร์', 'นักเรียน: ' + (d.student?.name||'-') + '\nสร้างเมื่อ: ' + new Date(d.createdAt).toLocaleString('th-TH') + '\nสรุปคะแนน: ' + (d.summary?.totalScore||0) + '/' + (d.summary?.totalMax||0));
  } catch(e){ alert2('Error', e.message); }
};

})();
