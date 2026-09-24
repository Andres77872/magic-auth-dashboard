import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TabNavigation, type Tab } from '../TabNavigation';

const TABS: Tab[] = [
  { id: 'one', label: 'One' },
  { id: 'two', label: 'Two', count: 3 },
  { id: 'three', label: 'Three', disabled: true },
  { id: 'four', label: 'Four' },
];

function Harness({ initial = 'one' }: { initial?: string }): React.JSX.Element {
  const [active, setActive] = useState(initial);
  return (
    <TabNavigation
      tabs={TABS}
      activeTab={active}
      onChange={setActive}
      ariaLabel="Sections"
    />
  );
}

describe('TabNavigation', () => {
  it('exposes a labelled tablist with one tab stop', () => {
    render(<Harness />);
    expect(
      screen.getByRole('tablist', { name: 'Sections' })
    ).toBeInTheDocument();
    const focusable = screen
      .getAllByRole('tab')
      .filter((tab) => tab.tabIndex === 0);
    expect(focusable).toHaveLength(1);
    expect(focusable[0]).toHaveTextContent('One');
  });

  it('moves with arrow keys, skipping disabled tabs and wrapping around', () => {
    render(<Harness initial="two" />);
    const two = screen.getByRole('tab', { name: /Two/ });
    two.focus();
    fireEvent.keyDown(two, { key: 'ArrowRight' });
    const four = screen.getByRole('tab', { name: 'Four' });
    expect(four).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(four);

    fireEvent.keyDown(four, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('supports Home and End', () => {
    render(<Harness initial="two" />);
    const two = screen.getByRole('tab', { name: /Two/ });
    fireEvent.keyDown(two, { key: 'End' });
    expect(screen.getByRole('tab', { name: 'Four' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Four' }), {
      key: 'Home',
    });
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('keeps a tab reachable when the active id is unknown', () => {
    render(
      <TabNavigation
        tabs={TABS}
        activeTab="missing"
        onChange={() => undefined}
      />
    );
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute(
      'tabindex',
      '0'
    );
  });

  it('shows counts next to labels', () => {
    render(<Harness />);
    expect(screen.getByRole('tab', { name: /Two/ })).toHaveTextContent('3');
  });
});
