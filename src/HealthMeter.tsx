interface HealthMeterProps {
  label: string;
  value: number;
  detail: string;
  tone?: 'blue' | 'green' | 'amber' | 'red';
}

export function HealthMeter({ label, value, detail, tone = 'blue' }: HealthMeterProps) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={`health-meter tone-${tone}`} role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={safeValue}>
      <div><span>{label}</span><strong>{safeValue}</strong></div>
      <div className="health-meter-track"><span style={{ width: `${safeValue}%` }} /></div>
      <small>{detail}</small>
    </div>
  );
}
