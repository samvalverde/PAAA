import React, { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Button } from "primereact/button";
import { TabView, TabPanel } from 'primereact/tabview';
import { Card } from 'primereact/card';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { FloatLabel } from 'primereact/floatlabel';
import { Accordion, AccordionTab } from "primereact/accordion";
import SideBar from '../../../components/SideBar';
import { ProcListAPI, UserListAPI, AgentAPI } from '../../../services/api';
import auditLogger from '../../../utils/audit';
import "./Proyecto.css";

const Proyecto = () => {
  const location = useLocation();
  const { id } = useParams();
  console.log("LOCATION:", location);

  const process = location.state?.process;

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [projectData, setProjectData] = useState(process || null);
  const [loading, setLoading] = useState(!process);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [dropdownsLoading, setDropdownsLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [filesError, setFilesError] = useState(null);

  // File upload state
  const fileInputRef = useRef(null);
  const [uploadForm, setUploadForm] = useState({
    dataset_type: "egresados", // 'egresados' or 'profesores'
    version: "", // version number for the file
    file: null, // CSV/Excel file to upload
  });
  const [uploadLoading, setUploadLoading] = useState(false);

  // Dataset options for upload
  const datasetOptions = [
    { label: "Egresados", value: "egresados" },
    { label: "Profesores", value: "profesores" },
  ];

  // Analytics state
  const [analyticsForm, setAnalyticsForm] = useState({
    dataset: "egresados",
    tipo_analitica: "resumen_general",
    distribuciones: [],
    filtros: {}
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsResults, setAnalyticsResults] = useState(null);
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [narrative, setNarrative] = useState(null);

  // Analytics options
  const analyticTypeOptions = [
    { label: "Resumen General", value: "resumen_general" },
    { label: "Perfil de Población", value: "perfil_poblacion" },
    { label: "Detalle de Pregunta", value: "detalle_pregunta" },
  ];

  const distributionOptions = [
    { label: "Sexo", value: "sexo" },
    { label: "Año de Graduación", value: "anio_graduacion" },
    { label: "Edad", value: "edad" },
    { label: "Estado Civil", value: "estado_civil" },
  ];

  // Estado options
  const estadoOptions = [
    {label:"Fallido", value: "Fallido"}, 
    {label:"En proceso", value: "En proceso"}, 
    {label:"Activo", value: "Activo"},
    {label:"Completado",value:"Completado"}
  ];

  // If we don't have process data from location.state, fetch it by ID
  useEffect(() => {
    if (!process && id) {
      fetchProjectData(id);
    }
  }, [id, process]);

  // Load dropdown data when editing starts
  useEffect(() => {
    if (isEditing && (users.length === 0 || schools.length === 0)) {
      loadDropdownData();
    }
  }, [isEditing]);

  // When users data is loaded, make sure we have the encargado_id
  useEffect(() => {
    if (users.length > 0 && projectData && projectData.encargado && !projectData.encargado_id) {
      const matchingUser = users.find(u => u.username === projectData.encargado);
      if (matchingUser) {
        setProjectData(prev => ({
          ...prev,
          encargado_id: matchingUser.id
        }));
      }
    }
  }, [users, projectData]);

  // Load files when project data is available
  useEffect(() => {
    if (projectData && projectData.id) {
      loadFiles(projectData.id);
    }
  }, [projectData]);

  const fetchProjectData = async (processId) => {
    try {
      setLoading(true);
      setError(null);
      const data = await ProcListAPI.getProcById(processId);
      setProjectData(data);
      
      // Log audit action for viewing project
      await auditLogger.projectView(data.process_name, data.school_id);
      
    } catch (err) {
      console.error('Error fetching project data:', err);
      setError('Error al cargar los datos del proyecto');
    } finally {
      setLoading(false);
    }
  };

  const formatSchools = (data)=>{
    console.log("School: ", data);
    const schoolOptions = data.map((school) => ({
          label: school.name,
          value: school.id,
        }));
    setSchools(schoolOptions);
  }

  const loadDropdownData = async () => {
    try {
      setDropdownsLoading(true);
      const [usersData, schoolsData] = await Promise.all([
        UserListAPI.getUsersForDropdown(),
        UserListAPI.getSchools()
      ]);
      setUsers(usersData);
      formatSchools(schoolsData);
    } catch (err) {
      console.error('Error loading dropdown data:', err);
    } finally {
      setDropdownsLoading(false);
    }
  };

  const loadFiles = async (processId) => {
    try {
      setFilesLoading(true);
      setFilesError(null);
      const filesData = await ProcListAPI.getProcFiles(processId);
      setFiles(filesData.files || []);
      console.log("Files loaded:", filesData);
    } catch (err) {
      console.error('Error loading files:', err);
      setFilesError('Error al cargar los archivos');
    } finally {
      setFilesLoading(false);
    }
  };

  const handleChange = (field, value) => {
    console.log(`Updating field "${field}" with value:`, value);
    setProjectData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      console.log("New project data:", newData);
      return newData;
    });
  };

  const handleSave = async () => {
    try {
      setSaveLoading(true);
      
      // Prepare the data for the API (only send fields that can be updated)
      const updateData = {
        process_name: projectData.process_name,
        estado: projectData.estado,
        school_id: projectData.school_id,
        encargado_id: projectData.encargado_id
      };

      console.log("Sending update data:", updateData);
      console.log("Project ID:", projectData.id);
      console.log("Current projectData:", {
        process_name: projectData.process_name,
        estado: projectData.estado,
        school_id: projectData.school_id,
        encargado_id: projectData.encargado_id,
        unidad: projectData.unidad,
        encargado: projectData.encargado
      });

      // Call the API to update the project
      const updatedProject = await ProcListAPI.updateProc(projectData.id, updateData);
      
      console.log("Received updated project:", updatedProject);
      
      // Update the local state with the response from the server
      setProjectData(updatedProject);
      setIsEditing(false);
      
      console.log("Project updated successfully:", updatedProject);
      
      // Log audit action for project update
      await auditLogger.projectUpdate(updatedProject.process_name, updatedProject.school_id);
      
      // Show success message (you can use a toast library for better UX)
      alert("Proyecto actualizado correctamente");
      
    } catch (error) {
      console.error("Error updating project:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response,
        status: error.status
      });
      alert("Error al actualizar proyecto: " + error.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDownloadFile = async (fileData) => {
    try {
      // Use the existing downloadFile API endpoint
      const response = await ProcListAPI.downloadFile(fileData.path);
      
      // Convert response to blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileData.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Log audit action for file download
      await auditLogger.fileDownload(fileData.name, projectData?.process_name, projectData?.school_id);
      
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error al descargar el archivo: ' + error.message);
    }
  };

  const handleViewFile = (fileData) => {
    // For now, just show file information
    alert(`Archivo: ${fileData.name}\nTipo: ${fileData.type}\nTamaño: ${fileData.size} bytes\nRuta: ${fileData.path}`);
    // TODO: Implement file content viewing (for CSV files, show preview table)
  };

  // File upload functions
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type (CSV or Excel)
      const validExtensions = [".csv", ".xlsx", ".xls"];
      const fileExtension = file.name
        .toLowerCase()
        .substring(file.name.lastIndexOf("."));

      if (!validExtensions.includes(fileExtension)) {
        alert(
          "Por favor seleccione un archivo CSV (.csv) o Excel (.xlsx, .xls) válido"
        );
        return;
      }

      // Validate file naming pattern (check name without extension)
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf("."));
      const expectedNameWithoutExt = `${uploadForm.dataset_type}_${uploadForm.version}`;

      if (nameWithoutExt !== expectedNameWithoutExt) {
        alert(
          `El archivo debe llamarse exactamente: ${expectedNameWithoutExt}.csv o ${expectedNameWithoutExt}.xlsx`
        );
        return;
      }

      setUploadForm({ ...uploadForm, file });
    }
  };

  const handleFileUpload = async () => {
    try {
      setUploadLoading(true);

      // Validate required fields
      if (!uploadForm.version) {
        alert("Por favor ingrese la versión");
        return;
      }

      if (!uploadForm.file) {
        alert("Por favor seleccione un archivo");
        return;
      }

      // Get school name for MinIO path (using projectData.unidad as the school name)
      const schoolName = projectData?.unidad;
      if (!schoolName) {
        alert("No se puede determinar la escuela del proyecto");
        return;
      }

      // Create FormData for file upload (simplified for file-only upload)
      const formData = new FormData();
      formData.append("school_name", schoolName); // Use school name for MinIO path
      formData.append("dataset_type", uploadForm.dataset_type);
      formData.append("file", uploadForm.file);

      // Debug: Check if auth token is available
      const token = localStorage.getItem("access_token");
      console.log("Auth token available:", !!token);
      if (!token) {
        alert(
          "No se encontró token de autenticación. Por favor inicie sesión nuevamente."
        );
        return;
      }

      // Call the new API to upload the file only (without creating a process)
      await ProcListAPI.uploadFile(formData);

      // Reset the form
      setUploadForm({
        dataset_type: "egresados",
        version: "",
        file: null,
      });

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      alert("Archivo subido correctamente");
      
      // Log audit action for file upload
      await auditLogger.fileUpload(uploadForm.file.name, projectData?.process_name, projectData?.school_id);
      
      // Reload files to show the new upload
      if (projectData?.id) {
        loadFiles(projectData.id);
      }
      
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error al subir archivo: " + error.message);
    } finally {
      setUploadLoading(false);
    }
  };

  // Analytics functions
  const handleRunAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      setAnalyticsResults(null);
      setNarrative(null);

      // Get school name (programa) from project data
      const programa = projectData?.unidad;
      if (!programa) {
        alert("No se puede determinar la escuela del proyecto");
        return;
      }

      // Prepare payload for analytics
      const payload = {
        poblacion: {
          dataset: analyticsForm.dataset,
          programa: programa,
          filtros: analyticsForm.filtros,
        },
        distribuciones: analyticsForm.distribuciones,
        tipo_analitica: analyticsForm.tipo_analitica
      };

      console.log("Running analytics with payload:", payload);

      // Call analytics API
      const results = await AgentAPI.getAnalytics(payload);
      setAnalyticsResults(results);

      console.log("Analytics results:", results);

      // Log audit action
      await auditLogger.analyticsRun(analyticsForm.tipo_analitica, analyticsForm.dataset, projectData?.school_id);

    } catch (error) {
      console.error("Error running analytics:", error);
      alert("Error al ejecutar análisis: " + error.message);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleGenerateNarrative = async () => {
    if (!analyticsResults) {
      alert("Primero ejecute un análisis para generar la narrativa");
      return;
    }

    try {
      setNarrativeLoading(true);
      setNarrative(null);

      const programa = projectData?.unidad;
      const payload = {
        enunciado: `Generar un reporte analítico para ${programa}`,
        resultados: analyticsResults.resultados,
        poblacion: analyticsResults.poblacion,
        escuela: programa
      };

      console.log("Generating narrative with payload:", payload);

      const narrativeResult = await AgentAPI.generateNarrative(payload);
      setNarrative(narrativeResult.texto);

      console.log("Narrative result:", narrativeResult);

    } catch (error) {
      console.error("Error generating narrative:", error);
      alert("Error al generar narrativa: " + error.message);
    } finally {
      setNarrativeLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoSeverity = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'completado':
      case 'finalizado':
        return 'success';
      case 'activo':
        return 'info';
      case 'en proceso':
        return 'warning';
      case 'error':
      case 'fallido':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const resumenContent = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <ProgressSpinner />
          <p>Cargando información del proyecto...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-container">
          <p className="error-message">{error}</p>
          <Button 
            label="Reintentar" 
            onClick={() => fetchProjectData(id)}
            className="p-button-outlined"
          />
        </div>
      );
    }

    if (!projectData) {
      return (
        <div className="error-container">
          <p>No se encontraron datos del proyecto</p>
        </div>
      );
    }

    return (
      <div className="resumen-content">
        <div className="project-info-grid">
          <Card className="info-card">
            <div className="info-item">
              <label>Nombre del Proyecto:</label>
              {isEditing ? (
                <InputText
                  value={projectData.process_name || ''}
                  onChange={(e) => handleChange('process_name', e.target.value)}
                  className="editable-input"
                />
              ) : (
                <span className="info-value">{projectData.process_name}</span>
              )}
            </div>
            
            <div className="info-item">
              <label>Encargado:</label>
              {isEditing ? (
                <Dropdown
                  value={users.find(u => u.id === projectData.encargado_id)}
                  options={users}
                  onChange={(e) => {
                    const selectedUser = e.target.value;
                    handleChange('encargado', selectedUser.username);
                    handleChange('encargado_id', selectedUser.id);
                  }}
                  optionLabel="username"
                  placeholder="Selecciona un encargado"
                  className="editable-dropdown"
                  loading={dropdownsLoading}
                />
              ) : (
                <span className="info-value">{projectData.encargado || 'No asignado'}</span>
              )}
            </div>
            
            <div className="info-item">
              <label>Estado:</label>
              {isEditing ? (
                <Dropdown
                  value={estadoOptions.find(e => e.value === projectData.estado)}
                  options={estadoOptions}
                  onChange={(e) => handleChange('estado', e.target.value)}
                  optionLabel="label"
                  placeholder="Selecciona un estado"
                  className="editable-dropdown"
                />
              ) : (
                <Tag 
                  value={projectData.estado || 'Sin estado'} 
                  severity={getEstadoSeverity(projectData.estado)}
                  className="estado-tag"
                />
              )}
            </div>
            
            <div className="info-item">
              <label>Unidad/Escuela:</label>
              {isEditing ? (
                <Dropdown
                  value={schools.find(s => s.value === projectData.school_id)}
                  options={schools}
                  onChange={(e) => {
                    const selectedSchool = e.value;
                    handleChange('school_id', selectedSchool);
                  }}
                  optionLabel="label"
                  placeholder="Selecciona una escuela"
                  className="editable-dropdown"
                  loading={dropdownsLoading}
                />
              ) : (
                <span className="info-value">{projectData.unidad || 'No especificada'}</span>
              )}
            </div>
            
            <div className="info-item">
              <label>Fecha de Creación:</label>
              <span className="info-value">{formatDate(projectData.created_at)}</span>
            </div>
            
            <div className="info-item">
              <label>Última Actualización:</label>
              <span className="info-value">{formatDate(projectData.updated_at)}</span>
            </div>
            
            <div className="info-item">
              <label>ID del Proyecto:</label>
              <span className="info-value">#{projectData.id}</span>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  const datosContent = () => {
    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const typeTemplate = (rowData) => {
      return (
        <Tag 
          value={rowData.type} 
          severity={rowData.type === 'egresados' ? 'success' : 'info'}
        />
      );
    };

    const sizeTemplate = (rowData) => {
      return formatFileSize(rowData.size);
    };

    const dateTemplate = (rowData) => {
      return formatDate(rowData.last_modified);
    };

    const actionTemplate = (rowData) => {
      return (
        <div className="action-buttons">
          <Button
            icon="pi pi-download"
            className="p-button-rounded p-button-text"
            tooltip="Descargar archivo"
            onClick={() => handleDownloadFile(rowData)}
          />
          <Button
            icon="pi pi-eye"
            className="p-button-rounded p-button-text"
            tooltip="Ver contenido"
            onClick={() => handleViewFile(rowData)}
          />
        </div>
      );
    };

    if (filesLoading) {
      return (
        <div className="loading-container">
          <ProgressSpinner />
          <p>Cargando archivos...</p>
        </div>
      );
    }

    if (filesError) {
      return (
        <div className="error-container">
          <p className="error-message">{filesError}</p>
          <Button 
            label="Reintentar" 
            onClick={() => loadFiles(projectData.id)}
            className="p-button-outlined"
          />
        </div>
      );
    }

    return (
      <div className="datos-content">
        <Accordion multiple activeIndex={[0]} className="datos-accordion">
          {/* File List Section */}
          <AccordionTab header="Archivos Existentes" className="datos-tab">
            <div className="files-header">
              <h4>Archivos de Datos</h4>
              <p>Archivos almacenados para {projectData?.unidad || 'esta escuela'}</p>
            </div>
            
            {files.length === 0 ? (
              <div className="no-files-message">
                <p>No se encontraron archivos para esta escuela.</p>
                <p>Los archivos deben estar ubicados en la estructura:</p>
                <ul>
                  <li><code>paaa-bucket/{projectData?.unidad || 'escuela'}/egresados/</code></li>
                  <li><code>paaa-bucket/{projectData?.unidad || 'escuela'}/profesores/</code></li>
                </ul>
              </div>
            ) : (
              <Card>
                <DataTable 
                  value={files} 
                  responsiveLayout="scroll"
                  stripedRows
                  showGridlines
                  emptyMessage="No hay archivos disponibles"
                >
                  <Column 
                    field="name" 
                    header="Nombre del Archivo" 
                    sortable
                    style={{ minWidth: '200px' }}
                  />
                  <Column 
                    field="type" 
                    header="Tipo" 
                    body={typeTemplate}
                    sortable
                    style={{ width: '120px' }}
                  />
                  <Column 
                    field="size" 
                    header="Tamaño" 
                    body={sizeTemplate}
                    sortable
                    style={{ width: '100px' }}
                  />
                  <Column 
                    field="last_modified" 
                    header="Última Modificación" 
                    body={dateTemplate}
                    sortable
                    style={{ width: '180px' }}
                  />
                  <Column 
                    header="Acciones" 
                    body={actionTemplate}
                    style={{ width: '120px' }}
                  />
                </DataTable>
              </Card>
            )}
          </AccordionTab>

          {/* File Upload Section */}
          <AccordionTab header="Subir Nuevo Archivo" className="datos-tab">
            <Card className="upload-card">
              <div className="upload-content">
                <h4>Subir archivo de datos</h4>
                <p>Sube un archivo CSV o Excel para {projectData?.unidad || 'esta escuela'}</p>
                
                <div className="upload-form">
                  <div className="form-group">
                    <label
                      htmlFor="dataset_type"
                      style={{
                        marginBottom: "10px",
                        display: "block",
                        fontWeight: "bold",
                      }}
                    >
                      Tipo de Dataset *
                    </label>
                    <Dropdown
                      id="dataset_type"
                      value={uploadForm.dataset_type}
                      onChange={(e) =>
                        setUploadForm({ ...uploadForm, dataset_type: e.value })
                      }
                      options={datasetOptions}
                      placeholder="Seleccionar tipo"
                      className="input-field"
                      style={{ width: "100%" }}
                    />
                  </div>

                  <FloatLabel style={{ marginTop: "20px" }}>
                    <InputText
                      id="version"
                      value={uploadForm.version}
                      onChange={(e) =>
                        setUploadForm({ ...uploadForm, version: e.target.value })
                      }
                      placeholder="Ej. 2024"
                      className="input-field"
                      required
                    />
                    <label htmlFor="version">Versión *</label>
                  </FloatLabel>

                  <div className="form-group" style={{ marginTop: "20px" }}>
                    <label
                      htmlFor="file"
                      style={{
                        marginBottom: "10px",
                        display: "block",
                        fontWeight: "bold",
                      }}
                    >
                      Archivo CSV/Excel *
                    </label>
                    <input
                      type="file"
                      id="file"
                      ref={fileInputRef}
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileChange}
                      className="input-field"
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                      }}
                    />
                    <small
                      style={{
                        color: "#666",
                        fontSize: "12px",
                        marginTop: "5px",
                        display: "block",
                      }}
                    >
                      El archivo debe llamarse: {uploadForm.dataset_type}_
                      {uploadForm.version || "VERSION"}.csv o .xlsx
                    </small>
                  </div>

                  <div style={{ marginTop: "20px", textAlign: "center" }}>
                    <Button
                      label="Subir Archivo"
                      icon="pi pi-upload"
                      onClick={handleFileUpload}
                      loading={uploadLoading}
                      disabled={
                        !uploadForm.version ||
                        !uploadForm.file
                      }
                      className="p-button-success"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </AccordionTab>
        </Accordion>
      </div>
    );
  };

  const analyticsContent = () => {
    const renderAnalyticsResults = () => {
      if (!analyticsResults) return null;

      const { poblacion, resultados } = analyticsResults;

      return (
        <Card style={{ marginTop: '1rem' }}>
          <h4>Resultados del Análisis</h4>
          <div className="analytics-results">
            <div className="population-info">
              <h5>Información de la Población</h5>
              <p><strong>Dataset:</strong> {poblacion.dataset}</p>
              <p><strong>Programa:</strong> {poblacion.programa}</p>
              {poblacion.n && <p><strong>Tamaño de muestra:</strong> {poblacion.n}</p>}
            </div>

            {resultados.kpis && (
              <div className="kpis-section">
                <h5>KPIs</h5>
                <div className="kpis-grid">
                  {Object.entries(resultados.kpis).map(([key, value]) => (
                    <div key={key} className="kpi-card">
                      <div className="kpi-label">{key.replace(/_/g, ' ').toUpperCase()}</div>
                      <div className="kpi-value">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {resultados.distribuciones && (
              <div className="distributions-section">
                <h5>Distribuciones</h5>
                {Object.entries(resultados.distribuciones).map(([key, distribution]) => (
                  <div key={key} className="distribution-card">
                    <h6>{key.replace(/_/g, ' ').toUpperCase()}</h6>
                    <DataTable 
                      value={Object.entries(distribution).map(([k, v]) => ({ categoria: k, valor: v }))}
                      size="small"
                    >
                      <Column field="categoria" header="Categoría" />
                      <Column field="valor" header="Valor" />
                    </DataTable>
                  </div>
                ))}
              </div>
            )}

            {resultados.tablas && (
              <div className="tables-section">
                <h5>Tablas</h5>
                {Object.entries(resultados.tablas).map(([key, table]) => (
                  <div key={key} className="table-card">
                    <h6>{key.replace(/_/g, ' ').toUpperCase()}</h6>
                    <DataTable 
                      value={table}
                      size="small"
                      scrollable
                      scrollHeight="300px"
                    >
                      {table.length > 0 && Object.keys(table[0]).map(col => (
                        <Column key={col} field={col} header={col.replace(/_/g, ' ').toUpperCase()} />
                      ))}
                    </DataTable>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      );
    };

    const renderNarrative = () => {
      if (!narrative) return null;

      return (
        <Card style={{ marginTop: '1rem' }}>
          <h4>Narrativa Generada</h4>
          <div className="narrative-content">
            {narrative ? (
              <div style={{ 
                padding: '1rem', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '8px',
                lineHeight: '1.6'
              }}>
                {narrative}
              </div>
            ) : (
              <p>No hay narrativa disponible. La funcionalidad de narrativa requiere configuración adicional.</p>
            )}
          </div>
        </Card>
      );
    };

    return (
      <div className="analytics-content">
        <Accordion multiple activeIndex={[0]} className="analytics-accordion">
          {/* Analytics Configuration */}
          <AccordionTab header="Configurar Análisis" className="analytics-tab">
            <Card className="analytics-config-card">
              <h4>Configuración del Análisis</h4>
              <p>Configure los parámetros para analizar los datos de {projectData?.unidad || 'esta escuela'}</p>
              
              <div className="analytics-form">
                <div className="form-group">
                  <label htmlFor="analytics-dataset" style={{ marginBottom: "10px", display: "block", fontWeight: "bold" }}>
                    Dataset *
                  </label>
                  <Dropdown
                    id="analytics-dataset"
                    value={analyticsForm.dataset}
                    onChange={(e) =>
                      setAnalyticsForm({ ...analyticsForm, dataset: e.value })
                    }
                    options={datasetOptions}
                    placeholder="Seleccionar dataset"
                    className="input-field"
                    style={{ width: "100%" }}
                  />
                </div>

                <div className="form-group" style={{ marginTop: "20px" }}>
                  <label htmlFor="analytic-type" style={{ marginBottom: "10px", display: "block", fontWeight: "bold" }}>
                    Tipo de Análisis *
                  </label>
                  <Dropdown
                    id="analytic-type"
                    value={analyticsForm.tipo_analitica}
                    onChange={(e) =>
                      setAnalyticsForm({ ...analyticsForm, tipo_analitica: e.value })
                    }
                    options={analyticTypeOptions}
                    placeholder="Seleccionar tipo"
                    className="input-field"
                    style={{ width: "100%" }}
                  />
                </div>

                <div className="form-group" style={{ marginTop: "20px" }}>
                  <label htmlFor="distributions" style={{ marginBottom: "10px", display: "block", fontWeight: "bold" }}>
                    Distribuciones (Opcional)
                  </label>
                  <Dropdown
                    id="distributions"
                    value={analyticsForm.distribuciones}
                    onChange={(e) =>
                      setAnalyticsForm({ ...analyticsForm, distribuciones: e.value })
                    }
                    options={distributionOptions}
                    placeholder="Seleccionar distribuciones"
                    className="input-field"
                    style={{ width: "100%" }}
                    multiple
                  />
                </div>

                <div style={{ marginTop: "30px", textAlign: "center" }}>
                  <Button
                    label="Ejecutar Análisis"
                    icon="pi pi-play"
                    onClick={handleRunAnalytics}
                    loading={analyticsLoading}
                    className="p-button-success"
                    style={{ marginRight: "10px" }}
                  />
                  <Button
                    label="Generar Narrativa"
                    icon="pi pi-file-edit"
                    onClick={handleGenerateNarrative}
                    loading={narrativeLoading}
                    disabled={!analyticsResults}
                    className="p-button-info"
                  />
                </div>
              </div>
            </Card>
          </AccordionTab>

          {/* Analytics Results */}
          <AccordionTab header="Resultados" className="analytics-tab">
            {analyticsLoading ? (
              <div className="loading-container">
                <ProgressSpinner />
                <p>Ejecutando análisis...</p>
              </div>
            ) : (
              <div>
                {!analyticsResults ? (
                  <div className="no-results-message">
                    <p>No hay resultados disponibles.</p>
                    <p>Configure y ejecute un análisis en la pestaña anterior para ver los resultados aquí.</p>
                  </div>
                ) : (
                  renderAnalyticsResults()
                )}
                {renderNarrative()}
              </div>
            )}
          </AccordionTab>
        </Accordion>
      </div>
    );
  };

  return (
    <div className="proyecto-container">
      <Button
        onClick={() => setSidebarVisible(true)}
        icon="pi pi-bars"
        className="sidebar-toggle"
      />
      <SideBar
        visible={sidebarVisible}
        onHide={() => setSidebarVisible(false)}
      />
      
      <div className="proyecto-header">
        <h1 className="page-title">
          {loading ? 'Cargando...' : (projectData?.process_name || 'Proyecto')}
        </h1>
        {!loading && !error && projectData && (
          <Button
            icon={isEditing ? "pi pi-save" : "pi pi-pencil"}
            label={isEditing ? "Guardar" : "Editar"}
            className="p-button-rounded p-button-primary edit-btn"
            loading={saveLoading}
            disabled={saveLoading || dropdownsLoading}
            onClick={() => {
              if (isEditing) handleSave();
              else setIsEditing(true);
            }}
          />
        )}
      </div>

      <div className="proyecto-accordion">
        <TabView className="proyecto-tab">
          <TabPanel header="Resumen" className="proyecto-card">
            {resumenContent()}
          </TabPanel>
          <TabPanel header="Datos" className="proyecto-card">
            {datosContent()}
          </TabPanel>
          <TabPanel header="Analytics" className="proyecto-card">
            {analyticsContent()}
          </TabPanel>
        </TabView>
      </div>
    </div>
  );
};

export default Proyecto;
