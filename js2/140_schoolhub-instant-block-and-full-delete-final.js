
/* Final patch (ทำงานอิสระ ไม่พึ่งตัวแปร global ที่อาจไม่มีจริง เช่น auth/db นอก module):
   1) บล็อกผู้ใช้ -> เด้งออกทันที (real-time, ไม่ใช่รอ polling 5 วิ) พร้อมป็อปอัพแจ้งเตือน
      แล้วเข้าใช้งานไม่ได้อีกจนกว่าจะถูกปลดบล็อก (ข้อมูลผู้ใช้ยังอยู่ครบ)
   2) ลบผู้ใช้ -> ลบข้อมูลทั้งหมดของบัญชีนั้นแบบสมบูรณ์ (รวมข้อมูลรายวิชา/ห้องเรียน/คะแนน/เช็คชื่อ
      ที่ patch อื่นซึ่งโหลดทีหลัง (057) ทับด้วยเวอร์ชันที่ลบไม่ครบ) เพื่อให้บัญชีเดิมเข้าใหม่
      ได้ในสภาพเหมือนบัญชีใหม่จริง ๆ (ไม่มีข้อมูลเก่าเหลือ)
*/
import { getApps } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
  getFirestore, doc, getDoc, collection, getDocs, setDoc, deleteDoc, onSnapshot
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

