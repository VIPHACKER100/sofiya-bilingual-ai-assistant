/**
 * SOFIYA Dashboard
 * Phase 11.1: Overview of today's schedule, reminders, health metrics
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Bell, Heart, Sun, ChevronRight } from 'lucide-react';

interface DashboardProps {
  accentColor?: string;
  onNavigate?: (view: string) => void;
}

export function Dashboard({ accentColor = '#8b5cf6', onNavigate }: DashboardProps) {
  const [schedule, setSchedule] = useState<Array<{ title: string; time: string; location?: string }>>([]);
  const [reminders, setReminders] = useState<Array<{ title: string; due: string }>>([]);
  const [health, setHealth] = useState<{ steps?: number; sleep?: number; mood?: string } | null>(null);

  useEffect(() => {
    // Fetch from API when backend is connected
    fetch('/api/dashboard/summary')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setSchedule(data.schedule || []);
          setReminders(data.reminders || []);
          setHealth(data.health || null);
        } else {
          setSchedule([{ title: 'Team standup', time: '10:00 AM', location: 'Zoom' }, { title: 'Lunch with Sarah', time: '1:00 PM' }]);
          setReminders([{ title: 'Call Mom', due: '6:00 PM' }, { title: 'Submit report', due: 'Today' }]);
        }
      })
      .catch(() => {
        setSchedule([{ title: 'Team standup', time: '10:00 AM', location: 'Zoom' }, { title: 'Lunch with Sarah', time: '1:00 PM' }]);
        setReminders([{ title: 'Call Mom', due: '6:00 PM' }, { title: 'Submit report', due: 'Today' }]);
      });
  }, []);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto p-6 space-y-8"
    >
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">{today}</p>
      </div>

      {/* Schedule */}
      <section className="bg-white/5 rounded-2xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 font-semibold">
            <Calendar className="w-5 h-5" style={{ color: accentColor }} />
            Today&apos;s Schedule
          </h2>
          {onNavigate && (
            <button onClick={() => onNavigate?.('calendar')} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="space-y-3">
          {schedule.length === 0 ? (
            <p className="text-slate-500 text-sm">No events today</p>
          ) : (
            schedule.slice(0, 5).map((e, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                <span className="font-medium">{e.title}</span>
                <span className="text-sm text-slate-400">{e.time} {e.location && `· ${e.location}`}</span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Reminders */}
      <section className="bg-white/5 rounded-2xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 font-semibold">
            <Bell className="w-5 h-5" style={{ color: accentColor }} />
            Reminders
          </h2>
          {onNavigate && (
            <button onClick={() => onNavigate?.('reminders')} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="space-y-3">
          {reminders.length === 0 ? (
            <p className="text-slate-500 text-sm">No reminders</p>
          ) : (
            reminders.slice(0, 5).map((r, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                <span>{r.title}</span>
                <span className="text-sm text-slate-400">{r.due}</span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Health summary */}
      {health && (
        <section className="bg-white/5 rounded-2xl border border-white/10 p-6">
          <h2 className="flex items-center gap-2 font-semibold mb-4">
            <Heart className="w-5 h-5" style={{ color: accentColor }} />
            Health
          </h2>
          <div className="flex gap-6">
            {health.steps != null && (
              <div className="flex items-center gap-2">
                <Sun className="w-5 h-5 text-slate-400" />
                <span>{health.steps.toLocaleString()} steps</span>
              </div>
            )}
            {health.sleep != null && (
              <div><span>{health.sleep}h sleep</span></div>
            )}
            {health.mood && (
              <div><span>Mood: {health.mood}</span></div>
            )}
          </div>
        </section>
      )}
    </motion.div>
  );
}
