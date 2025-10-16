import { Card } from "primereact/card";
import { Button } from "primereact/button";
import SideBar from "../../../components/SideBar";
import './Usuarios.css';
import { useState } from "react";
import { Image } from "primereact/image";

const Usuarios = () => {
    const [sidebarVisible, setSidebarVisible] = useState(false);

    const users = [
        { id: 1, name: 'Alice Johnson', email: 'alice.johnson@example.com' },
        { id: 2, name: 'Bob Smith', email: 'bob.smith@example.com' },
        { id: 3, name: 'Charlie Brown', email: 'charlie.brown@example.com' },
        { id: 4, name: 'Diana Prince', email: 'diana.prince@example.com' },
        { id: 5, name: 'Ethan Hunt', email: 'ethan.hunt@example.com' },
        { id: 6, name: 'Fiona Gallagher', email: 'fiona.gallagher@example.com' },
        { id: 7, name: 'George Martin', email: 'george.martin@example.com' }
    ];

    return (
        <div className="usuarios-container">
            <Button
                onClick={() => setSidebarVisible(true)}
                icon="pi pi-bars"
                className="sidebar-toggle"
            />
            <SideBar visible={sidebarVisible} onHide={() => setSidebarVisible(false)} />
            <h1 className="page-title">Usuarios</h1>
            <div className="main-grid">
                {users.map(user => (
                    <Card key={user.id} title={user.name} className="user-card">
                        <div className="user">
                            <Image src={`https://i.pravatar.cc/150?img=${user.id}`} alt={user.name} />
                            <p><strong>Email:</strong> {user.email}</p>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default Usuarios;
