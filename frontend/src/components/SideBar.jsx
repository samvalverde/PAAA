import React from "react";
import './SideBar.css';
import { Link } from "react-router-dom";
import { Sidebar } from "primereact/sidebar";

const SideBar = ({ visible, onHide }) => {
  return (
    <Sidebar visible={visible} onHide={onHide} position="left" className="sidebar">
        <h3>Menu</h3>
        <ul>
            <li>
                <i className="pi pi-home" style={{ marginRight: '8px' }}></i>
                <Link to="/dashboard" onClick={onHide} style={{ textDecoration: 'none', color: '#333' }}>Dashboard</Link>
            </li>
            <li>
                <i className="pi pi-chart-bar" style={{ marginRight: '8px' }}></i>
                <Link to="/procesos" onClick={onHide} style={{ textDecoration: 'none', color: '#333' }}>Procesos</Link>
            </li>
            <li>
                <i className="pi pi-user" style={{ marginRight: '8px' }}></i>
                <Link to="/usuarios" onClick={onHide} style={{ textDecoration: 'none', color: '#333' }}>Profile</Link>
            </li>
        </ul>
    </Sidebar>
  );
};

export default SideBar;
