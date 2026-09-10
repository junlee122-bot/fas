# Historical personnel data notes

IRON DOMINION은 1942년을 고정 재현하는 게임이 아니라, 당시의 인물·기관·직책을 출발점으로 삼는 대체역사 시뮬레이션입니다.

## 모델링 원칙

- 13개 플레이 진영마다 역사 기준 인물 15명(핵심 재직자 3명, 현직·조직 참모 5명, 영입·포섭 시장 5명, 신규 보직·반대파·저항망 인물 2명)을 둡니다.
- 각 진영은 정치 5단계, 군사 4단계, 정보 4단계의 13개 플레이 보직을 제공합니다. 13개 보직명은 커리어 피라미드를 위한 게임용 재구성이며 각 카드의 `역사상 직책`과 `사료 기준`이 실제 기준점입니다.
- 보직의 별은 인물의 역사적 가치나 능력에 대한 평가가 아니라 플레이어가 행사할 수 있는 조직 권한의 범위입니다. 5성은 국가 최고위, 1성은 현장 실무 보직을 뜻합니다.
- 실제 직책은 1942년 중 대표 재직 상태를 사용합니다. 연중 인사이동이 있었던 경우 UI에 월 또는 `1942년 초/까지`를 함께 표기합니다.
- 게임상의 보직명은 플레이 계층을 만들기 위한 대체역사 직책입니다. `역사상 직책` 필드가 실제 기준점입니다.
- 능력·잠재력·충성도·관심·영향력은 밸런스용 게임 수치이며 역사적·도덕적 평가가 아닙니다.
- 전쟁범죄나 독재에 연루된 인물의 등장은 역사적 배경을 모델링하기 위한 것이며 미화나 정당화를 뜻하지 않습니다.

## 우선 대조 자료

