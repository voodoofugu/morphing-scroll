import React from "react";

export function ControlGroup({
  children,
  defaultOpen = false,
  hint,
  title,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
  hint?: string;
  title: string;
}) {
  return (
    <details className="control-group" open={defaultOpen}>
      <summary>
        <span className="group-title">{title}</span>
        {hint ? <span className="group-hint">{hint}</span> : null}
      </summary>
      <div className="control-group-body">{children}</div>
    </details>
  );
}

/**
 * Вложенный параметр: настройки живут под своим ключом и появляются только
 * когда родитель включён — иначе панель предлагает крутить то, что сейчас
 * ни на что не влияет.
 */
export function SubGroup({
  children,
  control,
  label,
  enabled = true,
}: {
  children?: React.ReactNode;
  control?: React.ReactNode;
  label: string;
  /** выключенная настройка своих подпараметров не показывает */
  enabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const canOpen = enabled && !!children;

  // включили настройку — значит собираются её настраивать
  const wasEnabled = React.useRef(enabled);
  React.useEffect(() => {
    if (enabled && !wasEnabled.current) setOpen(true);
    wasEnabled.current = enabled;
  }, [enabled]);

  return (
    <div
      className={`sub-group${enabled ? "" : " is-off"}${
        canOpen && open ? " is-open" : ""
      }`}
    >
      <div className="sub-group-head">
        <button
          aria-expanded={canOpen && open}
          className="sub-group-toggle"
          disabled={!canOpen}
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          <span className="sub-group-label">{label}</span>
        </button>
        {control}
      </div>
      {canOpen && open ? (
        <div className="sub-group-body">{children}</div>
      ) : null}
    </div>
  );
}

export function Field({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function NumberField({
  label,
  max = 2000,
  min = 0,
  onChange,
  step = 1,
  value,
}: {
  label: string;
  max?: number;
  min?: number;
  onChange: (value: number) => void;
  step?: number;
  value: number;
}) {
  return (
    <Field label={label}>
      <input
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="number"
        value={value}
      />
    </Field>
  );
}

export function TextField({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <Field label={label}>
      <input
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="text"
        value={value}
      />
    </Field>
  );
}

export function ToggleField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: boolean) => void;
  value: boolean;
}) {
  return (
    <label className="toggle-field">
      <input
        checked={value}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span>{label}</span>
    </label>
  );
}

export function SelectField<T extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: T) => void;
  options: readonly T[];
  value: T;
}) {
  return (
    <Field label={label}>
      <select
        onChange={(event) => onChange(event.target.value as T)}
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function SegmentedField<T extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: T) => void;
  options: readonly T[];
  value: T;
}) {
  return (
    <div className="segmented-field">
      <span>{label}</span>
      <div className="segmented-control">
        {options.map((option) => (
          <button
            aria-pressed={option === value}
            key={option}
            onClick={() => onChange(option)}
            type="button"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
