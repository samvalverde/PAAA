import React, { useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Button } from "primereact/button";
import { TabView, TabPanel } from 'primereact/tabview';
import SideBar from '../../../components/SideBar';
import "./Proyecto.css";

const Proyecto = () => {
  const location = useLocation();
  console.log("LOCATION:", location); // should show { pathname, state: {...} }

  const process = location.state?.process;

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [resumen, setResumen] = useState(()=>{
    return( 
    <div>
      <h3>Resumen</h3>
    </div>
    )
  })
  const [datos, setDatos] = useState(()=>{
    return( 
    <div>
      <h3>Datos</h3>
    </div>
    )
  })
  const [hist, setHist] = useState(()=>{
    return( 
    <div>
      <h3>Historial</h3>
    </div>
    )
  })
  const [rep, setRep] = useState(()=>{
    return( 
    <div>
      <h3>Reportes</h3>
    </div>
    )
  })

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
      <h1 className="page-title">{process.process_name}</h1>
      <div className="proyecto-container">
        <TabView>
          <TabPanel header="Resumen">
            {resumen}
          </TabPanel>
          <TabPanel header="Historial">
            {hist}
          </TabPanel>
          <TabPanel header="Datos">
            {datos}
          </TabPanel>
          <TabPanel header="Reportes">
            {rep}
          </TabPanel>
        </TabView>
      </div>
    </div>
  );
};

export default Proyecto;
