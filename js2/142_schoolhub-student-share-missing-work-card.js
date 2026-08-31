/*
 * Continuity Ledger style: a restrained Schoolhub Indigo information card placed
 * at the document tail, preserving the existing shared-student page hierarchy.
 */
(function () {
  if (window.__schoolhubStudentShareMissingWorkCard) return;
  window.__schoolhubStudentShareMissingWorkCard = true;

  function esc(value) {
    if (typeof window.escapeHTML === 'function') return window.escapeHTML(value);
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function getMissingItems(data) {
    if (!data) return [];
    if (Array.isArray(data.missingWork)) return data.missingWork;
    return (data.scoreRows || []).filter(function (row) {
      return row && (row.missing === true || ((row.checklist && row.display === 'ยังไม่ส่ง') || (!row.checklist && row.display === 'ขาดส่ง')));
    }).map(function (row) {
      return {
        week: row.week,
        title: row.title,
        type: row.checklist ? 'checklist' : 'score',
        maxScore: row.maxScore,
        label: row.checklist ? 'ยังไม่ส่ง' : 'ยังไม่กรอกคะแนน'
      };
    });
  }

  function getWorkStats(data, items) {
    var rows = Array.isArray(data && data.scoreRows) ? data.scoreRows : [];
    var summary = data && data.summary || {};
    var tracked = Number(data && data.trackedWorkCount != null ? data.trackedWorkCount : summary.trackedWorkCount);
    var missing = Number(data && data.missingWorkCount != null ? data.missingWorkCount : summary.missingWorkCount);
    if (!Number.isFinite(tracked) || tracked < 0) tracked = rows.length;
    if (!Number.isFinite(missing) || missing < 0) missing = items.length;
    return { tracked: tracked, missing: missing };
  }

  function shareFingerprint(data, items) {
    return [data.createdAt || '', data.student && (data.student.id || data.student.code || data.student.name) || '', items.map(function (item) {
      return [item.week, item.title, item.label].join('|');
    }).join('~')].join('::');
  }

  function renderMissingWorkCard() {
    var content = document.getElementById('public-share-content');
    var data = window.__studentShareCurrentData;
    if (!content || !data) return;

    var items = getMissingItems(data);
    var stats = getWorkStats(data, items);
    var fingerprint = shareFingerprint(data, items) + '::' + stats.missing + '/' + stats.tracked;
    var existing = document.getElementById('schoolhub-student-share-missing-work-card');
    if (existing && existing.dataset.fingerprint === fingerprint) return;
    if (existing) existing.remove();

    var card = document.createElement('section');
    card.id = 'schoolhub-student-share-missing-work-card';
    card.className = 'schoolhub-student-share-missing-work-card';
    card.dataset.fingerprint = fingerprint;
    card.setAttribute('aria-label', 'งานที่ต้องส่ง');

    var body = items.length
      ? '<div class="schoolhub-student-share-missing-work-list">' + items.map(function (item) {
          return '<div class="schoolhub-student-share-missing-work-item">' +
            '<div class="schoolhub-student-share-missing-work-week">สัปดาห์ ' + esc(item.week || '-') + '</div>' +
            '<div class="schoolhub-student-share-missing-work-title">' + esc(item.title || '-') + (item.type === 'score' ? '<span>เต็ม ' + esc(item.maxScore || 0) + '</span>' : '') + '</div>' +
            '<div class="schoolhub-student-share-missing-work-status">' + esc(item.label || 'ยังไม่ส่ง') + '</div>' +
          '</div>';
        }).join('') + '</div>'
      : '<div class="schoolhub-student-share-missing-work-empty"><i class="fas fa-circle-check"></i><span>ไม่มีงานที่ต้องส่งเพิ่มเติมในขณะนี้</span></div>';

    var baseLabel = stats.tracked > 0 ? stats.missing + '/' + stats.tracked + ' งาน' : 'ไม่มีฐานงาน';
    card.innerHTML =
      '<div class="schoolhub-student-share-missing-work-head">' +
        '<div><div class="schoolhub-student-share-missing-work-eyebrow"><i class="fas fa-list-check"></i> สรุปรายบุคคล</div><h3>งานที่ต้องส่ง</h3><p>ตรวจสอบและติดต่อครูผู้สอนหากต้องการรายละเอียดเพิ่มเติม</p></div>' +
        '<div class="schoolhub-student-share-missing-work-count">ขาด ' + stats.missing + ' รายการ<small>' + baseLabel + '</small></div>' +
      '</div>' + body;

    content.appendChild(card); // Intentionally appended last, after the teacher attribution and the score list.
  }

  var scheduleFrame = 0;
  function scheduleRender() {
    if (scheduleFrame) return;
    scheduleFrame = requestAnimationFrame(function () {
      scheduleFrame = 0;
      renderMissingWorkCard();
    });
  }

  function bind() {
    var content = document.getElementById('public-share-content');
    if (!content || content.dataset.schoolhubMissingWorkObserver === '1') return;
    content.dataset.schoolhubMissingWorkObserver = '1';
    new MutationObserver(scheduleRender).observe(content, { childList: true, subtree: false });
    scheduleRender();
    setTimeout(scheduleRender, 250);
    setTimeout(scheduleRender, 1000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
  document.addEventListener('visibilitychange', function () { if (!document.hidden) scheduleRender(); });
})();
