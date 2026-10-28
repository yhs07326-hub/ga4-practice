/*
  track(이벤트이름, 파라미터) = gtag('event', 이벤트이름, 파라미터) 를 보내는 짧은 함수입니다.
  이 사이트의 모든 이벤트는 이 함수를 거칩니다. 파일 안에서 [GA4] 를 검색하면 이벤트를 보내는 곳이 다 나옵니다.

  화면 오른쪽 아래 "이벤트 로그" 패널은 수업용 보조 화면입니다.
  내가 보낸 이벤트가 바로 보여서, GA4에 들어가기 전에 "보내기는 했는지" 먼저 확인할 수 있습니다.
  (scroll, 외부 링크 click, file_download 처럼 GA4가 자동으로 잡는 이벤트는 이 패널에 안 보이고 GA4에서만 보입니다)
*/
window.track = function (name, params) {
  window.gtag('event', name, params || {});
};

(function () {
  var panel = document.createElement('div');
  panel.id = 'ga-log';
  panel.innerHTML =
    '<header><b>보낸 이벤트 로그</b><span><button type="button" data-act="clear">지우기</button> ' +
    '<button type="button" data-act="close">닫기</button></span></header>' +
    '<div class="status"></div><ol></ol>';
  document.addEventListener('DOMContentLoaded', function () {
    document.body.appendChild(panel);
    var st = panel.querySelector('.status');
    if (window.GA4_READY) {
      st.className = 'status ok';
      st.textContent = 'GA4 연결됨: ' + GA4_MEASUREMENT_ID + ' (DebugView에서 확인)';
    } else {
      st.className = 'status no';
      st.textContent = '측정 ID 미설정: 로그만 보이고 GA4로는 안 갑니다 (assets/ga4-config.js)';
    }
    render();
    var open = /[?&]log=1/.test(location.search);
    try { open = open || sessionStorage.getItem('ga-log-open') === '1'; } catch (e) {}
    if (open) panel.classList.add('open');
    document.querySelectorAll('[data-log-toggle]').forEach(function (b) {
      b.addEventListener('click', function () { setOpen(!panel.classList.contains('open')); });
    });
  });
  panel.addEventListener('click', function (e) {
    var act = e.target.getAttribute('data-act');
    if (act === 'close') setOpen(false);
    if (act === 'clear') {
      window.GA_LOG_QUEUE.length = 0;
      try { sessionStorage.removeItem('ga-log'); } catch (e) {}
      render();
    }
  });
  function setOpen(v) {
    panel.classList.toggle('open', v);
    try { sessionStorage.setItem('ga-log-open', v ? '1' : '0'); } catch (e) {}
  }
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  /* items 배열은 길어서 로그에서는 "상품 N개(이름…)"로 줄여 보여 줍니다. GA4로는 전체가 그대로 갑니다 */
  function short(p) {
    var o = {};
    for (var k in p) o[k] = p[k];
    if (Array.isArray(o.items)) {
      o.items = o.items.length + '개: ' + o.items.map(function (i) { return i.item_name + (i.quantity > 1 ? '×' + i.quantity : ''); }).join(', ');
    }
    return JSON.stringify(o);
  }
  function render() {
    var ol = panel.querySelector('ol');
    if (!ol) return;
    var q = window.GA_LOG_QUEUE || [];
    ol.innerHTML = q.slice().reverse().map(function (x) {
      var t = x.at.toTimeString().slice(0, 8);
      return '<li><span class="t">' + t + '</span><span class="ev">' + esc(x.name) + '</span> ' + esc(short(x.params)) + '</li>';
    }).join('') || '<li>아직 보낸 이벤트가 없습니다. 버튼을 눌러 보세요.</li>';
  }
  window.GA_LOG_RENDER = render;
})();
