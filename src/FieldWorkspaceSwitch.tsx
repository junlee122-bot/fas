import './FieldWorkspaceSwitch.css';

export function FieldWorkspaceSwitch<T extends string>({ label, value, items, onChange }: {
  label: string;
  value: T;
  items: ReadonlyArray<{ id: T; label: string; detail: string }>;
  onChange: (value: T) => void;
}) {
  return <div className="field-workspace-switch" role="group" aria-label={label}>
    {items.map((item) => <button type="button" key={item.id} aria-pressed={value === item.id} onClick={() => onChange(item.id)}>
      <strong>{item.label}</strong><span>{item.detail}</span>
    </button>)}
  </div>;
}
