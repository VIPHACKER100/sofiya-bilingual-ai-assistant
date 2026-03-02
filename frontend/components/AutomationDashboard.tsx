import React, { useState, useEffect, FC } from 'react';

interface Task {
    id: string;
    name: string;
    description: string;
    command: string;
    schedule_type: string;
    schedule_time: string;
    days: string[];
    enabled: boolean;
    run_count: number;
    last_run: string;
}

interface Macro {
    id: string;
    name: string;
    description: string;
    commands: any[];
    trigger: string;
    trigger_phrase: string;
    enabled: boolean;
    run_count: number;
}

interface AutomationDashboardProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AutomationDashboard: FC<AutomationDashboardProps> = ({ isOpen, onClose }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [macros, setMacros] = useState<Macro[]>([]);
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'tasks' | 'macros'>('tasks');

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch tasks
            const tasksRes = await fetch('http://localhost:8000/api/automation/tasks');
            const tasksData = await tasksRes.json();
            if (tasksData.success) {
                setTasks(tasksData.tasks);
            }

            // Fetch macros
            const macrosRes = await fetch('http://localhost:8000/api/automation/macros');
            const macrosData = await macrosRes.json();
            if (macrosData.success) {
                setMacros(macrosData.macros);
            }

            // Fetch status
            const statusRes = await fetch('http://localhost:8000/api/automation/status');
            const statusData = await statusRes.json();
            if (statusData.success) {
                setStatus(statusData.status);
            }
        } catch (error) {
            console.error('Error fetching automation data:', error);
        }
        setLoading(false);
    };

    const toggleTask = async (taskId: string) => {
        try {
            await fetch(`http://localhost:8000/api/automation/task/${taskId}/toggle`, {
                method: 'POST'
            });
            fetchData();
        } catch (error) {
            console.error('Error toggling task:', error);
        }
    };

    const runMacro = async (macroId: string) => {
        try {
            await fetch(`http://localhost:8000/api/automation/macro/${macroId}/run`, {
                method: 'POST'
            });
            fetchData();
        } catch (error) {
            console.error('Error running macro:', error);
        }
    };

    const getScheduleLabel = (task: Task) => {
        switch (task.schedule_type) {
            case 'daily':
                return `Daily at ${task.schedule_time}`;
            case 'weekly':
                return `Weekly on ${task.days.join(', ')} at ${task.schedule_time}`;
            case 'interval':
                return `Every ${task.schedule_time} minutes`;
            default:
                return task.schedule_type;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden bg-slate-900/90 border border-cyan-500/30 rounded-lg shadow-[0_0_50px_rgba(6,182,212,0.2)] flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-900/50 to-cyan-900/50 p-6 border-b border-cyan-500/30 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-widest uppercase flex items-center gap-3 font-mono">
                            <span className="text-cyan-500 animate-pulse">⚡</span>
                            Automation Protocol
                        </h2>
                        <p className="text-cyan-400/60 text-xs mt-1 font-mono tracking-wider">SECURE_LEVEL_ALPHA // TASK_SCHEDULER_V2</p>
                    </div>
                    <div className="flex gap-4 items-center">
                        {status && (
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black tracking-widest font-mono ${status.running
                                    ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5'
                                    : 'border-red-500/30 text-red-400 bg-red-500/5'
                                }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${status.running ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                                {status.running ? 'CORE_ACTIVE' : 'CORE_OFFLINE'}
                            </div>
                        )}
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all font-mono"
                        >
                            ×
                        </button>
                    </div>
                </div>

                {/* Status Bar */}
                {status && (
                    <div className="bg-black/40 p-3 border-b border-slate-700/50 flex gap-8 text-[10px] font-mono tracking-widest pl-6">
                        <div className="text-cyan-400 uppercase">
                            <span className="text-slate-500 opacity-60">TASKS:</span> {status.enabled_tasks}/{status.total_tasks}
                        </div>
                        <div className="text-violet-400 uppercase">
                            <span className="text-slate-500 opacity-60">MACROS:</span> {status.enabled_macros}/{status.total_macros}
                        </div>
                        <div className="text-amber-400 uppercase">
                            <span className="text-slate-500 opacity-60">JOBS:</span> {status.scheduled_jobs}
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex border-b border-slate-700/50 bg-black/20">
                    <button
                        onClick={() => setActiveTab('tasks')}
                        className={`flex-1 py-4 text-xs font-black tracking-[0.2em] uppercase transition-all ${activeTab === 'tasks'
                                ? 'text-cyan-400 border-b-2 border-cyan-500 bg-cyan-500/5'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                            }`}
                    >
                        Scheduled Tasks
                    </button>
                    <button
                        onClick={() => setActiveTab('macros')}
                        className={`flex-1 py-4 text-xs font-black tracking-[0.2em] uppercase transition-all ${activeTab === 'macros'
                                ? 'text-violet-400 border-b-2 border-violet-500 bg-violet-500/5'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                            }`}
                    >
                        Automation Macros
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-black/10">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center text-cyan-400 font-mono italic p-12">
                            <div className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-4"></div>
                            <p className="animate-pulse tracking-widest uppercase text-xs">Synchronizing_Automation_Data...</p>
                        </div>
                    ) : activeTab === 'tasks' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {tasks.length === 0 ? (
                                <div className="col-span-2 text-center py-12 border border-dashed border-slate-700 rounded-lg">
                                    <p className="text-slate-500 font-mono text-sm tracking-widest uppercase">No automated tasks detected</p>
                                </div>
                            ) : (
                                tasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="bg-slate-800/20 border border-slate-700/50 rounded-lg p-5 hover:border-cyan-500/30 transition-all group backdrop-blur-sm"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="font-bold text-white tracking-wide uppercase text-sm font-mono">{task.name}</h3>
                                                    <div className={`w-2 h-2 rounded-full ${task.enabled ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
                                                </div>
                                                <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-2 italic">{task.description}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2 mb-4 font-mono text-[10px]">
                                            <div className="flex justify-between items-center text-cyan-400">
                                                <span className="text-slate-600 uppercase">SCHEDULE:</span>
                                                <span>{getScheduleLabel(task)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-slate-400">
                                                <span className="text-slate-600 uppercase">COMMAND:</span>
                                                <span className="truncate ml-4 max-w-[200px]">{task.command}</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center pt-3 border-t border-slate-800/50">
                                            <div className="text-[10px] text-slate-600 font-mono">
                                                RUN_COUNT: <span className="text-slate-400">{task.run_count}</span>
                                            </div>
                                            <button
                                                onClick={() => toggleTask(task.id)}
                                                className={`px-4 py-1.5 rounded-sm text-[10px] font-black tracking-widest uppercase transition-all ${task.enabled
                                                        ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20'
                                                        : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20'
                                                    }`}
                                            >
                                                {task.enabled ? 'DEACTIVATE' : 'ACTIVATE'}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {macros.length === 0 ? (
                                <div className="col-span-2 text-center py-12 border border-dashed border-slate-700 rounded-lg">
                                    <p className="text-slate-500 font-mono text-sm tracking-widest uppercase">No macros protocols discovered</p>
                                </div>
                            ) : (
                                macros.map((macro) => (
                                    <div
                                        key={macro.id}
                                        className="bg-slate-800/20 border border-slate-700/50 rounded-lg p-5 hover:border-violet-500/30 transition-all group backdrop-blur-sm"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="font-bold text-white tracking-wide uppercase text-sm font-mono">{macro.name}</h3>
                                                    <div className={`w-2 h-2 rounded-full ${macro.enabled ? 'bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]' : 'bg-slate-600'}`} />
                                                </div>
                                                <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-2 italic">{macro.description}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2 mb-4 font-mono text-[10px]">
                                            <div className="flex justify-between items-center text-violet-400">
                                                <span className="text-slate-600 uppercase">PROTOCOL TYPE:</span>
                                                <span className="uppercase">{macro.trigger}</span>
                                            </div>
                                            {macro.trigger_phrase && (
                                                <div className="flex justify-between items-center text-cyan-400">
                                                    <span className="text-slate-600 uppercase">VOICE_TRIGGER:</span>
                                                    <span className="italic">"{macro.trigger_phrase}"</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex justify-between items-center pt-3 border-t border-slate-800/50">
                                            <div className="text-[10px] text-slate-600 font-mono">
                                                PROCEDURES: <span className="text-slate-400">{macro.commands.length}</span>
                                            </div>
                                            <button
                                                onClick={() => runMacro(macro.id)}
                                                disabled={!macro.enabled}
                                                className="px-6 py-1.5 bg-violet-600/20 hover:bg-violet-600/40 disabled:bg-slate-800/50 disabled:text-slate-600 text-violet-400 border border-violet-500/20 rounded-sm text-[10px] font-black tracking-widest uppercase transition-all shadow-inner"
                                            >
                                                EXECUTE
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Footer info */}
                <div className="bg-black/40 p-4 border-t border-slate-700/50 flex justify-between items-center px-8">
                    <div className="flex gap-6">
                        <div className="flex items-center gap-2 text-[9px] font-mono tracking-widest">
                            <span className="text-slate-600 uppercase">SYSTEM_OVERSIGHT:</span>
                            <span className="text-emerald-500 animate-pulse uppercase">ENABLED</span>
                        </div>
                        <div className="flex items-center gap-2 text-[9px] font-mono tracking-widest">
                            <span className="text-slate-600 uppercase">MOD_KEY:</span>
                            <span className="text-slate-400">SHIFT+A</span>
                        </div>
                    </div>
                    <button
                        onClick={fetchData}
                        className="text-[9px] font-black tracking-[0.3em] uppercase text-cyan-500/60 hover:text-cyan-400 transition-colors flex items-center gap-2 border-b border-cyan-500/20 pb-0.5"
                    >
                        Refresh_Pipeline
                    </button>
                </div>
            </div>
        </div>
    );
};
