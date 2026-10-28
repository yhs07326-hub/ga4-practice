/*
  클릭·폼·영상처럼 "사용자 행동" 이벤트를 보내는 파일입니다.
  [GA4] 표시가 있는 줄이 GA4로 이벤트를 보내는 곳입니다. 미션 번호는 가이드 문서와 같습니다.
  (전자상거래 이벤트 view_item_list ~ purchase 는 assets/shop.js 에 있습니다)
*/
(function () {
  function on(sel, type, fn) {
    document.querySelectorAll(sel).forEach(function (el) { el.addEventListener(type, fn); });
  }
  function copy(v) {
    try { navigator.clipboard.writeText(v).catch(function () {}); } catch (e) {}
  }
  function text(el) { return (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40); }

  /* 미션 1: 상단 메뉴 클릭 */
  on('[data-nav]', 'click', function () {
    // [GA4] 미션 1
    track('nav_click', { menu_name: this.getAttribute('data-nav'), link_url: this.getAttribute('href') });
  });

  /* 미션 2: CTA(행동 유도) 버튼 클릭. location = 버튼이 있는 자리 */
  on('[data-cta]', 'click', function () {
    // [GA4] 미션 2
    track('cta_click', { cta_location: this.getAttribute('data-cta'), button_text: text(this) });
  });

  /* 미션 3: 프로모션 배너가 화면에 보임(view_promotion) / 배너 클릭(select_promotion) */
  var promo = document.querySelector('[data-promo-id]');
  if (promo) {
    var promoInfo = { promotion_id: promo.getAttribute('data-promo-id'), promotion_name: promo.getAttribute('data-promo-name'), creative_slot: 'home_banner' };
    var seen = false;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (en) {
          if (en.isIntersecting && !seen) {
            seen = true; obs.disconnect();
            // [GA4] 미션 3-1: 배너가 화면에 50% 이상 보였을 때 1번만
            track('view_promotion', promoInfo);
          }
        });
      }, { threshold: 0.5 }).observe(promo);
    }
    on('[data-promo-click]', 'click', function () {
      // [GA4] 미션 3-2
      track('select_promotion', promoInfo);
    });
  }

  /* 미션 19: 쿠폰 코드 복사 (맞춤 이벤트) */
  on('[data-copy-coupon]', 'click', function () {
    var code = this.getAttribute('data-copy-coupon');
    copy(code);
    // [GA4] 미션 19
    track('coupon_copy', { coupon: code });
    this.textContent = '복사됨 ✓';
  });

  /* 미션 14: 뉴스레터 구독 = 회원가입류 전환 (sign_up) */
  on('#newsletter-form', 'submit', function (e) {
    e.preventDefault();
    var input = this.querySelector('input[type="email"]');
    if (!input.value || !input.checkValidity()) { input.reportValidity(); return; }
    // [GA4] 미션 14: 이메일 주소는 절대 보내지 않습니다
    track('sign_up', { method: 'newsletter' });
    input.value = '';
    this.innerHTML = '<p class="success">구독 신청이 접수된 것처럼 보이는 연습 화면입니다. 이메일은 저장되지 않았습니다.</p>';
  });

  /* 미션 16: FAQ 열기 */
  on('.faq details', 'toggle', function () {
    if (!this.open) return;
    // [GA4] 미션 16
    track('faq_open', { faq_question: text(this.querySelector('summary')) });
  });

  /* 미션 17: 영상 재생 / 25·50·75% 시청 / 끝까지 시청
     (유튜브 영상을 넣으면 GA4 향상된 측정이 video_start 등을 자동으로 잡지만,
      이 사이트처럼 영상 파일을 직접 올린 경우에는 이렇게 코드로 보내야 합니다) */
  document.querySelectorAll('video[data-video-title]').forEach(function (v) {
    var title = v.getAttribute('data-video-title'), started = false, marks = {};
    v.addEventListener('play', function () {
      if (started) return; started = true;
      // [GA4] 미션 17-1
      track('video_play', { video_title: title, video_duration: Math.round(v.duration || 0) });
    });
    v.addEventListener('timeupdate', function () {
      if (!v.duration) return;
      var pct = Math.floor(v.currentTime / v.duration * 100);
      [25, 50, 75].forEach(function (m) {
        if (pct >= m && !marks[m]) {
          marks[m] = true;
          // [GA4] 미션 17-2
          track('video_progress', { video_title: title, video_percent: m });
        }
      });
    });
    v.addEventListener('ended', function () {
      // [GA4] 미션 17-3
      track('video_complete', { video_title: title });
    });
  });

  /* 미션 18: 공유하기 (추천 이벤트 share) */
  on('[data-share]', 'click', function () {
    var url = location.href.split('#')[0];
    // [GA4] 미션 18
    track('share', { method: 'link_copy', content_type: this.getAttribute('data-share'), item_id: this.getAttribute('data-item-id') || '' });
    copy(url);
    this.textContent = '링크 복사됨 ✓';
  });

  /* 미션 20: 전화 문의 클릭 */
  on('a[href^="tel:"]', 'click', function () {
    // [GA4] 미션 20
    track('contact_click', { contact_method: 'phone' });
  });

  /* 미션 15: 구독 상담 신청(리드) 폼 → 개인정보 안내 확인 → generate_lead */
  var lead = document.getElementById('lead-form');
  if (lead) {
    var modal = document.getElementById('privacy-modal');
    lead.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!lead.checkValidity()) { lead.reportValidity(); return; }
      modal.classList.add('open');
    });
    document.getElementById('privacy-cancel').onclick = function () { modal.classList.remove('open'); };
    document.getElementById('privacy-ok').onclick = function () {
      var interest = (lead.querySelector('#lead-interest') || {}).value || '';
      // [GA4] 미션 15: 이름·연락처는 보내지 않고 "어떤 상담인지"만 보냅니다
      track('generate_lead', { lead_type: 'subscription_consult', interest: interest, currency: 'KRW', value: 0 });
      lead.querySelectorAll('input, textarea').forEach(function (el) { el.value = ''; });
      setTimeout(function () { location.href = 'contact-done.html'; }, 300);
    };
  }

  /* ===================== 직접 연결 미션 (C) =====================
     아래 3개는 일부러 비워 두었습니다. 가이드 문서 5장을 보고 직접 채워 보세요.

     미션 C-1: 카카오톡 상담 버튼(id="kakao-chat")을 누르면
               이벤트 contact_click, 파라미터 contact_method = 'kakao'
     미션 C-2: 리뷰 더보기 버튼(id="review-more")을 누르면
               이벤트 review_more, 파라미터 review_count = 새로 펼쳐진 리뷰 수
     미션 C-3: 상품 상세의 탭 버튼(class="tab-btn", data-tab="...")을 누르면
               이벤트 detail_tab_click, 파라미터 tab_name = data-tab 값

     ↓ 여기 아래에 코드를 추가하세요 */

})();
