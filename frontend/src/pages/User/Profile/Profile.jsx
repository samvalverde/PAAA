import { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { useRef } from "react";
import SideBar from "../../../components/SideBar";
import { UserListAPI } from "../../../services/api";
import "./Profile.css";

const UserProfile = () => {
  const [visible, setVisible] = useState(false);
  const [User, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const toast = useRef(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    setLoading(true);
    try {
      // First get current user to get user ID
      const currentUser = await UserListAPI.getCurrentUser();
      console.log("Current user response:", currentUser); // Debug log
      
      // Then get the full user details from user list to get phone_number
      const userList = await UserListAPI.getUserList();
      console.log("User list response:", userList); // Debug log
      
      // Find current user in the list to get complete data including phone_number
      const fullUserData = userList.find(u => u.username === currentUser.username || u.id === currentUser.id);
      console.log("Full user data:", fullUserData); // Debug log
      
      if (fullUserData) {
        setUser(fullUserData);
      } else {
        // Fallback to current user data if not found in list
        setUser(currentUser);
      }
    } catch (err) {
      console.error("Error loading user profile:", err);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar el perfil'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
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
        email: User.email,
        phone_number: User.phone_number,
      };

      // Call the API to update the user
      const updatedUser = await UserListAPI.updateUser(User.id, updateData);
      
      // Update the local state with the response from the server
      setUser(updatedUser);
      setIsEditing(false);
      
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Perfil actualizado correctamente'
      });
      
    } catch (error) {
      console.error("Error updating user:", error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al actualizar perfil: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !User) {
    return (
      <div className="profile-container">
        <div className="loading-container">
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <Toast ref={toast} />
      
      <Button
        onClick={() => setVisible(true)}
        icon="pi pi-bars"
        className="sidebar-toggle"
      />
      <SideBar visible={visible} onHide={() => setVisible(false)} />

      <div className="profile-content">
        <div className="profile-header">
          <h1 className="page-title">Mi Perfil</h1>
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
          <div className="profile-header-section">
            <div className="profile-avatar">
              {User?.username ? User.username.charAt(0).toUpperCase() : "U"}
            </div>
            <h2 className="profile-name">{User?.username}</h2>
            <span className="profile-role">{User?.role}</span>
          </div>

          <div className="user-info">
            {/* Username - Read Only */}
            <div className="field">
              <label className="field-label">Usuario</label>
              <span className="field-value">{User?.username}</span>
            </div>

            {/* Email - Editable */}
            <div className="field">
              <label className="field-label">Correo Electrónico</label>
              {isEditing ? (
                <InputText
                  value={User?.email || ''}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="editable-input"
                />
              ) : (
                <span className="field-value">{User?.email}</span>
              )}
            </div>

            {/* Phone - Editable */}
            <div className="field">
              <label className="field-label">Teléfono</label>
              {isEditing ? (
                <InputText
                  value={User?.phone_number || ''}
                  onChange={(e) => handleChange("phone_number", e.target.value)}
                  className="editable-input"
                  placeholder="Número de teléfono"
                />
              ) : (
                <span className="field-value">
                  {User?.phone_number || 'No especificado'}
                </span>
              )}
            </div>

            {/* Role - Read Only */}
            <div className="field">
              <label className="field-label">Rol</label>
              <span className="field-value">{User?.role}</span>
            </div>

            {/* Status - Read Only - Full width on second row */}
            <div className="field" style={{gridColumn: 'span 2'}}>
              <label className="field-label">Estado</label>
              <span className={User?.is_active ? "status-active" : "status-inactive"}>
                {User?.is_active ? "Activo" : "Inactivo"}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UserProfile;