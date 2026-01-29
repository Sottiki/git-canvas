import './App.css';
import { LoginButton } from './components/Auth/LoginButton';
import { RepositoryViewer } from './components/Repository/RepositoryViewer';

const App = () => {
  return (
    <div className="App">
      <header className="App-header">
        <h1>🎨 GitCanvas</h1>
        <LoginButton />
      </header>
      <p className="App-subtitle">Paint your Git history</p>
      <RepositoryViewer owner="Sottiki" repo="git-canvas" />
    </div>
  );
};

export default App;
