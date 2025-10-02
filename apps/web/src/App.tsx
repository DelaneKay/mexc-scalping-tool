import React from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { SettingsPanel } from './components/SettingsPanel';
import { SymbolDrawer } from './components/SymbolDrawer';
import { RiskBanner } from './components/RiskBanner';
import { useAppStore } from './store/useAppStore';

function App() {
  const { isSettingsOpen, selectedSymbol } = useAppStore();

  return (
    <div className="min-h-screen bg-crypto-dark">
      {/* Risk Banner */}
      <RiskBanner />
      
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Dashboard />
      </main>
      
      {/* Settings Panel */}
      {isSettingsOpen && <SettingsPanel />}
      
      {/* Symbol Drawer */}
      {selectedSymbol && <SymbolDrawer />}
    </div>
  );
}

export default App;