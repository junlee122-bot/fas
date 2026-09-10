import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, CornerDownLeft, Search, X } from 'lucide-react';
import { filterCommands } from './navigation';

export interface CommandPaletteItem {
  id: string;
  group: string;
  title: string;
  description: string;
  keywords?: string[];
  icon: React.ReactNode;
  meta?: string;
  active?: boolean;
}

interface CommandPaletteProps {
  items: CommandPaletteItem[];
  onExecute: (id: string) => void;
  onClose: () => void;
}

export function CommandPalette({ items, onExecute, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => filterCommands(items, query), [items, query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const executeSelected = () => {
    const selected = results[selectedIndex];
    if (selected) onExecute(selected.id);
  };

  return (
    <div className="ux-backdrop command-palette-backdrop" onClick={onClose}>
      <section className="command-palette" role="dialog" aria-modal="true" aria-labelledby="command-palette-title" onClick={(event) => event.stopPropagation()}>
        <header>
          <Search size={20} />
          <div><span>QUICK NAVIGATION</span><h2 id="command-palette-title">어디로 이동할까요?</h2></div>
          <button onClick={onClose} aria-label="빠른 이동 닫기"><X size={17} /></button>
        </header>

        <label className="command-palette-search">
          <Search size={17} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                setSelectedIndex((current) => results.length ? (current + 1) % results.length : 0);
              } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setSelectedIndex((current) => results.length ? (current - 1 + results.length) % results.length : 0);
              } else if (event.key === 'Enter') {
                event.preventDefault();
                executeSelected();
              }
            }}
            placeholder="화면, 기능, 전구 검색"
            aria-label="화면과 기능 검색"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded="true"
            aria-controls="command-palette-results"
            aria-activedescendant={results[selectedIndex] ? `command-${results[selectedIndex].id}` : undefined}
          />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="검색어 지우기"><X size={14} /></button>}
        </label>

        <div id="command-palette-results" className="command-palette-results" role="listbox" aria-label="빠른 이동 검색 결과">
          {results.length > 0 ? results.map((item, index) => (
            <button
              id={`command-${item.id}`}
              key={item.id}
              role="option"
              aria-selected={index === selectedIndex}
              className={(index === selectedIndex ? 'selected ' : '') + (item.active ? 'active' : '')}
              onMouseEnter={() => setSelectedIndex(index)}
              onClick={() => onExecute(item.id)}
            >
              <i>{item.icon}</i>
              <span><em>{item.group}</em><strong>{item.title}</strong><small>{item.description}</small></span>
              <b>{item.meta ?? (item.active ? '현재 화면' : '이동')}</b>
            </button>
          )) : (
            <div className="command-palette-empty"><Search size={28} /><strong>일치하는 명령이 없습니다.</strong><span>‘육군’, ‘공장’, ‘아시아’처럼 화면이나 기능을 검색해 보십시오.</span></div>
          )}
        </div>

        <footer>
          <span><kbd><ArrowUp size={12} /><ArrowDown size={12} /></kbd> 선택</span>
          <span><kbd><CornerDownLeft size={12} /></kbd> 이동</span>
          <span><kbd>Esc</kbd> 닫기</span>
        </footer>
      </section>
    </div>
  );
}
