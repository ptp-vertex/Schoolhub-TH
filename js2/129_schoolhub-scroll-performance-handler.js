
(function() {
    'use strict';

    var scrollTimer = null;
    var body = document.body;
    var isScrolling = false;

    // ใช้ requestAnimationFrame เพื่อให้การจัดการ class 'scrolling' ทำงานได้ตรงตามจังหวะหน้าจอ (60fps/120fps)
    function handleScroll() {
        if (!isScrolling) {
            isScrolling = true;
            body.classList.add('scrolling');
        }
        
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(function() {
            isScrolling = false;
            body.classList.remove('scrolling');
            scrollTimer = null;
        }, 100); // ลดเวลาลงเพื่อให้กลับมาสวยงามได้เร็วขึ้นหลังหยุดสโครล
    }

    window.addEventListener('scroll', function() {
        window.requestAnimationFrame(handleScroll);
    }, { passive: true });

    // ปรับปรุงประสิทธิภาพของ dropdown (shdd)
    // ใช้เทคนิค Throttle เพื่อลดภาระการคำนวณตำแหน่ง
    if (window.onScrollResize) {
        var ticking = false;
        var originalFunc = window.onScrollResize;
        
        window.removeEventListener('scroll', window.onScrollResize);
        window.addEventListener('scroll', function() {
            if (!ticking) {
                window.requestAnimationFrame(function() {
                    originalFunc();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true, capture: true });
    }

    // เทคนิค: ปิดการทำงานของ CSS backdrop-filter (blur) ชั่วคราวขณะกำลังสโครลเท่านั้น
    // แล้วเปิดกลับอัตโนมัติทันทีที่สโครลหยุด (ผ่าน body.scrolling ด้านบน)
    // เดิมทำเฉพาะมือถือ 2 คลาส แต่ backdrop-filter คือสาเหตุหลักที่ทำให้สโครลหน่วง/กิน RAM
    // มากบน "ทุกอุปกรณ์" (บังคับให้เบราว์เซอร์ repaint พื้นหลังใหม่ทุกเฟรม) จึงขยายให้ครอบคลุม
    // ทุกคลาสที่ใช้ backdrop-filter ตาม css/100_schoolhub-scroll-performance-smooth-fix.css
    // และใช้กับทุกอุปกรณ์ ไม่ใช่แค่มือถือ ความสวยงามยังเหมือนเดิมทุกอย่างตอนหยุดนิ่ง
    // (ต่างกันแค่ ~100ms ระหว่างกำลังสโครลซึ่งตาแทบไม่ทันสังเกต) แต่ลดภาระเครื่องได้มาก
    var blurPauseStyle = document.createElement('style');
    blurPauseStyle.textContent = 'body.scrolling .glass-card, body.scrolling .landing-card, ' +
        'body.scrolling .landing-feature-pill, body.scrolling .pricing-card, ' +
        'body.scrolling .share-mini-card, body.scrolling .schoolhub-export-popup, ' +
        'body.scrolling .schoolhub-overview-excel-room-modal, body.scrolling #schoolhub-missing-score-popup, ' +
        'body.scrolling .shdd-portal-panel, body.scrolling .custom-menu-popup ' +
        '{ backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }';
    document.head.appendChild(blurPauseStyle);

    // เทคนิคพิเศษ: ปิดการทำงานของ CSS Filters ชั่วคราวเฉพาะบนมือถือที่สเปคต่ำ
    // แต่บน Desktop หรือเครื่องที่แรงพอ จะยังคงความสวยงามไว้ตลอด
    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
        // เพิ่มความลื่นไหลพิเศษสำหรับมือถือ: ใช้พื้นหลังทึบแทน blur ไปเลยขณะสโครล (เบาสุด)
        var style = document.createElement('style');
        style.textContent = 'body.scrolling .glass-card, body.scrolling .pricing-card { background: rgba(255,255,255,0.98) !important; }';
        document.head.appendChild(style);
    }

    console.log('SchoolHub Beauty & Performance Handler Initialized');
})();
