import React, { useState, useEffect } from "react";
import { Card } from "primereact/card";
import SideBar from "../../../components/SideBar";
import { Button } from "primereact/button";
import { StatsCard, ErrorCard } from "../../../components/StatsCard";
import { UserListAPI, ProcListAPI } from "../../../services/api";
import { ProgressSpinner } from "primereact/progressspinner";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const UserDashboard = () => {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  // State for user info
  const [currentUser, setCurrentUser] = useState(null);
  const [userProcesses, setUserProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userKpis, setUserKpis] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load current user info
      const user = await UserListAPI.getCurrentUser();
      setCurrentUser(user);

      // Load user's processes
      const userProcs = await ProcListAPI.getUserProcList();
      setUserProcesses(userProcs);

      // Calculate user stats
      const stats = {
        totalProcesses: userProcs.length,
        activeProcesses: userProcs.filter(p => p.estado === 'activo').length,
        completedAnalyses: userProcs.filter(p => p.analysis_completed).length,
        pendingReviews: userProcs.filter(p => !p.analysis_completed).length
      };
      setUserKpis(stats);
      
    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessClick = (processId) => {
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

  const processActionsTemplate = (rowData) => {
    return (
      <Button
        icon="pi pi-eye"
        className="p-button-rounded p-button-text"
        onClick={() => handleProcessClick(rowData.id)}
        tooltip="Ver Detalles"
      />
    );
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-container">
          <ProgressSpinner />
          <p>Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-container">
          <ErrorCard message={error} />
          <Button 
            label="Reintentar" 
            icon="pi pi-refresh"
            onClick={loadUserData}
            className="p-mt-3"
          />
        </div>
      </div>
    );
  }

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
          <h2>Mi Dashboard</h2>
          <p>Bienvenido, {currentUser?.username}! Aquí tienes tu información personal.</p>
        </div>

        {/* User Info Card */}
        <Card className="user-info-card section-card">
          <div className="user-info-content">
            <div className="user-avatar">
              <i className="pi pi-user" style={{ fontSize: '2rem', color: '#667eea' }}></i>
            </div>
            <div className="user-details">
              <h3>{currentUser?.username}</h3>
              <p><strong>Email:</strong> {currentUser?.email}</p>
              <p><strong>Rol:</strong> {currentUser?.role === 'admin' ? 'Administrador' : 'Usuario'}</p>
              <p><strong>Estado:</strong> {currentUser?.is_active ? 'Activo' : 'Inactivo'}</p>
            </div>
          </div>
        </Card>

        {/* KPI Cards for User */}
        {userKpis && (
          <div className="kpi-grid">
            <StatsCard
              title="Mis Procesos"
              value={userKpis.totalProcesses}
              icon="pi pi-chart-bar"
              color="#3B82F6"
            />
            <StatsCard
              title="Análisis Completados"
              value={userKpis.completedAnalyses}
              icon="pi pi-check-circle"
              color="#10B981"
            />
            <StatsCard
              title="Procesos Activos"
              value={userKpis.activeProcesses}
              icon="pi pi-clock"
              color="#F59E0B"
            />
            <StatsCard
              title="Pendientes de Revisión"
              value={userKpis.pendingReviews}
              icon="pi pi-exclamation-triangle"
              color="#EF4444"
            />
          </div>
        )}

        {/* Main Content */}
        <div className="main-grid">
          {/* User's Processes */}
          <Card title="Mis Procesos" className="section-card">
            {userProcesses && userProcesses.length > 0 ? (
              <DataTable 
                value={userProcesses} 
                paginator 
                rows={10}
                className="user-processes-table"
              >
                <Column field="process_name" header="Nombre del Proceso" sortable />
                <Column field="school_name" header="Escuela" sortable />
                <Column field="dataset_type" header="Tipo de Dataset" sortable />
                <Column field="version" header="Versión" sortable />
                <Column 
                  field="analysis_completed" 
                  header="Estado" 
                  body={processStatusBodyTemplate} 
                />
                <Column 
                  body={processActionsTemplate}
                  header="Acciones"
                  style={{ width: '8rem' }}
                />
              </DataTable>
            ) : (
              <div className="no-processes-message">
                <i className="pi pi-info-circle" style={{ fontSize: '2rem', color: '#6c757d' }}></i>
                <h4>No tienes procesos asignados</h4>
                <p>Contacta al administrador para que te asigne procesos para analizar.</p>
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <Card title="Acciones Rápidas" className="section-card">
            <div className="quick-actions">
              <Button
                label="Ver Mis Procesos"
                icon="pi pi-chart-bar"
                className="p-button-primary quick-action-btn"
                onClick={() => navigate('/user/procesos')}
              />
              <Button
                label="Mi Actividad"
                icon="pi pi-file-check"
                className="p-button-secondary quick-action-btn"
                onClick={() => navigate('/user/auditorias')}
              />
              <Button
                label="Editar Perfil"
                icon="pi pi-user-edit"
                className="p-button-help quick-action-btn"
                onClick={() => navigate('/user/profile')}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;