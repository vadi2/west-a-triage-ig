import type { ReactNode } from 'react';

/** A row of sample-data buttons for a presenter: secondary to the form, and marked as invented. */
export function Samples({ children, label = 'Sample data' }: { children: ReactNode; label?: string }) {
  return (
    <div className="samples" role="group" aria-label={`${label} (synthetic)`}>
      <span className="samples-label" aria-hidden="true">
        {label}
      </span>
      {children}
    </div>
  );
}
