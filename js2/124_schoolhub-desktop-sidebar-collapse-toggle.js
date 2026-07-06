/*
  PATCH: เมนูด้านซ้าย (เดสก์ท็อป) แบบย่อ/ขยายได้
  พฤติกรรม:
  1. เมื่อรีเฟรชหน้าจอ: แสดงเมนูเต็ม 5 วินาที แล้วย่ออัตโนมัติ (ยกเว้นผู้ใช้กดเองก่อน)
  2. เมื่อขยายจอกลับมาจากโหมดมือถือ: แสดงเมนูทันทีโดยไม่ต้องรีเฟรช (แสดงตามสถานะล่าสุด)
*/
(function () {
    if (window.__schoolhubSidebarCollapseInit) return;
    window.__schoolhubSidebarCollapseInit = true;

    var STORAGE_KEY = 'schoolhub_sidebar_collapsed';
    var userInteracted = false; 

    function isMobileWidth() {
        return window.innerWidth < 768;
    }

    function getSidebar() { return document.getElementById('sh-sidebar'); }

    function getCollapsedPref() {
        try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch (e) { return true; } // Default to collapsed
    }
    function setCollapsedPref(val) {
        try { localStorage.setItem(STORAGE_KEY, val ? '1' : '0'); } catch (e) {}
    }

    function applyCollapsedState(collapsed) {
        var aside = getSidebar();
        if (!aside) return;
        
        // บังคับให้แสดงผล
        aside.classList.remove('hidden');
        aside.style.setProperty('display', 'flex', 'important');
        aside.style.setProperty('visibility', 'visible', 'important');
        aside.style.setProperty('opacity', '1', 'important');
        aside.style.setProperty('pointer-events', 'auto', 'important');
        aside.style.removeProperty('width');

        aside.classList.toggle('sh-sidebar-collapsed', !!collapsed);
        
        var icon = document.getElementById('sh-sidebar-toggle-icon');
        if (icon) icon.classList.toggle('sh-flip', !!collapsed);
        var btn = document.getElementById('sh-sidebar-toggle-btn');
        if (btn) btn.title = collapsed ? 'ขยายเมนู' : 'ย่อเมนู';
        var label = document.getElementById('sh-sidebar-toggle-label');
        if (label) label.textContent = collapsed ? 'ขยายเมนู' : 'ย่อเมนู';
    }

    window.toggleSchoolHubSidebar = function () {
        if (isMobileWidth()) return;
        userInteracted = true; // ผู้ใช้กดเองแล้ว ยกเลิก Auto-collapse
        var aside = getSidebar();
        if (!aside) return;
        var nextCollapsed = !aside.classList.contains('sh-sidebar-collapsed');
        applyCollapsedState(nextCollapsed);
        setCollapsedPref(nextCollapsed);
    };

    var lastMode = isMobileWidth() ? 'mobile' : 'desktop';

    function handleModeTransition() {
        var nowMode = isMobileWidth() ? 'mobile' : 'desktop';
        if (nowMode === lastMode) return;
        
        if (nowMode === 'desktop') {
            // ขยายจอกลับมา: แสดงทันทีตามสถานะล่าสุด
            applyCollapsedState(getCollapsedPref());
        } else {
            var aside = getSidebar();
            if (aside) {
                aside.classList.add('hidden');
                aside.style.setProperty('display', 'none', 'important');
            }
        }
        lastMode = nowMode;
    }

    function initSidebarState() {
        if (isMobileWidth()) return;
        
        // 1. แสดงเมนูเต็มทันทีตอนโหลด (Refresh)
        applyCollapsedState(false);
        
        // 2. ตั้งเวลา 10 วินาทีเพื่อย่ออัตโนมัติ
        setTimeout(function() {
            if (!userInteracted && !isMobileWidth()) {
                applyCollapsedState(true);
                setCollapsedPref(true);
            }
        }, 10000);
    }

    // จัดการ Event Resize ให้ทำงานทันที
    window.addEventListener('resize', handleModeTransition);
    
    // รันทันทีที่สคริปต์โหลด และรันซ้ำเมื่อ DOM พร้อม
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSidebarState);
    } else {
        initSidebarState();
    }
    
    // ป้องกันสคริปต์อื่นมาซ่อน
    setInterval(function(){
        if(!isMobileWidth()) {
            var aside = getSidebar();
            if(aside && (aside.classList.contains('hidden') || aside.style.display === 'none')) {
                applyCollapsedState(getCollapsedPref());
            }
        }
    }, 500);

    window.schoolhubApplySidebarCollapseNow = function () { initSidebarState(); };
})();
