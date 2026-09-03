'use client';

import React, { useState } from 'react';
import { PEAK_RANGES, useApi } from '../../config/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

export function PeakHoursChart() {
  const [view, setView] = useState<'hoy' | 'semana'>('hoy');
  const { data: metrics } = useApi<any>('/dashboard/metrics');

  const PEAK_DATA = metrics?.peakData || { hoy: Array(24).fill(0), semana: Array(24).fill(0) };

  // Agrupar en la zona horaria real del navegador del usuario si vienen los eventos
  const clientHoyArr = React.useMemo(() => {
    if (metrics?.peakData?.todayEvents && Array.isArray(metrics.peakData.todayEvents)) {
      const arr = Array(24).fill(0);
      const todayDateStr = new Date().toDateString();
      metrics.peakData.todayEvents.forEach((ts: string) => {
        const d = new Date(ts);
        if (d.toDateString() === todayDateStr) {
          const hour = d.getHours();
          if (hour >= 0 && hour < 24) arr[hour]++;
        }
      });
      return arr;
    }
    return PEAK_DATA.hoy && PEAK_DATA.hoy.length === 24 ? PEAK_DATA.hoy : Array(24).fill(0);
  }, [metrics?.peakData?.todayEvents, PEAK_DATA.hoy]);

  const clientSemanaArr = React.useMemo(() => {
    if (metrics?.peakData?.weekEvents && Array.isArray(metrics.peakData.weekEvents)) {
      const arr = Array(24).fill(0);
      metrics.peakData.weekEvents.forEach((ts: string) => {
        const d = new Date(ts);
        const hour = d.getHours();
        if (hour >= 0 && hour < 24) arr[hour]++;
      });
      return arr.map((val) => Math.round((val / 7) * 10) / 10);
    }
    return PEAK_DATA.semana && PEAK_DATA.semana.length === 24 ? PEAK_DATA.semana : Array(24).fill(0);
  }, [metrics?.peakData?.weekEvents, PEAK_DATA.semana]);

  const data = view === 'hoy' ? clientHoyArr : clientSemanaArr;
  const maxVal = Math.max(...data, 0);
  const suggestedMax = Math.max(10, Math.ceil(maxVal * 1.25));

  const labels = Array.from({ length: 24 }, (_, i) => `${i}h`);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Artículos',
        data,
        borderColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return '#a3e635';
          const gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
          gradient.addColorStop(0, '#22d3ee');
          gradient.addColorStop(0.5, '#a3e635');
          gradient.addColorStop(1, '#22d3ee');
          return gradient;
        },
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(163,230,53,0.1)';
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(163,230,53,0.28)');
          gradient.addColorStop(1, 'rgba(163,230,53,0.02)');
          return gradient;
        },
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#a3e635',
        pointBorderColor: 'rgba(11,16,26,0.8)',
        pointBorderWidth: 1.5,
        pointRadius: (context: any) => {
          const index = context.dataIndex;
          const inPeak = PEAK_RANGES.some((r) => index >= r.start && index <= r.end);
          if (data[index] > 0) return inPeak ? 5 : 4;
          return 0;
        },
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax,
        ticks: {
          precision: 0,
          color: 'rgba(240,253,244,0.28)',
          font: { family: 'var(--font-mono)', size: 10 },
          callback: function (val: any) {
            return `${val}`;
          },
        },
        grid: {
          color: 'rgba(240,253,244,0.05)',
        },
        border: { display: false },
      },
      x: {
        ticks: {
          color: 'rgba(240,253,244,0.3)',
          font: { family: 'var(--font-mono)', size: 10 },
          autoSkip: false,
          maxRotation: 0,
          callback: function (value: any, index: number) {
            if ([0, 3, 6, 9, 12, 15, 18, 21, 23].includes(index)) {
              return `${index}h`;
            }
            return null;
          },
        },
        grid: {
          display: false,
        },
        border: {
          color: 'rgba(240,253,244,0.07)',
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(11,16,26,0.9)',
        titleColor: '#f0fdf4',
        bodyColor: '#a3e635',
        borderColor: 'rgba(163,230,53,0.2)',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          title: (items: any) => `Hora: ${items[0].label}`,
          label: (item: any) => {
            const val = item.raw || 0;
            const plural = val === 1 ? 'artículo' : 'artículos';
            if (view === 'hoy') {
              return ` ${val} ${plural}`;
            }
            return ` ${val} ${plural}/día promedio`;
          },
        },
      },
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#f0fdf4' }}>Horas pico de uso</span>
          <span style={{ marginLeft: 10, fontSize: 10, color: 'rgba(240,253,244,0.35)', fontFamily: 'var(--font-mono)' }}>
            artículos por hora · red completa
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            borderRadius: 8,
            overflow: 'hidden',
            border: '1px solid rgba(99,231,182,0.14)',
            background: 'rgba(240,253,244,0.03)',
          }}
        >
          {(['hoy', 'semana'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setView(m)}
              style={{
                padding: '5px 14px',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                fontSize: 11,
                fontWeight: 600,
                background: view === m ? 'rgba(163,230,53,0.15)' : 'transparent',
                color: view === m ? '#a3e635' : 'rgba(240,253,244,0.4)',
                transition: 'all 0.18s',
                boxShadow: view === m ? 'inset 0 0 0 1px rgba(163,230,53,0.25)' : 'none',
              }}
            >
              {m === 'hoy' ? 'Hoy' : 'Prom. semanal'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', height: 180, position: 'relative' }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
