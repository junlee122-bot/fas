# 아이콘·실존 인물 초상 확장 — 2026-09-18

## 반영 범위

- 전용 SVG 40종: 기존28종 재제작 + 신규12종. 작은 버튼·클릭 영역·문구·권한은 유지.
- 28px 공통 격자, 2px 선굵기, 투명한 내부 공간, 현재색 상속. 별도 네트워크나 생성 비용 없음.
- 신규 주요 화면 연결: 주보/도전과제/헌정/재판/외교/영토조약. 모든 보조 lucide 아이콘까지 교체한 것은 아님.
- Higgsfield 생성 초상22명. 보직 선택의 대체할 실존 인물 기록, 참모 보직/명단/상세/분위기/후보, 참모 회의 참가자, 지휘관 상세, 현재 선거 후보에 연결.
- 명단 전체에 초상이 있는 것은 아님. 이번은1940년대 주요 인물 중심의 첫 묶음이며 여성·이후 시대 인물과 나머지 명부는 후속 제작 범위.

## 생성·용량

GPT Image2.5 Flare / high / 2k /1:1. 24건 제출,22건 완료,2건 서비스 차단(히틀러·간디). 차단 요청 재시도·우회·다른 얼굴 대체 없음.

잔액136→70, 실제66크레딧. 아이콘은 크레딧 사용 없음. 모델·프롬프트·작업ID·결과URL은 design/higgsfield-portraits-{production,generation}.json에 보존.

22장 모두2048×2048. 원본 PNG162,301,404바이트, 런타임 lossless WebP104,047,686바이트. 두 포맷의 디코딩된 RGBA 픽셀 일치 검사 통과. 축소나3MB 파일 제한 적용 없음. 표시 위치에 lazy/async 로딩. 최초 열람 시 큰 자산 전송 비용은 유지되는 의도적 선택.

## 인물 식별 규칙

1. 참모·후보는 현재 personId와 정확한 이름/명시적 별칭을 함께 확인. 국가·보직 슬롯으로 얼굴 추론 안 함.
2. 등록 안 된ID, 빈ID, 이름 충돌은 초성 표식. ID가 없는 지휘관/선거는 정확한 이름 별칭만 허용.
3. player 및 현재 playerCandidateId는 실존 얼굴 제외. 과거 선거·시장 기록은 ID 안전성이 없어 초상을 새로 붙이지 않음.
4. 익명 커리어 제안 발신자는 직책에 임의 인물을 지정하지 않음.
5. 모든 초상은 'AI 재구성 초상 · 실제 사진 아님 ·1940년대 참고 외형'. 촬영일·완벽한 고증·현재 생존·현재 나이의 증거가 아님.
6. 역사자료 사진은 시각 조사에만 사용. 생성 서비스에 원사진을 업로드하거나 게임 자산으로 재배포하지 않음. 아래 자료의 공개 여부와 재사용 허가는 별개.
7. 순수 표시 컴포넌트와 정적 카탈로그만 추가. 저장 형식, 엔진, 영입 확률, 인사권, 승인·결재 결과 변경 없음.

## 조사 자료

