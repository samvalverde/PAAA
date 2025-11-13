import React, { useState, useEffect } from "react";
import { classNames } from "primereact/utils";
import { FilterMatchMode, FilterOperator } from "primereact/api";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { MultiSelect } from "primereact/multiselect";
import { Tag } from "primereact/tag";
import { useNavigate } from "react-router-dom";
import { ProcListAPI } from "../services/api";
import "./Table.css";

export default function AdvancedFilter() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState(null);
  const [filters, setFilters] = useState(null);
  const [loading, setLoading] = useState(false);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [responsables] = useState([
    { name: "Ana García", image: "amyelsner.png" },
    { name: "Carlos López", image: "annafali.png" },
    { name: "María Rodríguez", image: "asiyajavayant.png" },
    { name: "Pedro Martínez", image: "bernardodominic.png" },
    { name: "Laura Fernández", image: "elwinsharvill.png" },
  ]);
  const [estados] = useState(["Pending", "In Progress", "Active", "Completed"]);
  const [unidades] = useState([
    "Forestal",
    "Computación",
    "Diseño",
    "Ambiental",
    "Biotecnología",
    "Lincoln High School"
  ]);
  const [selectedProcess, setSelectedProcess] = useState(null);

  const getSeverity = (estado) => {
    switch (estado) {
      case "In Progress":
        return "warning";
      case "Active":
        return "info";
      case "Completed":
        return "success";
      case "cancelado":
        return "danger";
      default:
        return null;
    }
  };

  const formatDate = (value) => {
    const date = new Date(value);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (value) => {
    const date = new Date(value);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const clearFilter = () => {
    initFilters();
  };

  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };

    _filters["global"].value = value;

    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const initFilters = () => {
    setFilters({
      global: { value: null, matchMode: FilterMatchMode.CONTAINS },
      process_name: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
      },
      unidad: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
      },
      responsable: { value: null, matchMode: FilterMatchMode.IN },
      periodo: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }],
      },
      estado: {
        operator: FilterOperator.OR,
        constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
      },
      updated_at: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }],
      },
    });
    setGlobalFilterValue("");
  };

  const renderHeader = () => {
    return (
      <div className="header">
        <div>
          <Button
            type="button"
            icon="pi pi-filter-slash"
            label="Limpiar"
            outlined
            onClick={clearFilter}
          />
        </div>
        <IconField iconPosition="left">
          <InputIcon className="pi pi-search" />
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Búsqueda general"
          />
        </IconField>
      </div>
    );
  };

  const unidadBodyTemplate = (rowData) => {
    return (
      <div className="flex align-items-center gap-2">
        <span>{rowData.unidad}</span>
      </div>
    );
  };

  const unidadFilterTemplate = (options) => {
    return (
      <Dropdown
        value={options.value}
        options={unidades}
        onChange={(e) => options.filterCallback(e.value)}
        placeholder="Seleccionar Unidad"
        className="p-column-filter"
        showClear
      />
    );
  };

  const responsableBodyTemplate = (rowData) => {
    const responsable = rowData.encargado;

    return (
      <div className="flex align-items-center gap-2">
        <span>{responsable}</span>
      </div>
    );
  };

  const responsableFilterTemplate = (options) => {
    return (
      <MultiSelect
        value={options.value}
        options={responsables}
        itemTemplate={responsablesItemTemplate}
        onChange={(e) => options.filterCallback(e.value)}
        optionLabel="name"
        placeholder="Seleccionar Responsable"
        className="p-column-filter"
      />
    );
  };

  const responsablesItemTemplate = (option) => {
    return (
      <div className="flex align-items-center gap-2">
        <img
          alt={option.name}
          src={`https://primefaces.org/cdn/primereact/images/avatar/${option.image}`}
          width="32"
        />
        <span>{option.name}</span>
      </div>
    );
  };

  const periodoBodyTemplate = (rowData) => {
    return formatDate(rowData.periodo);
  };

  const periodoFilterTemplate = (options) => {
    return (
      <Calendar
        value={options.value}
        onChange={(e) => options.filterCallback(e.value, options.index)}
        dateFormat="mm/yy"
        placeholder="mm/aaaa"
        view="month"
      />
    );
  };

  const estadoBodyTemplate = (rowData) => {
    return (
      <Tag value={rowData.estado} severity={getSeverity(rowData.estado)} />
    );
  };

  const estadoFilterTemplate = (options) => {
    return (
      <Dropdown
        value={options.value}
        options={estados}
        onChange={(e) => options.filterCallback(e.value, options.index)}
        itemTemplate={estadoItemTemplate}
        placeholder="Seleccionar Estado"
        className="p-column-filter"
        showClear
      />
    );
  };

  const estadoItemTemplate = (option) => {
    return <Tag value={option} severity={getSeverity(option)} />;
  };

  const fechaActualizacionBodyTemplate = (rowData) => {
    return formatDateTime(rowData.updated_at);
  };

  const fechaActualizacionFilterTemplate = (options) => {
    return (
      <Calendar
        value={options.value ? new Date(options.value) : null}
        onChange={(e) => {
          const value = e.value instanceof Date ? e.value : new Date(e.value);
          options.filterCallback(value, options.index);
        }}
        dateFormat="dd/mm/yy"
        placeholder="dd/mm/aaaa"
        showTime
        hourFormat="24"
      />
    );
  };

  const handleRedirect = () => {
    if (selectedProcess) {
      navigate("/proyecto", { state: { process: selectedProcess } });
    } else {
      console.log("No process selected");
    }
  };

  const header = renderHeader();

  // You feed the data to fill the table via the `customers` state.
  // For example, you can fetch or set your data in a useEffect:
  useEffect(() => {
    setLoading(true);
    // Replace this with your data fetching logic
    const ProcList = async () => {
      const data = await ProcListAPI.getProcList();
      const formatedData = data.map((item) => ({
        ...item,
        updated_at: new Date(item.updated_at),
        created_at: new Date(item.created_at),
      }));
      setCustomers(formatedData);
      console.log("Data: ", data);
    };
    ProcList();
    setLoading(false);
    initFilters();
  }, []);

  return (
    <div className="card">
      <DataTable
        value={customers}
        paginator
        showGridlines
        rows={10}
        loading={loading}
        dataKey="id"
        filters={filters}
        globalFilterFields={["nombre", "unidad", "responsable.name", "estado"]}
        header={header}
        emptyMessage="No se encontraron registros."
        onFilter={(e) => setFilters(e.filters)}
        selectionMode="single"
        selection={selectedProcess}
        onSelectionChange={(e) => setSelectedProcess(e.value)}
      >
        <Column
          selectionMode="single"
          headerStyle={{ width: "3rem", minWidth: "3rem" }}
        />
        <Column
          field="process_name"
          header="Nombre"
          filter
          filterPlaceholder="Buscar por nombre"
          style={{ minWidth: "14rem" }}
        />
        {/*<Column header="Periodo" filterField="periodo" dataType="date" style={{ minWidth: '10rem' }} body={periodoBodyTemplate} filter filterElement={periodoFilterTemplate} /> */}
        <Column
          header="Unidad"
          filterField="unidad"
          style={{ minWidth: "12rem" }}
          body={unidadBodyTemplate}
          filter
          filterElement={unidadFilterTemplate}
        />
        <Column
          header="Estado"
          filterField="estado"
          filterMenuStyle={{ width: "14rem" }}
          style={{ minWidth: "12rem" }}
          body={estadoBodyTemplate}
          filter
          filterElement={estadoFilterTemplate}
        />
        <Column
          header="Encargado"
          filterField="encargado"
          showFilterMatchModes={false}
          filterMenuStyle={{ width: "14rem" }}
          style={{ minWidth: "14rem" }}
          body={responsableBodyTemplate}
          filter
          filterElement={responsableFilterTemplate}
        />
        <Column
          header="Última Actualización"
          filterField="updated_at"
          dataType="date"
          style={{ minWidth: "14rem" }}
          body={fechaActualizacionBodyTemplate}
          filter
          filterElement={fechaActualizacionFilterTemplate}
        />
      </DataTable>
      <Button
        type="button"
        label="Ver"
        icon="pi pi-external-link"
        onClick={handleRedirect}
        disabled={!selectedProcess}
        className="mt-2"
      />
    </div>
  );
}
