/* =====================================================================
   PATCH: แก้ปัญหาลำดับชั้น (z-index) ของป็อปอัพ/โมดัลทับกันผิดที่
   - ป็อปอัพที่ "เปิดทีหลัง" ต้องลอยมาด้านหน้าเสมอ (เช่น ตั้งค่าการแจ้งเตือน เปิดจากในโปรไฟล์)
   - ระบบสอนการใช้งาน (Onboarding Tour) ต้องอยู่เหนือทุกป็อปอัพที่กำลังสอนอยู่เสมอ
   โหลดเป็นไฟล์สุดท้าย (ท้าย body) เพื่อให้ครอบคลุมทุก wrapper ของ openModal ก่อนหน้า
   ===================================================================== */
(function () {
  'use strict';

  // ชั้นบนสุดสำหรับโมดัล/ป็อปอัพทั่วไป (ต่ำกว่า custom-alert/confirm ซึ่งใช้ 2147483647 เสมอ)
  var Z_BASE = 2147483500;
  var zCounter = Z_BASE;
  function nextModalZ() {
    zCounter += 1;
    if (zCounter > 2147483630) zCounter = Z_BASE; // กันล้น ไม่มีทางไปชนชั้นของ tour/alert
    return zCounter;
  }

  // ชั้นของระบบสอน ต้องสูงกว่าโมดัลทั่วไปเสมอ แต่ยังต่ำกว่า custom-alert/confirm จริง ๆ
  var TOUR_Z_BASE = 2147483640;

  function bringToFront(el, z) {
    if (!el) return;
    try {
      el.style.setProperty('z-index', String(z), 'important');
      if (el.parentNode === document.body) {
        document.body.appendChild(el); // ย้ายไปเป็นลูกตัวสุดท้าย ชนะกรณี z-index เท่ากัน
      }
    } catch (e) {}
  }

  // ---------- 1) ห่อ window.openModal ตัวสุดท้าย ให้ทุกโมดัลที่เปิดทีหลังลอยมาหน้าสุด ----------
  function wrapOpenModal() {
    if (typeof window.openModal !== 'function' || window.openModal.__shStackFixed) return;
    var original = window.openModal;
    var wrapped = function (id) {
      var r = original.apply(this, arguments);
      var el = document.getElementById(id);
      bringToFront(el, nextModalZ());
      return r;
    };
    wrapped.__shStackFixed = true;
    window.openModal = wrapped;
  }
  // openModal อาจถูกประกาศทีหลังโดยสคริปต์อื่น ๆ ที่โหลดใกล้เคียงกัน จึงเช็กซ้ำเป็นระยะสั้น ๆ ตอนเริ่มต้น
  wrapOpenModal();
  var wrapTries = 0;
  var wrapTimer = setInterval(function () {
    wrapOpenModal();
    wrapTries++;
    if (wrapTries > 40) clearInterval(wrapTimer);
  }, 250);

  // ---------- 2) ห่อการเปิดหน้าตั้งค่า (#settings-modal) ----------
  function wrapSettingsOpen() {
    if (typeof window.openSchoolHubSettings !== 'function' || window.openSchoolHubSettings.__shStackFixed) return;
    var original = window.openSchoolHubSettings;
    var wrapped = function () {
      var r = original.apply(this, arguments);
      bringToFront(document.getElementById('settings-modal'), nextModalZ());
      return r;
    };
    wrapped.__shStackFixed = true;
    window.openSchoolHubSettings = wrapped;
  }
  wrapSettingsOpen();

  // ---------- 3) ห่อการเปิดป็อปอัพตั้งค่าการแจ้งเตือน ----------
  function wrapNotifOpen() {
    if (typeof window.openNotificationSettings !== 'function' || window.openNotificationSettings.__shStackFixed) return;
    var original = window.openNotificationSettings;
    var wrapped = function () {
      var r = original.apply(this, arguments);
      // renderNotificationModal เป็น async (loadSettings ก่อน) จึงต้องรอสั้น ๆ ให้โมดัลถูกสร้าง/แสดงก่อน
      setTimeout(function () {
        bringToFront(document.getElementById('admin-notification-settings-modal'), nextModalZ());
      }, 50);
      return r;
    };
    wrapped.__shStackFixed = true;
    window.openNotificationSettings = wrapped;
  }
  var notifTries = 0;
  var notifTimer = setInterval(function () {
    wrapNotifOpen();
    notifTries++;
    if (notifTries > 40) clearInterval(notifTimer);
  }, 250);

  // ---------- 4) ระบบสอนการใช้งาน (Tour) ต้องลอยเหนือทุกป็อปอัพเสมอ ----------
  // ใช้ MutationObserver จับตอนที่ tour engine เติมคลาส sh-tour-show ให้ overlay/spotlight/card
  // แล้วดันขึ้นบนสุด + ย้ายไปท้าย body ทุกครั้งที่แสดงสเต็ปใหม่ (ไม่ต้องแก้ตัว engine เดิม)
  function boostTourLayer() {
    ['sh-tour-overlay', 'sh-tour-spotlight', 'sh-tour-card'].forEach(function (id, i) {
      bringToFront(document.getElementById(id), TOUR_Z_BASE + i);
    });
  }
  var tourObserver = new MutationObserver(function (mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var m = mutations[i];
      if (m.attributeName === 'class' && m.target && m.target.classList &&
          m.target.classList.contains('sh-tour-show')) {
        boostTourLayer();
        break;
      }
    }
  });
  function watchTourEls() {
    ['sh-tour-overlay', 'sh-tour-spotlight', 'sh-tour-card'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el && !el.__shTourWatched) {
        el.__shTourWatched = true;
        tourObserver.observe(el, { attributes: true, attributeFilter: ['class'] });
      }
    });
  }
  // tour engine สร้าง element แบบ lazy ตอนเริ่มทัวร์ครั้งแรก จึงต้องคอย poll หา element จนกว่าจะถูกสร้าง
  var tourWatchTimer = setInterval(watchTourEls, 400);
  setTimeout(function () { clearInterval(tourWatchTimer); }, 60000);
  // เผื่อ body มีการสร้าง element ใหม่ทีหลัง คอยเช็คตอน DOM เปลี่ยนแปลงระดับ body ด้วย
  new MutationObserver(watchTourEls).observe(document.body, { childList: true });
})();
