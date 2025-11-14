import { Card } from "primereact/card";
import { Button } from "primereact/button";
import SideBar from "../../../components/SideBar";
import "./Usuarios.css";
import { useEffect, useState } from "react";
import { Image } from "primereact/image";
import { Accordion, AccordionTab } from "primereact/accordion";
import { FloatLabel } from "primereact/floatlabel";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Password } from "primereact/password";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { UserListAPI } from "../../../services/api";
import { useNavigate } from "react-router-dom";

const Usuarios = () => {
  const navigate = useNavigate();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [loading, setLoading] = useState(false);

  const [users, setUsers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    phone_number: "",
    school_id: 1,
    user_type_id: 3, // Default to "visor"
    email: "",
  });

  // Role options that match your database
  const roleOptions = [
    { label: "Admin", value: 1 },
    { label: "Colaborador", value: 2 },
    { label: "Visor", value: 3 }
  ];

  const handleCreateUser = async () => {
    try {
      setLoading(true);

      // Validate required fields
      if (!newUser.username || !newUser.email || !newUser.password) {
        alert("Por favor complete todos los campos obligatorios (Usuario, Email, Contraseña)");
        return;
      }

      // Call the API to create the user
      const createdUser = await UserListAPI.createUser(newUser);
      
      // Add the new user to the list
      setUsers(prevUsers => [...prevUsers, createdUser]);
      
      // Reset the form
      setNewUser({
        username: "",
        password: "",
        phone_number: "",
        school_id: 1,
        user_type_id: 3,
        email: "",
      });

      console.log("User created successfully:", createdUser);
      alert("Usuario creado correctamente");

    } catch (error) {
      console.error("Error creating user:", error);
      alert("Error al crear usuario: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on filterText (case-insensitive)
  const filteredUsers = filterText
    ? users.filter(
        (user) =>
          user.username.toLowerCase().includes(filterText.toLowerCase()) ||
          user.email.toLowerCase().includes(filterText.toLowerCase())
      )
    : users;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users
        const usersData = await UserListAPI.getUserList();
        setUsers(usersData);
        console.log("Usuarios cargados: ", usersData);
        
        // Fetch schools for dropdown
        const schoolsData = await UserListAPI.getSchools();
        const schoolOptions = schoolsData.map(school => ({
          label: school.name,
          value: school.id
        }));
        setSchools(schoolOptions);
        console.log("Escuelas cargadas: ", schoolOptions);
        
        // Set default school if available
        if (schoolOptions.length > 0) {
          setNewUser(prev => ({ ...prev, school_id: schoolOptions[0].value }));
        }
        
      } catch (error) {
        console.log("Error al cargar datos:", error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="usuarios-container">
      <Button
        onClick={() => setSidebarVisible(true)}
        icon="pi pi-bars"
        className="sidebar-toggle"
      />
      <SideBar
        visible={sidebarVisible}
        onHide={() => setSidebarVisible(false)}
      />
      <h1 className="page-title">Usuarios</h1>
      <Accordion className="user-accordion">
        <AccordionTab header="Lista de Usuarios" className="user-tab">
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
            {filteredUsers.map((user) => (
              <Card
                key={user.id}
                title={user.username}
                className="user-card2"
                onClick={() => navigate("/usuario", { state: user })}
              >
                <div className="user">
                  <Image
                    src={`https://i.pravatar.cc/150?img=${user.id}`}
                    alt={user.username}
                    imageStyle={{
                      width: "100%",
                      height: "auto",
                      maxWidth: "120px",
                      borderRadius: "30%",
                    }}
                    className="responsive-user-image"
                  />
                  <p>
                    <strong>Email:</strong> {user.email}
                  </p>
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
                  <FloatLabel controlId="username" label="Usuario">
                    <InputText
                      type="text"
                      id="username"
                      name="username"
                      value={newUser.username}
                      onChange={(e) =>
                        setNewUser({ ...newUser, username: e.target.value })
                      }
                      className="input-field"
                      placeholder="Ingrese el nombre de usuario"
                      required
                    />
                    <label htmlFor="username">Usuario *</label>
                  </FloatLabel>
                  
                  <FloatLabel controlId="email" label="Correo Electrónico">
                    <InputText
                      type="email"
                      id="email"
                      name="email"
                      value={newUser.email}
                      onChange={(e) =>
                        setNewUser({ ...newUser, email: e.target.value })
                      }
                      className="input-field"
                      placeholder="Ingrese el correo electrónico"
                      required
                    />
                    <label htmlFor="email">Correo Electrónico *</label>
                  </FloatLabel>
                  
                  <FloatLabel controlId="password" label="Contraseña">
                    <Password
                      inputId="password"
                      value={newUser.password}
                      onChange={(e) =>
                        setNewUser({ ...newUser, password: e.target.value })
                      }
                      className="input-field"
                      placeholder="Ingrese la contraseña"
                      feedback={false}
                      toggleMask
                      required
                    />
                    <label htmlFor="password">Contraseña *</label>
                  </FloatLabel>
                </div>
                
                <div className="form-group">
                  <FloatLabel controlId="phone" label="Teléfono">
                    <InputText
                      type="text"
                      id="phone"
                      name="phone"
                      value={newUser.phone_number}
                      onChange={(e) =>
                        setNewUser({ ...newUser, phone_number: e.target.value })
                      }
                      className="input-field"
                      placeholder="Ingrese el número de teléfono"
                    />
                    <label htmlFor="phone">Teléfono</label>
                  </FloatLabel>
                  
                  <div className="form-group">
                    <label htmlFor="role" style={{ marginBottom: '10px', display: 'block', fontWeight: 'bold' }}>
                      Rol *
                    </label>
                    <Dropdown
                      id="role"
                      value={newUser.user_type_id}
                      onChange={(e) => setNewUser({...newUser, user_type_id: e.value})}
                      options={roleOptions}
                      placeholder="Seleccionar rol"
                      className="input-field"
                      style={{ width: '100%' }}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="school" style={{ marginBottom: '10px', display: 'block', fontWeight: 'bold' }}>
                      Escuela *
                    </label>
                    <Dropdown
                      id="school"
                      value={newUser.school_id}
                      onChange={(e) => setNewUser({...newUser, school_id: e.value})}
                      options={schools}
                      placeholder="Seleccionar escuela"
                      className="input-field"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>
              
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <Button
                  label="Crear Usuario"
                  icon="pi pi-user-plus"
                  onClick={handleCreateUser}
                  loading={loading}
                  disabled={!newUser.username || !newUser.email || !newUser.password}
                  className="p-button-success"
                />
              </div>
            </div>
          </Card>
        </AccordionTab>
      </Accordion>
    </div>
  );
};

export default Usuarios;
