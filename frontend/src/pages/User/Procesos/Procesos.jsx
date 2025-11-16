import React, { useState, useEffect } from "react";
import { Card } from "primereact/card";
import SideBar from "../../../components/SideBar";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ProgressSpinner } from "primereact/progressspinner";
import { ProcListAPI, UserListAPI } from "../../../services/api";
import { useNavigate } from "react-router-dom";
import "./Procesos.css";

const UserProcesos = () => {
  const [visible, setVisible] = useState(false);
  const [processes, setProcesses] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load current user
      const user = await UserListAPI.getCurrentUser();
      setCurrentUser(user);

      // Load user's assigned processes
      const userProcesses = await ProcListAPI.getUserProcList();
      setProcesses(userProcesses);

    } catch (err) {
      console.error('Error loading processes:', err);
      setError('Error loading your processes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProcess = (processId) => {
    navigate(`/user/proyecto?process_id=${processId}`);
  };

  const processStatusBodyTemplate = (rowData) => {
    const status = rowData.analysis_completed ? 'Completado' : 'Pendiente';
    const severity = rowData.analysis_completed ? 'success' : 'warning';
    
    return (
      <span className={`status-badge status-${severity}`}>
        {status}
      </span>
    );
  };

  const actionsBodyTemplate = (rowData) => {
    return (
      <div className="action-buttons">
        <Button
          icon="pi pi-eye"
          className="p-button-rounded p-button-outlined p-button-info"
          onClick={() => handleViewProcess(rowData.id)}
          tooltip="Ver Análisis"
        />
      </div>
    );
  };

  const dateBodyTemplate = (rowData) => {
    return new Date(rowData.created_at).toLocaleDateString('es-ES');
  };

  if (loading) {
    return (
      <div className="procesos-container">
        <div className="loading-container">
          <ProgressSpinner />
          <p>Cargando tus procesos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="procesos-container">
      <Button
        onClick={() => setVisible(true)}
        icon="pi pi-bars"
        className="sidebar-toggle"
      />
      <SideBar visible={visible} onHide={() => setVisible(false)} />

      <div className="procesos-content">
        <h1 className="page-title">Mis Procesos</h1>

        {/* User Info Header */}
        <Card className="user-info-header">
          <div className="user-header-content">
            <div className="user-info">
              <h3>Procesos Asignados a: {currentUser?.username}</h3>
              <p>Email: {currentUser?.email} | Rol: {currentUser?.role}</p>
            </div>
            <div className="process-stats">
              <span className="stat-item">
                <strong>Total:</strong> {processes.length}
              </span>
              <span className="stat-item">
                <strong>Completados:</strong> {processes.filter(p => p.analysis_completed).length}
              </span>
              <span className="stat-item">
                <strong>Pendientes:</strong> {processes.filter(p => !p.analysis_completed).length}
              </span>
            </div>
          </div>
        </Card>

        {/* Processes Table */}
        <Card title="Lista de Mis Procesos" className="processes-card">
          {error && (
            <div className="error-message">
              <p>{error}</p>
              <Button 
                label="Reintentar" 
                icon="pi pi-refresh"
                onClick={loadData}
                className="p-button-secondary"
              />
            </div>
          )}

          {processes.length > 0 ? (
            <DataTable
              value={processes}
              paginator
              rows={10}
              responsiveLayout="scroll"
              className="user-processes-table"
              emptyMessage="No se encontraron procesos asignados."
            >
              <Column 
                field="process_name" 
                header="Nombre del Proceso" 
                sortable 
                style={{ minWidth: '200px' }}
              />
              <Column 
                field="school_name" 
                header="Escuela" 
                sortable 
                style={{ minWidth: '150px' }}
              />
              <Column 
                field="dataset_type" 
                header="Tipo de Dataset" 
                sortable 
                style={{ minWidth: '120px' }}
              />
              <Column 
                field="version" 
                header="Versión" 
                sortable 
                style={{ minWidth: '100px' }}
              />
              <Column 
                field="created_at" 
                header="Fecha de Creación" 
                body={dateBodyTemplate} 
                sortable 
                style={{ minWidth: '120px' }}
              />
              <Column 
                field="analysis_completed" 
                header="Estado" 
                body={processStatusBodyTemplate} 
                style={{ minWidth: '100px' }}
              />
              <Column 
                body={actionsBodyTemplate} 
                header="Acciones" 
                style={{ width: '100px' }}
              />
            </DataTable>
          ) : (
            <div className="no-processes-message">
              <i className="pi pi-info-circle" style={{ fontSize: '2rem', color: '#6c757d' }}></i>
              <h4>No tienes procesos asignados</h4>
              <p>Actualmente no tienes procesos asignados para analizar.</p>
              <p>Contacta al administrador del sistema para que te asigne procesos.</p>
            </div>
          )}
        </Card>

        {/* Help Card */}
        <Card title="¿Necesitas ayuda?" className="help-card">
          <div className="help-content">
            <div className="help-item">
              <i className="pi pi-eye"></i>
              <p><strong>Ver Análisis:</strong> Haz clic en el icono de ojo para ver los detalles y resultados del análisis de un proceso.</p>
            </div>
            <div className="help-item">
              <i className="pi pi-question-circle"></i>
              <p><strong>¿No ves tus procesos?</strong> Solo puedes ver los procesos que te han sido asignados específicamente.</p>
            </div>
            <div className="help-item">
              <i className="pi pi-phone"></i>
              <p><strong>Soporte:</strong> Si necesitas que te asignen más procesos, contacta al administrador del sistema.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UserProcesos;