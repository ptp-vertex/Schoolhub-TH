
(function(W){
  'use strict';
  
  if (W.__schoolhubStarConversionSystem) return;
  W.__schoolhubStarConversionSystem = true;

  function esc(v){ try { return W.escapeHTML ? W.escapeHTML(v) : String(v||'').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); } catch(e){ return String(v||''); } }
  function byId(id){ return document.getElementById(id); }
  function getState(){ return W.state || {}; }
  function getCid(){ return W.currentActiveCourseId || null; }
  async function dbSave(){ if(typeof W.saveStateToDB==='function') return W.saveStateToDB(); return Promise.resolve(); }

  // ── 1. Star Conversion Popup ──────────────────────────────────────────
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

    let pop = byId('sh-star-conv-popup');
    if (!pop) {
      pop = document.createElement('div');
      pop.id = 'sh-star-conv-popup';
      pop.className = 'fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4';
      document.body.appendChild(pop);
    }

    const setOptions = starSets.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
    const plans = (getState().coursePlans && getState().coursePlans[cid]) || [];
    const weekOptions = plans.map(p => `<option value="${p.week}">สัปดาห์ที่ ${p.week} (${p.title})</option>`).join('');

    pop.innerHTML = `
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between bg-amber-500 text-white">
          <div>
            <div class="font-black text-xl">จัดการการแปลงคะแนนดาวกลุ่ม</div>
            <div class="text-xs opacity-80 text-amber-100">เฉลี่ยคะแนนตามลำดับดาวของกลุ่มและแปลงเข้าสู่คะแนนเก็บ</div>
          </div>
          <button onclick="document.getElementById('sh-star-conv-popup').classList.add('hidden')" class="w-10 h-10 flex items-center justify-center hover:bg-white/20 rounded-full transition"><i class="fas fa-times"></i></button>
        </div>
        
        <div class="p-6 overflow-y-auto flex-1 space-y-6">
          <!-- Set Selection -->
          <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <label class="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">เลือกเซตกลุ่ม</label>
            <select id="sh-sc-set-id" class="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-amber-500 outline-none" onchange="W.updateStarConvPreview()">
              ${setOptions}
            </select>
          </div>

          <!-- Score Range -->
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
              <label class="block text-xs font-black text-emerald-600 mb-2 uppercase tracking-wider">คะแนนสูงสุด (ที่ 1)</label>
              <input type="number" id="sh-sc-max-score" class="w-full bg-white border border-emerald-200 rounded-xl px-4 py-2 font-bold text-center" value="20" oninput="W.updateStarConvPreview()">
            </div>
            <div class="bg-rose-50 p-4 rounded-2xl border border-rose-100">
              <label class="block text-xs font-black text-rose-600 mb-2 uppercase tracking-wider">คะแนนต่ำสุด (โหล)</label>
              <input type="number" id="sh-sc-min-score" class="w-full bg-white border border-rose-200 rounded-xl px-4 py-2 font-bold text-center" value="10" oninput="W.updateStarConvPreview()">
            </div>
          </div>

          <!-- Target Selection -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <label class="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">เป้าหมายการแปลง</label>
              <select id="sh-sc-target" class="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-amber-500 outline-none" onchange="W.updateStarConvUI()">
                <option value="total">แปลงเข้าคะแนนรวมโดยตรง (Total)</option>
                <option value="week">แปลงเข้าสัปดาห์คะแนน (Week)</option>
              </select>
            </div>
            <div id="sh-sc-week-select-box" class="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 hidden">
              <label class="block text-xs font-black text-indigo-600 mb-2 uppercase tracking-wider">เลือกสัปดาห์ที่ต้องการแปลงเข้า</label>
              <select id="sh-sc-week-num" class="w-full bg-white border border-indigo-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-indigo-500 outline-none">
                ${weekOptions || '<option value="">-- ยังไม่มีแผนการสอน --</option>'}
              </select>
            </div>
          </div>

          <!-- Preview -->
          <div id="sh-sc-preview-list" class="space-y-2"></div>

          <!-- History -->
          <div>
            <label class="block text-xs font-black text-slate-400 mb-3 uppercase tracking-wider">ประวัติการแปลงคะแนนดาว</label>
            <div id="sh-sc-history" class="space-y-2"></div>
          </div>
        </div>

        <div class="p-6 border-t border-slate-100 flex gap-3">
          <button onclick="document.getElementById('sh-star-conv-popup').classList.add('hidden')" class="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition">ปิดหน้าต่าง</button>
          <button onclick="W.applyStarConversion()" class="flex-[2] py-3 bg-amber-500 text-white font-black rounded-2xl hover:bg-amber-600 shadow-lg shadow-amber-200 transition">ดำเนินการแปลงคะแนน</button>
        </div>
      </div>
    `;

    pop.classList.remove('hidden');
    W.updateStarConvUI();
  };

  W.updateStarConvUI = function(){
    const target = byId('sh-sc-target').value;
    const weekBox = byId('sh-sc-week-select-box');
    if (target === 'week') weekBox.classList.remove('hidden');
    else weekBox.classList.add('hidden');
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

    let previewHtml = `<div class="text-[10px] font-black text-slate-400 mb-2 uppercase">พรีวิวการแปลงคะแนน (เฉลี่ยตามลำดับกลุ่ม)</div>`;
    previewHtml += groupData.map(g => `
      <div class="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
        <div class="flex items-center gap-3">
          <div class="w-6 h-6 flex items-center justify-center bg-amber-100 text-amber-700 rounded-full text-[10px] font-black">${g.rank}</div>
          <div class="min-w-0">
            <div class="text-sm font-bold text-slate-700 truncate">${esc(g.name)}</div>
            <div class="text-[10px] text-slate-400">${g.stars} ⭐</div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-sm font-black text-emerald-600">${W.formatScoreDisplay(g.scaledScore, 2)}</div>
          <div class="text-[9px] text-slate-400 uppercase font-bold">คะแนนที่จะได้</div>
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
      container.innerHTML = '<div class="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-2xl">ยังไม่มีประวัติการแปลงคะแนนดาว</div>';
      return;
    }

    container.innerHTML = convs.map((c, idx) => {
      const date = new Date(c.timestamp).toLocaleString('th-TH', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
      const typeText = c.target === 'total' ? '<span class="text-emerald-600">คะแนนรวม (Total)</span>' : `<span class="text-indigo-600">สัปดาห์ที่ ${c.weekNum}</span>`;
      return `
        <div class="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-amber-200 transition group">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-500 rounded-xl group-hover:bg-amber-50 group-hover:text-amber-600 transition">
              <i class="fas ${c.target === 'total' ? 'fa-chart-pie' : 'fa-calendar-check'}"></i>
            </div>
            <div>
              <div class="text-sm font-black text-slate-700">แปลงเข้า ${typeText}</div>
              <div class="text-[10px] text-slate-400 font-bold uppercase">${date} • เซต ${c.setName}</div>
            </div>
          </div>
          <button onclick="W.deleteStarConversion('${c.id}')" class="w-8 h-8 flex items-center justify-center text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition" title="ลบรายการนี้">
            <i class="fas fa-trash-alt"></i>
          </button>
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
