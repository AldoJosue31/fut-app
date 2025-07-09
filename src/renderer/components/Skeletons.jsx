// src/renderer/components/Skeletons.jsx
import React from 'react';

export function TeamsTableSkeleton({ rows = 7 }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, i) => (
        <tr
          key={i}
          className="skeleton-row"
          style={{ '--index': i }}
        >
          <td><div className="skeleton skeleton-text short" /></td>
          <td><div className="skeleton skeleton-text medium" /></td>
          <td><div className="skeleton skeleton-text long" /></td>
          <td><div className="skeleton skeleton-button" /></td>
        </tr>
      ))}
    </tbody>
  );
}
