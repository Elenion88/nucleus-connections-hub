import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout.tsx';
import { ToastHost } from './components/Toast.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { Landing } from './pages/Landing.tsx';
import { Discover } from './pages/Discover.tsx';
import { TalentDetail } from './pages/TalentDetail.tsx';
import { StartupDetail } from './pages/StartupDetail.tsx';
import { Network } from './pages/Network.tsx';
import { NucleusAdmin } from './pages/NucleusAdmin.tsx';
import { TalentSignup } from './pages/TalentSignup.tsx';
import { StartupSignup } from './pages/StartupSignup.tsx';
import { EmbedPreview } from './pages/EmbedPreview.tsx';
import { Story } from './pages/Story.tsx';
import { JoinChooser } from './pages/JoinChooser.tsx';
import { GuidedDemo } from './pages/GuidedDemo.tsx';

export default function App() {
  return (
    <ErrorBoundary>
      <ToastHost />
      <Routes>
        <Route path="/story" element={<Story />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/talent/:id" element={<TalentDetail />} />
          <Route path="/startup/:id" element={<StartupDetail />} />
          <Route path="/network" element={<Network />} />
          <Route path="/nucleus" element={<NucleusAdmin />} />
          <Route path="/join" element={<JoinChooser />} />
          <Route path="/join/talent" element={<TalentSignup />} />
          <Route path="/join/startup" element={<StartupSignup />} />
          <Route path="/embed-preview" element={<EmbedPreview />} />
          <Route path="/demo/:side/:who" element={<GuidedDemo />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
