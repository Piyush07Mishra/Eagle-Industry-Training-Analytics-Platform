import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CheckCircle, Calendar, Clock, MapPin, Users, BookOpen,
  Loader2, AlertCircle, Lock, Video, Building2
} from "lucide-react";
import { apiFetch, apiPost } from "@/api/axios";
import { useAuth } from "@/contexts/AuthContext";

interface SessionPreview {
  id: number;
  title: string;
  course_title: string;
  course_description: string;
  trainer_name: string;
  trainer_id: string;
  session_type: string;
  status: string;
  date: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  location: string;
  site_location: string;
  meeting_link: string | null;
  max_trainees: number;
  enrolled_count: number;
  seats_remaining: number;
  is_full: boolean;
  already_enrolled: boolean;
  qr_token: string;
  enrollment_link: string;
}

const Enroll: React.FC = () => {
  const { qr_token } = useParams<{ qr_token: string }>();
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const [session, setSession] = useState<SessionPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [error, setError] = useState("");
  const [enrollError, setEnrollError] = useState("");

  // Inline login state (shown when not authenticated)
  const [loginForm, setLoginForm] = useState({ employee_id: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  // ── Fetch session preview (no auth required) ──────────────
  useEffect(() => {
    if (!qr_token) return;
    apiFetch(`/api/enroll/${qr_token}/`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setSession(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load session info. The QR code may be invalid.");
        setLoading(false);
      });
  }, [qr_token]);

  // ── Inline login ──────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoggingIn(true);
    try {
      await login(loginForm.employee_id, loginForm.password);
    } catch {
      setLoginError("Invalid Employee ID or password. Please try again.");
    } finally {
      setLoggingIn(false);
    }
  };

  // ── Enroll ────────────────────────────────────────────────
  const handleEnroll = async () => {
    if (!user) return;
    setEnrolling(true);
    setEnrollError("");
    try {
      const data: any = await apiPost(`/api/enroll/${qr_token}/confirm/`, {
        enrolled_via: "QR",
      });
      if (data.already_enrolled) {
        // Already enrolled — still a success, navigate to upcoming
        setEnrolled(true);
      } else {
        setEnrolled(true);
      }
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || "Enrollment failed. Please try again.";
      setEnrollError(msg);
    } finally {
      setEnrolling(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Loading session details...</p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center shadow-lg border-0">
          <AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid or Expired Link</h2>
          <p className="text-gray-500 text-sm">{error}</p>
          <Button className="mt-6 w-full" onClick={() => navigate("/login")}>Go to Login</Button>
        </Card>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────
  if (enrolled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center shadow-lg border-0">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {session?.already_enrolled ? "Already Enrolled!" : "Successfully Enrolled!"}
          </h2>
          <p className="text-gray-600 mb-1">You are enrolled in</p>
          <p className="font-bold text-gray-900 text-lg">{session?.course_title}</p>
          <p className="text-sm text-gray-500 mt-2">
            {session?.date} · {session?.start_time}
          </p>
          <p className="text-sm text-gray-500">{session?.location || session?.site_location}</p>
          <div className="mt-6 space-y-2">
            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => navigate("/trainee/sessions/upcoming")}>
              View Upcoming Sessions
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate("/trainee/dashboard")}>
              Go to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ── Main page ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4">

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex p-3 bg-blue-600 rounded-2xl mb-3 shadow-lg">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Session Enrollment</h1>
          <p className="text-gray-500 text-sm mt-1">Eagle Industry Training Portal</p>
        </div>

        {/* Session Details Card */}
        <Card className="overflow-hidden shadow-lg border-0">
          <div className="bg-blue-600 px-6 py-4">
            <h2 className="text-lg font-bold text-white">{session?.course_title}</h2>
            {session?.course_description && (
              <p className="text-blue-100 text-sm mt-1 line-clamp-2">{session.course_description}</p>
            )}
          </div>
          <div className="px-6 py-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                <span>{session?.date || session?.scheduled_date}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                <span>{session?.start_time} – {session?.end_time}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                {session?.session_type === "ONLINE"
                  ? <Video className="w-4 h-4 text-blue-500 shrink-0" />
                  : <Building2 className="w-4 h-4 text-blue-500 shrink-0" />}
                <span>{session?.location || session?.site_location || "Online"}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-4 h-4 text-blue-500 shrink-0" />
                <span>{session?.enrolled_count} / {session?.max_trainees} enrolled</span>
              </div>
            </div>

            <div className="flex gap-2 pt-1 flex-wrap">
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                session?.session_type === "ONLINE"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-green-100 text-green-700"
              }`}>
                {session?.session_type}
              </span>
              {session?.trainer_name && (
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                  Trainer: {session.trainer_name}
                </span>
              )}
              {session?.is_full && (
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-700">
                  Session Full
                </span>
              )}
              {session?.seats_remaining !== undefined && !session.is_full && (
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                  {session.seats_remaining} seats left
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* Auth / Enroll Section */}
        {!user ? (
          // NOT LOGGED IN — show inline login form
          <Card className="p-6 shadow-lg border-0">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-amber-100 rounded-lg">
                <Lock className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-sm font-semibold text-gray-800">Log in to confirm your enrollment</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-3">
              <Input
                placeholder="Employee ID (e.g. trainee01)"
                value={loginForm.employee_id}
                onChange={e => setLoginForm(f => ({ ...f, employee_id: e.target.value }))}
                required
                autoComplete="username"
              />
              <Input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                required
                autoComplete="current-password"
              />
              {loginError && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {loginError}
                </p>
              )}
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loggingIn}>
                {loggingIn ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Logging in...</> : "Login & Enroll"}
              </Button>
            </form>
          </Card>
        ) : (
          // LOGGED IN — show enroll button
          <Card className="p-6 shadow-lg border-0">
            <div className="flex items-center gap-2 mb-4 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <p className="text-sm font-medium">
                Logged in as <span className="font-bold">{user.employee_id || user.username}</span>
              </p>
            </div>

            {user.role !== "TRAINEE" ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                Only trainees can enroll in sessions. Please log in with a trainee account.
              </div>
            ) : session?.is_full ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                This session is full. No seats remaining.
              </div>
            ) : (
              <>
                {enrollError && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {enrollError}
                  </div>
                )}
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-base font-semibold"
                  onClick={handleEnroll}
                  disabled={enrolling}
                >
                  {enrolling
                    ? <><Loader2 className="w-5 h-5 animate-spin mr-2" />Enrolling...</>
                    : "✅ Confirm Enrollment"}
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              className="w-full mt-2 text-sm text-gray-500"
              onClick={() => navigate(-1)}
            >
              Go Back
            </Button>
          </Card>
        )}

        <p className="text-center text-xs text-gray-400 pb-4">
          Eagle Industry Training Portal · Secure enrollment
        </p>
      </div>
    </div>
  );
};

export default Enroll;
