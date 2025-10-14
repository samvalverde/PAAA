import React from 'react';
import { Card } from 'primereact/card';
import SideBar from '../../../components/SideBar';
import { Button } from 'primereact/button';
import { Chart } from 'primereact/chart';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Checkbox } from 'primereact/checkbox';
import './Dashboard.css';

// Sample data
const kpiData = [
  { label: 'Total Users', value: '1,200', icon: 'pi pi-users', trend: '+12%' },
  { label: 'Revenue', value: '$15,230', icon: 'pi pi-dollar', trend: '+8%' },
  { label: 'Tasks Completed', value: '84%', icon: 'pi pi-check-circle', trend: '+5%' },
  { label: 'New Signups', value: '75', icon: 'pi pi-user-plus', trend: '+15%' }
];

const tasks = [
  { id: 1, task: 'Update documentation', completed: true },
  { id: 2, task: 'Fix mobile responsive issues', completed: false },
  { id: 3, task: 'Prepare quarterly report', completed: false },
  { id: 4, task: 'Deploy new features', completed: true },
  { id: 5, task: 'Team meeting', completed: false }
];

const contacts = [
  { id: 1, name: 'John Doe', email: 'john@email.com', status: 'Active' },
  { id: 2, name: 'Jane Smith', email: 'jane@email.com', status: 'Active' },
  { id: 3, name: 'Mike Johnson', email: 'mike@email.com', status: 'Inactive' },
  { id: 4, name: 'Sarah Wilson', email: 'sarah@email.com', status: 'Active' },
  { id: 5, name: 'Tom Brown', email: 'tom@email.com', status: 'Pending' }
];

const chartData = {
  labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
  datasets: [
    {
      label: 'Revenue',
      data: [65, 59, 80, 81, 56, 55, 40],
      fill: false,
      borderColor: '#42A5F5',
      tension: 0.4
    },
    {
      label: 'Users',
      data: [28, 48, 40, 19, 86, 27, 90],
      fill: false,
      borderColor: '#FFA726',
      tension: 0.4
    }
  ]
};

const chartOptions = {
  maintainAspectRatio: false,
  aspectRatio: 0.6,
  plugins: {
    legend: {
      labels: {
        color: '#495057'
      }
    }
  },
  scales: {
    x: {
      ticks: {
        color: '#495057'
      },
      grid: {
        color: '#ebedef'
      }
    },
    y: {
      ticks: {
        color: '#495057'
      },
      grid: {
        color: '#ebedef'
      }
    }
  }
};

const Dashboard = () => {
  const [visible, setVisible] = React.useState(true);

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
          <h2>Dashboard</h2>
          <p>Welcome back! Here's what's happening today.</p>
        </div>

        {/* KPI Cards Grid */}
        <div className="kpi-grid">
          {kpiData.map((kpi, index) => (
            <Card key={index} className="kpi-card">
              <div className="kpi-content">
                <div className="kpi-info">
                  <span className="kpi-label">{kpi.label}</span>
                  <span className="kpi-value">{kpi.value}</span>
                  <span className="kpi-trend">{kpi.trend}</span>
                </div>
                <div className="kpi-icon">
                  <i className={kpi.icon}></i>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="main-grid">
          {/* Tasks Section */}
          <Card title="Recent Tasks" className="section-card">
            <div className="tasks-list">
              {tasks.map(task => (
                <div key={task.id} className="task-item">
                  <Checkbox checked={task.completed} readOnly />
                  <span 
                    style={{ 
                      textDecoration: task.completed ? 'line-through' : 'none', 
                      marginLeft: '0.5rem',
                      color: task.completed ? '#6c757d' : '#495057'
                    }}
                  >
                    {task.task}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Chart Section */}
          <Card title="Performance Overview" className="section-card">
            <div className="chart-container">
              <Chart 
                type="line" 
                data={chartData} 
                options={chartOptions} 
                style={{ height: '300px' }} 
              />
            </div>
          </Card>

          {/* Contacts Table Section */}
          <Card title="Recent Contacts" className="section-card table-section">
            <DataTable value={contacts} responsiveLayout="scroll" className="contacts-table">
              <Column field="name" header="Name" sortable></Column>
              <Column field="email" header="Email" sortable></Column>
              <Column field="status" header="Status" sortable></Column>
            </DataTable>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;