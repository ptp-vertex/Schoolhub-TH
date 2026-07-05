/* =====================================================================
   PATCH v2: SchoolHub Tour Fixes
   แก้ไข 4 จุดหลัก:
   1) เพิ่มปุ่ม FAB "เรียนรู้เพิ่มเติม" ลอยทุกหน้า กดแล้วทำงานทันที
   2) แก้ desktop ไม่เริ่ม tour ทันที (retry แบบยกเลิกได้ / ไม่ loop ซ้ำ)
   3) แก้ event listener ซ้อนซ้ำในตั้งค่า
   4) แก้ส่วน "เรียนรู้เพิ่มเติม" ไม่แสดงในตั้งค่า ทั้งคอมและมือถือ
   ===================================================================== */
(function () {
    'use strict';

    /* ---------------------------------------------------------------- */
    /* ตัวแปรสถานะ patch                                                 */
    /* ---------------------------------------------------------------- */
    var fabEl = null;
    var fabVisible = true;   // สถานะที่ควรเป็น (ก่อน override จาก tour/modal)
    var tourRunning = false; // ติดตาม overlay state

    /* ---------------------------------------------------------------- */
    /* Utility                                                           */
    /* ---------------------------------------------------------------- */
    function shToast(msg) {
        var t = document.createElement('div');
        t.textContent = msg;
        t.style.cssText = [
            'position:fixed', 'top:20px', 'left:50%', 'transform:translateX(-50%)',
            'background:#1e1b4b', 'color:#fff', 'padding:12px 24px',
            'border-radius:9999px', 'font-size:14px', 'font-weight:700',
            'z-index:2147483647', 'box-shadow:0 4px 20px rgba(30,27,75,.45)',
            'pointer-events:none', 'opacity:1', 'transition:opacity .5s',
            'font-family:inherit', 'white-space:nowrap'
        ].join(';');
        document.body.appendChild(t);
        setTimeout(function () { t.style.opacity = '0'; }, 2200);
        setTimeout(function () { t.parentNode && t.parentNode.removeChild(t); }, 2800);
    }

    function setFabDisplay(show) {
        if (!fabEl) return;
        fabEl.style.opacity = show ? '1' : '0';
        fabEl.style.pointerEvents = show ? 'auto' : 'none';
        if (!show) fabEl.style.transform = 'scale(0.8)';
        else if (!fabEl.matches(':hover')) fabEl.style.transform = '';
    }

    function recalcFabBottom() {
        if (!fabEl) return;
        var isM = window.matchMedia('(max-width:767px)').matches;
        fabEl.style.bottom = isM ? '76px' : '24px';
    }

    function isMobileView() {
        return window.matchMedia('(max-width:767px)').matches;
    }

    /* ---------------------------------------------------------------- */
    /* 1) FAB Button "เรียนรู้เพิ่มเติม"                                  */
    /* ---------------------------------------------------------------- */
    function injectFAB() {
        if (document.getElementById('sh-learn-more-fab')) return;

        var fab = document.createElement('button');
        fab.id = 'sh-learn-more-fab';
        fab.type = 'button';
        fab.setAttribute('data-schoolhub-always-allowed', '1');
        fab.innerHTML =
            '<i class="fas fa-graduation-cap" style="font-size:15px;flex-shrink:0"></i>' +
            '<span style="font-size:13px;font-weight:800;white-space:nowrap;line-height:1">เรียนรู้เพิ่มเติม</span>';

        fab.style.cssText = [
            'position:fixed',
            isMobileView() ? 'bottom:76px' : 'bottom:24px',
            'right:16px',
            'z-index:2147483600',
            'background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)',
            'color:#fff',
            'border:none',
            'border-radius:9999px',
            'padding:11px 18px 11px 14px',
            'display:flex',
            'align-items:center',
            'gap:8px',
            'box-shadow:0 4px 20px rgba(79,70,229,.55)',
            'cursor:pointer',
            'transition:opacity .2s,transform .2s,box-shadow .2s',
            'user-select:none',
            '-webkit-user-select:none',
            'font-family:inherit',
            'outline:none',
            'opacity:0',           /* fade in หลัง login */
            'pointer-events:none'
        ].join(';');

        fab.addEventListener('mouseenter', function () {
            if (!tourRunning) {
                fab.style.transform = 'scale(1.05) translateY(-2px)';
                fab.style.boxShadow = '0 8px 32px rgba(79,70,229,.65)';
            }
        });
        fab.addEventListener('mouseleave', function () {
            if (!tourRunning) {
                fab.style.transform = '';
                fab.style.boxShadow = '0 4px 20px rgba(79,70,229,.55)';
            }
        });
        fab.addEventListener('touchstart', function () {
            fab.style.transform = 'scale(0.96)';
        }, { passive: true });
        fab.addEventListener('touchend', function () {
            fab.style.transform = '';
        }, { passive: true });

        fab.addEventListener('click', function (e) {
            e.stopPropagation();
            if (!window.schoolhubTour) {
                shToast('❌ ยังโหลดระบบสอนไม่เสร็จ กรุณารอสักครู่');
                return;
            }
            window.schoolhubTour.resetAll();
            shToast('🎓 เริ่มสอนการใช้งานใหม่ทั้งหมดแล้ว!');
            setTimeout(function () { window.schoolhubTour.run(); }, 200);
        });

        document.body.appendChild(fab);
        fabEl = fab;

        /* fade in เมื่อ login สำเร็จ */
        waitForLogin();

        /* ซ่อนขณะ tour แสดง — ผูก observer เมื่อ overlay พร้อม */
        attachOverlayObserver();

        /* อัปเดต bottom เมื่อ resize */
        window.addEventListener('resize', recalcFabBottom);
    }

    /* รอ element ที่บ่งบอกว่า login แล้ว */
    function waitForLogin() {
        var attempts = 0;
        var maxAttempts = 120; /* 60 วินาที */
        var iv = setInterval(function () {
            attempts++;
            var loggedIn =
                document.getElementById('nav-dashboard') ||
                document.getElementById('course-grid') ||
                document.getElementById('mobile-hamburger-btn');
            if (loggedIn || attempts >= maxAttempts) {
                clearInterval(iv);
                if (fabEl) {
                    fabEl.style.opacity = '1';
                    fabEl.style.pointerEvents = 'auto';
                    fabVisible = true;
                }
            }
        }, 500);
    }

    /* ผูก observer ซ่อน FAB ขณะ tour overlay แสดง */
    function attachOverlayObserver() {
        var attempts = 0;
        var maxAttempts = 40; /* 20 วินาที */
        var iv = setInterval(function () {
            attempts++;
            var overlay = document.getElementById('sh-tour-overlay');
            if (overlay || attempts >= maxAttempts) {
                clearInterval(iv);
                if (!overlay) return;
                new MutationObserver(function () {
                    tourRunning = overlay.classList.contains('sh-tour-show');
                    setFabDisplay(!tourRunning);
                }).observe(overlay, { attributes: true, attributeFilter: ['class'] });
            }
        }, 500);
    }

    /* ผูก observer ซ่อน FAB บน mobile เมื่อ settings เปิด */
    function attachSettingsModalFabObserver(modal) {
        if (modal._shFabObserver) return;
        modal._shFabObserver = true;
        new MutationObserver(function () {
            var open = !modal.classList.contains('hidden');
            /* บน mobile: ซ่อน FAB เมื่อ settings เปิด เพื่อไม่บดบัง */
            if (isMobileView()) {
                setFabDisplay(open ? false : fabVisible);
            }
        }).observe(modal, { attributes: true, attributeFilter: ['class'] });
    }

    /* ---------------------------------------------------------------- */
    /* 2) Desktop tour ไม่เริ่มทันที — retry แบบยกเลิกได้                 */
    /* ---------------------------------------------------------------- */
    function startDesktopRetry() {
        var tourStarted = false;
        /* ดักจับว่า tour เริ่มแล้ว โดยดู overlay */
        var checkStarted = setInterval(function () {
            var overlay = document.getElementById('sh-tour-overlay');
            if (overlay && overlay.classList.contains('sh-tour-show')) {
                tourStarted = true;
                clearInterval(checkStarted);
            }
        }, 300);
        /* หยุด checkStarted หลัง 30 วินาที */
        setTimeout(function () { clearInterval(checkStarted); }, 30000);

        /* ดักจับ skip: ถ้าผู้ใช้กด "ข้าม" ให้หยุด retry */
        document.addEventListener('click', function onSkip(e) {
            if (e.target && e.target.getAttribute && e.target.getAttribute('data-sh-skip') !== null) {
                tourStarted = true; /* ถือว่า "จัดการแล้ว" */
                document.removeEventListener('click', onSkip, true);
            }
        }, true);

        /* schedule retries — หยุดทันทีถ้า tour เริ่มแล้ว */
        var delays = [600, 1400, 2800, 5000, 9000, 15000];
        delays.forEach(function (d) {
            setTimeout(function () {
                if (tourStarted) return;
                if (window.schoolhubTour && typeof window.schoolhubTour.run === 'function') {
                    window.schoolhubTour.run();
                }
            }, d);
        });
    }

    /* ---------------------------------------------------------------- */
    /* 3) แก้ renderSettingsCard ซ้ำ (event listeners ซ้อน)              */
    /* ---------------------------------------------------------------- */
    function patchRenderSettingsCard() {
        if (!window.schoolhubTour || window._shTourCardPatched) return;
        window._shTourCardPatched = true;

        var orig = window.schoolhubTour.renderSettingsCard;
        var busy = false;
        var lastContent = '';

        window.schoolhubTour.renderSettingsCard = function () {
            if (busy) return;
            var host = document.getElementById('schoolhub-tour-settings-host');
            /* ป้องกัน re-render โดยไม่จำเป็น — เปรียบเทียบ content เดิม */
            if (host && host.innerHTML && host.innerHTML === lastContent) return;

            busy = true;
            try {
                orig();
                host = document.getElementById('schoolhub-tour-settings-host');
                if (host) lastContent = host.innerHTML;
            } catch (e) {
                console.warn('SchoolHub tour: renderSettingsCard error', e);
            }
            busy = false;
        };
    }

    /* ---------------------------------------------------------------- */
    /* 4) แก้ settings card ไม่แสดง ทั้ง mobile + desktop               */
    /* ---------------------------------------------------------------- */
    function tryRenderCard() {
        if (!window.schoolhubTour) return;
        var generalPanel = document.getElementById('schoolhub-settings-panel-general');
        if (!generalPanel) return;
        /* สร้าง host ถ้าหาย */
        if (!generalPanel.querySelector('#schoolhub-tour-settings-host')) {
            var host = document.createElement('div');
            host.id = 'schoolhub-tour-settings-host';
            host.setAttribute('data-schoolhub-always-allowed', '1');
            generalPanel.appendChild(host);
        }
        window.schoolhubTour.renderSettingsCard();
    }

    function attachSettingsModalCardObserver(modal) {
        if (modal._shCardObserver) return;
        modal._shCardObserver = true;

        var lastOpen = !modal.classList.contains('hidden');
        new MutationObserver(function () {
            var nowOpen = !modal.classList.contains('hidden');
            if (nowOpen && !lastOpen) {
                /* settings เพิ่งเปิด */
                setTimeout(tryRenderCard, 250);
                setTimeout(tryRenderCard, 700); /* retry สำรอง */
            }
            lastOpen = nowOpen;
        }).observe(modal, { attributes: true, attributeFilter: ['class'] });

        /* ถ้าเปิดอยู่แล้วตอน attach */
        if (!modal.classList.contains('hidden')) {
            setTimeout(tryRenderCard, 300);
        }
    }

    function attachSettingsTabsObserver(tabs) {
        if (tabs._shTabObserver) return;
        tabs._shTabObserver = true;
        tabs.addEventListener('click', function (e) {
            var btn = e.target.closest('[data-settings-tab]');
            if (btn && btn.getAttribute('data-settings-tab') === 'general') {
                setTimeout(tryRenderCard, 250);
                setTimeout(tryRenderCard, 700);
            }
        }, true);
    }

    /* ผูก observer กับ settings modal / tabs — รองรับกรณี DOM โหลดช้า */
    function patchSettingsElements() {
        var modal = document.getElementById('settings-modal');
        if (modal) {
            attachSettingsModalCardObserver(modal);
            attachSettingsModalFabObserver(modal);
        }
        var tabs = document.getElementById('schoolhub-settings-tabs');
        if (tabs) attachSettingsTabsObserver(tabs);
    }

    /* ถ้า settings-modal ยังไม่อยู่ใน DOM ให้รอและ patch ทีหลัง */
    function watchForSettingsModal() {
        if (document.getElementById('settings-modal')) {
            patchSettingsElements();
            return;
        }
        /* ใช้ MutationObserver บน body เฝ้าดู modal ที่โหลดทีหลัง */
        var obs = new MutationObserver(function () {
            if (document.getElementById('settings-modal')) {
                obs.disconnect();
                patchSettingsElements();
            }
        });
        obs.observe(document.body, { childList: true, subtree: true });
        /* disconnect หลัง 30 วินาท ีถ้าไม่เจอ */
        setTimeout(function () { obs.disconnect(); }, 30000);
    }

    /* ---------------------------------------------------------------- */
    /* Boot                                                              */
    /* ---------------------------------------------------------------- */
    function boot() {
        injectFAB();
        startDesktopRetry();
        watchForSettingsModal();

        /* รอ schoolhubTour พร้อมแล้ว patch renderSettingsCard */
        var tries = 0;
        var iv = setInterval(function () {
            tries++;
            if (window.schoolhubTour) {
                clearInterval(iv);
                patchRenderSettingsCard();
                patchSettingsElements(); /* retry หลังจาก tour engine ready */
            }
            if (tries > 80) clearInterval(iv);
        }, 250);
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(boot, 150);
    } else {
        document.addEventListener('DOMContentLoaded', boot);
    }
})();
