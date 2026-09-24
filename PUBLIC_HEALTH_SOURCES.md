# 보건 위기 시스템 사료·모형 원칙

이 시스템은 1942년 전쟁 캠페인에서 감염병이 확률적으로 출현하고, 플레이어의 감시·격리·의료·연구 결정이 주간 전파와 사회·군사 결과를 바꾸도록 설계되어 있다.

## 시대 고증 원칙

- 전시 인플루엔자, 발진티푸스, 콜레라는 전쟁·피난·과밀·위생 붕괴라는 동시대 위험을 기본 축으로 사용한다.
- `SARS형 급성호흡기증후군`과 `COVID형 신종 코로나바이러스`는 실제 SARS-CoV나 SARS-CoV-2가 1940년대에 존재했다는 설정이 아니다.
- 두 시나리오는 후대에 관찰된 밀접 접촉·병원 내 전파·조기 집단감염·무증상 확산·변이·국제 연구 공조를 1940년대 기술과 물류 제약에 맞춘 가상 대체역사 병원체다.
- 화면의 모든 해당 카드에 `대체역사` 표기를 유지한다.

## 게임 모형

새 유행의 다음 주 등장 확률은 전구, 전쟁 압력, 사단 평균 보급, 국가 안정, 캠페인 경과 주차, 유행 압력, 사전 대비와 감시 역량으로 계산한다. 게임 균형을 위해 주간 확률은 0.10%–4.50% 범위로 제한한다.

화면에서는 이 확률을 하나의 불투명한 숫자로만 제시하지 않는다. 각 위험·보호 요인의 기여도를 퍼센트포인트로 분해해 합계를 검증할 수 있게 한다. 유행 중에는 동일한 난수·전황 조건으로 5개 정책의 다음 주 R, 사례, 사망, 병상 부하와 비용을 비교한다. 참모 권고는 확산 속도, 병상 과부하, 병원체 지식, 공공 신뢰와 가용 재정을 함께 판단한다.

발병 뒤에는 다음 값이 서로 연결된다.

- 기초 재생산지수와 현재 정책으로 계산하는 유효 재생산지수(R)
- 주간·누적 추정 사례, 중증 비율, 의료 수용력과 병상 부하
- 의료 과부하, 대응 태세와 병원체별 치명률 모형으로 계산하는 사망
- 감시·연구로 쌓이는 병원체 지식과 치료제·백신 대응책 진척
- 변이 확률, 연속 감소 주차, 집단감염·지역 유행·대유행·회복 단계
- 재정·정치력·인력·안정·전쟁 지지·사단 보급·조직력의 주간 결과

확률과 수치는 현실 예측이나 의학적 지침이 아니라, 사료 기반 대체역사 전략 게임을 위한 추상화다.

## 1차 자료·공식 기관 자료

- [WHO, Preparedness and resilience for emerging threats: Module 1](https://www.who.int/publications/i/item/9789240084674) — 호흡기 병원체 대비, 운영 단계, 촉발 조건, 다부문 협력.
- [WHO, National checklist for respiratory pathogen pandemic preparedness planning](https://www.who.int/publications/i/item/9789240084513) — 국가 대비 역량과 점검 구조.
- [WHO, COVID-19 response timeline](https://www.who.int/news/item/29-06-2020-covidtimeline) — 집단감염 탐지, 국제 비상사태, 감시·임상·감염관리·연구 대응의 전개.
- [WHO, Unity Studies](https://www.who.int/initiatives/respiratory-pathogens-investigations-and-studies-unity-studies) — 전파력, 중증도, 감수성과 개입 효과를 신속히 조사하는 표준 연구.
- [CDC, SARS response (2003)](https://www.cdc.gov/orr/responses/sars.html) — 2003년 SARS의 국제 확산과 봉쇄 기록.
- [CDC, Public health guidance for SARS preparedness and response](https://archive.cdc.gov/www_cdc_gov/sars/guidance/core/executive.html) — 감시, 감염관리, 격리와 검역을 결합한 대응 원칙.
- [WHO, Global surveillance guidelines for SARS](https://www.who.int/publications-detail-redirect/who-guidelines-for-the-global-surveillance-of-severe-acute-respiratory-syndrome-%28-sars%29) — 단계별 감시와 신속 탐지 원칙.

구현은 `src/publicHealth.ts`, 전용 사용자 화면은 `src/PublicHealthCenter.tsx`, 회귀 검증은 `src/publicHealth.test.ts`에 있다.
