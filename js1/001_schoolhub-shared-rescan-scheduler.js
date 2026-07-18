
(function(){
  if(window.__schoolhubSharedRescanScheduler) return;
  window.__schoolhubSharedRescanScheduler = true;

  // ปัญหาเดิม: มี setInterval ของแต่ละ patch แยกกันหลายสิบตัว (ทุก 500ms-3s)
  // แต่ละตัว querySelectorAll ทั่วทั้งหน้าเอง -> เวลาเปิดป็อปอัพ/มี DOM หนักๆ
  // จะกระตุกสะสมเพราะทำงานพร้อมกันถี่เกินจำเป็นตลอดเวลา แม้ DOM จะไม่ได้เปลี่ยนเลย
  //
  // ตัวช่วยนี้รวมทุก callback ไว้ในตัวเดียว แล้วสั่งรันเฉพาะตอน:
  //   1) DOM มีการเปลี่ยนแปลงจริง (ผ่าน MutationObserver ตัวเดียว, debounce)
  //   2) หรือ fallback เป็นช่วงเวลาที่ห่างขึ้นมาก (default 4 เท่าของค่าที่ระบุ)
  //      เผื่อกรณีที่ callback ต้องพึ่งพา state อื่นที่ไม่ได้มาจาก DOM mutation (เช่น เวลา/plan)

  var tasks = {};      // key -> {fn, fallbackMs, lastRun}
  var pendingRun = false;

  function runAll(){
    pendingRun = false;
    var now = Date.now();
    Object.keys(tasks).forEach(function(key){
      var t = tasks[key];
      try{ t.fn(); t.lastRun = now; }catch(e){}
    });
  }

  function scheduleDebounced(){
    if(pendingRun) return;
    pendingRun = true;
    // requestAnimationFrame ให้ browser จัดคิวหลัง layout/paint รอบปัจจุบันแทนที่จะแทรกกลางเฟรม
    requestAnimationFrame(function(){ setTimeout(runAll, 60); });
  }

  var mo = new MutationObserver(function(){ scheduleDebounced(); });
  document.addEventListener('DOMContentLoaded', function(){
    mo.observe(document.body, {childList:true, subtree:true, attributes:false});
    scheduleDebounced();
  });

  // fallback loop เดียว (เดินทุก 1s) แทน setInterval แยกของแต่ละไฟล์
  // แต่ละ task จะถูกเรียกจริงเมื่อห่างจาก lastRun เกิน fallbackMs ของตัวเองเท่านั้น
  setInterval(function(){
    var now = Date.now();
    Object.keys(tasks).forEach(function(key){
      var t = tasks[key];
      if(now - (t.lastRun||0) >= t.fallbackMs) scheduleDebounced();
    });
  }, 1000);

  /**
   * ลงทะเบียน task ที่ต้องการ "rescan" DOM เป็นระยะ
   * key: ชื่อ unique กันชนกันระหว่าง patch
   * fn: ฟังก์ชันที่จะถูกเรียก
   * fallbackMs: ความห่างสูงสุดที่ยอมให้ไม่ถูกเรียก แม้ DOM จะไม่เปลี่ยน (default 4000ms)
   */
  window.schoolhubDebouncedRescan = function(key, fn, fallbackMs){
    if(typeof fn !== 'function') return;
    tasks[key] = { fn: fn, fallbackMs: fallbackMs || 4000, lastRun: 0 };
    // รันครั้งแรกทันที ไม่ต้องรอ mutation/interval แรก
    try{ fn(); tasks[key].lastRun = Date.now(); }catch(e){}
  };
})();
