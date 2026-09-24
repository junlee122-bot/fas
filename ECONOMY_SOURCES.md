# 전시 재정·기업시장 사료와 구현 원칙

이 문서는 게임의 전시 재정과 산업지분 시스템이 어떤 역사 자료를 규칙으로 옮겼는지 기록한다. 게임 안의 기업지수는 실제 일별 주가 복원이 아니라 1942년을 100으로 둔 대체역사 지수이며, 능력치·수익률·변동성은 역사적 사실에 대한 평가나 현실 투자 권유가 아니다.

## 전시금융

- [Federal Reserve History — The Federal Reserve's Role During WWII](https://www.federalreservehistory.org/essays/feds-role-during-wwii): 조세와 국내차입, 다양한 투자자용 전쟁증권, 단기국채 3/8%와 장기채 2.5% 금리 지지, 가격·임금·소비자신용 통제.
- [Federal Reserve History — WWII and Its Aftermath](https://www.federalreservehistory.org/essays/wwii-and-its-aftermath): 대규모 재정적자, 국채가격 지지, 통화기반 확대와 전후 인플레이션 위험.
- [UK Parliament — The cost of war](https://www.parliament.uk/about/living-heritage/transformingsociety/private-lives/taxation/overview/costofwar/): 전시 소득세 확대와 1944년 PAYE 원천징수 도입.
- [Bank of England — Internal Finance, 1939–1945](https://www.bankofengland.co.uk/-/media/boe/files/archive/ww/boe-1939-1945-part1-chapterv): 국민저축, 전쟁채권과 정부 차입의 구성.
- [Deutsche Bundesbank — From the Reichsbank to the Bundesbank](https://www.bundesbank.de/resource/blob/927730/25fef541e4458e82d064ac532464646f/mL/von-der-reichsbank-zur-bundesbank-data.pdf): Mefo 어음, 재무장 신용조달과 인플레이션 위험.
- [Bank of Japan — 일본은행 백년사 제4권](https://www.boj.or.jp/about/outline/history/hyakunen/hyaku4.htm): 대량 국채발행, 국채 소화, 전시 금융·외환 통제와 중앙은행 기능 변화.

## 시장과 기업

- [London Stock Exchange — Our history](https://www.londonstockexchange.com/discover/lseg/our-history?lang=en): 제2차 세계대전 중 반복된 피해에도 1945년 V2 직격 하루를 제외하고 거래 지속.
- [SEC Annual Report 1940](https://www.sec.gov/files/1940.pdf): 유럽전쟁 발발기의 비상 시장상황과 거래중단 권한·시장감시.
- [Ford company timeline](https://corporate.ford.com/about/history/company-timeline/): 민수차 생산 중단, Jeep·B-24 등 전시 생산 전환.
- [GM Heritage](https://www.gm.com/heritage?evar25=gmhc_redirect): 1942년 민수생산 중단과 차량·항공기·전차·탄약 생산.
- [Boeing history chronology](https://www.boeing.com/content/dam/boeing/boeingdotcom/history/pdf/Boeing-Chronology.pdf): B-17·B-29 등 항공기 개발·생산 연표.
- [Mitsubishi history](https://www.mitsubishi.com/en/profile/history/outline/): 중공업·광업·은행·무역의 기업집단 구조와 전후 재벌해체.
- [Tata — The Defence Journey](https://www.tata.com/newsroom/tata-defence-journey): 제2차 세계대전 중 전체 철강생산의 연합군 투입과 장갑판·특수강 생산.
- [Siemens 1933–1945](https://www.siemens.com/global/en/company/about/history/company/1933-1945.html): 전시생산뿐 아니라 강제노동과 기업책임을 포함한 역사.

## 게임 규칙으로의 번역

1. 세금·관세·배당은 갚지 않는 `세입`, 국채·중앙은행 인수는 부채가 늘어나는 `차입`으로 별도 표시한다.
2. 월간 전망은 주간 예상에 평균 월 길이 4.345주를 곱하며, 정책이나 사건이 바뀌면 즉시 다시 계산한다.
3. 기업가격은 실제 종가가 아니라 전황·산업능력·해상통제·물가·공공신뢰·월간 사건으로 변하는 지수다.
4. 소련의 국가공장과 망명·저항운동은 상장주식으로 위장하지 않고 각각 국가 산업계정과 비밀 산업기금으로 구분한다.
5. 강제노동·약탈경제와 연결된 기업은 이를 이익 보너스로 다루지 않으며, 역사·책임 위험과 전후 재판·해체·몰수 위험으로 명시한다.
