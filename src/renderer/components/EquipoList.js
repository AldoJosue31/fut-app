import React, { useState } from 'react';
import { addUserToFirestore } from '../firebaseConfig';// Importa la función
import { Button } from 'react-bootstrap';


const EquipoList = () => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');

  // Función para manejar el clic del botón y agregar el usuario
  const handleAddUser = () => {
    const userData = {
      name: name,
      age: parseInt(age),
      email: email
    };
    addUserToFirestore(userData);
    // Limpiar inputs después de agregar el usuario
    setName('');
    setAge('');
    setEmail('');
  };

  return (
    <div>
      <h1>Agregar Usuario</h1>
      <input
        type="text"
        placeholder="Nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="number"
        placeholder="Edad"
        value={age}
        onChange={(e) => setAge(e.target.value)}
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button onClick={handleAddUser}>Agregar Usuario</Button>
    </div>
  );
};

export default EquipoList;
