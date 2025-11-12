import React, { useState, useEffect } from "react";
import { Card } from "primereact/card";
import SideBar from "../../../components/SideBar";
import { Button } from "primereact/button";
import { Chart } from "primereact/chart";
import { Dropdown } from "primereact/dropdown";
import { StatsCard, ErrorCard } from "../../../components/StatsCard";
import { QuestionChart } from "../../../components/QuestionChart";
import { statisticsAPI, UserListAPI } from "../../../services/api";
import { Checkbox } from "primereact/checkbox";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import "./Dashboard.css";

const tasks = [
  { id: 1, task: "Update documentation", completed: true },
  { id: 2, task: "Fix mobile responsive issues", completed: false },
  { id: 3, task: "Prepare quarterly report", completed: false },
  { id: 4, task: "Deploy new features", completed: true },
  { id: 5, task: "Team meeting", completed: false },
];

const contacts = [
  { id: 1, name: "John Doe", email: "john@email.com", status: "Active" },
  { id: 2, name: "Jane Smith", email: "jane@email.com", status: "Active" },
  { id: 3, name: "Mike Johnson", email: "mike@email.com", status: "Inactive" },
  { id: 4, name: "Sarah Wilson", email: "sarah@email.com", status: "Active" },
  { id: 5, name: "Tom Brown", email: "tom@email.com", status: "Pending" },
];

const chartData = {
  labels: ["January", "February", "March", "April", "May", "June", "July"],
  datasets: [
    {
      label: "Revenue",
      data: [65, 59, 80, 81, 56, 55, 40],
      fill: false,
      borderColor: "#42A5F5",
      tension: 0.4,
    },
    {
      label: "Users",
      data: [28, 48, 40, 19, 86, 27, 90],
      fill: false,
      borderColor: "#FFA726",
      tension: 0.4,
    },
  ],
};

const chartOptions = {
  maintainAspectRatio: false,
  aspectRatio: 0.6,
  plugins: {
    legend: {
      labels: {
        color: "#495057",
      },
    },
  },
  scales: {
    x: {
      ticks: {
        color: "#495057",
      },
      grid: {
        color: "#ebedef",
      },
    },
    y: {
      ticks: {
        color: "#495057",
      },
      grid: {
        color: "#ebedef",
      },
    },
  },
};

const Dashboard = () => {
  const [visible, setVisible] = useState(true);

  // State for filters
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(null);

  // State for data
  const [kpis, setKpis] = useState(null);
  const [genderData, setGenderData] = useState(null);
  const [satisfactionData, setSatisfactionData] = useState(null);
  const [responsesPerProgram, setResponsesPerProgram] = useState(null);
  const [users, setUsers] = useState([]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [kpGrid, setKpGrid] = useState(<p>Loading</p>);

  // Fetch available programs
  useEffect(() => {
    const fetchUsers = async ()=>{
      try {
        const data = await UserListAPI.getUserList();
        setUsers(data)
        console.log("datos: ",data)
      } catch (error) {
        console.log("Error al encontrar Usuarios")
      }
    }
    fetchUsers()
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);

      try {
        const filters = {
          programa: selectedProgram,
          version: selectedVersion,
        };

        // Fetch all data in parallel
        const [kpisData, genderAnalysis, satisfaction, responsesData] =
          await Promise.all([
            statisticsAPI.getKPIs(filters),
            statisticsAPI.analyzeQuestion("egresados", "ipg01_3_sexo", filters),
            statisticsAPI
              .getSatisfactionAnalysis("egresados", filters)
              .catch(() => null), // Optional
            statisticsAPI.getResponsesPerProgram("egresados", {
              version: selectedVersion,
            }),
          ]);

        setKpis(kpisData);
        setGenderData(genderAnalysis);
        setSatisfactionData(satisfaction);
        setResponsesPerProgram(responsesData);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
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
    // Trigger re-fetch by updating a dummy state
    setSelectedProgram(selectedProgram);
  };

  // Chart for responses per program
  const programChartData = responsesPerProgram
    ? {
        labels: responsesPerProgram.data.map((item) => item.programa),
        datasets: [
          {
            label: "Responses",
            data: responsesPerProgram.data.map((item) => item.count),
            backgroundColor: "#42A5F5",
            borderColor: "#1E88E5",
            borderWidth: 1,
          },
        ],
      }
    : null;

  const programChartOptions = {
    maintainAspectRatio: false,
    aspectRatio: 0.8,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  const kpiGrid = () => {
    if (kpis) {
      console.log(kpis);
      setKpGrid(
        <div className="kpi-grid">
          {Object.entries(kpis).map(([key, value], index) => {
            if (typeof value !== "object") {
              return (
                <Card key={index} className="kpi-card">
                  <div className="kpi-content">
                    <div className="kpi-info">
                      <span className="kpi-label">{key}</span>
                      <span className="kpi-value">{String(value)}</span>
                    </div>
                  </div>
                </Card>
              );
            }
            if (key === "by_programa") {
              return (
                value.map((p,i)=>{
                return(
                <Card key={i} className="kpi-card">
                  <div className="kpi-content">
                    <div className="kpi-info">
                      <span className="kpi-label">{String(p.programa)}</span>
                      <span className="kpi-value">{String(p.total)}</span>
                    </div>
                  </div>
                </Card>)})
              );
            }
          })}
        </div>
      );
    }
  };

  useEffect(() => {
    kpiGrid();
  }, [kpis]);

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
        <div>{kpGrid}</div>

        {/* Main Content Grid */}
        <div className="main-grid">
          {/* Tasks Section 
          <Card title="Recent Tasks" className="section-card">
            <div className="tasks-list">
              {tasks.map((task) => (
                <div key={task.id} className="task-item">
                  <Checkbox checked={task.completed} readOnly />
                  <span
                    style={{
                      textDecoration: task.completed ? "line-through" : "none",
                      marginLeft: "0.5rem",
                      color: task.completed ? "#6c757d" : "#495057",
                    }}
                  >
                    {task.task}
                  </span>
                </div>
              ))}
            </div>
          </Card>
          */}

          {/* Chart Section */}
          <Card title="Performance Overview" className="section-card">
            <div className="chart-container">
              <Chart
                type="line"
                data={chartData}
                options={chartOptions}
                style={{ height: "300px" }}
              />
            </div>
          </Card>

          {/* Contacts Table Section */}
          <Card title="Recent Contacts" className="section-card table-section">
            <DataTable
              value={users}
              responsiveLayout="scroll"
              className="contacts-table"
            >
              <Column field="username" header="Nombre" sortable></Column>
              <Column field="role" header="Rol" sortable></Column>
              <Column field="phone" header= "Phone Number"></Column>
              <Column field="email" header="Email" sortable></Column>
              <Column field="is_active" header="Status" sortable></Column>
            </DataTable>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
