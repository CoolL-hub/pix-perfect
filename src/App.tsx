import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import Main from "./pages/Main/Main";

function App() {
  return (
    <Main/>
  );
}

export default App;
