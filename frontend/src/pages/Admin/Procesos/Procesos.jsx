import React, { useState } from 'react';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { FileUpload } from 'primereact/fileupload';
import { Button } from 'primereact/button';
import SideBar from '../../../components/SideBar';
import './Procesos.css';
import { FloatLabel } from 'primereact/floatlabel';
import AdvancedFilter from '../../../components/Table';

const Procesos = () => {
    const [processes, setProcesses] = useState([
        { id: 1, name: 'Onboarding Employees', description: 'New employee onboarding workflow', status: 'Active' },
        { id: 2, name: 'Purchase Approval', description: 'Approval process for purchase orders', status: 'Inactive' },
        { id: 3, name: 'Customer Feedback', description: 'Collect and analyze customer feedback', status: 'Active' },
    ]);

    const [newProcess, setNewProcess] = useState({ name: '', periodo: '', unidad: '', responsable: '' });

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
                            <AdvancedFilter/>
                        </div>
                    </Card>
                </AccordionTab>

                {/* --- Create Form Section --- */}
                <AccordionTab header="Crear Nuevo Proceso" className="procesos-tab">
                    <Card className="procesos-card">
                        <div className="card-content">
                            <div className="main-grid">
                                <div className="form-group">
                                    <FloatLabel>
                                        <InputText
                                            id="name"
                                            name="name"
                                            value={newProcess.name}
                                            onChange={handleInputChange}
                                            placeholder="Ej. Aprobación de proyectos"
                                            className="input-field"
                                        />
                                        <label htmlFor="name">Nombre del proceso</label>
                                    </FloatLabel>

                                    <FloatLabel>
                                        <InputText
                                            id="periodo"
                                            name="periodo"
                                            value={newProcess.periodo}
                                            onChange={handleInputChange}
                                            placeholder="Periodo"
                                            className="input-field"
                                        />
                                        <label htmlFor="periodo">Periodo</label>
                                    </FloatLabel>

                                    <FloatLabel>
                                        <InputText
                                            id="unidad"
                                            name="unidad"
                                            value={newProcess.unidad}
                                            onChange={handleInputChange}
                                            placeholder="Unidad de medida"
                                            className="input-field"
                                        />
                                        <label htmlFor="unidad">Unidad de medida</label>
                                    </FloatLabel>

                                    <FloatLabel>
                                        <InputText
                                            id="responsable"
                                            name="responsable"
                                            value={newProcess.responsable}
                                            onChange={handleInputChange}
                                            placeholder="Responsable"
                                            className="input-field"
                                        />
                                        <label htmlFor="responsable">Responsable</label>
                                    </FloatLabel>
                                </div>

                                <div className="form-group">
                                    <FileUpload
                                        name="demo[]"
                                        url={'/api/upload'}
                                        multiple
                                        accept="image/*"
                                        maxFileSize={1000000}
                                        emptyTemplate={<p className="m-0">Drag and drop files to here to upload.</p>} />
                                </div>

                                <Button label="Agregar Proceso" icon="pi pi-plus" onClick={handleAddProcess} className="add-button" />
                            </div>
                        </div>
                    </Card>
                </AccordionTab>
            </Accordion>
        </div>
    );
};

export default Procesos;
