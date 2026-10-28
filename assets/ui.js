/* 화면 동작만 담당하는 파일입니다 (GA4 이벤트는 보내지 않습니다). */
(function () {
  /* 리뷰 더보기: 숨겨 둔 리뷰를 펼칩니다 */
  var more = document.getElementById('review-more');
  if (more) more.addEventListener('click', function () {
    document.querySelectorAll('.review.hidden').forEach(function (r) { r.classList.remove('hidden'); });
    more.disabled = true; more.textContent = '리뷰를 모두 펼쳤습니다';
  });

  /* 상품 상세 탭 전환 */
  document.querySelectorAll('.tab-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      var name = b.getAttribute('data-tab');
      document.querySelectorAll('.tab-btn').forEach(function (x) { x.classList.toggle('on', x === b); });
      document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.toggle('on', p.getAttribute('data-panel') === name); });
    });
  });

  /* 카카오톡 상담: 실제 채널이 없는 연습용이라 안내만 띄웁니다 */
  var kakao = document.getElementById('kakao-chat');
  if (kakao) kakao.addEventListener('click', function (e) {
    e.preventDefault();
    var t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = '연습용 버튼입니다. 실제 카카오톡 채널로 연결되지 않습니다.';
    t.classList.add('show'); setTimeout(function () { t.classList.remove('show'); }, 1800);
  });
})();
