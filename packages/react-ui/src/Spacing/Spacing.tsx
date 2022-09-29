import React from 'react';
import { baseConfig } from '../Theme/base.config';

const Spacing = () => {
  return (
    <table style={{ tableLayout: 'fixed', borderCollapse: 'collapse', fontFamily: "Segoe UI" }}>
      <thead style={{ borderBottom: '1px solid rgba(148,163,184,.2)' }}>
        <tr>
          <th style={{ padding: '8px' }}>Name</th>
          <th style={{ padding: '8px' }}>Size</th>
          <th style={{ padding: '8px', opacity: '0' }}>Preview</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(baseConfig.theme.space).map(([name, size]) => (
          <tr key={name} style={{ borderBottom: '1px solid rgba(148,163,184,.1)' }}>
            <td style={{ padding: '8px' }}>{name}</td>
            <td style={{ padding: '8px' }}>{size}</td>
            <td style={{ padding: '8px' }}>
              <div style={{ width: size, height: '8px', backgroundColor: 'gray' }}></div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Spacing;
