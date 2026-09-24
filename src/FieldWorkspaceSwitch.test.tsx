import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { FieldWorkspaceSwitch } from './FieldWorkspaceSwitch';

describe('field workspace navigation', () => {
  it('announces the selected workspace without inventing tab panels or running a game action', () => {
    const onChange = vi.fn();
    const html = renderToStaticMarkup(<FieldWorkspaceSwitch label="군사 작업대" value="operations" items={[{ id: 'operations', label: '작전 현장', detail: '실제 결산' }, { id: 'forces', label: '편제', detail: '인사와 준비' }]} onChange={onChange} />);
    expect(html).toContain('role="group"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('aria-pressed="false"');
    expect(html).not.toContain('role="tab"');
    expect(onChange).not.toHaveBeenCalled();
  });
});
