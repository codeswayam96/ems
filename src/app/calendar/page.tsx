'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Plus, Calendar, Video, Clock, Loader2, ExternalLink } from 'lucide-react';
import { CreateMeetingModal } from '@/components/meetings/CreateMeetingModal';
import { useEmsUser } from '@/components/providers/EmsProvider';
import { hasPermission, UserRole } from '@/lib/permissions';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

interface Meeting {
  _id: string;
  title: string;
  scheduledTime: string;
  platform: 'teams' | 'meet' | 'other';
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  meetingLink?: string;
  department?: string;
  description?: string;
}

interface Task {
  _id: string;
  title: string;
  dueDate?: string;
  status: string;
  priority: string;
}

type CalEvent = {
  id: string;
  title: string;
  date: Date;
  type: 'meeting' | 'deadline';
  color: string;
  raw: Meeting | Task;
};

const addToGoogleCalendar = (m: Meeting) => {
  const start = new Date(m.scheduledTime);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/-|:|\.\d{3}/g, '');
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(m.title)}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent(m.description || '')}&location=${encodeURIComponent(m.meetingLink || '')}`;
  window.open(url, '_blank');
};

export default function CalendarPage() {
  const { user } = useEmsUser();
  const isManager = hasPermission((user?.appRole || (user as any)?.role) as UserRole, 'manager');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [meetRes, taskRes] = await Promise.all([apiClient.get('/meetings'), apiClient.get('/tasks')]);
      setMeetings(meetRes.data);
      setTasks(taskRes.data.filter((t: Task) => t.dueDate));
    } catch { toast.error('Failed to load calendar data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const events = useMemo<CalEvent[]>(() => {
    const meetEvents: CalEvent[] = meetings
      .filter(m => m.scheduledTime)
      .map(m => ({ id: m._id, title: m.title, date: new Date(m.scheduledTime), type: 'meeting', color: 'bg-violet-500', raw: m }));
    const taskEvents: CalEvent[] = tasks
      .filter(t => t.dueDate && t.status !== 'approved')
      .map(t => ({ id: t._id, title: t.title, date: new Date(t.dueDate!), type: 'deadline', color: t.priority === 'urgent' ? 'bg-red-500' : 'bg-amber-500', raw: t }));
    return [...meetEvents, ...taskEvents];
  }, [meetings, tasks]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });
  const weeks = useMemo(() => { const w = []; for (let i = 0; i < calDays.length; i += 7) w.push(calDays.slice(i, i + 7)); return w; }, [calDays]);

  const getEventsForDay = (day: Date) => events.filter(e => isSameDay(e.date, day));
  const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : [];
  const upcomingEvents = events.filter(e => e.date >= new Date()).sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start md:items-center gap-4 flex-col md:flex-row">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground mt-1">Meetings, deadlines, and upcoming events</p>
        </div>
        {isManager && <Button onClick={() => setCreateOpen(true)} className="gap-2 bg-violet-600 hover:bg-violet-700"><Plus className="w-4 h-4" />New Meeting</Button>}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="w-10 h-10 animate-spin text-violet-500" /></div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendar Grid */}
          <Card className="lg:col-span-2 border-none shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-bold">{format(currentDate, 'MMMM yyyy')}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} className="text-xs">Today</Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(subMonths(currentDate, 1))}><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(addMonths(currentDate, 1))}><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-center text-xs font-bold text-muted-foreground py-2">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {weeks.map((week, wi) => week.map((day) => {
                  const dayEvents = getEventsForDay(day);
                  const isSelected = selectedDay && isSameDay(day, selectedDay);
                  const todayDay = isToday(day);
                  return (
                    <div
                      key={`${wi}-${day}`}
                      onClick={() => setSelectedDay(isSameDay(day, selectedDay!) ? null : day)}
                      className={`min-h-[72px] rounded-lg p-1.5 cursor-pointer transition-all border ${
                        isSelected ? 'border-violet-500 bg-violet-500/10' :
                        todayDay ? 'border-violet-500/30 bg-violet-500/5' :
                        isSameMonth(day, currentDate) ? 'border-transparent hover:bg-muted/50' : 'border-transparent opacity-30'
                      }`}
                    >
                      <p className={`text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${todayDay ? 'bg-violet-600 text-white' : ''}`}>
                        {format(day, 'd')}
                      </p>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 2).map(ev => (
                          <div key={ev.id} className={`text-[9px] px-1 py-0.5 rounded truncate text-white font-medium ${ev.color}`} title={ev.title}>{ev.title}</div>
                        ))}
                        {dayEvents.length > 2 && <p className="text-[9px] text-muted-foreground px-1">+{dayEvents.length - 2}</p>}
                      </div>
                    </div>
                  );
                }))}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t flex-wrap">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-2.5 h-2.5 rounded-full bg-violet-500" />Meeting</span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-2.5 h-2.5 rounded-full bg-red-500" />Urgent Deadline</span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" />Deadline</span>
              </div>
            </CardContent>
          </Card>

          {/* Sidebar: Selected Day / Upcoming */}
          <div className="space-y-4">
            {selectedDay && (
              <Card className="border-none shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-violet-500" />
                    {format(selectedDay, 'EEEE, MMM d')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selectedEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No events this day</p>
                  ) : selectedEvents.map(ev => (
                    <div key={ev.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors">
                      <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${ev.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm line-clamp-1">{ev.title}</p>
                        <p className="text-xs text-muted-foreground">{format(ev.date, 'hh:mm a')} · {ev.type === 'meeting' ? 'Meeting' : 'Deadline'}</p>
                      </div>
                      {ev.type === 'meeting' && (
                        <div className="flex gap-1">
                          {(ev.raw as Meeting).meetingLink && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open((ev.raw as Meeting).meetingLink, '_blank')}><ExternalLink className="w-3.5 h-3.5" /></Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Add to Google Calendar" onClick={() => addToGoogleCalendar(ev.raw as Meeting)}><Calendar className="w-3.5 h-3.5" /></Button>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card className="border-none shadow-md">
              <CardHeader className="pb-2"><CardTitle className="text-base font-bold flex items-center gap-2"><Clock className="w-4 h-4 text-violet-500" />Upcoming Events</CardTitle></CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {upcomingEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">No upcoming events</p>
                ) : upcomingEvents.map(ev => (
                  <div key={ev.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group" onClick={() => setSelectedDay(ev.date)}>
                    <div className={`w-8 h-8 rounded-lg ${ev.color} flex items-center justify-center shrink-0`}>
                      {ev.type === 'meeting' ? <Video className="w-4 h-4 text-white" /> : <Clock className="w-4 h-4 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm line-clamp-1 group-hover:text-violet-600 transition-colors">{ev.title}</p>
                      <p className="text-xs text-muted-foreground">{format(ev.date, 'MMM d')} at {format(ev.date, 'hh:mm a')}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">{ev.type === 'meeting' ? 'Meeting' : 'Due'}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <CreateMeetingModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onCreated={fetchData} />
    </div>
  );
}
