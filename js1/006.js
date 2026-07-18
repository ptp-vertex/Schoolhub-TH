
        // กันหน้าโหลดค้างแบบไม่พึ่ง Firebase Module: ถ้า module/import/error ทำงานไม่สำเร็จ จะปล่อยหน้าแรกออกมาเอง
        (function () {
            window.__schoolhubHardLoaderFallback = true;
            function releaseLoaderIfStuck() {
                var loader = document.getElementById('global-loader');
                var landing = document.getElementById('landing-view');
                var authView = document.getElementById('auth-view');
                var appView = document.getElementById('main-app');
                if (!loader) return;
                var loaderVisible = loader.style.display !== 'none' && !loader.classList.contains('hidden');
                var noMainScreen = (!landing || landing.classList.contains('hidden')) && (!authView || authView.classList.contains('hidden')) && (!appView || appView.classList.contains('hidden'));
                if (loaderVisible && noMainScreen) {
                    if (landing) landing.classList.remove('hidden');
                    loader.style.display = 'none';
                    console.warn('SchoolHub: hard loader fallback released the screen.');
                }
                if (typeof renderCachedAnnouncementTopbarFallback === 'function') renderCachedAnnouncementTopbarFallback();
            }
            window.addEventListener('error', function (event) {
                console.error('SchoolHub runtime error:', event && (event.message || event.error));
                setTimeout(releaseLoaderIfStuck, 200);
            });
            window.addEventListener('unhandledrejection', function (event) {
                console.error('SchoolHub promise error:', event && event.reason);
                setTimeout(releaseLoaderIfStuck, 200);
            });

            // FIX: แถบประกาศด้านบนไม่ขึ้นให้ผู้ใช้ทั่วไปสม่ำเสมอ (แต่แอดมินเห็นทุกครั้ง)
            // สาเหตุ: การแสดงประกาศจริงทำงานอยู่ใน js1/007.js ซึ่งเป็น Firebase module
            // (type="module") — ถ้าเครือข่ายของผู้เข้าชม (มือถือ/บริษัท/ตัวบล็อกโฆษณา)
            // โหลดสคริปต์จาก gstatic/googleapis ช้าหรือถูกบล็อก โมดูลนี้จะไม่ทำงานทันเวลา
            // (หรือไม่ทำงานเลย) ทำให้ onAuthStateChanged ไม่ยิง และไม่มีใครเรียก
            // renderPublicAnnouncements() ผู้ใช้จึงไม่เห็นแถบประกาศในรอบนั้น
            // แอดมินมักเปิดจากเครื่อง/เน็ตที่เสถียรกว่า โมดูลจึงโหลดสำเร็จทุกครั้ง เลยเห็นตลอด
            // วิธีแก้: มีตัวสำรองที่ไม่พึ่ง Firebase เลย อ่านแคชประกาศล่าสุดที่เคยโหลดสำเร็จ
            // (เก็บไว้ใน localStorage โดย 007.js ทุกครั้งที่โหลดสำเร็จ) มาแสดงแถบบนหน้าหลักไปก่อน
            // ถ้า 007.js โหลดสำเร็จภายหลัง มันจะ render ทับด้วยข้อมูลสดอีกที ไม่กระทบกัน
            function escAnnouncementFallback(v) {
                return String(v || '').replace(/[&<>'"]/g, function (ch) {
                    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch];
                });
            }
            function renderCachedAnnouncementTopbarFallback() {
                try {
                    if (typeof window.renderPublicAnnouncements === 'function') return; // 007.js โหลดสำเร็จแล้ว ปล่อยให้มันทำงานเอง
                    var topbar = document.getElementById('public-announcement-topbar');
                    if (!topbar || !topbar.classList.contains('hidden')) return; // มีอะไรแสดงอยู่แล้ว หรือหา element ไม่เจอ ไม่ต้องทำอะไร
                    var raw = localStorage.getItem('schoolhub_public_announcements_cache');
                    var items = raw ? JSON.parse(raw) : [];
                    if (!Array.isArray(items) || !items.length) return;
                    var now = Date.now();
                    var active = items.filter(function (a) {
                        if (!a || a.active === false) return false;
                        var start = a.startAt ? new Date(a.startAt).getTime() : null;
                        var end = a.endAt ? new Date(a.endAt).getTime() : null;
                        if (start && now < start) return false;
                        if (end && now > end) return false;
                        return true;
                    }).filter(function (a) {
                        return !a.scope || a.scope === 'both' || a.scope === 'landing';
                    }).filter(function (a) {
                        return a.type === 'topbar' || a.type === 'both';
                    });
                    if (!active.length) return;
                    var top = active[0];
                    topbar.classList.remove('hidden');
                    topbar.innerHTML = '<div class="bg-indigo-600 text-white px-4 py-3 shadow-lg"><div class="max-w-7xl mx-auto flex items-start gap-3"><i class="fas fa-bullhorn mt-1"></i><div class="flex-1 min-w-0"><b>ประกาศ</b><span class="mx-2 hidden sm:inline">•</span><span class="font-bold break-words">' + escAnnouncementFallback(top.title) + '</span><span class="mx-2 hidden sm:inline">•</span><span class="block sm:inline break-words">' + escAnnouncementFallback(top.message) + '</span></div></div></div>';
                } catch (e) { console.warn('SchoolHub: cached announcement fallback failed:', e); }
            }
            document.addEventListener('DOMContentLoaded', function () {
                setTimeout(renderCachedAnnouncementTopbarFallback, 1800);
                setTimeout(renderCachedAnnouncementTopbarFallback, 4500);
            });
            function simpleToggleAuth(mode){
                var login = document.getElementById('login-form');
                var reg = document.getElementById('register-form');
                var sub = document.getElementById('auth-subtitle');
                var isLogin = mode === 'login';
                if (login) login.classList.toggle('hidden', !isLogin);
                if (reg) reg.classList.toggle('hidden', isLogin);
                if (sub) sub.textContent = isLogin ? 'ระบบจัดการห้องเรียนอัจฉริยะ' : 'สร้างบัญชีใหม่เพื่อเริ่มต้นใช้งาน';
            }
            window.toggleAuthMode = window.toggleAuthMode || simpleToggleAuth;
            window.openLoginFromLanding = window.openLoginFromLanding || function(){
                var landing = document.getElementById('landing-view');
                var auth = document.getElementById('auth-view');
                var loader = document.getElementById('global-loader');
                if (loader) loader.style.display = 'none';
                if (landing) landing.classList.add('hidden');
                if (auth) auth.classList.remove('hidden');
                simpleToggleAuth('login');
            };
            window.openRegisterFromLanding = window.openRegisterFromLanding || function(){
                window.openLoginFromLanding();
                simpleToggleAuth('register');
            };
            window.backToLanding = window.backToLanding || function(){
                var landing = document.getElementById('landing-view');
                var auth = document.getElementById('auth-view');
                var loader = document.getElementById('global-loader');
                if (loader) loader.style.display = 'none';
                if (auth) auth.classList.add('hidden');
                if (landing) landing.classList.remove('hidden');
            };
            window.scrollToLandingPlans = window.scrollToLandingPlans || function(){
                var el = document.getElementById('landing-plans-section');
                if (el) el.scrollIntoView({behavior:'smooth', block:'start'});
            };
            window.requestSubscriptionPlan = window.requestSubscriptionPlan || function(planId){
                try { localStorage.setItem('schoolhub_pending_plan_request_id', planId || ''); } catch(e) {}
                window.openRegisterFromLanding();
            };
            document.addEventListener('DOMContentLoaded', function () {
                setTimeout(releaseLoaderIfStuck, 4500);
                setTimeout(releaseLoaderIfStuck, 9000);
            });
        })();
    