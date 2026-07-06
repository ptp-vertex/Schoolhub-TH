
/*
  ULTIMATE SIDEBAR & MENU CONTROLLER (v16 - Wrapper Method)
  - จัดการ Sidebar แนวนอน (10 วิย่ออัตโนมัติ)
  - จัดการเมนูหลัก (Accordion): ย้ายเมนูที่ฝังเพิ่มมาไปไว้ใน #main-menu-wrapper และสั่งพับ Wrapper ทั้งหมด
  - นี่คือวิธีที่เด็ดขาดที่สุด เพราะจัดการที่ Container หลัก
*/
(function () {
    if (window.__schoolhubSidebarUnifiedInitV16) return;
    window.__schoolhubSidebarUnifiedInitV16 = true;

    var STORAGE_KEY = 'schoolhub_sidebar_collapsed';
    var userInteractedWithSidebar = false; 
    var userInteractedWithMainMenu = false;
    var AUTO_COLLAPSE_MS = 10000;

    function isMobile() { return window.innerWidth < 768; }
    function getSidebar() { return document.getElementById('sh-sidebar'); }

    // ฟังก์ชันย้ายเมนูที่ฝังเพิ่มมาไปไว้ใน Wrapper
    function relocateEmbeddedMenus() {
        var wrapper = document.getElementById('main-menu-wrapper');
        if (!wrapper) return;

        // ค้นหาเมนูที่ถูกฝัง (shcm-user-nav-btn) ที่อยู่นอก wrapper
        var embeddedButtons = document.querySelectorAll('.shcm-user-nav-btn');
        embeddedButtons.forEach(function(btn) {
            if (btn.parentElement !== wrapper) {
                // ย้ายเข้ามาไว้ใน wrapper ต่อท้ายเมนูอื่นๆ
                wrapper.appendChild(btn);
            }
        });
    }

    function applySidebarWidth(collapsed) {
        var aside = getSidebar();
        if (!aside) return;
        if (!isMobile()) {
            aside.classList.remove('hidden');
            aside.style.setProperty('display', 'flex', 'important');
        }
        aside.classList.toggle('sh-sidebar-collapsed', !!collapsed);
        var icon = document.getElementById('sh-sidebar-toggle-icon');
        if (icon) icon.classList.toggle('sh-flip', !!collapsed);
    }

    window.schoolhubSetMainMenuAccordionState = function(collapsed, fromUserInteraction = false) {
        if (fromUserInteraction) {
            userInteractedWithMainMenu = true;
        }

        var label = document.getElementById('nav-main-label');
        var wrapper = document.getElementById('main-menu-wrapper');
        if (!label || !wrapper) return;

        // ย้ายเมนูที่ฝังมาก่อนสั่งพับ
        relocateEmbeddedMenus();

        if (collapsed) {
            wrapper.style.setProperty('display', 'none', 'important');
        } else {
            wrapper.style.setProperty('display', 'block', 'important');
            // ตรวจสอบว่าเมนูภายใน wrapper ตัวไหนควรแสดงบ้าง (เผื่อมีตัวที่ระบบตั้งใจซ่อน)
            Array.from(wrapper.children).forEach(function(child) {
                if (!child.classList.contains('hidden')) {
                    child.style.setProperty('display', 'flex', 'important');
                }
            });
        }
        
        // อัปเดต UI หัวข้อ
        label.style.cursor = 'pointer';
        label.style.setProperty('display', 'block', 'important');
        label.innerHTML = `<div class="flex items-center justify-between w-full pointer-events-none">
            <span>เมนูหลัก</span>
            <i class="fas ${collapsed ? 'fa-chevron-down' : 'fa-chevron-up'} text-[10px] opacity-50"></i>
        </div>`;
        
        label.onclick = function(e) {
            var isCurrentlyCollapsed = wrapper.style.display === 'none';
            window.schoolhubSetMainMenuAccordionState(!isCurrentlyCollapsed, true);
        };

        // ปรับ UI เมนูวิชา
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

    function checkCourseMenuState() {
        var courseMenu = document.getElementById('course-context-menu');
        var wrapper = document.getElementById('main-menu-wrapper');
        if (!courseMenu || !wrapper || userInteractedWithMainMenu) return;
        
        var isCourseVisible = !courseMenu.classList.contains('hidden');
        var isCurrentlyCollapsed = wrapper.style.display === 'none';
        
        if (isCourseVisible && !isCurrentlyCollapsed) {
            window.schoolhubSetMainMenuAccordionState(true);
        } else if (!isCourseVisible && isCurrentlyCollapsed) {
            window.schoolhubSetMainMenuAccordionState(false);
        }
    }

    function init() {
        if (isMobile()) return;
        
        relocateEmbeddedMenus();
        checkCourseMenuState();

        var sidebarNav = document.querySelector('#sh-sidebar nav');
        if (sidebarNav) {
            var observer = new MutationObserver(function() {
                relocateEmbeddedMenus();
                checkCourseMenuState();
            });
            observer.observe(sidebarNav, { attributes: true, childList: true, subtree: true });
        }

        applySidebarWidth(false);
        localStorage.setItem(STORAGE_KEY, '0');

        setTimeout(function() {
            if (!userInteractedWithSidebar && !isMobile()) {
                applySidebarWidth(true);
                localStorage.setItem(STORAGE_KEY, '1');
            }
        }, AUTO_COLLAPSE_MS);
    }

    window.toggleSchoolHubSidebar = function () {
        userInteractedWithSidebar = true;
        var aside = getSidebar();
        if (!aside) return;
        var next = !aside.classList.contains('sh-sidebar-collapsed');
        applySidebarWidth(next);
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    };

    var _oldEnter = window.enterCourse;
    window.enterCourse = function(id) {
        if (typeof _oldEnter === 'function') _oldEnter(id);
        userInteractedWithMainMenu = false;
        setTimeout(checkCourseMenuState, 100);
    };

    var _oldHome = window.goToHome;
    window.goToHome = function() {
        if (typeof _oldHome === 'function') _oldHome();
        userInteractedWithMainMenu = false;
        setTimeout(checkCourseMenuState, 100);
    };

    init();

    window.addEventListener('resize', function() {
        if (!isMobile()) {
            applySidebarWidth(false);
            localStorage.setItem(STORAGE_KEY, '0');
            userInteractedWithSidebar = false;
        }
    });

    setInterval(function() {
        relocateEmbeddedMenus();
        checkCourseMenuState();
    }, 1000);
})();
