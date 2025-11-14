import React, { useState, useEffect, useRef } from 'react';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { FileUpload } from 'primereact/fileupload';
import { Button } from 'primereact/button';
import SideBar from '../../../components/SideBar';
import './Procesos.css';
import { FloatLabel } from 'primereact/floatlabel';
import AdvancedFilter from '../../../components/Table';
import { ProcListAPI, UserListAPI } from '../../../services/api';

const Procesos = () => {
    const [processes, setProcesses] = useState([]);
    const [schools, setSchools] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    // Ref for file input to allow programmatic reset
    const fileInputRef = useRef(null);

    // Enhanced form for process creation with file upload
    const [newProcess, setNewProcess] = useState({ 
        process_name: '', 
        school_id: 1,
        dataset_type: 'egresados', // 'egresados' or 'profesores'
        version: '', // version number for the file
        file: null // CSV file to upload
    });

    // Dataset options
    const datasetOptions = [
        { label: "Egresados", value: "egresados" },
        { label: "Profesores", value: "profesores" }
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewProcess({ ...newProcess, [name]: value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type (CSV or Excel)
            const validExtensions = ['.csv', '.xlsx', '.xls'];
            const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
            
            if (!validExtensions.includes(fileExtension)) {
                alert("Por favor seleccione un archivo CSV (.csv) o Excel (.xlsx, .xls) válido");
                return;
            }
            
            // Validate file naming pattern (check name without extension)
            const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.'));
            const expectedNameWithoutExt = `${newProcess.dataset_type}_${newProcess.version}`;
            
            if (nameWithoutExt !== expectedNameWithoutExt) {
                alert(`El archivo debe llamarse exactamente: ${expectedNameWithoutExt}.csv o ${expectedNameWithoutExt}.xlsx`);
                return;
            }
            
            setNewProcess({ ...newProcess, file });
        }
    };

    const handleCreateProcess = async () => {
        try {
            setLoading(true);

            // Validate required fields
            if (!newProcess.process_name) {
                alert("Por favor ingrese el nombre del proceso");
                return;
            }
            
            if (!newProcess.version) {
                alert("Por favor ingrese la versión");
                return;
            }
            
            if (!newProcess.file) {
                alert("Por favor seleccione un archivo CSV");
                return;
            }

            // Get school name for MinIO path
            const selectedSchool = schools.find(school => school.value === newProcess.school_id);
            const schoolName = selectedSchool ? selectedSchool.label : 'Unknown';

            // Create FormData for file upload
            const formData = new FormData();
            formData.append('process_name', newProcess.process_name);
            formData.append('school_id', newProcess.school_id.toString());
            formData.append('career_name', schoolName); // Use school name as career_name for MinIO path
            formData.append('dataset_type', newProcess.dataset_type);
            formData.append('file', newProcess.file);

            // Debug: Check if auth token is available
            const token = localStorage.getItem('access_token');
            console.log('Auth token available:', !!token);
            if (!token) {
                alert("No se encontró token de autenticación. Por favor inicie sesión nuevamente.");
                return;
            }

            // Call the API to create the process with file upload
            const createdProcess = await ProcListAPI.createProc(formData);
            
            // Add the new process to the list
            setProcesses(prevProcesses => [...prevProcesses, createdProcess]);
            
            // Reset the form
            setNewProcess({
                process_name: "",
                school_id: schools.length > 0 ? schools[0].value : 1,
                dataset_type: 'egresados',
                version: '',
                file: null
            });
            
            // Clear file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            console.log("Process created successfully:", createdProcess);
            alert("Proceso creado correctamente");

        } catch (error) {
            console.error("Error creating process:", error);
            alert("Error al crear proceso: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const [sidebarVisible, setSidebarVisible] = useState(false);

    // Fetch data on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch processes
                const processesData = await ProcListAPI.getProcList();
                setProcesses(processesData);
                console.log("Procesos cargados: ", processesData);
                
                // Fetch schools for dropdown
                const schoolsData = await UserListAPI.getSchools();
                const schoolOptions = schoolsData.map(school => ({
                    label: school.name,
                    value: school.id
                }));
                setSchools(schoolOptions);
                console.log("Escuelas cargadas: ", schoolOptions);
                
                // Fetch users for dropdown
                const usersData = await UserListAPI.getUsersForDropdown();
                const userOptions = usersData.map(user => ({
                    label: `${user.username} (${user.email})`,
                    value: user.id
                }));
                setUsers(userOptions);
                console.log("Usuarios cargados: ", userOptions);
                
                // Set default values
                if (schoolOptions.length > 0) {
                    setNewProcess(prev => ({ ...prev, school_id: schoolOptions[0].value }));
                }
                
            } catch (error) {
                console.error("Error al cargar datos:", error);
            }
        };
        fetchData();
    }, []);

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
                                            id="process_name"
                                            name="process_name"
                                            value={newProcess.process_name}
                                            onChange={handleInputChange}
                                            placeholder="Ej. Evaluación de Docentes"
                                            className="input-field"
                                            required
                                        />
                                        <label htmlFor="process_name">Nombre del proceso *</label>
                                    </FloatLabel>

                                    <div className="form-group" style={{ marginTop: '20px' }}>
                                        <label htmlFor="school" style={{ marginBottom: '10px', display: 'block', fontWeight: 'bold' }}>
                                            Escuela *
                                        </label>
                                        <Dropdown
                                            id="school"
                                            value={newProcess.school_id}
                                            onChange={(e) => setNewProcess({...newProcess, school_id: e.value})}
                                            options={schools}
                                            placeholder="Seleccionar escuela"
                                            className="input-field"
                                            style={{ width: '100%' }}
                                        />
                                    </div>

                                    <div className="form-group" style={{ marginTop: '20px' }}>
                                        <label htmlFor="dataset_type" style={{ marginBottom: '10px', display: 'block', fontWeight: 'bold' }}>
                                            Tipo de Dataset *
                                        </label>
                                        <Dropdown
                                            id="dataset_type"
                                            value={newProcess.dataset_type}
                                            onChange={(e) => setNewProcess({...newProcess, dataset_type: e.value})}
                                            options={datasetOptions}
                                            placeholder="Seleccionar tipo"
                                            className="input-field"
                                            style={{ width: '100%' }}
                                        />
                                    </div>

                                    <FloatLabel style={{ marginTop: '20px' }}>
                                        <InputText
                                            id="version"
                                            name="version"
                                            value={newProcess.version}
                                            onChange={handleInputChange}
                                            placeholder="Ej. 2024"
                                            className="input-field"
                                            required
                                        />
                                        <label htmlFor="version">Versión *</label>
                                    </FloatLabel>

                                    <div className="form-group" style={{ marginTop: '20px' }}>
                                        <label htmlFor="file" style={{ marginBottom: '10px', display: 'block', fontWeight: 'bold' }}>
                                            Archivo CSV/Excel *
                                        </label>
                                        <input
                                            type="file"
                                            id="file"
                                            ref={fileInputRef}
                                            accept=".csv,.xlsx,.xls"
                                            onChange={handleFileChange}
                                            className="input-field"
                                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                                        />
                                        <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                                            El archivo debe llamarse: {newProcess.dataset_type}_{newProcess.version || 'VERSION'}.csv o .xlsx
                                        </small>
                                    </div>
                                </div>

                                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                                    <Button 
                                        label="Crear Proceso" 
                                        icon="pi pi-plus" 
                                        onClick={handleCreateProcess} 
                                        loading={loading}
                                        disabled={!newProcess.process_name || !newProcess.version || !newProcess.file}
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

export default Procesos;
