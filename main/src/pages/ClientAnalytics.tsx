// ClientAnalytics is not currently routed — client analytics are shown on ClientDashboard.
// This file is kept as a placeholder to avoid dead import errors.
import React from "react";

const ClientAnalytics: React.FC = () => {
  return (
    <div className="p-8 text-center text-gray-500">
      <p className="text-lg font-medium">Analytics</p>
      <p className="text-sm mt-1">Please visit the Dashboard for full analytics.</p>
    </div>
  );
};

export default ClientAnalytics;
