import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ResultPage from './pages/ResultPage';
import RecentlyRoastedPage from './pages/RecentlyRoastedPage';
import HallOfShamePage from './pages/HallOfFamePage';
import NotFoundPage from './pages/NotFoundPage';
import Navbar from './components/Navbar';

function App() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/result/:id" element={<ResultPage />} />
          <Route path="/roasted" element={<RecentlyRoastedPage />} />
          <Route path="/halloffame" element={<HallOfShamePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
