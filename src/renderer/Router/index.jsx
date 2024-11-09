import { createBrowserRouter } from "react-router-dom";

import Calendario from "../pages/Calendario";
import Coordinacion from "../pages/Coordinacion";
import Equipos from "../pages/Equipos";
import Home from "../pages/Home";
import Inscripciones from "../pages/Inscripciones";
import Jugadores from "../pages/Jugadores";
import Reportes from "../pages/Reportes";
import Resultados from "../pages/Resultados";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/calendario",
    element: <Calendario />,
  },
  {
    path: "/coordinacion",
    element: <Coordinacion />,
  },
  {
    path: "/equipos",
    element: <Equipos />,
  },
  {
    path: "/inscripciones",
    element: <Inscripciones />,
  },
  {
    path: "/jugadores",
    element: <Jugadores />,
  },
  {
    path: "/reportes",
    element: <Reportes />,
  },
  {
    path: "/resultados",
    element: <Resultados />,
  },
])
