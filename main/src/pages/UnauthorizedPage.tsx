import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="max-w-md text-center">
        <div className="mb-6">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 text-lg">
            You don't have permission to access this page
          </p>
        </div>

        <div className="bg-white rounded-lg p-6 mb-6 shadow-md">
          <p className="text-sm text-gray-700 mb-4">
            This page is restricted to certain user roles. Your current role
            doesn't have access to this content.
          </p>
          <div className="text-left bg-gray-50 rounded p-3 mb-4">
            <p className="text-xs font-semibold text-gray-600 mb-2">
              Available Actions:
            </p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Check your login role</li>
              <li>• Contact your administrator for access</li>
              <li>• Return to your dashboard</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => navigate("/")}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Button>
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="flex-1"
          >
            Go Back
          </Button>
        </div>

        <div className="mt-6 text-xs text-gray-500">
          <p>If you believe this is an error, please contact support.</p>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
