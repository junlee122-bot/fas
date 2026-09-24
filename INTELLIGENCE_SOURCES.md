# 정보기관·비밀전 인물 모델링과 출처

## 구현 범위

게임은 40개 정보기관·암호기관·특수작전조직·레지스탕스망과 43명의 실존 인물을 별도 계보로 모델링합니다. 기관에는 창설·해체 연도, 전신·후신, 기능, 실제 역사 근거, 윤리·정통성 위험과 출처가 있으며, 인물에는 실제 직책, 활동 시작 연도, 전문분야, 인맥, 역사적 제약과 출처가 있습니다.

COI→OSS→SSU→CIG→CIA처럼 이름만 바뀐 것이 아니라 법적 기반과 임무가 달라진 조직은 각각 별도 기관으로 기록합니다. 세계사 사건에서 역사형·제도형·급진형을 고르면 후계기관의 표시 이름, 등장 연도와 장기 효과가 달라집니다. 가상의 결과는 실제 역사 사실과 혼동하지 않도록 “세계선 효과”로 분리해 표시합니다.

## 등장과 영입 규칙

- 기관은 실제 창설 연도와 연결 사건의 선택 결과를 함께 계산해 등장합니다.
- 인물은 본인의 활동 가능 연도에 도달하고 연결 기관 중 하나가 활동 중일 때만 영입시장에 나타납니다.
- 능력·잠재력·충성·관심·계약비용은 게임 균형값이며 역사적 인물에 대한 사실 판정이 아닙니다.
- 이중간첩과 경쟁기관 인물은 추가 검증·포섭 위험을 갖습니다.
- 전쟁범죄·고문·정치적 탄압의 가해자로 분류한 인물은 영입 후보에서 제외합니다.
- 게슈타포·RSHA·헌병대·NKVD·Stasi·KCIA처럼 국가폭력과 권한 남용이 핵심인 기관은 위험을 숨기지 않고 감시·해체·사법처리·민주적 감독의 대상으로 표시합니다.

## 우선 대조 자료

### 미국과 영미권

- [미국 국립문서기록관리청 — CIA와 선행기관 COI·OSS·SSU·CIG](https://www.archives.gov/research/intelligence/cia)
- [미국 국립문서기록관리청 — OSS 기록과 조직사](https://www.archives.gov/research/military/ww2/oss)
- [CIA Museum — OSS](https://www.cia.gov/legacy/museum/exhibit/the-office-of-strategic-services-n-americas-first-intelligence-agency/)
- [NSA — 암호기관 역사 사건 연표](https://www.nsa.gov/History/Cryptologic-History/Historical-Events/Historical-Events-List/)
- [GCHQ — 블레츨리 파크와 제2차 세계대전](https://www.gchq.gov.uk/section/history/bletchley-park-and-wwii)
- [GCHQ — UKUSA 협정의 역사](https://www.gchq.gov.uk/information/brief-history-of-ukusa)
- [MI5 — 제2차 세계대전과 Double Cross](https://www.mi5.gov.uk/history/world-war-ii)
- [SIS — 공식 기관사](https://www.sis.gov.uk/about-us/our-history/)
- [영국 국립문서보관소 — Virginia Hall](https://www.nationalarchives.gov.uk/explore-the-collection/stories/virginia-hall/)
- [영국 국립문서보관소 — Noor Inayat Khan](https://www.nationalarchives.gov.uk/education/resources/who-was-noor-khan/)
- [미국 상원 — Church Committee](https://www.senate.gov/about/powers-procedures/investigations/church-committee.htm)

### 유럽·소련 계보

- [독일 연방문서보관소 — 게엘렌 조직과 초기 BND](https://www.bundesarchiv.de/themen-entdecken/online-entdecken/podcast/der-fruehe-bundesnachrichtendienst-und-die-ddr/)
- [독일 연방문서보관소 — 동서독 정보전 자료](https://www.bundesarchiv.de/assets/bundesarchiv/de/Bildungsmaterialien/Themenmappe_4_einseitig_BArch_BA.pdf)
- [미국 홀로코스트기념박물관 — Gestapo](https://encyclopedia.ushmm.org/content/en/article/gestapo)
- [DGSE — BCRA에서 DGSE까지의 기관 계보](https://www.dgse.gouv.fr/fr/nous-connaitre/notre-heritage)
- [프랑스 국방부 기억의 길 — BCRA](https://www.cheminsdememoire.gouv.fr/index.php/en/occupied-france-bcra-londres-alger-paris)
- [이탈리아 카라비니에리 역사보 — 체사레 아메와 전시 SIM](https://www.carabinieri.it/docs/default-source/editoria/notiziariostorico/notiziario-2018-2.pdf?sfvrsn=c5a44b23_2)

### 아시아·탈식민화

- [국사편찬위원회 — 한국광복군과 OSS 독수리작전](https://db.history.go.kr/item/level.do?levelId=ij_013_%241exp)
- [국사편찬위원회 우리역사넷 — 광복군 OSS 합동훈련](https://contents.history.go.kr/mobile/kc/view.do?levelId=kc_o403810)
- [미국 국립문서기록관리청 — 일본 정보기록의 노획과 활용](https://text-message.blogs.archives.gov/2021/10/21/the-capture-and-exploitation-of-japanese-records-during-world-war-ii/)
- [중국 국방부 — 군통·중통 등 정보조직사](https://www.mod.gov.cn/gfbw/gfjy_index/4806820.html)
- [모사드 — 공식 기관사](https://mossad.gov.il/en/history)

## 사실과 대체역사의 경계

출처는 조직의 존재, 대략적 연혁, 실제 직책과 활동을 검증하는 출발점입니다. 세계선에서 만들어지는 기관명, 조기·지연 창설, 국제 공동기관, 능력치, 포섭 확률과 선택의 수치 효과는 플레이 결과를 위한 가상 모델입니다. 정보기관의 공식 기관사는 자기서술의 한계가 있으므로, 후속 확장에서는 국가기록원·의회조사·사법기록·학술연구를 교차 대조합니다.
