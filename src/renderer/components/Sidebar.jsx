import React, { useState, useEffect, useMemo } from 'react';
import {
  CDBSidebar,
  CDBSidebarContent,
  CDBSidebarFooter,
  CDBSidebarHeader,
  CDBSidebarMenu,
  CDBSidebarMenuItem,
} from 'cdbreact';
import { NavLink } from 'react-router-dom';
import { FaArrowLeft, FaArrowRight, FaCog, FaBars } from 'react-icons/fa';
import {
  getDivisions,
  addDivision,
  updateDivision,
  deleteDivision,
} from '../services/divisionsService';
import '../styles/styles.css';

function Modal({ title, children, actions, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="config-modal__header">
          <h2>{title}</h2>
          <button className="config-modal__close" onClick={onClose}>×</button>
        </div>
        <div className="config-modal__body">{children}</div>
        {actions && <div className="modal-actions">{actions}</div>}
      </div>
    </div>
  );
}

const routes = [
  { to: '/', icon: 'fas fa-home', label: 'Inicio', end: true },
  { to: '/equipos', icon: 'fas fa-calendar-alt', label: 'Equipos' },
  { to: '/clasificacion', icon: 'fas fa-list-ol', label: 'Clasificación' },
  { to: '/editar', icon: 'fas fa-edit', label: 'Editar' },
  { to: '/partidos', icon: 'fas fa-futbol', label: 'Partidos' },
  { to: '/calendario', icon: 'fas fa-calendar-alt', label: 'Calendario' },
];

function Sidebar() {
  const [divisions, setDivisions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showConfig, setShowConfig] = useState(false);
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  // estado para colapsar el sidebar inicialmente cerrado
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await getDivisions();
      setDivisions(data);
      const saved = localStorage.getItem('division');
      if (saved) {
        const idx = data.findIndex(d => d.name === saved);
        if (idx >= 0) setCurrentIndex(idx);
      }
    })();
  }, []);

  useEffect(() => {
    if (divisions.length) {
      const div = divisions[currentIndex].name;
      localStorage.setItem('division', div);
      window.dispatchEvent(new Event('divisionChange'));
    }
  }, [currentIndex, divisions]);

  const handlePrev = () => setCurrentIndex(i => (i - 1 + divisions.length) % divisions.length);
  const handleNext = () => setCurrentIndex(i => (i + 1) % divisions.length);

  const refresh = async () => {
    const data = await getDivisions();
    setDivisions(data);
  };
  const handleAdd = async () => {
    if (!newName.trim()) return;
    await addDivision({ name: newName });
    setNewName('');
    refresh();
  };
  const startEdit = d => {
    setEditId(d.id);
    setEditName(d.name);
  };
  const handleUpdate = async () => {
    if (!editName.trim()) return;
    await updateDivision(editId, { name: editName });
    setEditId(null);
    setEditName('');
    refresh();
  };
  const handleDelete = async id => {
    await deleteDivision(id);
    refresh();
  };

  const menuItems = useMemo(
    () => routes.map(({ to, icon, label, end }) => (
      <NavLink
        key={to}
        to={to}
        end={end}
        className="text-decoration-none"
        style={({ isActive }) => ({ display: 'flex', alignItems: 'center', color: isActive ? '#fff' : '#b0b0b0', textDecoration: 'none' })}
      >
        <CDBSidebarMenuItem icon={icon} iconType="solid">{label}</CDBSidebarMenuItem>
      </NavLink>
    )),
    []
  );

  const currentDivision = divisions[currentIndex]?.name || 'Cargando...';

  return (
    <>
      <div style={{ display: 'flex', height: '100vh', overflow: 'auto' }}>
        <CDBSidebar collapsed={collapsed} textColor="#b0b0b0" backgroundColor="#444343">
          <CDBSidebarHeader prefix={<FaBars style={{ cursor: 'pointer' }} onClick={() => setCollapsed(!collapsed)} />}>
            {!collapsed && (
              <NavLink to="/" className="text-decoration-none" style={{ color: '#fff', fontSize: '1.2em', fontWeight: 'bold' }}>
                Nombre
              </NavLink>
            )}
          </CDBSidebarHeader>

          <CDBSidebarContent className="sidebar-content">
            <CDBSidebarMenu>{menuItems}</CDBSidebarMenu>
          </CDBSidebarContent>

          <CDBSidebarFooter style={{ textAlign: 'center', padding: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#5a5a5a', borderRadius: '5px', padding: '5px 10px' }}>
              <button onClick={handlePrev} style={{ background: '#b0b0b0', border: 'none', borderRadius: '3px', padding: '5px 15px', marginRight: '10px', cursor: 'pointer' }}><FaArrowLeft size={20} /></button>
              <span style={{ color: '#fff', fontWeight: '500' }}>{currentDivision}</span>
              <button onClick={handleNext} style={{ background: '#b0b0b0', border: 'none', borderRadius: '3px', padding: '5px 15px', marginLeft: '10px', cursor: 'pointer' }}><FaArrowRight size={20} /></button>
              <button onClick={() => setShowConfig(true)} style={{ background: 'none', border: 'none', color: '#b0b0b0', marginLeft: '10px', cursor: 'pointer' }} title="Configuración"><FaCog size={20} /></button>
            </div>
          </CDBSidebarFooter>
        </CDBSidebar>
      </div>

      {showConfig && (
        <Modal title="Configurar Divisiones" onClose={() => setShowConfig(false)} actions={[
          <button key="close" className="btn cancel" onClick={() => setShowConfig(false)}>Cerrar</button>
        ]}>
          <section className="config-modal__new">
            <label htmlFor="newDivision">Nueva División</label>
            <div className="config-modal__new-input">
              <input
                id="newDivision"
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Nombre..."
              />
              <button onClick={handleAdd} className="btn success">Agregar</button>
            </div>
          </section>

          <section className="config-modal__list">
            <h3>Divisiones existentes</h3>
            <ul>
              {divisions.map(d => (
                <li key={d.id} className="config-modal__item">
                  {editId === d.id ? (
                    <div className="config-modal__edit">
                      <input
                        className="config-modal__edit-input"
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                      />
                      <button onClick={handleUpdate} className="btn success">Guardar</button>
                      <button onClick={() => setEditId(null)} className="btn cancel">Cancelar</button>
                    </div>
                  ) : (
                    <div className="config-modal__display">
                      <span className="config-modal__name">{d.name}</span>
                      <div className="config-modal__actions">
                        <button onClick={() => startEdit(d)} className="btn text">Editar</button>
                        <button onClick={() => handleDelete(d.id)} className="btn text danger">Eliminar</button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </Modal>
      )}
    </>
  );
}

export default React.memo(Sidebar);
