
import RoutesApp from "./routes"

import { ToastContainer, toast } from "react-toastify";

// import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <div className="app">
      <ToastContainer autoClose={4000}/>
      <RoutesApp/>
    </div>
  );
}

export default App;
