
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
        result.push({ student: st, room: cls(st), items: items, trackedWorkCount: trackedWorkCount, missingWorkCount: items.length });
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

  function renderMissingWorkList() {
    var body = document.getElementById('schoolhub-missing-work-body');
    if (!body) return;
    var data = getFilteredData();

    if (!data.length) {
      body.innerHTML = '<div class="schoolhub-missing-work-empty"><i class="fas fa-circle-check"></i><div>ไม่พบงานขาด ทุกคนส่งงานครบแล้ว 🎉</div></div>';
      return;
    }

    var cid = window.currentActiveCourseId;
    var html = '';
    data.forEach(function (row) {
      var st = row.student;
      html += '<div class="schoolhub-missing-work-card">' +
        '<div class="schoolhub-missing-work-card-head">' +
          '<div class="schoolhub-missing-work-student"><span class="schoolhub-missing-work-code">' + esc(st.code || '') + '</span> ' + esc(st.name || '') + '</div>' +
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
    var value = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
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
    var data = getFilteredData();
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
      var data = getFilteredData();
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

  function imageExportSheet(data) {
    var courseName = getCourseName(window.currentActiveCourseId);
    var totalItems = data.reduce(function (sum, row) { return sum + row.items.length; }, 0);
    var sheet = document.createElement('div');
    sheet.className = 'schoolhub-missing-work-image-sheet';
    sheet.setAttribute('aria-hidden', 'true');
    sheet.innerHTML =
      '<div class="schoolhub-missing-work-image-head">' +
        '<div class="schoolhub-missing-work-image-brand"><span class="schoolhub-missing-work-image-brand-mark"><i class="fas fa-graduation-cap"></i></span><span>SchoolHub</span></div>' +
        '<div class="schoolhub-missing-work-image-date">สร้างเมื่อ ' + esc(new Date().toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })) + '</div>' +
        '<h1>รายงานงานที่ขาด</h1><p>' + esc(courseName) + ' · ' + data.length + ' คน · ' + totalItems + ' รายการ</p>' +
        '<div class="schoolhub-missing-work-image-summary"><span>งานขาดรวม ' + totalItems + ' รายการ</span><span>ผู้เรียน ' + data.length + ' คน</span></div>' +
      '</div>' +
      '<div class="schoolhub-missing-work-image-list">' + data.map(function (row) {
        var st = row.student || {};
        return '<section class="schoolhub-missing-work-image-card">' +
          '<div class="schoolhub-missing-work-image-card-head"><div class="schoolhub-missing-work-image-student-block"><div class="schoolhub-missing-work-image-student">' + esc(st.name || '-') + '</div><div class="schoolhub-missing-work-image-code">' + esc(st.code || '-') + ' · ห้อง ' + esc(row.room || '-') + '</div></div><div class="schoolhub-missing-work-image-metrics"><span class="schoolhub-missing-work-image-metric schoolhub-missing-work-image-metric-missing"><b>ขาด ' + row.items.length + ' รายการ</b><small>จาก ' + (row.trackedWorkCount || '—') + ' งานที่ติดตาม</small></span></div></div>' +
          '<div class="schoolhub-missing-work-image-table-head"><span>สัปดาห์</span><span>รายการงานที่ยังขาด</span><span>สถานะ</span></div>' +
          '<div class="schoolhub-missing-work-image-items">' + row.items.map(function (item) {
            return '<div class="schoolhub-missing-work-image-item"><span class="schoolhub-missing-work-image-week">สัปดาห์ ' + esc(item.week) + '</span><span class="schoolhub-missing-work-image-title">' + esc(item.title || '-') + (item.type === 'score' ? ' <small>(เต็ม ' + esc(item.maxScore) + ')</small>' : '') + '</span><span class="schoolhub-missing-work-image-status">' + esc(item.label || 'ยังไม่ส่ง') + '</span></div>';
          }).join('') + '</div></section>';
      }).join('') + '</div><div class="schoolhub-missing-work-image-foot">SchoolHub · รายการทั้งหมดตามตัวกรองที่เลือก</div>';
    document.body.appendChild(sheet);
    return sheet;
  }

  function loadJsPdf() {
    if (window.jspdf && typeof window.jspdf.jsPDF === 'function') return Promise.resolve(window.jspdf.jsPDF);
    if (window.__schoolhubJsPdfLoader) return window.__schoolhubJsPdfLoader;
    window.__schoolhubJsPdfLoader = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
      script.async = true;
      script.onload = function () { return window.jspdf && typeof window.jspdf.jsPDF === 'function' ? resolve(window.jspdf.jsPDF) : reject(new Error('ไม่พบตัวสร้าง PDF')); };
      script.onerror = function () { reject(new Error('โหลดตัวสร้าง PDF ไม่สำเร็จ')); };
      document.head.appendChild(script);
    });
    return window.__schoolhubJsPdfLoader;
  }

  function downloadCanvasAsPng(canvas, filename) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (!blob) { reject(new Error('สร้างไฟล์ PNG ไม่สำเร็จ')); return; }
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        resolve();
      }, 'image/png');
    });
  }

  async function downloadCanvasPagesAsPdf(canvases, filename) {
    var JsPdf = await loadJsPdf();
    var pdf = new JsPdf({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
    var pageWidth = 210;
    (canvases || []).forEach(function (canvas, index) {
      if (index > 0) pdf.addPage();
      var imageData = canvas.toDataURL('image/png');
      var imageHeight = canvas.height * pageWidth / canvas.width;
      var pageHeight = 297;
      var scale = Math.min(1, (pageHeight - 12) / imageHeight);
      var renderWidth = pageWidth * scale;
      var renderHeight = imageHeight * scale;
      var x = (pageWidth - renderWidth) / 2;
      var y = (pageHeight - renderHeight) / 2;
      pdf.addImage(imageData, 'PNG', x, y, renderWidth, renderHeight, undefined, 'FAST');
    });
    pdf.save(filename);
  }

  function splitItemsForPdf(items) {
    var pageSize = 16;
    var chunks = [];
    for (var i = 0; i < items.length; i += pageSize) chunks.push(items.slice(i, i + pageSize));
    return chunks.length ? chunks : [[]];
  }

  function pdfExportPage(row, items, pageNumber, pageTotal) {
    var courseName = getCourseName(window.currentActiveCourseId);
    var st = row.student || {};
    var page = document.createElement('div');
    page.className = 'schoolhub-missing-work-pdf-page';
    page.setAttribute('aria-hidden', 'true');
    page.innerHTML =
      '<div class="schoolhub-missing-work-pdf-kicker">SchoolHub · รายงานงานที่ขาด</div>' +
      '<div class="schoolhub-missing-work-pdf-title-row"><div><h1>' + esc(courseName) + '</h1><p>สรุปรายบุคคล · สร้างเมื่อ ' + esc(new Date().toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })) + '</p></div><div class="schoolhub-missing-work-pdf-page-no">หน้า ' + pageNumber + '/' + pageTotal + '</div></div>' +
      '<section class="schoolhub-missing-work-pdf-student"><div><h2>' + esc(st.name || '-') + '</h2><p>' + esc(st.code || '-') + ' · ห้อง ' + esc(row.room || '-') + '</p></div><div class="schoolhub-missing-work-pdf-stats"><span class="missing"><b>ขาด ' + row.items.length + ' รายการ</b><small>จาก ' + (row.trackedWorkCount || '—') + ' งานที่ติดตาม</small></span></div></section>' +
      '<div class="schoolhub-missing-work-pdf-table"><div class="schoolhub-missing-work-pdf-table-head"><span>สัปดาห์</span><span>รายการงานที่ยังขาด</span><span>สถานะ</span></div>' + items.map(function (item) {
        return '<div class="schoolhub-missing-work-pdf-row"><span class="week">สัปดาห์ ' + esc(item.week) + '</span><span class="title">' + esc(item.title || '-') + (item.type === 'score' ? ' <small>(เต็ม ' + esc(item.maxScore) + ')</small>' : '') + '</span><span class="status">' + esc(item.label || 'ยังไม่ส่ง') + '</span></div>';
      }).join('') + '</div><div class="schoolhub-missing-work-pdf-foot">SchoolHub · รายงานตามตัวกรองที่เลือก</div>';
    document.body.appendChild(page);
    return page;
  }

  function totalMissingWorkItems(data) {
    return (data || []).reduce(function (sum, row) { return sum + row.items.length; }, 0);
  }

  async function exportMissingWorkDocument(format) {
    var data = getFilteredData();
    if (!data.length) {
      if (typeof window.showCustomAlert === 'function') window.showCustomAlert('ไม่มีข้อมูล', 'ไม่มีงานขาดให้ส่งออกในตอนนี้', true);
      return;
    }
    var button = document.getElementById('schoolhub-missing-work-export-button');
    var previousLabel = button ? button.innerHTML : '';
    var previousAriaLabel = button ? button.getAttribute('aria-label') : '';
    var sheets = [];
    try {
      if (button) { button.disabled = true; updateMissingWorkExportProgress(button, 3, 'กำลังสร้าง ' + (format === 'pdf' ? 'PDF' : 'รูปภาพ')); }
      if (typeof window.toggleLoader === 'function') window.toggleLoader(true);
      updateMissingWorkExportProgress(button, 10, 'กำลังเตรียมข้อมูล');
      var html2canvas = await loadHtml2Canvas();
      updateMissingWorkExportProgress(button, 20, 'กำลังโหลดตัวสร้างไฟล์');
      if (document.fonts) {
        if (document.fonts.load) await Promise.all([
          document.fonts.load('400 12px "Noto Sans Thai"'),
          document.fonts.load('700 12px "Noto Sans Thai"'),
          document.fonts.load('900 17px "Noto Sans Thai"')
        ]);
        if (document.fonts.ready) await document.fonts.ready;
      }
      updateMissingWorkExportProgress(button, 30, 'กำลังเตรียมฟอนต์');
      if (format === 'pdf') {
        var pageSpecs = [];
        data.forEach(function (row) { splitItemsForPdf(row.items).forEach(function (items) { pageSpecs.push({ row: row, items: items }); }); });
        pageSpecs.forEach(function (spec, index) { sheets.push(pdfExportPage(spec.row, spec.items, index + 1, pageSpecs.length)); });
      } else {
        sheets.push(imageExportSheet(data));
      }
      updateMissingWorkExportProgress(button, 45, 'กำลังจัดหน้า');
      await new Promise(function (resolve) { requestAnimationFrame(function () { requestAnimationFrame(resolve); }); });
      var canvases = [];
      for (var i = 0; i < sheets.length; i++) {
        var renderPercent = 50 + Math.round(((i + 1) / sheets.length) * 38);
        updateMissingWorkExportProgress(button, renderPercent, 'กำลังสร้าง ' + (format === 'pdf' ? 'PDF' : 'รูปภาพ'));
        canvases.push(await html2canvas(sheets[i], { backgroundColor: '#f3f6fb', scale: format === 'pdf' ? 1.5 : 2, useCORS: true, logging: false, windowWidth: format === 'pdf' ? 794 : 1200 }));
      }
      updateMissingWorkExportProgress(button, 94, 'กำลังเตรียมดาวน์โหลด');
      if (format === 'pdf') await downloadCanvasPagesAsPdf(canvases, getMissingWorkSafeFileName('pdf'));
      else await downloadCanvasAsPng(canvases[0], getMissingWorkSafeFileName('png'));
      updateMissingWorkExportProgress(button, 100, 'สร้างเสร็จแล้ว');
      if (typeof window.showCustomAlert === 'function') window.showCustomAlert('ส่งออกสำเร็จ', 'สร้าง ' + (format === 'pdf' ? 'PDF' : 'รูปภาพ') + ' จากรายการงานขาดทั้งหมด ' + totalMissingWorkItems(data) + ' รายการแล้ว');
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
