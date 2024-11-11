import { useLocation } from "react-router-dom";

function CurrentRouteLogger() {
  const location = useLocation();

  console.log("Current path:", location.pathname);

  return null; // Este componente no renderiza nada, solo se usa para el log
}

// Usa este componente dentro de tu `MainLayout` o en cualquier página
export default CurrentRouteLogger;
