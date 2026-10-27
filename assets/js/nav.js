/*
 * nav.js — 移动端汉堡菜单（PXID / pxid-yellow-trad）
 * 作用：自动在 .nav 内注入汉堡按钮（若源码未含），并接管点击切换。
 * 依赖：base.css 中已定义的 .hamburger / .menu.open / .has-dropdown.adv-open 样式。
 */
(function () {
  'use strict';

  function readViewportSegments() {
    var vv = window.visualViewport;
    if (vv && vv.segments && vv.segments.length) return Array.prototype.slice.call(vv.segments);
    if (typeof window.getWindowSegments === 'function') {
      try { return window.getWindowSegments(); } catch (e) { return []; }
    }
    return [];
  }

  function updateViewportSegments() {
    var root = document.documentElement;
    var segments = readViewportSegments().slice().sort(function (a, b) { return a.left - b.left; });
    var mq = window.matchMedia && window.matchMedia('(horizontal-viewport-segments: 2)').matches;
    var sideBySide = segments.length > 1 && segments[1].left >= segments[0].right;
    root.classList.toggle('pxid-segmented', Boolean(mq || sideBySide));
    if (!sideBySide) {
      ['--pxid-seg0-left', '--pxid-seg0-width', '--pxid-seg1-left', '--pxid-seg1-width', '--pxid-hinge-width'].forEach(function (name) {
        root.style.removeProperty(name);
      });
      return;
    }
    root.style.setProperty('--pxid-seg0-left', segments[0].left + 'px');
    root.style.setProperty('--pxid-seg0-width', segments[0].width + 'px');
    root.style.setProperty('--pxid-seg1-left', segments[1].left + 'px');
    root.style.setProperty('--pxid-seg1-width', segments[1].width + 'px');
    root.style.setProperty('--pxid-hinge-width', Math.max(0, segments[1].left - segments[0].right) + 'px');
  }

  function initNav() {
    var nav = document.querySelector('.nav');
    if (!nav) return;
    var menu = nav.querySelector('.menu');
    if (!menu) return;

    // 1) 注入汉堡按钮（仅当源码未含时）
    var burger = nav.querySelector('.hamburger');
    if (!burger) {
      burger = document.createElement('button');
      burger.type = 'button';
      burger.className = 'hamburger';
      burger.setAttribute('aria-label', '打开菜单');
      burger.setAttribute('aria-expanded', 'false');
      burger.innerHTML = '<span></span><span></span><span></span>';
      nav.appendChild(burger);
    }

    var root = document.documentElement;

    updateViewportSegments();

    function isMobile() { return window.innerWidth <= 980 || root.classList.contains('pxid-segmented'); }

    function openMenu() {
      burger.classList.add('open');
      menu.classList.add('open');
      burger.setAttribute('aria-expanded', 'true');
      root.style.overflow = 'hidden'; // 锁定背景滚动
    }
    function closeMenu() {
      burger.classList.remove('open');
      menu.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      root.style.overflow = '';
      // 收起所有展开的下拉
      var openDrops = menu.querySelectorAll('.has-dropdown.adv-open');
      for (var i = 0; i < openDrops.length; i++) openDrops[i].classList.remove('adv-open');
    }
    function toggleMenu() {
      if (menu.classList.contains('open')) closeMenu();
      else openMenu();
    }

    // 2) 汉堡按钮：切换菜单
    burger.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleMenu();
    });

    // 3) 下拉触发器（移动端：首次点击展开，再次点击才跳转）
    var triggers = menu.querySelectorAll('.has-dropdown > .adv-trigger');
    for (var t = 0; t < triggers.length; t++) {
      triggers[t].addEventListener('click', function (e) {
        if (!isMobile()) return; // 桌面端按 CSS hover 正常行为
        var hd = this.closest('.has-dropdown');
        if (!hd.classList.contains('adv-open')) {
          hd.classList.add('adv-open');
          var dropdown = hd.querySelector('.adv-dropdown');
          // The site can disable submenus in CSS; in that mode the top link is a direct link.
          if (!dropdown || window.getComputedStyle(dropdown).display === 'none') {
            hd.classList.remove('adv-open');
            return;
          }
          e.preventDefault(); // 可见的子菜单：首次点击仅展开，不跳转
          var others = menu.querySelectorAll('.has-dropdown.adv-open');
          for (var k = 0; k < others.length; k++) {
            if (others[k] !== hd) others[k].classList.remove('adv-open');
          }
        }
        // 已展开时放行默认跳转
      });
    }

    // 4) 点击真实链接（顶级直链 / 下拉子项）后关闭菜单
    var navLinks = menu.querySelectorAll('.menu > a, .has-dropdown > .adv-trigger, .adv-dropdown a');
    for (var n = 0; n < navLinks.length; n++) {
      navLinks[n].addEventListener('click', function (e) {
        if (isMobile() && !e.defaultPrevented) setTimeout(closeMenu, 0);
      });
    }

    // 5) 点击菜单外部关闭
    document.addEventListener('click', function (e) {
      if (menu.classList.contains('open') && !nav.contains(e.target)) closeMenu();
    });

    // 6) 回到桌面尺寸时复位
    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        updateViewportSegments();
        if (!isMobile() && menu.classList.contains('open')) closeMenu();
      }, 150);
    });
    window.addEventListener('orientationchange', updateViewportSegments);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', updateViewportSegments);

    // 7) Esc 关闭
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) closeMenu();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNav);
  } else {
    initNav();
  }
})();

