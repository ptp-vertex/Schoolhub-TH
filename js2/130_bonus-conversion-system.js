
(function(W){
  'use strict';
  
  if (W.__schoolhubBonusConversionSystem) return;
  W.__schoolhubBonusConversionSystem = true;

  function esc(v){ try { return W.escapeHTML ? W.escapeHTML(v) : String(v||'').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); } catch(e){ return String(v||''); } }
  function byId(id){ return document.getElementById(id); }
  function getState(){ return W.state || {}; }
  function getCid(){ return W.currentActiveCourseId || null; }
  async function dbSave(){ if(typeof W.saveStateToDB==='function') return W.saveStateToDB(); return Promise.resolve(); }

  W.openBonusConversionPopup = function(){
    const cid = getCid();
    if (!cid) {
      if (W.showCustomAlert) W.showCustomAlert('ไม่พบวิชาที่เลือก','กรุณาเปิดวิชาก่อนใช้งานฟีเจอร์นี้', true);
      return;
    }

    let modal = byId('sh-bonus-merge-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'sh-bonus-merge-modal';
      modal.className = 'sh-overlay hidden';
      document.body.appendChild(modal);
    }

    const plans = (getState().coursePlans && getState().coursePlans[cid]) || [];
    const weekOptions = plans.map(p => `<option value="${p.week}">สัปดาห์ที่ ${p.week} (${p.title})</option>`).join('');
    const st = getState();
    const convs = (st.bonusConversions && st.bonusConversions[cid]) || [];

    modal.innerHTML = `
      <div style="background:#fff;border-radius:20px;max-width:440px;width:100%;max-height:86vh;overflow:auto;padding:22px">
        <h3 style="font-weight:900;font-size:18px;margin-bottom:4px">
          <i class="fas fa-plus-circle" style="color:#059669;margin-right:6px"></i>ตั้งค่าการรวมคะแนนโบนัส
        </h3>
        <p style="color:#64748b;font-size:12px;margin-bottom:14px">
          แปลงคะแนนโบนัสสะสมเข้าสู่คะแนนเก็บหรือคะแนนรวมทั้งหมด
        </p>
        
        <div style="margin-bottom:16px">
          <label style="display:block;font-size:13px;font-weight:700;color:#475569;margin-bottom:6px">เป้าหมายการแปลง:</label>
          <select id="sh-bc-target" style="width:100%;border:1.5px solid #e2e8f0;border-radius:12px;padding:8px 12px;font-size:14px;outline:none" onchange="W.updateBonusConvUI()">
            <option value="total">แปลงเข้าคะแนนรวมโดยตรง (Total)</option>
            <option value="week">แปลงเข้าสัปดาห์คะแนน (Week)</option>
          </select>
        </div>

        <div id="sh-bc-week-select-box" style="margin-bottom:16px;display:none">
          <label style="display:block;font-size:13px;font-weight:700;color:#4f46e5;margin-bottom:6px">เลือกสัปดาห์ที่ต้องการแปลงเข้า:</label>
          <select id="sh-bc-week-num" style="width:100%;border:1.5px solid #c7d2fe;border-radius:12px;padding:8px 12px;font-size:14px;outline:none">
            ${weekOptions || '<option value="">-- ยังไม่มีแผนการสอน --</option>'}
          </select>
        </div>

        <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
          <label style="font-size:13px;font-weight:700;color:#475569">รวมกี่เปอร์เซ็นต์:</label>
          <input type="number" id="sh-bc-percent" min="1" max="100" value="100" style="width:80px;border:1.5px solid #e2e8f0;border-radius:10px;padding:6px 10px;font-weight:700;text-align:center">
          <span style="font-weight:700;color:#64748b">%</span>
        </div>

        <div style="margin-top:18px;padding-top:14px;border-top:2px dashed #e2e8f0">
          <div style="font-weight:800;color:#334155;margin-bottom:8px;font-size:13px">
            <i class="fas fa-clock-rotate-left" style="color:#64748b;margin-right:6px"></i>ประวัติการแปลงคะแนน
          </div>
          <div id="sh-bc-history" style="max-height:200px;overflow:auto;display:flex;flex-direction:column;gap:8px"></div>
        </div>

        <div style="display:flex;gap:10px;margin-top:20px">
          <button type="button" onclick="document.getElementById('sh-bonus-merge-modal').classList.add('hidden')" style="flex:1;background:#f1f5f9;color:#334155;border:none;border-radius:12px;padding:10px;font-weight:800;cursor:pointer">ปิด</button>
          <button type="button" onclick="W.applyBonusConversion()" style="flex:2;background:#059669;color:#fff;border:none;border-radius:12px;padding:10px;font-weight:800;cursor:pointer">ดำเนินการแปลง</button>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    W.updateBonusConvUI();
  };

  W.updateBonusConvUI = function(){
    const target = byId('sh-bc-target').value;
    const weekBox = byId('sh-bc-week-select-box');
    if (target === 'week') weekBox.style.display = 'block';
    else weekBox.style.display = 'none';
    W.renderBonusConvHistory();
  };

  W.renderBonusConvHistory = function(){
    const cid = getCid();
    const st = getState();
    if (!st.bonusConversions) st.bonusConversions = {};
    const convs = st.bonusConversions[cid] || [];
    const container = byId('sh-bc-history');
    if (!container) return;

    if (convs.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:20px;color:#94a3b8;font-size:12px;border:1.5px dashed #f1f5f9;border-radius:12px">ยังไม่มีประวัติการแปลง</div>';
      return;
    }

    container.innerHTML = convs.map((c, idx) => {
      const date = new Date(c.timestamp).toLocaleString('th-TH', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
      const targetText = c.target === 'total' ? 'คะแนนรวม' : 'สัปดาห์ที่ ' + c.weekNum;
      return `
        <div style="display:flex;align-items:center;justify-content:between;padding:10px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;gap:8px">
          <div style="flex:1">
            <div style="font-size:13px;font-weight:800;color:#1e293b">เข้า ${targetText}</div>
            <div style="font-size:10px;color:#94a3b8;font-weight:700">${date} • ${c.percent}%</div>
          </div>
          <button onclick="W.deleteBonusConversion('${c.id}')" style="background:none;border:none;color:#fb7185;cursor:pointer;padding:4px;font-size:14px"><i class="fas fa-trash-alt"></i></button>
        </div>
      `;
    }).join('');
  };

  W.applyBonusConversion = async function(){
    const cid = getCid();
    if (!cid) return;
    const target = byId('sh-bc-target').value;
    const percent = parseFloat(byId('sh-bc-percent').value) || 0;
    const weekNum = target === 'week' ? byId('sh-bc-week-num').value : null;

    if (percent <= 0 || percent > 100) {
      if (W.showCustomAlert) W.showCustomAlert('ค่าไม่ถูกต้อง','กรุณาระบุสัดส่วนการแปลงระหว่าง 1-100%', true);
      return;
    }
    if (target === 'week' && !weekNum) {
      if (W.showCustomAlert) W.showCustomAlert('ไม่ได้เลือกสัปดาห์','กรุณาเลือกสัปดาห์ที่ต้องการแปลงเข้า', true);
      return;
    }

    const st = getState();
    const students = (typeof W.getCourseStudents === 'function') ? W.getCourseStudents(cid) : [];
    const bonusByCid = (st.bonusScores && st.bonusScores[cid]) || {};
    
    const conversionResult = {};
    students.forEach(s => {
      let totalBonus = 0;
      Object.keys(bonusByCid).forEach(wk => {
        if (wk.startsWith('w')) {
          const val = bonusByCid[wk] && bonusByCid[wk][s.id];
          if (val !== undefined && val !== '' && !isNaN(Number(val))) totalBonus += Number(val);
        }
      });
      if (totalBonus > 0) {
        conversionResult[s.id] = totalBonus * (percent / 100);
      }
    });

    if (Object.keys(conversionResult).length === 0) {
      if (W.showCustomAlert) W.showCustomAlert('ไม่มีคะแนน','ยังไม่มีคะแนนโบนัสให้นักเรียนคนใดเลย จึงไม่สามารถแปลงได้', true);
      return;
    }

    if (!st.bonusConversions) st.bonusConversions = {};
    if (!st.bonusConversions[cid]) st.bonusConversions[cid] = [];

    const newConv = {
      id: 'bc-' + Date.now(),
      timestamp: Date.now(),
      target: target,
      weekNum: weekNum,
      percent: percent,
      data: conversionResult
    };

    st.bonusConversions[cid].push(newConv);
    await dbSave();

    if (W.showCustomAlert) W.showCustomAlert('สำเร็จ','แปลงคะแนนโบนัสเรียบร้อยแล้ว');
    W.renderBonusConvHistory();
    if (typeof W.renderCourseOverview === 'function') W.renderCourseOverview();
  };

  W.deleteBonusConversion = async function(convId){
    const cid = getCid();
    if (!cid || !convId) return;
    
    if (typeof W.showCustomConfirm === 'function') {
      W.showCustomConfirm('ยืนยันการลบ','ต้องการยกเลิกการแปลงคะแนนรายการนี้ใช่หรือไม่? คะแนนที่ถูกบวกไปจะถูกนำออก', async function(){
        const st = getState();
        if (st.bonusConversions && st.bonusConversions[cid]) {
          st.bonusConversions[cid] = st.bonusConversions[cid].filter(c => c.id !== convId);
          await dbSave();
          W.renderBonusConvHistory();
          if (typeof W.renderCourseOverview === 'function') W.renderCourseOverview();
        }
      });
    }
  };

})(window);
