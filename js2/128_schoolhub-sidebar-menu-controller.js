
/*
  ULTIMATE SIDEBAR & MENU CONTROLLER (v14 - Relocation Method)
  - จัดการ Sidebar แนวนอน (10 วิย่ออัตโนมัติ)
  - จัดการเมนูหลัก (Accordion): ย้ายเมนูที่ฝังเพิ่มมาไปไว้ใต้กลุ่มเมนูหลัก เพื่อให้พับ/กางได้ 100%
*/
(function () {
    if (window.__schoolhubSidebarUnifiedInitV14Enhanced) return;
    window.__schoolhubSidebarUnifiedInitV14Enhanced = true;

    var STORAGE_KEY = 'schoolhub_sidebar_collapsed';
    var userInteractedWithSidebar = false; 
    var userInteractedWithMainMenu = false;
    var AUTO_COLLAPSE_MS = 10000;

    function isMobile() { return window.innerWidth < 768; }
    function getSidebar() { return document.getElementById('sh-sidebar'); }

    // ฟังก์ชันย้ายเมนูที่ฝังเพิ่มมาไปไว้ในกลุ่มเมนูหลัก
    function relocateEmbeddedMenus() {
        var label = document.getElementById('nav-main-label');
        if (!label) return;

        // ค้นหาเมนูที่ถูกฝัง (ใช้ class ที่ระบบเมนูเสริมใช้)
        var embeddedButtons = document.querySelectorAll('.shcm-user-nav-btn');
        embeddedButtons.forEach(function(btn) {
            // ถ้าปุ่มนี้ยังไม่ได้ถูกย้ายมาอยู่หลัง label (หรืออยู่ในตำแหน่งที่ถูกต้อง)
            // เราจะย้ายมันมาต่อท้ายกลุ่มเมนูหลัก
            if (btn.parentElement !== label.parentElement || btn.previousElementSibling === null) {
                // หาจุดแทรก: แทรกก่อนเมนูประจำวิชา หรือแทรกต่อจากตัวสุดท้ายในกลุ่มเมนูหลัก
                var courseMenu = document.getElementById('course-context-menu');
                if (courseMenu) {
                    label.parentElement.insertBefore(btn, courseMenu);
                } else {
                    label.parentElement.appendChild(btn);
                }
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

    // ฟังก์ชันย่อ/กาง เมนูหลัก (รวมเมนูที่ถูกย้ายมาแล้ว)
    window.schoolhubSetMainMenuAccordionState = function(collapsed, fromUserInteraction = false) {
        if (fromUserInteraction) {
            userInteractedWithMainMenu = true;
        }

        var label = document.getElementById('nav-main-label');
        if (!label) return;

        // ย้ายเมนูก่อนจัดการสถานะ เพื่อให้ครอบคลุมตัวที่เพิ่งโหลดมา
        relocateEmbeddedMenus();

        // รายการ ID เมนูหลักพื้นฐาน
        var baseMenuIds = ['nav-dashboard', 'nav-students', 'nav-import-excel', 'nav-user-plans', 'nav-settings'];
        
        // 1. จัดการเมนูพื้นฐาน
        baseMenuIds.forEach(function(id) {
            var el = document.getElementById(id);
            if (el) {
                if (collapsed) el.style.setProperty('display', 'none', 'important');
                else if (!el.classList.contains('hidden')) el.style.setProperty('display', 'flex', 'important');
            }
        });

        // 2. จัดการเมนูที่ถูกฝัง (ที่ย้ายมาแล้ว)
        document.querySelectorAll('.shcm-user-nav-btn').forEach(function(btn) {
            if (collapsed) btn.style.setProperty('display', 'none', 'important');
            else btn.style.setProperty('display', 'flex', 'important');
        });
        
        // 3. อัปเดตหัวข้อเมนูหลัก
        label.style.cursor = 'pointer';
        label.style.setProperty('display', 'block', 'important');
        label.innerHTML = `<div class="flex items-center justify-between w-full">
            <span>เมนูหลัก</span>
            <i class="fas ${collapsed ? 'fa-chevron-down' : 'fa-chevron-up'} text-[10px] opacity-50"></i>
        </div>`;
        label.onclick = function(e) {
            e.preventDefault();
            var firstEl = document.getElementById(baseMenuIds[0]);
            var isCurrentlyCollapsed = firstEl && firstEl.style.display === 'none';
            window.schoolhubSetMainMenuAccordionState(!isCurrentlyCollapsed, true);
        };

        // 4. ปรับแต่งเมนูประจำวิชา
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

    // ใช้ MutationObserver ดักจับการเพิ่มเมนูใหม่ และสถานะเมนูวิชา
    var observer = new MutationObserver(function(mutations) {
        // ย้ายเมนูทันทีที่มีการเปลี่ยนแปลงใน DOM
        relocateEmbeddedMenus();

        mutations.forEach(function(mutation) {
            if (mutation.attributeName === 'class' && mutation.target.id === 'course-context-menu') {
                var courseMenu = document.getElementById('course-context-menu');
                if (courseMenu && !courseMenu.classList.contains('hidden')) {
                    if (!userInteractedWithMainMenu) window.schoolhubSetMainMenuAccordionState(true);
                } else {
                    if (!userInteractedWithMainMenu) window.schoolhubSetMainMenuAccordionState(false);
                }
            }
        });
    });

    function init() {
        if (isMobile()) return;
        
        var sidebarNav = document.querySelector('#sh-sidebar nav');
        if (sidebarNav) {
            observer.observe(sidebarNav, { childList: true, subtree: true, attributes: true });
        }

        var courseMenu = document.getElementById('course-context-menu');
        if (courseMenu) {
            if (!courseMenu.classList.contains('hidden')) {
                window.schoolhubSetMainMenuAccordionState(true);
            } else {
                window.schoolhubSetMainMenuAccordionState(false);
            }
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
        setTimeout(function() { window.schoolhubSetMainMenuAccordionState(true); }, 50);
    };

    var _oldHome = window.goToHome;
    window.goToHome = function() {
        if (typeof _oldHome === 'function') _oldHome();
        userInteractedWithMainMenu = false;
        setTimeout(function() { window.schoolhubSetMainMenuAccordionState(false); }, 50);
    };

    init();

    window.addEventListener('resize', function() {
        if (!isMobile()) {
            applySidebarWidth(false);
            localStorage.setItem(STORAGE_KEY, '0');
            userInteractedWithSidebar = false;
        } else {
            var aside = getSidebar();
            if (aside) aside.classList.add('hidden');
        }
    });

    setInterval(function() {
        relocateEmbeddedMenus();
        var aside = getSidebar();
        if (aside && !isMobile()) {
            aside.classList.remove('hidden');
            aside.style.setProperty('display', 'flex', 'important');
        }
    }, 1000);
})();
