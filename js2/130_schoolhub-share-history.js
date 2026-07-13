/* ================================================================
   SchoolHub — Share History System (นักเรียน)
   130_schoolhub-share-history.js
   
   ฟีเจอร์:
   1. ปุ่ม "ประวัติการแชร์" มุมขวาบนของ popup แชร์
   2. Popup แสดงรายการแชร์ทั้งหมด (ใหม่ → เก่า)
   3. Countdown นับถอยหลังแต่ละรายการ
   4. สถานะ: ใช้ได้ / หมดอายุแล้ว
   5. ปุ่มปิด/ยกเลิกการแชร์แต่ละรายการ
   6. ปุ่มล้างประวัติทั้งหมด
   ================================================================ */

(function(){
'use strict';

// ── Helpers ──────────────────────────────────────────────────────
function eid(id){ return document.getElementById(id); }
function getCid(){
  return typeof window.currentActiveCourseId !== 'undefined'
    ? window.currentActiveCourseId
    : null;
}
function getState(){ return window.state || {}; }
function ensureField(obj,key,def){ if(!obj[key]) obj[key]=def; }
function esc(v){ return String(v||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function dbSave(){ return typeof window.dbSave==='function' ? window.dbSave() : Promise.resolve(); }
function getShareCourseId(){
  if(typeof window.getCurrentShareCourseId === 'function') return window.getCurrentShareCourseId();
  const modal = document.getElementById('share-student-modal');
  return String(modal?.dataset?.courseId || window.currentActiveCourseId || '').trim();
}
function alert2(title,msg){ if(typeof window.showCustomAlert==='function') window.showCustomAlert(title,msg,true); else alert(title+': '+msg); }
function confirm2(title,msg,cb){ if(typeof window.showCustomConfirm==='function') window.showCustomConfirm(title,msg,cb); else { if(confirm(title+'\n'+msg)) cb(); } }

// ── Init: create shareHistory structure on load ──────────────────
function initShareHistory(){
  const st = getState();
  ensureField(st,'shareHistory',{});
  // Ensure each course has a history array
  const courses = st.courses || [];
  courses.forEach(function(c){
    if(!st.shareHistory[c.id]) st.shareHistory[c.id] = [];
  });
}
if(document.readyState!=='loading') setTimeout(initShareHistory,1500);
else document.addEventListener('DOMContentLoaded',function(){ setTimeout(initShareHistory,1500); });

// ── Hook: save share record when link is created ─────────────────
// Override confirmCreateStudentShareLink to also save to shareHistory
var _origConfirmCreateStudentShareLink = window.confirmCreateStudentShareLink;
window.confirmCreateStudentShareLink = async function(){
  const studentId = window.__schoolhubShareStudentId;
  const expireMinutes = Math.max(1, Number(eid('student-share-expire-minutes')?.value || 1));
  const note = String(eid('student-share-note')?.value || '').trim();
  
  const payload = typeof window.buildStudentSharePayload === 'function'
    ? window.buildStudentSharePayload(studentId, expireMinutes, note)
    : null;
  
  if(!payload){
    alert2('สร้างลิงก์ไม่ได้','ไม่พบข้อมูลนักเรียน หรือเป็นนักเรียนที่ลาออกแล้ว');
    return false;
  }
  
  const token = 'sh_' + Date.now() + '_' + Math.random().toString(36).slice(2,8);
  const now = Date.now();
  const expiresAt = now + expireMinutes * 60 * 1000;
  
  // Save to Firebase (original behavior)
  const toggleLoader = typeof window.toggleLoader === 'function' ? window.toggleLoader : function(){};
  toggleLoader(true);
  try{
    const ref = typeof window.getShareDocRef === 'function' ? window.getShareDocRef(token) : null;
    if(ref && typeof window.setDoc === 'function'){
      await window.setDoc(ref, payload);
    }
    const url = location.origin + location.pathname + '?share=' + encodeURIComponent(token);
    window.__schoolhubShareStudentUrl = url;
    const urlInput = eid('student-share-created-url');
    if(urlInput) urlInput.value = url;
    const detail = eid('student-share-created-detail');
    if(detail) detail.textContent = 'ลิงก์ของ ' + payload.student.name + ' หมดอายุหลังเปิดดูครั้งแรก ' + expireMinutes + ' นาที';
    eid('student-share-create-form')?.classList.add('hidden');
    eid('student-share-created-panel')?.classList.remove('hidden');
    const copyBtn = eid('student-share-copy-btn');
    if(copyBtn){ copyBtn.disabled=false; copyBtn.classList.remove('opacity-80','cursor-not-allowed'); copyBtn.innerHTML='<i class="fas fa-copy mr-1"></i> คัดลอกลิงก์'; }
  }catch(e){
    alert2('สร้างลิงก์แชร์ไม่ได้','ต้องแก้ Firestore Rules ของ shared_student_views ก่อน');
    toggleLoader(false);
    return false;
  }
  
  // ★ SAVE TO SHARE HISTORY ★
  const cid = getShareCourseId();
  if(cid){
    const st = getState();
    ensureField(st,'shareHistory',{});
    ensureField(st.shareHistory,cid,[]);
    
    const record = {
      id: token,
      studentName: payload.student.name || studentId,
      studentCode: payload.student.code || payload.student.studentCode || '',
      courseCode: payload.course.code || '',
      courseName: payload.course.name || '',
      expireMinutes: expireMinutes,
      note: note,
      createdAt: now,
      expiresAt: expiresAt,
      firstViewedAt: null,
      isActive: true,
      teacherName: typeof window.currentUser !== 'undefined' && window.currentUser
        ? (window.currentUser.displayName || window.currentUser.email || 'ครูผู้สอน')
        : 'ครูผู้สอน'
    };
    
    // Add to beginning (newest first)
    st.shareHistory[cid].unshift(record);
    
    // Auto-save to Firestore
    try {
      await dbSave();
    } catch(e) {
      console.warn('Share history save failed:', e);
    }
  }
  
  toggleLoader(false);
  return false;
};

// ── Open Share History Popup ─────────────────────────────────────
window.openShareHistory = function(){
  const cid = getCid();
  if(!cid){ alert2('กรุณาเลือกรายวิชา','กรุณาเปิดรายวิชาก่อนใช้งาน'); return; }
  
  const st = getState();
  ensureField(st,'shareHistory',{});
  ensureField(st.shareHistory,cid,[]);
  
  renderShareHistory();
  const popup = eid('share-history-popup');
  if(popup){
    popup.classList.remove('hidden');
    popup.classList.remove('share-history-popup-closing');
  }
};

window.closeShareHistory = function(){
  const popup = eid('share-history-popup');
  if(popup){
    popup.classList.add('hidden');
  }
};

// ── Render Share History ─────────────────────────────────────────
function renderShareHistory(){
  const cid = getCid();
  if(!cid) return;
  
  const st = getState();
  const records = (st.shareHistory && st.shareHistory[cid]) || [];
  const container = eid('share-history-list');
  if(!container) return;
  
  // Sort: newest first (by createdAt descending)
  const sorted = [...records].sort(function(a,b){ return b.createdAt - a.createdAt; });
  
  if(sorted.length === 0){
    container.innerHTML = '<div style="text-align:center;color:#94a3b8;padding:40px 20px;background:#f8fafc;border-radius:20px;border:2px dashed #e2e8f0">'
      + '<i class="fas fa-link" style="font-size:32px;display:block;margin-bottom:12px;color:#cbd5e1"></i>'
      + '<div style="font-size:14px">ยังไม่มีประวัติการแชร์</div>'
      + '</div>';
    return;
  }
  
  // Active and expired counts
  const now = Date.now();
  const activeCount = sorted.filter(function(r){ return r.isActive && r.expiresAt > now; }).length;
  const expiredCount = sorted.length - activeCount;
  
  // Update summary
  const summaryEl = eid('share-history-summary');
  if(summaryEl){
    summaryEl.innerHTML = '<span style="color:#059669;font-weight:700">' + activeCount + ' รายการใช้งานได้</span> | <span style="color:#ef4444;font-weight:700">' + expiredCount + ' รายการหมดอายุ</span> | รวม ' + sorted.length + ' รายการ';
  }
  
  container.innerHTML = sorted.map(function(r, idx){
    const isActive = r.isActive && r.expiresAt > now;
    const isExpired = !isActive;
    const remaining = Math.max(0, r.expiresAt - now);
    const totalSec = Math.ceil(remaining / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    
    const statusClass = isActive ? 'sh-hist-active' : 'sh-hist-expired';
    const statusText = isActive ? 'ใช้งานได้' : 'หมดอายุแล้ว';
    const statusIcon = isActive ? 'fa-circle-check' : 'fa-circle-xmark';
    const statusColor = isActive ? '#059669' : '#ef4444';
    
    const countdownDisplay = isActive
      ? '<span class="sh-hist-countdown" data-expires="' + r.expiresAt + '" data-token="' + r.id + '"><i class="fas fa-clock mr-1"></i>' + min + ' นาที ' + sec + ' วินาที</span>'
      : '<span style="color:#94a3b8;font-size:11px"><i class="fas fa-hourglass-end mr-1"></i>หมดอายุ</span>';
    
    const createdDate = new Date(r.createdAt);
    const dateStr = createdDate.toLocaleDateString('th-TH',{ day:'numeric', month:'short', year:'2-digit' })
      + ' ' + createdDate.toLocaleTimeString('th-TH',{ hour:'2-digit', minute:'2-digit' });
    
    const actionBtn = isActive
      ? '<button type="button" onclick="disableShareRecord(\'' + r.id + '\')" class="sh-hist-btn sh-hist-btn-red" title="ปิดลิงก์นี้"><i class="fas fa-ban mr-1"></i>ปิด</button>'
      : '';
    
    return '<div class="sh-hist-card ' + statusClass + '" data-token="' + r.id + '">'
      + '<div class="sh-hist-card-top">'
        + '<div class="sh-hist-info">'
          + '<div class="sh-hist-student"><i class="fas fa-user text-indigo-400 mr-1.5"></i><b>' + esc(r.studentName) + '</b>' + (r.studentCode ? ' <span style="color:#94a3b8;font-size:11px">(' + esc(r.studentCode) + ')</span>' : '') + '</div>'
          + '<div class="sh-hist-course"><i class="fas fa-book text-slate-400 mr-1.5"></i>' + esc(r.courseCode) + ' ' + esc(r.courseName) + '</div>'
          + '<div class="sh-hist-time"><i class="fas fa-calendar text-slate-400 mr-1.5"></i>สร้างเมื่อ ' + dateStr + ' | หมดอายุใน ' + r.expireMinutes + ' นาที</div>'
          + (r.note ? '<div class="sh-hist-note"><i class="fas fa-comment text-slate-400 mr-1.5"></i>' + esc(r.note) + '</div>' : '')
        + '</div>'
        + '<div class="sh-hist-status">'
          + '<div class="sh-hist-status-badge" style="background:' + statusColor + '1a;color:' + statusColor + ';border:1.5px solid ' + statusColor + '33"><i class="fas ' + statusIcon + ' mr-1"></i>' + statusText + '</div>'
          + countdownDisplay
          + (r.firstViewedAt ? '<div style="font-size:10px;color:#94a3b8;margin-top:4px"><i class="fas fa-eye mr-1"></i>เปิดดูเมื่อ ' + new Date(r.firstViewedAt).toLocaleTimeString('th-TH',{ hour:'2-digit', minute:'2-digit' }) + '</div>' : '')
        + '</div>'
      + '</div>'
      + '<div class="sh-hist-card-bottom">'
        + '<div class="sh-hist-url">'
          + '<code style="font-size:10px;color:#64748b;word-break:break-all">' + esc('https://' + location.host + location.pathname + '?share=' + r.id) + '</code>'
          + '<button type="button" onclick="copyShareHistoryLink(\'' + r.id + '\')" class="sh-hist-btn sh-hist-btn-copy" title="คัดลอกลิงก์"><i class="fas fa-copy"></i></button>'
        + '</div>'
        + (actionBtn ? '<div class="sh-hist-actions">' + actionBtn + '</div>' : '')
      + '</div>'
      + '</div>';
  }).join('');
  
  // Start countdown timer
  startShareHistoryCountdown();
}

// ── Countdown Timer ──────────────────────────────────────────────
var _shareHistoryCountdownInterval = null;

function startShareHistoryCountdown(){
  // Clear existing interval
  if(_shareHistoryCountdownInterval){
    clearInterval(_shareHistoryCountdownInterval);
    _shareHistoryCountdownInterval = null;
  }
  
  _shareHistoryCountdownInterval = setInterval(function(){
    const now = Date.now();
    const countdowns = document.querySelectorAll('.sh-hist-countdown');
    let needRefresh = false;
    
    countdowns.forEach(function(el){
      const expiresAt = parseInt(el.getAttribute('data-expires'), 10);
      const remaining = Math.max(0, expiresAt - now);
      const totalSec = Math.ceil(remaining / 1000);
      const min = Math.floor(totalSec / 60);
      const sec = totalSec % 60;
      
      if(remaining <= 0){
        needRefresh = true;
        el.innerHTML = '<i class="fas fa-hourglass-end mr-1"></i>หมดอายุ';
        el.style.color = '#94a3b8';
        
        // Update the card status
        const card = el.closest('.sh-hist-card');
        if(card){
          card.classList.remove('sh-hist-active');
          card.classList.add('sh-hist-expired');
        }
      } else {
        el.innerHTML = '<i class="fas fa-clock mr-1"></i>' + min + ' นาที ' + sec + ' วินาที';
      }
    });
    
    if(needRefresh){
      // Re-render to update status badges
      renderShareHistory();
    }
  }, 1000);
  
  // Auto-stop after 2 hours to save resources
  setTimeout(function(){
    if(_shareHistoryCountdownInterval){
      clearInterval(_shareHistoryCountdownInterval);
      _shareHistoryCountdownInterval = null;
    }
  }, 7200000);
}

// ── Disable (close) a single share record ────────────────────────
window.disableShareRecord = function(token){
  confirm2('ยืนยันปิดลิงก์','ต้องการปิดลิงก์แชร์นี้ใช่หรือไม่? ลิงก์จะใช้งานไม่ได้อีกต่อไป', async function(){
    // Delete from Firestore
    if(typeof window.getShareDocRef === 'function' && typeof window.deleteDoc === 'function'){
      try {
        const ref = window.getShareDocRef(token);
        if(ref) await window.deleteDoc(ref);
      } catch(e) {
        console.warn('Failed to delete share doc from Firestore:', e);
      }
    }
    
    // Mark as inactive in local history
    const cid = getCid();
    if(cid){
      const st = getState();
      const records = (st.shareHistory && st.shareHistory[cid]) || [];
      const record = records.find(function(r){ return r.id === token; });
      if(record){
        record.isActive = false;
      }
      await dbSave();
    }
    
    renderShareHistory();
    alert2('ปิดลิงก์แล้ว','ลิงก์แชร์นี้ถูกปิดเรียบร้อยแล้ว');
  });
};

// ── Copy link from history ───────────────────────────────────────
window.copyShareHistoryLink = function(token){
  const url = location.origin + location.pathname + '?share=' + token;
  try {
    navigator.clipboard.writeText(url).then(function(){
      alert2('คัดลอกแล้ว','คัดลอกลิงก์เรียบร้อยแล้ว');
    }).catch(function(){
      // Fallback: select and copy
      const tmp = document.createElement('textarea');
      tmp.value = url;
      document.body.appendChild(tmp);
      tmp.select();
      document.execCommand('copy');
      document.body.removeChild(tmp);
      alert2('คัดลอกแล้ว','คัดลอกลิงก์เรียบร้อยแล้ว');
    });
  } catch(e) {
    alert2('คัดลอกไม่ได้','กรุณาคัดลอกลิงก์ด้วยตนเอง');
  }
};

// ── Clear all history ────────────────────────────────────────────
window.clearShareHistory = function(){
  const cid = getCid();
  if(!cid) return;
  confirm2('ยืนยันล้างประวัติ','ต้องการล้างประวัติการแชร์ทั้งหมดของรายวิชานี้ใช่หรือไม่? (ไม่สามารถกู้คืนได้)', async function(){
    const st = getState();
    if(st.shareHistory && st.shareHistory[cid]){
      st.shareHistory[cid] = [];
    }
    await dbSave();
    renderShareHistory();
    alert2('ล้างประวัติแล้ว','ล้างประวัติการแชร์ทั้งหมดเรียบร้อยแล้ว');
  });
};

})();
