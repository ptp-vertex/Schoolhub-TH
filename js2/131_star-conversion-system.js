
(function(W){
  'use strict';
  
  if (W.__schoolhubStarConversionSystem) return;
  W.__schoolhubStarConversionSystem = true;

  function esc(v){ try { return W.escapeHTML ? W.escapeHTML(v) : String(v||'').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); } catch(e){ return String(v||''); } }
  function byId(id){ return document.getElementById(id); }
  function getState(){ return W.state || {}; }
  function getCid(){ return W.currentActiveCourseId || null; }
  async function dbSave(){ if(typeof W.saveStateToDB==='function') return W.saveStateToDB(); return Promise.resolve(); }

  W.openStarConversionPopup = function(){
    const cid = getCid();
    if (!cid) {
      if (W.showCustomAlert) W.showCustomAlert('ไม่พบวิชาที่เลือก','กรุณาเปิดวิชาก่อนใช้งานฟีเจอร์นี้', true);
      return;
    }

    const starCourseData = (getState().starGroups && getState().starGroups[cid]) || {};
    let starSets = starCourseData.sets || [];
    if (starSets.length === 0 && starCourseData.groups) {
      starSets = [{ id: 'set_1', name: 'เซตที่ 1', groups: starCourseData.groups, weekStars: starCourseData.weekStars || {} }];
      if (!getState().starGroups[cid].sets) getState().starGroups[cid].sets = starSets;
    }
    if (starSets.length === 0) {
      if (W.showCustomAlert) W.showCustomAlert('ไม่พบกลุ่ม','กรุณาสร้างกลุ่มนักเรียนก่อนแปลงคะแนน', true);
      return;
    }

    let modal = byId('sh-star-merge-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'sh-star-merge-modal';
      modal.className = 'sh-overlay hidden';
      document.body.appendChild(modal);
    }

    const setOptions = starSets.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
    const plans = (getState().coursePlans && getState().coursePlans[cid]) || [];
    const weekOptions = plans.map(p => `<option value="${p.week}">สัปดาห์ที่ ${p.week} (${p.title})</option>`).join('');

    modal.innerHTML = `
      <div style="background:#fff;border-radius:20px;max-width:480px;width:100%;max-height:86vh;overflow:auto;padding:22px">
        <h3 style="font-weight:900;font-size:18px;margin-bottom:4px">
          <i class="fas fa-star" style="color:#d97706;margin-right:6px"></i>จัดการการแปลงคะแนนดาวกลุ่ม
        </h3>
        <p style="color:#64748b;font-size:12px;margin-bottom:14px">
          เฉลี่ยคะแนนตามลำดับดาวของกลุ่มและแปลงเข้าสู่คะแนนเก็บหรือคะแนนรวม
        </p>
        
        <div style="margin-bottom:14px">
          <label style="display:block;font-size:13px;font-weight:700;color:#475569;margin-bottom:6px">เลือกเซตกลุ่ม:</label>
          <select id="sh-sc-set-id" style="width:100%;border:1.5px solid #e2e8f0;border-radius:12px;padding:8px 12px;font-size:14px;outline:none" onchange="W.updateStarConvPreview()">
            ${setOptions}
          </select>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
          <div style="background:#f0fdf4;border:1px solid #dcfce7;border-radius:14px;padding:10px">
            <label style="display:block;font-size:11px;font-weight:800;color:#166534;margin-bottom:4px">คะแนนสูงสุด (ที่ 1)</label>
            <input type="number" id="sh-sc-max-score" value="20" style="width:100%;border:1px solid #bbf7d0;border-radius:10px;padding:6px;text-align:center;font-weight:800" oninput="W.updateStarConvPreview()">
          </div>
          <div style="background:#fff1f2;border:1px solid #ffe4e6;border-radius:14px;padding:10px">
            <label style="display:block;font-size:11px;font-weight:800;color:#9f1239;margin-bottom:4px">คะแนนต่ำสุด (โหล)</label>
            <input type="number" id="sh-sc-min-score" value="10" style="width:100%;border:1px solid #fecdd3;border-radius:10px;padding:6px;text-align:center;font-weight:800" oninput="W.updateStarConvPreview()">
          </div>
        </div>

        <div style="margin-bottom:14px">
          <label style="display:block;font-size:13px;font-weight:700;color:#475569;margin-bottom:6px">เป้าหมายการแปลง:</label>
          <select id="sh-sc-target" style="width:100%;border:1.5px solid #e2e8f0;border-radius:12px;padding:8px 12px;font-size:14px;outline:none" onchange="W.updateStarConvUI()">
            <option value="total">แปลงเข้าคะแนนรวมโดยตรง (Total)</option>
            <option value="week">แปลงเข้าสัปดาห์คะแนน (Week)</option>
          </select>
        </div>

        <div id="sh-sc-week-select-box" style="margin-bottom:14px;display:none">
          <label style="display:block;font-size:13px;font-weight:700;color:#4f46e5;margin-bottom:6px">เลือกสัปดาห์ที่ต้องการแปลงเข้า:</label>
          <select id="sh-sc-week-num" style="width:100%;border:1.5px solid #c7d2fe;border-radius:12px;padding:8px 12px;font-size:14px;outline:none">
            ${weekOptions || '<option value="">-- ยังไม่มีแผนการสอน --</option>'}
          </select>
        </div>

        <div id="sh-sc-preview-list" style="margin-bottom:16px;display:flex;flex-direction:column;gap:6px"></div>

        <div style="margin-top:18px;padding-top:14px;border-top:2px dashed #e2e8f0">
          <div style="font-weight:800;color:#334155;margin-bottom:8px;font-size:13px">
            <i class="fas fa-clock-rotate-left" style="color:#64748b;margin-right:6px"></i>ประวัติการแปลงคะแนนดาว
          </div>
          <div id="sh-sc-history" style="max-height:180px;overflow:auto;display:flex;flex-direction:column;gap:8px"></div>
        </div>

        <div style="display:flex;gap:10px;margin-top:20px">
          <button type="button" onclick="document.getElementById('sh-star-merge-modal').classList.add('hidden')" style="flex:1;background:#f1f5f9;color:#334155;border:none;border-radius:12px;padding:10px;font-weight:800;cursor:pointer">ปิด</button>
          <button type="button" onclick="W.applyStarConversion()" style="flex:2;background:#d97706;color:#fff;border:none;border-radius:12px;padding:10px;font-weight:800;cursor:pointer">ดำเนินการแปลง</button>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    W.updateStarConvUI();
  };

  W.updateStarConvUI = function(){
    const target = byId('sh-sc-target').value;
    const weekBox = byId('sh-sc-week-select-box');
    if (target === 'week') weekBox.style.display = 'block';
    else weekBox.style.display = 'none';
    W.updateStarConvPreview();
    W.renderStarConvHistory();
  };

  W.updateStarConvPreview = function(){
    const cid = getCid();
    const setId = byId('sh-sc-set-id').value;
    const maxS = parseFloat(byId('sh-sc-max-score').value) || 0;
    const minS = parseFloat(byId('sh-sc-min-score').value) || 0;
    
    const starCourseData = (getState().starGroups && getState().starGroups[cid]) || {};
    const starSets = starCourseData.sets || [];
    const currentSet = starSets.find(s => s.id === setId);
    if (!currentSet) return;

    const groups = currentSet.groups || [];
    const weekStars = currentSet.weekStars || {};
    
    const groupData = groups.map(g => {
      let stars = 0;
      Object.keys(weekStars).forEach(wk => { stars += (weekStars[wk][g.id] || 0); });
      return { id: g.id, name: g.name, stars: stars };
    });

    groupData.sort((a, b) => b.stars - a.stars);

    let currentRank = 0;
    let lastStars = -1;
    groupData.forEach((g, i) => {
      if (g.stars !== lastStars) {
        currentRank = i + 1;
        lastStars = g.stars;
      }
      g.rank = currentRank;
    });

    const uniqueRanks = Array.from(new Set(groupData.map(g => g.rank))).sort((a,b) => a-b);
    const totalUnique = uniqueRanks.length;

    groupData.forEach(g => {
      if (totalUnique <= 1) {
        g.scaledScore = maxS;
      } else {
        const rankIdx = uniqueRanks.indexOf(g.rank);
        g.scaledScore = maxS - (rankIdx * (maxS - minS) / (totalUnique - 1));
      }
      g.scaledScore = Math.round(g.scaledScore * 100) / 100;
    });

    let previewHtml = `<div style="font-size:10px;font-weight:900;color:#94a3b8;text-transform:uppercase;margin-bottom:4px">พรีวิวการแปลง (เฉลี่ยตามลำดับ)</div>`;
    previewHtml += groupData.map(g => `
      <div style="display:flex;align-items:center;justify-content:between;padding:8px 10px;background:#fff;border:1px solid #f1f5f9;border-radius:10px">
        <div style="flex:1;display:flex;align-items:center;gap:8px">
          <div style="width:20px;height:20px;background:#fef3c7;color:#d97706;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900">${g.rank}</div>
          <div>
            <div style="font-size:12px;font-weight:800;color:#334155">${esc(g.name)}</div>
            <div style="font-size:9px;color:#94a3b8">${g.stars} ⭐</div>
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:13px;font-weight:900;color:#059669">${W.formatScoreDisplay ? W.formatScoreDisplay(g.scaledScore, 2) : g.scaledScore}</div>
        </div>
      </div>
    `).join('');

    byId('sh-sc-preview-list').innerHTML = previewHtml;
    W.__currentStarGroupData = { setId, groupData };
  };

  W.renderStarConvHistory = function(){
    const cid = getCid();
    const st = getState();
    if (!st.starConversions) st.starConversions = {};
    const convs = st.starConversions[cid] || [];
    const container = byId('sh-sc-history');
    if (!container) return;

    if (convs.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:20px;color:#94a3b8;font-size:12px;border:1.5px dashed #f1f5f9;border-radius:12px">ยังไม่มีประวัติการแปลงดาว</div>';
      return;
    }

    container.innerHTML = convs.map((c, idx) => {
      const date = new Date(c.timestamp).toLocaleString('th-TH', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
      const targetText = c.target === 'total' ? 'คะแนนรวม' : 'สัปดาห์ที่ ' + c.weekNum;
      return `
        <div style="display:flex;align-items:center;justify-content:between;padding:10px 12px;background:#fffaf5;border:1px solid #fed7aa;border-radius:12px;gap:8px">
          <div style="flex:1">
            <div style="font-size:13px;font-weight:800;color:#9a3412">เข้า ${targetText}</div>
            <div style="font-size:10px;color:#c2410c;font-weight:700">${date} • เซต ${esc(c.setName)}</div>
          </div>
          <button onclick="W.deleteStarConversion('${c.id}')" style="background:none;border:none;color:#fb7185;cursor:pointer;padding:4px;font-size:14px"><i class="fas fa-trash-alt"></i></button>
        </div>
      `;
    }).join('');
  };

  W.applyStarConversion = async function(){
    const cid = getCid();
    if (!cid || !W.__currentStarGroupData) return;
    
    const { setId, groupData } = W.__currentStarGroupData;
    const target = byId('sh-sc-target').value;
    const weekNum = target === 'week' ? byId('sh-sc-week-num').value : null;

    if (target === 'week' && !weekNum) {
      if (W.showCustomAlert) W.showCustomAlert('ไม่ได้เลือกสัปดาห์','กรุณาเลือกสัปดาห์ที่ต้องการแปลงเข้า', true);
      return;
    }

    const st = getState();
    const starCourseData = st.starGroups[cid];
    const currentSet = starCourseData.sets.find(s => s.id === setId);
    
    const conversionResult = {};
    groupData.forEach(g => {
      const groupObj = currentSet.groups.find(x => x.id === g.id);
      if (groupObj && groupObj.members) {
        groupObj.members.forEach(sid => {
          conversionResult[sid] = (conversionResult[sid] || 0) + g.scaledScore;
        });
      }
    });

    if (!st.starConversions) st.starConversions = {};
    if (!st.starConversions[cid]) st.starConversions[cid] = [];

    const newConv = {
      id: 'sc-' + Date.now(),
      timestamp: Date.now(),
      target: target,
      weekNum: weekNum,
      setId: setId,
      setName: currentSet.name,
      data: conversionResult
    };

    st.starConversions[cid].push(newConv);
    await dbSave();

    if (W.showCustomAlert) W.showCustomAlert('สำเร็จ','แปลงคะแนนดาวกลุ่มเรียบร้อยแล้ว');
    W.renderStarConvHistory();
    if (typeof W.renderCourseOverview === 'function') W.renderCourseOverview();
  };

  W.deleteStarConversion = async function(convId){
    const cid = getCid();
    if (!cid || !convId) return;
    
    if (typeof W.showCustomConfirm === 'function') {
      W.showCustomConfirm('ยืนยันการลบ','ต้องการยกเลิกการแปลงคะแนนดาวรายการนี้ใช่หรือไม่? คะแนนที่ถูกบวกไปจะถูกนำออก', async function(){
        const st = getState();
        if (st.starConversions && st.starConversions[cid]) {
          st.starConversions[cid] = st.starConversions[cid].filter(c => c.id !== convId);
          await dbSave();
          W.renderStarConvHistory();
          if (typeof W.renderCourseOverview === 'function') W.renderCourseOverview();
        }
      });
    }
  };

})(window);
