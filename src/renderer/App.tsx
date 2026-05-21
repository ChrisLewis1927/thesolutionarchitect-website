// ArchLens — App root with React Router
// Implemented in Task 15.1

import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import QA from './pages/QA';
import DocumentReview from './pages/DocumentReview';
import Articles from './pages/Articles';
import Learning from './pages/Learning';
import Diagrams from './pages/Diagrams';
import Artifacts from './pages/Artifacts';
import Career from './pages/Career';
import Progress from './pages/Progress';
import Guardrails from './pages/Guardrails';
import Academy from './pages/Academy';
import Settings from './pages/Settings';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/qa" element={<QA />} />
          <Route path="/documents" element={<DocumentReview />} />
          <Route path="/articles" element={<Articles />} />
          <Route path="/learning" element={<Learning />} />
          <Route path="/diagrams" element={<Diagrams />} />
          <Route path="/artifacts" element={<Artifacts />} />
          <Route path="/career" element={<Career />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/guardrails" element={<Guardrails />} />
          <Route path="/academy" element={<Academy />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
