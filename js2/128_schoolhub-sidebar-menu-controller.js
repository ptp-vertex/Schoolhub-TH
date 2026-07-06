
/*
  ULTIMATE SIDEBAR & MENU CONTROLLER (v14 - Enhanced)
  - จัดการ Sidebar แนวนอน (10 วิย่ออัตโนมัติ)
  - จัดการเมนูหลัก (Accordion): พับอัตโนมัติเมื่อเข้าหน้าวิชา และกางเมื่อออกหน้าหลัก
  - ใช้ MutationObserver เพื่อดักจับการเปลี่ยนหน้าและบังคับย่อเมนูหลักให้หายขาด
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
    var mainMenuIds = ['nav-dashboard', 'nav-students', 'nav-import-excel', 'nav-user-plans', 'nav-settings'];

    function applySidebarWidth(collapsed) {
        var aside = getSidebar();
        if (!aside) return;

        // Ensure sidebar is always visible on desktop
        if (!isMobile()) {
            aside.classList.remove('hidden');
            aside.style.setProperty('display', 'flex', 'important');
        }

        aside.classList.toggle('sh-sidebar-collapsed', !!collapsed);
        var icon = document.getElementById('sh-sidebar-toggle-icon');
        if (icon) icon.classList.toggle('sh-flip', !!collapsed);
    }

    // ฟังก์ชันย่อ/กาง เมนูหลัก
    window.schoolhubSetMainMenuAccordionState = function(collapsed, fromUserInteraction = false) {
        if (fromUserInteraction) {
            userInteractedWithMainMenu = true;
        }

        mainMenuIds.forEach(function(id) {
            var el = document.getElementById(id);
            if (!el) return;
            if (collapsed) {
                el.style.setProperty('display', 'none', 'important');
            } else {
                // Only show if it's not originally hidden by other logic (e.g., nav-import-excel)
                if (id === 'nav-import-excel' && el.classList.contains('hidden')) return;
                el.style.setProperty('display', 'flex', 'important');
            }
        });
        
        var label = document.getElementById('nav-main-label');
        if (label) {
            label.style.cursor = 'pointer';
            label.style.setProperty('display', 'block', 'important');
            // Update chevron icon based on state
            label.innerHTML = `<div class="flex items-center justify-between w-full">
                <span>เมนูหลัก</span>
                <i class="fas ${collapsed ? 'fa-chevron-down' : 'fa-chevron-up'} text-[10px] opacity-50"></i>
            </div>`;
            label.onclick = function(e) {
                e.preventDefault();
                var isCurrentlyCollapsed = document.getElementById(mainMenuIds[0]).style.display === 'none';
                window.schoolhubSetMainMenuAccordionState(!isCurrentlyCollapsed, true);
            };
        }

        // ปรับแต่งเมนูประจำวิชา (course-context-menu) ให้เลื่อนขึ้นเมื่อเมนูหลักพับ
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
                    var isMainMenuCollapsed = document.getElementById(mainMenuIds[0]).style.display === 'none';
                    if (!isMainMenuCollapsed && !userInteractedWithMainMenu) {
                        window.schoolhubSetMainMenuAccordionState(true);
                    }
                } else {
                    // ถ้าเมนูวิชาหายไป -> ให้กางเมนูหลัก (เฉพาะถ้าผู้ใช้ไม่ได้ย่อเอง)
                    var isMainMenuCollapsed = document.getElementById(mainMenuIds[0]).style.display === 'none';
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
            // เช็คครั้งแรกเมื่อโหลดหน้า
            if (!courseMenu.classList.contains('hidden')) {
                window.schoolhubSetMainMenuAccordionState(true);
            } else {
                window.schoolhubSetMainMenuAccordionState(false);
            }
        }

        // Sidebar แนวนอน
        // เมื่อโหลดหน้าเว็บ ให้แสดง Sidebar แบบเต็มเสมอ (ไม่สนค่าใน localStorage ตอนโหลดครั้งแรก)
        applySidebarWidth(false); // Start expanded
        localStorage.setItem(STORAGE_KEY, '0'); // Ensure localStorage reflects expanded state

        // ตั้งเวลาสำหรับย่ออัตโนมัติ
        setTimeout(function() {
            if (!userInteractedWithSidebar && !isMobile()) {
                applySidebarWidth(true);
                localStorage.setItem(STORAGE_KEY, '1');
            }
        }, AUTO_COLLAPSE_MS);
    }

    window.toggleSchoolHubSidebar = function () {
        userInteractedWithSidebar = true; // ผู้ใช้โต้ตอบแล้ว
        var aside = getSidebar();
        if (!aside) return;
        var next = !aside.classList.contains('sh-sidebar-collapsed');
        applySidebarWidth(next);
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    };

    // ป้องกันการทับซ้อนและเรียกใช้ฟังก์ชันเดิม
    var _oldEnter = window.enterCourse;
    window.enterCourse = function(id) {
        if (typeof _oldEnter === 'function') _oldEnter(id);
        // รีเซ็ต userInteractedWithMainMenu เมื่อเข้าหน้าวิชา เพื่อให้ MutationObserver ทำงานได้
        userInteractedWithMainMenu = false;
        setTimeout(function() { window.schoolhubSetMainMenuAccordionState(true); }, 50);
    };

    var _oldHome = window.goToHome;
    window.goToHome = function() {
        if (typeof _oldHome === 'function') _oldHome();
        // รีเซ็ต userInteractedWithMainMenu เมื่อกลับหน้าหลัก เพื่อให้ MutationObserver ทำงานได้
        userInteractedWithMainMenu = false;
        setTimeout(function() { window.schoolhubSetMainMenuAccordionState(false); }, 50);
    };

    init();

    // เมื่อขยายหน้าจอจากมือถือกลับมาเป็นเดสก์ท็อป Sidebar ต้องแสดงผลทันทีโดยไม่ต้องรีเฟรช
    window.addEventListener('resize', function() {
        if (!isMobile()) {
            // ถ้าเปลี่ยนจาก mobile เป็น desktop ให้แสดง sidebar แบบเต็มเสมอ
            applySidebarWidth(false);
            localStorage.setItem(STORAGE_KEY, '0');
            userInteractedWithSidebar = false; // รีเซ็ตสถานะการโต้ตอบ เพื่อให้ auto-collapse ทำงานได้อีกครั้ง
        } else {
            // บนมือถือ ให้ซ่อน sidebar
            var aside = getSidebar();
            if (aside) aside.classList.add('hidden');
        }
    });

    // ตรวจสอบและแสดง Sidebar ทุก 1 วินาที เพื่อความเสถียร (กรณีมี script อื่นมาซ่อน)
    setInterval(function() {
        var aside = getSidebar();
        if (aside && !isMobile()) {
            aside.classList.remove('hidden');
            aside.style.setProperty('display', 'flex', 'important');
        }
    }, 1000);
})();
