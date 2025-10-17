import { Routes, Route } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

import Dashboard from './pages/Admin/Dashboard/Dashboard';
import Procesos from './pages/Admin/Procesos/Procesos';
import Proyecto from './pages/Admin/Proyecto/Proyecto';
import Usuarios from './pages/Admin/Usuarios/Usuarios';

import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { FloatLabel } from 'primereact/floatlabel';
import { Card } from 'primereact/card';

import 'primereact/resources/themes/lara-light-indigo/theme.css'; //theme
import 'primereact/resources/primereact.min.css'; //core css
import 'primeicons/primeicons.css';

import './App.css'

function Login() {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/dashboard');
  };

  return (
    <>
      <Card title="Login">
        <div className='p-inputgroup flex-1'>
          <span className='p-inputgroup-addon'>
            <i className='pi pi-user'></i>
          </span>
          <FloatLabel>
            <InputText id="username" />
            <label htmlFor="username">Username</label>
          </FloatLabel>
        </div>

        <div className='p-inputgroup space'>
          <span className='p-inputgroup-addon'>
            <i className='pi pi-lock'></i>
          </span>
          <FloatLabel>
            <InputText id="password" type='password' />
            <label htmlFor="password">Password</label>
          </FloatLabel>
        </div>
        <div className='card'>
          <Button className='btn' label='Login' icon='pi pi-check' onClick={handleLogin} text raised/>
        </div>
      </Card>
    </>
  )
}

function App() {
  return (
      <Routes>
        <Route path="/" element={<Login/>} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/procesos" element={<Procesos />} />
        <Route path="/proyecto" element={<Proyecto />} />
        <Route path="/usuarios" element={<Usuarios />} />
      </Routes>
  );
}

export default App;
