/*
  UNIFIED SIDEBAR & MENU CONTROLLER (v13)
  1. จัดการ Sidebar (แนวนอน): 10 วิหลังรีเฟรช -> ย่ออัตโนมัติ (ยกเว้นกดเอง)
  2. จัดการเมนูหลัก (Accordion Style): 
     - เข้าหน้าวิชา -> พับกลุ่ม "เมนูหลัก" เก็บไว้อัตโนมัติ เพื่อให้เมนูวิชาดันขึ้นบน
     - ผู้ใช้สามารถคลิกที่หัวข้อ "เมนูหลัก" เพื่อเปิด-ปิด (พับ/กาง) ได้ตลอดเวลา
  3. ป้องกันเมนูหาย: บังคับแสดงผลเสมอเมื่ออยู่ในโหมด Desktop
*/
(function () {
    if (window.__schoolhubSidebarUnifiedInitV13) return;
    window.__schoolhubSidebarUnifiedInitV13 = true;

    var STORAGE_KEY = 'schoolhub_sidebar_collapsed';
    var userInteracted = false; 
    var AUTO_COLLAPSE_MS = 10000; // 10 วินาที

    function isMobile() { return window.innerWidth < 768; }
    function getSidebar() { return document.getElementById('sh-sidebar'); }
    
    // รายการปุ่มใน "เมนูหลัก" (ไม่รวม Label)
    var mainMenuButtonIds = ['nav-dashboard', 'nav-students', 'nav-import-excel', 'nav-user-plans', 'nav-settings'];

    function setCollapsedPref(val) {
        try { localStorage.setItem(STORAGE_KEY, val ? '1' : '0'); } catch (e) {}
    }
    function getCollapsedPref() {
        try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch (e) { return false; }
    }

    function forceSidebarVisible() {
        var aside = getSidebar();
        if (!aside || isMobile()) return;
        aside.classList.remove('hidden');
        aside.style.setProperty('display', 'flex', 'important');
    }

    function applySidebarWidth(collapsed) {
        var aside = getSidebar();
        if (!aside || isMobile()) return;
        forceSidebarVisible();
        aside.classList.toggle('sh-sidebar-collapsed', !!collapsed);
        var icon = document.getElementById('sh-sidebar-toggle-icon');
        if (icon) icon.classList.toggle('sh-flip', !!collapsed);
    }

    // ฟังก์ชันพับ/กาง เมนูหลัก (Accordion)
    window.schoolhubSetMainMenuAccordionState = function(collapsed) {
        mainMenuButtonIds.forEach(function(id) {
            var btn = document.getElementById(id);
            if (!btn) return;
            if (collapsed) {
                btn.style.setProperty('display', 'none', 'important');
            } else {
                if (id === 'nav-import-excel' && btn.classList.contains('hidden')) return;
                btn.style.setProperty('display', 'flex', 'important');
            }
        });
        
        // ปรับแต่ง Label ให้เป็นปุ่มกดพับ/กาง
        var label = document.getElementById('nav-main-label');
        if (label) {
            label.style.cursor = 'pointer';
            label.style.userSelect = 'none';
            label.classList.add('hover:text-primary', 'transition-colors');
            label.innerHTML = `<div class="flex items-center justify-between w-full">
                <span>เมนูหลัก</span>
                <i class="fas ${collapsed ? 'fa-chevron-down' : 'fa-chevron-up'} text-[10px] opacity-50"></i>
            </div>`;
            label.onclick = function(e) {
                e.preventDefault();
                var currentlyCollapsed = document.getElementById(mainMenuButtonIds[0]).style.display === 'none';
                window.schoolhubSetMainMenuAccordionState(!currentlyCollapsed);
            };
        }

        // ปรับแต่งเมนูประจำวิชาเมื่อดันขึ้นบน
        var courseMenu = document.getElementById('course-context-menu');
        if (courseMenu) {
            if (collapsed) {
                courseMenu.style.setProperty('margin-top', '0.5rem', 'important');
                var courseLabel = document.getElementById('sidebar-course-name');
                if (courseLabel) {
                    courseLabel.style.setProperty('margin-top', '1rem', 'important');
                    courseLabel.style.setProperty('border-top', '1px solid #f1f5f9', 'important');
                    courseLabel.style.setProperty('padding-top', '1rem', 'important');
                }
            } else {
                courseMenu.style.removeProperty('margin-top');
                var courseLabel = document.getElementById('sidebar-course-name');
                if (courseLabel) {
                    courseLabel.style.removeProperty('margin-top');
                    courseLabel.style.removeProperty('border-top');
                    courseLabel.style.removeProperty('padding-top');
                }
            }
        }
    };

    window.toggleSchoolHubSidebar = function () {
        if (isMobile()) return;
        userInteracted = true; 
        var aside = getSidebar();
        if (!aside) return;
        var next = !aside.classList.contains('sh-sidebar-collapsed');
        applySidebarWidth(next);
        setCollapsedPref(next);
    };

    function init() {
        if (isMobile()) return;
        applySidebarWidth(getCollapsedPref());
        
        // Auto-collapse Sidebar (แนวนอน) หลัง 10 วิ
        setTimeout(function() {
            if (!userInteracted && !isMobile()) {
                applySidebarWidth(true);
                setCollapsedPref(true);
            }
        }, AUTO_COLLAPSE_MS);

        // เช็คสถานะหน้าวิชา
        var courseMenu = document.getElementById('course-context-menu');
        if (courseMenu && !courseMenu.classList.contains('hidden')) {
            window.schoolhubSetMainMenuAccordionState(true);
        } else {
            window.schoolhubSetMainMenuAccordionState(false);
        }
    }

    // Hook Navigation
    var _oldEnterCourse = window.enterCourse;
    window.enterCourse = function(id) {
        if (typeof _oldEnterCourse === 'function') _oldEnterCourse(id);
        if (!isMobile()) {
            window.schoolhubSetMainMenuAccordionState(true); // พับเมนูหลักอัตโนมัติ
        }
    };

    var _oldGoToHome = window.goToHome;
    window.goToHome = function() {
        if (typeof _oldGoToHome === 'function') _oldGoToHome();
        if (!isMobile()) {
            window.schoolhubSetMainMenuAccordionState(false); // กางเมนูหลักอัตโนมัติ
        }
    };

    window.addEventListener('resize', function() {
        if (!isMobile()) applySidebarWidth(getCollapsedPref());
    });

    setInterval(forceSidebarVisible, 1000);
    init();
    window.schoolhubApplySidebarCollapseNow = init;
})();
