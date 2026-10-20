import type { ComponentChildren } from 'preact';
import { useFamily } from '../context';
import { DeviceConnection } from './DeviceConnection';
import { Icon, type IconName } from './Icon';
export function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ComponentChildren;
}) {
  return (
    <div className="page-title">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function Empty({
  icon = 'heart',
  title,
  children,
}: {
  icon?: IconName;
  title: string;
  children: ComponentChildren;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon name={icon} size={30} />
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function AuthGate({ children }: { children: ComponentChildren }) {
  const { user } = useFamily();
  return user ? <>{children}</> : <DeviceConnection />;
}
export function Tabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (s: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="segmented" role="tablist">
      {options.map((x) => (
        <button
          key={x.value}
          role="tab"
          aria-selected={value === x.value}
          className={value === x.value ? 'selected' : ''}
          onClick={() => onChange(x.value)}
        >
          {x.label}
        </button>
      ))}
    </div>
  );
}
export function Confirm({
  title,
  onConfirm,
  onCancel,
}: {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="confirm">
      <p>{title}</p>
      <div className="row">
        <button className="button danger" onClick={onConfirm}>
          Xóa
        </button>
        <button className="button secondary" onClick={onCancel}>
          Giữ lại
        </button>
      </div>
    </div>
  );
}
