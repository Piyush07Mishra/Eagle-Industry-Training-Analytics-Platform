
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { apiGet } from "@/api/axios";

const TrainerSchedule = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Uses /api/trainer/sessions/full/ which auto-filters to the authenticated trainer
    apiGet<any[]>("/api/trainer/sessions/full/")
      .then((data) => { setSessions(Array.isArray(data) ? data : []); })
      .catch(err => console.error("Failed fetching sessions", err))
      .finally(() => setLoading(false));
  }, [user]);

  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    const dayIndex = currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1; // Make Monday start (0)
    startOfWeek.setDate(currentDate.getDate() - dayIndex); 
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekDays = getWeekDays();

  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  // Filter sessions that fall in the current selected week
  const currentWeekSessions = sessions.filter(session => {
      const sessionDate = new Date(session.start_time);
      const weekStart = new Date(weekDays[0]);
      weekStart.setHours(0,0,0,0);
      const weekEnd = new Date(weekDays[6]);
      weekEnd.setHours(23,59,59,999);
      return sessionDate >= weekStart && sessionDate <= weekEnd;
  }).sort((a,b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Training Schedule</h1>
          <p className="text-slate-500 mt-1">Manage your upcoming sessions and workshops.</p>
        </div>
        <Button onClick={() => navigate('/trainer/training')} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
          <Plus className="w-4 h-4 mr-2" /> New Session
        </Button>
      </div>

      <Card className="p-6 shadow-sm border-none ring-1 ring-slate-200 bg-white rounded-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            {currentDate.toLocaleString("default", { month: "long" })} {currentDate.getFullYear()}
          </h2>
          <div className="flex bg-slate-100 rounded-lg p-1">
            <Button variant="ghost" size="sm" onClick={handlePrevWeek} className="px-2 hover:bg-white text-slate-700">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())} className="px-4 font-medium hover:bg-white text-slate-700">
              Today
            </Button>
            <Button variant="ghost" size="sm" onClick={handleNextWeek} className="px-2 hover:bg-white text-slate-700">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-4 mb-6">
          {weekDays.map((day, idx) => {
            const isToday = new Date().toDateString() === day.toDateString();
            return (
              <div key={idx} className={`text-center py-3 rounded-xl border ${isToday ? "border-blue-600 bg-blue-50 text-blue-700" : "border-transparent text-slate-500"}`}>
                <div className="font-semibold text-sm mb-1">{day.toLocaleString("default", { weekday: "short" })}</div>
                <div className={`text-xl font-bold ${isToday ? "" : "text-slate-700"}`}>{day.getDate()}</div>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-slate-700 border-b pb-2">Upcoming Sessions for this Week</h3>
          
          {loading ? (
             <div className="py-12 text-center text-slate-500 animate-pulse">Loading schedule...</div>
          ) : currentWeekSessions.length > 0 ? (
            currentWeekSessions.map(session => (
              <div key={session.id} className="flex gap-4 p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group cursor-pointer bg-slate-50 hover:bg-white">
                <div className="w-20 flex flex-col justify-center items-center shrink-0 border-r border-slate-200 pr-4">
                  <span className="text-sm font-bold text-slate-700">
                    {new Date(session.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                  <span className="text-xs text-slate-500 font-medium mt-1">
                    {new Date(session.start_time).toLocaleString("default", { weekday: "short" }).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-lg text-slate-900 group-hover:text-blue-700 transition-colors">{session.title}</h4>
                    <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-700 rounded-lg">{session.session_type}</span>
                  </div>
                  <div className="flex gap-4 mt-2 text-sm text-slate-500">
                    <div className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {session.location || session.meeting_link || 'TBD'}</div>
                    <div className="flex items-center gap-1"><Clock className="w-4 h-4" /> 
                      {new Date(session.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                      {session.end_time ? new Date(session.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'TBD'}
                    </div>
                    <div className="flex items-center gap-1"><Users className="w-4 h-4" /> {session.trainees?.length || 0} Trainees</div>
                  </div>
                </div>
                <div className="flex items-center justify-center pl-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" onClick={() => navigate('/trainer/training')} className="text-blue-600">Manage</Button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-500">
              No sessions scheduled for this week.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default TrainerSchedule;

