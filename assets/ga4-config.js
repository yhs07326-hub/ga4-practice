/*
  ============================================================
  ① 실습 1단계: 아래 따옴표 안의 G-XXXXXXXXXX 를 내 GA4 "측정 ID"로 바꾸세요.
     (GA4 → 관리 → 데이터 스트림 → 내 스트림 → 측정 ID)
     이 한 줄만 바꾸면 모든 페이지에 GA4가 연결됩니다.
  ============================================================
*/
var GA4_MEASUREMENT_ID = 'G-XXXXXXXXXX';

/*
  아래는 GA4가 알려 주는 "Google 태그(gtag.js)" 코드와 똑같은 일을 합니다.
  내 사이트에서는 GA4 화면에서 복사한 코드를 <head>에 그대로 붙이면 됩니다.

  debug_mode: true → 실습 사이트라서 켜 둔 설정입니다.
  GA4 → 관리 → DebugView 에 이벤트가 바로 보입니다. (내 실제 사이트에는 넣지 마세요)
*/
(function () {
  var id = (GA4_MEASUREMENT_ID || '').trim();
  window.GA4_READY = /^G-[A-Z0-9]{4,}$/.test(id) && id !== 'G-XXXXXXXXXX';

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };

  if (window.GA4_READY) {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', id, { debug_mode: true });
  }

  /* 화면 오른쪽 아래 "이벤트 로그"에 보낸 이벤트를 보여 주기 위한 연결 (GA4 전송과는 무관) */
  window.GA_LOG_QUEUE = [];
  try {
    window.GA_LOG_QUEUE = JSON.parse(sessionStorage.getItem('ga-log') || '[]').map(function (x) {
      x.at = new Date(x.at); return x;
    });
  } catch (e) {}
  var original = window.gtag;
  window.gtag = function (cmd, name, params) {
    if (cmd === 'event') {
      window.GA_LOG_QUEUE.push({ name: name, params: params || {}, at: new Date() });
      try { sessionStorage.setItem('ga-log', JSON.stringify(window.GA_LOG_QUEUE.slice(-40))); } catch (e) {}
      if (typeof window.GA_LOG_RENDER === 'function') window.GA_LOG_RENDER();
    }
    return original.apply(this, arguments);
  };
})();
