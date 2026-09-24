import { useMemo, useState, type JSX } from 'react';
import { Button } from '@/components/ui/button';
import {
  parseChartSpec,
  formatChartValue,
  chartProvenance,
  type ChartSpec,
} from '@/utils/assistant/chart-spec';
import { ArtifactFallback, ArtifactPending, ArtifactShell } from './artifact';

const COLORS = [
  'var(--color-primary)',
  'var(--color-success)',
  'var(--violet-500)',
  'var(--color-warning)',
  'var(--teal-500)',
  'var(--color-destructive)',
  'var(--azure-300)',
  'var(--ink-400)',
];
function color(index: number): string {
  return COLORS[index % COLORS.length];
}
function DataTable({ spec }: { spec: ChartSpec }): JSX.Element {
  return (
    <table className="w-full text-left text-xs">
      <caption className="sr-only">{spec.title ?? 'Chart data'}</caption>
      <thead>
        <tr>
          <th scope="col">Label</th>
          {spec.series.map((series, index) => (
            <th scope="col" key={index} className="p-2">
              {series.name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {spec.labels.map((label, index) => (
          <tr className="border-t border-border" key={index}>
            <th scope="row" className="py-2 font-normal">
              {label}
            </th>
            {spec.series.map((series, seriesIndex) => (
              <td className="p-2 tabular-nums" key={seriesIndex}>
                {formatChartValue(series.values[index], spec.unit)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
function ChartDrawing({ spec }: { spec: ChartSpec }): JSX.Element {
  const values = spec.series.flatMap((series) =>
    series.values.filter((value): value is number => value !== null)
  );
  const minimum = Math.min(0, ...values);
  const maximum = Math.max(1, ...values);
  const y = (value: number): number =>
    230 - ((value - minimum) / (maximum - minimum)) * 200;
  const x = (index: number): number =>
    50 + ((index + 0.5) * 520) / spec.labels.length;
  if (spec.kind === 'donut') {
    const series = spec.series[0];
    const total = series.values.reduce<number>(
      (sum, value) => sum + (value ?? 0),
      0
    );
    const segments = series.values.map((value, index) => ({
      value: value ?? 0,
      index,
      offset: series.values
        .slice(0, index)
        .reduce<number>((sum, previous) => sum + (previous ?? 0), 0),
    }));
    return (
      <div className="flex flex-wrap items-center justify-center gap-4">
        <svg
          viewBox="0 0 200 200"
          className="w-40"
          role="img"
          aria-label={spec.title ?? 'Donut chart'}
        >
          <circle
            cx="100"
            cy="100"
            r="65"
            fill="none"
            stroke="var(--color-muted)"
            strokeWidth="30"
          />
          {segments.map(({ value, index, offset }) => (
            <circle
              key={index}
              cx="100"
              cy="100"
              r="65"
              fill="none"
              stroke={color(index)}
              strokeWidth="30"
              pathLength="100"
              strokeDasharray={`${total ? (value / total) * 100 : 0} 100`}
              strokeDashoffset={total ? (-offset / total) * 100 : 0}
              transform="rotate(-90 100 100)"
            >
              <title>
                {spec.labels[index]}: {formatChartValue(value, spec.unit)}
              </title>
            </circle>
          ))}
        </svg>
        <ul className="space-y-2 text-xs">
          {spec.labels.map((label, index) => (
            <li className="flex items-center gap-2" key={index}>
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: color(index) }}
              />
              {label}: {formatChartValue(series.values[index], spec.unit)}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (spec.kind === 'heatmap')
    return (
      <div className="overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th scope="col">Series</th>
              {spec.labels.map((label, index) => (
                <th scope="col" className="p-2" key={index}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {spec.series.map((series, index) => (
              <tr key={index}>
                <th scope="row">{series.name}</th>
                {series.values.map((value, point) => (
                  <td
                    className="border border-card p-2 text-center"
                    key={point}
                    style={{
                      background:
                        value === null
                          ? 'var(--color-muted)'
                          : `color-mix(in srgb, var(--color-primary) ${15 + ((value - minimum) / (maximum - minimum)) * 55}%, var(--color-card))`,
                    }}
                  >
                    {formatChartValue(value, spec.unit)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  if (spec.kind === 'bar')
    return (
      <div className="space-y-3">
        {spec.labels.map((label, index) => (
          <div className="text-xs" key={index}>
            <div className="mb-1 truncate">{label}</div>
            <div className="space-y-1">
              {spec.series.map((series, seriesIndex) => {
                const value = series.values[index];
                return (
                  <div
                    key={seriesIndex}
                    className="grid grid-cols-[1fr_auto] items-center gap-2"
                  >
                    <div className="relative h-3 rounded bg-muted">
                      <span
                        className="absolute h-3 rounded"
                        style={{
                          background: color(seriesIndex),
                          left: `${((Math.min(value ?? 0, 0) - minimum) / (maximum - minimum)) * 100}%`,
                          width: `${(Math.abs(value ?? 0) / (maximum - minimum)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="min-w-12 text-right tabular-nums">
                      {formatChartValue(value, spec.unit)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  return (
    <svg
      role="img"
      aria-label={spec.title ?? `${spec.kind} chart`}
      viewBox="0 0 600 280"
      className="min-w-80 w-full"
    >
      <line x1="50" x2="575" y1={y(0)} y2={y(0)} stroke="var(--color-border)" />
      <text x="45" y="35" textAnchor="end" fill="currentColor" fontSize="10">
        {formatChartValue(maximum, spec.unit)}
      </text>
      <text x="45" y="235" textAnchor="end" fill="currentColor" fontSize="10">
        {formatChartValue(minimum, spec.unit)}
      </text>
      {spec.series.map((series, seriesIndex) => {
        if (spec.kind === 'column') {
          const width = Math.max(
            1,
            480 / spec.labels.length / spec.series.length
          );
          return (
            <g key={seriesIndex}>
              {series.values.map((value, index) =>
                value === null ? null : (
                  <rect
                    key={index}
                    x={
                      x(index) -
                      (width * spec.series.length) / 2 +
                      width * seriesIndex
                    }
                    y={Math.min(y(0), y(value))}
                    width={width - 1}
                    height={Math.max(1, Math.abs(y(value) - y(0)))}
                    fill={color(seriesIndex)}
                  >
                    <title>
                      {spec.labels[index]} · {series.name}:{' '}
                      {formatChartValue(value, spec.unit)}
                    </title>
                  </rect>
                )
              )}
            </g>
          );
        }
        const segments: { index: number; value: number }[][] = [];
        series.values.forEach((value, index) => {
          if (value === null) {
            segments.push([]);
            return;
          }
          if (!segments.length) segments.push([]);
          segments[segments.length - 1].push({ index, value });
        });
        return (
          <g key={seriesIndex}>
            {segments
              .filter((segment) => segment.length)
              .map((segment, index) => (
                <g key={index}>
                  {spec.kind === 'area' && (
                    <polygon
                      points={`${x(segment[0].index)},${y(0)} ${segment.map((point) => `${x(point.index)},${y(point.value)}`).join(' ')} ${x(segment[segment.length - 1].index)},${y(0)}`}
                      fill={color(seriesIndex)}
                      fillOpacity="0.12"
                    />
                  )}
                  <polyline
                    points={segment
                      .map((point) => `${x(point.index)},${y(point.value)}`)
                      .join(' ')}
                    fill="none"
                    stroke={color(seriesIndex)}
                    strokeWidth="2"
                  />
                </g>
              ))}
            {series.values.map((value, index) =>
              value === null ? null : (
                <circle
                  key={index}
                  cx={x(index)}
                  cy={y(value)}
                  r="3"
                  fill={color(seriesIndex)}
                >
                  <title>
                    {spec.labels[index]} · {series.name}:{' '}
                    {formatChartValue(value, spec.unit)}
                  </title>
                </circle>
              )
            )}
          </g>
        );
      })}
      {spec.labels.map(
        (label, index) =>
          index % Math.max(1, Math.ceil(spec.labels.length / 8)) === 0 && (
            <text
              key={index}
              x={x(index)}
              y="256"
              textAnchor="middle"
              fill="currentColor"
              fontSize="10"
            >
              {label.length > 12 ? `${label.slice(0, 11)}…` : label}
            </text>
          )
      )}
    </svg>
  );
}
export function ChartFigure({
  spec,
  source,
  kind = 'Chart',
}: {
  spec: ChartSpec;
  source: string;
  kind?: string;
}): JSX.Element {
  const [table, setTable] = useState(false);
  const notes = [
    spec.note,
    spec.hasUnknown ? 'Unknown values are shown as gaps, not zero.' : null,
    spec.stacked ? 'Series are shown separately for comparison.' : null,
  ].filter((note): note is string => !!note);
  return (
    <ArtifactShell
      kind={kind}
      title={spec.title}
      meta={chartProvenance(spec)}
      source={source}
      footnotes={notes}
      actions={
        <Button
          size="xs"
          variant="ghost"
          onClick={() => setTable(!table)}
          aria-pressed={table}
        >
          {table ? 'Chart' : 'Data table'}
        </Button>
      }
    >
      {table ? <DataTable spec={spec} /> : <ChartDrawing spec={spec} />}
      {!table && spec.kind !== 'donut' && (
        <div className="mt-2 flex flex-wrap gap-3 text-xs">
          {spec.series.map((series, index) => (
            <span className="flex items-center gap-1" key={index}>
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: color(index) }}
              />
              {series.name}
            </span>
          ))}
        </div>
      )}
    </ArtifactShell>
  );
}
export function ChartArtifact({
  source,
  info,
  closed,
}: {
  source: string;
  info: string | null;
  closed: boolean;
}): JSX.Element {
  const parsed = useMemo(
    () => (closed ? parseChartSpec(source, info) : null),
    [source, info, closed]
  );
  if (!parsed) return <ArtifactPending label="Chart" />;
  if (!parsed.ok)
    return (
      <ArtifactFallback
        kind="Chart"
        source={source}
        lang={info ?? 'chart'}
        error={parsed.error}
        hint={parsed.hint}
      />
    );
  return <ChartFigure spec={parsed.spec} source={source} />;
}
