import React, { useState, useEffect } from "react";
import './SideBar.css';
import { Link, useNavigate } from "react-router-dom";
import { Sidebar } from "primereact/sidebar";
import { Button } from "primereact/button";
import { userAPI } from "../services/api";

const SideBar = ({ visible, onHide }) => {
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setLoading(false);
          return;
        }

        const userData = await userAPI.getCurrentUser();
        setUserRole(userData.role);
        setUserName(userData.username);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (visible) {
      fetchUserData();
    }
  }, [visible]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/');
    onHide();
  };

  const renderAdminMenu = () => (
    <ul>
      <li>
        <i className="pi pi-home" style={{ marginRight: '8px' }}></i>
        <Link to="/admin/dashboard" onClick={onHide} style={{ textDecoration: 'none', color: '#333' }}>Dashboard</Link>
      </li>
      <li>
        <i className="pi pi-chart-bar" style={{ marginRight: '8px' }}></i>
        <Link to="/admin/procesos" onClick={onHide} style={{ textDecoration: 'none', color: '#333' }}>Procesos</Link>
      </li>
      <li>
        <i className="pi pi-user" style={{ marginRight: '8px' }}></i>
        <Link to="/admin/usuarios" onClick={onHide} style={{ textDecoration: 'none', color: '#333' }}>Usuarios</Link>
      </li>
      <li>
        <i className="pi pi-file-check" style={{ marginRight: '8px' }}></i>
        <Link to="/admin/auditorias" onClick={onHide} style={{ textDecoration: 'none', color: '#333' }}>Auditorias</Link>
      </li>
    </ul>
  );

  const renderUserMenu = () => (
    <ul>
      <li>
        <i className="pi pi-home" style={{ marginRight: '8px' }}></i>
        <Link to="/user/dashboard" onClick={onHide} style={{ textDecoration: 'none', color: '#333' }}>Dashboard</Link>
      </li>
      <li>
        <i className="pi pi-chart-bar" style={{ marginRight: '8px' }}></i>
        <Link to="/user/procesos" onClick={onHide} style={{ textDecoration: 'none', color: '#333' }}>Mis Procesos</Link>
      </li>
      <li>
        <i className="pi pi-file-check" style={{ marginRight: '8px' }}></i>
        <Link to="/user/auditorias" onClick={onHide} style={{ textDecoration: 'none', color: '#333' }}>Mi Actividad</Link>
      </li>
      <li>
        <i className="pi pi-user-edit" style={{ marginRight: '8px' }}></i>
        <Link to="/user/profile" onClick={onHide} style={{ textDecoration: 'none', color: '#333' }}>Mi Perfil</Link>
      </li>
    </ul>
  );

  return (
    <Sidebar visible={visible} onHide={onHide} position="left" className="sidebar">
      <div className="sidebar-header">
        <h3>Menu</h3>
        {userName && (
          <div className="user-info">
            <p className="username">
              <i className="pi pi-user" style={{ marginRight: '5px' }}></i>
              {userName}
            </p>
            <span className={`role-badge ${userRole}`}>
              {userRole === 'admin' ? 'Administrador' : 'Usuario'}
            </span>
          </div>
        )}
      </div>
      
      <div className="sidebar-content">
        {loading ? (
          <div className="loading">
            <i className="pi pi-spinner pi-spin"></i>
            <span>Cargando...</span>
          </div>
        ) : (
          <>
            {userRole === 'admin' ? renderAdminMenu() : renderUserMenu()}
          </>
        )}
      </div>
      
      <div className="sidebar-footer">
        <Button 
          label="Cerrar Sesión" 
          icon="pi pi-sign-out" 
          onClick={handleLogout}
          className="p-button-outlined p-button-secondary w-full"
          size="small"
        />
      </div>
    </Sidebar>
  );
};

export default SideBar;
