import React, { useState, useEffect } from "react";
import { Card } from "primereact/card";
import SideBar from "../../../components/SideBar";
import { Button } from "primereact/button";
import { Chart } from "primereact/chart";
import { Dropdown } from "primereact/dropdown";
import { StatsCard, ErrorCard } from "../../../components/StatsCard";
import { QuestionChart } from "../../../components/QuestionChart";
import { statisticsAPI, UserListAPI, AgentAPI } from "../../../services/api";
import { Checkbox } from "primereact/checkbox";
import { InputText } from "primereact/inputtext";
import { FloatLabel } from "primereact/floatlabel";
import { ProgressSpinner } from "primereact/progressspinner";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import auditLogger from "../../../utils/audit";
import "./Dashboard.css";

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

  // ETL Load state
  const [etlForm, setEtlForm] = useState({
    dataset: "egresados",
    school_id: null,
    version: "",
    filename: ""
  });
  const [etlLoading, setEtlLoading] = useState(false);
  const [etlResults, setEtlResults] = useState(null);
  const [schools, setSchools] = useState([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);

  // Dataset options
  const datasetOptions = [
    { label: "Egresados", value: "egresados" },
    { label: "Profesores", value: "profesores" }
  ];

  // Fetch available programs
  useEffect(() => {
    const fetchUsers = async ()=>{
      try {
        const data = await UserListAPI.getUserList();
        setUsers(data)
        console.log("datos: ",data)
        
        // Log audit action for viewing dashboard
        await auditLogger.read("Dashboard viewed");
        
      } catch (error) {
        console.log("Error al encontrar Usuarios")
      }
    }
    fetchUsers()
  }, []);

  // Fetch schools for ETL dropdown
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setSchoolsLoading(true);
        const schoolsData = await UserListAPI.getSchools();
        const schoolOptions = schoolsData.map((school) => ({
          label: school.name,
          value: school.id,
          name: school.name // Store the name for ETL programa parameter
        }));
        setSchools(schoolOptions);
        console.log("Escuelas cargadas para ETL: ", schoolOptions);

        // Set default school if available
        if (schoolOptions.length > 0) {
          setEtlForm((prev) => ({
            ...prev,
            school_id: schoolOptions[0].value,
          }));
        }
      } catch (error) {
        console.error("Error al cargar escuelas:", error);
      } finally {
        setSchoolsLoading(false);
      }
    };
    fetchSchools();
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

  // ETL Load function
  const handleEtlLoad = async () => {
    try {
      setEtlLoading(true);
      setEtlResults(null);

      // Validate required fields
      if (!etlForm.school_id) {
        alert("Por favor seleccione una escuela");
        return;
      }

      // Get selected school name for programa parameter
      const selectedSchool = schools.find(school => school.value === etlForm.school_id);
      if (!selectedSchool) {
        alert("Error: No se pudo encontrar la escuela seleccionada");
        return;
      }

      const programa = selectedSchool.name; // Use school name as programa

      // Prepare parameters
      const version = etlForm.version.trim() || null;
      const filename = etlForm.filename.trim() || null;

      console.log("Loading from MinIO to ETL:", {
        dataset: etlForm.dataset,
        programa: programa,
        school_id: etlForm.school_id,
        version,
        filename
      });

      // Call the ETL load API
      const result = await AgentAPI.loadFromMinIO(
        etlForm.dataset,
        programa,
        version,
        filename
      );

      setEtlResults(result);
      console.log("ETL Load successful:", result);
      
      // Log audit action
      await auditLogger.etlLoad(etlForm.dataset, programa, etlForm.school_id);
      
      alert("Carga completada exitosamente");

    } catch (error) {
      console.error("Error loading from MinIO to ETL:", error);
      alert("Error en la carga: " + error.message);
    } finally {
      setEtlLoading(false);
    }
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
      <div>
      <Button
        onClick={() => setVisible(true)}
        icon="pi pi-bars"
        className="sidebar-toggle"
      />
      <SideBar visible={visible} onHide={() => setVisible(false)} />
      </div>
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2>Dashboard</h2>
          <p>Welcome back! Here's what's happening today.</p>
        </div>

        {/* KPI Cards Grid */}
        <div>{kpGrid}</div>

        {/* Main Content Grid */}
        <div className="main-grid">
          {/* ETL Load Section */}
          <Card title="Cargar Datos desde MinIO" className="section-card etl-card">
            <div className="etl-form">
              <h4>Cargar archivo desde MinIO al ETL Database</h4>
              <p>Ejecute el proceso ETL para cargar datos desde el bucket MinIO a la base de datos.</p>
              
              <div className="form-group">
                <label htmlFor="etl-dataset" style={{ marginBottom: "10px", display: "block", fontWeight: "bold" }}>
                  Dataset *
                </label>
                <Dropdown
                  id="etl-dataset"
                  value={etlForm.dataset}
                  onChange={(e) => setEtlForm({ ...etlForm, dataset: e.value })}
                  options={datasetOptions}
                  placeholder="Seleccionar dataset"
                  style={{ width: "100%" }}
                />
              </div>

              <div className="form-group" style={{ marginTop: "15px" }}>
                <label htmlFor="etl-school" style={{ marginBottom: "10px", display: "block", fontWeight: "bold" }}>
                  Escuela *
                </label>
                <Dropdown
                  id="etl-school"
                  value={etlForm.school_id}
                  onChange={(e) => setEtlForm({ ...etlForm, school_id: e.value })}
                  options={schools}
                  placeholder={schoolsLoading ? "Cargando escuelas..." : "Seleccionar escuela"}
                  disabled={schoolsLoading}
                  style={{ width: "100%" }}
                />
              </div>

              <div className="form-group" style={{ marginTop: "15px" }}>
                <FloatLabel>
                  <InputText
                    id="etl-version"
                    value={etlForm.version}
                    onChange={(e) => setEtlForm({ ...etlForm, version: e.target.value })}
                    placeholder="Ej: v2.0, 2024-11-15 (opcional)"
                    style={{ width: "100%" }}
                  />
                  <label htmlFor="etl-version">Versión (Opcional)</label>
                </FloatLabel>
              </div>

              <div className="form-group" style={{ marginTop: "15px" }}>
                <FloatLabel>
                  <InputText
                    id="etl-filename"
                    value={etlForm.filename}
                    onChange={(e) => setEtlForm({ ...etlForm, filename: e.target.value })}
                    placeholder="nombre_archivo.csv (opcional)"
                    style={{ width: "100%" }}
                  />
                  <label htmlFor="etl-filename">Nombre del Archivo (Opcional)</label>
                </FloatLabel>
              </div>

              <div style={{ marginTop: "20px", textAlign: "center" }}>
                <Button
                  label="Ejecutar Carga ETL"
                  icon="pi pi-play"
                  onClick={handleEtlLoad}
                  loading={etlLoading}
                  disabled={!etlForm.school_id || schoolsLoading}
                  className="p-button-success"
                />
              </div>

              {etlLoading && (
                <div style={{ textAlign: "center", marginTop: "15px" }}>
                  <ProgressSpinner size="30" />
                  <p>Ejecutando proceso ETL...</p>
                </div>
              )}

              {etlResults && (
                <Card style={{ marginTop: "15px", backgroundColor: "#f0f9ff" }}>
                  <h5>Resultado de la Carga</h5>
                  <div className="etl-results">
                    <p><strong>Estado:</strong> {etlResults.status || 'Completado'}</p>
                    <p><strong>Mensaje:</strong> {etlResults.message || 'Proceso ejecutado exitosamente'}</p>
                    {etlResults.bucket && <p><strong>Bucket:</strong> {etlResults.bucket}</p>}
                    {etlResults.object_name && <p><strong>Archivo:</strong> {etlResults.object_name}</p>}
                    {etlResults.records_processed && <p><strong>Registros procesados:</strong> {etlResults.records_processed}</p>}
                  </div>
                </Card>
              )}
            </div>
          </Card>

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
              className="contacts-table"
            >
              <Column field="username" header="Nombre" sortable></Column>
              <Column field="role" header="Rol" sortable></Column>
              <Column field="phone_number" header= "Phone Number"></Column>
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
