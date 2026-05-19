import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, ScanFace, CheckCircle2, AlertCircle, Calendar, ArrowUpRight, Activity, X, Loader2, Phone, MessageSquare, ChevronDown, Package } from 'lucide-react';

const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function DashboardPage() {
    const [statsData, setStatsData] = useState({
        total_families: 0,
        distributed_this_month: 0,
        pending_this_month: 0,
        failed_today: 0
    });
    
    const [dashboardData, setDashboardData] = useState({
        recentActivity: [],
        calendarData: {},
        currentMonth: new Date().getMonth() + 1,
        currentYear: new Date().getFullYear(),
        daysInMonth: 30,
        firstWeekday: 0,
        today: new Date().getDate(),
        stockSummary: { total_stock_kg: 0, distributed_kg: 0, balance_kg: 0 }
    });

    const [activeListType, setActiveListType] = useState(null);
    const [listData, setListData] = useState([]);
    const [isLoadingList, setIsLoadingList] = useState(false);
    const [selectedDay, setSelectedDay] = useState(null);

    useEffect(() => {
        axios.get('https://ration-authontication-1.onrender.com/api/stats')
            .then(res => setStatsData(res.data))
            .catch(err => console.error("Failed to fetch stats", err));
            
        axios.get('https://ration-authontication-1.onrender.com/api/dashboard_data')
            .then(res => setDashboardData(res.data))
            .catch(err => console.error("Failed to fetch dashboard data", err));
    }, []);

    useEffect(() => {
        if (activeListType) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [activeListType]);

    const stats = [
        { name: 'Total Families Registered', value: statsData.total_families.toString(), type: 'total', icon: Users, change: 'Lifetime', positive: true, color: 'from-blue-400 to-blue-600', bg: 'bg-blue-50', text: 'text-blue-600' },
        { name: 'Rations Distributed (Month)', value: statsData.distributed_this_month.toString(), type: 'distributed', icon: CheckCircle2, change: 'This month', positive: true, color: 'from-emerald-400 to-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-600' },
        { name: 'Pending Families (Month)', value: statsData.pending_this_month.toString(), type: 'pending', icon: Calendar, change: 'Waiting', positive: false, color: 'from-amber-400 to-amber-600', bg: 'bg-amber-50', text: 'text-amber-600' },
        { name: 'Failed Scans (Today)', value: statsData.failed_today?.toString() || '0', type: 'failed', icon: AlertCircle, change: 'Today', positive: false, color: 'from-red-400 to-red-600', bg: 'bg-red-50', text: 'text-red-600' },
    ];

    const handleCardClick = async (type) => {
        setActiveListType(type);
        setIsLoadingList(true);
        try {
            const res = await axios.get(`https://ration-authontication-1.onrender.com/api/dashboard/details?type=${type}`);
            setListData(res.data);
        } catch(err) {
            console.error("Failed to fetch list", err);
            setListData([]);
        } finally {
            setIsLoadingList(false);
        }
    };

    const { recentActivity, calendarData, currentMonth, currentYear, daysInMonth, firstWeekday, today, stockSummary } = dashboardData;

    // Build calendar grid cells
    const calendarCells = [];
    // firstWeekday: 0=Monday. We need blank cells for offset
    for (let i = 0; i < firstWeekday; i++) {
        calendarCells.push({ day: null, key: `blank-${i}` });
    }
    for (let d = 1; d <= daysInMonth; d++) {
        const families = calendarData[String(d)] || [];
        calendarCells.push({ day: d, families, key: `day-${d}` });
    }

    const selectedDayFamilies = selectedDay ? (calendarData[String(selectedDay)] || []) : [];

    return (
        <>
        <div className="max-w-7xl mx-auto p-6 mt-4 space-y-8 animate-in fade-in zoom-in-95 duration-500">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 to-zinc-600 tracking-tight flex items-center">
                        <Activity className="mr-3 text-blue-600" size={28} /> Staff Dashboard
                    </h2>
                    <p className="text-zinc-500 mt-1 font-medium">Overview of today's ration distribution analytics.</p>
                </div>
                <div className="bg-white/70 backdrop-blur-md border border-white/20 shadow-lg shadow-blue-500/5 rounded-2xl px-5 py-3 flex items-center space-x-3 text-sm font-semibold text-zinc-700 hover:scale-105 transition-transform">
                    <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600">
                        <Calendar size={18} />
                    </div>
                    <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} onClick={() => handleCardClick(stat.type)} className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl shadow-xl shadow-zinc-200/40 border border-white/40 flex flex-col hover:-translate-y-1 hover:shadow-2xl transition-all cursor-pointer relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-10 rounded-bl-full group-hover:scale-125 transition-transform duration-500`}></div>
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.text} flex items-center justify-center shadow-inner group-hover:rotate-6 transition-transform`}>
                                <stat.icon size={24} />
                            </div>
                            <span className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center shadow-sm ${stat.positive ? 'bg-emerald-100 text-emerald-700 border border-emerald-200/50' : 'bg-rose-100 text-rose-700 border border-rose-200/50'}`}>
                                {stat.change}
                            </span>
                        </div>
                        <h3 className="text-zinc-500 text-sm font-bold mb-1 relative z-10">{stat.name}</h3>
                        <p className={`text-4xl font-black bg-clip-text text-transparent bg-gradient-to-br ${stat.color} relative z-10 drop-shadow-sm`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Monthly Calendar Area */}
                <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-xl shadow-zinc-200/40 border border-white/40">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-zinc-800">Distribution Calendar</h3>
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold text-sm rounded-xl px-5 py-2 shadow-lg shadow-blue-500/20">
                            {MONTH_NAMES[currentMonth]} {currentYear}
                        </div>
                    </div>

                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {WEEKDAYS.map(wd => (
                            <div key={wd} className="text-center text-xs font-bold text-zinc-400 uppercase tracking-wider py-2">
                                {wd}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarCells.map(cell => {
                            if (cell.day === null) {
                                return <div key={cell.key} className="aspect-square"></div>;
                            }
                            const count = cell.families?.length || 0;
                            const isToday = cell.day === today;
                            const isPast = cell.day < today;
                            const hasFamilies = count > 0;

                            return (
                                <div
                                    key={cell.key}
                                    onClick={() => hasFamilies ? setSelectedDay(cell.day) : null}
                                    className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all duration-200 border
                                        ${isToday
                                            ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-300 shadow-md shadow-blue-200/50'
                                            : hasFamilies
                                                ? 'bg-emerald-50/60 border-emerald-200/60 hover:bg-emerald-100 hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
                                                : isPast
                                                    ? 'bg-zinc-50/40 border-zinc-100/60'
                                                    : 'bg-white/40 border-zinc-100/40'
                                        }
                                    `}
                                >
                                    <span className={`text-sm font-bold ${isToday ? 'text-blue-700' : isPast ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                        {cell.day}
                                    </span>
                                    {hasFamilies && (
                                        <div className="flex items-center gap-0.5 mt-0.5">
                                            <div className={`w-2 h-2 rounded-full ${isToday ? 'bg-blue-500' : 'bg-emerald-500'} animate-pulse`}></div>
                                            <span className={`text-[10px] font-bold ${isToday ? 'text-blue-600' : 'text-emerald-600'}`}>{count}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Day Detail Popup */}
                    {selectedDay && (
                        <div className="mt-4 p-4 bg-white/80 backdrop-blur-md rounded-2xl border border-zinc-200/60 shadow-lg animate-in fade-in slide-in-from-bottom-3 duration-300">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-bold text-zinc-800 flex items-center">
                                    <Calendar size={16} className="mr-2 text-blue-500" />
                                    {MONTH_NAMES[currentMonth]} {selectedDay}, {currentYear}
                                    <span className="ml-2 bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">{selectedDayFamilies.length} collected</span>
                                </h4>
                                <button onClick={() => setSelectedDay(null)} className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors">
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                {selectedDayFamilies.map((f, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-zinc-50/80 px-3 py-2 rounded-xl border border-zinc-100 hover:bg-white transition-colors">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                                {f.family?.charAt(0)?.toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-zinc-800">{f.family}</p>
                                                <p className="text-[11px] text-zinc-400 font-medium">{f.members} members</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold text-zinc-500 bg-white px-2 py-1 rounded-md border border-zinc-100 shadow-sm">{f.time}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Stock Summary Box */}
                <div className="flex flex-col gap-6">
                    <div className="bg-white/60 backdrop-blur-xl p-5 rounded-3xl shadow-xl shadow-zinc-200/40 border border-white/40">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                <Package size={18} />
                            </div>
                            <h3 className="text-base font-bold text-zinc-800">Rice Stock (Month)</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total</span>
                                <span className="text-sm font-extrabold text-zinc-800">{stockSummary?.total_stock_kg || 0} kg</span>
                            </div>
                            <div className="w-full bg-zinc-100 rounded-full h-2">
                                <div className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-2 rounded-full transition-all duration-700" style={{ width: `${stockSummary?.total_stock_kg > 0 ? (stockSummary.distributed_kg / stockSummary.total_stock_kg) * 100 : 0}%` }}></div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-emerald-600">Distributed</span>
                                <span className="text-sm font-bold text-emerald-700">{stockSummary?.distributed_kg || 0} kg</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-amber-600">Balance</span>
                                <span className="text-sm font-bold text-amber-700">{stockSummary?.balance_kg || 0} kg</span>
                            </div>
                        </div>
                    </div>

                {/* Recent Activity */}
                <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-xl shadow-zinc-200/40 border border-white/40 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-zinc-800">Recent Activity</h3>
                        <button className="text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-blue-100 flex items-center transition-colors">
                            View All <ArrowUpRight size={16} className="ml-1" />
                        </button>
                    </div>

                    <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {recentActivity.length === 0 ? (
                            <p className="text-zinc-500 text-center mt-10 font-medium">No recent activity found.</p>
                        ) : (
                            recentActivity.map((act, i) => (
                                <div key={i} className="flex items-start group">
                                    <div className="mt-1 relative">
                                        <div className={`w-3.5 h-3.5 rounded-full ring-4 shadow-sm z-10 relative transition-transform group-hover:scale-125 ${
                                            act.status === 'success' ? 'bg-emerald-500 ring-emerald-100' :
                                            act.status === 'error' ? 'bg-rose-500 ring-rose-100' : 'bg-blue-500 ring-blue-100'
                                        }`}></div>
                                        {i !== recentActivity.length - 1 && (
                                            <div className="absolute top-4 left-1/2 -ml-[1px] w-[2px] h-12 bg-zinc-200/70"></div>
                                        )}
                                    </div>
                                    <div className="ml-5 flex-1 bg-white/50 p-3 rounded-2xl border border-white/60 shadow-sm group-hover:bg-white transition-colors">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-bold text-zinc-800">{act.action}</p>
                                            <span className="text-xs text-zinc-400 font-bold bg-zinc-100/80 px-2 py-0.5 rounded-md">{act.time}</span>
                                        </div>
                                        <p className="text-sm text-zinc-500 mt-1 font-medium">
                                            {act.family} {act.members > 0 && <span className="text-zinc-400">({act.members} members)</span>}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                </div>

            </div>
        </div>

        {/* Drill-down Modal */}
        {activeListType && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm animate-in fade-in" onClick={() => setActiveListType(null)}>
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                    <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                        <h3 className="text-xl font-bold text-zinc-900 capitalize flex items-center">
                            {activeListType === 'failed' ? <AlertCircle className="mr-2 text-rose-500" /> : <Users className="mr-2 text-blue-500" />}
                            {activeListType.replace('_', ' ')} Details
                        </h3>
                        <button onClick={() => setActiveListType(null)} className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                        {isLoadingList ? (
                            <div className="flex justify-center items-center py-20">
                                <Loader2 className="animate-spin text-blue-500" size={32} />
                            </div>
                        ) : listData.length === 0 ? (
                            <div className="text-center py-20 text-zinc-500 font-medium">
                                No records found for this category.
                            </div>
                        ) : activeListType === 'failed' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {listData.map(log => (
                                    <div key={log.id} className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 flex gap-4">
                                        {log.image_url ? (
                                            <img src={log.image_url} alt="Failed Scan" className="w-20 h-20 object-cover rounded-xl bg-zinc-100" />
                                        ) : (
                                            <div className="w-20 h-20 bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-400">
                                                <ScanFace size={24} />
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-bold text-rose-800 text-sm mb-1">{log.reason}</p>
                                            <p className="text-xs font-medium text-rose-600/70">{log.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {listData.map(fam => (
                                    <div key={fam.id} className="bg-white border border-zinc-200 rounded-2xl p-4 flex flex-col hover:border-blue-300 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-zinc-800">{fam.head}</h4>
                                            <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded-md">{fam.members} Members</span>
                                        </div>
                                        <div className="text-sm font-medium text-zinc-500 flex items-center justify-between">
                                            <p className="flex items-center">
                                                <span className="text-xs uppercase tracking-wider mr-2 text-zinc-400">RC</span> {fam.rc}
                                            </p>
                                            {fam.phone && (
                                                <p className="flex items-center bg-zinc-50 px-2 py-0.5 rounded-md border border-zinc-100">
                                                    <span className="text-xs uppercase tracking-wider mr-1.5 text-zinc-400">Ph</span> {fam.phone}
                                                </p>
                                            )}
                                        </div>
                                        {fam.phone && (
                                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-100">
                                                <a
                                                    href={`tel:${fam.phone}`}
                                                    onClick={e => e.stopPropagation()}
                                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-bold hover:bg-emerald-100 hover:border-emerald-300 transition-all active:scale-95"
                                                >
                                                    <Phone size={15} /> Call
                                                </a>
                                                <a
                                                    href={`https://wa.me/91${fam.phone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(`Hello ${fam.head}, this is a reminder that you have not collected this month's ration yet. Please visit the ration center at your earliest convenience. Hurry up!`)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={e => e.stopPropagation()}
                                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm font-bold hover:bg-green-100 hover:border-green-300 transition-all active:scale-95"
                                                >
                                                    <MessageSquare size={15} /> WhatsApp
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
