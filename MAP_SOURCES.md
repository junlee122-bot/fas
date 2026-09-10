# 전역 지도 사료와 이용 조건

게임은 현대 벡터 지도를 제2차 세계대전풍으로 꾸민 것이 아니라, 전쟁 중 실제로 제작·발행된 지도 스캔을 전구별 기본 지도에 사용한다. 원본 지도 위의 통제 색상, 부대 표식, 연결선, 보급·기상·정보 레이어는 플레이어의 선택에 따라 달라지는 대체역사 게임 정보다.

## 유럽 전구

- 원제: **Map of the European Theater**
- 제작: Army Orientation Course, Army Information Branch, Morale Services Division, Army Service Forces, War Department
- 제작일: 1944년 3월 20일
- 소장처: Harry S. Truman Library & Museum
- 관리 번호: M1753-01
- 원문: https://www.trumanlibrary.gov/maps/m1753-01-map-european-theater
- 프로젝트 파일: `src/assets/european-theater-war-department-1944.jpg`
- 로컬 원본: **3,856 × 2,915 px / 3,008,072 bytes**. 배포 한도에 맞춘 축소본이 아니라 소장처 원본 JPEG를 보존한다.
- 이용 조건: 소장처 페이지가 Public Domain으로 명시하며 자유 이용을 허용한다. 게임 내 출처 표기에 제작 기관과 소장처를 함께 표시한다.

이 지도는 전전 국경, 1939년 이후의 국경, 철도, 하천을 함께 표시한다. 게임의 유럽·지중해 지역 좌표는 스캔에 인쇄된 지명을 기준으로 보정했다.

## 아시아·태평양 전구

- 원제: **The Far East and Adjoining Areas**
- 제작: Robert Winslow, Rand McNally and Company / Milrose Publishing Co.
- 제작연도: 1943년
- 소장처: Library of Congress, Geography and Map Division
- 청구 기호: G7400 1943 .W5
- 원문: https://www.loc.gov/item/2006636620/
- 프로젝트 파일: `src/assets/far-east-milrose-1943.jpg`
- 로컬 원본: **10,000 × 7,190 px / 22,370,079 bytes**. 의회도서관 서지와 대조한 동일 판본의 고해상도 보존 스캔을 사용한다.
- 고해상도 스캔 경로: https://www.mapas-del-mundo.net/asia/mapas-antiguos-de-asia/gran-escala-detallada-viejo-mapa-del-lejano-oriente-y-las-zonas-colindantes-1943
- 이용 조건: 미국 의회도서관 지리·지도 부문 디지털 자료의 Free to Use and Reuse 안내에 따라 사용하며, 게임 내에 소장처와 원문 링크를 표시한다.

이 지도는 극동의 지형, 도로, 철도와 함께 태평양·인도양·솔로몬 제도 부도를 수록한다. 하와이·미드웨이 등 주 지도 바깥 지역은 원본에 인쇄된 태평양 부도에 게임 표식을 배치한다.

## 게임 적용 원칙

1. 원본 스캔의 국경·철도·지명은 다시 그려서 역사적 사실처럼 보이게 만들지 않는다.
2. 게임의 영토 표식은 각 원본의 투영법과 인쇄 지명에 맞춘 별도 좌표표(`src/historicalMaps.ts`)로 관리한다.
3. 1943·1944년 원본 지도와 캠페인의 시작 시점이 다를 수 있으므로, 지도 안에서 원본 제작연도와 대체역사 레이어를 명확히 구분한다.
4. 고해상도 원본은 전구 확대·이동 중에도 지명과 철도망을 읽을 수 있도록 로컬 자산으로 제공한다.
   로컬 게임 빌드가 기준이며 지도는 최대 600%까지 확대한다. Vercel 공개본의 전송 용량은 원본 자산의 품질 기준으로 사용하지 않는다.
5. 도시 좌표, 공세 인접성, 보급 경로와 전선 소속은 하나의 작전지역 데이터에서 파생해 지도 표식과 전선 보고서의 불일치를 막는다.
6. 100% 축소 화면에는 수도·전선군, 140% 이상에는 1급 전략거점, 180% 이상에는 2급 도시, 220% 이상에는 3급 교두보·요새를 표시해 219개 지역의 라벨 충돌을 줄인다.
7. 전구 전체도 아래에 북대서양, 서유럽, 동부전선 북부·남부, 중부유럽·지중해, 북아프리카·중동, 인도·버마, 중국·만주·한반도, 동남아·동인도, 일본·필리핀, 남서태평양, 중부·북태평양 등 14개 지역 작전도를 둔다. 각 지역도는 같은 보정 좌표를 확대하므로 도시 표식과 전선 계산이 어긋나지 않는다.

## 전선·작전구역 세분화 자료

- [U.S. Army Center of Military History — European-African-Middle Eastern Theater Campaigns](https://history.army.mil/Research/Reference-Topics/Army-Campaigns/Brief-Summaries/World-War-II/World-War-II-European-African-Middle-Eastern-Theater/): 이집트-리비아, 알제리-모로코, 튀니지, 시칠리아, 나폴리-포자, 안치오, 로마-아르노, 노르망디, 북부·남부 프랑스, 라인란트, 아르덴-알자스와 중부유럽 작전구역의 명칭·기간·전개를 교차 확인했다.
- [U.S. Army Center of Military History — Asiatic-Pacific Theater Campaigns](https://history.army.mil/Research/Reference-Topics/Army-Campaigns/Brief-Summaries/World-War-II/World-War-II-Asiatic-Pacific-Theater/): 필리핀, 버마, 인도-버마, 중국 방어·공세, 파푸아, 뉴기니, 과달카날, 북부 솔로몬, 중부·서부 태평양, 레이테·루손·류큐 작전구역을 세분화하는 기준으로 사용했다.
- [Library of Congress — Battles and campaigns: World War II, European and African theater](https://www.loc.gov/resource/g5701s.ct003445/): 미 전쟁부가 정리한 북아프리카·이탈리아·서부유럽 작전도에서 주요 상륙축과 도시 연결을 대조했다.
- [Library of Congress — Northwestern European Military Situation Maps](https://www.loc.gov/collections/world-war-ii-maps-military-situation-maps-from-1944-to-1945/about-this-collection/): 제12군집단 일일 상황도의 전선 변화와 아르덴·라인강 방면 세부화를 참고했다.
- [National Army Museum — Battles of Imphal and Kohima](https://www.nam.ac.uk/explore/battle-imphal): 임팔·코히마를 별도 요새 거점으로 두고 아삼–친드윈–북부 버마 연결축을 구성하는 근거로 사용했다.

66개 전선군과 219개 작전지역은 역사적 명칭과 작전권을 출발점으로 하지만, 게임 안의 현재 접촉선·통제율·위기 상태는 사용자의 선택에 따라 매주 달라지는 대체역사 값이다. 레닌그라드·스탈린그라드·쾨니히스베르크·스탈리노·신징·다이렌·경성·다이호쿠·바타비아·랑군·트루크·홀란디아처럼 캠페인 시기 명칭을 우선하고, 현대 지명이 낯선 경우에는 괄호나 사료 설명으로 함께 제시한다.
