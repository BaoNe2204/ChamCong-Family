import React, { useState, useEffect } from 'react';
import { 
  Clock, MapPin, Calendar, FileText, Bell, Sparkles, 
  Sun, CloudRain, Droplets, Thermometer,
  Wallet, TrendingUp, AlertTriangle, PlayCircle, StopCircle, 
  CheckCircle2, XCircle, LogOut, Navigation, Fingerprint, Map
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { checkIn, checkOut } from '../services/attendanceService';
import { api } from '../services/api';

export default function EmployeeView() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  
  // States
  const [mounted, setMounted] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [weather, setWeather] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Đang quét GPS...');
  const [isReady, setIsReady] = useState(false);
  const [gpsIcon, setGpsIcon] = useState('🟡'); // 🟢, 🟡, 🔴
  const [loadingAction, setLoadingAction] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [nowTick, setNowTick] = useState(new Date());
  
  const [currentTime, setCurrentTime] = useState(new Date());

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setNowTick(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchDashboardData();
      fetchNotifications();
      fetchWeather();
    }
  }, [currentUser]);

  const fetchDashboardData = async () => {
    try {
      const data = await api.get('/attendance/dashboard-full');
      setDashboardData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await api.get('/notifications');
      setNotifications(data || []);
    } catch (error) {
      console.error("Lỗi lấy thông báo:", error);
    }
  };

  const fetchWeather = async () => {
    try {
      // HCM City coordinates
      const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=10.8231&longitude=106.6297&current=temperature_2m,relative_humidity_2m,weather_code&timezone=Asia/Bangkok');
      const data = await res.json();
      setWeather(data.current);
    } catch (e) {
      console.error("Failed to fetch weather");
    }
  };

  const getDistanceFromLatLonInM = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c;
  };

  // GPS Tracking
  useEffect(() => {
    if (!dashboardData?.settings) return;
    const settings = dashboardData.settings;

    if (!navigator.geolocation) {
      setLocationStatus('Thiết bị không hỗ trợ GPS');
      setGpsIcon('🔴');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        const distance = getDistanceFromLatLonInM(latitude, longitude, settings.factoryLat, settings.factoryLng);
        
        if (distance <= settings.maxDistance) {
          setLocationStatus('Trong vùng hợp lệ');
          setGpsIcon('🟢');
          setIsReady(true);
        } else {
          setLocationStatus(`Ngoài vùng (${Math.round(distance)}m)`);
          setGpsIcon('🔴');
          setIsReady(false); // strictly enforce
        }
      },
      (error) => {
        setLocationStatus('Chưa cấp quyền GPS');
        setGpsIcon('🔴');
        setIsReady(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [dashboardData?.settings]);

  const handleCheckIn = async () => {
    if (!currentUser || !currentLocation) return;
    setLoadingAction(true);
    try {
      const result = await checkIn(currentUser.uid, currentUser.email, currentLocation.lat, currentLocation.lng);
      if (result && (result.success || result.message === "Check-in thành công" || result.message === "Check in thành công")) {
        alert("Check-in thành công!");
        fetchDashboardData();
      } else {
        alert(result?.error || "Có lỗi xảy ra");
      }
    } catch (error) {
      alert(error.message || "Lỗi mạng hoặc máy chủ!");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCheckOut = async () => {
    if (!currentUser) return;
    
    // Ensure worked at least 3 hours
    if (dashboardData?.todayRecord) {
       const checkInTime = new Date(dashboardData.todayRecord.checkInTimeMillis);
       const now = new Date();
       if ((now - checkInTime) < 3 * 3600000) {
          alert("Bạn phải làm việc và hoạt động ít nhất 3 giờ mới được Check-out!");
          return;
       }
    }

    setLoadingAction(true);
    try {
      const result = await checkOut(currentUser.uid);
      if (result && (result.success || result.message === "Check-out thành công" || result.message === "Check out thành công")) {
        alert("Check-out thành công!");
        fetchDashboardData();
      } else {
        alert(result?.error || "Có lỗi xảy ra");
      }
    } catch (error) {
      alert(error.message || "Lỗi mạng hoặc máy chủ!");
    } finally {
      setLoadingAction(false);
    }
  };

  // Helper functions for UI
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const getShiftProgress = () => {
    if (!dashboardData?.settings) return { percentage: 0, worked: '0h 0m', left: '0h 0m', shiftStart: '08:00', shiftEnd: '17:00' };
    
    const userShiftId = currentUser?.shift_id || 'shift_1';
    
    // Tìm ca làm việc từ mảng shifts, nếu không có lấy ca đầu tiên, nếu không có nữa thì dùng mặc định
    let currentShift = dashboardData.settings.shifts?.find(s => s.id === userShiftId);
    if (!currentShift && dashboardData.settings.shifts?.length > 0) currentShift = dashboardData.settings.shifts[0];
    
    const shiftStart = currentShift?.startTime || '08:00';
    const shiftEnd = currentShift?.endTime || '17:00';
    const shiftName = currentShift?.name || 'Ca làm việc';
    
    const record = dashboardData.todayRecord;
    
    let start = new Date(`${new Date().toISOString().split('T')[0]}T${shiftStart}:00`);
    let end = new Date(`${new Date().toISOString().split('T')[0]}T${shiftEnd}:00`);
    
    // Nếu ca làm việc qua đêm (VD: 18:00 đến 06:00 sáng hôm sau)
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }

    // Nếu ca làm việc qua đêm và hiện tại là buổi sáng (đang làm ca đêm từ tối hôm trước)
    if (nowTick < start && nowTick.getHours() < 12 && start.getHours() > 12) {
      start.setDate(start.getDate() - 1);
      end = new Date(`${new Date().toISOString().split('T')[0]}T${shiftEnd}:00`);
    }
    
    // If not checked in
    if (!record) {
      const totalShiftMs = end - start;
      const totalH = Math.floor(totalShiftMs / 3600000);
      const totalM = Math.floor((totalShiftMs % 3600000) / 60000);
      return { percentage: 0, worked: '0h 0m', left: `${totalH}h ${totalM}m`, shiftStart, shiftEnd };
    }

    const checkInTime = new Date(record.checkInTimeMillis);
    
    const now = record.checkOutTimeMillis ? new Date(record.checkOutTimeMillis) : nowTick;
    
    // Calculate worked
    let workedMs = now - checkInTime;
    if (workedMs < 0) workedMs = 0;
    
    // Total shift duration
    const totalShiftMs = end - start;
    
    let percentage = (workedMs / totalShiftMs) * 100;
    if (percentage > 100) percentage = 100;
    if (percentage < 0) percentage = 0;
    
    const workedH = Math.floor(workedMs / 3600000);
    const workedM = Math.floor((workedMs % 3600000) / 60000);
    
    const leftMs = totalShiftMs - workedMs;
    const leftH = leftMs > 0 ? Math.floor(leftMs / 3600000) : 0;
    const leftM = leftMs > 0 ? Math.floor((leftMs % 3600000) / 60000) : 0;

    return {
      percentage,
      worked: `${workedH}h ${workedM}m`,
      left: `${leftH}h ${leftM}m`,
      shiftStart,
      shiftEnd,
      shiftName
    };
  };

  const progress = getShiftProgress();
  
  // Logic: 
  // - Nếu ko có hôm nay, hoặc tất cả các phiên hôm nay đều đã checkout -> CHƯA VÀO CA (hoặc ĐÃ RA VỀ nhưng có thể vào ca tiếp)
  // - Nếu phiên MỚI NHẤT chưa checkout -> ĐANG TRONG CA
  let shiftStatus = 'CHƯA VÀO CA';
  if (dashboardData?.todayRecord) {
     if (dashboardData.todayRecord.checkOutTimeMillis) {
        shiftStatus = 'ĐÃ RA VỀ'; // Đã checkout phiên gần nhất
     } else {
        shiftStatus = 'ĐANG TRONG CA'; // Phiên gần nhất đang mở
     }
  }

  if (!dashboardData) {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-800 dark:text-white font-bold">Đang tải Dashboard...</div>;
  }

  return (
    <div className="w-full flex-1 flex flex-col font-sans text-slate-800 dark:text-white">
      {/* Main Bento Grid */}
      <main className={`relative z-10 flex-1 w-full h-full p-4 md:p-6 transition-all duration-1000 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-indigo-600 shadow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">Tổng quan cá nhân</h1>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">Theo dõi tiến độ ca làm và chỉ số của bạn</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[minmax(160px,auto)]">
          
          {/* Widget 1: Time & Weather (Col span 2) */}
          <div className="lg:col-span-2 row-span-1 bg-gradient-to-br from-indigo-500 to-violet-600 shadow-xl shadow-indigo-500/20 rounded-3xl p-5 relative overflow-hidden group flex justify-between items-center text-white">
             {/* Decorative Background for Widget 1 */}
             <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
             <div className="absolute bottom-[-20%] left-[-10%] w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />
             
             <div className="relative z-10">
               <h2 className="text-5xl md:text-6xl font-black tracking-tighter drop-shadow-md">
                 {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
               </h2>
               <p className="text-indigo-100 font-bold uppercase tracking-wider text-sm mt-1 flex items-center gap-2">
                 <Calendar className="w-4 h-4" /> {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
               </p>
             </div>

             {weather && (
               <div className="text-right flex flex-col items-end relative z-10">
                 <div className="flex items-center gap-2 mb-2">
                   {weather.temperature_2m > 28 ? <Sun className="w-8 h-8 text-yellow-300 drop-shadow-[0_0_10px_rgba(253,224,71,0.5)]" /> : <CloudRain className="w-8 h-8 text-blue-200 drop-shadow-[0_0_10px_rgba(191,219,254,0.5)]" />}
                   <span className="text-4xl font-black drop-shadow-md">{Math.round(weather.temperature_2m)}°C</span>
                 </div>
                 <div className="flex items-center gap-4 text-xs font-bold text-indigo-100 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md">
                   <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> TP.HCM</span>
                   <span className="flex items-center gap-1"><Droplets className="w-3 h-3 text-blue-200" /> {weather.relative_humidity_2m}%</span>
                 </div>
               </div>
             )}
          </div>

          {/* Widget 2: Action Check in/out (Col span 2) */}
          <div className="lg:col-span-2 row-span-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between">
            {/* Decorative Icon */}
            <Navigation className="absolute -bottom-4 -right-4 w-24 h-24 text-slate-50 opacity-50 pointer-events-none transform -rotate-12" />
            
            <div className="flex justify-between items-start mb-3 relative z-10">
               <div className="flex items-center gap-3">
                 <div className="p-2.5 bg-blue-50 text-blue-500 rounded-xl">
                   <Fingerprint className="w-5 h-5" />
                 </div>
                 <div>
                   <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Thao tác & Vị trí</h3>
                   <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs">{gpsIcon}</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-white">{locationStatus}</span>
                 </div>
               </div>
               </div>
               <span className={`px-4 py-1.5 rounded-xl text-xs font-black tracking-widest shadow-sm ${
                  shiftStatus === 'CHƯA VÀO CA' ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10' :
                  shiftStatus === 'ĐANG TRONG CA' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                  'bg-amber-50 text-amber-600 border border-amber-200'
                }`}>
                  {shiftStatus}
                </span>
            </div>

            <div className="mt-2 relative z-10">
              {shiftStatus === 'CHƯA VÀO CA' && (
                <button 
                  onClick={handleCheckIn} 
                  disabled={!isReady || loadingAction} 
                  className={`w-full relative group disabled:opacity-70 disabled:cursor-not-allowed rounded-[32px] py-8 flex flex-col items-center justify-center transition-all duration-300 overflow-hidden shadow-2xl ${
                    isReady ? 'shadow-indigo-500/40 hover:shadow-indigo-500/60 hover:-translate-y-2' : 'shadow-none'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 group-disabled:from-slate-300 group-disabled:to-slate-400 dark:group-disabled:from-slate-700 dark:group-disabled:to-slate-600 transition-colors"></div>
                  <div className="absolute inset-0 bg-gradient-to-tl from-indigo-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 group-disabled:hidden"></div>
                  {isReady && (
                    <div className="absolute inset-0 opacity-40 bg-gradient-to-r from-indigo-300 to-purple-300 blur-2xl animate-pulse"></div>
                  )}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 mb-4 rounded-[20px] bg-white/20 flex items-center justify-center backdrop-blur-md group-disabled:bg-slate-500/20 group-hover:scale-110 transition-transform duration-500 shadow-md border border-white/30">
                      <PlayCircle className="w-8 h-8 text-white group-disabled:text-slate-600 dark:group-disabled:text-slate-300" />
                    </div>
                    <span className="text-3xl font-black tracking-widest text-white group-disabled:text-slate-600 dark:group-disabled:text-slate-300 drop-shadow-md">VÀO CA</span>
                    <span className="text-sm font-bold text-white/90 uppercase tracking-widest mt-2 group-disabled:text-slate-600 dark:group-disabled:text-slate-300">
                      {!isReady ? 'Chưa tới công ty' : 'Bấm để bắt đầu làm'}
                    </span>
                  </div>
                </button>
              )}

              {shiftStatus === 'ĐANG TRONG CA' && (
                <button 
                  onClick={handleCheckOut} 
                  disabled={loadingAction} 
                  className="w-full relative group disabled:opacity-70 disabled:cursor-not-allowed rounded-[32px] py-8 flex flex-col items-center justify-center transition-all duration-300 overflow-hidden shadow-2xl shadow-rose-500/40 hover:shadow-rose-500/60 hover:-translate-y-2"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-500 to-orange-500 transition-colors"></div>
                  <div className="absolute inset-0 bg-gradient-to-tl from-rose-400 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 opacity-40 bg-gradient-to-r from-rose-300 to-orange-300 blur-2xl animate-pulse"></div>
                  
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 mb-4 rounded-[20px] bg-white/20 flex items-center justify-center backdrop-blur-md group-hover:scale-110 transition-transform duration-500 shadow-md border border-white/30">
                      <StopCircle className="w-8 h-8 text-white" />
                    </div>
                    <span className="text-3xl font-black tracking-widest text-white drop-shadow-md">RA VỀ</span>
                    <span className="text-sm font-bold text-white/90 uppercase tracking-widest mt-2">Bấm để chốt công</span>
                  </div>
                </button>
              )}

              {shiftStatus === 'ĐÃ RA VỀ' && (
                <div className="w-full space-y-3">
                  <div className="w-full relative rounded-[32px] py-6 flex flex-col items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-500 shadow-xl shadow-emerald-500/20 overflow-hidden">
                    <div className="absolute inset-0 opacity-30 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
                    <div className="relative z-10 flex flex-col items-center text-center px-4">
                      <div className="w-12 h-12 mb-3 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md shadow-md border border-white/30">
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-xl md:text-2xl font-black tracking-tight text-white drop-shadow-md mb-1">HOÀN THÀNH CA LÀM!</span>
                      <span className="text-sm font-bold text-white/90">Bạn đã ra về và chốt công cho ngày hôm nay. Hẹn gặp lại vào ngày mai!</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Widget 3: Shift Progress (Col 1) */}
          <div className="lg:col-span-2 row-span-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-3xl p-5 relative flex flex-col justify-between overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
            
            <div className="flex justify-between items-center mb-3 relative z-10">
               <div className="flex items-center gap-3">
                 <div className="p-2.5 bg-primary-50 text-primary-500 rounded-xl">
                   <Clock className="w-5 h-5" />
                 </div>
                 <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Tiến độ ca làm</h3>
               </div>
               <span className="px-3 py-1 bg-primary-50 text-primary-600 rounded-lg text-xs font-bold border border-primary-100">{progress.shiftName} ({progress.shiftStart} - {progress.shiftEnd})</span>
            </div>
            
            <div className="space-y-4 relative z-10">
               <div className="flex justify-between items-end">
                 <div>
                   <span className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">{Math.round(progress.percentage)}</span>
                   <span className="text-2xl font-black text-slate-400">%</span>
                 </div>
                 <span className="text-xs font-bold text-primary-500 uppercase tracking-wider mb-2 bg-primary-50 px-2 py-1 rounded">Hoàn thành</span>
               </div>
               
               {/* Custom Progress Bar */}
               <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-white/10 shadow-inner">
                 <div className="h-full bg-gradient-to-r from-blue-500 via-primary-500 to-indigo-500 rounded-full transition-all duration-1000 relative shadow-sm" style={{width: `${progress.percentage}%`}}>
                   <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
                 </div>
               </div>

               <div className="flex justify-between text-sm font-bold">
                 <span className="text-emerald-600 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4"/> Đã làm: {progress.worked}</span>
                 <span className="text-amber-600 flex items-center gap-1.5"><Clock className="w-4 h-4"/> Còn lại: {progress.left}</span>
               </div>
            </div>
          </div>

          {/* Widget 4: Estimated Salary (Col 1) */}
          <div className="lg:col-span-1 row-span-1 bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl shadow-emerald-500/20 rounded-3xl p-5 relative group overflow-hidden text-white">
             <div className="absolute top-0 right-0 p-4 opacity-20 transform group-hover:scale-110 transition-transform duration-500">
               <Wallet className="w-24 h-24 text-white" />
             </div>
             
             <div className="flex items-center gap-3 mb-4 relative z-10">
               <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                 <TrendingUp className="w-5 h-5" />
               </div>
               <h3 className="text-sm font-black text-emerald-50 uppercase tracking-widest">Lương tạm tính</h3>
             </div>
             
             <div className="space-y-4 relative z-10">
               <div className="flex justify-between items-center text-sm font-bold border-b border-white/20 pb-3">
                 <span className="text-emerald-100">Lương tháng</span>
                 <span className="text-white text-lg">{formatMoney(dashboardData.stats.calculatedSalary)}</span>
               </div>
               <div className="flex justify-between items-center text-sm font-bold border-b border-white/20 pb-3">
                 <span className="text-emerald-100">OT</span>
                 <span className="text-emerald-300">+{formatMoney(dashboardData.stats.calculatedOT)}</span>
               </div>
               <div className="flex justify-between items-end pt-2">
                 <span className="text-emerald-200 font-bold mb-1">Tổng</span>
                 <span className="text-3xl font-black tracking-tight drop-shadow-md">{formatMoney(dashboardData.stats.totalSalary)}</span>
               </div>
             </div>
          </div>

          {/* Widget 5: Monthly Stats (Col 1) */}
          <div className="lg:col-span-1 row-span-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-3xl p-5 relative overflow-hidden flex flex-col">
             {/* Decorative Number */}
             <div className="absolute -bottom-6 -right-4 text-8xl font-black text-slate-50 opacity-50 pointer-events-none select-none">#</div>
             
             <div className="flex items-center gap-3 mb-4 relative z-10">
               <div className="p-2 bg-orange-50 text-orange-500 rounded-xl">
                 <FileText className="w-5 h-5" />
               </div>
               <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Thống kê tháng</h3>
             </div>
             <div className="grid grid-cols-2 gap-4 flex-1 relative z-10">
               <div className="bg-emerald-50 rounded-2xl p-3 flex flex-col justify-center border border-emerald-100 hover:-translate-y-1 transition-transform">
                 <span className="text-2xl font-black text-emerald-600">{dashboardData.stats.onTime}</span>
                 <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Đúng giờ</span>
               </div>
               <div className="bg-amber-50 rounded-2xl p-3 flex flex-col justify-center border border-amber-100 hover:-translate-y-1 transition-transform">
                 <span className="text-2xl font-black text-amber-600">{dashboardData.stats.late}</span>
                 <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Đi trễ</span>
               </div>
               <div className="bg-rose-50 rounded-2xl p-3 flex flex-col justify-center border border-rose-100 hover:-translate-y-1 transition-transform">
                 <span className="text-2xl font-black text-rose-600">{dashboardData.stats.daysOff}</span>
                 <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Nghỉ</span>
               </div>
               <div className="bg-primary-50 rounded-2xl p-3 flex flex-col justify-center border border-primary-100 hover:-translate-y-1 transition-transform">
                 <span className="text-2xl font-black text-primary-600">{dashboardData.stats.otHours}h</span>
                 <span className="text-[10px] font-bold text-primary-500 uppercase tracking-wider">Làm thêm (OT)</span>
               </div>
             </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[22rem] mt-6">

          {/* Widget 6: Last Check In (Col 1) */}
          <div className="lg:col-span-1 row-span-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-3xl p-5 relative overflow-hidden group flex flex-col">
             <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-700">
               <Fingerprint className="w-40 h-40 text-slate-800 dark:text-white" />
             </div>
             <div className="flex items-center gap-3 mb-auto relative z-10">
               <div className="p-2 bg-rose-50 text-rose-500 rounded-xl">
                 <Clock className="w-5 h-5" />
               </div>
               <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Lần Check-in cuối</h3>
             </div>
             
             {dashboardData.todayRecord ? (
               <div className="relative z-10 mt-6">
                 <p className="text-5xl font-black text-slate-800 dark:text-white tracking-tighter drop-shadow-sm">
                   {new Date(dashboardData.todayRecord.checkInTimeMillis).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}
                 </p>
                 <p className="text-sm font-bold text-primary-600 mt-2 flex items-center gap-1.5">
                   <Calendar className="w-4 h-4"/> {new Date(dashboardData.todayRecord.checkInTimeMillis).toLocaleDateString('vi-VN')}
                 </p>
                 <div className="mt-5 flex items-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-50 w-fit px-4 py-2 rounded-xl border border-emerald-200 shadow-sm">
                   <CheckCircle2 className="w-5 h-5" /> Thành công
                 </div>
               </div>
             ) : (
               <div className="flex flex-col items-center justify-center h-full text-slate-400 mt-6">
                 <AlertTriangle className="w-10 h-10 mb-3 opacity-20" />
                 <p className="font-bold">Chưa có dữ liệu hôm nay.</p>
               </div>
             )}
          </div>

          {/* Widget 7: History List (Col 2) */}
          <div className="lg:col-span-2 row-span-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-3xl p-5 flex flex-col">
             <div className="flex justify-between items-center mb-4">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-violet-50 text-violet-500 rounded-xl">
                   <FileText className="w-5 h-5" />
                 </div>
                 <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Lịch sử 5 ngày qua</h3>
               </div>
               <button onClick={() => navigate('/history')} className="text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 px-3 py-1.5 rounded-lg hover:bg-primary-100 transition-colors">Xem tất cả</button>
             </div>
             
             <div className="flex-1 flex flex-col justify-between">
               {dashboardData.history.length === 0 ? (
                 <p className="text-slate-500 dark:text-slate-400 font-bold text-sm text-center my-auto">Chưa có dữ liệu lịch sử.</p>
               ) : (
                 dashboardData.history.map((record, idx) => (
                   <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:bg-slate-900 px-3 -mx-3 rounded-xl transition-colors cursor-default group">
                     <div className="flex items-center gap-3">
                       <span className="text-sm font-bold text-slate-700 dark:text-slate-200 w-16">{new Date(record.date).toLocaleDateString('vi-VN', {day:'2-digit', month:'2-digit'})}</span>
                       <span className="w-2 h-2 rounded-full bg-emerald-500 group-hover:shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-shadow"></span>
                       <span className="text-sm font-semibold text-emerald-600">Đã đi làm</span>
                     </div>
                     <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/10 shadow-sm">
                       {record.totalHours ? `${record.totalHours}h` : 'Đang làm'}
                     </span>
                   </div>
                 ))
               )}
             </div>
          </div>

          {/* Widget 8: CSS Mini Map (Col 1) */}
          <div className="lg:col-span-1 row-span-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-3xl p-5 relative overflow-hidden flex flex-col">
             <div className="flex items-center gap-3 mb-3 z-10 relative">
               <div className="p-2 bg-teal-50 text-teal-500 rounded-xl">
                 <Map className="w-5 h-5" />
               </div>
               <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Bản đồ vệ tinh</h3>
             </div>
             
             {/* Map Mockup container */}
             <div className="flex-1 bg-slate-50/80 rounded-2xl border border-slate-200 dark:border-white/10 relative overflow-hidden flex items-center justify-center group cursor-crosshair shadow-inner">
                
                {/* Radar grid */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />
                
                {/* Radar sweep */}
                <div className="absolute w-full h-full border-2 border-primary-500/20 rounded-full animate-ping opacity-20" style={{animationDuration: '3s'}} />
                
                {/* Connection line SVG */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="mapGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                  <line x1="30%" y1="60%" x2="70%" y2="40%" stroke="url(#mapGradient)" strokeWidth="2" strokeDasharray="4 4" className="opacity-70" />
                </svg>

                {/* Factory Marker */}
                <div className="absolute top-[40%] left-[70%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center border border-primary-200 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                    <span className="text-xs">🏭</span>
                  </div>
                </div>

                {/* User Marker */}
                <div className="absolute top-[60%] left-[30%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center border border-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    <span className="text-xs">🧑</span>
                  </div>
                  <div className="bg-slate-800 px-2 py-0.5 rounded text-[9px] font-bold text-white border border-slate-700 whitespace-nowrap shadow-sm absolute top-full mt-1.5">Bạn ở đây</div>
                </div>

             </div>
          </div>

        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
}
