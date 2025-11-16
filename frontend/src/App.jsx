import { Routes, Route } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

import Dashboard from "./pages/Admin/Dashboard/Dashboard";
import Procesos from "./pages/Admin/Procesos/Procesos";
import Proyecto from "./pages/Admin/Proyecto/Proyecto";
import Usuarios from "./pages/Admin/Usuarios/Usuarios";
import Usuario from "./pages/Admin/Usuario/Usuario";
import Auditorias from "./pages/Admin/Auditorias/Auditorias";

// User pages
import UserDashboard from "./pages/User/Dashboard/Dashboard";
import UserProcesos from "./pages/User/Procesos/Procesos";
import UserProyecto from "./pages/User/Proyecto/Proyecto";
import UserAuditorias from "./pages/User/Auditorias/Auditorias";
import UserProfile from "./pages/User/Profile/Profile";

import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { FloatLabel } from "primereact/floatlabel";
import { Card } from "primereact/card";

import "primereact/resources/themes/lara-light-indigo/theme.css"; //theme
import "primereact/resources/primereact.min.css"; //core css
import "primeicons/primeicons.css";

import "./App.css";
import { authAPI, userAPI } from "./services/api";

function Login() {
  const navigate = useNavigate();
  const [body, setBody] = useState({ username: "", password: "" });

  const handleLogin = async () => {
    try {
      const loged = await authAPI.login(body.username, body.password);
      console.log(loged);
      if (loged?.access_token) {
        localStorage.setItem("access_token", loged.access_token);
        
        // Check user role and redirect accordingly
        try {
          const userData = await userAPI.getCurrentUser();
          
          if (userData.role === 'admin') {
            navigate("/admin/dashboard");
          } else {
            navigate("/user/dashboard");
          }
        } catch (roleError) {
          console.error("Role check failed:", roleError);
          // Fallback to admin dashboard if role check fails
          navigate("/admin/dashboard");
        }
      }
    } catch (error) {
      alert("Credenciales incorrectas");
    }
  };

  const handleChange = (field, value) => {
    setBody((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="login-root">
      <Card className="login-card" title="Login">
        <div className="login-form">
          <div className="p-inputgroup">
            <span className="p-inputgroup-addon">
              <i className="pi pi-user"></i>
            </span>
            <FloatLabel>
              <InputText
                id="username"
                value={body.username}
                onChange={(e) => handleChange("username", e.target.value)}
              />
              <label htmlFor="username">Username</label>
            </FloatLabel>
          </div>

          <div className="p-inputgroup">
            <span className="p-inputgroup-addon">
              <i className="pi pi-lock"></i>
            </span>
            <FloatLabel>
              <InputText
                id="password"
                type="password"
                value={body.password}
                onChange={(e) => handleChange("password", e.target.value)}
              />
              <label htmlFor="password">Password</label>
            </FloatLabel>
          </div>
          
          <Button
            className="btn"
            label="Login"
            icon="pi pi-check"
            onClick={handleLogin}
            text
            raised
          />
        </div>
      </Card>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      
      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<Dashboard />} />
      <Route path="/admin/procesos" element={<Procesos />} />
      <Route path="/admin/proyecto" element={<Proyecto />} />
      <Route path="/admin/usuarios" element={<Usuarios />} />
      <Route path="/admin/usuario" element={<Usuario />} />
      <Route path="/admin/auditorias" element={<Auditorias />} />
      
      {/* User Routes */}
      <Route path="/user/dashboard" element={<UserDashboard />} />
      <Route path="/user/procesos" element={<UserProcesos />} />
      <Route path="/user/proyecto" element={<UserProyecto />} />
      <Route path="/user/auditorias" element={<UserAuditorias />} />
      <Route path="/user/profile" element={<UserProfile />} />
      
      {/* Legacy routes for backwards compatibility */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/procesos" element={<Procesos />} />
      <Route path="/proyecto" element={<Proyecto />} />
      <Route path="/usuarios" element={<Usuarios />} />
      <Route path="/usuario" element={<Usuario />} />
      <Route path="/auditorias" element={<Auditorias />} />
    </Routes>
  );
}

export default App;
