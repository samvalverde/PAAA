import { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import SideBar from "../../../components/SideBar";
import { AuditAPI } from "../../../services/api";
import "./Auditorias.css";

const Auditorias = () => {
  const [visible, setVisible] = useState(false);
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch audit data on component mount
  useEffect(() => {
    const fetchAudits = async () => {
      try {
        setLoading(true);
        const data = await AuditAPI.getAllAudits();
        setAudits(data);
        console.log("Auditorías cargadas:", data);
      } catch (error) {
        console.error("Error al cargar auditorías:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAudits();
  }, []);

  // Format date for display
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

  return (
    <div className="audit-container">
      <div>
        <Button
          onClick={() => setVisible(true)}
          icon="pi pi-bars"
          className="sidebar-toggle"
        />
        <SideBar visible={visible} onHide={() => setVisible(false)} />
      </div>
      <h2 className="page-title">Auditorías</h2>

      <div className="audit-tab">
        <Card
          title="Registro de Auditorías"
          className="section-card table-section audit-card"
        >
          <DataTable
            value={audits}
            className="contacts-table"
            loading={loading}
            paginator
            rows={10}
            emptyMessage="No se encontraron registros de auditoría"
          >
            <Column
              field="id"
              header="ID"
              sortable
              style={{ width: "80px" }}
            ></Column>
            <Column field="responsible" header="Responsable" sortable></Column>
            <Column field="action" header="Acción" sortable></Column>
            <Column field="unit" header="Unidad" sortable></Column>
            <Column
              field="description"
              header="Descripción"
              style={{ width: "300px" }}
            ></Column>
            <Column
              field="created_at"
              header="Fecha"
              sortable
              body={(rowData) => formatDate(rowData.created_at)}
              style={{ width: "150px" }}
            ></Column>
          </DataTable>
        </Card>
      </div>
    </div>
  );
};

export default Auditorias;
