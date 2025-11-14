import { Card } from "primereact/card";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "primereact/button";
import SideBar from "../../../components/SideBar";
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import "./Usuario.css";

const Usuario = () => {
  const location = useLocation();
  const [User, setUser] = useState(location.state);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const roles = [
    {
      lable: "Admin", code: 1
    },
    {
        lable: "User", code: 2
    },
    {
        lable: "External", code: 3
    }
  ];

  const bools = [true, false]

  const handleChange = (field, value) => {
    field === "role"
    ? setUser((prev)=>({
        ...prev,
        [field]: value.lable,
        ["role_id"]: value.code
    }))
    :
    setUser((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    // TODO: Llamar al API para enviar los datos a la base
    console.log("User data saved:", User);
    setIsEditing(false);
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
                  value={User.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="editable-input"
                />
              ) : (
                <span className="field-value">{User.phone}</span>
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
                <Dropdown options={bools} value={User.is_active} optionLabel="Role"
                onChange={(e) => handleChange("is_active", e.target.value)} />
              ) : (
                <span className="field-value">{String(User.is_active)}</span>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Usuario;
