
(function(){
  if (window.__schoolhubStarConversionRankingPatch) return;
  window.__schoolhubStarConversionRankingPatch = true;

  function esc(v){ try { return window.escapeHTML ? window.escapeHTML(v) : String(v||'').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); } catch(e){ return String(v||''); } }

  // 0. ตัวจับดับเบิลคลิกแบบ delegation ที่ document (ยิงก่อนใครทั้งหมดในเฟส capture
  //    และไม่สนใจว่า <th> ตัวเดิมจะถูกสร้างใหม่ระหว่างคลิกที่ 1 กับ 2 หรือไม่)
  var STAR_HEADER_SELECTOR = '[data-sh-stargroup-header="1"]';
  if (!window.__schoolhubStarHeaderDblClickInstalled) {
    window.__schoolhubStarHeaderDblClickInstalled = true;
    var lastStarHeaderTapAt = 0;
    function tryOpenStarConversion(e){
      var el = e.target && e.target.closest ? e.target.closest(STAR_HEADER_SELECTOR) : null;
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      if (typeof window.openStarConversionPopup === 'function') window.openStarConversionPopup();
    }
    // ทางหลัก: dblclick ของเบราว์เซอร์เอง (เร็วและตรงไปตรงมาที่สุดเมื่อทำงานได้)
    document.addEventListener('dblclick', tryOpenStarConversion, true);
    // ทางสำรอง: จับจังหวะคลิกสองครั้งด้วยเวลาเอง เผื่อกรณี dblclick ของเบราว์เซอร์ไม่ยิง
    // (เช่น องค์ประกอบถูกสร้างใหม่ระหว่างคลิกที่ 1 กับ 2 ทำให้เบราว์เซอร์ไม่นับเป็นดับเบิลคลิก)
    document.addEventListener('click', function(e){
      var el = e.target && e.target.closest ? e.target.closest(STAR_HEADER_SELECTOR) : null;
      if (!el) return;
      var now = Date.now();
      if (now - lastStarHeaderTapAt < 420) {
        lastStarHeaderTapAt = 0;
        tryOpenStarConversion(e);
      } else {
        lastStarHeaderTapAt = now;
      }
    }, true);
  }

  // 1. ซ่อมดาวและโบนัสในหน้า Overview
  var oldRender = window.renderCourseOverview;
  window.renderCourseOverview = function(){
    if (typeof oldRender !== 'function') return;
    var cid = window.currentActiveCourseId;
    var res = oldRender.apply(this, arguments);
    var table = document.getElementById('course-summary-table');
    if (!table || !cid || !window.state) return res;

    var thead = table.querySelector('thead tr');
    if (thead && !thead.querySelector('.sh-stargroup-col')) {
      var target = thead.querySelector('.summary-grade-col') || thead.querySelector('.summary-total-col');
      if (target) {
        var bonusTh = document.createElement('th');
        bonusTh.className = 'text-center bg-rose-50 text-rose-700 font-bold sh-bonusgroup-col border-r';
        bonusTh.innerHTML = 'โบนัส';
        thead.insertBefore(bonusTh, target);

        var starTh = document.createElement('th');
        starTh.className = 'text-center bg-amber-50 text-amber-700 font-bold sh-stargroup-col border-r cursor-pointer hover:bg-amber-100 transition select-none';
        starTh.title = 'ดับเบิลคลิกเพื่อแปลงคะแนนดาวกลุ่ม';
        starTh.setAttribute('data-sh-stargroup-header', '1');

        // เก็บ addEventListener ตรงตัว th ไว้ด้วยเป็นชั้นป้องกันซ้อน (เผื่อ delegation ถูกบล็อกในบางเคส)
        starTh.addEventListener('dblclick', function(e){
          e.preventDefault();
          e.stopPropagation();
          window.openStarConversionPopup();
        }, true);

        // เพิ่มคำอธิบาย "Double Click" ให้ชัดเจน
        starTh.innerHTML = '<div class="flex flex-col items-center gap-1"><span>ดาวกลุ่ม</span><div class="text-[9px] bg-amber-600 text-white px-1.5 py-0.5 rounded shadow-sm font-black uppercase tracking-tighter animate-pulse">Double Click</div></div>';
        thead.insertBefore(starTh, target);
      }
    }


    var overview = window.getOverviewStudents ? window.getOverviewStudents(cid) : {students:[]};
    var courseStudents = overview.students;
    var rows = table.querySelectorAll('tbody tr');
    var starCourseData = (state.starGroups && state.starGroups[cid]) || {};
    var starSets = starCourseData.sets || [];
    var bonusByCid = (state.bonusScores && state.bonusScores[cid]) || {};

    rows.forEach(function(row, idx){
      var st = courseStudents[idx];
      if (!st || row.querySelector('.sh-stargroup-col')) return;
      var target = row.querySelector('.summary-grade-col') || row.querySelector('.summary-total-col');
      if (target) {
        var totalBonus = 0;
        Object.keys(bonusByCid).forEach(function(wk){
          var val = bonusByCid[wk] && bonusByCid[wk][st.id];
          if (val !== undefined && val !== '' && !isNaN(Number(val))) totalBonus += Number(val);
        });

        var totalStars = 0;
        starSets.forEach(function(s){
          var groups = s.groups || [];
          var weekStars = s.weekStars || {};
          var studentGroups = groups.filter(function(g){ return (g.members||[]).indexOf(st.id) !== -1; });
          Object.keys(weekStars).forEach(function(wk){
            var weekData = weekStars[wk] || {};
            studentGroups.forEach(function(g){ totalStars += (weekData[g.id] || 0); });
          });
        });

        var bonusTd = document.createElement('td');
        bonusTd.className = 'text-center font-bold text-rose-600 bg-rose-50/30 sh-bonusgroup-col border-r';
        bonusTd.innerHTML = totalBonus > 0 ? '+' + window.formatScoreDisplay(totalBonus, 2) : '-';
        row.insertBefore(bonusTd, target);

        var starTd = document.createElement('td');
        starTd.className = 'text-center font-bold text-amber-600 bg-amber-50/30 sh-stargroup-col border-r';
        starTd.innerHTML = totalStars > 0 ? totalStars + ' ⭐' : '-';
        row.insertBefore(starTd, target);
      }
    });
    return res;
  };

  // 2. ป็อปอัพแปลงคะแนนดาวกลุ่ม
  window.openStarConversionPopup = function(){
   try {
    var cid = window.currentActiveCourseId;
    if (!cid) {
      if (window.showCustomAlert) window.showCustomAlert('ไม่พบวิชาที่เลือก','กรุณาเปิดวิชาก่อนใช้งานฟีเจอร์นี้', true);
      return;
    }
    if(typeof window.schoolhubPlanAllows === 'function' && !window.schoolhubPlanAllows('allowStars')) {
      if(typeof window.showCustomAlert === 'function') window.showCustomAlert('ไม่มีสิทธิ์ใช้งาน','แผนปัจจุบันไม่รองรับระบบดาว กรุณาอัปเกรดแผน', true);
      return;
    }

    var starCourseData = (state.starGroups && state.starGroups[cid]) || {};
    var starSets = starCourseData.sets || [];

    if (starSets.length === 0) {
      if (window.showCustomAlert) window.showCustomAlert('ไม่พบเซ็ทกลุ่ม','กรุณาสร้างเซ็ทกลุ่มนักเรียนก่อนแปลงคะแนน', true);
      return;
    }

    var pop = document.getElementById('star-conversion-popup');
    if (!pop) {
      pop = document.createElement('div');
      pop.id = 'star-conversion-popup';
      document.body.appendChild(pop);
    }
    // ใช้สไตล์ป็อปอัพมาตรฐานเดียวกับระบบโบนัส (sh-overlay/sh-modal-box) แต่ธีมสีเป็นของระบบดาว (ส้มอำพัน)
    pop.className = 'sh-overlay';

    var setOptions = starSets.map((s, i) => `<option value="${s.id}">${esc(s.name)}</option>`).join('');

    var plans = ((state.coursePlans && state.coursePlans[cid]) || []).slice().sort((a,b) => a.week - b.week);
    var planOptions = plans.length
      ? plans.map(p => `<option value="${p.id}">สัปดาห์ ${esc(p.week)} — ${esc(p.title)} (เต็ม ${esc(p.maxScore)})</option>`).join('')
      : '<option value="">-- ยังไม่มีแผนคะแนนในวิชานี้ --</option>';

    pop.innerHTML = `
      <div class="sh-modal-box" style="max-width:560px">
        <div class="sh-modal-header" style="background:#d97706;border-bottom:none">
          <h3 style="color:#fff"><i class="fas fa-star" style="margin-right:8px"></i>แปลงคะแนนดาวกลุ่ม</h3>
          <button class="sh-modal-close" onclick="document.getElementById('star-conversion-popup').classList.add('hidden')" style="background:rgba(255,255,255,.2);border-color:transparent;color:#fff"><i class="fas fa-times"></i></button>
        </div>
        <div class="sh-modal-body">
          <div class="sh-week-row">
            <label><i class="fas fa-layer-group" style="color:#d97706;margin-right:4px"></i>เลือกเซตกลุ่ม</label>
            <select id="conversion-set-id" style="flex:1;min-width:160px" onchange="window.updateConversionPreview()">${setOptions}</select>
          </div>

          <div class="sh-week-row">
            <label><i class="fas fa-route" style="color:#d97706;margin-right:4px"></i>แปลงเข้า</label>
            <select id="conversion-dest" style="flex:1;min-width:160px" onchange="window.onConversionDestChange()">
              <option value="bonus">คะแนนโบนัส</option>
              <option value="week">คะแนนในสัปดาห์ (แผนคะแนนที่มีอยู่)</option>
            </select>
          </div>

          <div class="sh-week-row" id="conversion-plan-row" style="display:none">
            <label><i class="fas fa-calendar-week" style="color:#d97706;margin-right:4px"></i>เลือกงาน</label>
            <select id="conversion-plan-id" style="flex:1;min-width:160px" onchange="window.updateConversionPreview()">${planOptions}</select>
          </div>

          <div class="sh-week-row">
            <label style="color:#059669">คะแนนสูงสุด (ที่ 1)</label>
            <input type="number" id="conv-max-score" style="width:90px" value="20" oninput="window.updateConversionPreview()">
            <label style="color:#e11d48">คะแนนต่ำสุด (โหล)</label>
            <input type="number" id="conv-min-score" style="width:90px" value="10" oninput="window.updateConversionPreview()">
          </div>

          <table class="sh-bonus-table">
            <thead><tr><th width="40" style="text-align:center">ลำดับ</th><th>กลุ่ม</th><th style="text-align:center">ดาวรวม</th><th style="text-align:center">คะแนนที่แปลง</th></tr></thead>
            <tbody id="conversion-preview-list"></tbody>
          </table>
        </div>
        <div class="sh-modal-footer">
          <button class="sh-btn-cancel" onclick="document.getElementById('star-conversion-popup').classList.add('hidden')">ยกเลิก</button>
          <button class="sh-btn-save-amber" onclick="window.applyStarConversion()"><i class="fas fa-save mr-1"></i>บันทึกคะแนน</button>
        </div>
      </div>
    `;

    pop.classList.remove('hidden');
    window.updateConversionPreview();
   } catch(err) {
    console.error('[schoolhub-star-conversion] openStarConversionPopup error:', err);
    if (window.showCustomAlert) window.showCustomAlert('เกิดข้อผิดพลาด', 'ไม่สามารถเปิดหน้าต่างแปลงคะแนนได้ กรุณาลองใหม่หรือรีเฟรชหน้า', true);
   }
  };

  // สลับการแสดง "เลือกงาน" ตามปลายทางที่เลือก — เลือก "แปลงเข้าโบนัส" ไม่ต้องเลือกสัปดาห์/งาน
  window.onConversionDestChange = function(){
    var dest = document.getElementById('conversion-dest').value;
    var row = document.getElementById('conversion-plan-row');
    if (row) row.style.display = (dest === 'week') ? '' : 'none';
    window.updateConversionPreview();
  };


  window.updateConversionPreview = function(){
    var cid = window.currentActiveCourseId;
    var setId = document.getElementById('conversion-set-id').value;
    var dest = document.getElementById('conversion-dest') ? document.getElementById('conversion-dest').value : 'bonus';
    var maxInput = document.getElementById('conv-max-score');

    // แปลงเข้าสัปดาห์: ล็อกคะแนนสูงสุดให้เท่ากับคะแนนเต็มของงานที่เลือกเสมอ (กันแปลงคะแนนเกินคะแนนเต็มของงานนั้น)
    if (dest === 'week') {
      var planId = document.getElementById('conversion-plan-id') ? document.getElementById('conversion-plan-id').value : '';
      var plan = ((state.coursePlans && state.coursePlans[cid]) || []).find(p => p.id === planId);
      if (plan) { maxInput.value = plan.maxScore; maxInput.setAttribute('readonly', 'readonly'); }
    } else {
      maxInput.removeAttribute('readonly');
    }

    var maxS = parseFloat(maxInput.value) || 0;
    var minS = parseFloat(document.getElementById('conv-min-score').value) || 0;

    var starCourseData = (state.starGroups && state.starGroups[cid]) || {};
    var starSets = starCourseData.sets || [];
    var currentSet = starSets.find(s => s.id === setId);
    if (!currentSet) return;

    var groups = currentSet.groups || [];
    var weekStars = currentSet.weekStars || {};

    var groupData = groups.map(g => {
      var stars = 0;
      Object.keys(weekStars).forEach(wk => { stars += (weekStars[wk][g.id] || 0); });
      return { id: g.id, name: g.name, stars: stars };
    });

    groupData.sort((a, b) => b.stars - a.stars);

    var currentRank = 0;
    var lastStars = -1;
    groupData.forEach((g, i) => {
      if (g.stars !== lastStars) {
        currentRank = i + 1;
        lastStars = g.stars;
      }
      g.rank = currentRank;
    });

    var uniqueRanks = Array.from(new Set(groupData.map(g => g.rank))).sort((a,b) => a-b);
    var totalUnique = uniqueRanks.length;

    groupData.forEach(g => {
      if (totalUnique <= 1) {
        g.scaledScore = maxS;
      } else {
        var rankIdx = uniqueRanks.indexOf(g.rank);
        g.scaledScore = maxS - (rankIdx * (maxS - minS) / (totalUnique - 1));
      }
      g.scaledScore = Math.round(g.scaledScore * 100) / 100;
    });

    var previewHtml = groupData.map(g => `
      <tr>
        <td style="text-align:center;font-weight:800;color:#92400e">#${g.rank}</td>
        <td style="font-weight:700;color:#1e293b">${esc(g.name)}</td>
        <td style="text-align:center">${g.stars} ⭐</td>
        <td style="text-align:center;font-weight:800;color:#d97706">${window.formatScoreDisplay(g.scaledScore, 2)}</td>
      </tr>
    `).join('');

    var listEl = document.getElementById('conversion-preview-list');
    if (listEl) listEl.innerHTML = previewHtml;
    window.__currentGroupData = groupData;
  };

  window.applyStarConversion = async function(){
    var cid = window.currentActiveCourseId;
    if (!cid || !window.__currentGroupData) return;

    var groupData = window.__currentGroupData;
    var setId = document.getElementById('conversion-set-id').value;
    var dest = document.getElementById('conversion-dest') ? document.getElementById('conversion-dest').value : 'bonus';
    var starCourseData = (state.starGroups && state.starGroups[cid]) || {};
    var currentSet = (starCourseData.sets || []).find(s => s.id === setId);
    if (!currentSet) return;

    if (dest === 'week') {
      // แปลงเข้าคะแนนของสัปดาห์/งานที่มีอยู่จริง (state.scores ผูกกับ courseId + week + title ของแผนคะแนน)
      var planId = document.getElementById('conversion-plan-id') ? document.getElementById('conversion-plan-id').value : '';
      var plan = ((state.coursePlans && state.coursePlans[cid]) || []).find(p => p.id === planId);
      if (!plan) {
        if (window.showCustomAlert) window.showCustomAlert('กรุณาเลือกงาน', 'กรุณาเลือกสัปดาห์ / งานที่จะนำคะแนนไปใส่ก่อนบันทึก', true);
        return;
      }
      if (!state.scores) state.scores = [];
      var idx = state.scores.findIndex(s => s.courseId === cid && String(s.week) === String(plan.week) && s.title === plan.title);
      var recordsObj = idx !== -1 ? Object.assign({}, state.scores[idx].records) : {};

      groupData.forEach(g => {
        var groupObj = currentSet.groups.find(x => x.id === g.id);
        if (groupObj && groupObj.members) {
          groupObj.members.forEach(stId => {
            recordsObj[stId] = Math.max(0, Math.min(g.scaledScore, plan.maxScore));
          });
        }
      });

      if (idx !== -1) {
        state.scores[idx].records = recordsObj;
        state.scores[idx].maxScore = plan.maxScore;
        state.scores[idx].savedAt = Date.now();
      } else {
        state.scores.push({ id: Date.now().toString(), courseId: cid, week: plan.week, title: plan.title, maxScore: plan.maxScore, records: recordsObj, savedAt: Date.now() });
      }
    } else {
      // แปลงเข้าคะแนนโบนัส (พฤติกรรมเดิม)
      var week = 'Bonus-Stars-' + setId;
      if (!state.bonusScores) state.bonusScores = {};
      if (!state.bonusScores[cid]) state.bonusScores[cid] = {};
      if (!state.bonusScores[cid][week]) state.bonusScores[cid][week] = {};

      groupData.forEach(g => {
        var groupObj = currentSet.groups.find(x => x.id === g.id);
        if (groupObj && groupObj.members) {
          groupObj.members.forEach(stId => {
            state.bonusScores[cid][week][stId] = g.scaledScore;
          });
        }
      });
    }

    if (typeof window.saveStateToDB === 'function') await window.saveStateToDB();

    document.getElementById('star-conversion-popup').classList.add('hidden');
    if (window.showCustomAlert) window.showCustomAlert('สำเร็จ', dest === 'week' ? 'แปลงคะแนนและบันทึกลงในงานที่เลือกเรียบร้อยแล้ว' : 'แปลงคะแนนและบันทึกโบนัสเรียบร้อยแล้ว');
    if (typeof window.renderCourseOverview === 'function') window.renderCourseOverview();
  };

  setTimeout(function(){ if (typeof window.renderCourseOverview === 'function') window.renderCourseOverview(); }, 1500);
})();
