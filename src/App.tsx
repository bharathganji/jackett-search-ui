import { ErrorBoundary } from "./components/ErrorBoundary";
import JackettSearch from "./components/JackettSearch";

console.log("VITE_JACKETT_API_URL:", import.meta.env.VITE_JACKETT_API_URL);

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
