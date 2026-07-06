/*
  ULTIMATE SIDEBAR & MENU CONTROLLER (v14)
  - จัดการ Sidebar แนวนอน (10 วิย่ออัตโนมัติ)
  - จัดการเมนูหลัก (Accordion): พับอัตโนมัติเมื่อเข้าหน้าวิชา และกางเมื่อออกหน้าหลัก
  - ใช้ MutationObserver เพื่อดักจับการเปลี่ยนหน้าและบังคับย่อเมนูหลักให้หายขาด
*/
(function () {
    if (window.__schoolhubSidebarUnifiedInitV14) return;
    window.__schoolhubSidebarUnifiedInitV14 = true;

    var STORAGE_KEY = 'schoolhub_sidebar_collapsed';
    var userInteracted = false; 
    var AUTO_COLLAPSE_MS = 10000;

    function isMobile() { return window.innerWidth < 768; }
    function getSidebar() { return document.getElementById('sh-sidebar'); }
    var mainMenuIds = ['nav-dashboard', 'nav-students', 'nav-import-excel', 'nav-user-plans', 'nav-settings'];

    function applySidebarWidth(collapsed) {
        var aside = getSidebar();
        if (!aside || isMobile()) return;
        aside.classList.remove('hidden');
        aside.style.setProperty('display', 'flex', 'important');
        aside.classList.toggle('sh-sidebar-collapsed', !!collapsed);
        var icon = document.getElementById('sh-sidebar-toggle-icon');
        if (icon) icon.classList.toggle('sh-flip', !!collapsed);
    }

    // ฟังก์ชันย่อ/กาง เมนูหลัก
    window.schoolhubSetMainMenuAccordionState = function(collapsed) {
        mainMenuIds.forEach(function(id) {
            var el = document.getElementById(id);
            if (!el) return;
            if (collapsed) {
                el.style.setProperty('display', 'none', 'important');
            } else {
                if (id === 'nav-import-excel' && el.classList.contains('hidden')) return;
                el.style.setProperty('display', 'flex', 'important');
            }
        });
        
        var label = document.getElementById('nav-main-label');
        if (label) {
            label.style.cursor = 'pointer';
            label.style.setProperty('display', 'block', 'important');
            label.innerHTML = `<div class="flex items-center justify-between w-full">
                <span>เมนูหลัก</span>
                <i class="fas ${collapsed ? 'fa-chevron-down' : 'fa-chevron-up'} text-[10px] opacity-50"></i>
            </div>`;
            label.onclick = function(e) {
                e.preventDefault();
                var isCurrentlyCollapsed = document.getElementById(mainMenuIds[0]).style.display === 'none';
                window.schoolhubSetMainMenuAccordionState(!isCurrentlyCollapsed);
            };
        }

        // ปรับแต่งเมนูประจำวิชา
        var courseMenu = document.getElementById('course-context-menu');
        if (courseMenu) {
            if (collapsed) {
                courseMenu.style.setProperty('margin-top', '0.5rem', 'important');
                var cLabel = document.getElementById('sidebar-course-name');
                if (cLabel) {
                    cLabel.style.setProperty('margin-top', '0.5rem', 'important');
                    cLabel.style.setProperty('border-top', '1px solid #f1f5f9', 'important');
                    cLabel.style.setProperty('padding-top', '1rem', 'important');
                }
            } else {
                courseMenu.style.removeProperty('margin-top');
                var cLabel = document.getElementById('sidebar-course-name');
                if (cLabel) {
                    cLabel.style.removeProperty('margin-top');
                    cLabel.style.removeProperty('border-top');
                    cLabel.style.removeProperty('padding-top');
                }
            }
        }
    };

    // ใช้ MutationObserver ดักจับการแสดงผลเมนูวิชา
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === 'class') {
                var courseMenu = document.getElementById('course-context-menu');
                if (courseMenu && !courseMenu.classList.contains('hidden')) {
                    // ถ้าเมนูวิชาโผล่มา และเมนูหลักยังไม่ย่อ -> ให้ย่อ
                    var isCollapsed = document.getElementById(mainMenuIds[0]).style.display === 'none';
                    if (!isCollapsed) window.schoolhubSetMainMenuAccordionState(true);
                } else {
                    // ถ้าเมนูวิชาหายไป -> ให้กางเมนูหลัก
                    var isCollapsed = document.getElementById(mainMenuIds[0]).style.display === 'none';
                    if (isCollapsed) window.schoolhubSetMainMenuAccordionState(false);
                }
            }
        });
    });

    function init() {
        if (isMobile()) return;
        
        var courseMenu = document.getElementById('course-context-menu');
        if (courseMenu) {
            observer.observe(courseMenu, { attributes: true });
            // เช็คครั้งแรก
            if (!courseMenu.classList.contains('hidden')) {
                window.schoolhubSetMainMenuAccordionState(true);
            } else {
                window.schoolhubSetMainMenuAccordionState(false);
            }
        }

        // Sidebar แนวนอน
        applySidebarWidth(localStorage.getItem(STORAGE_KEY) === '1');
        setTimeout(function() {
            if (!userInteracted && !isMobile()) {
                applySidebarWidth(true);
                localStorage.setItem(STORAGE_KEY, '1');
            }
        }, AUTO_COLLAPSE_MS);
    }

    window.toggleSchoolHubSidebar = function () {
        userInteracted = true;
        var aside = getSidebar();
        if (!aside) return;
        var next = !aside.classList.contains('sh-sidebar-collapsed');
        applySidebarWidth(next);
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    };

    // ป้องกันการทับซ้อน
    var _oldEnter = window.enterCourse;
    window.enterCourse = function(id) {
        if (typeof _oldEnter === 'function') _oldEnter(id);
        setTimeout(function() { window.schoolhubSetMainMenuAccordionState(true); }, 50);
    };

    var _oldHome = window.goToHome;
    window.goToHome = function() {
        if (typeof _oldHome === 'function') _oldHome();
        setTimeout(function() { window.schoolhubSetMainMenuAccordionState(false); }, 50);
    };

    init();
    window.addEventListener('resize', function() { if (!isMobile()) applySidebarWidth(localStorage.getItem(STORAGE_KEY) === '1'); });
    setInterval(function() {
        var aside = getSidebar();
        if (aside && !isMobile()) aside.classList.remove('hidden');
    }, 1000);
})();
