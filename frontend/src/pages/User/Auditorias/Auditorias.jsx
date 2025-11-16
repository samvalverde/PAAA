import { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ProgressSpinner } from "primereact/progressspinner";
import SideBar from "../../../components/SideBar";
import { AuditAPI, UserListAPI } from "../../../services/api";
import "./Auditorias.css";

const UserAuditorias = () => {
  const [visible, setVisible] = useState(false);
  const [audits, setAudits] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUserAudits();
  }, []);

  const loadUserAudits = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get current user
      const user = await UserListAPI.getCurrentUser();
      setCurrentUser(user);

      // Get all audits and filter by current user
      const allAudits = await AuditAPI.getAllAudits();
      const userAudits = allAudits.filter(audit => 
        audit.user_id === user.id || audit.username === user.username
      );
      
      setAudits(userAudits);

    } catch (err) {
      console.error("Error loading user audits:", err);
      setError("Error loading your activity log");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const actionIconTemplate = (rowData) => {
    const iconMap = {
      'login': 'pi pi-sign-in',
      'logout': 'pi pi-sign-out',
      'create': 'pi pi-plus',
      'read': 'pi pi-eye',
      'update': 'pi pi-pencil',
      'delete': 'pi pi-trash',
      'analysis': 'pi pi-chart-line',
      'download': 'pi pi-download',
      'upload': 'pi pi-upload'
    };

    const action = rowData.action_type || 'read';
    const icon = iconMap[action] || 'pi pi-info-circle';

    return <i className={`${icon} action-icon`} />;
  };

  const descriptionTemplate = (rowData) => {
    return (
      <span className="description-text">
        {rowData.description || rowData.action_type || 'No description'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="auditorias-container">
        <div className="loading-container">
          <ProgressSpinner />
          <p>Cargando tu actividad...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auditorias-container">
      <Button
        onClick={() => setVisible(true)}
        icon="pi pi-bars"
        className="sidebar-toggle"
      />
      <SideBar visible={visible} onHide={() => setVisible(false)} />

      <div className="auditorias-content">
        <h1 className="page-title">Mi Actividad</h1>

        {/* User Activity Header */}
        <Card className="user-activity-header">
          <div className="activity-header-content">
            <div className="user-info">
              <h3>Registro de Actividad: {currentUser?.username}</h3>
              <p>Todas las acciones realizadas en el sistema</p>
            </div>
            <div className="activity-stats">
              <div className="stat-card">
                <span className="stat-number">{audits.length}</span>
                <span className="stat-label">Total Acciones</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">
                  {audits.filter(a => {
                    const date = new Date(a.created_at);
                    const today = new Date();
                    return date.toDateString() === today.toDateString();
                  }).length}
                </span>
                <span className="stat-label">Acciones Hoy</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">
                  {audits.filter(a => a.action_type === 'analysis').length}
                </span>
                <span className="stat-label">Análisis</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Audits Table */}
        <Card title="Registro de Actividad" className="audits-table-card">
          {error && (
            <div className="error-message">
              <i className="pi pi-exclamation-triangle"></i>
              <p>{error}</p>
              <Button 
                label="Reintentar" 
                icon="pi pi-refresh"
                onClick={loadUserAudits}
                className="p-button-secondary"
              />
            </div>
          )}

          <DataTable
            value={audits}
            paginator
            rows={15}
            loading={loading}
            emptyMessage="No se encontró actividad registrada."
            sortField="created_at"
            sortOrder={-1}
            responsiveLayout="scroll"
            className="user-audits-table"
          >
            <Column
              header="Acción"
              body={actionIconTemplate}
              style={{ width: '80px', textAlign: 'center' }}
            />
            <Column
              field="action_type"
              header="Tipo"
              sortable
              style={{ minWidth: '120px' }}
            />
            <Column
              field="description"
              header="Descripción"
              body={descriptionTemplate}
              style={{ minWidth: '300px' }}
            />
            <Column
              field="created_at"
              header="Fecha y Hora"
              sortable
              body={(rowData) => formatDate(rowData.created_at)}
              style={{ minWidth: '180px' }}
            />
            <Column
              field="details"
              header="Detalles"
              body={(rowData) => rowData.details ? (
                <span className="details-text">
                  {typeof rowData.details === 'object' 
                    ? JSON.stringify(rowData.details).substring(0, 50) + '...'
                    : rowData.details.substring(0, 50) + '...'
                  }
                </span>
              ) : '-'}
              style={{ minWidth: '200px' }}
            />
          </DataTable>
        </Card>

        {/* Activity Summary */}
        <Card title="Resumen de Actividad" className="activity-summary-card">
          <div className="summary-grid">
            <div className="summary-item">
              <i className="pi pi-chart-line summary-icon"></i>
              <div className="summary-details">
                <h4>Análisis Ejecutados</h4>
                <p>{audits.filter(a => a.action_type === 'analysis').length} análisis</p>
              </div>
            </div>
            <div className="summary-item">
              <i className="pi pi-download summary-icon"></i>
              <div className="summary-details">
                <h4>Reportes Generados</h4>
                <p>{audits.filter(a => a.action_type === 'download').length} descargas</p>
              </div>
            </div>
            <div className="summary-item">
              <i className="pi pi-eye summary-icon"></i>
              <div className="summary-details">
                <h4>Consultas Realizadas</h4>
                <p>{audits.filter(a => a.action_type === 'read').length} consultas</p>
              </div>
            </div>
            <div className="summary-item">
              <i className="pi pi-clock summary-icon"></i>
              <div className="summary-details">
                <h4>Última Actividad</h4>
                <p>{audits.length > 0 ? formatDate(audits[0]?.created_at) : 'Sin actividad'}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UserAuditorias;