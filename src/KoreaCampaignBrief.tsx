import { ArrowRight, Building2, MapPinned, RadioTower, Shield } from 'lucide-react';
import { getKoreaRoleGuide } from './koreaExperience';
import type { CareerRole } from './types';

interface KoreaCampaignBriefProps {
  role: CareerRole;
}

export function KoreaCampaignBrief({ role }: KoreaCampaignBriefProps) {
  const guide = getKoreaRoleGuide(role.branch);

  return (
    <section className="korea-setup-brief" aria-labelledby="korea-setup-title">
      <header>
        <span>1942 · CHONGQING TO KOREA</span>
        <h2 id="korea-setup-title">충칭에서 시작해 조선으로 돌아갑니다</h2>
        <p>플레이 본부와 해방할 본토가 서로 다릅니다. 아래 네 공간을 구분하면 첫 행동을 바로 결정할 수 있습니다.</p>
      </header>
      <div className="korea-setup-geography">
        <div><Building2 size={15} /><span><small>플레이 본부</small><strong>충칭 · 대한민국 임시정부</strong></span></div>
        <div><MapPinned size={15} /><span><small>점령 본토</small><strong>일제강점기 조선</strong></span></div>
        <div><Shield size={15} /><span><small>무장 조직</small><strong>한국광복군</strong></span></div>
        <div><RadioTower size={15} /><span><small>비밀 전선</small><strong>만주·한반도 연락망</strong></span></div>
      </div>
      <div className="korea-role-mission">
        <span><small>선택 보직의 핵심 임무</small><strong>{guide.mission}</strong><em>{guide.firstAction}</em></span>
        <span><small>권한 밖의 업무</small><strong>{guide.authorityBoundary}</strong><em>{role.expectation}</em></span>
      </div>
      <footer><ArrowRight size={13} /><span>취임 뒤 상황실에는 국제 승인·국내 연락망·광복군·국내정진의 네 준비도가 별도로 표시됩니다.</span></footer>
    </section>
  );
}
