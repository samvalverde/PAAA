import { Card } from "primereact/card";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import SideBar from "../../../components/SideBar";
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { UserListAPI } from "../../../services/api";
import "./Usuario.css";

const Usuario = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [User, setUser] = useState(location.state);
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
    field === "role"
    ? setUser((prev)=>({
        ...prev,
        [field]: value.lable,
        ["user_type_id"]: value.code
    }))
    :
    setUser((prev) => ({
      ...prev,
      [field]: value,
    }));
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

      <div className="usuario-header">
        <h1 className="page-title">Usuario: {User.username}</h1>
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

      <div>
        <Card className="user-body">
          <h2>{User.username}</h2>

          <div className="user-info">
            {/* Email */}
            <div className="field">
              <Tag severity="info" className="field-label">
                Correo:
              </Tag>
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
              <Tag severity="info" className="field-label">
                Teléfono:
              </Tag>
              {isEditing ? (
                <InputText
                  value={User.phone_number}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="editable-input"
                />
              ) : (
                <span className="field-value">{User.phone_number}</span>
              )}
            </div>

            {/* Role */}
            <div className="field">
              <Tag severity="info" className="field-label">
                Rol:
              </Tag>
              {isEditing ? (
                <Dropdown value={User.role} options={roles} optionLabel="lable"
                onChange={(e) => handleChange("role", e.target.value)}/>
              ) : (
                <span className="field-value">{User.role}</span>
              )}
            </div>

            {/* Username */}
            <div className="field">
              <Tag severity="info" className="field-label">
                Usuario:
              </Tag>
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

            {/* Is Active */}
            <div className="field">
              <Tag
                severity={
                  String(User.is_active) === "true" ? "success" : "danger"
                }
                className="field-label"
              >
                Activo:
              </Tag>
              {isEditing ? (
                <Dropdown 
                  options={bools} 
                  value={bools.find(option => option.value === User.is_active)} 
                  optionLabel="label"
                  onChange={(e) => handleChange("is_active", e.target.value.value)} 
                />
              ) : (
                <span className="field-value">{User.is_active ? "Activo" : "Inactivo"}</span>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Usuario;
