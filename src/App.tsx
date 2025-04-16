import React, { type ReactElement } from "react";
import { Route, Routes } from "react-router-dom";

import Welcome from "./Welcome";

function App(): ReactElement {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
    </Routes>
  );
}

export default App;
