import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import SideBar from '../../../components/SideBar';
import { Button } from 'primereact/button';
import { Chart } from 'primereact/chart';
import { Dropdown } from 'primereact/dropdown';
import { StatsCard, ErrorCard } from '../../../components/StatsCard';
import { QuestionChart } from '../../../components/QuestionChart';
import { statisticsAPI } from '../../../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [visible, setVisible] = useState(true);
  
  // State for filters
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [programs, setPrograms] = useState([]);
  
  // State for data
  const [kpis, setKpis] = useState(null);
  const [genderData, setGenderData] = useState(null);
  const [satisfactionData, setSatisfactionData] = useState(null);
  const [responsesPerProgram, setResponsesPerProgram] = useState(null);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch available programs
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const data = await statisticsAPI.getPrograms();
        setPrograms(data.programs.map(p => ({ label: p, value: p })));
      } catch (err) {
        console.error('Error fetching programs:', err);
      }
    };
    fetchPrograms();
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);

      try {
        const filters = {
          programa: selectedProgram,
          version: selectedVersion
        };

        // Fetch all data in parallel
        const [kpisData, genderAnalysis, satisfaction, responsesData] = await Promise.all([
          statisticsAPI.getKPIs(filters),
          statisticsAPI.analyzeQuestion('egresados', 'ipg01_3_sexo', filters),
          statisticsAPI.getSatisfactionAnalysis('egresados', filters).catch(() => null), // Optional
          statisticsAPI.getResponsesPerProgram('egresados', { version: selectedVersion })
        ]);

        setKpis(kpisData);
        setGenderData(genderAnalysis);
        setSatisfactionData(satisfaction);
        setResponsesPerProgram(responsesData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedProgram, selectedVersion]);

  // Handle retry
  const handleRetry = () => {
    setError(null);
    setLoading(true);
    // Trigger re-fetch
    window.location.reload();
  };

  // Chart for responses per program
  const programChartData = responsesPerProgram ? {
    labels: responsesPerProgram.data.map(item => item.programa),
    datasets: [{
      label: 'Responses',
      data: responsesPerProgram.data.map(item => item.count),
      backgroundColor: '#42A5F5',
      borderColor: '#1E88E5',
      borderWidth: 1
    }]
  } : null;

  const programChartOptions = {
    maintainAspectRatio: false,
    aspectRatio: 0.8,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  return (
    <div className="dashboard-container">
      <Button 
        onClick={() => setVisible(true)} 
        icon="pi pi-bars" 
        className="sidebar-toggle" 
      />
      <SideBar visible={visible} onHide={() => setVisible(false)} />
      
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2>Dashboard - PAAA Statistics</h2>
          <p>Real-time survey analytics and insights</p>
        </div>

        {/* Filters */}
        <div className="dashboard-filters" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Program</label>
            <Dropdown
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.value)}
              options={programs}
              placeholder="All Programs"
              showClear
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Version</label>
            <Dropdown
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(e.value)}
              options={kpis?.available_versions?.map(v => ({ label: v, value: v })) || []}
              placeholder="All Versions"
              showClear
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Error State */}
        {error && (
          <ErrorCard message={error} onRetry={handleRetry} />
        )}

        {/* KPI Cards */}
        <div className="kpi-grid">
          <StatsCard
            label="Total Responses"
            value={kpis?.total_responses || 0}
            icon="pi pi-users"
            loading={loading}
          />
          <StatsCard
            label="Egresados"
            value={kpis?.total_egresados || 0}
            icon="pi pi-graduation-cap"
            loading={loading}
          />
          <StatsCard
            label="Profesores"
            value={kpis?.total_profesores || 0}
            icon="pi pi-book"
            loading={loading}
          />
          <StatsCard
            label="Programs"
            value={kpis?.by_programa?.length || 0}
            icon="pi pi-chart-bar"
            loading={loading}
          />
        </div>

        {/* Charts Row 1 */}
        <div className="dashboard-grid">
          <div className="chart-container">
            {loading ? (
              <Card>
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
                </div>
              </Card>
            ) : programChartData ? (
              <Card title="Responses by Program">
                <Chart type="bar" data={programChartData} options={programChartOptions} style={{ height: '300px' }} />
              </Card>
            ) : null}
          </div>

          <div className="chart-container">
            <QuestionChart
              title="Gender Distribution"
              data={genderData}
              chartType="pie"
              loading={loading}
            />
          </div>
        </div>

        {/* Charts Row 2 */}
        {satisfactionData && (
          <div className="dashboard-grid">
            <div className="chart-container" style={{ gridColumn: '1 / -1' }}>
              <QuestionChart
                title="Satisfaction Analysis"
                data={satisfactionData}
                chartType="bar"
                loading={loading}
              />
            </div>
          </div>
        )}

        {/* Program Breakdown Table */}
        {kpis?.by_programa && kpis.by_programa.length > 0 && (
          <Card title="Responses by Program" style={{ marginTop: '1.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd', backgroundColor: '#f5f5f5' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Program</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total Responses</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {kpis.by_programa.map((item, index) => {
                  const percentage = ((item.total / kpis.total_responses) * 100).toFixed(1);
                  return (
                    <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '0.75rem', fontWeight: '500' }}>{item.programa}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>{item.total}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>{percentage}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
