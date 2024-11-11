import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../components/MainLayout";
import Calendario from "../pages/Calendario";
import Coordinacion from "../pages/Coordinacion";
import Equipos from "../pages/Equipos";
import Home from "../pages/Home";
import Inscripciones from "../pages/Inscripciones";
import Jugadores from "../pages/Jugadores";
import Reportes from "../pages/Reportes";
import Resultados from "../pages/Resultados";
import ErrorPage from "../pages/ErrorPage";


export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { path: "/index.html", element: <Home /> }, // Cambiamos index: true a path: "/"
      { path: "calendario", element: <Calendario /> },
      { path: "coordinacion", element: <Coordinacion /> },
      { path: "equipos", element: <Equipos /> },
      { path: "inscripciones", element: <Inscripciones /> },
      { path: "jugadores", element: <Jugadores /> },
      { path: "reportes", element: <Reportes /> },
      { path: "resultados", element: <Resultados /> },
      { path: "*", element: <ErrorPage /> }, // Página de error para rutas desconocidas
    ],
  },
]);
