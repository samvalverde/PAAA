import { Card } from "primereact/card";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import SideBar from "../../../components/SideBar";
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Dropdown } from "primereact/dropdown";
import { UserListAPI } from "../../../services/api";
import "./Usuario.css";

const Usuario = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [User, setUser] = useState({
    ...location.state,
    password: '' // Initialize password field
  });
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const roles = [
    {
      lable: "admin", code: 1
    },
    {
        lable: "colaborador", code: 2
    },
    {
        lable: "visor", code: 3
    }
  ];

  const bools = [
    { label: "Activo", value: true },
    { label: "Inactivo", value: false }
  ];

  const handleChange = (field, value) => {
    console.log(`handleChange called: field=${field}, value=${value}`);
    field === "role"
    ? setUser((prev)=>({
        ...prev,
        [field]: value.lable,
        ["user_type_id"]: value.code
    }))
    :
    setUser((prev) => {
      const newUser = {
        ...prev,
        [field]: value,
      };
      console.log(`Updated user state:`, newUser);
      return newUser;
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Prepare the data for the API (only send fields that can be updated)
      const updateData = {
        username: User.username,
        email: User.email,
        phone_number: User.phone_number,
        user_type_id: User.user_type_id,
        school_id: User.school_id,
        is_active: User.is_active
      };

      console.log('Current User state before validation:', User);
      console.log('User.password value:', User.password);
      console.log('User.password type:', typeof User.password);

      // Add password only if it's provided and not empty
      if (User.password && typeof User.password === 'string' && User.password.trim() !== '') {
        updateData.password = User.password;
        console.log('✅ Adding password to updateData:', User.password);
      } else {
        console.log('❌ No password provided or empty. User.password:', User.password);
      }

      console.log('Final updateData being sent:', updateData);

      // Call the API to update the user
      const updatedUser = await UserListAPI.updateUser(User.id, updateData);
      
      // Update the local state with the response from the server
      setUser(updatedUser);
      setIsEditing(false);
      
      console.log("User updated successfully:", updatedUser);
      
      // Show success message (you can use a toast library for better UX)
      alert("Usuario actualizado correctamente");
      
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Error al actualizar usuario: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="usuario-container">
      <Button
        onClick={() => setSidebarVisible(true)}
        icon="pi pi-bars"
        className="sidebar-toggle"
      />
      <SideBar
        visible={sidebarVisible}
        onHide={() => setSidebarVisible(false)}
      />

      <div className="usuario-content">
        <div className="usuario-header">
          <h1 className="page-title">Perfil de Usuario</h1>
          <Button
            icon={isEditing ? "pi pi-save" : "pi pi-pencil"}
            label={isEditing ? "Guardar" : "Editar"}
            className="p-button-rounded p-button-primary edit-btn"
            loading={loading}
            disabled={loading}
            onClick={() => {
              if (isEditing) handleSave();
              else setIsEditing(true);
            }}
          />
        </div>

        <Card className="user-body">
          <div className="profile-header">
            <div className="profile-avatar">
              {User.username ? User.username.charAt(0).toUpperCase() : "U"}
            </div>
            <h2 className="profile-name">{User.username}</h2>
            <span className="profile-role">{User.role}</span>
          </div>

          <div className="user-info">
            {/* Username */}
            <div className="field">
              <label className="field-label">Usuario</label>
              {isEditing ? (
                <InputText
                  value={User.username}
                  onChange={(e) => handleChange("username", e.target.value)}
                  className="editable-input"
                />
              ) : (
                <span className="field-value">{User.username}</span>
              )}
            </div>

            {/* Email */}
            <div className="field">
              <label className="field-label">Correo Electrónico</label>
              {isEditing ? (
                <InputText
                  value={User.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="editable-input"
                />
              ) : (
                <span className="field-value">{User.email}</span>
              )}
            </div>

            {/* Phone */}
            <div className="field">
              <label className="field-label">Teléfono</label>
              {isEditing ? (
                <InputText
                  value={User.phone_number}
                  onChange={(e) => handleChange("phone_number", e.target.value)}
                  className="editable-input"
                />
              ) : (
                <span className="field-value">{User.phone_number}</span>
              )}
            </div>

            {/* Password */}
            <div className="field">
              <label className="field-label">Contraseña</label>
              {isEditing ? (
                <Password
                  value={User.password || ''}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className="editable-input"
                  placeholder="Nueva contraseña (opcional)"
                  feedback={false}
                  toggleMask
                />
              ) : (
                <span className="field-value">••••••••</span>
              )}
            </div>

            {/* Role */}
            <div className="field">
              <label className="field-label">Rol</label>
              {isEditing ? (
                <Dropdown 
                  value={roles.find(r => r.lable === User.role)} 
                  options={roles} 
                  optionLabel="lable"
                  onChange={(e) => handleChange("role", e.target.value)}
                  className="w-full"
                />
              ) : (
                <span className="field-value">{User.role}</span>
              )}
            </div>

            {/* Is Active - Full width on second row */}
            <div className="field" style={{gridColumn: 'span 2'}}>
              <label className="field-label">Estado</label>
              {isEditing ? (
                <Dropdown 
                  options={bools} 
                  value={bools.find(option => option.value === User.is_active)} 
                  optionLabel="label"
                  onChange={(e) => handleChange("is_active", e.target.value.value)} 
                  className="w-full"
                />
              ) : (
                <span className={User.is_active ? "status-active" : "status-inactive"}>
                  {User.is_active ? "Activo" : "Inactivo"}
                </span>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Usuario;
