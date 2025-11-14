import { useState } from "react";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import SideBar from "../../../components/SideBar";
import "./Auditorias.css";

const Auditorias = () => {
  const [visible, setVisible] = useState(false);
  const [actions, setActions] = useState([]);

  return (
    <div>
      <div>
        <Button
          onClick={() => setVisible(true)}
          icon="pi pi-bars"
          className="sidebar-toggle"
        />
        <SideBar visible={visible} onHide={() => setVisible(false)} />
      </div>
      <h2>Auditorias</h2>

      <Card title="Recent Contacts" className="section-card table-section">
        <DataTable value={actions} className="contacts-table">
          <Column field="username" header="Nombre" sortable></Column>
          <Column field="role" header="Rol" sortable></Column>
          <Column field="phone" header="Phone Number"></Column>
          <Column field="email" header="Email" sortable></Column>
          <Column field="is_active" header="Status" sortable></Column>
        </DataTable>
      </Card>
    </div>
  );
};

export default Auditorias;
