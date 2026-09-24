# 실존 민간 전문가 데이터 원칙

## 범위

현재 데이터베이스는 1942년 직책·소속·활동 지역을 심층 모델링한 과학자·공학자·의사·경제학자·산업가·통계학자·정보 연락자·외교·사회과학자 316명과, 국가별 220명씩 총 2,860명의 실존 인물 디렉터리를 함께 사용한다. 기존 군사·정치·정보 지도부 169개 슬롯과 분리된 민간 전문가 계층이며, 13개 플레이 진영마다 `과학기술`과 `전시경제`의 두 핵심 보직과 최소 200명 이상의 접촉 가능한 후보군을 제공한다.

기존의 핵심 인물 55명에 261명을 추가했다. 각 플레이 진영에는 자국을 1차 활동권으로 삼은 인물이 최소 23명 존재한다. 영국·미국·소련·독일·일본 같은 강대국뿐 아니라 중국·인도·자유프랑스·이탈리아, 식민지 또는 점령지였던 조선·베트남·인도네시아·필리핀도 같은 밀도의 인물 구조를 사용한다.

## 국가별 200명 이상 디렉터리

대규모 인물 디렉터리는 Wikidata Query Service의 구조화 자료에서 인간, 국적, 생년과 1942년 10월 25일 생존 조건을 만족하는 항목을 국가별로 수집한다. 각 레코드는 Wikidata QID와 원문 URL을 보존하며, 생성 명령은 `npm run data:historical-roster`다. 생성 결과는 오프라인 게임 데이터로 저장하므로 플레이 중 외부 네트워크가 필요하지 않다.

생성기는 각 QID의 공개 직업(P106) 레코드를 국가별로 일괄 조회해 군사·정보·의료·공학·과학·경제·산업·외교·사회과학 분야로 분류한다. 현재 생성본 2,860명은 모두 최소 한 개 이상의 실제 직업 레코드를 보존한다. 인재 카드와 조사 보고서는 `신원·직업 확인 · 1942 경력 조사 필요`와 `1942 경력 심층 검증`을 별도 배지로 표시한다.

이 계층은 이름만 보고 1942년 직책을 추정하지 않는다. 신원·국적·생년·생존 조건은 확인됐지만 개별 전시 직책·소속·정치적 입장을 아직 기관 사료와 대조하지 않은 인물은 카드에 `1942년 활동·소속 정밀조사 필요`라고 표시한다. 따라서 기존 심층 프로필이 같은 이름으로 존재하면 심층 프로필을 우선하며, 대규모 계층의 임명 효과는 조사 완료 전 확정 효과가 아닌 잠금 안내로 표시한다.

