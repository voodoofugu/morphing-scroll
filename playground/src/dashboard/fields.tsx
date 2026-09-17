import React from "react";

/** заголовок раздела: demo, scroll, layout — дальше идут плашки пропсов */
export function Section({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="section">
      <h2 className="section-title">{title}</h2>
      <div className="section-body">{children}</div>
    </section>
  );
}

/**
 * Один проп — одна плашка: слева имя, справа его значение. Параметры внутри
 * открываются по имени, и открываются сами, когда проп только что включили —
 * его затем и включают, чтобы настроить.
 */
export function PropCard({
  active = false,
  children,
  control,
  defaultOpen = false,
  enabled = true,
  name,
  note,
}: {
  /** в проп передали не то, что стоит по умолчанию — видно, чем правили */
  active?: boolean;
  children?: React.ReactNode;
  control?: React.ReactNode;
  defaultOpen?: boolean;
  /** выключенный проп своих параметров не показывает */
  enabled?: boolean;
  name: string;
  note?: string;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const canOpen = enabled && !!children;

  const wasEnabled = React.useRef(enabled);
  React.useEffect(() => {
    if (enabled && !wasEnabled.current) setOpen(true);
    wasEnabled.current = enabled;
  }, [enabled]);

  return (
    <div
      className={`prop-card${enabled ? "" : " is-off"}${
        canOpen && open ? " is-open" : ""
      }${active ? " is-active" : ""}`}
    >
      <div className="prop-head">
        <button
          aria-expanded={canOpen && open}
          className={`prop-name${canOpen ? " can-open" : ""}`}
          disabled={!canOpen}
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          {name}
        </button>
        {control ? <div className="prop-control">{control}</div> : null}
      </div>
      {note ? <p className="sub-note prop-note">{note}</p> : null}
      {canOpen && open ? <div className="prop-body">{children}</div> : null}
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
        onChange={(event) => {
          /*
           * «05» — это ноль, к которому дописали пятёрку. React не перепишет
           * поле сам: для числового input он сравнивает значения нестрого, а
           * «05» и 5 для него равны. Убираем ведущие нули на месте.
           */
          const text = event.target.value.replace(/^0+(?=\d)/, "");
          if (text !== event.target.value) event.target.value = text;

          onChange(text === "" ? 0 : Number(text));
        }}
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
