import { ErrorBoundary } from "./components/ErrorBoundary";
import JackettSearch from "./components/JackettSearch";

function App() {
  return (
    <ErrorBoundary>
      <div className="App">
        <JackettSearch />
      </div>
    </ErrorBoundary>
  );
}

export default App;
