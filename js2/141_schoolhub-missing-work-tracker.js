
/* =========================================================
   SchoolHub: ระบบรวบรวมงานขาดแต่ละคน (Missing Work Tracker)
   - รวมรายการ "งานที่ยังไม่ได้กรอกคะแนน (X)" และ
     "งานที่ยังไม่ส่ง (checklist)" ของทุกคนในวิชาปัจจุบัน
   - จัดกลุ่มตามรายชื่อนักเรียน เพื่อให้ครูตามงานได้ง่าย
   - เลือกดูเฉพาะบางห้องได้ (กรณีวิชามีหลายห้อง)
   - ค้นหาชื่อ/รหัสได้ + ส่งออกด้วยปุ่มเดียวเป็น Excel, PDF, รูปภาพ หรือ CSV
   - กดที่รายการเพื่อกระโดดไปหน้าให้คะแนนพร้อมไฮไลต์
   ========================================================= */
(function () {
  if (window.__schoolhubMissingWorkTracker) return;
  window.__schoolhubMissingWorkTracker = true;

  function esc(v) {
    try {
      return window.escapeHTML
        ? window.escapeHTML(v)
        : String(v ?? '').replace(/[&<>"']/g, function (m) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
          });
    } catch (e) {
      return String(v ?? '');
    }
  }

  function cls(st) {
    return (
      window.getStudentClassName
        ? window.getStudentClassName(st)
        : (st && (st.room || st.classroom || st.grade)) || '-'
    ).toString().trim() || '-';
  }

  function isWithdrawn(st) {
    try {
      return typeof window.isWithdrawnStudent === 'function' && window.isWithdrawnStudent(st);
    } catch (e) {
      return false;
    }
  }

  function isMissingVal(v) {
    try {
      return window.isMissingScoreValue ? window.isMissingScoreValue(v) : (v === undefined || v === '');
    } catch (e) {
      return v === undefined || v === '';
    }
  }

  function studentsForCourse(courseId) {
    if (!courseId || !window.state) return [];
    if (typeof window.getCourseStudents === 'function') {
      try {
        var r = window.getCourseStudents(courseId);
        if (Array.isArray(r)) return r;
      } catch (e) {}
    }
    var course = (state.courses || []).find(function (c) { return String(c.id) === String(courseId); }) || {};
    var rooms = Array.isArray(course.studentRooms) ? course.studentRooms : (Array.isArray(course.studentGrades) ? course.studentGrades : []);
    var extraIds = Array.isArray(course.extraStudentIds) ? course.extraStudentIds : [];
    return (state.students || []).filter(function (st) {
      return rooms.includes(cls(st)) || extraIds.includes(st.id);
    });
  }

  function plansForCourse(courseId) {
    return (((window.state && state.coursePlans && state.coursePlans[courseId]) || []).slice())
      .sort(function (a, b) { return Number(a.week) - Number(b.week); });
  }

  function getCourseName(courseId) {
    var course = ((window.state && state.courses) || []).find(function (c) { return String(c.id) === String(courseId); });
    return course ? (course.name || course.subject || 'วิชานี้') : 'วิชานี้';
  }

  function collectMissingWork(courseId) {
    var students = studentsForCourse(courseId).filter(function (st) { return !isWithdrawn(st); });
      students.sort(function (a, b) {
      return String(cls(a)).localeCompare(String(cls(b)), 'th', { numeric: true }) ||
        String(a.code || '').localeCompare(String(b.code || ''), 'th', { numeric: true }) ||
        String(a.name || '').localeCompare(String(b.name || ''), 'th');
    });
    // เลขที่จริงในห้อง: นับตามลำดับรายชื่อทั้งห้อง (1,2,3,...) ไม่ใช่รหัสนักเรียน
    var seatByRoom = {};
    var seatMap = {};
    students.forEach(function (st) {
      var room = cls(st);
      seatByRoom[room] = (seatByRoom[room] || 0) + 1;
      seatMap[st.id] = seatByRoom[room];
    });
    var plans = plansForCourse(courseId);
    var courseScores = ((window.state && state.scores) || []).filter(function (s) { return String(s.courseId) === String(courseId); });

    var result = [];
    students.forEach(function (st) {
      var items = [];
      var trackedWorkCount = 0;
      plans.forEach(function (p) {
        var task = courseScores.find(function (ts) { return Number(ts.week) === Number(p.week) && String(ts.title) === String(p.title); });
        if (!task) return; // ยังไม่มีการบันทึกเลย ไม่นับเป็น "งานขาด"
        trackedWorkCount++;
        var isChecklist = Number(p.maxScore) === 0;
        var raw = task.records ? task.records[st.id] : undefined;
        if (isChecklist) {
          if (raw === 0) {
            items.push({ week: p.week, title: p.title, type: 'checklist', label: 'ยังไม่ส่ง' });
          }
        } else {
          if (isMissingVal(raw)) {
            items.push({ week: p.week, title: p.title, type: 'score', maxScore: p.maxScore, label: 'ยังไม่กรอกคะแนน' });
          }
        }
      });
      if (items.length) {
        result.push({ student: st, room: cls(st), items: items, trackedWorkCount: trackedWorkCount, missingWorkCount: items.length, seatNo: seatMap[st.id] });
      }
    });
    return result;
  }

  function bringToFront(el) {
    try {
      if (typeof window.schoolhubBringPopupToFront === 'function') {
        window.schoolhubBringPopupToFront(el);
        return;
      }
    } catch (e) {}
    // fallback ถ้าไม่มีฟังก์ชันกลาง
    if (el && el.parentElement !== document.body) document.body.appendChild(el);
    else if (el) document.body.appendChild(el);
    if (el) {
      el.style.position = 'fixed';
      el.style.inset = '0';
      el.style.zIndex = '2147483000';
    }
  }

  function ensureModal() {
    var modal = document.getElementById('schoolhub-missing-work-modal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'schoolhub-missing-work-modal';
    modal.className = 'hidden';
    modal.innerHTML =
      '<div class="schoolhub-missing-work-overlay" onclick="closeMissingWorkTracker()"></div>' +
      '<div class="schoolhub-missing-work-box">' +
        '<div class="schoolhub-missing-work-head">' +
          '<div>' +
            '<div class="schoolhub-missing-work-title"><i class="fas fa-clipboard-list"></i> งานขาดรวม (ตามคน)</div>' +
            '<div class="schoolhub-missing-work-sub" id="schoolhub-missing-work-sub"></div>' +
          '</div>' +
          '<button type="button" class="schoolhub-missing-work-close" onclick="closeMissingWorkTracker()"><i class="fas fa-times"></i></button>' +
        '</div>' +
        '<div class="schoolhub-missing-work-toolbar">' +
          '<input id="schoolhub-missing-work-search" type="text" placeholder="ค้นหาชื่อ/รหัส...">' +
          '<div id="schoolhub-missing-work-room-wrap" class="schoolhub-missing-work-room-wrap"></div>' +
          '<div class="schoolhub-missing-work-export-menu">' +
            '<button type="button" id="schoolhub-missing-work-export-button" class="schoolhub-missing-work-export schoolhub-missing-work-export-button" onclick="toggleMissingWorkExportMenu(event)" aria-haspopup="menu" aria-expanded="false" title="เลือกประเภทไฟล์ส่งออก"><i class="fas fa-file-export"></i> ส่งออก <i class="fas fa-chevron-down schoolhub-missing-work-export-chevron"></i></button>' +
            '<div id="schoolhub-missing-work-export-menu" class="schoolhub-missing-work-export-popover hidden" role="menu" aria-label="ประเภทไฟล์ส่งออก">' +
              '<button type="button" role="menuitem" onclick="exportMissingWorkFormat(\'excel\')"><i class="fas fa-file-excel"></i><span><b>Excel</b><small>ตารางแก้ไขต่อได้</small></span></button>' +
              '<button type="button" role="menuitem" onclick="exportMissingWorkFormat(\'pdf\')"><i class="fas fa-file-pdf"></i><span><b>PDF</b><small>รายงานจัดหน้าอัตโนมัติ</small></span></button>' +
              '<button type="button" role="menuitem" onclick="exportMissingWorkFormat(\'image\')"><i class="fas fa-image"></i><span><b>รูปภาพ</b><small>PNG ความละเอียดสูง</small></span></button>' +
              '<button type="button" role="menuitem" onclick="exportMissingWorkFormat(\'csv\')"><i class="fas fa-file-csv"></i><span><b>CSV</b><small>ข้อมูลคั่นด้วยจุลภาค</small></span></button>' +
            '</div>' +
          '</div>' +
          '<button type="button" class="schoolhub-missing-work-refresh" onclick="renderMissingWorkTracker()" title="รีเฟรช"><i class="fas fa-sync"></i></button>' +
        '</div>' +
        '<div class="schoolhub-missing-work-body" id="schoolhub-missing-work-body"></div>' +
      '</div>';
    document.body.appendChild(modal);
    modal.querySelector('#schoolhub-missing-work-search').addEventListener('input', function () {
      renderMissingWorkList();
    });
    return modal;
  }

  var __lastData = [];
  var __activeRooms = null; // null = ทุกห้อง, Set = เฉพาะห้องที่เลือก
  var __selectedIds = new Set(); // เลือกเฉพาะบางคนสำหรับส่งออก (ว่าง = ใช้ทุกคนที่กรองอยู่)

  function allRoomsInData() {
    var rooms = [];
    __lastData.forEach(function (row) {
      if (rooms.indexOf(row.room) === -1) rooms.push(row.room);
    });
    rooms.sort(function (a, b) { return String(a).localeCompare(String(b), 'th', { numeric: true }); });
    return rooms;
  }

  function renderRoomFilter() {
    var wrap = document.getElementById('schoolhub-missing-work-room-wrap');
    if (!wrap) return;
    var rooms = allRoomsInData();
    if (rooms.length <= 1) {
      wrap.innerHTML = '';
      __activeRooms = null;
      return;
    }
    if (!__activeRooms) __activeRooms = new Set(rooms);
    wrap.innerHTML = rooms.map(function (r) {
      var checked = __activeRooms.has(r) ? 'checked' : '';
      return '<label class="schoolhub-missing-work-room-chip"><input type="checkbox" data-room="' + esc(r) + '" ' + checked + '> ห้อง ' + esc(r) + '</label>';
    }).join('');
    Array.prototype.forEach.call(wrap.querySelectorAll('input[type="checkbox"]'), function (cb) {
      cb.addEventListener('change', function () {
        var room = this.getAttribute('data-room');
        if (this.checked) __activeRooms.add(room); else __activeRooms.delete(room);
        renderMissingWorkList();
      });
    });
  }

  function getFilteredData() {
    var q = ((document.getElementById('schoolhub-missing-work-search') || {}).value || '').trim().toLowerCase();
    return __lastData.filter(function (row) {
      if (__activeRooms && !__activeRooms.has(row.room)) return false;
      if (!q) return true;
      var st = row.student;
      return (
        String(st.name || '').toLowerCase().indexOf(q) !== -1 ||
        String(st.code || '').toLowerCase().indexOf(q) !== -1 ||
        String(row.room || '').toLowerCase().indexOf(q) !== -1
      );
    });
  }

  function getExportData() {
    var visible = getFilteredData();
    if (!__selectedIds.size) return visible;
    // สำคัญ: ถ้าติ๊กเลือกคนไว้แล้ว ต้องใช้เฉพาะคนที่เลือกเท่านั้น ห้ามเงียบๆ สลับไปใช้ทุกคน
    // (เดิมพลาดตรงนี้ ทำให้เลือกคนเดียวแต่ระบบสร้างเอกสารให้ทุกคน)
    return visible.filter(function (row) { return __selectedIds.has(String(row.student.id)); });
  }

  function pruneSelection() {
    // ตัดคนที่ถูกเลือกไว้แต่ไม่อยู่ในข้อมูลปัจจุบันแล้วออก (เช่น เปลี่ยนวิชา/รีเฟรช)
    var known = new Set(__lastData.map(function (row) { return String(row.student.id); }));
    __selectedIds.forEach(function (id) { if (!known.has(id)) __selectedIds.delete(id); });
  }

  function renderMissingWorkList() {
    var body = document.getElementById('schoolhub-missing-work-body');
    if (!body) return;
    var data = getFilteredData();

    if (!data.length) {
      body.innerHTML = '<div class="schoolhub-missing-work-empty"><i class="fas fa-circle-check"></i><div>ไม่พบงานขาด ทุกคนส่งงานครบแล้ว 🎉</div></div>';
      return;
    }

    var cid = window.currentActiveCourseId;
    var selectedInView = data.filter(function (row) { return __selectedIds.has(String(row.student.id)); }).length;
    var allSelected = selectedInView === data.length;
    var html = '<div class="schoolhub-missing-work-bulkbar">' +
      '<label><input type="checkbox" id="schoolhub-missing-work-select-all" ' + (allSelected ? 'checked' : '') + ' onchange="toggleMissingWorkSelectAll(this.checked)"> เลือกทั้งหมดในรายการนี้</label>' +
      '<span class="count">' + (selectedInView ? 'เลือกแล้ว ' + selectedInView + ' คน (ใช้เฉพาะคนที่เลือกตอนส่งออก)' : 'ยังไม่ได้เลือก · ส่งออกจะใช้ทุกคนที่แสดงอยู่') + '</span>' +
      (selectedInView ? '<button type="button" onclick="toggleMissingWorkSelectAll(false)">ล้างการเลือก</button>' : '') +
    '</div>';
    data.forEach(function (row) {
      var st = row.student;
      var sid = String(st.id);
      var isSel = __selectedIds.has(sid);
      html += '<div class="schoolhub-missing-work-card' + (isSel ? ' is-selected' : '') + '">' +
        '<div class="schoolhub-missing-work-card-head">' +
          '<input type="checkbox" class="schoolhub-missing-work-card-check" ' + (isSel ? 'checked' : '') + ' aria-label="เลือก ' + esc(st.name || '') + '" onchange="toggleMissingWorkStudentSelection(' + JSON.stringify(sid) + ', this.checked)">' +
          '<div class="schoolhub-missing-work-student"><span class="schoolhub-missing-work-code">เลขที่ ' + esc(row.seatNo != null ? row.seatNo : '-') + '</span> ' + esc(st.name || '') + '</div>' +
          '<div class="schoolhub-missing-work-room">ห้อง ' + esc(row.room) + '</div>' +
          '<div class="schoolhub-missing-work-count">ขาด ' + row.items.length + ' รายการ</div>' +
        '</div>' +
        '<div class="schoolhub-missing-work-items">' +
        row.items.map(function (it, idx) {
          var titleAttr = esc(JSON.stringify(it.title));
          return '<button type="button" class="schoolhub-missing-work-item" onclick="jumpToMissingWorkItem(' + JSON.stringify(cid) + ',' + JSON.stringify(st.id) + ',' + JSON.stringify(it.week) + ',' + titleAttr + ')">' +
            '<i class="fas fa-circle-exclamation"></i> สัปดาห์ ' + esc(it.week) + ' — ' + esc(it.title) +
            (it.type === 'score' ? ' <span class="schoolhub-missing-work-max">(เต็ม ' + esc(it.maxScore) + ')</span>' : '') +
            '<span class="schoolhub-missing-work-tag">' + esc(it.label) + '</span>' +
          '</button>';
        }).join('') +
        '</div>' +
      '</div>';
    });
    body.innerHTML = html;
  }

  window.toggleMissingWorkStudentSelection = function (studentId, checked) {
    var sid = String(studentId);
    if (checked) __selectedIds.add(sid); else __selectedIds.delete(sid);
    renderMissingWorkList();
  };

  window.toggleMissingWorkSelectAll = function (checked) {
    var visible = getFilteredData();
    if (checked) {
      visible.forEach(function (row) { __selectedIds.add(String(row.student.id)); });
    } else {
      visible.forEach(function (row) { __selectedIds.delete(String(row.student.id)); });
    }
    renderMissingWorkList();
  };

  window.renderMissingWorkTracker = function () {
    var cid = window.currentActiveCourseId;
    var sub = document.getElementById('schoolhub-missing-work-sub');
    if (!cid) {
      __lastData = [];
      __activeRooms = null;
      if (sub) sub.textContent = 'กรุณาเลือกวิชาก่อน';
      renderRoomFilter();
      renderMissingWorkList();
      return;
    }
    try {
      __lastData = collectMissingWork(cid);
    } catch (e) {
      console.error('[MissingWorkTracker] collectMissingWork error:', e);
      __lastData = [];
    }
    var totalStudents = __lastData.length;
    var totalItems = __lastData.reduce(function (n, r) { return n + r.items.length; }, 0);
    if (sub) sub.textContent = getCourseName(cid) + ' — ' + totalStudents + ' คนมีงานขาด รวม ' + totalItems + ' รายการ';
    pruneSelection();
    renderRoomFilter();
    renderMissingWorkList();
  };

  window.openMissingWorkTracker = function () {
    try {
      var modal = ensureModal();
      modal.classList.remove('hidden');
      bringToFront(modal);
      window.renderMissingWorkTracker();
    } catch (e) {
      console.error('[MissingWorkTracker] openMissingWorkTracker error:', e);
      if (typeof window.showCustomAlert === 'function') {
        window.showCustomAlert('เกิดข้อผิดพลาด', 'ไม่สามารถเปิดหน้างานขาดรวมได้ กรุณาลองรีเฟรชหน้าเว็บ', true);
      } else {
        alert('ไม่สามารถเปิดหน้างานขาดรวมได้: ' + (e && e.message));
      }
    }
  };

  window.closeMissingWorkTracker = function () {
    var modal = document.getElementById('schoolhub-missing-work-modal');
    if (modal) modal.classList.add('hidden');
  };

  window.jumpToMissingWorkItem = function (courseId, studentId, week, title) {
    window.closeMissingWorkTracker();
    try {
      if (typeof window.switchCourseTab === 'function') window.switchCourseTab('scores');
    } catch (e) {}
    setTimeout(function () {
      try {
        var sel = '[data-missing-score="1"][data-student-id="' + (window.CSS && CSS.escape ? CSS.escape(studentId) : studentId) + '"][data-week="' + (window.CSS && CSS.escape ? CSS.escape(String(week)) : week) + '"][data-title="' + (window.CSS && CSS.escape ? CSS.escape(String(title)) : title) + '"]';
        var el = document.querySelector(sel);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('schoolhub-missing-work-highlight');
          setTimeout(function () { el.classList.remove('schoolhub-missing-work-highlight'); }, 2000);
          if (typeof el.dispatchEvent === 'function') {
            el.dispatchEvent(new Event('dblclick', { bubbles: true }));
          }
        }
      } catch (e) {
        console.error('[MissingWorkTracker] jump error:', e);
      }
    }, 300);
  };

  function buildMissingWorkRows(data) {
    var rows = [['ลำดับ', 'รหัสนักเรียน', 'ชื่อ-สกุล', 'ห้อง', 'งานขาด/งานที่ติดตาม', 'สัปดาห์', 'ชื่องาน', 'ประเภท', 'สถานะ']];
    var seq = 1;
    (data || []).forEach(function (row) {
      row.items.forEach(function (it) {
        rows.push([
          seq++, row.student.code || '', row.student.name || '', row.room || '',
          (row.missingWorkCount || row.items.length) + '/' + (row.trackedWorkCount || '—'),
          it.week, it.title,
          it.type === 'checklist' ? 'เช็กลิสต์' : 'ให้คะแนน (เต็ม ' + it.maxScore + ')', it.label
        ]);
      });
    });
    return rows;
  }

  function getMissingWorkSafeFileName(extension) {
    var courseName = getCourseName(window.currentActiveCourseId).toString().replace(/[\\/:*?"<>|]/g, '_');
    return 'งานขาด_' + courseName + '_' + new Date().toISOString().slice(0, 10) + '.' + extension;
  }

  function downloadMissingWorkText(text, filename, mimeType) {
    var blob = new Blob([text], { type: mimeType + ';charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function csvCell(value) {
    var text = String(value == null ? '' : value);
    return '"' + text.replace(/"/g, '""') + '"';
  }

  function closeMissingWorkExportMenu() {
    var menu = document.getElementById('schoolhub-missing-work-export-menu');
    var button = document.getElementById('schoolhub-missing-work-export-button');
    if (menu) menu.classList.add('hidden');
    if (button) button.setAttribute('aria-expanded', 'false');
  }

  function updateMissingWorkExportProgress(button, percent, label) {
    if (!button) return;
    var numeric = Math.max(0, Math.min(100, Number(percent) || 0));
    var value = numeric.toFixed(1);
    var text = label || 'กำลังสร้าง';
    button.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i><span>' + text + ' ' + value + '%</span><span class="schoolhub-export-progress-track" aria-hidden="true"><span style="width:' + value + '%"></span></span>';
    button.setAttribute('aria-busy', 'true');
    button.setAttribute('aria-label', text + ' ' + value + '%');
  }

  function restoreMissingWorkExportButton(button, previousLabel, previousAriaLabel) {
    if (!button) return;
    button.disabled = false;
    button.innerHTML = previousLabel;
    button.removeAttribute('aria-busy');
    if (previousAriaLabel) button.setAttribute('aria-label', previousAriaLabel);
    else button.removeAttribute('aria-label');
  }

  window.toggleMissingWorkExportMenu = function (event) {
    if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
    var menu = document.getElementById('schoolhub-missing-work-export-menu');
    var button = document.getElementById('schoolhub-missing-work-export-button');
    if (!menu) return;
    var isHidden = menu.classList.toggle('hidden');
    if (button) button.setAttribute('aria-expanded', String(!isHidden));
  };

  window.exportMissingWorkFormat = function (format) {
    closeMissingWorkExportMenu();
    var data = getExportData();
    if (!data.length) {
      if (typeof window.showCustomAlert === 'function') window.showCustomAlert('ไม่มีข้อมูล', 'ไม่มีงานขาดให้ส่งออกในตอนนี้', true);
      return;
    }
    if (format === 'excel') return window.exportMissingWorkExcel();
    if (format === 'csv') {
      var rows = buildMissingWorkRows(data);
      downloadMissingWorkText('\ufeff' + rows.map(function (row) { return row.map(csvCell).join(','); }).join('\r\n'), getMissingWorkSafeFileName('csv'), 'text/csv');
      if (typeof window.showCustomAlert === 'function') window.showCustomAlert('ส่งออก CSV แล้ว', 'รวมรายการงานขาด ' + (rows.length - 1) + ' รายการเรียบร้อย');
      return;
    }
    if (format === 'pdf' || format === 'image') return window.exportMissingWorkDocument(format);
  };

  window.exportMissingWorkExcel = function () {
    try {
      if (typeof XLSX === 'undefined') {
        if (typeof window.showCustomAlert === 'function') {
          window.showCustomAlert('โหลด Excel ไม่สำเร็จ', 'ไม่พบไลบรารี XLSX กรุณาเชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่', true);
        } else {
          alert('ไม่พบไลบรารี XLSX');
        }
        return;
      }
      var data = getExportData();
      var rows = buildMissingWorkRows(data);
      if (rows.length === 1) {
        if (typeof window.showCustomAlert === 'function') {
          window.showCustomAlert('ไม่มีข้อมูล', 'ไม่มีงานขาดให้ส่งออกในตอนนี้', true);
        }
        return;
      }
      var wb = XLSX.utils.book_new();
      var ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'งานขาด');
      var courseName = getCourseName(window.currentActiveCourseId).toString().replace(/[\\/:*?"<>|]/g, '_');
      var fileName = 'งานขาด_' + courseName + '_' + new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, fileName + '.xlsx');
    } catch (e) {
      console.error('[MissingWorkTracker] export error:', e);
      if (typeof window.showCustomAlert === 'function') {
        window.showCustomAlert('เกิดข้อผิดพลาด', 'ไม่สามารถส่งออก Excel ได้ในขณะนี้', true);
      } else {
        alert('ส่งออก Excel ไม่สำเร็จ: ' + (e && e.message));
      }
    }
  };

  function loadHtml2Canvas() {
    if (typeof window.html2canvas === 'function') return Promise.resolve(window.html2canvas);
    if (window.__schoolhubHtml2CanvasLoader) return window.__schoolhubHtml2CanvasLoader;
    window.__schoolhubHtml2CanvasLoader = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
      script.async = true;
      script.onload = function () { return typeof window.html2canvas === 'function' ? resolve(window.html2canvas) : reject(new Error('ไม่พบตัวสร้างภาพ')); };
      script.onerror = function () { reject(new Error('โหลดตัวสร้างภาพไม่สำเร็จ')); };
      document.head.appendChild(script);
    });
    return window.__schoolhubHtml2CanvasLoader;
  }

  function esc2(v) { return esc(v); }

  function studentInitial(name) {
    var s = String(name || '').trim();
    return s ? s.charAt(0) : '?';
  }

  function splitItemsForPage(items) {
    var pageSize = 12;
    var chunks = [];
    for (var i = 0; i < items.length; i += pageSize) chunks.push(items.slice(i, i + pageSize));
    return chunks.length ? chunks : [[]];
  }

  // สร้าง "หนึ่งหน้าเอกสาร" ต่อคนหนึ่งคน ใช้แบบเดียวกันทั้งไฟล์รูปภาพและ PDF
  // เพื่อให้พรีวิวตรงกับไฟล์จริงเสมอ
  function buildDocPage(row, items, pageNumber, pageTotal, courseName) {
    var st = row.student || {};
    var page = document.createElement('div');
    page.className = 'schoolhub-mw-doc-page';
    page.setAttribute('aria-hidden', 'true');
    page.innerHTML =
      '<div class="schoolhub-mw-doc-topbar">' +
        '<div class="schoolhub-mw-doc-brand"><span class="mark"><i class="fas fa-graduation-cap"></i></span>SchoolHub</div>' +
        '<div class="schoolhub-mw-doc-meta">สร้างเมื่อ ' + esc(new Date().toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })) + '<br>หน้า ' + pageNumber + '/' + pageTotal + '</div>' +
      '</div>' +
      '<div class="schoolhub-mw-doc-hero">' +
        '<div class="schoolhub-mw-doc-kicker">ใบแจ้งงานค้างส่ง · ' + esc(courseName) + '</div>' +
        '<h1>รายงานงานที่ขาดรายบุคคล</h1>' +
        '<div class="schoolhub-mw-doc-student">' +
          '<div class="schoolhub-mw-doc-avatar">' + esc(studentInitial(st.name)) + '</div>' +
          '<div class="schoolhub-mw-doc-student-info">' +
            '<div class="schoolhub-mw-doc-student-name">' + esc(st.name || '-') + '</div>' +
            '<div class="schoolhub-mw-doc-student-sub">เลขที่ <b>' + esc(row.seatNo != null ? row.seatNo : '-') + '</b> · ห้อง ' + esc(row.room || '-') + '</div>' +
          '</div>' +
          '<div class="schoolhub-mw-doc-stats">' +
            '<div class="schoolhub-mw-doc-stat"><b>' + row.items.length + '</b><small>ขาดทั้งหมด</small></div>' +
            '<div class="schoolhub-mw-doc-stat"><b>' + (row.trackedWorkCount || '—') + '</b><small>งานที่ติดตาม</small></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="schoolhub-mw-doc-section-label">รายการงานที่ยังค้างส่ง' + (pageTotal > 1 ? ' (ต่อหน้าที่ ' + pageNumber + ')' : '') + '</div>' +
      '<div class="schoolhub-mw-doc-table">' +
        '<div class="schoolhub-mw-doc-table-head"><span>สัปดาห์</span><span>ชื่องาน</span><span>สถานะ</span></div>' +
        (items.length ? items.map(function (item) {
          return '<div class="schoolhub-mw-doc-row"><span class="week">สัปดาห์ ' + esc(item.week) + '</span><span class="title">' + esc(item.title || '-') + (item.type === 'score' ? '<small>(เต็ม ' + esc(item.maxScore) + ')</small>' : '') + '</span><span class="status">' + esc(item.label || 'ยังไม่ส่ง') + '</span></div>';
        }).join('') : '<div class="schoolhub-mw-doc-row"><span></span><span class="title">ไม่มีรายการในหน้านี้</span><span></span></div>') +
      '</div>' +
      '<div class="schoolhub-mw-doc-sign">' +
        '<div class="schoolhub-mw-doc-sign-line">ลงชื่อผู้ปกครอง/นักเรียน</div>' +
        '<div class="schoolhub-mw-doc-sign-line">ลงชื่อครูประจำวิชา</div>' +
      '</div>' +
      '<div class="schoolhub-mw-doc-foot">SchoolHub · เอกสารฉบับนี้สร้างโดยระบบอัตโนมัติตามตัวกรองที่เลือกไว้</div>';
    document.body.appendChild(page);
    return page;
  }

  function totalMissingWorkItems(data) {
    return (data || []).reduce(function (sum, row) { return sum + row.items.length; }, 0);
  }

  function loadJsZip() {
    if (typeof window.JSZip === 'function') return Promise.resolve(window.JSZip);
    if (window.__schoolhubJsZipLoader) return window.__schoolhubJsZipLoader;
    window.__schoolhubJsZipLoader = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
      script.async = true;
      script.onload = function () { return typeof window.JSZip === 'function' ? resolve(window.JSZip) : reject(new Error('ไม่พบตัวบีบอัดไฟล์')); };
      script.onerror = function () { reject(new Error('โหลดตัวบีบอัดไฟล์ไม่สำเร็จ')); };
      document.head.appendChild(script);
    });
    return window.__schoolhubJsZipLoader;
  }

  function safeFileFragment(text) {
    return String(text || '').replace(/[\\/:*?"<>|]/g, '_').trim() || 'student';
  }

  // ---- พรีวิวก่อนดาวน์โหลด ----
  var __mwPreviewState = null; // { format, pages: [{canvas, label}] }

  function ensurePreviewModal() {
    var modal = document.getElementById('schoolhub-mw-preview-modal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'schoolhub-mw-preview-modal';
    modal.className = 'hidden';
    modal.innerHTML =
      '<div class="schoolhub-mw-preview-overlay" onclick="closeMissingWorkPreview()"></div>' +
      '<div class="schoolhub-mw-preview-box">' +
        '<div class="schoolhub-mw-preview-head">' +
          '<div><h3 id="schoolhub-mw-preview-title">พรีวิวก่อนดาวน์โหลด</h3><p id="schoolhub-mw-preview-sub"></p></div>' +
          '<button type="button" class="schoolhub-mw-preview-close" onclick="closeMissingWorkPreview()"><i class="fas fa-times"></i></button>' +
        '</div>' +
        '<div class="schoolhub-mw-preview-body" id="schoolhub-mw-preview-body"></div>' +
        '<div class="schoolhub-mw-preview-foot">' +
          '<button type="button" class="schoolhub-mw-preview-btn cancel" onclick="closeMissingWorkPreview()">ยกเลิก</button>' +
          '<button type="button" class="schoolhub-mw-preview-btn confirm" id="schoolhub-mw-preview-confirm" onclick="confirmMissingWorkDownload()">ดาวน์โหลด</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
    return modal;
  }

  function openMissingWorkPreview(format, pages) {
    var modal = ensurePreviewModal();
    var title = document.getElementById('schoolhub-mw-preview-title');
    var sub = document.getElementById('schoolhub-mw-preview-sub');
    var body = document.getElementById('schoolhub-mw-preview-body');
    if (title) title.textContent = format === 'pdf' ? 'พรีวิว PDF ก่อนดาวน์โหลด' : 'พรีวิวรูปภาพก่อนดาวน์โหลด';
    if (sub) sub.textContent = pages.length + ' หน้า · ตรวจดูให้เรียบร้อยก่อนกดดาวน์โหลด';
    if (body) {
      body.innerHTML = '';
      pages.forEach(function (p) {
        var wrap = document.createElement('div');
        wrap.className = 'schoolhub-mw-preview-page';
        var img = document.createElement('img');
        img.src = p.canvas.toDataURL('image/png');
        img.alt = p.label;
        var cap = document.createElement('div');
        cap.className = 'schoolhub-mw-preview-page-label';
        cap.textContent = p.label;
        wrap.appendChild(img);
        wrap.appendChild(cap);
        body.appendChild(wrap);
      });
    }
    modal.classList.remove('hidden');
    if (typeof window.schoolhubBringPopupToFront === 'function') window.schoolhubBringPopupToFront(modal);
  }

  window.closeMissingWorkPreview = function () {
    var modal = document.getElementById('schoolhub-mw-preview-modal');
    if (modal) modal.classList.add('hidden');
    __mwPreviewState = null;
  };

  window.confirmMissingWorkDownload = async function () {
    if (!__mwPreviewState) return;
    var confirmBtn = document.getElementById('schoolhub-mw-preview-confirm');
    var previousText = confirmBtn ? confirmBtn.textContent : '';
    try {
      if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.textContent = 'กำลังดาวน์โหลด...'; }
      var state = __mwPreviewState;
      if (state.format === 'pdf') {
        await downloadCanvasPagesAsPdf(state.pages.map(function (p) { return p.canvas; }), getMissingWorkSafeFileName('pdf'));
      } else if (state.pages.length === 1) {
        await downloadCanvasAsPng(state.pages[0].canvas, getMissingWorkSafeFileName('png'));
      } else {
        var JSZipCtor = await loadJsZip();
        var zip = new JSZipCtor();
        var used = {};
        for (var i = 0; i < state.pages.length; i++) {
          var p = state.pages[i];
          var base = safeFileFragment(p.label);
          var name = base + '.png';
          var n = 2;
          while (used[name]) { name = base + '_' + n + '.png'; n++; }
          used[name] = true;
          var dataUrl = p.canvas.toDataURL('image/png');
          zip.file(name, dataUrl.split(',')[1], { base64: true });
        }
        var blob = await zip.generateAsync({ type: 'blob' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = getMissingWorkSafeFileName('zip');
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      }
      if (typeof window.showCustomAlert === 'function') {
        window.showCustomAlert('ส่งออกสำเร็จ', 'ดาวน์โหลด' + (state.format === 'pdf' ? ' PDF' : 'รูปภาพ') + 'เรียบร้อย (' + state.pages.length + ' หน้า)');
      }
      window.closeMissingWorkPreview();
    } catch (e) {
      console.error('[MissingWorkTracker] download error:', e);
      if (typeof window.showCustomAlert === 'function') window.showCustomAlert('ดาวน์โหลดไม่สำเร็จ', 'กรุณาลองใหม่อีกครั้ง', true);
    } finally {
      if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = previousText || 'ดาวน์โหลด'; }
    }
  };

  async function exportMissingWorkDocument(format) {
    var data = getExportData();
    if (!data.length) {
      if (typeof window.showCustomAlert === 'function') window.showCustomAlert('ไม่มีข้อมูล', 'ไม่มีงานขาดให้ส่งออกในตอนนี้', true);
      return;
    }
    var button = document.getElementById('schoolhub-missing-work-export-button');
    var previousLabel = button ? button.innerHTML : '';
    var previousAriaLabel = button ? button.getAttribute('aria-label') : '';
    var sheets = [];
    try {
      if (button) { button.disabled = true; updateMissingWorkExportProgress(button, 1.0, 'เริ่มเตรียม ' + (format === 'pdf' ? 'PDF' : 'รูปภาพ')); }
      if (typeof window.toggleLoader === 'function') window.toggleLoader(true);
      updateMissingWorkExportProgress(button, 5.0, 'กำลังเตรียมข้อมูล');
      var html2canvas = await loadHtml2Canvas();
      updateMissingWorkExportProgress(button, 12.5, 'โหลดตัวสร้างไฟล์แล้ว');
      if (document.fonts) {
        if (document.fonts.load) await Promise.all([
          document.fonts.load('400 12px "Noto Sans Thai"'),
          document.fonts.load('700 12px "Noto Sans Thai"'),
          document.fonts.load('900 17px "Noto Sans Thai"')
        ]);
        if (document.fonts.ready) await document.fonts.ready;
      }
      updateMissingWorkExportProgress(button, 25, 'เตรียมฟอนต์แล้ว');

      var courseName = getCourseName(window.currentActiveCourseId);
      var pageSpecs = [];
      data.forEach(function (row) {
        var chunks = splitItemsForPage(row.items);
        chunks.forEach(function (items, idx) {
          pageSpecs.push({ row: row, items: items, pageInStudent: idx + 1, pagesForStudent: chunks.length });
        });
      });

      var previewPages = [];
      for (var i = 0; i < pageSpecs.length; i++) {
        var spec = pageSpecs[i];
        var page = buildDocPage(spec.row, spec.items, i + 1, pageSpecs.length, courseName);
        sheets.push(page);
        var renderPercent = 25 + ((i + 1) / pageSpecs.length) * 65;
        updateMissingWorkExportProgress(button, renderPercent, 'กำลังวาดหน้า ' + (i + 1) + '/' + pageSpecs.length);
        var canvas = await html2canvas(page, { backgroundColor: '#ffffff', scale: 2, useCORS: true, logging: false, windowWidth: 794 });
        page.remove();
        var st = spec.row.student || {};
        var label = esc2(st.name || 'นักเรียน') + ' · เลขที่ ' + esc2(spec.row.seatNo != null ? spec.row.seatNo : '-') + (spec.pagesForStudent > 1 ? ' (หน้า ' + spec.pageInStudent + '/' + spec.pagesForStudent + ')' : '');
        previewPages.push({ canvas: canvas, label: label });
      }

      updateMissingWorkExportProgress(button, 100, 'พร้อมพรีวิวแล้ว');
      __mwPreviewState = { format: format, pages: previewPages };
      openMissingWorkPreview(format, previewPages);
    } catch (e) {
      console.error('[MissingWorkTracker] document export error:', e);
      if (typeof window.showCustomAlert === 'function') window.showCustomAlert('ส่งออกไม่สำเร็จ', 'ไม่สามารถสร้างไฟล์ ' + (format === 'pdf' ? 'PDF' : 'รูปภาพ') + ' ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง', true);
      else alert('ส่งออกไม่สำเร็จ: ' + (e && e.message));
    } finally {
      sheets.forEach(function (sheet) { if (sheet) sheet.remove(); });
      if (typeof window.toggleLoader === 'function') window.toggleLoader(false);
      restoreMissingWorkExportButton(button, previousLabel, previousAriaLabel);
    }
  }

  window.exportMissingWorkDocument = exportMissingWorkDocument;
  window.exportMissingWorkAsImage = function () { return exportMissingWorkDocument('image'); };
})();
