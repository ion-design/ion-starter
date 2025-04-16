import React, { type ReactElement } from 'react';
import { Route, Routes } from 'react-router-dom';

import Generation from './Generation';

function App(): ReactElement {
  return (
    <Routes>
      <Route path="/" element={<Generation />} />
    </Routes>
  );
}

export default App;
