import React, { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Button } from "primereact/button";
import { TabView, TabPanel } from 'primereact/tabview';
import { Card } from 'primereact/card';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { FloatLabel } from 'primereact/floatlabel';
import { Accordion, AccordionTab } from "primereact/accordion";
import SideBar from '../../../components/SideBar';
import { ProcListAPI, UserListAPI, AgentAPI, ReportsAPI, statisticsAPI } from '../../../services/api';
import auditLogger from '../../../utils/audit';
import "./Proyecto.css";

const UserProyecto = () => {
  const location = useLocation();
  const { id } = useParams();
  
  // Get process_id from query params (as passed from User Procesos page)
  const urlParams = new URLSearchParams(location.search);
  const processId = urlParams.get('process_id') || id;
  
  console.log("LOCATION:", location);
  console.log("Process ID from params:", processId);

  const process = location.state?.process;

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [projectData, setProjectData] = useState(process || null);
  const [loading, setLoading] = useState(!process);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [dropdownsLoading, setDropdownsLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [filesError, setFilesError] = useState(null);

  // Dataset options for upload
  const datasetOptions = [
    { label: "Egresados", value: "egresados" },
    { label: "Profesores", value: "profesores" },
  ];

  // Analytics state
  const [analyticsForm, setAnalyticsForm] = useState({
    dataset: "egresados",
    tipo_analitica: "resumen_general",
    distribuciones: [], // Para resumen general y perfil poblacion
    variable_principal: "", // Para detalle de pregunta (una sola variable)
    filtros: {}
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsResults, setAnalyticsResults] = useState(null);
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [narrative, setNarrative] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Dynamic questions state for "detalle de pregunta"
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  // Helper functions for filters
  const handleFilterChange = (field, value) => {
    const newFilters = { ...analyticsForm.filtros };
    if (value && value.length > 0) {
      newFilters[field] = value;
    } else {
      delete newFilters[field];
    }
    setAnalyticsForm({ ...analyticsForm, filtros: newFilters });
  };

  const clearFilters = () => {
    setAnalyticsForm({ 
      ...analyticsForm, 
      filtros: {} 
    });
  };

  // Analytics options
  const analyticTypeOptions = [
    { label: "Resumen General", value: "resumen_general" },
    { label: "Detalle de Pregunta", value: "detalle_pregunta" },
    { label: "Perfil de Población", value: "perfil_poblacion" },
  ];

  const distributionOptions = [
    // Información demográfica básica
    { label: "Sexo", value: "ipg01_3_sexo" },
    { label: "Edad", value: "ipg03_5_edad" },
    { label: "Estado Civil", value: "ipg02_4_estado_civil" },
    { label: "Provincia de Residencia", value: "ipg04_6_provincia_de_residencia_actual" },
    
    // Información académica
    { label: "Año de Graduación", value: "ig02_2_ano_de_graduacion" },
    { label: "Programa de Estudio", value: "ig01_1_programa_de_estudio_de_la_cual_se_graduo" },
    { label: "Modalidad de Estudio", value: "ig03_3_la_modalidad_de_estudio_de_su_programa_fue" },
    { label: "Becas", value: "ig06_6_durante_sus_estudios_conto_con_alguna_beca_o_ayuda_economica" },
    { label: "Trabajo Durante Estudios", value: "ig07_7_durante_sus_estudios_universitarios_trabajo" },
    
    // Información laboral actual
    { label: "Condición Laboral", value: "ipg05_7_cual_es_su_condicion_laboral_actual" },
    { label: "Satisfacción Trabajo", value: "ipg06_8_que_tan_satisfecho_se_encuentra_con_su_trabajo_actual" },
    { label: "Relación Estudios-Trabajo", value: "ipg07_9_que_relacion_tiene_su_trabajo_actual_con_los_estudios_que_realizo" },
    { label: "Salario", value: "ipg08_10_cual_es_su_salario_liquido_mensual_aproximado" },
    { label: "Tiempo Encontrar Trabajo", value: "ipg09_11_cuanto_tiempo_le_tomo_encontrar_trabajo_despues_de_graduarse" },
    
    // Evaluación de la carrera
    { label: "Recomendaría Carrera", value: "epg01_1_recomendaria_a_un_bachiller_estudiar_la_carrera_que_usted_estudio" },
    { label: "Volvería a Estudiar", value: "epg02_2_si_tuviera_la_oportunidad_volveria_a_estudiar_la_misma_carrera" },
    { label: "Volvería Misma U", value: "epg03_3_si_tuviera_la_oportunidad_volveria_a_estudiar_en_la_misma_universidad" },
    { label: "Satisfacción Formación", value: "epg04_4_que_tan_satisfecho_esta_con_la_formacion_recibida_en_la_universidad" },
    
    // Competencias desarrolladas
    { label: "Competencias Comunicativas", value: "cfg01_1_competencias_comunicativas_en_segunda_lengua_ingles" },
    { label: "Competencias Ciudadanas", value: "cfg02_2_competencias_ciudadanas" },
    { label: "Pensamiento Crítico", value: "cfg03_3_pensamiento_critico" },
    { label: "Solución Problemas", value: "cfg04_4_solucion_de_problemas" },
    { label: "Trabajo en Equipo", value: "cfg05_5_trabajo_en_equipo" },
    { label: "Comunicación Oral", value: "cfg06_6_comunicacion_oral_y_escrita_en_la_propia_lengua" },
    { label: "Responsabilidad Social", value: "cfg07_7_responsabilidad_social_y_compromiso_ciudadano" },
    
    // Satisfacción aspectos específicos
    { label: "Satisfacción Plan Estudios", value: "esg01_1_plan_de_estudios" },
    { label: "Satisfacción Docentes", value: "esg02_2_los_contenidos_del_programa_fueron_actualizados" },
    { label: "Satisfacción Infraestructura", value: "esg03_3_los_docentes_utilizaron_tecnologias_y_herramientas_apropiadas" },
    { label: "Satisfacción Recursos", value: "esg04_4_los_metodos_de_ensenanza_fueron_adecuados_para_el_aprendizaje" }
  ];

  // Estado options for dropdowns
  const estadoOptions = [
    { label: "Pendiente", value: "pending" },
    { label: "En Progreso", value: "in-progress" },
    { label: "Completado", value: "completed" },
    { label: "Cancelado", value: "cancelled" }
  ];

  // Filter options
  const filterOptions = {
    sexo: [
      { label: "Hombre", value: "Hombre" },
      { label: "Mujer", value: "Mujer" }
    ],
    estado_civil: [
      { label: "Soltero", value: "Soltero" },
      { label: "Casado", value: "Casado" },
      { label: "Union libre", value: "Union libre" },
      { label: "Divorciado", value: "Divorciado" },
      { label: "Viudo", value: "Viudo" }
    ],
    condicion_laboral: [
      { label: "Solo trabaja", value: "Solo trabaja" },
      { label: "Solo estudia", value: "Solo estudia" },
      { label: "Trabaja y estudia", value: "Trabaja y estudia" },
      { label: "Busca trabajo", value: "Busca trabajo" },
      { label: "No trabaja ni estudia ni busca trabajo", value: "No trabaja ni estudia ni busca trabajo" }
    ]
  };

  // Get current user for access control
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    console.log("UseEffect triggered with processId:", processId);
    checkUserAccess();
    
    if (process) {
      console.log("Using process from location.state:", process);
      setProjectData(process);
      loadFiles(process.id);
    } else if (processId) {
      console.log("Fetching project data for ID:", processId);
      fetchProjectData(processId);
    } else {
      console.log("No process ID found");
      setError('No se especificó un ID de proceso válido');
      setLoading(false);
    }
  }, [processId, process]);

  // Load available questions when analysis type is "detalle_pregunta" or dataset changes
  useEffect(() => {
    if (analyticsForm.tipo_analitica === "detalle_pregunta" && analyticsForm.dataset) {
      loadAvailableQuestions(analyticsForm.dataset);
    } else {
      // Clear questions if not detalle_pregunta
      setAvailableQuestions([]);
      // Also clear variable_principal if switching away from detalle_pregunta
      if (analyticsForm.variable_principal) {
        setAnalyticsForm(prev => ({ ...prev, variable_principal: "" }));
      }
    }
  }, [analyticsForm.tipo_analitica, analyticsForm.dataset]);

  const checkUserAccess = async () => {
    try {
      const user = await UserListAPI.getCurrentUser();
      console.log("Current user loaded:", user);
      setCurrentUser(user);
    } catch (err) {
      console.error('Error getting current user:', err);
    }
  };

  const fetchProjectData = async (projectId) => {
    try {
      console.log("fetchProjectData called with:", projectId);
      setLoading(true);
      setError(null);
      
      // Get current user info for debugging
      const currentUser = await UserListAPI.getCurrentUser();
      console.log("Current user for access check:", currentUser);
      
      // Get user processes to check if this user has access to this process
      console.log("Fetching user processes...");
      const userProcesses = await ProcListAPI.getUserProcList();
      console.log("User processes received:", userProcesses);
      console.log("Number of accessible processes:", userProcesses.length);
      
      const process = userProcesses.find(p => p.id.toString() === projectId.toString());
      console.log("Looking for process with ID:", projectId);
      console.log("Found process:", process);
      
      if (!process) {
        console.log("Process not found. Available process IDs:", userProcesses.map(p => p.id));
        
        // Try to get the process directly to see if it exists at all
        try {
          const directProcess = await ProcListAPI.getProcById(projectId);
          console.log("Process exists but no access:", directProcess);
          setError(`No tienes acceso a este proceso. El proceso pertenece a: ${directProcess.encargado || 'No asignado'}`);
        } catch (directError) {
          console.log("Process doesn't exist at all:", directError);
          setError('El proceso no existe o ha sido eliminado');
        }
        return;
      }
      
      setProjectData(process);
      console.log("Project data set:", process);
      
      // Load files for this process
      await loadFiles(process.id);
      
    } catch (err) {
      console.error('Error fetching project:', err);
      setError('Error al cargar el proyecto: ' + err.message);
    } finally {
      setLoading(false);
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

  // Load available questions for "detalle de pregunta" analysis
  const loadAvailableQuestions = async (dataset) => {
    if (!dataset) return;
    
    try {
      setQuestionsLoading(true);
      const response = await statisticsAPI.getAvailableColumns(dataset);
      console.log('Available questions loaded:', response);
      
      // Filter only question columns (exclude metadata columns and skip first 3 columns)
      const questionOptions = response.columns
        .slice(5) // Skip the first 3 columns
        .filter(col => col.is_question) // Only actual survey questions
        .map(col => ({
          label: col.column_name.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
          value: col.column_name
        }));
      
      setAvailableQuestions(questionOptions);
    } catch (err) {
      console.error('Error loading available questions:', err);
      setAvailableQuestions([]);
    } finally {
      setQuestionsLoading(false);
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

      // Validate required fields
      if (!analyticsForm.dataset) {
        alert("Debe seleccionar un dataset");
        return;
      }

      if (!analyticsForm.tipo_analitica) {
        alert("Debe seleccionar un tipo de análisis");
        return;
      }

      // For detalle_pregunta, variable_principal is required
      if (analyticsForm.tipo_analitica === "detalle_pregunta") {
        if (!analyticsForm.variable_principal) {
          alert("Para análisis de detalle de pregunta debe seleccionar una variable principal");
          return;
        }
      }

      // Prepare distribuciones based on analysis type
      let distribuciones;
      if (analyticsForm.tipo_analitica === "detalle_pregunta") {
        // Para detalle_pregunta, enviar la variable principal como array de un elemento
        distribuciones = [analyticsForm.variable_principal];
      } else {
        // Para otros tipos, usar las distribuciones seleccionadas
        distribuciones = analyticsForm.distribuciones || [];
      }

      // Prepare payload for analytics (matching Admin structure)
      const payload = {
        poblacion: {
          dataset: analyticsForm.dataset,
          programa: programa,
          filtros: analyticsForm.filtros,
        },
        distribuciones: distribuciones,
        tipo_analitica: analyticsForm.tipo_analitica
      };

      console.log('Analytics payload:', payload);
      console.log('DEBUG - analyticsForm state:', analyticsForm);
      console.log('DEBUG - distribuciones value:', distribuciones);
      console.log('DEBUG - distribuciones type:', typeof distribuciones);

      const results = await AgentAPI.getAnalytics(payload);
      setAnalyticsResults(results);

      console.log("Analytics results:", results);

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

  const handleDownloadPDF = async () => {
    if (!analyticsResults) {
      alert('Primero ejecute un análisis.');
      return;
    }

    try {
      setDownloadLoading(true);

      // Prepare payload for PDF generation
      let payload = {};
      // If the analysis is a detailed question (single variable), send as conjuntos
      if (analyticsForm.tipo_analitica === 'detalle_pregunta') {
        // conjuntos expects array of [resultado_json, analisis_str]
        payload = {
          conjuntos: [ [ analyticsResults, narrative || '' ] ]
        };
      } else {
        payload = {
          resultado: analyticsResults,
          analisis: narrative || ''
        };
      }

      // Call backend reports endpoint
      const response = await ReportsAPI.generatePDF(payload);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte_analitica_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Log audit action for PDF download
      await auditLogger.fileDownload('reporte_analitica.pdf', projectData?.process_name, projectData?.school_id);

    } catch (error) {
      console.error('Error generating/downloading PDF:', error);
      alert('Error al generar PDF: ' + error.message);
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleDownloadFile = async (fileData) => {
    try {
      console.log('Downloading file:', fileData);
      const response = await ProcListAPI.downloadFile(fileData.path, fileData.filename);
      
      // Create download link
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileData.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading file:', err);
      setError('Error al descargar el archivo: ' + err.message);
    }
  };

  const handleViewFile = async (fileData) => {
    try {
      console.log('Viewing file:', fileData);
      // Implement file viewing logic here
      // This could open a modal with file content or navigate to a view page
    } catch (err) {
      console.error('Error viewing file:', err);
      setError('Error al visualizar el archivo: ' + err.message);
    }
  };

  const getEstadoSeverity = (estado) => {
    switch (estado) {
      case 'completed':
        return 'success';
      case 'in-progress':
        return 'warning';
      case 'cancelled':
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
          <i className="pi pi-exclamation-triangle" style={{ fontSize: '2rem', color: '#e74c3c', marginBottom: '1rem' }}></i>
          <p className="error-message">{error}</p>
          <Button 
            label="Reintentar" 
            onClick={() => {
              if (processId) {
                fetchProjectData(processId);
              } else {
                setError('No se especificó un ID de proceso válido');
              }
            }}
            className="p-button-outlined"
          />
          <Button 
            label="Volver a Procesos" 
            onClick={() => window.history.back()}
            className="p-button-text"
            style={{ marginLeft: '1rem' }}
          />
        </div>
      );
    }

    if (!projectData) {
      return (
        <div className="error-container">
          <i className="pi pi-info-circle" style={{ fontSize: '2rem', color: '#f39c12', marginBottom: '1rem' }}></i>
          <p>No se encontraron datos del proyecto</p>
          <p>ID del proceso: {processId}</p>
          <Button 
            label="Volver a Procesos" 
            onClick={() => window.history.back()}
            className="p-button-outlined"
          />
        </div>
      );
    }

    return (
      <div className="resumen-content">
        <div className="project-info-grid">
          <Card className="info-card">
            <div className="info-item">
              <label>Nombre del Proyecto:</label>
              <span className="info-value">{projectData.process_name}</span>
            </div>
            
            <div className="info-item">
              <label>Encargado:</label>
              <span className="info-value">{projectData.encargado || 'No asignado'}</span>
            </div>
            
            <div className="info-item">
              <label>Estado:</label>
              <Tag 
                value={projectData.estado || 'Sin estado'} 
                severity={getEstadoSeverity(projectData.estado)}
                className="estado-tag"
              />
            </div>
            
            <div className="info-item">
              <label>Unidad:</label>
              <span className="info-value">{projectData.unidad}</span>
            </div>
            
            <div className="info-item">
              <label>Fecha de Creación:</label>
              <span className="info-value">
                {projectData.created_at ? new Date(projectData.created_at).toLocaleDateString('es-ES') : 'No disponible'}
              </span>
            </div>
            
            <div className="info-item">
              <label>Última Actualización:</label>
              <span className="info-value">
                {projectData.updated_at ? new Date(projectData.updated_at).toLocaleDateString('es-ES') : 'No disponible'}
              </span>
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
                    style={{ minWidth: '100px' }}
                  />
                  <Column 
                    field="size" 
                    header="Tamaño" 
                    body={sizeTemplate}
                    sortable 
                    style={{ minWidth: '100px' }}
                  />
                  <Column 
                    field="last_modified" 
                    header="Última Modificación" 
                    body={dateTemplate}
                    sortable 
                    style={{ minWidth: '150px' }}
                  />
                  <Column 
                    header="Acciones" 
                    body={actionTemplate}
                    exportable={false}
                    style={{ minWidth: '100px' }}
                  />
                </DataTable>
              </Card>
            )}
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
                    onChange={(e) => {
                      // Limpiar variables dependientes cuando cambia el tipo
                      setAnalyticsForm({ 
                        ...analyticsForm, 
                        tipo_analitica: e.value,
                        distribuciones: [],
                        variable_principal: ""
                      });
                    }}
                    options={analyticTypeOptions}
                    placeholder="Seleccionar tipo"
                    className="input-field"
                    style={{ width: "100%" }}
                  />
                </div>

                {/* Variable Selection based on Analysis Type */}
                {analyticsForm.tipo_analitica === "detalle_pregunta" ? (
                  <div className="form-group" style={{ marginTop: "20px" }}>
                    <label htmlFor="variable_principal" style={{ marginBottom: "10px", display: "block", fontWeight: "bold" }}>
                      Variable a Analizar *
                    </label>
                    <small style={{ color: "#666", fontSize: "12px", display: "block", marginBottom: "5px" }}>
                      Seleccione UNA pregunta de la encuesta cargada para análisis detallado
                    </small>
                    <Dropdown
                      id="variable_principal"
                      value={analyticsForm.variable_principal}
                      onChange={(e) =>
                        setAnalyticsForm({ ...analyticsForm, variable_principal: e.value })
                      }
                      options={availableQuestions}
                      placeholder={questionsLoading ? "Cargando preguntas..." : "Seleccionar pregunta"}
                      disabled={questionsLoading || availableQuestions.length === 0}
                      className="input-field"
                      style={{ width: "100%" }}
                    />
                    {questionsLoading && (
                      <small style={{ color: "#666", fontSize: "11px", display: "block", marginTop: "3px" }}>
                        <i className="pi pi-spin pi-spinner" style={{ marginRight: "5px" }}></i>
                        Cargando preguntas disponibles...
                      </small>
                    )}
                    {!questionsLoading && availableQuestions.length === 0 && analyticsForm.dataset && (
                      <small style={{ color: "#e74c3c", fontSize: "11px", display: "block", marginTop: "3px" }}>
                        No se encontraron preguntas para el dataset seleccionado
                      </small>
                    )}
                  </div>
                ) : (
                  <div className="form-group" style={{ marginTop: "20px" }}>
                    <label htmlFor="distributions" style={{ marginBottom: "10px", display: "block", fontWeight: "bold" }}>
                      Variables Adicionales (Opcional)
                    </label>
                    <small style={{ color: "#666", fontSize: "12px", display: "block", marginBottom: "5px" }}>
                      Para resumen general: deje vacío para KPIs básicos, o seleccione variables para ver distribuciones específicas
                    </small>
                    <Dropdown
                      id="distributions"
                      value={analyticsForm.distribuciones}
                      onChange={(e) => {
                        console.log("Distribuciones onChange:", e.value);
                        setAnalyticsForm({ ...analyticsForm, distribuciones: Array.isArray(e.value) ? e.value : (e.value ? [e.value] : []) })
                      }}
                      options={distributionOptions}
                      placeholder="Sin variables adicionales"
                      className="input-field"
                      style={{ width: "100%" }}
                      multiple
                      showClear
                    />
                  </div>
                )}

                {/* Advanced Filters Section */}
                <div className="form-group" style={{ marginTop: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                    <label style={{ fontWeight: "bold", marginRight: "10px" }}>
                      Filtros Avanzados (Opcional)
                    </label>
                    {Object.keys(analyticsForm.filtros).length > 0 && (
                      <span 
                        style={{ 
                          backgroundColor: "#007bff", 
                          color: "white", 
                          padding: "2px 8px", 
                          borderRadius: "12px", 
                          fontSize: "11px",
                          marginRight: "10px"
                        }}
                      >
                        {Object.keys(analyticsForm.filtros).length} filtro{Object.keys(analyticsForm.filtros).length > 1 ? 's' : ''} activo{Object.keys(analyticsForm.filtros).length > 1 ? 's' : ''}
                      </span>
                    )}
                    <Button
                      icon={showAdvancedFilters ? "pi pi-chevron-up" : "pi pi-chevron-down"}
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className="p-button-text p-button-sm"
                      style={{ padding: "0.25rem" }}
                    />
                  </div>
                  
                  {!showAdvancedFilters && Object.keys(analyticsForm.filtros).length > 0 && (
                    <div style={{ 
                      fontSize: "12px", 
                      color: "#666", 
                      backgroundColor: "#f0f8ff", 
                      padding: "8px", 
                      borderRadius: "4px",
                      marginBottom: "10px"
                    }}>
                      <strong>Filtros activos:</strong> {Object.entries(analyticsForm.filtros).map(([key, value]) => {
                        let label = key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
                        if (key === 'ipg01_3_sexo') label = 'Sexo';
                        if (key === 'ipg02_4_estado_civil') label = 'Estado Civil';
                        if (key === 'ipg05_7_cual_es_su_condicion_laboral_actual') label = 'Condición Laboral';
                        if (key === 'ig02_2_ano_de_graduacion') label = 'Años de Graduación';
                        
                        if (key === 'ig02_2_ano_de_graduacion') {
                          return `${label}: ${value.gte || '...'} - ${value.lte || '...'}`;
                        } else {
                          return `${label}: ${Array.isArray(value) ? value.join(', ') : value}`;
                        }
                      }).join(' | ')}
                    </div>
                  )}
                  
                  {showAdvancedFilters && (
                    <div style={{ border: "1px solid #ddd", padding: "15px", borderRadius: "8px", backgroundColor: "#f9f9f9" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                        <small style={{ color: "#666" }}>
                          Filtre la población para análisis más específicos
                        </small>
                        <Button
                          label="Limpiar Filtros"
                          onClick={clearFilters}
                          className="p-button-text p-button-sm"
                          style={{ padding: "0.25rem 0.5rem" }}
                        />
                      </div>

                      {/* Year Range Filter */}
                      <div style={{ marginBottom: "15px" }}>
                        <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                          Rango de Años de Graduación:
                        </label>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                          <InputNumber
                            placeholder="Desde"
                            value={analyticsForm.filtros['ig02_2_ano_de_graduacion']?.gte}
                            onValueChange={(e) => {
                              const newFilters = { ...analyticsForm.filtros };
                              if (!newFilters['ig02_2_ano_de_graduacion']) {
                                newFilters['ig02_2_ano_de_graduacion'] = {};
                              }
                              if (e.value) {
                                newFilters['ig02_2_ano_de_graduacion'].gte = e.value;
                              } else {
                                delete newFilters['ig02_2_ano_de_graduacion'].gte;
                                if (Object.keys(newFilters['ig02_2_ano_de_graduacion']).length === 0) {
                                  delete newFilters['ig02_2_ano_de_graduacion'];
                                }
                              }
                              setAnalyticsForm({ ...analyticsForm, filtros: newFilters });
                            }}
                            min={2000}
                            max={2025}
                            style={{ width: "120px" }}
                          />
                          <span>a</span>
                          <InputNumber
                            placeholder="Hasta"
                            value={analyticsForm.filtros['ig02_2_ano_de_graduacion']?.lte}
                            onValueChange={(e) => {
                              const newFilters = { ...analyticsForm.filtros };
                              if (!newFilters['ig02_2_ano_de_graduacion']) {
                                newFilters['ig02_2_ano_de_graduacion'] = {};
                              }
                              if (e.value) {
                                newFilters['ig02_2_ano_de_graduacion'].lte = e.value;
                              } else {
                                delete newFilters['ig02_2_ano_de_graduacion'].lte;
                                if (Object.keys(newFilters['ig02_2_ano_de_graduacion']).length === 0) {
                                  delete newFilters['ig02_2_ano_de_graduacion'];
                                }
                              }
                              setAnalyticsForm({ ...analyticsForm, filtros: newFilters });
                            }}
                            min={2000}
                            max={2025}
                            style={{ width: "120px" }}
                          />
                        </div>
                      </div>

                      {/* Sex Filter */}
                      <div style={{ marginBottom: "15px" }}>
                        <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                          Sexo:
                        </label>
                        <Dropdown
                          value={analyticsForm.filtros['ipg01_3_sexo']}
                          onChange={(e) => handleFilterChange('ipg01_3_sexo', e.value)}
                          options={filterOptions.sexo}
                          placeholder="Todos"
                          className="input-field"
                          style={{ width: "200px" }}
                          multiple
                          showClear
                        />
                      </div>

                      {/* Estado Civil Filter */}
                      <div style={{ marginBottom: "15px" }}>
                        <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                          Estado Civil:
                        </label>
                        <Dropdown
                          value={analyticsForm.filtros['ipg02_4_estado_civil']}
                          onChange={(e) => handleFilterChange('ipg02_4_estado_civil', e.value)}
                          options={filterOptions.estado_civil}
                          placeholder="Todos"
                          className="input-field"
                          style={{ width: "250px" }}
                          multiple
                          showClear
                        />
                      </div>

                      {/* Condición Laboral Filter */}
                      <div style={{ marginBottom: "10px" }}>
                        <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                          Condición Laboral:
                        </label>
                        <Dropdown
                          value={analyticsForm.filtros['ipg05_7_cual_es_su_condicion_laboral_actual']}
                          onChange={(e) => handleFilterChange('ipg05_7_cual_es_su_condicion_laboral_actual', e.value)}
                          options={filterOptions.condicion_laboral}
                          placeholder="Todos"
                          className="input-field"
                          style={{ width: "250px" }}
                          multiple
                          showClear
                        />
                      </div>
                    </div>
                  )}
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
                    style={{ marginRight: "10px" }}
                  />
                  <Button
                    label="Descargar PDF"
                    icon="pi pi-file-pdf"
                    onClick={handleDownloadPDF}
                    loading={downloadLoading}
                    disabled={!analyticsResults}
                    className="p-button-secondary"
                    style={{ marginLeft: "10px" }}
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
          {loading ? 'Cargando...' : (projectData?.process_name || `Proyecto ${processId || 'Sin ID'}`)}
        </h1>
        {/* Debug info - remove in production */}
        {!loading && processId && (
          <small style={{ color: '#666', fontSize: '0.8rem', display: 'block', marginTop: '0.5rem' }}>
            ID del proceso: {processId} | Datos cargados: {projectData ? 'Sí' : 'No'} | Error: {error ? 'Sí' : 'No'}
          </small>
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

export default UserProyecto;