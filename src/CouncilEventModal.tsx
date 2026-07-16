import { AlertTriangle, ChevronRight, Landmark } from 'lucide-react';
import type { CouncilEvent } from './types';

export function CouncilEventModal({ event, onChoose }: { event: CouncilEvent; onChoose: (choiceId: string) => void }) {
  return (
    <div className="modal-backdrop council-backdrop" role="dialog" aria-modal="true" aria-labelledby="council-title">
      <section className="council-modal">
        <header>
          <div className="council-seal"><Landmark size={24} /></div>
          <div><span>긴급 국가 의제 · {event.category}</span><h2 id="council-title">{event.title}</h2></div>
          <em><AlertTriangle size={14} /> 시간 정지</em>
        </header>
        <div className="council-briefing">
          <span>상황 보고</span>
          <p>{event.briefing}</p>
          <strong>{event.stakes}</strong>
        </div>
        <div className="council-choices">
          {event.choices.map((choice, index) => (
            <button key={choice.id} onClick={() => onChoose(choice.id)}>
              <i>{String(index + 1).padStart(2, '0')}</i>
              <span><strong>{choice.title}</strong><small>{choice.description}</small><em>예상 결과 · {choice.result}</em></span>
              <ChevronRight size={18} />
            </button>
          ))}
        </div>
        <footer>결정은 즉시 시행되며 전선·생산·외교·당신의 커리어에 영구적인 결과를 남깁니다.</footer>
      </section>
    </div>
  );
}
