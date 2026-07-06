
/*
  ULTIMATE SIDEBAR & MENU CONTROLLER (v14 - Universal Dynamic)
  - จัดการ Sidebar แนวนอน (10 วิย่ออัตโนมัติ)
  - จัดการเมนูหลัก (Accordion): พับทุกอย่างที่อยู่ระหว่าง "เมนูหลัก" ถึง "เมนูประจำวิชา"
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

    // ฟังก์ชันย่อ/กาง เมนูหลักแบบครอบคลุมทั้งหมด
    window.schoolhubSetMainMenuAccordionState = function(collapsed, fromUserInteraction = false) {
        if (fromUserInteraction) {
            userInteractedWithMainMenu = true;
        }

        var label = document.getElementById('nav-main-label');
        if (!label) return;

        // ค้นหา Element ทั้งหมดที่อยู่ถัดจาก label (เมนูหลัก) จนถึงเมนูประจำวิชา
        var current = label.nextElementSibling;
        while (current) {
            // หยุดถ้าเจอเมนูประจำวิชา หรือเมนูแอดมิน (ถ้าต้องการแยก)
            if (current.id === 'course-context-menu' || current.id === 'admin-menu-group') break;
            
            // พับ/กาง Element นั้นๆ
            if (collapsed) {
                current.style.setProperty('display', 'none', 'important');
            } else {
                // ตรวจสอบว่าเดิมทีมันถูกซ่อนด้วย class 'hidden' หรือไม่
                if (!current.classList.contains('hidden')) {
                    // กำหนดการแสดงผลตามประเภท Element
                    var displayType = (current.tagName === 'BUTTON' || current.tagName === 'A') ? 'flex' : 'block';
                    current.style.setProperty('display', displayType, 'important');
                }
            }
            current = current.nextElementSibling;
        }
        
        // อัปเดตหัวข้อและไอคอน
        label.style.cursor = 'pointer';
        label.style.setProperty('display', 'block', 'important');
        label.innerHTML = `<div class="flex items-center justify-between w-full">
            <span>เมนูหลัก</span>
            <i class="fas ${collapsed ? 'fa-chevron-down' : 'fa-chevron-up'} text-[10px] opacity-50"></i>
        </div>`;
        label.onclick = function(e) {
            e.preventDefault();
            // ตรวจสอบสถานะจากตัวถัดไปของ label
            var nextEl = label.nextElementSibling;
            var isCurrentlyCollapsed = nextEl && nextEl.style.display === 'none';
            window.schoolhubSetMainMenuAccordionState(!isCurrentlyCollapsed, true);
        };

        // ปรับแต่งระยะห่างเมนูประจำวิชา
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

    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === 'class') {
                var courseMenu = document.getElementById('course-context-menu');
                if (courseMenu && !courseMenu.classList.contains('hidden')) {
                    var label = document.getElementById('nav-main-label');
                    var nextEl = label ? label.nextElementSibling : null;
                    var isMainMenuCollapsed = nextEl && nextEl.style.display === 'none';
                    if (!isMainMenuCollapsed && !userInteractedWithMainMenu) {
                        window.schoolhubSetMainMenuAccordionState(true);
                    }
                } else {
                    var label = document.getElementById('nav-main-label');
                    var nextEl = label ? label.nextElementSibling : null;
                    var isMainMenuCollapsed = nextEl && nextEl.style.display === 'none';
                    if (isMainMenuCollapsed && !userInteractedWithMainMenu) {
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
            observer.observe(courseMenu, { attributes: true });
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