/* ===== 全局悬浮 UI：回到顶部兜底 + 右边缘「联系我们」===== */
(function () {
  'use strict';

  // 后台 /admin 不挂载前台悬浮 UI
  if (/(^|\/)admin(\/|$)/.test(location.pathname)) return;

  function injectStyle() {
    if (document.getElementById('float-ui-css')) return;
    var s = document.createElement('style');
    s.id = 'float-ui-css';
    s.textContent = [
      '.contact-fab{position:fixed;right:0;top:50%;transform:translateY(-50%);z-index:80;',
      'display:flex;align-items:center;justify-content:center;width:42px;height:132px;',
      'background:#BC1E21;color:#fff;border:none;border-radius:9px 0 0 9px;cursor:pointer;',
      'box-shadow:-4px 6px 18px rgba(0,0,0,.18);transition:width .2s,background .2s;',
      'writing-mode:vertical-rl;font:600 15px/1 "Noto Sans SC","PingFang SC",system-ui,sans-serif;letter-spacing:2px}',
      '.contact-fab:hover{width:48px;background:#a0181b}',
      '.contact-fab .cf-label{pointer-events:none}',
      '.contact-panel{position:fixed;right:0;top:50%;transform:translateY(-50%) translateX(112%);',
      'width:320px;max-width:88vw;background:#fff;border-radius:14px 0 0 14px;',
      'box-shadow:-10px 14px 40px rgba(0,0,0,.22);z-index:81;padding:20px 22px;',
      'opacity:0;visibility:hidden;transition:transform .32s cubic-bezier(.22,.61,.36,1),opacity .3s,visibility .3s}',
      '.contact-panel.open{transform:translateY(-50%) translateX(0);opacity:1;visibility:visible}',
      '.cp-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}',
      '.cp-head span{font:700 18px/1 "Noto Sans SC",sans-serif;color:#15191a}',
      '.cp-close{border:none;background:none;font-size:22px;line-height:1;color:#888;cursor:pointer}',
      '.cp-close:hover{color:#BC1E21}',
      '.cp-item{display:flex;gap:12px;padding:12px 0;border-top:1px solid #eee}',
      '.cp-item:first-of-type{border-top:none}',
      '.cp-ic{flex:0 0 34px;height:34px;border-radius:50%;background:#f4f4f5;color:#BC1E21;',
      'display:grid;place-items:center;font-size:15px;font-weight:700}',
      '.cp-item b{display:block;font-size:13px;color:#888;font-weight:600;margin-bottom:3px}',
      '.cp-item a,.cp-item .wx-text{font-size:15px;color:#15191a;font-weight:600;text-decoration:none;word-break:break-all}',
      '.cp-item a:hover{color:#BC1E21}',
      '.cp-item small{display:block;font-size:12px;color:#aaa;margin-top:3px}',
      '.cp-copy{margin-left:8px;font-size:12px;color:#BC1E21;border:1px solid #BC1E21;',
      'border-radius:4px;padding:2px 8px;background:none;cursor:pointer;vertical-align:middle}',
      '.wx-qr{display:block;width:120px;height:120px;margin-top:8px;border:1px solid #eee;border-radius:6px}',
      '.cp-cta{display:block;margin-top:16px;text-align:center;background:#BC1E21;color:#fff;',
      'border-radius:8px;padding:13px;font-weight:700;text-decoration:none;font-size:15px}',
      '.cp-cta:hover{background:#a0181b}',
      '@media(max-width:379px){',
      '.zy12.zyp .p2 .grid{grid-template-columns:1fr;gap:16px}',
      '.zy12.zyp .p2 .cell{height:288px}',
      '.zy12.zyp .p2 .det{left:26px;right:26px;bottom:14px}',
      '.zy12.zyp .p2 .det b{font-size:15px;line-height:1.35}',
      '.phero .phero-copy h1{font-size:29px;line-height:1.12;word-break:normal;text-wrap:balance}',
      '}',
      '@media(max-width:560px){',
      '.contact-panel{top:auto;bottom:0;transform:translateY(112%);width:100%;max-width:100%;border-radius:14px 14px 0 0}',
      '.contact-panel.open{transform:translateY(0)}',
      '.contact-fab{top:auto;bottom:88px;transform:none;width:44px;height:44px;border-radius:24px 0 0 24px;writing-mode:horizontal-tb;letter-spacing:0;font-size:0}',
      '.contact-fab:hover{width:44px}',
      '.contact-fab .cf-label::after{content:"联系";font-size:11px;letter-spacing:0}',
      '}',
      '@media(horizontal-viewport-segments:2){',
      ':root{--pxid-seg0-left:env(viewport-segment-left 0 0,0px);--pxid-seg0-width:env(viewport-segment-width 0 0,50vw);--pxid-seg1-left:env(viewport-segment-left 1 0,50vw);--pxid-seg1-width:env(viewport-segment-width 1 0,50vw);--pxid-hinge-width:calc(env(viewport-segment-left 1 0,50vw) - env(viewport-segment-right 0 0,50vw))}',
      '}',
      '.pxid-segmented body>header .nav .nav-right{display:none!important}',
      '.pxid-segmented body>header .nav .hamburger{display:flex!important;margin-left:auto}',
      '.pxid-segmented body>header .nav .menu{display:none;position:fixed;top:74px;left:var(--pxid-seg0-left,0);right:auto;width:var(--pxid-seg0-width,50vw);max-width:var(--pxid-seg0-width,50vw);max-height:calc(100vh - 74px);overflow-y:auto;flex-direction:column;align-items:stretch;gap:0;padding:0 0 16px;background:var(--ink,#232626);border-radius:0 0 16px 0;opacity:0;transform:translateX(-100%);pointer-events:none;z-index:49}',
      '.pxid-segmented body>header .nav .menu.open{display:flex;opacity:1;transform:translateX(0);pointer-events:auto}',
      '.pxid-segmented body>header .nav .menu>a,.pxid-segmented body>header .nav .menu .has-dropdown>a{width:100%;height:auto;padding:15px 24px;color:#f2f3f4;font-size:17px;line-height:1.3;border-bottom:1px solid rgba(255,255,255,.08)}',
      '.pxid-segmented .zy12 .m00 .in,.pxid-segmented .zy12.zyp .p1 .in,.pxid-segmented .ap-hero>.wrap,.pxid-segmented .news-hero>.wrap,.pxid-segmented .ct-hero>.wrap{box-sizing:border-box;width:var(--pxid-seg0-width,50vw);max-width:var(--pxid-seg0-width,50vw);margin-left:var(--pxid-seg0-left,0);margin-right:0;padding-left:28px;padding-right:28px}',
      '.pxid-segmented .zy12 .m00 .in{left:var(--pxid-seg0-left,0);right:auto}',
      '.pxid-segmented .zy12 .m00 h1,.pxid-segmented .zy12 .m00 p,.pxid-segmented .zy12.zyp .p1 .lead{max-width:100%}',
      '.pxid-segmented .zy12 .m00 .scroll-cue{left:calc(var(--pxid-seg0-left,0px) + var(--pxid-seg0-width,50vw)/2)}',
      '.pxid-segmented .zy12.zyp .p2 .in{max-width:none;padding-left:28px;padding-right:28px}',
      '.pxid-segmented .zy12.zyp .p2 .grid{grid-template-columns:repeat(2,minmax(0,1fr));column-gap:calc(var(--pxid-hinge-width,0px) + 56px);row-gap:26px}',
      '.pxid-segmented .ap-hero h1,.pxid-segmented .news-hero .sec,.pxid-segmented .ct-hero h1{max-width:100%;font-size:clamp(36px,5vw,54px);text-wrap:balance}',
      '.pxid-segmented .ap-hero .lead,.pxid-segmented .news-hero .sec-sub,.pxid-segmented .ct-hero .lead{max-width:100%}',
      '.pxid-segmented .phero .wrap.phero-layout{box-sizing:border-box;width:var(--pxid-seg0-width,50vw);max-width:var(--pxid-seg0-width,50vw);margin-left:var(--pxid-seg0-left,0);margin-right:0;padding-left:28px;padding-right:28px;display:block}',
      '.pxid-segmented .phero-kicker,.pxid-segmented .phero-aside{display:none}',
      '.pxid-segmented .phero-copy{text-align:left}',
      '.pxid-segmented .phero p{margin-left:0;margin-right:0}',
      '.pxid-segmented .ovbar .wrap{width:100%;max-width:none;padding:0}',
      '.pxid-segmented .ovbar .grid{display:flex;overflow-x:auto}',
      '.pxid-segmented .ovbar .grid::before{content:"";order:2;flex:0 0 var(--pxid-hinge-width,0px)}',
      '.pxid-segmented .ovbar .grid>a{min-width:0;width:auto;max-width:none}',
      '.pxid-segmented .ovbar .grid>a:nth-child(-n+3){order:1;flex:1 1 0}',
      '.pxid-segmented .ovbar .grid>a:nth-child(n+4){order:3;flex:.75 1 0}',
      '.pxid-segmented .sec-mat .sec-hb,.pxid-segmented .sec-svc .sec-hb,.pxid-segmented .sec-take .sec-hb{grid-template-columns:minmax(0,calc(var(--pxid-seg0-width,50vw) - 80px)) minmax(0,calc(var(--pxid-seg1-width,50vw) - 80px));column-gap:calc(var(--pxid-hinge-width,0px) + 80px)}',
      '.pxid-segmented .sec-mat .sec-hb h2,.pxid-segmented .sec-svc .sec-hb h2,.pxid-segmented .sec-take .sec-hb h2{font-size:clamp(34px,4.2vw,52px);text-wrap:balance}',
      '.pxid-segmented .about-page .ab-history .ab-wrap{box-sizing:border-box;width:100%;max-width:none;padding-left:28px;padding-right:28px}',
      '.pxid-segmented .about-page .ab-history-head,.pxid-segmented .about-page .ab-history-stage{display:grid;grid-template-columns:minmax(0,calc(var(--pxid-seg0-width,50vw) - 56px)) minmax(0,calc(var(--pxid-seg1-width,50vw) - 56px));column-gap:calc(var(--pxid-hinge-width,0px) + 56px)}',
      '.pxid-segmented .about-page .ab-history-ready .ab-history-orbit{display:none}',
      '.pxid-segmented .about-page .ab-history-ready .ab-history-panels{grid-column:2;grid-row:1;padding-top:0}',
      '.pxid-segmented .about-page .ab-history-ready .ab-history-controls{grid-column:1;grid-row:1;position:static;align-self:start;width:100%;max-width:none;margin:0}',
      '.pxid-segmented .about-page .ab-history-ready .ab-history-panel-year{display:inline}',
      '.pxid-segmented .about-page .ab-history-figure{max-width:100%}',
      '.pxid-segmented .about-page .ab-history-panel h3{font-size:23px}',
      '.pxid-segmented .about-page .ab-history-caption{position:static;padding:18px 20px;background:#141e24}',
      '.pxid-segmented .about-page .ab-history-arrow{position:static;flex:0 0 48px}',
      '.pxid-segmented .about-page .ab-history-ready .ab-history-stage{min-height:0}',
      '.pxid-segmented .about-page .ab-history-source{margin-left:calc(var(--pxid-seg1-left,50vw) - 28px);margin-right:0}',
      '.pxid-segmented .ct-main .ct-grid{grid-template-columns:minmax(0,calc(var(--pxid-seg0-width,50vw) - 56px)) minmax(0,calc(var(--pxid-seg1-width,50vw) - 56px));column-gap:calc(var(--pxid-hinge-width,0px) + 56px)}',
      '@media(max-height:680px){.pxid-segmented .about-page .ab-history{padding-top:72px}}'
    ].join('');
    document.head.appendChild(s);
  }

  function buildContact() {
    if (document.querySelector('.contact-fab')) return;
    var fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'contact-fab';
    fab.setAttribute('aria-label', '联系我们');
    fab.innerHTML = '<span class="cf-label">联系我们</span>';

    var panel = document.createElement('div');
    panel.className = 'contact-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', '联系方式');
    panel.innerHTML =
      '<div class="cp-head"><span>联系我们</span><button class="cp-close" type="button" aria-label="关闭">×</button></div>' +
      '<div class="cp-item"><span class="cp-ic">☎</span><div><b>电话咨询</b>' +
        '<a href="tel:400-888-0000">400-888-0000</a><small>工作日 9:00 - 18:00</small></div></div>' +
      '<div class="cp-item"><span class="cp-ic">✉</span><div><b>邮箱</b>' +
        '<a href="mailto:hello@pxid-mfg.com">hello@pxid-mfg.com</a>' +
        '<button class="cp-copy" type="button" data-mail="hello@pxid-mfg.com">复制</button>' +
        '<small>通常 4 小时内回复</small></div></div>' +
      '<div class="cp-item cp-wx"><span class="cp-ic">微</span><div><b>微信</b>' +
        '<span class="wx-text">微信搜索：请告知微信号</span></div></div>' +
      '<div class="cp-item"><span class="cp-ic">W</span><div><b>WhatsApp</b>' +
        '<a href="https://wa.me/" target="_blank" rel="noopener">点击发起对话</a>' +
        '<small>需补充号码</small></div></div>' +
      '<a class="cp-cta" href="/pxid/yellow-trad/contact.html">填写需求单，获取报价 →</a>';

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    function toggle(open) {
      var willOpen = (open === undefined) ? !panel.classList.contains('open') : open;
      panel.classList.toggle('open', willOpen);
      fab.classList.toggle('active', willOpen);
    }
    fab.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
    panel.querySelector('.cp-close').addEventListener('click', function (e) { e.stopPropagation(); toggle(false); });
    document.addEventListener('click', function (e) {
      if (panel.classList.contains('open') && !panel.contains(e.target) && !fab.contains(e.target)) toggle(false);
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') toggle(false); });

    var copyBtn = panel.querySelector('.cp-copy');
    copyBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var mail = this.getAttribute('data-mail');
      var self = this;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(mail).then(function () {
          self.textContent = '已复制';
          setTimeout(function () { self.textContent = '复制'; }, 1600);
        }, function () {});
      }
    });
  }

  function fixToTop() {
    var top = document.querySelector('.to-top');
    if (!top) {                       /* 页面没有内联结构时注入(如首页)，样式复用 base.css .to-top */
      top = document.createElement('a');
      top.className = 'to-top';
      top.href = '#top';
      top.setAttribute('aria-label', '回到顶部');
      top.setAttribute('title', '回到顶部');
      top.textContent = '\u2191';
      document.body.appendChild(top);
    }
    top.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    var root = document.documentElement;
    function onScroll() {
      var y = window.pageYOffset || root.scrollTop;
      top.classList.toggle('show', y > 500);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function init() {
    injectStyle();
    buildContact();
    fixToTop();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
