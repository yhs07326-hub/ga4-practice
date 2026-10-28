# Daily Bean · GA4 이벤트 실습 사이트

SESAC 성동 6기 Day 34 GA4 실습용 **가상 원두 쇼핑몰**입니다. 실제 판매·결제·개인정보 저장은 없습니다.

## 시작하기 (3단계)

1. 이 레포를 **Fork** 합니다 (또는 zip 파일 내용을 내 새 레포에 업로드).
2. **Settings → Pages → Branch: `main` / `/(root)` → Save**. 1~2분 뒤 `https://내아이디.github.io/ga4-practice/` 에 사이트가 열립니다.
3. `assets/ga4-config.js` 의 `G-XXXXXXXXXX` 를 내 GA4 측정 ID로 바꾸고 Commit.

## 파일 안내

| 파일 | 하는 일 |
|---|---|
| `assets/ga4-config.js` | GA4 연결 (측정 ID 한 줄만 바꾸면 됨) |
| `assets/track.js` | `track(이벤트, 파라미터)` 함수 + 화면 오른쪽 아래 "이벤트 로그" |
| `assets/events.js` | 클릭·폼·영상 이벤트 (미션 1~3, 14~20) + **직접 연결 미션 C-1~C-3 자리** |
| `assets/shop.js` | 전자상거래 이벤트 (미션 4~13: view_item_list ~ purchase) |
| `assets/ui.js` | 화면 동작만 (이벤트 없음) |

파일 안에서 `[GA4]` 를 검색하면 이벤트를 보내는 줄이 모두 나옵니다.
주소 끝에 `?log=1` 을 붙이거나 상단 **이벤트 로그 보기** 버튼을 누르면 보낸 이벤트가 화면에 표시됩니다.

## 내 사이트에 붙이기: `ga4-easy.js`

이 레포 맨 위의 `ga4-easy.js`를 내 사이트 레포에 올리고, 각 html `<head>` 아래에 한 줄만 붙이면
버튼·메뉴·연락 링크·폼 제출·FAQ·스크롤·영상이 자동으로 GA4에 기록됩니다.

```html
<script src="ga4-easy.js" data-id="G-XXXXXXXXXX"></script>
```

확인: 내 사이트 주소 끝에 `?ga_debug=1` 을 붙여 열면 보낸 이벤트 목록이 화면에 뜹니다.
자세한 방법은 가이드 Part 2를 보세요.
