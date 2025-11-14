import React from 'react';
import { Card } from 'primereact/card';
import { Chart } from 'primereact/chart';

/**
 * Question Analysis Chart Component
 * Displays distribution of answers for a survey question
 */
export const QuestionChart = ({ 
  title, 
  data, 
  chartType = 'pie',
  loading = false 
}) => {
  if (loading) {
    return (
      <Card title={title}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
          <p>Loading...</p>
        </div>
      </Card>
    );
  }

  if (!data || data.distribution.length === 0) {
    return (
      <Card title={title}>
        <p style={{ textAlign: 'center', color: '#999' }}>No data available</p>
      </Card>
    );
  }

  // Prepare chart data
  const chartData = {
    labels: data.distribution.map(item => item.answer),
    datasets: [
      {
        data: data.distribution.map(item => item.count),
        backgroundColor: [
          '#42A5F5',
          '#66BB6A',
          '#FFA726',
          '#EF5350',
          '#AB47BC',
          '#26C6DA',
          '#FFCA28',
          '#EC407A'
        ],
        hoverBackgroundColor: [
          '#64B5F6',
          '#81C784',
          '#FFB74D',
          '#E57373',
          '#BA68C8',
          '#4DD0E1',
          '#FFD54F',
          '#F06292'
        ]
      }
    ]
  };

  const chartOptions = {
    plugins: {
      legend: {
        labels: {
          usePointStyle: true,
          color: '#495057'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const item = data.distribution[context.dataIndex];
            return `${item.answer}: ${item.count} (${item.percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <Card title={title}>
      <div style={{ marginBottom: '1rem' }}>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>
          Total responses: <strong>{data.total_responses}</strong>
        </p>
      </div>
      
      {chartType === 'pie' && (
        <Chart type="pie" data={chartData} options={chartOptions} style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }} />
      )}
      
      {chartType === 'bar' && (
        <Chart type="bar" data={chartData} options={chartOptions} />
      )}

      <div style={{ marginTop: '1.5rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '0.5rem', textAlign: 'left' }}>Answer</th>
              <th style={{ padding: '0.5rem', textAlign: 'right' }}>Count</th>
              <th style={{ padding: '0.5rem', textAlign: 'right' }}>Percentage</th>
            </tr>
          </thead>
          <tbody>
            {data.distribution.map((item, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.5rem' }}>{item.answer}</td>
                <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold' }}>{item.count}</td>
                <td style={{ padding: '0.5rem', textAlign: 'right' }}>{item.percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
