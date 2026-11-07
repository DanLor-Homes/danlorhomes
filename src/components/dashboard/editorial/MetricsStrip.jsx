import React from 'react';

export default function MetricsStrip({ items }) {
  return (
    <div className="ed-strip ed-sec ed-d1">
      {items.map((item) => (
        <div key={item.label} className="ed-m">
          <p className="ed-sc">{item.label}</p>
          <p className="ed-v">{item.value}</p>
          <p className="ed-h">{item.hint}</p>
        </div>
      ))}
    </div>
  );
}