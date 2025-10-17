import { Card } from "primereact/card";
import { Button } from "primereact/button";
import SideBar from "../../../components/SideBar";
import './Usuarios.css';
import { useState } from "react";
import { Image } from "primereact/image";
import { Accordion, AccordionTab } from "primereact/accordion";
import { FloatLabel } from "primereact/floatlabel";
import { InputText } from "primereact/inputtext";
import { FileUpload } from "primereact/fileupload";
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';

const Usuarios = () => {
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const [filterText, setFilterText] = useState("");

    const users = [
        { id: 1, name: 'Alice Johnson', email: 'alice.johnson@example.com' },
        { id: 2, name: 'Bob Smith', email: 'bob.smith@example.com' },
        { id: 3, name: 'Charlie Brown', email: 'charlie.brown@example.com' },
        { id: 4, name: 'Diana Prince', email: 'diana.prince@example.com' },
        { id: 5, name: 'Ethan Hunt', email: 'ethan.hunt@example.com' },
        { id: 6, name: 'Fiona Gallagher', email: 'fiona.gallagher@example.com' },
        { id: 7, name: 'George Martin', email: 'george.martin@example.com' }
    ];

    const [newUser, setNewUser] = useState({ name: '', email: '' });

    // Filter users based on filterText (case-insensitive)
    const filteredUsers = filterText
        ? users.filter(user =>
            user.name.toLowerCase().includes(filterText.toLowerCase())
        )
        : users;

    return (
        <div className="usuarios-container">
            <Button
                onClick={() => setSidebarVisible(true)}
                icon="pi pi-bars"
                className="sidebar-toggle"
            />
            <SideBar visible={sidebarVisible} onHide={() => setSidebarVisible(false)} />
            <h1 className="page-title">Usuarios</h1>
            <Accordion className="user-accordion">
                <AccordionTab header="Lista de Usuarios" className="user-tab" >
                    <div className="header">
                        <IconField iconPosition="left">
                            <InputIcon className="pi pi-search" />
                            <InputText 
                                placeholder="Búsqueda general" 
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                            />
                        </IconField>
                    </div>
                    <div className="user-grid">
                        {filteredUsers.map(user => (
                            <Card key={user.id} title={user.name} className="user-card2">
                                <div className="user">
                                    <Image
                                        src={`https://i.pravatar.cc/150?img=${user.id}`}
                                        alt={user.name}
                                        imageStyle={{ width: '100%', height: 'auto', maxWidth: '120px', borderRadius: '30%' }}
                                        className="responsive-user-image"
                                    />
                                    <p><strong>Email:</strong> {user.email}</p>
                                </div>
                            </Card>
                        ))}
                    </div>
                </AccordionTab>

                <AccordionTab header="Crear Nuevo Usuario" className="user-tab">
                    <Card className="user-card">
                        <div className="card-content">
                            <div className="main-grid">
                                <div className="form-group">
                                    <FloatLabel controlId="name" label="Nombre Completo">
                                        <InputText
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={newUser.name}
                                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                            className="input-field"
                                            placeholder="Ingrese el nombre completo" />
                                        <label htmlFor="name">Nombre Completo</label>
                                    </FloatLabel>
                                    <FloatLabel controlId="email" label="Correo Electrónico">
                                        <InputText
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={newUser.email}
                                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                            className="input-field"
                                            placeholder="Ingrese el correo electrónico" />
                                        <label htmlFor="email">Correo Electrónico</label>
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
                            </div>
                            <Button label="Crear Usuario" icon="pi pi-user-plus" />
                        </div>
                    </Card>
                </AccordionTab>
            </Accordion>
        </div>
    );
};

export default Usuarios;
