import React, { useState, useEffect } from 'react';
import { classNames } from 'primereact/utils';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { MultiSelect } from 'primereact/multiselect';
import { Tag } from 'primereact/tag';

export default function AdvancedFilter() {
    const [customers, setCustomers] = useState(null);
    const [filters, setFilters] = useState(null);
    const [loading, setLoading] = useState(false);
    const [globalFilterValue, setGlobalFilterValue] = useState('');
    const [responsables] = useState([
        { name: 'Ana García', image: 'amyelsner.png' },
        { name: 'Carlos López', image: 'annafali.png' },
        { name: 'María Rodríguez', image: 'asiyajavayant.png' },
        { name: 'Pedro Martínez', image: 'bernardodominic.png' },
        { name: 'Laura Fernández', image: 'elwinsharvill.png' }
    ]);
    const [estados] = useState(['pendiente', 'en progreso', 'completado', 'cancelado']);
    const [unidades] = useState(['Ventas', 'Marketing', 'TI', 'Recursos Humanos', 'Finanzas']);

    const getSeverity = (estado) => {
        switch (estado) {
            case 'pendiente':
                return 'warning';
            case 'en progreso':
                return 'info';
            case 'completado':
                return 'success';
            case 'cancelado':
                return 'danger';
            default:
                return null;
        }
    };

    const formatDate = (value) => {
        return value.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatDateTime = (value) => {
        return value.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const clearFilter = () => {
        initFilters();
    };

    const onGlobalFilterChange = (e) => {
        const value = e.target.value;
        let _filters = { ...filters };

        _filters['global'].value = value;

        setFilters(_filters);
        setGlobalFilterValue(value);
    };

    const initFilters = () => {
        setFilters({
            global: { value: null, matchMode: FilterMatchMode.CONTAINS },
            nombre: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
            unidad: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
            responsable: { value: null, matchMode: FilterMatchMode.IN },
            periodo: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }] },
            estado: { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
            fecha_actualizacion: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }] }
        });
        setGlobalFilterValue('');
    };

    const renderHeader = () => {
        return (
            <div className="flex justify-content-between">
                <Button type="button" icon="pi pi-filter-slash" label="Limpiar" outlined onClick={clearFilter} />
                <IconField iconPosition="left">
                    <InputIcon className="pi pi-search" />
                    <InputText value={globalFilterValue} onChange={onGlobalFilterChange} placeholder="Búsqueda general" />
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
        const responsable = rowData.responsable;

        return (
            <div className="flex align-items-center gap-2">
                <img alt={responsable.name} src={`https://primefaces.org/cdn/primereact/images/avatar/${responsable.image}`} width="32" />
                <span>{responsable.name}</span>
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
                <img alt={option.name} src={`https://primefaces.org/cdn/primereact/images/avatar/${option.image}`} width="32" />
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
        return <Tag value={rowData.estado} severity={getSeverity(rowData.estado)} />;
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
        return formatDateTime(rowData.fecha_actualizacion);
    };

    const fechaActualizacionFilterTemplate = (options) => {
        return (
            <Calendar 
                value={options.value} 
                onChange={(e) => options.filterCallback(e.value, options.index)} 
                dateFormat="dd/mm/yy" 
                placeholder="dd/mm/aaaa" 
                showTime
                hourFormat="24"
            />
        );
    };

    const header = renderHeader();

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
                globalFilterFields={['nombre', 'unidad', 'responsable.name', 'estado']} 
                header={header}
                emptyMessage="No se encontraron registros." 
                onFilter={(e) => setFilters(e.filters)}
            >
                <Column field="nombre" header="Nombre" filter filterPlaceholder="Buscar por nombre" style={{ minWidth: '14rem' }} />
                <Column header="Periodo" filterField="periodo" dataType="date" style={{ minWidth: '10rem' }} body={periodoBodyTemplate} filter filterElement={periodoFilterTemplate} />
                <Column header="Unidad" filterField="unidad" style={{ minWidth: '12rem' }} body={unidadBodyTemplate} filter filterElement={unidadFilterTemplate} />
                <Column header="Estado" filterField="estado" filterMenuStyle={{ width: '14rem' }} style={{ minWidth: '12rem' }} body={estadoBodyTemplate} filter filterElement={estadoFilterTemplate} />
                <Column header="Responsable" filterField="responsable" showFilterMatchModes={false} filterMenuStyle={{ width: '14rem' }} style={{ minWidth: '14rem' }}
                    body={responsableBodyTemplate} filter filterElement={responsableFilterTemplate} />
                <Column header="Última Actualización" filterField="fecha_actualizacion" dataType="date" style={{ minWidth: '14rem' }} body={fechaActualizacionBodyTemplate} filter filterElement={fechaActualizacionFilterTemplate} />
            </DataTable>
        </div>
    );
}
