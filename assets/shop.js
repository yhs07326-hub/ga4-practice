/*
  Daily Bean 가상 쇼핑몰의 화면 동작(상품 목록, 장바구니, 주문)과
  "전자상거래 이벤트"(view_item_list ~ purchase)를 보내는 파일입니다.
  [GA4] 표시가 있는 줄이 GA4로 이벤트를 보내는 곳입니다.
  장바구니는 이 브라우저 안에만 잠깐 저장되고, 서버로는 아무것도 보내지 않습니다.
*/
(function () {
  var PRODUCTS = [
    { id: 'DB-01', name: '에티오피아 예가체프', category: '원두', variant: '200g', price: 16000, color: '#c9783b', note: '자스민·레몬 향, 산뜻한 산미' },
    { id: 'DB-02', name: '콜롬비아 수프리모', category: '원두', variant: '200g', price: 14000, color: '#8a5a3b', note: '캐러멜·견과, 부드러운 단맛' },
    { id: 'DB-03', name: '하우스 블렌드', category: '원두', variant: '500g', price: 26000, color: '#5b3a29', note: '다크초콜릿, 묵직한 바디감' },
    { id: 'DB-04', name: '데일리 드립백', category: '드립백', variant: '10개입', price: 12000, color: '#b58a5f', note: '사무실·여행용 간편 드립' }
  ];
  var CURRENCY = 'KRW';
  var SHIPPING_FEE = 3000;
  var FREE_SHIPPING = 30000;

  function won(n) { return n.toLocaleString('ko-KR') + '원'; }
  function find(id) { return PRODUCTS.filter(function (p) { return p.id === id; })[0]; }
  function qs(name) { return new URLSearchParams(location.search).get(name); }
  function toast(msg) {
    var t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('show'); }, 1600);
  }

  /* GA4 전자상거래 이벤트가 요구하는 items 배열 한 줄 */
  function gaItem(p, qty, extra) {
    var it = { item_id: p.id, item_name: p.name, item_brand: 'Daily Bean', item_category: p.category, item_variant: p.variant, price: p.price, quantity: qty || 1 };
    for (var k in (extra || {})) it[k] = extra[k];
    return it;
  }

  /* ---------- 장바구니 (브라우저 안에만 저장) ---------- */
  function getCart() { try { return JSON.parse(localStorage.getItem('db-cart') || '[]'); } catch (e) { return window._cart || []; } }
  function setCart(c) { window._cart = c; try { localStorage.setItem('db-cart', JSON.stringify(c)); } catch (e) {} updateCount(); }
  function cartTotal(c) { return c.reduce(function (s, l) { return s + find(l.id).price * l.qty; }, 0); }
  function cartItems(c) { return c.map(function (l) { return gaItem(find(l.id), l.qty); }); }
  function updateCount() {
    var n = getCart().reduce(function (s, l) { return s + l.qty; }, 0);
    document.querySelectorAll('#cart-count').forEach(function (el) { el.textContent = n; });
  }
  function addToCart(id, qty, listName) {
    var c = getCart(), line = c.filter(function (l) { return l.id === id; })[0];
    if (line) line.qty += qty; else c.push({ id: id, qty: qty });
    setCart(c);
    var p = find(id);
    // [GA4] 미션 7: 장바구니 담기
    track('add_to_cart', { currency: CURRENCY, value: p.price * qty, items: [gaItem(p, qty, listName ? { item_list_name: listName } : {})] });
    toast(p.name + ' ' + qty + '개를 담았습니다');
  }

  /* ---------- 상품 그림 (이미지 파일 없이 SVG로 그림) ---------- */
  function bag(p) {
    return '<svg viewBox="0 0 200 200" role="img" aria-label="' + p.name + '">' +
      '<rect x="45" y="30" width="110" height="150" rx="14" fill="' + p.color + '"/>' +
      '<rect x="45" y="30" width="110" height="22" rx="10" fill="rgba(0,0,0,.18)"/>' +
      '<circle cx="100" cy="100" r="30" fill="#fbf8f4"/>' +
      '<ellipse cx="100" cy="100" rx="11" ry="17" fill="' + p.color + '" transform="rotate(25 100 100)"/>' +
      '<path d="M96 85 q8 15 0 30" stroke="#fbf8f4" stroke-width="3" fill="none" transform="rotate(25 100 100)"/>' +
      '<text x="100" y="156" text-anchor="middle" font-size="13" font-weight="700" fill="#fbf8f4">' + p.variant + '</text></svg>';
  }

  function card(p, listId, listName, index) {
    return '<article class="card">' +
      '<a class="thumb" href="product.html?id=' + p.id + '" data-select-item="' + p.id + '" data-list-id="' + listId + '" data-list-name="' + listName + '" data-index="' + index + '">' + bag(p) + '</a>' +
      '<div class="body"><a class="name" href="product.html?id=' + p.id + '" data-select-item="' + p.id + '" data-list-id="' + listId + '" data-list-name="' + listName + '" data-index="' + index + '">' + p.name + '</a>' +
      '<span class="meta">' + p.category + ' · ' + p.variant + ' · ' + p.note + '</span>' +
      '<span class="price">' + won(p.price) + '</span>' +
      '<div class="row"><button class="btn btn-soft btn-sm" type="button" data-quick-add="' + p.id + '" data-list-name="' + listName + '">담기</button>' +
      '<a class="btn btn-ghost btn-sm" href="product.html?id=' + p.id + '" data-select-item="' + p.id + '" data-list-id="' + listId + '" data-list-name="' + listName + '" data-index="' + index + '">자세히</a></div></div></article>';
  }

  function renderList(el, list, listId, listName) {
    el.innerHTML = list.map(function (p, i) { return card(p, listId, listName, i); }).join('');
    // [GA4] 미션 4: 상품 목록 노출
    track('view_item_list', { item_list_id: listId, item_list_name: listName, items: list.map(function (p, i) { return gaItem(p, 1, { index: i }); }) });
  }

  /* 상품 카드 클릭 / 담기 버튼 (모든 페이지 공통) */
  document.addEventListener('click', function (e) {
    var sel = e.target.closest('[data-select-item]');
    if (sel) {
      var p = find(sel.getAttribute('data-select-item'));
      // [GA4] 미션 5: 목록에서 상품 선택
      track('select_item', { item_list_id: sel.getAttribute('data-list-id'), item_list_name: sel.getAttribute('data-list-name'),
        items: [gaItem(p, 1, { index: Number(sel.getAttribute('data-index')) })] });
    }
    var quick = e.target.closest('[data-quick-add]');
    if (quick) addToCart(quick.getAttribute('data-quick-add'), 1, quick.getAttribute('data-list-name'));
  });

  /* ---------- 페이지별 동작 ---------- */
  var page = document.body.getAttribute('data-page');

  if (page === 'home') {
    renderList(document.getElementById('product-grid'), PRODUCTS, 'home_best', '베스트 원두');
  }

  if (page === 'search') {
    var q = (qs('q') || '').trim();
    var hits = PRODUCTS.filter(function (p) { return q && (p.name + p.category + p.note).indexOf(q) > -1; });
    document.getElementById('search-term').textContent = q || '(검색어 없음)';
    var box = document.getElementById('search-results');
    if (hits.length) renderList(box, hits, 'search_results', '검색 결과');
    else box.innerHTML = '<p class="empty">"' + q.replace(/</g, '&lt;') + '"에 맞는 상품이 없습니다. "예가체프", "드립백"으로 검색해 보세요.</p>';
    /* 검색 결과(view_search_results)는 GA4 "향상된 측정"이 주소의 ?q= 를 보고 자동으로 잡습니다. 코드가 필요 없습니다. */
  }

  if (page === 'product') {
    var p = find(qs('id')) || PRODUCTS[0];
    document.title = p.name + ' | Daily Bean';
    document.getElementById('p-art').innerHTML = bag(p);
    document.getElementById('p-name').textContent = p.name;
    document.getElementById('p-meta').textContent = p.category + ' · ' + p.variant;
    document.getElementById('p-note').textContent = p.note;
    document.getElementById('p-price').textContent = won(p.price);
    // [GA4] 미션 6: 상품 상세 조회
    track('view_item', { currency: CURRENCY, value: p.price, items: [gaItem(p, 1)] });

    var qty = 1, qEl = document.getElementById('p-qty');
    document.getElementById('qty-minus').onclick = function () { qty = Math.max(1, qty - 1); qEl.textContent = qty; };
    document.getElementById('qty-plus').onclick = function () { qty = Math.min(9, qty + 1); qEl.textContent = qty; };
    document.getElementById('add-to-cart').onclick = function () { addToCart(p.id, qty); };
    document.getElementById('buy-now').onclick = function () { addToCart(p.id, qty); location.href = 'checkout.html'; };
    document.getElementById('add-to-wishlist').onclick = function () {
      // [GA4] 미션 8: 찜하기
      track('add_to_wishlist', { currency: CURRENCY, value: p.price, items: [gaItem(p, 1)] });
      this.textContent = '♥ 찜 완료'; toast('찜 목록에 담았습니다 (연습용)');
    };
    document.getElementById('share-btn').setAttribute('data-item-id', p.id);
    var others = PRODUCTS.filter(function (x) { return x.id !== p.id; });
    renderList(document.getElementById('related-grid'), others, 'related', '함께 보면 좋은 원두');
  }

  if (page === 'cart') {
    var drawCart = function () {
      var c = getCart(), wrap = document.getElementById('cart-wrap');
      if (!c.length) { wrap.innerHTML = '<p class="empty">장바구니가 비어 있습니다. <a href="index.html#products">원두 보러 가기</a></p>'; return; }
      var total = cartTotal(c);
      wrap.innerHTML = '<table class="cart"><thead><tr><th>상품</th><th>수량</th><th>금액</th><th></th></tr></thead><tbody>' +
        c.map(function (l) {
          var p = find(l.id);
          return '<tr><td>' + p.name + ' <span class="note">' + p.variant + '</span></td>' +
            '<td><span class="qty"><button type="button" data-cart-minus="' + p.id + '">−</button><span>' + l.qty + '</span><button type="button" data-cart-plus="' + p.id + '">+</button></span></td>' +
            '<td>' + won(p.price * l.qty) + '</td><td><button class="btn btn-ghost btn-sm" type="button" data-remove="' + p.id + '">삭제</button></td></tr>';
        }).join('') + '</tbody></table>' +
        '<div class="summary"><span class="note">' + (total >= FREE_SHIPPING ? '무료배송 적용' : won(FREE_SHIPPING - total) + ' 더 담으면 무료배송') + '</span>' +
        '<span class="total">' + won(total) + '</span>' +
        '<a class="btn btn-primary" id="go-checkout" href="checkout.html">주문하기</a></div>';
    };
    drawCart();
    var c0 = getCart();
    // [GA4] 미션 9: 장바구니 조회
    track('view_cart', { currency: CURRENCY, value: cartTotal(c0), items: cartItems(c0) });

    document.getElementById('cart-wrap').addEventListener('click', function (e) {
      var c = getCart(), id, line, p;
      if ((id = e.target.getAttribute('data-remove'))) {
        line = c.filter(function (l) { return l.id === id; })[0]; p = find(id);
        setCart(c.filter(function (l) { return l.id !== id; }));
        // [GA4] 미션 10: 장바구니에서 빼기
        track('remove_from_cart', { currency: CURRENCY, value: p.price * line.qty, items: [gaItem(p, line.qty)] });
        drawCart();
      } else if ((id = e.target.getAttribute('data-cart-minus'))) {
        line = c.filter(function (l) { return l.id === id; })[0]; p = find(id);
        if (line.qty > 1) { line.qty -= 1; setCart(c); } else { setCart(c.filter(function (l) { return l.id !== id; })); }
        // [GA4] 미션 10: 수량 1개 줄이기 = 1개 빼기
        track('remove_from_cart', { currency: CURRENCY, value: p.price, items: [gaItem(p, 1)] });
        drawCart();
      } else if ((id = e.target.getAttribute('data-cart-plus'))) {
        line = c.filter(function (l) { return l.id === id; })[0]; line.qty += 1; setCart(c); p = find(id);
        // [GA4] 미션 7: 수량 1개 늘리기 = 1개 담기
        track('add_to_cart', { currency: CURRENCY, value: p.price, items: [gaItem(p, 1)] });
        drawCart();
      }
    });
  }

  if (page === 'checkout') {
    var c = getCart();
    if (!c.length) {
      document.getElementById('checkout-wrap').innerHTML = '<p class="empty">주문할 상품이 없습니다. <a href="index.html#products">원두 보러 가기</a></p>';
    } else {
      var sub = cartTotal(c), coupon = '', discount = 0;
      var ship = function () { return sub - discount >= FREE_SHIPPING ? 0 : SHIPPING_FEE; };
      var drawSum = function () {
        document.getElementById('co-items').innerHTML = c.map(function (l) { var p = find(l.id); return '<li>' + p.name + ' × ' + l.qty + ' — ' + won(p.price * l.qty) + '</li>'; }).join('');
        document.getElementById('co-sub').textContent = won(sub);
        document.getElementById('co-discount').textContent = discount ? '−' + won(discount) : '0원';
        document.getElementById('co-ship').textContent = ship() ? won(ship()) : '무료';
        document.getElementById('co-total').textContent = won(sub - discount + ship());
      };
      drawSum();
      // [GA4] 미션 11: 주문서 진입(결제 시작)
      track('begin_checkout', { currency: CURRENCY, value: sub, items: cartItems(c) });

      var go = function (n) {
        document.querySelectorAll('.step-box').forEach(function (b, i) { b.classList.toggle('on', i === n); });
        document.querySelectorAll('.steps span').forEach(function (s, i) { s.classList.toggle('on', i === n); });
        window.scrollTo(0, 0);
      };
      document.getElementById('apply-coupon').onclick = function () {
        var v = document.getElementById('coupon-input').value.trim().toUpperCase();
        if (v === 'BEAN20') { coupon = v; discount = Math.round(sub * 0.2 / 100) * 100; toast('쿠폰 적용: 20% 할인'); }
        else { coupon = ''; discount = 0; toast('사용할 수 없는 쿠폰입니다. BEAN20 을 입력해 보세요'); }
        drawSum();
      };
      document.getElementById('to-payment').onclick = function () {
        var tier = (document.querySelector('input[name="ship"]:checked') || {}).value || '일반배송';
        // [GA4] 미션 12: 배송 정보 입력 완료
        track('add_shipping_info', { currency: CURRENCY, value: sub - discount, coupon: coupon, shipping_tier: tier, items: cartItems(c) });
        go(1);
      };
      document.getElementById('back-shipping').onclick = function () { go(0); };
      document.getElementById('place-order').onclick = function () {
        var pay = (document.querySelector('input[name="pay"]:checked') || {}).value;
        if (!pay) { toast('결제 수단을 골라 주세요 (실제 결제는 되지 않습니다)'); return; }
        // [GA4] 미션 12: 결제 수단 선택 완료
        track('add_payment_info', { currency: CURRENCY, value: sub - discount, coupon: coupon, payment_type: pay, items: cartItems(c) });
        var order = { id: 'T' + Date.now().toString().slice(-8), value: sub - discount, shipping: ship(), coupon: coupon, pay: pay, lines: c };
        // [GA4] 미션 13: 구매 완료 (가상 주문, 실제 결제 없음). transaction_id 는 주문마다 달라야 합니다.
        track('purchase', { transaction_id: order.id, currency: CURRENCY, value: order.value, shipping: order.shipping, coupon: coupon, items: cartItems(c) });
        try { sessionStorage.setItem('db-last-order', JSON.stringify(order)); } catch (e) {}
        setCart([]);
        setTimeout(function () { location.href = 'order-complete.html'; }, 300);
      };
    }
  }

  if (page === 'order-complete') {
    var o = null;
    try { o = JSON.parse(sessionStorage.getItem('db-last-order') || 'null'); } catch (e) {}
    if (o) {
      document.getElementById('order-id').textContent = o.id;
      document.getElementById('order-sum').textContent = won(o.value + o.shipping) + ' (' + o.pay + ', 가상 결제)';
    }
  }

  updateCount();
})();
