import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Recycle, BarChart3, MapPin, Award, Activity } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const classificationData = {
  labels: ['Plástico', 'Vidrio', 'Cartón / Papel', 'Metal', 'Orgánico'],
  datasets: [
    {
      label: 'Materiales Reciclados (kg)',
      data: [320, 190, 450, 120, 280],
      backgroundColor: [
        '#10b981',
        '#06b6d4',
        '#3b82f6',
        '#f59e0b',
        '#8b5cf6',
      ],
      borderRadius: 8,
    },
  ],
};

const zoneData = {
  labels: ['Zona Norte', 'Zona Centro', 'Zona Sur', 'Campus Principal'],
  datasets: [
    {
      data: [40, 25, 20, 15],
      backgroundColor: ['#10b981', '#06b6d4', '#3b82f6', '#8b5cf6'],
      borderWidth: 0,
    },
  ],
};

export default function App() {
  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="logo-container">
          <Recycle size={28} />
          <span>Reciclaje AI</span>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#10b981', fontWeight: 600 }}>
            <BarChart3 size={20} /> Dashboard
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#94a3b8' }}>
            <MapPin size={20} /> Zonas
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#94a3b8' }}>
            <Award size={20} /> Recompensas
          </div>
        </nav>
      </aside>

      <main className="main-content">
        <header style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Panel de Monitoreo y Métricas</h1>
          <p style={{ color: '#94a3b8', marginTop: '0.25rem' }}>
            Visualización en tiempo real del sistema de clasificación y tokens distribuidos
          </p>
        </header>

        <div className="metrics-grid">
          <div className="metric-card">
            <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Total Reciclado</span>
            <h2 style={{ fontSize: '1.75rem', margin: '0.5rem 0', color: '#10b981' }}>1,360 kg</h2>
            <span style={{ color: '#10b981', fontSize: '0.875rem' }}>+12% esta semana</span>
          </div>
          <div className="metric-card">
            <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Confianza Promedio IA</span>
            <h2 style={{ fontSize: '1.75rem', margin: '0.5rem 0', color: '#06b6d4' }}>96.4%</h2>
            <span style={{ color: '#06b6d4', fontSize: '0.875rem' }}>Modelo Visión v2</span>
          </div>
          <div className="metric-card">
            <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>QRs Canjeados</span>
            <h2 style={{ fontSize: '1.75rem', margin: '0.5rem 0', color: '#3b82f6' }}>482</h2>
            <span style={{ color: '#3b82f6', fontSize: '0.875rem' }}>Tokens ERC-20 Emitidos</span>
          </div>
          <div className="metric-card">
            <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Eventos Procesados</span>
            <h2 style={{ fontSize: '1.75rem', margin: '0.5rem 0', color: '#8b5cf6' }}>2,410</h2>
            <span style={{ color: '#8b5cf6', fontSize: '0.875rem' }}>
              <Activity size={14} style={{ display: 'inline', marginRight: 4 }} /> En vivo
            </span>
          </div>
        </div>

        <div className="charts-grid">
          <div className="chart-card">
            <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Clasificación por Tipo de Material</h3>
            <Bar data={classificationData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </div>
          <div className="chart-card">
            <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Distribución por Zonas</h3>
            <div style={{ maxWidth: '280px', margin: '0 auto' }}>
              <Doughnut data={zoneData} options={{ responsive: true }} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
