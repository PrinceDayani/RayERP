'use client';

import React, { useState } from 'react';
import FinanceNavigation from './FinanceNavigation';
import JournalEntries from './JournalEntries';
import GeneralLedger from './GeneralLedger';
import Reports from './Reports';
import Analytics from './Analytics';

const FinanceMain: React.FC = () => {
  const [activeSection, setActiveSection] = useState('dashboard');

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'journal-entries':
        return <JournalEntries />;
      case 'ledger':
        return <GeneralLedger />;
      case 'reports':
        return <Reports />;
      case 'analytics':
        return <Analytics />;
      default:
        return <FinanceNavigation activeSection={activeSection} onSectionChange={setActiveSection} />;
    }
  };

  return (
    <div className="min-h-screen">
      {renderActiveSection()}
    </div>
  );
};

export default FinanceMain;