- 영국: Imperial War Museums, [Churchill, Alan Brooke and Montgomery in North Africa, 1942](https://www.iwm.org.uk/collections/item/object/205125959)
- 미국: U.S. Army Center of Military History, [General of the Army Dwight D. Eisenhower](https://history.army.mil/Research/Reference-Topics/5-Star/Gen-Dwight-D-Eisenhower/)
- 미국·태평양: U.S. Army Center of Military History, [The U.S. Army in World War II: Special Operations](https://history.army.mil/portals/143/Images/Publications/catalog/70-42.pdf)
- 일본 해군: Naval History and Heritage Command, [Japanese Personnel at the Battle of Midway](https://www.history.navy.mil/content/history/museums/nmusn/explore/photography/wwii/wwii-pacific/turning-the-japanese-tide/1942-june-battle-of-midway/japanese-personnel.html/1000)
- 일본 해군 편제: Naval History and Heritage Command, [Composition of Japanese Forces](https://www.history.navy.mil/research/library/online-reading-room/title-list-alphabetically/c/composition-of-japanese-forces.html)
- 중국·버마·인도: U.S. Army Center of Military History, [Burma, 1942](https://history.army.mil/portals/143/Images/Publications/catalog/72-21.pdf)
- 중국 정치 지도부: U.S. Department of State, [Foreign Relations of the United States, 1942, China, Document 177](https://history.state.gov/historicaldocuments/frus1942China/d177)
- 자유 프랑스 정보조직: Chemins de mémoire, [From occupied France to the BCRA](https://www.cheminsdememoire.gouv.fr/index.php/en/occupied-france-bcra-londres-alger-paris)
- 독일 최고사령부: United States Holocaust Memorial Museum, [Wilhelm Keitel](https://encyclopedia.ushmm.org/content/en/article/wilhelm-keitel-biography)
- 이탈리아 육군 지휘부: Esercito Italiano, [The Chiefs of the Staff in the past](https://www.esercito.difesa.it/en/organization/the-chief-of-general-staff-of-the-army/the-chief-of-the-staff-of-the-italian-army/123270.html)
- 영국령 인도 정치 배경: The National Archives, [Cripps, Nehru and Gandhi](https://www.nationalarchives.gov.uk/education/resources/indian-independence/cripps-nehru-gandhi/)
- 한국 임시정부·광복군: 대한민국 독립기념관, [대한민국 임시정부 상설전시 ‘새로운나라’](https://www.i815.or.kr/upload/kr/magazine/magazine/72/post-777.html)
- 한국광복군 지원 활동: 대한민국 독립기념관, [김구 서명문 태극기와 한국광복군](https://search1.i815.or.kr/images/img_cooperation/2024/network/Leaflet_pdf_info_04.pdf)
- 베트민의 1941년 결성과 대일 항전: U.S. Department of State Office of the Historian, [Viet Minh 용어 해설](https://history.state.gov/historicaldocuments/frus1969-76v08/terms)
- 인도네시아 민족운동의 전간기 국제연결: NIOD Institute for War, Holocaust and Genocide Studies, [Behind the Banner of Unity](https://www.niod.nl/en/publications/di-balik-bendera-persatuan-behind-banner-unity)
- 필리핀 게릴라·정보망: U.S. Army Center of Military History, [U.S. Army Special Operations in World War II](https://history.army.mil/portals/143/Images/Publications/catalog/70-42.pdf)
- 카사블랑카 회담: U.S. Department of State Office of the Historian, [The Casablanca Conference, 1943](https://history.state.gov/milestones/1937-1945/casablanca)
- 1942년 대한민국 임시정부 승인 교섭: U.S. Department of State Office of the Historian, [중국·미국의 임시정부 승인 의견 교환](https://history.state.gov/historicaldocuments/frus1942China/comp18)

## 5단계 커리어·국가별 역사 위기 보강 자료

- 영국 SOE의 조직·작전 성격: Imperial War Museums, [SOE: The Secret British Organisation of the Second World War](https://www.iwm.org.uk/history/soe-the-secret-british-organisation-of-the-second-world-war)
- 미국 OSS 창설과 기능: CIA Museum, [The Office of Strategic Services](https://www.cia.gov/legacy/museum/exhibit/the-office-of-strategic-services-n-americas-first-intelligence-agency/)
- 독일 군부·민간 저항망: German Resistance Memorial Center, [Henning von Tresckow](https://www.gdw-berlin.de/en/recess/biographies/index_of_persons/biographie/view-bio/henning-von-tresckow/), [8 Paths Leading to July 20, 1944](https://www.gdw-berlin.de/en/recess/topics/8-paths-leading-to-july-20-1944)
- 일본의 1942년 물자동원계획: National Diet Library, [Total National Mobilization](https://www.ndl.go.jp/modern/e/cha4/description19.html)
- 중국전구 스틸웰의 다중 직책과 지휘권 문제: U.S. Army Center of Military History, [Stilwell’s Mission to China](https://history.army.mil/Publications/Publications-Catalog/Stilwells-Mission-to-China/)
- 프랑스 국내 레지스탕스 통합: Chemins de mémoire, [L’unification de la Résistance](https://www.cheminsdememoire.gouv.fr/fr/lunification-de-la-resistance)
- 필리핀 후크발라합과 다른 게릴라 계통: U.S. Army Center of Military History, [The Hukbalahap Insurrection](https://history.army.mil/Portals/143/Images/Publications/Publication%20By%20Title%20Images/H%20Pdf/CMH_Pub_93-8-1.pdf?ver=WX-sSv5zV5bt8iHYkNCZdg%3D%3D)

이 목록은 게임 데이터 검증의 우선 기준을 기록한 것이며 전체 참고문헌 목록은 아닙니다. 인물 데이터는 향후 월별 시작일·시나리오별 편제로 더 세분화할 수 있습니다.

## 1942년 국기·운동기 모델링 원칙

- 모든 플레이 세력은 현대 이모지나 현재 국기 대신 1942년 시점에 실제 사용되던 국기·정권기·망명정부기·독립운동기를 인라인 벡터로 표시합니다.
- 1942년에 주권국이 아니었던 인도·한국·베트남·인도네시아는 현대 국가가 이미 존재했던 것처럼 표현하지 않습니다. 각각 국민회의 스와라지기, 대한민국 임시정부 계열 태극기, 베트민기, 민족운동 홍백기로 종류와 사용 맥락을 UI에 명시합니다.
- 미국은 50성기가 아닌 48성기(6행×8열), 일본은 현행 규격이 아닌 1870년 포고의 7:10 규격, 이탈리아는 사보이 문장이 있는 왕국기를 사용합니다.
- 필리핀은 마누엘 케손의 1941년 행정명령에 따라 전시 상태를 뜻하는 붉은 띠를 위에 둡니다.
- 독일 국기의 나치 상징은 당시 정권을 식별하기 위한 역사 교육·시뮬레이션 맥락에서만 표시하며 미화나 지지를 뜻하지 않습니다.
- 사료에 여러 수제 변형이 남은 임시정부·저항운동기는 특정 현존 유물을 그대로 복제했다고 주장하지 않고, 확인되는 핵심 문양을 작은 UI에서도 판독 가능한 게임용 벡터로 정돈합니다.

### 국기 우선 대조 자료

- 영국 연합기: The Flag Institute, [Union Jack or Union Flag?](https://www.flaginstitute.org/wp/uk-flags/the-union-jack-or-the-union-flag/)
- 미국 48성기: Smithsonian Institution, [Facts about the United States Flag](https://www.si.edu/spotlight/flag-day/flag-facts)
- 소련 1936–1955년형: Wikimedia Commons 사료 도안, [Flag of the Soviet Union, 1936–1955](https://commons.wikimedia.org/wiki/File:Flag_of_the_Soviet_Union_(1924%E2%80%931955,_3-2).svg)
- 독일 1935–1945년형: Deutsches Historisches Museum, [Das Hakenkreuz](https://www.dhm.de/lemo/kapitel/ns-regime/innenpolitik/das-hakenkreuz)
- 일본 1870년 규격: 일본 국립국회도서관, [국기〈히노마루〉의 비례 연구](https://ndlsearch.ndl.go.jp/books/R000000025-I009990002884779)
- 중화민국기: 중화민국 총통부, [국가 상징·국기](https://www.president.gov.tw/Page/96)
- 인도 국민회의기: Flag Foundation of India, [1931년 차르카 삼색기](https://flagfoundationofindia.in/faq)
- 자유 프랑스기: Musée de la Libération de Paris, [Drapeau tricolore à croix de Lorraine](https://www.parismuseescollections.paris.fr/fr/musee-jean-moulin/oeuvres/drapeau-tricolore-francais-a-croix-de-lorraine)
- 이탈리아 왕국기: Presidenza della Repubblica, [Italian Tricolour Flag](https://www.quirinale.it/it/pagine/italian-tricolour-flag)
- 대한민국 임시정부 계열 태극기: 독립기념관, [김구 서명문 태극기와 한국광복군](https://i815.or.kr/images/img_cooperation/2024/network/Leaflet_pdf_info_04.pdf)
- 베트민기: Vietnam National Museum of History, [Viet Minh Front 1941–1951](https://vnmh.com.vn/en/Articles/3173/19229/exhibition-viet-minh-front-movement-for-national-liberation-1941-1951-goes-on-display-at-the-vietnam-national-museum-of-history.html)
- 인도네시아 민족운동 홍백기: Majelis Permusyawaratan Rakyat, [인도네시아 국가 정체성과 1928년 홍백기](https://mpr.go.id/img/jurnal/file/160822_KjA%20dgn%20UNSOED%20%282022%29.pdf)
- 필리핀 영연방 전시기: Supreme Court E-Library, [Executive Order No. 386, 1941](https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/5/84473)

## 장비 데이터 원칙

- `실물·문서 고증`은 1942년에 운용·생산·배치되었거나 당시 조직이 실제 보유한 장비 계열입니다. 국가별 생산 편차와 구형 장비 병용은 설명란에 남깁니다.
- 망명정부·점령지 저항세력의 기갑·항공·해군 슬롯은 1942년 독자 정규군 보유를 뜻하지 않습니다. 실제 접근 가능했던 잔존품·노획품·연합 배속·인적 기반을 출발점으로 삼되, 정규 편제로의 확대는 각 노드 설명에 `게임용 확장` 또는 `대체역사 계획`이라고 명시합니다.
- `역사 발전 계보`는 후기대전과 전후에 실제 등장한 여러 기술 흐름을 하나의 게임 연구 노드로 합친 것입니다. 특정 단일 장비의 정확한 제원표가 아닙니다.
- `가상 실험 기술`은 플레이어의 대체역사 설계를 위한 허구입니다. 현실 장비와 혼동되지 않도록 모든 카드와 모듈에 별도 표기를 둡니다.
- 화력·기동·방호·작전반경·신뢰성·생산성은 서로 다른 장비를 비교하기 위한 게임 지수입니다. 실제 관통력, 속도, 항속거리 등의 공학 단위를 뜻하지 않습니다.
- 전략무기 분야는 국가 정책과 산업 투자 수준으로만 추상화하며 제작 절차나 운용 지침을 제공하지 않습니다.

## 장비·미래 기술 우선 대조 자료

- 영국 폭격기 운용 시점: RAF Museum, [The Lancaster enters the fray](https://cms.rafmuseum.org.uk/blog/the-lancaster-enters-the-fray/)
- 영국 다목적 항공기: RAF Museum, [The Wooden Wonder of the RAF](https://www.rafmuseum.org.uk/blog/the-wooden-wonder-of-the-raf/)
- 미국 M1 소총: U.S. Army Center of Military History, [Weapon of the American Soldier](https://history.army.mil/portals/143/Images/Publications/catalog/40-6-1.pdf)
- 미국 M4 전차·야포: Rock Island Arsenal, [Ordnance](https://www.aschq.army.mil/About/History/Tours/RIA/Ordnance/)
- 일본 A6M2: Naval History and Heritage Command, [Mitsubishi A6M2 Zero](https://www.history.navy.mil/content/history/museums/nnam/explore/collections/aircraft/a/a6m2-zero0.html)
- 1942년 일본 항모 항공전력: Naval History and Heritage Command, [Japanese Carrier Air Group](https://www.history.navy.mil/about-us/leadership/director/directors-corner/h-grams/h-gram-005/h-005-2.html)
- 독일 Fw 190: Smithsonian National Air and Space Museum, [Focke-Wulf Fw 190](https://airandspace.si.edu/collection-objects/focke-wulf-fw-190-d-9/nasm_A19600319000)
- 현대·신흥 기술 분류: NATO, [Emerging and disruptive technologies](https://www.nato.int/cps/uk/natohq/topics_184303.htm?selectedLocale=en)
- 현대 소화기 발전: U.S. Army, [Next Generation Squad Weapons adoption](https://www.army.mil/article-amp/270462/revolutionizing_soldier_firepower_us_army_adopts_next_gen_weapons)
- 극초음속 연구의 공개 범위: DARPA, [Hypersonic Air-breathing Weapon Concept](https://www.darpa.mil/research/programs/hypersonic-air-breathing-weapon-concept)
- AI·자율체계의 책임 있는 운용: NATO, [Responsible use of AI, data and autonomy](https://www.nato.int/en/news-and-events/articles/news/2022/10/13/nato-allies-take-further-steps-towards-responsible-use-of-ai-data-autonomy-and-digital-transformation)

`고증`은 검증 가능한 출발점을 뜻하며 완전무결성을 주장하지 않습니다. 사료가 충돌하거나 운용 시점이 월 단위로 달라지는 항목은 설명과 출처를 보강하며 수정합니다.

## 전후 세계선·냉전 사건 모델링 원칙

- 대체지구 아틀라스의 170개 이상 사건군은 실제 사건을 재연하는 각본이 아니라, 실제로 존재했던 정치·경제·군사·사회·기술·보건·환경 압력을 출발 조건으로 삼는 분기점입니다.
- 미국–소련 양극구도는 가능한 결과 중 하나일 뿐입니다. 게임은 플레이 국가, 전쟁 성과, 대체역사 설계의 국제정렬과 탈식민화 원칙을 이용해 냉전의 주축·경쟁 블록·독립 제3극을 다시 계산합니다.
- 장기 사건은 제2차 세계대전 종전 뒤에만 해금되지 않습니다. 13주 단위 세계 위기 창구에서 앞선 선택이 제도·동맹·군사기술의 역사 전개 범위를 넓혀, 총력전과 초기 냉전·탈식민·자원전쟁이 겹치는 대체역사를 만들 수 있습니다. 이 가속 연도는 역사적 연대가 아니라 플레이어가 만든 세계선의 게임 지표로 명시합니다.
- `천뢰 계획`, `무궁화 원자계획`처럼 실제로 존재하지 않은 명칭은 대체역사 원자계획의 게임용 명칭입니다. 실제 계획인 맨해튼 계획, 튜브 앨로이스, 우라늄 협회 등과 같은 사실로 취급하지 않습니다.
- 각 사건의 첫 대안은 실제 역사와 닮은 구조, 둘째는 당대에 논의되었거나 제도적으로 가능한 다자 해법, 셋째는 역사적 압력이 다른 방향으로 폭발한 급진적 가정입니다. 대안의 결과와 세계 지표는 게임 모델이며 역사적 필연을 주장하지 않습니다.
- 핵무기는 국제질서·사찰·억지의 전략 수준에서만 추상화하며 설계·제작·운용 절차를 제공하지 않습니다.

### 전후 세계선 우선 대조 자료

- 맨해튼 계획과 전후 원자력 조직: U.S. Department of Energy, [Manhattan Project: An Interactive History](https://www.osti.gov/opennet/manhattan-project-history/index.htm)
- 1945–1952년 초기 냉전 전환점: U.S. Department of State Office of the Historian, [Milestones 1945–1952](https://history.state.gov/milestones/1945-1952/foreword)
- 베를린 봉쇄와 공수작전: U.S. Department of State Office of the Historian, [The Berlin Airlift, 1948–1949](https://history.state.gov/milestones/1945-1952/berlin-airlift)
- 유엔 창설: United Nations, [History of the United Nations](https://www.un.org/en/about-us/history-of-the-un)
- 탈식민화와 1960년 선언: United Nations, [Decolonization](https://www.un.org/en/global-issues/decolonization/)
- 세계인권선언: United Nations, [Universal Declaration of Human Rights](https://www.un.org/en/about-us/universal-declaration-of-human-rights/)
- 평화유지군과 수에즈·콩고 작전: United Nations Peacekeeping, [Our history](https://peacekeeping.un.org/en/our-history)
- 브레턴우즈 기구: International Monetary Fund, [The IMF and the World Bank](https://www.imf.org/en/about/factsheets/sheets/2022/imf-world-bank-new)
- 스푸트니크와 우주경쟁: NASA, [Sputnik Ushers in the Space Age](https://www.nasa.gov/history/65-years-ago-sputnik-ushers-in-the-space-age/)
- 경쟁에서 우주협력으로의 전환: NASA, [Apollo–Soyuz Test Project Overview](https://www.nasa.gov/history/astp/overview.html)
- Atoms for Peace, IAEA와 NPT: International Atomic Energy Agency, [Atoms Should Be for Peace](https://www.iaea.org/newscenter/news/atoms-should-be-peace)
- 유럽석탄철강공동체부터 브렉시트까지: European Union, [History of the EU](https://european-union.europa.eu/principles-countries-history/history-eu_en)
- 냉전동맹·발칸·9·11·아프가니스탄·현대 유럽안보: NATO, [A short history of NATO](https://www.nato.int/en/about-us/nato-history/a-short-history-of-nato)
- 이란–이라크전의 유조선 전쟁·기뢰전·Operation Earnest Will: U.S. Naval History and Heritage Command, [The Tanker War and Operation Earnest Will](https://www.history.navy.mil/about-us/leadership/director/directors-corner/h-grams/h-gram-018/h-018-1.html)
- 호르무즈 해협의 에너지 수송 중요도: U.S. Energy Information Administration, [The Strait of Hormuz is the world's most important oil transit chokepoint](https://www.eia.gov/todayinenergy/detail.php?id=39932)
- 이란–이라크전 휴전의 국제법 기준점: United Nations Security Council, [Resolution 598 (1987)](https://peacemaker.un.org/en/node/9413)
- WHO 창설·천연두·HIV/AIDS·SARS·세계 보건협력: World Health Organization, [Public health milestones](https://www.who.int/campaigns/75-years-of-improving-public-health/milestones)
- GATT·WTO·세계 생산망: World Trade Organization, [History of the multilateral trading system](https://www.wto.org/english/thewto_e/history_e/history_e.htm)
- 교토의정서와 파리협정: UNFCCC, [The Kyoto Protocol](https://unfccc.int/process-and-meetings/the-kyoto-protocol), [Paris Agreement](https://unfccc.int/news/bringing-the-paris-agreement-into-force)
- COVID-19 국제 대응: World Health Organization, [Listings of WHO's response to COVID-19](https://www.who.int/news/item/29-06-2020-covidtimeline)
- 인공지능의 책임·투명성·인권 기준: OECD, [OECD AI Principles](https://oecd.ai/en/ai-principles)
