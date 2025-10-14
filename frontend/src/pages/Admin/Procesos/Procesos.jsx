import React, { useState } from 'react';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import SideBar from '../../../components/SideBar';
import './Procesos.css';

const Procesos = () => {
    const [processes, setProcesses] = useState([
        { id: 1, name: 'Onboarding Employees', description: 'New employee onboarding workflow', status: 'Active' },
        { id: 2, name: 'Purchase Approval', description: 'Approval process for purchase orders', status: 'Inactive' },
        { id: 3, name: 'Customer Feedback', description: 'Collect and analyze customer feedback', status: 'Active' },
    ]);

    const [newProcess, setNewProcess] = useState({ name: '', description: '', status: 'Active' });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewProcess({ ...newProcess, [name]: value });
    };

    const handleAddProcess = () => {
        if (!newProcess.name || !newProcess.description) return;

        const newEntry = {
            id: processes.length + 1,
            ...newProcess,
        };
        setProcesses([...processes, newEntry]);
        setNewProcess({ name: '', description: '', status: 'Active' });
    };

    const [sidebarVisible, setSidebarVisible] = useState(false);

    return (
        <div className="procesos-container">
            <Button
                onClick={() => setSidebarVisible(true)}
                icon="pi pi-bars"
                className="sidebar-toggle"
            />
            <SideBar visible={sidebarVisible} onHide={() => setSidebarVisible(false)} />

            <h2 className="page-title">Procesos</h2>

            <Accordion multiple activeIndex={[0]} className="procesos-accordion">

                {/* --- List Section --- */}
                <AccordionTab header="Lista de Procesos" className="procesos-tab">
                    <Card className="procesos-card">
                        <div className="card-content">
                            <DataTable 
                                value={processes} 
                                responsiveLayout="scroll" 
                                stripedRows
                                className="full-height-table"
                                scrollable
                                scrollHeight="flex"
                            >
                                <Column field="id" header="ID" sortable style={{ width: '5rem' }} />
                                <Column field="name" header="Nombre" sortable />
                                <Column field="description" header="Descripción" />
                                <Column field="status" header="Estado" sortable />
                            </DataTable>
                        </div>
                    </Card>
                </AccordionTab>

                {/* --- Create Form Section --- */}
                <AccordionTab header="Crear Nuevo Proceso" className="procesos-tab">
                    <Card className="procesos-card">
                        <div className="card-content">
                            <div className="form-group">
                                <label htmlFor="name">Nombre del proceso</label>
                                <InputText
                                    id="name"
                                    name="name"
                                    value={newProcess.name}
                                    onChange={handleInputChange}
                                    placeholder="Ej. Aprobación de proyectos"
                                    className="input-field"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Descripción</label>
                                <InputTextarea
                                    id="description"
                                    name="description"
                                    value={newProcess.description}
                                    onChange={handleInputChange}
                                    rows={4}
                                    placeholder="Describe brevemente el proceso"
                                    className="input-field"
                                />
                            </div>

                            <Button label="Agregar Proceso" icon="pi pi-plus" onClick={handleAddProcess} className="add-button" />
                        </div>
                    </Card>
                </AccordionTab>
            </Accordion>
        </div>
    );
};

export default Procesos;
