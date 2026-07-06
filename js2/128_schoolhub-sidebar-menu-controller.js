
/*
  ULTIMATE SIDEBAR & MENU CONTROLLER (v14 - Absolute Isolation Method)
  - จัดการ Sidebar แนวนอน (10 วิย่ออัตโนมัติ)
  - จัดการเมนูหลัก (Accordion): เมื่อเข้าหน้าวิชา ให้ซ่อน "ทุกอย่าง" ใน Sidebar ยกเว้นเมนูประจำวิชาและปุ่มออกระบบ
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

    // สร้าง Style Element สำหรับฉีด CSS แบบครอบจักรวาล
    var accordionStyle = document.createElement('style');
    accordionStyle.id = 'sh-accordion-absolute-style';
    document.head.appendChild(accordionStyle);

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

    // ฟังก์ชันย่อ/กาง เมนูหลักแบบ Absolute (ซ่อนทุกอย่างที่ไม่เกี่ยวข้อง)
    window.schoolhubSetMainMenuAccordionState = function(collapsed, fromUserInteraction = false) {
        if (fromUserInteraction) {
            userInteractedWithMainMenu = true;
        }

        var sidebarNav = document.querySelector('#sh-sidebar nav');
        if (!sidebarNav) return;

        if (collapsed) {
            // กฎเหล็ก: ซ่อนลูกทั้งหมดของ nav ยกเว้นตัวที่มี ID เป็น course-context-menu
            // และซ่อนส่วนอื่นๆ ของ Sidebar เช่น Profile Area เพื่อให้เมนูวิชาขึ้นไปบนสุด
            accordionStyle.innerHTML = `
                #sh-sidebar nav > *:not(#course-context-menu) { display: none !important; }
                #sh-sidebar > div:not(.p-4.border-t):not(nav) { display: none !important; }
                #course-context-menu { display: block !important; margin-top: 0 !important; }
                #sidebar-course-name { border-top: none !important; margin-top: 0 !important; padding-top: 0 !important; }
            `;
        } else {
            accordionStyle.innerHTML = '';
        }
        
        // อัปเดตหัวข้อเมนูหลัก (แสดงเฉพาะเมื่อไม่ได้พับแบบ Absolute หรือเพื่อใช้เป็นปุ่มกาง)
        var label = document.getElementById('nav-main-label');
        if (label) {
            label.style.cursor = 'pointer';
            // ถ้าพับอยู่ ให้ label นี้แสดงผลออกมาตัวเดียวเพื่อให้กดกางได้ (ถ้าต้องการ)
            // แต่ตามเงื่อนไขคือพับเพื่อให้เมนูวิชาขึ้นบนสุด ดังนั้นเราจะให้มันซ่อนไปเลยตามกฎข้างบน
            label.innerHTML = `<div class="flex items-center justify-between w-full">
                <span>เมนูหลัก</span>
                <i class="fas ${collapsed ? 'fa-chevron-down' : 'fa-chevron-up'} text-[10px] opacity-50"></i>
            </div>`;
            label.onclick = function(e) {
                e.preventDefault();
                var isCurrentlyCollapsed = accordionStyle.innerHTML !== '';
                window.schoolhubSetMainMenuAccordionState(!isCurrentlyCollapsed, true);
            };
        }
    };

    // ตรวจสอบสถานะหน้าปัจจุบันผ่าน MutationObserver ของเมนูประจำวิชา
    var courseObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === 'class') {
                var courseMenu = document.getElementById('course-context-menu');
                // ถ้าเมนูวิชา "ไม่ซ่อน" (คือเข้าหน้าวิชาแล้ว)
                if (courseMenu && !courseMenu.classList.contains('hidden')) {
                    if (!userInteractedWithMainMenu) {
                        window.schoolhubSetMainMenuAccordionState(true);
                    }
                } else {
                    // ถ้าเมนูวิชาซ่อนอยู่ (คืออยู่หน้าหลัก)
                    if (!userInteractedWithMainMenu) {
                        window.schoolhubSetMainMenuAccordionState(false);
                    }
                }
            }
        });
    });

    function init() {
        if (isMobile()) return;
        
        var courseMenu = document.getElementById('course-context-menu');
        if (courseMenu) {
            courseObserver.observe(courseMenu, { attributes: true });
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
        var aside = getSidebar();
        if (aside && !isMobile()) {
            aside.classList.remove('hidden');
            aside.style.setProperty('display', 'flex', 'important');
        }
    }, 1000);
})();
