/*
  UNIFIED SIDEBAR & MENU CONTROLLER (v11)
  1. จัดการ Sidebar (แนวนอน): 10 วิหลังรีเฟรช -> ย่ออัตโนมัติ (ยกเว้นกดเอง)
  2. จัดการเมนูหลัก (แนวตั้ง): 
     - เข้าหน้าวิชา -> ย่อเมนูหลัก (ห้องเรียน, ฐานข้อมูล, ฯลฯ) เพื่อเพิ่มพื้นที่ให้เมนูวิชา
     - ออกหน้าวิชา -> แสดงเมนูหลักแบบเต็ม
  3. ป้องกันเมนูหาย: บังคับแสดงผลเสมอเมื่ออยู่ในโหมด Desktop
*/
(function () {
    if (window.__schoolhubSidebarUnifiedInit) return;
    window.__schoolhubSidebarUnifiedInit = true;

    var STORAGE_KEY = 'schoolhub_sidebar_collapsed';
    var userInteracted = false; 
    var AUTO_COLLAPSE_MS = 10000; // 10 วินาที

    function isMobile() { return window.innerWidth < 768; }
    function getSidebar() { return document.getElementById('sh-sidebar'); }
    
    // รายการปุ่มใน "เมนูหลัก" ที่ต้องย่อแนวตั้ง
    var mainMenuButtonIds = ['nav-dashboard', 'nav-students', 'nav-import-excel', 'nav-user-plans', 'nav-settings'];

    function setCollapsedPref(val) {
        try { localStorage.setItem(STORAGE_KEY, val ? '1' : '0'); } catch (e) {}
    }
    function getCollapsedPref() {
        try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch (e) { return false; }
    }

    // ฟังก์ชันบังคับแสดง Sidebar (ป้องกันปัญหาเมนูหาย)
    function forceSidebarVisible() {
        var aside = getSidebar();
        if (!aside || isMobile()) return;
        aside.classList.remove('hidden');
        aside.style.setProperty('display', 'flex', 'important');
        aside.style.setProperty('visibility', 'visible', 'important');
        aside.style.setProperty('opacity', '1', 'important');
    }

    // ฟังก์ชันย่อ/ขยาย Sidebar (แนวนอน)
    function applySidebarWidth(collapsed) {
        var aside = getSidebar();
        if (!aside || isMobile()) return;
        forceSidebarVisible();
        aside.classList.toggle('sh-sidebar-collapsed', !!collapsed);
        
        var icon = document.getElementById('sh-sidebar-toggle-icon');
        if (icon) icon.classList.toggle('sh-flip', !!collapsed);
    }

    // ฟังก์ชันย่อ/ขยาย เมนูหลัก (แนวตั้ง)
    window.schoolhubSetMainMenuVerticalState = function(collapsed) {
        mainMenuButtonIds.forEach(function(id) {
            var btn = document.getElementById(id);
            if (!btn) return;
            if (collapsed) {
                btn.style.setProperty('display', 'none', 'important');
            } else {
                // แสดงผลตามปกติ (ยกเว้นปุ่มนำเข้าที่อาจถูกซ่อนโดยระบบอื่น)
                if (id === 'nav-import-excel' && btn.classList.contains('hidden')) return;
                btn.style.setProperty('display', 'flex', 'important');
            }
        });
        
        // ปรับ Label "เมนูหลัก" ให้ดูเหมือนหัวข้อที่กดขยายได้
        var label = document.getElementById('nav-main-label');
        if (label) {
            label.style.cursor = 'pointer';
            label.innerHTML = 'เมนูหลัก ' + (collapsed ? '<i class="fas fa-chevron-down ml-1"></i>' : '<i class="fas fa-chevron-up ml-1"></i>');
            label.onclick = function() {
                window.schoolhubSetMainMenuVerticalState(!collapsed);
            };
        }
    };

    // Toggle Sidebar ปกติ (ปุ่มที่ Sidebar)
    window.toggleSchoolHubSidebar = function () {
        if (isMobile()) return;
        userInteracted = true; 
        var aside = getSidebar();
        if (!aside) return;
        var next = !aside.classList.contains('sh-sidebar-collapsed');
        applySidebarWidth(next);
        setCollapsedPref(next);
    };

    // Initialize
    function init() {
        if (isMobile()) return;
        
        // 1. เริ่มต้นด้วยเมนูเต็ม (แนวนอน)
        applySidebarWidth(false);
        
        // 2. ตั้งเวลา 10 วินาที ย่อ Sidebar (แนวนอน) อัตโนมัติ
        setTimeout(function() {
            if (!userInteracted && !isMobile()) {
                applySidebarWidth(true);
                setCollapsedPref(true);
            }
        }, AUTO_COLLAPSE_MS);

        // 3. ตรวจสอบว่าตอนนี้อยู่ในหน้าวิชาหรือไม่ (ถ้ามีเมนูวิชาแสดงอยู่ ให้ย่อเมนูหลักแนวตั้ง)
        var courseMenu = document.getElementById('course-context-menu');
        if (courseMenu && !courseMenu.classList.contains('hidden')) {
            window.schoolhubSetMainMenuVerticalState(true);
        }
    }

    // Hook เข้ากับระบบ Navigation
    var _oldEnterCourse = window.enterCourse;
    window.enterCourse = function(id) {
        if (typeof _oldEnterCourse === 'function') _oldEnterCourse(id);
        if (!isMobile()) {
            window.schoolhubSetMainMenuVerticalState(true); // ย่อเมนูหลักแนวตั้ง
        }
    };

    var _oldGoToHome = window.goToHome;
    window.goToHome = function() {
        if (typeof _oldGoToHome === 'function') _oldGoToHome();
        if (!isMobile()) {
            window.schoolhubSetMainMenuVerticalState(false); // ขยายเมนูหลักแนวตั้ง
        }
    };

    // ป้องกันเมนูหายตอน Resize
    window.addEventListener('resize', function() {
        if (!isMobile()) {
            applySidebarWidth(getCollapsedPref());
        }
    });

    // ตรวจสอบความถูกต้องทุก 1 วินาที
    setInterval(forceSidebarVisible, 1000);

    // รันทันที
    init();
    document.addEventListener('DOMContentLoaded', init);
    window.schoolhubApplySidebarCollapseNow = init;

})();
