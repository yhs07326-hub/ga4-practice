/*
  ga4-easy.js · SESAC 성동 6기 GA4 간편 연결 파일
  ------------------------------------------------------------
  사용법: 이 파일을 내 레포에 올리고, 각 html의 <head> 안에 아래 한 줄을 붙입니다.

    <script src="ga4-easy.js" data-id="G-XXXXXXXXXX"></script>

  그러면 아래 행동이 코드 없이 자동으로 GA4에 기록됩니다.
    page_view      페이지 조회 (GA4 기본)
    cta_click      버튼·버튼 모양 링크 클릭        (button_text, cta_location)
    nav_click      상단 메뉴(header, nav 안 링크) 클릭 (menu_name)
    contact_click  전화·이메일·카카오톡·인스타 DM 링크 클릭 (contact_method)
    generate_lead  신청·문의 폼 제출 (입력 내용은 보내지 않음) (form_id)
    faq_open       <details> 아코디언 열기         (faq_question)
    scroll_depth   25 / 50 / 75 / 100% 스크롤       (percent)
    video_play / video_progress / video_complete   <video> 재생
  추가로 원하는 이벤트는 html 요소에 속성만 붙이면 됩니다.
    <button data-ga="coupon_copy" data-ga-coupon="WELCOME10">쿠폰 받기</button>
      → 클릭하면 이벤트 coupon_copy, 파라미터 coupon=WELCOME10
  자동 기록을 빼고 싶은 요소에는 data-ga="off" 를 붙입니다.

  확인: 내 사이트 주소 끝에 ?ga_debug=1 을 붙여 열면 화면 오른쪽 아래에 보낸 이벤트 목록이 뜨고,
        GA4 → 관리 → DebugView 에도 바로 나옵니다.

  이미 Google 태그(gtag.js) 코드를 붙여 둔 사이트도 그대로 쓸 수 있습니다.
  (태그를 한 번 더 불러오지 않고, 이미 다른 코드가 보낸 클릭·신청 이벤트는 다시 보내지 않습니다)
*/
(function () {
  if (window.__ga4easy) return;
  window.__ga4easy = true;

  var me = document.currentScript;
  var ID = ((me && me.getAttribute('data-id')) || '').trim();
  var DEBUG = /[?&]ga_debug=1/.test(location.search);
  try {
    if (DEBUG) sessionStorage.setItem('ga_debug', '1');
    else if (/[?&]ga_debug=0/.test(location.search)) sessionStorage.removeItem('ga_debug');
    DEBUG = DEBUG || sessionStorage.getItem('ga_debug') === '1';
  } catch (e) {}

  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function () { window.dataLayer.push(arguments); };
  }
  function send(name, params) { window.gtag('event', name, params || {}); }

  var status = { id: ID, mode: '', tags: 0 };

  /* ---------- Google 태그 불러오기 (이미 있으면 건너뜀) ---------- */
  function setupTag() {
    var tags = document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]');
    status.tags = tags.length;
    if (tags.length) {
      status.mode = 'existing';
      var m = /[?&]id=(G-[A-Z0-9]+)/.exec(tags[0].src);
      status.id = m ? m[1] : '';
      status.mismatch = !!(ID && status.id && ID !== status.id && ID !== 'G-XXXXXXXXXX');
      return;
    }
    if (!/^G-[A-Z0-9]{4,}$/.test(ID) || ID === 'G-XXXXXXXXXX') { status.mode = 'no-id'; return; }
    status.mode = 'easy';
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ID);
    document.head.appendChild(s);
    window.gtag('js', new Date());
    window.gtag('config', ID, DEBUG ? { debug_mode: true } : {});
  }

  /* ---------- 도우미 ---------- */
  function text(el) {
    return ((el.getAttribute('aria-label') || el.innerText || el.textContent || el.value || '') + '')
      .trim().replace(/\s+/g, ' ').slice(0, 60);
  }
  function where(el) {
    if (el.closest('header')) return 'header';
    if (el.closest('footer')) return 'footer';
    var sec = el.closest('section[id], [id].section, main > div[id], section');
    if (sec && sec.id) return sec.id;
    if (sec) {
      var all = Array.prototype.slice.call(document.querySelectorAll('section'));
      return 'section_' + (all.indexOf(sec) + 1);
    }
    return 'body';
  }
  function isButtonLike(el) {
    if (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') return true;
    if (el.tagName === 'INPUT' && /^(button|submit)$/i.test(el.type)) return true;
    var hint = (typeof el.className === 'string' ? el.className : '') + ' ' + (el.id || '');
    return /(btn|button|cta|buy|purchase|order|apply|signup|sign-up|join|subscribe|reserve|booking)/i.test(hint);
  }
  function contactMethod(href) {
    if (/^tel:/i.test(href)) return 'phone';
    if (/^sms:/i.test(href)) return 'sms';
    if (/^mailto:/i.test(href)) return 'email';
    if (/pf\.kakao\.com|open\.kakao\.com|talk\.kakao/i.test(href)) return 'kakao';
    if (/ig\.me\/|instagram\.com\/direct/i.test(href)) return 'instagram_dm';
    if (/talk\.naver\.com/i.test(href)) return 'naver_talk';
    if (/booking\.naver\.com/i.test(href)) return 'naver_booking';
    return '';
  }
  function dataParams(el) {
    var p = {};
    Array.prototype.forEach.call(el.attributes, function (a) {
      if (a.name.indexOf('data-ga-') === 0) p[a.name.slice(8).replace(/-/g, '_')] = a.value;
    });
    return p;
  }

  /* 다른 코드(기존 track.js, Day 31에 붙인 코드 등)가 이번 클릭에서 이미 이벤트를 보냈는지 */
  var markLen = 0;
  function sentByOthers() {
    for (var i = markLen; i < window.dataLayer.length; i++) {
      var d = window.dataLayer[i];
      if (d && d[0] === 'event' && !d.__easy) return true;
    }
    return false;
  }
  function sendEasy(name, params) {
    window.gtag('event', name, params || {});
    var last = window.dataLayer[window.dataLayer.length - 1];
    if (last && last[0] === 'event') last.__easy = true;
  }

  /* ---------- 클릭 ---------- */
  document.addEventListener('click', function () { markLen = window.dataLayer.length; }, true);
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('a, button, [role="button"], input[type="button"], input[type="submit"], [data-ga]');
    if (!el) return;
    var custom = el.getAttribute('data-ga');
    if (custom === 'off') return;

    // 1) data-ga="이벤트이름" 이 붙은 요소: 그 이름으로 보냄 (기존 track.js가 이미 보냈으면 건너뜀)
    if (custom) {
      if (!sentByOthers()) sendEasy(custom, dataParams(el));
      return;
    }
    if (sentByOthers()) return;

    var href = el.getAttribute('href') || '';
    // 2) 연락 링크
    var cm = contactMethod(href);
    if (cm) { sendEasy('contact_click', { contact_method: cm, cta_location: where(el) }); return; }
    // 3) 폼 제출 버튼은 폼 제출 이벤트로 따로 셈
    if (el.type === 'submit' && el.form) return;
    // 4) 상단 메뉴
    if (el.tagName === 'A' && el.closest('nav, header') && !isButtonLike(el)) {
      sendEasy('nav_click', { menu_name: text(el), link_url: href });
      return;
    }
    // 5) 버튼·버튼 모양 링크
    if (isButtonLike(el)) {
      sendEasy('cta_click', { button_text: text(el), cta_location: where(el), link_url: href });
    }
  });

  /* ---------- 폼 제출 = 신청(generate_lead) ---------- */
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f || f.getAttribute('data-ga') === 'off') return;
    // 검색창은 신청이 아님 (검색은 GA4 향상된 측정이 view_search_results로 자동 기록)
    if (f.getAttribute('role') === 'search' || f.querySelector('input[type="search"], input[name="q"], input[name="query"], input[name="search"]')) return;
    // 개인정보 팝업에서 동의한 뒤 신청을 보내는 강사 제작 랜딩(privacy.js)은 그쪽에서 보냄
    if (document.getElementById('privacy-modal') && document.querySelector('script[src*="privacy.js"]') && f.id === 'lead-form') return;
    if (typeof f.checkValidity === 'function' && !f.checkValidity()) return;
    var name = f.getAttribute('data-ga') || 'generate_lead';
    var p = dataParams(f);
    p.form_id = f.id || f.getAttribute('name') || 'form';
    sendEasy(name, p);
  }, true);

  /* ---------- FAQ (<details>) ---------- */
  document.addEventListener('toggle', function (e) {
    var d = e.target;
    if (!d || d.tagName !== 'DETAILS' || !d.open || d.hasAttribute('data-ga')) return; // data-ga 가 있으면 클릭 쪽에서 처리
    var s = d.querySelector('summary');
    sendEasy('faq_open', { faq_question: s ? text(s) : '' });
  }, true);

  /* ---------- 스크롤 깊이 ---------- */
  var depth = {};
  function onScroll() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (h <= 0) return;
    var pct = Math.round(window.scrollY / h * 100);
    [25, 50, 75, 100].forEach(function (m) {
      if (pct >= m && !depth[m]) { depth[m] = true; sendEasy('scroll_depth', { percent: m }); }
    });
  }
  window.addEventListener('scroll', function () { clearTimeout(onScroll._t); onScroll._t = setTimeout(onScroll, 200); }, { passive: true });

  /* ---------- 영상 (<video>) ---------- */
  function wireVideos() {
    document.querySelectorAll('video').forEach(function (v) {
      if (v.__easy || v.getAttribute('data-ga') === 'off') return;
      v.__easy = true;
      var title = v.getAttribute('data-video-title') || v.getAttribute('title') || v.getAttribute('aria-label') ||
        ((v.currentSrc || v.src || '').split('/').pop()) || 'video';
      var started = false, marks = {};
      v.addEventListener('play', function () {
        if (started) return; started = true;
        if (v.autoplay && v.muted) return; // 배경용 자동재생 영상은 세지 않음
        sendEasy('video_play', { video_title: title });
      });
      v.addEventListener('timeupdate', function () {
        if (!v.duration || (v.autoplay && v.muted)) return;
        var pct = v.currentTime / v.duration * 100;
        [25, 50, 75].forEach(function (m) {
          if (pct >= m && !marks[m]) { marks[m] = true; sendEasy('video_progress', { video_title: title, video_percent: m }); }
        });
      });
      v.addEventListener('ended', function () {
        if (!(v.autoplay && v.muted)) sendEasy('video_complete', { video_title: title });
      });
    });
  }

  /* ---------- 확인용 패널 (?ga_debug=1 일 때만) ---------- */
  function panel() {
    var box = document.createElement('div');
    box.setAttribute('style', 'position:fixed;right:10px;bottom:10px;width:min(360px,calc(100% - 20px));max-height:45vh;' +
      'background:#111;color:#ddd;font:12px/1.45 ui-monospace,Menlo,Consolas,monospace;border-radius:10px;z-index:2147483647;' +
      'display:flex;flex-direction:column;box-shadow:0 8px 24px rgba(0,0,0,.4)');
    var msg = {
      easy: '✅ GA4 연결됨 (' + status.id + ')',
      existing: (status.tags > 1 ? '⚠️ Google 태그가 ' + status.tags + '개 있습니다. 하나만 남기세요 · ' : '✅ 기존 Google 태그 사용 · ') + (status.id || 'ID 확인 불가') +
        (status.mismatch ? ' · ⚠️ data-id(' + ID + ')와 다릅니다. 데이터는 ' + status.id + ' 로 갑니다' : ''),
      'no-id': '❌ 측정 ID가 없습니다. data-id="G-…" 를 확인하세요'
    }[status.mode] || '';
    box.innerHTML = '<div style="padding:7px 10px;border-bottom:1px solid #333;display:flex;justify-content:space-between;gap:8px">' +
      '<b style="color:#ffcf8a">GA4 이벤트 확인</b><button type="button" style="background:#333;color:#ddd;border:0;border-radius:6px;font-size:11px" data-ga="off">닫기</button></div>' +
      '<div style="padding:6px 10px;border-bottom:1px solid #333;font-size:11px">' + msg + '</div><ol style="list-style:none;margin:0;padding:0;overflow:auto"></ol>';
    box.querySelector('button').onclick = function () {
      box.remove();
      try { sessionStorage.removeItem('ga_debug'); } catch (e) {}
    };
    document.body.appendChild(box);
    var ol = box.querySelector('ol'), seen = 0;
    function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
    setInterval(function () {
      for (; seen < window.dataLayer.length; seen++) {
        var d = window.dataLayer[seen];
        if (!d || d[0] !== 'event') continue;
        var li = document.createElement('li');
        li.setAttribute('style', 'padding:5px 10px;border-bottom:1px solid #222;word-break:break-all');
        li.innerHTML = '<span style="color:#777">' + new Date().toTimeString().slice(0, 8) + '</span> <b style="color:#8ac7ff">' +
          esc(d[1]) + '</b> ' + esc(JSON.stringify(d[2] || {})).slice(0, 220);
        ol.insertBefore(li, ol.firstChild);
      }
    }, 400);
  }

  function ready() {
    setupTag();
    wireVideos();
    if (DEBUG) panel();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
