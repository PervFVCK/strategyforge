import { useEffect } from 'react';
import AppRoutes from './routes';

function App() {
  useEffect(() => {
    // Apply saved theme on app load
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return <AppRoutes />;
}

export default App;
