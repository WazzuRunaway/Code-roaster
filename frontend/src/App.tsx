import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ResultPage from './pages/ResultPage';
import RecentlyRoastedPage from './pages/RecentlyRoastedPage';
import HallOfFamePage from './pages/HallOfFamePage';
import Navbar from './components/Navbar';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/result/:id" element={<ResultPage />} />
        <Route path="/roasted" element={<RecentlyRoastedPage />} />
        <Route path="/halloffame" element={<HallOfFamePage />} />
      </Routes>
    </>
  );
}

export default App;
