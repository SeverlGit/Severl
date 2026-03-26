"use client";

import React, { useRef, useEffect, useState } from "react";

type Props = {
  data: number[];
  color: string;
  width?: number;
  height?: number;
};

export function Sparkline({ data, color, width = 60, height = 24 }: Props) {
  const ref = useRef<SVGPolylineElement>(null);
  const [len, setLen] = useState(0);

  useEffect(() => {
    if (ref.current) setLen(ref.current.getTotalLength());
  }, [data]);

  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <polyline
        ref={ref}
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={len > 0 ? {
          strokeDasharray: len,
          strokeDashoffset: len,
          animation: "drawLine 0.8s ease-out 0.5s forwards",
        } : undefined}
      />
    </svg>
  );
}
