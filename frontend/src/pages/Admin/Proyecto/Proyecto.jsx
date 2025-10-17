import React from "react";
import { useLocation, useParams } from "react-router-dom";

const Proyecto = () => {
  const location = useLocation();
  console.log("LOCATION:", location); // should show { pathname, state: {...} }

  const process = location.state?.process;

  return (
    <div>
      <h1>Proyecto Page</h1>
      <pre>{JSON.stringify(location, null, 2)}</pre>
      <p>Process: {process ? process.nombre : 'No Process found'}</p>
    </div>
  );
};

export default Proyecto;