- [Wikidata Data access — Query Service](https://www.wikidata.org/wiki/Wikidata:Data_access/en)
- [Wikidata Query Service](https://query.wikidata.org/)
- [Wikidata Licensing — CC0 structured data](https://www.wikidata.org/wiki/Wikidata:Licensing)

추가 인물군은 단순 명단이 아니라 전시 신진 연구자, 수감·망명·점령지 인사, 연구소장과 산업조정자를 구분한다. 1914년 이후 출생 인물은 1942년 영향력을 낮추고 잠재력을 높여 장기 육성 대상으로 만들었으며, 바빌로프·장 제·최현배·호세 아바드 산토스처럼 자유가 제한되거나 생존시한이 있었던 인물은 석방·구출·체제전환 제약을 카드에 명시했다.

“역사적 인물을 전부 넣는다”는 방향은 무한한 인명 목록을 임의로 채운다는 뜻이 아니다. 플레이에 영향을 주는 인물부터 검증 가능한 단위로 확장한다. 인물마다 다음 필드를 요구한다.

- 1942년의 대표 직책 또는 활동 상태
- 당시 활동 지역과 소속 기관
- 전문 분야 3개와 협업 인맥 2개
- 영입을 가로막는 정치·윤리·지리적 제약
- 게임 안의 임명 효과와 경쟁 기관의 관심
- 확인 가능한 기관·전기·수상 기록의 출처 라벨

## 사실과 게임 수치의 경계

출생연도, 당시 직책, 소속, 활동 지역, 주요 연구, 망명·구금·점령 같은 조건은 사료에 근거한다. 능력·잠재력·충성도·관심도·계약금·임명 효과는 역사적 인물의 인간적 가치를 평가하는 사실이 아니라 전략 게임의 상호작용을 위한 수치다.

대체역사 영입은 아무 조건 없이 인물을 순간이동시키지 않는다. 예를 들어 망명 과학자의 귀환에는 정권·인종정책 전환이, 점령지 연구자의 이동에는 비밀 연락과 안전한 경로가, 수감 기술자의 기용에는 석방과 복권이 필요하다는 제약을 카드에 기록한다.

## 아인슈타인 처리 원칙

알베르트 아인슈타인은 1942년 프린스턴 고등연구소의 이론물리학자로 배치한다. 1939년 대통령에게 보내는 우라늄 관련 경고 서한에는 서명했지만 맨해튼 계획의 구성원은 아니었으므로, 직접 핵무기 개발 보너스를 부여하지 않는다. 게임에서는 기초이론, 과학외교, 유럽 망명 학자 네트워크에 영향을 준다.

## 우선 대조 자료

- [GCHQ — Alan Turing](https://www.gchq.gov.uk/person/alan-turing)
- [Institute for Advanced Study — Albert Einstein](https://www.ias.edu/albert-einstein-brief)
- [Institute for Advanced Study — John von Neumann](https://www.ias.edu/von-neumann)
- [U.S. Department of Energy — Metallurgical Laboratory and Chicago Pile-1](https://www.energy.gov/lm/metallurgical-laboratory-university-chicago)
- [U.S. National Park Service — Oppenheimer, 1941–1946](https://www.nps.gov/articles/000/the-life-of-j-robert-oppenheimer-the-manhattan-project-years-1941-to-1946.htm)
- [Nobel Prize — Pyotr Kapitsa](https://www.nobelprize.org/prizes/physics/1978/kapitsa/biographical/)
- [Nobel Prize — Leonid Kantorovich](https://www.nobelprize.org/prizes/economic-sciences/1975/kantorovich/biographical/)
- [Nobel Prize — Hideki Yukawa](https://www.nobelprize.org/prizes/physics/1949/yukawa/biographical/)
- [Tata Institute of Fundamental Research — History and Homi Bhabha](https://www.tifr.res.in/portal/history.php)
- [CSIR India — Shanti Swarup Bhatnagar](https://www.csir.res.in/en/award/shanti-swarup-bhatnagar-prize-science-and-technology)
- [Harvard Gazette — John Kenneth Galbraith timeline](https://news.harvard.edu/story/2006/05/john-kenneth-galbraith-a-timeline-of-his-life/)
- [대한민국 과학기술유공자](https://www.koreascientists.kr/)
- [Universitas Gadjah Mada Museum — Herman Johannes](https://museum.ugm.ac.id/2024/08/18/prof-herman-johannes-ilmuwan-pembuat-bom-dan-pahlawan-nasional-indonesia/)
- [Universitas Indonesia FEB — Sumitro Djojohadikusumo](https://feb.ui.ac.id/2015/03/26/bedah-buku-jejak-perlawanan-begawan-pejuang-sumitro-djojohadikusumo/)
- [Philippine National Academy of Science and Technology — Gregorio Zara](https://www.members.nast.dost.gov.ph/index.php/list-of-national-scientist/details/3/42)
- [U.S. National Archives — Manhattan Project Notebook, 1942](https://www.archives.gov/milestone-documents/manhattan-project-notebook)
- [U.S. National Archives — Manhattan Project Nobel scientists](https://declassification.blogs.archives.gov/2013/02/01/nobel-prize-winning-scientists-associated-with-the-manhattan-project/)
- [UK Government — wartime radar and Robert Watson-Watt](https://www.gov.uk/government/speeches/2012-05-24-qinetiq-70th-anniversary-dinner)
- [UK Government Operational Research Service — history of wartime OR](https://operational-research.gov.uk/public_docs/history-of-gors.pdf)
- [일본 국립국회도서관 — 야기 히데쓰구](https://www.ndl.go.jp/portrait/e/datas/363/)
- [중국과학원 — 첸싼창](https://www.cas.cn/xzfc/202206/t20220630_4840013.shtml)
- [Indian National Science Academy — fellows and past presidents](https://insaindia.res.in/pdf/Year-Book-2025.pdf)
- [Indian National Science Academy — scientists and institution builders](https://insaindia.res.in/pdf/BS.pdf)
- [Philippine National Academy of Science and Technology — National Scientists](https://nast.dost.gov.ph/images/pdf%20files/Publications/Other%20Publications%20of%20NAST/First%20Decade/The%20National%20Scientists%20Decade.pdf)
- [Royal Society — History and scientific archives](https://royalsociety.org/about-us/who-we-are/history/)
- [U.S. National Archives — Office of Scientific Research and Development records](https://www.archives.gov/research/guide-fed-records/groups/227.html)
- [Deutsches Museum — Archive](https://www.deutsches-museum.de/en/research/archive)
- [National Diet Library of Japan — Portraits of Modern Japanese Historical Figures](https://www.ndl.go.jp/portrait/e/)
- [Chinese Academy of Sciences — History](https://english.cas.cn/about_us/introduction/history/)
- [국사편찬위원회 — 한국사데이터베이스](https://db.history.go.kr/)
- [National Library of Indonesia — Khastara](https://khastara.perpusnas.go.id/)

월별 직책 변동과 복수 소속은 주간 전략 게임에서 읽을 수 있도록 대표 상태로 요약한다. 논쟁적인 경력은 단정하지 않고 `historicalConstraint`에 논쟁·정통성·윤리 위험을 명시한다.
