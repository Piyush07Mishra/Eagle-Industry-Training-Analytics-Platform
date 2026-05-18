import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute as RouteGuard } from "./lib/routeGuards";
import { AppLayout } from "./components/AppLayout";
import TrainingLoginPage from "./pages/TrainingLoginPage";

// Public
import Enroll from "./pages/Enroll";
import QRScanPage from "./pages/QRScanPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";

// Admin
import AdminDashboard from "./pages/AdminDashboard";
import AdminTrainingManagement from "./pages/AdminTrainingManagement";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminFeedback from "./pages/AdminFeedback";
import MapScreen from "./pages/MapScreen";

// Trainer
import TrainerDashboard from "./pages/TrainerDashboard";
import TrainerTrainingManagement from "./pages/TrainerTrainingManagement";
import TrainerQuizBuilder from "./pages/TrainerQuizBuilder";
import TrainerSchedule from "./pages/TrainerSchedule";
import TrainerFeedback from "./pages/TrainerFeedback";
import TrainerLeaderboard from "./pages/TrainerLeaderboard";
import TrainerTraineePerformance from "./pages/trainer/TrainerTraineePerformance";

// Trainee
import TraineeDashboard from "./pages/TraineeDashboard";
import TraineeReportCard from "./pages/TraineeReportCard";
import TraineeUpcomingSessions from "./pages/TraineeUpcomingSessions";
import TraineeAvailableSessions from "./pages/TraineeAvailableSessions";
import TraineeCompletedSessions from "./pages/TraineeCompletedSessions";
import TraineeAttendance from "./pages/TraineeAttendance";
import TraineeFeedback from "./pages/TraineeFeedback";
import TraineeCertificates from "./pages/TraineeCertificates";

// Client
import ClientDashboard from "./pages/ClientDashboard";
import ClientCompliance from "./pages/ClientCompliance";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<TrainingLoginPage />} />
            <Route path="/enroll/scan" element={<QRScanPage />} />
            <Route path="/enroll/:qr_token" element={<Enroll />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <RouteGuard allowedRoles={["ADMIN"]}>
                  <AppLayout />
                </RouteGuard>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="training" element={<AdminTrainingManagement />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="feedback" element={<AdminFeedback />} />
              <Route path="compliance" element={<MapScreen />} />
            </Route>

            {/* Trainer Routes */}
            <Route
              path="/trainer"
              element={
                <RouteGuard allowedRoles={["TRAINER"]}>
                  <AppLayout />
                </RouteGuard>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<TrainerDashboard />} />
              <Route path="training" element={<TrainerTrainingManagement />} />
              <Route path="quiz-builder" element={<TrainerQuizBuilder />} />
              <Route path="schedule" element={<TrainerSchedule />} />
              <Route path="feedback" element={<TrainerFeedback />} />
              <Route path="leaderboard" element={<TrainerLeaderboard />} />
              <Route path="trainees" element={<TrainerTraineePerformance />} />
            </Route>

            {/* Trainee Routes */}
            <Route
              path="/trainee"
              element={
                <RouteGuard allowedRoles={["TRAINEE"]}>
                  <AppLayout />
                </RouteGuard>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<TraineeDashboard />} />
              <Route path="report-card" element={<TraineeReportCard />} />
              <Route path="sessions/upcoming" element={<TraineeUpcomingSessions />} />
              <Route path="sessions/available" element={<TraineeAvailableSessions />} />
              <Route path="sessions/completed" element={<TraineeCompletedSessions />} />
              <Route path="attendance" element={<TraineeAttendance />} />
              <Route path="feedback" element={<TraineeFeedback />} />
              <Route path="certificates" element={<TraineeCertificates />} />
            </Route>

            {/* Client Routes */}
            <Route
              path="/client"
              element={
                <RouteGuard allowedRoles={["CLIENT"]}>
                  <AppLayout />
                </RouteGuard>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<ClientDashboard />} />
              <Route path="compliance" element={<ClientCompliance />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
