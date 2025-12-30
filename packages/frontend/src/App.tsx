import type { JSX } from 'react';
import { HealthCheck } from './components/HealthCheck';
import './App.css';

const App = (): JSX.Element => {
  return (
    <div className="App">
      <h1>🎨 GitCanvas</h1>
      <p>Paint your Git history</p>
      <HealthCheck />
    </div>
  );
};

export default App;
