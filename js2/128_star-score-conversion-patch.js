
(function(){
  if (window.__schoolhubStarConversionRankingPatch) return;
  window.__schoolhubStarConversionRankingPatch = true;

  function esc(v){ try { return window.escapeHTML ? window.escapeHTML(v) : String(v||'').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); } catch(e){ return String(v||''); } }

  // 1. ซ่อมดาวและโบนัสที่หายไปในหน้า Overview
  var oldRender = window.renderCourseOverview;
  window.renderCourseOverview = function(){
    if (typeof oldRender !== 'function') return;
    var cid = window.currentActiveCourseId;
    var res = oldRender.apply(this, arguments);
    
    var table = document.getElementById('course-summary-table');
    if (!table || !cid || !window.state) return res;

    // แทรก Header
    var thead = table.querySelector('thead tr');
    if (thead && !thead.querySelector('.sh-star-col')) {
      var target = thead.querySelector('.summary-grade-col') || thead.querySelector('.summary-total-col');
      if (target) {
        var bonusTh = document.createElement('th');
        bonusTh.className = 'text-center bg-rose-50 text-rose-700 font-bold sh-bonus-col border-r';
        bonusTh.innerHTML = 'โบนัส';
        thead.insertBefore(bonusTh, target);

        var starTh = document.createElement('th');
        starTh.className = 'text-center bg-amber-50 text-amber-700 font-bold sh-star-col border-r cursor-pointer hover:bg-amber-100 transition';
        starTh.onclick = function(e){ e.stopPropagation(); window.openGroupRankingPopup(); };
        starTh.innerHTML = '<div class="flex flex-col items-center gap-1"><span>ดาว</span><button type="button" class="text-[10px] bg-white border border-amber-200 px-1 rounded shadow-sm text-amber-600 font-black"><i class="fas fa-trophy mr-1"></i>จัดอันดับ</button></div>';
        thead.insertBefore(starTh, target);
      }
    }

    // แทรกข้อมูลใน Body
    var overview = window.getOverviewStudents ? window.getOverviewStudents(cid) : {students:[]};
    var courseStudents = overview.students;
    var rows = table.querySelectorAll('tbody tr');
    
    var starCourseData = (state.starGroups && state.starGroups[cid]) || {};
    var starGroups = starCourseData.groups || [];
    var weekStars = starCourseData.weekStars || {};
    var bonusByCid = (state.bonusScores && state.bonusScores[cid]) || {};

    rows.forEach(function(row, idx){
      var st = courseStudents[idx];
      if (!st || row.querySelector('.sh-star-col')) return;
      
      var target = row.querySelector('.summary-grade-col') || row.querySelector('.summary-total-col');
      if (target) {
        // คำนวณโบนัส
        var totalBonus = 0;
        Object.keys(bonusByCid).forEach(function(wk){
          var val = bonusByCid[wk] && bonusByCid[wk][st.id];
          if (val !== undefined && val !== '' && !isNaN(Number(val))) totalBonus += Number(val);
        });

        // คำนวณดาว
        var totalStars = 0;
        var studentGroups = starGroups.filter(function(g){ return (g.members||[]).indexOf(st.id) !== -1; });
        Object.keys(weekStars).forEach(function(wk){
          var weekData = weekStars[wk] || {};
          studentGroups.forEach(function(g){ totalStars += (weekData[g.id] || 0); });
        });

        var bonusTd = document.createElement('td');
        bonusTd.className = 'text-center font-bold text-rose-600 bg-rose-50/30 sh-bonus-col border-r';
        bonusTd.innerHTML = totalBonus > 0 ? '+' + window.formatScoreDisplay(totalBonus, 2) : '-';
        row.insertBefore(bonusTd, target);

        var starTd = document.createElement('td');
        starTd.className = 'text-center font-bold text-amber-600 bg-amber-50/30 sh-star-col border-r';
        starTd.innerHTML = totalStars > 0 ? totalStars + ' ⭐' : '-';
        row.insertBefore(starTd, target);
      }
    });
    return res;
  };

  // 2. ระบบป็อปอัพจัดอันดับกลุ่ม
  window.openGroupRankingPopup = function(){
    var cid = window.currentActiveCourseId;
    if (!cid) return;
    
    var starCourseData = (state.starGroups && state.starGroups[cid]) || {};
    var groups = starCourseData.groups || [];
    if (groups.length === 0) {
      if (window.showCustomAlert) window.showCustomAlert('ไม่พบกลุ่ม','กรุณาสร้างกลุ่มนักเรียนก่อนจัดอันดับ', true);
      return;
    }

    var pop = document.getElementById('group-ranking-popup');
    if (!pop) {
      pop = document.createElement('div');
      pop.id = 'group-ranking-popup';
      pop.className = 'fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4';
      document.body.appendChild(pop);
    }
    
    var groupRows = groups.map(function(g){
      return '<div class="group-rank-row bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between gap-4 mb-2">'+
        '<div class="flex-1 min-w-0"><div class="font-black text-slate-800 truncate">'+esc(g.name)+'</div><div class="text-[10px] text-slate-500">'+(g.members||[]).length+' คน</div></div>'+
        '<div class="flex items-center gap-2">'+
          '<select data-group-id="'+g.id+'" class="group-rank-select bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-primary outline-none">'+
            '<option value="0">เลือกอันดับ</option>'+
            '<option value="1">🥇 ที่ 1</option>'+
            '<option value="2">🥈 ที่ 2</option>'+
            '<option value="3">🥉 ที่ 3</option>'+
          '</select>'+
        '</div>'+
      '</div>';
    }).join('');

    pop.innerHTML = '<div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">'+
      '<div class="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">'+
        '<div><div class="font-black text-xl">จัดอันดับกลุ่ม</div><div class="text-xs opacity-80">เลือกอันดับและกำหนดคะแนนที่จะบวกให้</div></div>'+
        '<button onclick="document.getElementById(\'group-ranking-popup\').classList.add(\'hidden\')" class="w-10 h-10 flex items-center justify-center hover:bg-white/20 rounded-full transition"><i class="fas fa-times"></i></button>'+
      '</div>'+
      '<div class="p-6 overflow-y-auto flex-1">'+
        '<div class="grid grid-cols-3 gap-3 mb-6">'+
          '<div class="bg-amber-50 p-3 rounded-2xl border border-amber-100 text-center">'+
            '<div class="text-xs font-black text-amber-600 mb-1">ที่ 1 (คะแนน)</div>'+
            '<input type="number" id="rank-score-1" class="w-full text-center bg-white border border-amber-200 rounded-lg py-1 font-bold" value="20">'+
          '</div>'+
          '<div class="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">'+
            '<div class="text-xs font-black text-slate-600 mb-1">ที่ 2 (คะแนน)</div>'+
            '<input type="number" id="rank-score-2" class="w-full text-center bg-white border border-slate-200 rounded-lg py-1 font-bold" value="15">'+
          '</div>'+
          '<div class="bg-orange-50 p-3 rounded-2xl border border-orange-100 text-center">'+
            '<div class="text-xs font-black text-orange-600 mb-1">ที่ 3 (คะแนน)</div>'+
            '<input type="number" id="rank-score-3" class="w-full text-center bg-white border border-orange-200 rounded-lg py-1 font-bold" value="10">'+
          '</div>'+
        '</div>'+
        '<div class="space-y-1">'+groupRows+'</div>'+
      '</div>'+
      '<div class="p-6 border-t border-slate-100 flex gap-3">'+
        '<button onclick="document.getElementById(\'group-ranking-popup\').classList.add(\'hidden\')" class="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition">ยกเลิก</button>'+
        '<button onclick="window.saveGroupRanking()" class="flex-[2] py-3 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition">บันทึกอันดับ</button>'+
      '</div>'+
    '</div>';
    
    pop.classList.remove('hidden');
  };

  window.saveGroupRanking = async function(){
    var cid = window.currentActiveCourseId;
    if (!cid) return;

    var s1 = parseFloat(document.getElementById('rank-score-1').value) || 0;
    var s2 = parseFloat(document.getElementById('rank-score-2').value) || 0;
    var s3 = parseFloat(document.getElementById('rank-score-3').value) || 0;
    var scoreMap = { '1': s1, '2': s2, '3': s3 };

    var selects = document.querySelectorAll('.group-rank-select');
    var updates = [];
    selects.forEach(function(sel){
      var gid = sel.dataset.groupId;
      var rank = sel.value;
      if (rank !== '0') {
        updates.push({ groupId: gid, rank: rank, score: scoreMap[rank] });
      }
    });

    if (updates.length === 0) {
      if (window.showCustomAlert) window.showCustomAlert('ไม่มีข้อมูล','กรุณาเลือกอันดับอย่างน้อย 1 กลุ่ม', true);
      return;
    }

    var week = '1';
    var plans = (state.coursePlans && state.coursePlans[cid]) || [];
    if (plans.length > 0) {
      var sorted = plans.slice().sort((a,b)=>Number(b.week)-Number(a.week));
      week = String(sorted[0].week);
    }

    if (!state.starGroups) state.starGroups = {};
    if (!state.starGroups[cid]) state.starGroups[cid] = { groups: [], weekStars: {} };
    if (!state.starGroups[cid].weekStars) state.starGroups[cid].weekStars = {};
    if (!state.starGroups[cid].weekStars[week]) state.starGroups[cid].weekStars[week] = {};

    updates.forEach(function(upd){
      state.starGroups[cid].weekStars[week][upd.groupId] = (state.starGroups[cid].weekStars[week][upd.groupId] || 0) + upd.score;
    });

    if (typeof window.saveStateToDB === 'function') await window.saveStateToDB();
    
    document.getElementById('group-ranking-popup').classList.add('hidden');
    if (window.showCustomAlert) window.showCustomAlert('สำเร็จ','บันทึกอันดับและบวกคะแนนดาวเรียบร้อยแล้ว');
    if (typeof window.renderCourseOverview === 'function') window.renderCourseOverview();
  };

  setTimeout(function(){ if (typeof window.renderCourseOverview === 'function') window.renderCourseOverview(); }, 1000);
})();
