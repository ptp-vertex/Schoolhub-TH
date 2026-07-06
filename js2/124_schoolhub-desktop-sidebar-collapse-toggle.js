/*
  UNIFIED SIDEBAR CONTROLLER: แก้ไขปัญหาเมนูหายขาด 100%
  พฤติกรรม:
  1. เมื่อรีเฟรชหน้าจอ: แสดงเมนูเต็ม 10 วินาที แล้วย่ออัตโนมัติ (ยกเว้นผู้ใช้กดเองก่อน)
  2. เมื่อขยายจอกลับมาจากโหมดมือถือ: แสดงเมนูทันทีตามสถานะล่าสุด
  3. เมื่อเข้าหน้าวิชา (enterCourse): ย่อเมนูอัตโนมัติ
  4. เมื่อกลับหน้าหลัก (goToHome): ขยายเมนูเต็มอัตโนมัติ
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
        try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch (e) { return true; }
    }
    function setCollapsedPref(val) {
        try { localStorage.setItem(STORAGE_KEY, val ? '1' : '0'); } catch (e) {}
    }

    function forceShowSidebar() {
        var aside = getSidebar();
        if (!aside) return;
        aside.classList.remove('hidden');
        aside.style.setProperty('display', 'flex', 'important');
        aside.style.setProperty('visibility', 'visible', 'important');
        aside.style.setProperty('opacity', '1', 'important');
        aside.style.setProperty('pointer-events', 'auto', 'important');
        aside.style.setProperty('width', '', '');
        aside.style.setProperty('min-width', '', '');
        aside.style.setProperty('max-width', '', '');
        aside.style.setProperty('height', '', '');
        aside.style.setProperty('overflow', 'visible', 'important');
    }

    function applyCollapsedState(collapsed) {
        var aside = getSidebar();
        if (!aside) return;
        
        if (!isMobileWidth()) {
            forceShowSidebar();
            aside.classList.toggle('sh-sidebar-collapsed', !!collapsed);
            
            var icon = document.getElementById('sh-sidebar-toggle-icon');
            if (icon) icon.classList.toggle('sh-flip', !!collapsed);
            var btn = document.getElementById('sh-sidebar-toggle-btn');
            if (btn) btn.title = collapsed ? 'ขยายเมนู' : 'ย่อเมนู';
            var label = document.getElementById('sh-sidebar-toggle-label');
            if (label) label.textContent = collapsed ? 'ขยายเมนู' : 'ย่อเมนู';
        } else {
            aside.classList.add('hidden');
            aside.style.setProperty('display', 'none', 'important');
        }
    }

    window.toggleSchoolHubSidebar = function () {
        if (isMobileWidth()) return;
        userInteracted = true; 
        var aside = getSidebar();
        if (!aside) return;
        var nextCollapsed = !aside.classList.contains('sh-sidebar-collapsed');
        applyCollapsedState(nextCollapsed);
        setCollapsedPref(nextCollapsed);
    };

    // ฟังก์ชันใหม่สำหรับจัดการการสลับหน้า
    window.schoolhubSetSidebarState = function(collapsed, forceUserInteraction = false) {
        if (isMobileWidth()) return;
        if (forceUserInteraction) userInteracted = true;
        applyCollapsedState(collapsed);
        setCollapsedPref(collapsed);
    };

    var lastMode = isMobileWidth() ? 'mobile' : 'desktop';

    function handleModeTransition() {
        var nowMode = isMobileWidth() ? 'mobile' : 'desktop';
        if (nowMode === lastMode) return;
        
        if (nowMode === 'desktop') {
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

    window.addEventListener('resize', handleModeTransition);
    initSidebarState();
    document.addEventListener('DOMContentLoaded', initSidebarState);
    
    setInterval(function(){
        if(!isMobileWidth()) {
            var aside = getSidebar();
            if(aside && (aside.classList.contains('hidden') || aside.style.display === 'none')) {
                applyCollapsedState(getCollapsedPref());
            }
        }
    }, 1000);

    window.schoolhubApplySidebarCollapseNow = function () { initSidebarState(); };

    // Hook เข้ากับฟังก์ชัน Navigation ของแอป
    var originalEnterCourse = window.enterCourse;
    window.enterCourse = function(id) {
        if (typeof originalEnterCourse === 'function') originalEnterCourse(id);
        // เมื่อเข้าหน้าวิชา -> ย่อเมนู
        window.schoolhubSetSidebarState(true);
    };

    var originalGoToHome = window.goToHome;
    window.goToHome = function() {
        if (typeof originalGoToHome === 'function') originalGoToHome();
        // เมื่อกลับหน้าหลัก -> ขยายเมนู
        window.schoolhubSetSidebarState(false);
    };
})();
