/*
 * nav.js — 移动端汉堡菜单（PXID / pxid-yellow-trad）
 * 作用：自动在 .nav 内注入汉堡按钮（若源码未含），并接管点击切换。
 * 依赖：base.css 中已定义的 .hamburger / .menu.open / .has-dropdown.adv-open 样式。
 */
(function () {
  'use strict';

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

    function isMobile() { return window.innerWidth <= 980; }

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
          e.preventDefault(); // 首次点击仅展开，不跳转
          var others = menu.querySelectorAll('.has-dropdown.adv-open');
          for (var k = 0; k < others.length; k++) {
            if (others[k] !== hd) others[k].classList.remove('adv-open');
          }
          hd.classList.add('adv-open');
        }
        // 已展开时放行默认跳转
      });
    }

    // 4) 点击真实链接（顶级直链 / 下拉子项）后关闭菜单
    var navLinks = menu.querySelectorAll('.menu > a, .adv-dropdown a');
    for (var n = 0; n < navLinks.length; n++) {
      navLinks[n].addEventListener('click', function () {
        if (isMobile()) setTimeout(closeMenu, 0);
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
        if (!isMobile() && menu.classList.contains('open')) closeMenu();
      }, 150);
    });

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