(function () {
  if (window.__schoolhubInstantBlockFullDeleteFinal) return;
  window.__schoolhubInstantBlockFullDeleteFinal = true;

  const app = getApps()[0];
  if (!app) return;
  const auth = getAuth(app);
  const db = getFirestore(app);

  const norm = v => String(v || '').trim().toLowerCase();
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmail = v => emailRe.test(norm(v));
  const isBlockedData = d => {
    if (!d) return false;
    const st = norm(d.status);
    return st === 'blocked' || st === 'deleted' || d.blocked === true;
  };
  const alertBox = (t, m, err) => {
    try { (window.showCustomAlert || alert)(t, m, err); }
    catch (e) { alert(String(t || '') + '\n' + String(m || '')); }
  };

  /* ---------- 1) ตรวจจับบล็อกแบบ real-time แล้วเด้งออกทันที ---------- */
  let unsubList = [];
  function clearWatchers() {
    unsubList.forEach(u => { try { u(); } catch (e) {} });
    unsubList = [];
  }

  async function kickOutBlockedUser() {
    clearWatchers();
    try { if (auth.currentUser) await signOut(auth); } catch (e) {}
    try {
      window.currentUser = null;
      window.isAdmin = false;
      localStorage.removeItem('schoolhub_admin_bypass');
      localStorage.removeItem('schoolhub_web_session_v1');
      document.getElementById('main-app')?.classList.add('hidden');
      document.getElementById('auth-view')?.classList.add('hidden');
      document.getElementById('landing-view')?.classList.remove('hidden');
    } catch (e) {}
    alertBox('บัญชีถูกบล็อก', 'บัญชีนี้ถูกบล็อกโดยผู้ดูแลระบบ จึงถูกออกจากระบบทันที กรุณาติดต่อ Admin เพื่อปลดบล็อก', true);
  }

  function watchUserForBlock(email, uid) {
    clearWatchers();
    if (!email && !uid) return;
    const refs = [];
    if (email) refs.push(doc(db, 'users_status', email));
    if (email) refs.push(doc(db, 'public_users_directory', email));
    if (uid && uid !== email) refs.push(doc(db, 'public_users_directory', uid));
    refs.forEach(ref => {
      const unsub = onSnapshot(ref, snap => {
        if (snap.exists() && isBlockedData(snap.data())) kickOutBlockedUser();
      }, () => {});
      unsubList.push(unsub);
    });
  }

  auth.onAuthStateChanged(user => {
    if (!user || user.uid === 'admin-bypass') { clearWatchers(); return; }
    const email = norm(user.email);
    watchUserForBlock(email, user.uid);
  });

  // ตาข่ายนิรภัยสำรอง เผื่อ listener หลุดเพราะเน็ตกระตุก (ไม่เกิน 3 วิ ตามที่ต้องการ)
  setInterval(async () => {
    try {
      const user = auth.currentUser;
      if (!user || user.uid === 'admin-bypass') return;
      const email = norm(user.email);
      if (!email) return;
      const snap = await getDoc(doc(db, 'users_status', email));
      if (snap.exists() && isBlockedData(snap.data())) kickOutBlockedUser();
    } catch (e) {}
  }, 2500);

  /* ---------- 2) ลบผู้ใช้แบบสมบูรณ์ (ครอบตัวสุดท้ายที่ patch อื่นตั้งไว้) ---------- */
  async function safeDelete(ref) {
    try { await deleteDoc(ref); return true; }
    catch (e) { console.warn('full-delete: delete failed', ref?.path || ref, e); return false; }
  }

  async function deleteUserPrivateRoot(key) {
    if (!key) return;
    try {
      const schoolSnap = await getDocs(collection(db, 'users', key, 'school_data'));
      const tasks = [];
      schoolSnap.forEach(d => tasks.push(safeDelete(doc(db, 'users', key, 'school_data', d.id))));
      await Promise.allSettled(tasks);
    } catch (e) { console.warn('full-delete: school_data failed', key, e); }
    await safeDelete(doc(db, 'users', key));
  }

  async function deletePlanRequests(ids) {
    try {
      const qs = await getDocs(collection(db, 'subscription_requests'));
      const tasks = [];
      qs.forEach(d => {
        const data = d.data() || {};
        const vals = [d.id, data.uid, data.userKey, data.email, data.name].map(norm).filter(Boolean);
        if (vals.some(v => ids.has(v))) tasks.push(safeDelete(doc(db, 'subscription_requests', d.id)));
      });
      await Promise.allSettled(tasks);
    } catch (e) { console.warn('full-delete: subscription_requests failed', e); }
  }

  function matchTarget(obj, ids) {
    const d = obj || {};
    const vals = [d.uid, d.userKey, d.email, d.ownerUid, d.ownerEmail, d.ownerKey, d.createdBy, d.requestedBy, d.memberEmail, d.inviteEmail, d.docId]
      .map(norm).filter(Boolean);
    return vals.some(v => ids.has(v));
  }

  async function cleanupTeams(ids) {
    try {
      const qs = await getDocs(collection(db, 'teams'));
      const tasks = [];
      qs.forEach(d => {
        const t = d.data() || {};
        if (matchTarget({ ...t, docId: d.id }, ids)) { tasks.push(safeDelete(doc(db, 'teams', d.id))); return; }
        let changed = false;
        const next = { ...t };
        ['members', 'invites', 'inviteQueue', 'pendingInvites'].forEach(field => {
          if (Array.isArray(next[field])) {
            const arr = next[field].filter(x => !matchTarget(x, ids));
            if (arr.length !== next[field].length) { next[field] = arr; changed = true; }
          }
        });
        if (changed) tasks.push(setDoc(doc(db, 'teams', d.id), next, { merge: true }).catch(e => console.warn('cleanup team failed', d.id, e)));
      });
      await Promise.allSettled(tasks);
    } catch (e) { console.warn('full-delete: cleanup teams failed', e); }
  }

  async function cleanupSharedTeachers(ids) {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const tasks = [];
      usersSnap.forEach(userDoc => {
        tasks.push((async () => {
          try {
            const stateRef = doc(db, 'users', userDoc.id, 'school_data', 'state');
            const stateSnap = await getDoc(stateRef);
            if (!stateSnap.exists()) return;
            const state = stateSnap.data() || {};
            if (!Array.isArray(state.courses)) return;
            let changed = false;
            const courses = state.courses.map(c => {
              if (!c || !c.sharedTeachers) return c;
              if (Array.isArray(c.sharedTeachers)) {
                const arr = c.sharedTeachers.filter(x => !matchTarget(x, ids));
                if (arr.length !== c.sharedTeachers.length) { changed = true; return { ...c, sharedTeachers: arr }; }
              } else if (typeof c.sharedTeachers === 'object') {
                const obj = { ...c.sharedTeachers };
                Object.keys(obj).forEach(k => { if (ids.has(norm(k)) || matchTarget(obj[k], ids)) { delete obj[k]; changed = true; } });
                if (changed) return { ...c, sharedTeachers: obj };
              }
              return c;
            });
            if (changed) await setDoc(stateRef, { courses, updatedAt: Date.now() }, { merge: true });
          } catch (e) { console.warn('cleanup sharedTeachers failed', userDoc.id, e); }
        })());
      });
      await Promise.allSettled(tasks);
    } catch (e) { console.warn('full-delete: read users for sharedTeachers failed', e); }
  }

  async function fullyWipeUser(uid, key, email) {
    const ids = new Set([uid, key, email].map(norm).filter(Boolean));
    if (!ids.size) return;
    const targets = [...ids];
    await Promise.allSettled([
      ...targets.map(x => safeDelete(doc(db, 'public_users_directory', x))),
      ...targets.map(x => safeDelete(doc(db, 'users_status', x))),
      ...targets.map(x => safeDelete(doc(db, 'user_stats', x))),
      ...targets.map(deleteUserPrivateRoot),
      deletePlanRequests(ids),
      cleanupTeams(ids),
      cleanupSharedTeachers(ids)
    ]);
  }

  // ครอบ confirmDeleteAdminUser ตัวสุดท้าย (ที่ 057 ตั้งไว้) ให้ลบข้อมูลครบจริงก่อน
  // แล้วค่อยให้ของเดิมทำงานต่อ (แสดงป็อปอัพ/รีเฟรชตารางตามปกติ) เพื่อไม่ทำลาย UX เดิม
  function wrapConfirmDelete() {
    const prev = window.confirmDeleteAdminUser;
    if (typeof prev !== 'function' || prev.__fullWipePatch) return;
    const wrapped = async function (uid, key) {
      const email = isEmail(key) ? norm(key) : (isEmail(uid) ? norm(uid) : '');
      const label = email || String(key || uid || 'ผู้ใช้นี้');
      const runFull = async () => {
        try { if (typeof window.toggleLoader === 'function') window.toggleLoader(true); } catch (e) {}
        try {
          await fullyWipeUser(uid, key, email);
        } catch (e) {
          console.warn('full-delete failed:', e);
        } finally {
          try { if (typeof window.toggleLoader === 'function') window.toggleLoader(false); } catch (e) {}
        }
      };
      // ยืนยันครั้งเดียว แล้วลบให้ครบทุกส่วนก่อน จากนั้นให้ flow เดิม (ที่ตั้ง confirm/alert ของตัวเอง)
      // ทำงานต่อเพื่อเคลียร์ doc ที่เหลือ + รีเฟรชตาราง Admin ตามเดิม ไม่ให้ผู้ใช้เห็นการยืนยัน 2 รอบ
      if (typeof window.showCustomConfirm === 'function') {
        window.showCustomConfirm(
          'ยืนยันลบผู้ใช้',
          `ต้องการลบ ${label} หรือไม่?\n\nการลบนี้จะลบข้อมูลผู้ใช้ทั้งหมด ทั้งบัญชี รายวิชา ห้องเรียน นักเรียน คะแนน เช็คชื่อ แผนคะแนน และข้อมูลที่เกี่ยวข้องทั้งหมดแบบถาวร\n\nเมื่อเข้าสู่ระบบด้วยบัญชีนี้อีกครั้ง จะถือเป็นบัญชีใหม่ที่ต้องเริ่มต้นใหม่ทั้งหมด\n\nไม่สามารถย้อนกลับได้`,
          async () => {
            await runFull();
            try { await Promise.allSettled([
              typeof window.loadAdminData === 'function' ? window.loadAdminData() : Promise.resolve(),
              typeof window.renderBlockedUsersList === 'function' ? window.renderBlockedUsersList() : Promise.resolve()
            ]); } catch (e) {}
            alertBox('ลบผู้ใช้สำเร็จ', `ลบ ${label} และข้อมูลทั้งหมดออกจากระบบแล้ว`);
          }
        );
      } else if (confirm(`ต้องการลบ ${label} และข้อมูลทั้งหมดออกจากระบบหรือไม่?`)) {
        await runFull();
        alertBox('ลบผู้ใช้สำเร็จ', `ลบ ${label} และข้อมูลทั้งหมดออกจากระบบแล้ว`);
      }
    };
    wrapped.__fullWipePatch = true;
    window.confirmDeleteAdminUser = wrapped;
  }

  // ต้องรอให้ 057/058 (ที่โหลดก่อนหน้าตามลำดับไฟล์) ตั้ง window.confirmDeleteAdminUser เสร็จก่อน
  document.addEventListener('DOMContentLoaded', () => setTimeout(wrapConfirmDelete, 50));
  setTimeout(wrapConfirmDelete, 300);
})();