| 인물 | 기관 자료 | 범위·주의 |
|---|---|---|
| 김구 | [원자료](https://contents.history.go.kr/photo/imsi/imsi_period03.do) | 중경 시기 사진·날짜 기록 |
| 김원봉 | [원자료](https://contents.history.go.kr/mobile/eh/view.do?levelId=eh_n0830_0010) | 개별 초상은 촬영연도 미상; 배우 얼굴과 구분 |
| 지청천 | [원자료](https://contents.history.go.kr/mobile/kc/view.do?levelId=kc_n404810) | 안경·콧수염·머리 외형 확인 |
| 이범석 | [원자료](https://encykorea.aks.ac.kr/Article/E0044367) | 1900년생 광복군 인물; 1925년생 외교관과 구분 |
| 도조 히데키 | [원자료](https://www.ndl.go.jp/portrait/e/datas/142) | 일본 국립국회도서관 초상 |
| 장제스 | [원자료](https://www.loc.gov/pictures/item/2004671923/) | 1945년 3월 사진 |
| 호찌민 | [원자료](https://english.hochiminh.vn/photo/ho-chi-minh/documentary-photos-on-president-ho-chi-minh-from-1930-to-1945-2) | 1930–1945 자료; 후기 노년 초상과 구분 |
| 수카르노 | [원자료](https://www.nationaalarchief.nl/onderzoeken/fotocollectie/7183cf4c-36c7-76a4-9b42-108f9fd9d59f) | 1947년 사진; 1942년 사진으로 단정 안 함 |
| 마누엘 케손 | [원자료](https://www.loc.gov/pictures/item/2011647826/) | 1942년 사진 |
| 마오쩌둥 | [원자료](https://www.loc.gov/pictures/item/2004669917/) | 1938년 사진; 노년 공식 초상과 구분 |
| 처칠·스탈린 | [원자료](https://www.archives.gov/research/military/ww2/photos) | 1945년 얄타 등; 제복 계급을 1942년 고증으로 단정 안 함 |
| 루스벨트 | [원자료](https://www.fdrlibrary.org/perskie) | 1944년 초상 자료 |
| 드골 | [원자료](https://www.museedelaresistanceenligne.org/media1301-Charles-de-Gaulle) | 1940년 초상 |
| 무솔리니 | [원자료](https://www.loc.gov/item/2005685245/) | 1934년 사진; 중립적 묘사, 선전 상징 제외 |
| 몽고메리 | [원자료](https://www.iwmprints.org.uk/collections/historical-period/products/pod446737) | IWM TR1037; 검은 베레, 모표 재현 제외 |
| 앨런 브룩 | [원자료](https://collection.nam.ac.uk/detail.php?acc=1991-10-272-1) | 약1940년 국립육군박물관 기록 |
| 앨런 튜링 | [원자료](https://www.npg.org.uk/collections/search/portrait-list.php?displayStyle=thumb&sText=alan+turing&search=sp) | 유명 개인 초상1951년; 배우 대신 실존 인물, 나이 예술적 재구성 |
| 케인스 | [원자료](https://www.npg.org.uk/collections/search/portrait/mw179585/John-Maynard-Keynes-Baron-Keynes?LinkID=mp02535&rNo=19) | 1940년7월 기록 |
| 아이젠하워 | [원자료](https://www.eisenhowerlibrary.gov/research/photographs) | 전시 사령관과 전후 대통령 외형 구분 |
| 아인슈타인 | [원자료](https://www.loc.gov/pictures/item/92519650/) | 약1945년 초상 |
| 오펜하이머 | [원자료](https://home.nps.gov/mapr/learn/historyculture/oppenheimer.htm) | 전시기 인물; 배우와 구분 |
| 간디(생성 차단) | [원자료](https://www.loc.gov/pictures/item/89711559/) | 자료 조사만 수행, 생성 결과 없음 |
| 히틀러(생성 차단) | [원자료](https://encyclopedia.ushmm.org/content/en/photo/chamberlain-and-hitler-meet-in-munich) | 자료 조사만 수행, 생성 결과 없음 |

외모 완전 일치에 대한 보증이 아닌 참고자료 조사다. 원사진의 정확한 촬영 시기가 다른 경우1942년 실사라고 주장하지 않는다. 생성 결과22장 접촉시트에서 얼굴·프레이밍·텍스트/휘장 미삽입·화풍을 시각 확인했다.

## 검증

- 관련12개 파일452개 테스트 통과(기존 아이콘/화면 회귀 + 초상 식별·플레이어 제외·현재/과거 후보·조직 교체·렌더 무변경).
- npm run build 통과:2114 modules. 기존 큰 JS 청크 경고는 유지.
- 22개 자산의 실제 픽셀 보존 확인.
- PC 브라우저 확인: 1920×1080 보직 선택/영국 참모명단,2560×1440 튜링 선택·상세 전환,3840×2160 참모명단,한국 보직 선택의 김구 초상. 화면 가로 넘침 없음(body.scrollWidth===innerWidth), 새 초상 파일은 naturalWidth2048로 정상 로드. 명단38px/상세64px/취임기록88px 정사각 프레이밍 확인.
- 새 검증 세션의 브라우저 오류0. 생성 파일 다운로드 완료 전 먼저 연 임시 세션에는 미완성 import 오류가 있었고, 파일 완료 후 새 세션에서 재검증했다.
- 대표 화면 검증이며 모든 국가·모든 시대·모든 보직의 시각 전수 검증은 아니다. 영국/한국은 브라우저,중국 선거 후보는 실제 엔진 fixture 단위검증.

## 보관 위치

- 원본: design/source-assets/portraits/*.png
- 런타임: src/assets/portraits/*.webp
- 연결: src/historicalPortraits.ts, src/PersonPortrait.tsx
- 제작·픽셀 검증 재실행: scripts/import-higgsfield-portraits.mjs(SHARP_PATH 지정)
- 전체 미리보기: docs/higgsfield-portraits-contact-sheet.png
- 아이콘 미리보기: docs/higgsfield-icons-contact-sheet.png
- PC 확인 화면: docs/higgsfield-portraits-{setup-1080,staff-1080,turing-1440,staff-4k,korea-1080}.png
- 이번 변경은 로컬 작업이며 커밋/배포하지 않음.
