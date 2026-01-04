import './App.css';
import { RepositoryViewer } from './components/Repository/RepositoryViewer';

const App = () => {
  return (
    <div className="App">
      <h1>🎨 GitCanvas</h1>
      <p className="App-subtitle">Paint your Git history</p>
      <RepositoryViewer owner="Sottiki" repo="git-canvas" />
    </div>
  );
};

export default App;
