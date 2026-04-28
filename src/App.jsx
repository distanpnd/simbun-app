import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Sprout, TrendingUp, Map, LogOut, 
  Save, AlertCircle, FileSpreadsheet, CheckCircle2, ChevronDown,
  Plus, Edit, ArrowLeft, Trash2, LayoutDashboard, Leaf, Menu, Eye, EyeOff, Lock, Unlock, BarChart3, Activity, Tractor, BookOpen, HelpCircle,
  Printer, Download, Settings, Shield, Key, UserPlus, Database
} from 'lucide-react';

// --- IMPORT FIREBASE SDK ---
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";

// --- KONFIGURASI FIREBASE ANDA ---
const firebaseConfig = {
  apiKey: "AIzaSyDUy0z4lsaBSzUpGID4j5bys1ez50fArr0",
  authDomain: "simbun-pangandaran.firebaseapp.com",
  projectId: "simbun-pangandaran",
  storageBucket: "simbun-pangandaran.firebasestorage.app",
  messagingSenderId: "463383645361",
  appId: "1:463383645361:web:cccd08929ca46e45d9e690",
  measurementId: "G-8003HBL0YR"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const firestoreDb = getFirestore(app);

// --- DATA INITIAL (MASTER DATA DEFAULT) ---
const INITIAL_KECAMATAN = ['Cijulang', 'Cimerak', 'Parigi', 'Cigugur', 'Langkaplancar', 'Mangunjaya', 'Kalipucang', 'Sidamulih', 'Padaherang', 'Pangandaran'];
const INITIAL_KOMODITAS = ['Aren', 'Cengkeh', 'Kelapa Dalam', 'Kelapa Deres', 'Kelapa Sawit', 'Kakao', 'Kopi Robusta', 'Kopi Arabika', 'Pandan', 'Lada', 'Pala', 'Panili', 'Karet'];
const INITIAL_KOMODITAS_SEMUSIM = ['Tembakau'];

const INITIAL_WUJUD_PRODUKSI_MAP = {
  'Aren': 'Gula merah', 'Cengkeh': 'Bunga kering', 'Kelapa Dalam': 'Kelapa bulat',
  'Kelapa Deres': 'Gula merah', 'Kelapa Sawit': 'CPO, KPO', 'Kakao': 'Biji kering',
  'Kopi Robusta': 'Biji kopi', 'Kopi Arabika': 'Biji kopi', 'Pandan': 'Daun',
  'Lada': 'Lada Kering', 'Pala': 'Biji kering', 'Panili': 'Polong kering', 'Karet': 'Karet Kering'
};
const INITIAL_WUJUD_PRODUKSI_SEMUSIM_MAP = { 'Tembakau': 'Daun kering' };

const initMockUsers = () => {
  const users = { 'admin': { username: 'admin', password: 'admin123', name: 'Admin Utama', role: 'kabupaten', wilayah: 'Pangandaran' } };
  INITIAL_KECAMATAN.forEach(kec => { users[kec.toLowerCase()] = { username: kec.toLowerCase(), password: 'pass123', name: `Admin Kec. ${kec}`, role: 'kecamatan', wilayah: kec }; });
  return users;
};

// Membuat opsi tahun menjadi otomatis dan dinamis
const currentYear = new Date().getFullYear();
const startYear = 2021;
const maxYear = Math.max(currentYear + 2, 2026); 
const TAHUN_OPTIONS = Array.from({ length: maxYear - startYear + 1 }, (_, i) => (startYear + i).toString());

const SEMESTER_OPTIONS = ['I', 'II'];
const TRIWULAN_OPTIONS = ['I', 'II', 'III', 'IV'];

const LOGO_1_URL = "https://lh3.googleusercontent.com/d/1fKmizUvWTEZBX3KXHhITTeuLn3Q32QKw";
const LOGO_2_URL = "https://lh3.googleusercontent.com/d/1-NfvFlxhTZP0xtGvdlUz0pSN-I52L0M1";

// --- KOMPONEN LOGO FALLBACK ---
function KementanLogo({ className }) {
  const [error1, setError1] = useState(false);
  const [error2, setError2] = useState(false);
  const defaultIcon = <Sprout className={className ? className.replace('h-24', 'h-16').replace('w-auto', 'w-16').concat(' text-emerald-600') : "w-8 h-8 text-emerald-600"} />;
  return (
    <div className="flex items-center gap-2">
      {error1 ? defaultIcon : <img src={LOGO_1_URL} alt="Logo 1" className={className} onError={() => setError1(true)} />}
      {error2 ? defaultIcon : <img src={LOGO_2_URL} alt="Logo 2" className={className} onError={() => setError2(true)} />}
    </div>
  );
}

// --- FUNGSI HELPER & TEMPLATE ---
const emptyRow = (komoditas = '', wujudMap = {}) => ({ col3: '', col4: '', col5: '', col6: '', col8: '', col9: '', col10: '', col12: '', col14: '', col15: wujudMap[komoditas] || '', col16: '' });
const emptyRowSemusim = (komoditas = '', wujudSemusimMap = {}) => ({ col3: '', col4: '', col5: '', col7: '', col8: '', col9: '', col11: '', col12: wujudSemusimMap[komoditas] || '', col13: '' });
const emptyAtapTahunan = () => ({ tbm: '', tm: '', ttm: '', produksi: '', petani: '' });
const emptyAtapSemusim = () => ({ luas: '', panen: '', produksi: '', petani: '' });

// --- FUNGSI EXPORT EXCEL & PDF ---
const getCleanTableHtml = (tableId) => {
  const table = document.getElementById(tableId);
  if (!table) return '';
  const clone = table.cloneNode(true);
  const inputs = clone.querySelectorAll('input');
  inputs.forEach(input => { const textNode = document.createTextNode(input.value || '-'); input.parentNode.replaceChild(textNode, input); });
  return clone.outerHTML;
};

const exportToExcel = (tableId, filename) => {
  const tableHtml = getCleanTableHtml(tableId);
  if (!tableHtml) return;
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8" /><style>table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12px; } th, td { border: 1px solid black; padding: 4px; } th { background-color: #f2f2f2; text-align: center; font-weight: bold; }</style></head><body>${tableHtml}</body></html>`;
  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `${filename}.xls`; a.click(); URL.revokeObjectURL(url);
};

const printPDF = (tableId, title) => {
  const tableHtml = getCleanTableHtml(tableId);
  if (!tableHtml) return;
  const printWindow = window.open('', '', 'height=800,width=1200');
  printWindow.document.write(`<html><head><title>${title}</title><style>body { font-family: Arial, sans-serif; padding: 20px; } h1 { text-align: center; font-size: 18px; margin-bottom: 20px; text-transform: uppercase; } table { width: 100%; border-collapse: collapse; font-size: 11px; } th, td { border: 1px solid #000; padding: 6px; } th { background-color: #e5e7eb; text-align: center; } td.text-right { text-align: right; } td.text-center { text-align: center; } @media print { @page { size: landscape; margin: 10mm; } body { padding: 0; } }</style></head><body><h1>${title}</h1>${tableHtml}<script>setTimeout(() => { window.print(); window.close(); }, 500);</script></body></html>`);
  printWindow.document.close();
};

// --- LOGIKA PERHITUNGAN ATAP & ASEM OTOMATIS BERDASARKAN PDKP 2024 ---
const calculateAtapTahunan = (year, kec, db, masterKomoditas) => {
  const result = {}; const s1 = db[`${year}-I-${kec}`] || {}; const s2 = db[`${year}-II-${kec}`] || {};
  const allKeys = Array.from(new Set([...masterKomoditas, ...Object.keys(s1), ...Object.keys(s2)])).filter(k => k !== 'isLocked');
  allKeys.forEach(kom => {
    const r1 = s1[kom] || emptyRow(kom); const r2 = s2[kom] || emptyRow(kom);
    const tm1 = parseFloat(r1.col9) || 0; const tm2 = parseFloat(r2.col9) || 0;
    const luas1 = (parseFloat(r1.col8)||0) + tm1 + (parseFloat(r1.col10)||0); const luas2 = (parseFloat(r2.col8)||0) + tm2 + (parseFloat(r2.col10)||0);
    let selectedRow = r1; if (tm2 > tm1 || (tm2 === tm1 && luas2 > luas1)) { selectedRow = r2; }
    result[kom] = { tbm: parseFloat(selectedRow.col8) || 0, tm: parseFloat(selectedRow.col9) || 0, ttm: parseFloat(selectedRow.col10) || 0, produksi: (parseFloat(r1.col12) || 0) + (parseFloat(r2.col12) || 0), petani: Math.max((parseFloat(r1.col14) || 0), (parseFloat(r2.col14) || 0)) };
  });
  return result;
};

const calculateAsemTahunan = (year, kec, db, masterKomoditas) => {
  const result = {}; const s1 = db[`${year}-I-${kec}`] || {};
  const allKeys = Array.from(new Set([...masterKomoditas, ...Object.keys(s1)])).filter(k => k !== 'isLocked');
  allKeys.forEach(kom => {
    const r1 = s1[kom] || emptyRow(kom);
    const s1_tbm = parseFloat(r1.col8)||0; const s1_tm = parseFloat(r1.col9)||0; const s1_ttm = parseFloat(r1.col10)||0;
    const s1_total = s1_tbm + s1_tm + s1_ttm; const s1_prod = parseFloat(r1.col12)||0; const s1_petani = parseFloat(r1.col14)||0;

    let sumTotalS2 = 0, sumProdS2 = 0, sumPetaniS2 = 0, countS2 = 0;
    for (let i = 1; i <= 5; i++) {
        const past_s2 = db[`${parseInt(year)-i}-II-${kec}`]?.[kom];
        if (past_s2) { sumTotalS2 += (parseFloat(past_s2.col8)||0) + (parseFloat(past_s2.col9)||0) + (parseFloat(past_s2.col10)||0); sumProdS2 += parseFloat(past_s2.col12)||0; sumPetaniS2 += parseFloat(past_s2.col14)||0; countS2++; }
    }
    const avgTotalS2 = countS2 > 0 ? sumTotalS2 / countS2 : 0; const avgProdS2 = countS2 > 0 ? sumProdS2 / countS2 : 0; const avgPetaniS2 = countS2 > 0 ? sumPetaniS2 / countS2 : 0;

    const t1_s2 = db[`${parseInt(year)-1}-II-${kec}`]?.[kom];
    let pctTbm = 0, pctTm = 0, pctTtm = 0;
    if (t1_s2) {
        const t1_total = (parseFloat(t1_s2.col8)||0) + (parseFloat(t1_s2.col9)||0) + (parseFloat(t1_s2.col10)||0);
        if (t1_total > 0) { pctTbm = (parseFloat(t1_s2.col8)||0) / t1_total; pctTm = (parseFloat(t1_s2.col9)||0) / t1_total; pctTtm = (parseFloat(t1_s2.col10)||0) / t1_total; }
    }
    const proj_tbm = pctTbm * avgTotalS2; const proj_tm = pctTm * avgTotalS2; const proj_ttm = pctTtm * avgTotalS2;
    const proj_total = proj_tbm + proj_tm + proj_ttm;
    let sel_tbm = s1_tbm, sel_tm = s1_tm, sel_ttm = s1_ttm;
    if (proj_tm > s1_tm || (proj_tm === s1_tm && proj_total > s1_total)) { sel_tbm = proj_tbm; sel_tm = proj_tm; sel_ttm = proj_ttm; }
    result[kom] = { tbm: sel_tbm, tm: sel_tm, ttm: sel_ttm, produksi: s1_prod + avgProdS2, petani: Math.max(s1_petani, avgPetaniS2) };
  });
  return result;
};

const calculateAtapSemusim = (year, kec, dbSemusim, masterKomoditas) => {
  const result = {}; const allKeys = new Set(masterKomoditas);
  TRIWULAN_OPTIONS.forEach(tw => Object.keys(dbSemusim[`${year}-${tw}-${kec}`] || {}).forEach(k => { if(k !== 'isLocked') allKeys.add(k); }));

  Array.from(allKeys).forEach(kom => {
    let maxTm = -1, maxLuasRow = null, totalProduksi = 0, maxPetani = 0;
    TRIWULAN_OPTIONS.forEach(tw => {
      const r = dbSemusim[`${year}-${tw}-${kec}`]?.[kom] || emptyRowSemusim(kom);
      const tm = parseFloat(r.col7) || 0; const luas = (parseFloat(r.col3)||0) + (parseFloat(r.col4)||0) - (parseFloat(r.col5)||0);
      totalProduksi += parseFloat(r.col8) || 0; if ((parseFloat(r.col11)||0) > maxPetani) maxPetani = parseFloat(r.col11)||0;
      if (tm > maxTm) { maxTm = tm; maxLuasRow = r; } else if (tm === maxTm && luas > (maxLuasRow ? ((parseFloat(maxLuasRow.col3)||0) + (parseFloat(maxLuasRow.col4)||0) - (parseFloat(maxLuasRow.col5)||0)) : 0)) { maxLuasRow = r; }
    });
    result[kom] = { luas: maxLuasRow ? ((parseFloat(maxLuasRow.col3)||0) + (parseFloat(maxLuasRow.col4)||0) - (parseFloat(maxLuasRow.col5)||0)) : 0, panen: maxTm > -1 ? maxTm : 0, produksi: totalProduksi, petani: maxPetani };
  });
  return result;
};

const calculateAsemSemusim = (year, kec, dbSemusim, masterKomoditas) => {
  const result = {}; const allKeys = new Set(masterKomoditas);
  TRIWULAN_OPTIONS.forEach(tw => Object.keys(dbSemusim[`${year}-${tw}-${kec}`] || {}).forEach(k => { if(k !== 'isLocked') allKeys.add(k); }));

  Array.from(allKeys).forEach(kom => {
    let maxTm = -1, maxLuasRow = null, totalProduksi = 0, maxPetani = 0;
    TRIWULAN_OPTIONS.forEach(tw => {
      let r = dbSemusim[`${year}-${tw}-${kec}`]?.[kom];
      if (!r || (r.col3 === '' && r.col7 === '')) {
          let sumLuas = 0, sumPanen = 0, sumProd = 0, sumPetani = 0, count = 0;
          for(let i=1; i<=5; i++) {
              const p = dbSemusim[`${parseInt(year)-i}-${tw}-${kec}`]?.[kom];
              if (p) { sumLuas += (parseFloat(p.col3)||0) + (parseFloat(p.col4)||0) - (parseFloat(p.col5)||0); sumPanen += parseFloat(p.col7)||0; sumProd += parseFloat(p.col8)||0; sumPetani += parseFloat(p.col11)||0; count++; }
          }
          r = { col3: count>0 ? sumLuas/count : 0, col4: 0, col5: 0, col7: count>0 ? sumPanen/count : 0, col8: count>0 ? sumProd/count : 0, col11: count>0 ? sumPetani/count : 0 };
      }
      const tm = parseFloat(r.col7) || 0; const luas = (parseFloat(r.col3)||0) + (parseFloat(r.col4)||0) - (parseFloat(r.col5)||0);
      totalProduksi += parseFloat(r.col8) || 0; if ((parseFloat(r.col11) || 0) > maxPetani) maxPetani = parseFloat(r.col11) || 0;
      if (tm > maxTm) { maxTm = tm; maxLuasRow = r; } else if (tm === maxTm && luas > (maxLuasRow ? ((parseFloat(maxLuasRow.col3)||0) + (parseFloat(maxLuasRow.col4)||0) - (parseFloat(maxLuasRow.col5)||0)) : 0)) { maxLuasRow = r; }
    });
    result[kom] = { luas: maxLuasRow ? ((parseFloat(maxLuasRow.col3)||0) + (parseFloat(maxLuasRow.col4)||0) - (parseFloat(maxLuasRow.col5)||0)) : 0, panen: maxTm > -1 ? maxTm : 0, produksi: totalProduksi, petani: maxPetani };
  });
  return result;
};


// --- KOMPONEN UTAMA APP ---
export default function App() {
  const [loadingData, setLoadingData] = useState(true);

  const [user, setUser] = useState(null); 
  const [usersDb, setUsersDb] = useState({});
  const [db, setDb] = useState({}); 
  const [dbSemusim, setDbSemusim] = useState({}); 
  const [atapTahunan, setAtapTahunan] = useState({});
  const [atapSemusim, setAtapSemusim] = useState({});
  const [asemTahunan, setAsemTahunan] = useState({});
  const [asemSemusim, setAsemSemusim] = useState({});

  const [masterData, setMasterData] = useState({ kecamatan: [], komoditas: [], komoditasSemusim: [], wujud: {}, wujudSemusim: {} });

  const [toast, setToast] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({ tahunan: true, semusim: true });

  // === FIREBASE REALTIME SYNC (onSnapshot) ===
  useEffect(() => {
    let unsubscribes = [];

    // Sync Master Data
    unsubscribes.push(onSnapshot(doc(firestoreDb, "settings", "masterData"), (docSnap) => {
      if (docSnap.exists()) {
        setMasterData(docSnap.data());
      } else {
        // Initialize Master Data on first run
        setDoc(doc(firestoreDb, "settings", "masterData"), {
          kecamatan: INITIAL_KECAMATAN, komoditas: INITIAL_KOMODITAS, komoditasSemusim: INITIAL_KOMODITAS_SEMUSIM,
          wujud: INITIAL_WUJUD_PRODUKSI_MAP, wujudSemusim: INITIAL_WUJUD_PRODUKSI_SEMUSIM_MAP
        });
      }
    }));

    // Sync Users DB
    unsubscribes.push(onSnapshot(collection(firestoreDb, "usersDb"), (snapshot) => {
      if (snapshot.empty) {
         // Initialize Default Users on first run
         const initial = initMockUsers();
         Object.keys(initial).forEach(key => setDoc(doc(firestoreDb, "usersDb", key), initial[key]));
      } else {
         const data = {}; snapshot.forEach(d => data[d.id] = d.data()); setUsersDb(data);
      }
    }));

    // Reusable listener for collection tables
    const syncCollection = (colName, setter) => {
      return onSnapshot(collection(firestoreDb, colName), (snapshot) => {
        const data = {}; snapshot.forEach(d => data[d.id] = d.data()); setter(data);
      });
    };

    unsubscribes.push(syncCollection("dbT", setDb));
    unsubscribes.push(syncCollection("dbS", setDbSemusim));
    unsubscribes.push(syncCollection("atapT", setAtapTahunan));
    unsubscribes.push(syncCollection("atapS", setAtapSemusim));
    unsubscribes.push(syncCollection("asemT", setAsemTahunan));
    unsubscribes.push(syncCollection("asemS", setAsemSemusim));

    // Turn off loading screen after connections are established
    setTimeout(() => setLoadingData(false), 2000);

    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  
  const showDialog = (title, message, onConfirm = null, isAlertOnly = false) => { setDialog({ isOpen: true, title, message, onConfirm, isAlertOnly, onCancel: () => setDialog(null) }); };

  const handleLogin = (credentials) => {
    const userRecord = usersDb[credentials.username.toLowerCase()];
    if (userRecord && userRecord.password === credentials.password) { setUser({ ...userRecord }); return true; }
    return false;
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-emerald-900 flex flex-col items-center justify-center p-4">
         <Sprout className="w-20 h-20 text-emerald-400 animate-bounce mb-6" />
         <h1 className="text-white text-2xl font-black tracking-widest uppercase">SIMBUN PANGANDARAN</h1>
         <p className="text-emerald-200 text-sm mt-3 font-medium animate-pulse">Menghubungkan ke Database Server...</p>
      </div>
    );
  }

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  const toggleMenu = (id) => { setOpenMenus(prev => ({ ...prev, [id]: !prev[id] })); };

  const menuData = [
    { id: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
    ...(user.role === 'kabupaten' ? [{ id: 'manajemen-db', label: 'Manajemen Database', icon: Database }] : []),
    ...(user.role === 'kabupaten' ? [{ id: 'manajemen-user', label: 'Manajemen Pengguna', icon: Shield }] : []),
    { id: 'tahunan', label: 'Tanaman Tahunan', icon: Tractor, subItems: [{ id: 'tahunan-laporan', label: 'Laporan Semester' }, { id: 'tahunan-asem', label: 'Angka Sementara (ASEM)' }, { id: 'tahunan-atap', label: 'Angka Tetap (ATAP)' }] },
    { id: 'semusim', label: 'Tanaman Semusim', icon: Leaf, subItems: [{ id: 'semusim-laporan', label: 'Laporan Triwulan' }, { id: 'semusim-asem', label: 'Angka Sementara (ASEM)' }, { id: 'semusim-atap', label: 'Angka Tetap (ATAP)' }] },
    { id: 'panduan', label: 'Panduan Penggunaan', icon: BookOpen },
    { id: 'pengaturan', label: 'Pengaturan Akun', icon: Settings }
  ];

  const getActiveMenuLabel = () => {
    if (activeMenu === 'dashboard') return 'Beranda';
    if (activeMenu === 'panduan') return 'Panduan Penggunaan';
    if (activeMenu === 'pengaturan') return 'Pengaturan Akun';
    if (activeMenu === 'manajemen-user') return 'Manajemen Pengguna';
    if (activeMenu === 'manajemen-db') return 'Manajemen Database';
    for (const menu of menuData) { if (menu.subItems) { const sub = menu.subItems.find(s => s.id === activeMenu); if (sub) return `${menu.label} - ${sub.label}`; } else if (menu.id === activeMenu) return menu.label; }
    return 'Beranda';
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800 overflow-hidden">
     {dialog && dialog.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95">
            <h3 className={`text-lg font-bold mb-2 flex items-center gap-2 ${dialog.isAlertOnly ? 'text-red-600' : 'text-gray-900'}`}>
              <AlertCircle className={`w-5 h-5 ${dialog.isAlertOnly ? 'text-red-500' : 'text-amber-500'}`}/> 
              {dialog.title}
            </h3>
            <p className="text-gray-600 text-sm mb-6 whitespace-pre-wrap leading-relaxed">{dialog.message}</p>
            <div className="flex justify-end gap-3">
              {dialog.isAlertOnly ? (
                <button onClick={dialog.onCancel} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors shadow-sm">Tutup & Perbaiki</button>
              ) : (
                <>
                  <button onClick={dialog.onCancel} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors">Batal</button>
                  <button onClick={() => { if(dialog.onConfirm) dialog.onConfirm(); setDialog(null); }} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-sm">Ya, Lanjutkan</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-emerald-800 text-white flex flex-col transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center gap-3 p-4 border-b border-emerald-700/50 bg-emerald-900/20">
          <div className="bg-white p-1 rounded-lg flex-shrink-0 flex items-center justify-center">
            <KementanLogo className="w-8 h-8 object-contain" />
          </div>
          <div className="overflow-hidden">
            <h1 className="font-bold text-lg leading-tight truncate">SIMBUN</h1>
            <p className="text-emerald-100 text-xs font-semibold truncate">Kab. Pangandaran</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-2">
          {menuData.map(menu => (
            <div key={menu.id}>
              {menu.subItems ? (
                <>
                  <button onClick={() => toggleMenu(menu.id)} className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-emerald-100 hover:bg-emerald-700/40 transition-colors font-medium">
                    <div className="flex items-center gap-3"><menu.icon className="w-5 h-5 text-emerald-300" /><span>{menu.label}</span></div>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openMenus[menu.id] ? 'rotate-180' : ''}`} />
                  </button>
                  {openMenus[menu.id] && (
                    <div className="mt-1 ml-4 pl-4 border-l border-emerald-700 space-y-1 animate-in fade-in duration-300">
                      {menu.subItems.map(sub => (
                        <button key={sub.id} onClick={() => { setActiveMenu(sub.id); setIsSidebarOpen(false); }} 
                          className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-all ${activeMenu === sub.id ? 'bg-emerald-700 text-white font-semibold shadow-sm' : 'text-emerald-200 hover:text-white hover:bg-emerald-700/30'}`}>
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <button onClick={() => { setActiveMenu(menu.id); setIsSidebarOpen(false); }} 
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${activeMenu === menu.id ? 'bg-emerald-700 text-white shadow-sm' : 'text-emerald-100 hover:bg-emerald-700/40'}`}>
                  <menu.icon className={`w-5 h-5 ${activeMenu === menu.id ? 'text-emerald-300' : 'text-emerald-400/70'}`} />
                  <span>{menu.label}</span>
                </button>
              )}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-emerald-700/50 bg-emerald-800/50">
          <div className="mb-3">
            <p className="text-sm font-semibold truncate">{user.name}</p>
            <p className="text-xs text-emerald-300 uppercase tracking-wider">{user.role}</p>
          </div>
          <button onClick={() => setUser(null)} className="w-full flex items-center justify-center gap-2 bg-emerald-700 hover:bg-red-600 px-3 py-2 rounded-lg transition-colors text-sm font-medium">
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg lg:hidden"><Menu className="w-6 h-6" /></button>
            <h2 className="text-xl font-bold text-gray-800 hidden sm:block">{getActiveMenuLabel()}</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right"><p className="text-sm font-semibold text-gray-700">{user.name}</p></div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center text-emerald-700 font-bold">{user.name.charAt(0).toUpperCase()}</div>
          </div>
        </header>

        {toast && (
          <div className={`absolute top-20 right-6 p-4 rounded-lg shadow-lg flex items-center gap-3 text-white z-50 transition-all animate-in fade-in slide-in-from-top-4 ${toast.type === 'success' ? 'bg-emerald-600' : toast.type === 'info' ? 'bg-blue-500' : 'bg-red-500'}`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5"/> : <AlertCircle className="w-5 h-5"/>}
            <p className="font-medium text-sm">{toast.msg}</p>
          </div>
        )}

        <main className="flex-1 overflow-y-auto bg-gray-50/50 p-4 sm:p-6 lg:p-8">
          {activeMenu === 'dashboard' && <HomeDashboard user={user} atapT={atapTahunan} atapS={atapSemusim} />}
          
          {/* MANAJEMEN MASTER DATA & USER */}
          {activeMenu === 'manajemen-db' && user.role === 'kabupaten' && <ManajemenDatabase masterData={masterData} showToast={showToast} showDialog={showDialog} />}
          {activeMenu === 'manajemen-user' && user.role === 'kabupaten' && <ManajemenPengguna user={user} usersDb={usersDb} showToast={showToast} showDialog={showDialog} />}
          {activeMenu === 'pengaturan' && <PengaturanAkun user={user} setUser={setUser} usersDb={usersDb} showToast={showToast} />}

          {/* TAHUNAN ROUTING */}
          {activeMenu === 'tahunan-laporan' && (
            user.role === 'kecamatan' 
              ? <KecamatanLaporanTahunan user={user} db={db} showToast={showToast} showDialog={showDialog} masterData={masterData} />
              : <KabupatenLaporanTahunan db={db} showToast={showToast} masterData={masterData} />
          )}
          {activeMenu === 'tahunan-atap' && (
             user.role === 'kecamatan'
             ? <KecamatanAtapTahunan user={user} db={db} atap={atapTahunan} showToast={showToast} showDialog={showDialog} titleType="ATAP" masterData={masterData} />
             : <KabupatenAtapTahunan atap={atapTahunan} showToast={showToast} titleType="ATAP" masterData={masterData} />
          )}
          {activeMenu === 'tahunan-asem' && (
             user.role === 'kecamatan'
             ? <KecamatanAtapTahunan user={user} db={db} atap={asemTahunan} showToast={showToast} showDialog={showDialog} titleType="ASEM" masterData={masterData} />
             : <KabupatenAtapTahunan atap={asemTahunan} showToast={showToast} titleType="ASEM" masterData={masterData} />
          )}

          {/* SEMUSIM ROUTING */}
          {activeMenu === 'semusim-laporan' && (
             user.role === 'kecamatan' 
             ? <KecamatanLaporanSemusim user={user} db={dbSemusim} showToast={showToast} showDialog={showDialog} masterData={masterData} />
             : <KabupatenLaporanSemusim db={dbSemusim} showToast={showToast} masterData={masterData} />
          )}
          {activeMenu === 'semusim-atap' && (
             user.role === 'kecamatan'
             ? <KecamatanAtapSemusim user={user} dbSemusim={dbSemusim} atap={atapSemusim} showToast={showToast} showDialog={showDialog} titleType="ATAP" masterData={masterData} />
             : <KabupatenAtapSemusim atap={atapSemusim} showToast={showToast} titleType="ATAP" masterData={masterData} />
          )}
          {activeMenu === 'semusim-asem' && (
             user.role === 'kecamatan'
             ? <KecamatanAtapSemusim user={user} dbSemusim={dbSemusim} atap={asemSemusim} showToast={showToast} showDialog={showDialog} titleType="ASEM" masterData={masterData} />
             : <KabupatenAtapSemusim atap={asemSemusim} showToast={showToast} titleType="ASEM" masterData={masterData} />
          )}

          {/* PANDUAN PENGGUNAAN */}
          {activeMenu === 'panduan' && <PanduanDashboard />}
        </main>
      </div>
    </div>
  );
}

// --- KOMPONEN: LAYAR LOGIN ---
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = onLogin({username, password});
    if (!success) setErrorMsg('Username atau Password salah!');
  };

  return (
    <div className="min-h-screen bg-emerald-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
        <Sprout className="absolute -top-20 -left-20 w-96 h-96 text-white transform -rotate-12" />
        <Sprout className="absolute bottom-0 right-0 w-96 h-96 text-white transform rotate-12" />
      </div>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4"><KementanLogo className="h-24 w-auto object-contain" /></div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-wide">SIMBUN PANGANDARAN</h1>
          <p className="text-gray-600 text-sm mt-2 font-medium">Sistem Informasi Perkebunan</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMsg && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-bold text-center animate-in fade-in">{errorMsg}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Masukkan username" value={username} onChange={e => {setUsername(e.target.value); setErrorMsg('');}} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 pr-12" placeholder="••••••••" value={password} onChange={e => {setPassword(e.target.value); setErrorMsg('');}} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors focus:outline-none">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 rounded-lg shadow-md transition-colors uppercase tracking-wider mt-2">Masuk Sistem</button>
        </form>
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">Simbun V.01</p>
          <p className="text-xs text-gray-500 font-medium">Dinas Pertanian Kabupaten Pangandaran</p>
        </div>
      </div>
    </div>
  );
}

// --- KOMPONEN: DASHBOARD HOME ---
function HomeDashboard({ user, atapT, atapS }) {
  const [selectedYear, setSelectedYear] = useState('2024');

  const stats = useMemo(() => {
    let totalLuas = 0, totalProduksi = 0, totalPetani = 0;
    const komoditasMap = {};

    Object.keys(atapT).forEach(key => {
      const isWilayahSesuai = user.role === 'kabupaten' || key.endsWith(user.wilayah);
      if (key.startsWith(`${selectedYear}-`) && isWilayahSesuai) {
        const kecData = atapT[key].data;
        Object.keys(kecData).forEach(kom => {
          const r = kecData[kom];
          totalLuas += r.jumlah || 0; totalProduksi += r.produksi || 0; totalPetani += r.petani || 0;
          komoditasMap[kom] = (komoditasMap[kom] || 0) + (r.produksi || 0);
        });
      }
    });

    Object.keys(atapS).forEach(key => {
      const isWilayahSesuai = user.role === 'kabupaten' || key.endsWith(user.wilayah);
      if (key.startsWith(`${selectedYear}-`) && isWilayahSesuai) {
        const kecData = atapS[key].data;
        Object.keys(kecData).forEach(kom => {
          const r = kecData[kom];
          totalLuas += r.luas || 0; totalProduksi += r.produksi || 0; totalPetani += r.petani || 0;
          komoditasMap[kom] = (komoditasMap[kom] || 0) + (r.produksi || 0);
        });
      }
    });

    const topKomoditas = Object.entries(komoditasMap).map(([name, prod]) => ({ name, prod })).sort((a, b) => b.prod - a.prod).slice(0, 5);
    const maxProd = topKomoditas.length > 0 ? topKomoditas[0].prod : 1;

    return { totalLuas, totalProduksi, totalPetani, topKomoditas, maxProd };
  }, [atapT, atapS, user.role, user.wilayah, selectedYear]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-xl p-6 sm:p-8 text-gray-800 relative overflow-hidden shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative z-10 flex items-center gap-6">
           <KementanLogo className="h-24 w-auto hidden sm:block object-contain" />
           <div>
            <h2 className="text-2xl sm:text-3xl font-black mb-2 uppercase tracking-wide">Selamat Datang, {user.name}!</h2>
            <p className="text-gray-600 font-medium max-w-2xl text-sm sm:text-base">Sistem Informasi Perkebunan (SIMBUN) Kabupaten Pangandaran.</p>
           </div>
        </div>
        
        <div className="relative z-10 flex items-center gap-3 bg-gray-50 p-2 sm:p-3 rounded-lg border border-gray-200 shadow-sm">
           <span className="text-sm font-bold text-gray-700 hidden sm:block">Filter Tahun:</span>
           <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)} 
              className="bg-white border border-gray-300 rounded px-3 py-1.5 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
           >
              {TAHUN_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
           </select>
        </div>

        <Sprout className="absolute -right-10 -bottom-10 w-48 h-48 sm:w-64 sm:h-64 text-emerald-900 opacity-10 transform rotate-12" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {[{title: `Luas Areal ATAP (${selectedYear})`, val: stats.totalLuas, unit: 'Ha', icon: Map, color: 'blue'},
          {title: `Produksi ATAP (${selectedYear})`, val: stats.totalProduksi, unit: 'Kg', icon: Activity, color: 'emerald'},
          {title: `Petani ATAP (${selectedYear})`, val: stats.totalPetani, unit: 'KK', icon: Users, color: 'amber'}].map((s,i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start relative z-10">
              <div><p className="text-sm font-bold text-gray-500 mb-1 uppercase tracking-wider">{s.title}</p><h3 className="text-3xl font-black text-gray-800">{s.val.toLocaleString('id-ID')} <span className="text-base font-bold text-gray-500">{s.unit}</span></h3></div>
              <div className={`p-3 bg-${s.color}-50 text-${s.color}-700 rounded-xl group-hover:scale-110 transition-transform shadow-sm border border-${s.color}-100`}><s.icon className="w-6 h-6"/></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6"><BarChart3 className="w-5 h-5 text-indigo-700" /><h3 className="text-lg font-bold text-gray-800 uppercase tracking-wide">Top 5 Komoditas ATAP ({selectedYear})</h3></div>
          <div className="space-y-4">
            {stats.topKomoditas.length === 0 ? (<p className="text-sm text-gray-400 text-center py-4">Data belum tersedia untuk tahun {selectedYear}.</p>) : (
              stats.topKomoditas.map((item, idx) => (
                <div key={item.name} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-sm font-bold"><span className="text-gray-700">{idx + 1}. {item.name}</span><span className="text-gray-900">{item.prod.toLocaleString('id-ID')} Kg</span></div>
                  <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden flex border border-gray-200">
                    <div className={`h-full rounded-full transition-all duration-1000 shadow-sm ${idx === 0 ? 'bg-indigo-600' : idx === 1 ? 'bg-blue-600' : idx === 2 ? 'bg-emerald-600' : idx === 3 ? 'bg-amber-600' : 'bg-rose-500'}`} style={{ width: `${(item.prod / stats.maxProd) * 100}%` }}></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================================================================================
// === MODUL MANAJEMEN DATABASE (MASTER DATA)
// ========================================================================================
function ManajemenDatabase({ masterData, showToast, showDialog }) {
  const [activeTab, setActiveTab] = useState('kecamatan');
  
  const [newKec, setNewKec] = useState('');
  const [newKom, setNewKom] = useState('');
  const [newWujud, setNewWujud] = useState('');
  const [editingWujud, setEditingWujud] = useState({ kom: null, val: '' });

  const handleAddKec = async (e) => {
    e.preventDefault();
    if(!newKec) return;
    const formatted = newKec.charAt(0).toUpperCase() + newKec.slice(1).toLowerCase();
    if(masterData.kecamatan.includes(formatted)) { showToast('Kecamatan sudah ada!', 'error'); return; }
    
    const newMaster = { ...masterData, kecamatan: [...masterData.kecamatan, formatted].sort() };
    await setDoc(doc(firestoreDb, "settings", "masterData"), newMaster);
    await setDoc(doc(firestoreDb, "usersDb", formatted.toLowerCase()), { username: formatted.toLowerCase(), password: 'pass123', name: `Admin Kec. ${formatted}`, role: 'kecamatan', wilayah: formatted });
    
    setNewKec('');
    showToast(`Kecamatan ${formatted} berhasil ditambahkan!`);
  };

  const handleDeleteKec = (kec) => {
    showDialog('Hapus Master Data Kecamatan', `Yakin menghapus ${kec} dari sistem?\n\nKecamatan tidak akan muncul di form baru, namun akun admin otomatis dihapus. Data riwayat laporan yang pernah masuk akan tetap dipertahankan.`, async () => {
      const newMaster = { ...masterData, kecamatan: masterData.kecamatan.filter(k => k !== kec) };
      await setDoc(doc(firestoreDb, "settings", "masterData"), newMaster);
      await deleteDoc(doc(firestoreDb, "usersDb", kec.toLowerCase()));
      showToast('Kecamatan dihapus dari Master Data!', 'success');
    });
  };

  const handleAddKom = async (e, isSemusim) => {
    e.preventDefault();
    if(!newKom || !newWujud) return;
    
    const listKey = isSemusim ? 'komoditasSemusim' : 'komoditas';
    const mapKey = isSemusim ? 'wujudSemusim' : 'wujud';
    
    const formatted = newKom.charAt(0).toUpperCase() + newKom.slice(1).toLowerCase();
    if(masterData[listKey].includes(formatted)) { showToast('Komoditas ini sudah ada!', 'error'); return; }

    const newMaster = {
      ...masterData,
      [listKey]: [...masterData[listKey], formatted].sort(),
      [mapKey]: { ...masterData[mapKey], [formatted]: newWujud }
    };
    await setDoc(doc(firestoreDb, "settings", "masterData"), newMaster);
    
    setNewKom(''); setNewWujud('');
    showToast(`Komoditas ${formatted} berhasil ditambahkan!`);
  };

  const handleDeleteKom = (kom, isSemusim) => {
    const listKey = isSemusim ? 'komoditasSemusim' : 'komoditas';
    showDialog('Hapus Master Komoditas', `Yakin menghapus ${kom} dari daftar pilihan data baru?\n\nRiwayat pelaporan lama yang menggunakan komoditas ini tidak akan dihapus.`, async () => {
      const newMaster = { ...masterData, [listKey]: masterData[listKey].filter(k => k !== kom) };
      await setDoc(doc(firestoreDb, "settings", "masterData"), newMaster);
      showToast('Komoditas disembunyikan dari form baru!', 'success');
    });
  };

  const handleSaveEditWujud = async (kom, isSemusim) => {
    if(!editingWujud.val) return;
    const mapKey = isSemusim ? 'wujudSemusim' : 'wujud';
    const newMaster = { ...masterData, [mapKey]: { ...masterData[mapKey], [kom]: editingWujud.val } };
    await setDoc(doc(firestoreDb, "settings", "masterData"), newMaster);
    setEditingWujud({ kom: null, val: '' });
    showToast('Wujud Produksi berhasil diperbarui!');
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-purple-600">
        <h2 className="text-xl font-black text-gray-900 uppercase tracking-wide">Manajemen Master Data</h2>
        <p className="text-gray-600 font-medium text-sm mt-1">Mengelola daftar wilayah dan komoditas baku di aplikasi. Perubahan data di sini <b>tidak akan merusak</b> laporan yang sudah tersimpan sebelumnya.</p>
        
        <div className="flex bg-gray-100 p-1 rounded-lg w-fit mt-6">
          <button onClick={() => setActiveTab('kecamatan')} className={`px-4 py-2 font-bold text-sm rounded uppercase transition-all ${activeTab === 'kecamatan' ? 'bg-white shadow text-purple-800' : 'text-gray-500'}`}>Daftar Kecamatan</button>
          <button onClick={() => setActiveTab('tahunan')} className={`px-4 py-2 font-bold text-sm rounded uppercase transition-all ${activeTab === 'tahunan' ? 'bg-white shadow text-purple-800' : 'text-gray-500'}`}>Tanaman Tahunan</button>
          <button onClick={() => setActiveTab('semusim')} className={`px-4 py-2 font-bold text-sm rounded uppercase transition-all ${activeTab === 'semusim' ? 'bg-white shadow text-purple-800' : 'text-gray-500'}`}>Tanaman Semusim</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6">
        {activeTab === 'kecamatan' && (
          <div className="space-y-6 animate-in fade-in">
            <form onSubmit={handleAddKec} className="flex gap-3 items-end p-4 bg-purple-50/50 border border-purple-100 rounded-xl">
              <div className="flex-1">
                <label className="block text-sm font-bold text-purple-900 mb-1">Tambah Kecamatan Baru</label>
                <input type="text" value={newKec} onChange={e=>setNewKec(e.target.value)} placeholder="Masukkan nama kecamatan..." className="w-full p-2.5 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white" required />
              </div>
              <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-2.5 rounded-lg flex items-center gap-2"><Plus className="w-4 h-4"/> Tambah</button>
            </form>
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-100 text-gray-700 text-sm"><tr><th className="p-3 w-16 text-center rounded-tl-lg">No</th><th className="p-3">Nama Kecamatan</th><th className="p-3 text-right rounded-tr-lg">Aksi Hapus</th></tr></thead>
              <tbody className="divide-y divide-gray-100 border-b border-gray-100">
                {masterData.kecamatan.map((kec, i) => (
                  <tr key={kec} className="hover:bg-gray-50">
                    <td className="p-3 text-center text-sm font-medium text-gray-500">{i+1}</td>
                    <td className="p-3 font-bold text-gray-800">{kec}</td>
                    <td className="p-3 text-right"><button onClick={()=>handleDeleteKec(kec)} className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-bold"><Trash2 className="w-4 h-4 inline mr-1"/>Hapus</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(activeTab === 'tahunan' || activeTab === 'semusim') && (() => {
          const isSemusim = activeTab === 'semusim';
          const list = isSemusim ? masterData.komoditasSemusim : masterData.komoditas;
          const mapWujud = isSemusim ? masterData.wujudSemusim : masterData.wujud;

          return (
            <div className="space-y-6 animate-in fade-in">
              <form onSubmit={e => handleAddKom(e, isSemusim)} className="flex flex-col md:flex-row gap-3 items-end p-4 bg-purple-50/50 border border-purple-100 rounded-xl">
                <div className="w-full md:w-1/3">
                  <label className="block text-sm font-bold text-purple-900 mb-1">Tambah Komoditas Baru</label>
                  <input type="text" value={newKom} onChange={e=>setNewKom(e.target.value)} placeholder="Nama Tanaman..." className="w-full p-2.5 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white" required />
                </div>
                <div className="w-full md:w-1/3">
                  <label className="block text-sm font-bold text-purple-900 mb-1">Wujud Produksi Default</label>
                  <input type="text" value={newWujud} onChange={e=>setNewWujud(e.target.value)} placeholder="Contoh: Biji Kering" className="w-full p-2.5 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white" required />
                </div>
                <button type="submit" className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-2.5 rounded-lg flex items-center justify-center gap-2"><Plus className="w-4 h-4"/> Tambah Data</button>
              </form>
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-100 text-gray-700 text-sm"><tr><th className="p-3 w-16 text-center rounded-tl-lg">No</th><th className="p-3 w-1/3">Nama Komoditas</th><th className="p-3">Wujud Produksi Master</th><th className="p-3 text-right rounded-tr-lg">Aksi</th></tr></thead>
                <tbody className="divide-y divide-gray-100 border-b border-gray-100">
                  {list.map((kom, i) => (
                    <tr key={kom} className="hover:bg-gray-50">
                      <td className="p-3 text-center text-sm font-medium text-gray-500">{i+1}</td>
                      <td className="p-3 font-bold text-gray-800">{kom}</td>
                      <td className="p-3">
                        {editingWujud.kom === kom ? (
                          <div className="flex items-center gap-2">
                            <input type="text" autoFocus value={editingWujud.val} onChange={e=>setEditingWujud({...editingWujud, val: e.target.value})} className="p-1.5 border border-purple-300 rounded text-sm w-48 focus:ring-1 focus:ring-purple-500" />
                            <button onClick={()=>handleSaveEditWujud(kom, isSemusim)} className="bg-emerald-600 text-white px-2 py-1 rounded text-xs font-bold hover:bg-emerald-700">Simpan</button>
                            <button onClick={()=>setEditingWujud({kom:null, val:''})} className="bg-gray-200 text-gray-600 px-2 py-1 rounded text-xs font-bold hover:bg-gray-300">Batal</button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between w-48">
                            <span className="font-medium text-gray-700">{mapWujud[kom] || '-'}</span>
                            <button onClick={()=>setEditingWujud({ kom, val: mapWujud[kom]||'' })} className="text-purple-600 hover:text-purple-800 p-1 rounded-md hover:bg-purple-100" title="Edit Wujud Produksi"><Edit className="w-3.5 h-3.5"/></button>
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-right"><button onClick={()=>handleDeleteKom(kom, isSemusim)} className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-bold"><Trash2 className="w-4 h-4 inline mr-1"/>Sembunyikan</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ========================================================================================
// === MODUL MANAJEMEN AKUN & PENGGUNA
// ========================================================================================

function ManajemenPengguna({ user, usersDb, showToast, showDialog }) {
  const [activeTab, setActiveTab] = useState('kabupaten');
  const [modal, setModal] = useState(null); 
  const [formData, setFormData] = useState({ username: '', name: '', password: '', newPassword: '' });

  const isSuperAdmin = user.username.toLowerCase() === 'admin';

  const openModal = (type, uData = null) => {
    setModal({ type, data: uData });
    if (type === 'add_kab') setFormData({ username: '', name: '', password: '' });
    if (type === 'edit_user') setFormData({ username: uData.username, name: uData.name, password: '' });
    if (type === 'reset_kec') setFormData({ username: uData.username, name: uData.name, newPassword: '' });
  };

  const handleSave = async () => {
    if (modal.type === 'add_kab') {
      const key = formData.username.toLowerCase();
      if (!key || !formData.name || !formData.password) { showToast('Semua field wajib diisi!', 'error'); return; }
      if (usersDb[key]) { showToast('Username sudah terpakai!', 'error'); return; }
      
      await setDoc(doc(firestoreDb, "usersDb", key), { username: key, name: formData.name, password: formData.password, role: 'kabupaten', wilayah: 'Pangandaran' });
      showToast('Admin Kabupaten berhasil ditambahkan!');
      setModal(null);
    } else if (modal.type === 'edit_user') {
      if (!formData.name) { showToast('Nama wajib diisi!', 'error'); return; }
      await setDoc(doc(firestoreDb, "usersDb", formData.username), { ...usersDb[formData.username], name: formData.name, password: formData.password || usersDb[formData.username].password });
      showToast('Data Admin berhasil diubah!');
      setModal(null);
    } else if (modal.type === 'reset_kec') {
      if (!formData.newPassword) { showToast('Password baru wajib diisi!', 'error'); return; }
      await setDoc(doc(firestoreDb, "usersDb", formData.username), { ...usersDb[formData.username], password: formData.newPassword });
      showToast(`Password Kecamatan ${formData.name} berhasil direset!`);
      setModal(null);
    }
  };

  const handleDelete = (u) => {
    if (u.username === user.username) { showToast('Anda tidak bisa menghapus diri sendiri!', 'error'); return; }
    showDialog('Hapus Admin', `Yakin ingin menghapus admin ${u.name}? Data pengguna tidak bisa dikembalikan.`, async () => {
      await deleteDoc(doc(firestoreDb, "usersDb", u.username));
      showToast('Admin berhasil dihapus!', 'success');
    });
  };

  const kabUsers = Object.values(usersDb).filter(u => u.role === 'kabupaten');
  const kecUsers = Object.values(usersDb).filter(u => u.role === 'kecamatan');

  return (
    <div className="space-y-6 animate-in fade-in">
      {modal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              {modal.type === 'add_kab' ? <><UserPlus className="w-5 h-5 text-emerald-600"/> Tambah Admin Kabupaten</> : modal.type === 'edit_user' ? <><Edit className="w-5 h-5 text-emerald-600"/> Edit Admin {modal.data?.role === 'kecamatan' ? 'Kecamatan' : 'Kabupaten'}</> : <><Key className="w-5 h-5 text-amber-500"/> Reset Password Kecamatan</>}
            </h3>
            <div className="space-y-4 mb-6">
              {(modal.type === 'add_kab' || modal.type === 'edit_user') && (
                <>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Username Login</label><input type="text" disabled={modal.type === 'edit_user'} value={formData.username} onChange={e => setFormData({...formData, username: e.target.value.replace(/\s+/g, '')})} className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 ${modal.type === 'edit_user' ? 'bg-gray-100 text-gray-500' : ''}`} placeholder="contoh: admin2" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap / Tampilan</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="contoh: Budi Santoso" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Password {modal.type === 'edit_user' && <span className="text-xs text-gray-400 font-normal">(Biarkan kosong jika tidak ingin diganti)</span>}</label><input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="••••••••" /></div>
                </>
              )}
              {modal.type === 'reset_kec' && (
                <>
                  <div className="p-3 bg-amber-50 text-amber-800 rounded-lg border border-amber-100 text-sm mb-4">Anda akan mereset password untuk akun: <b>{formData.name}</b></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label><input type="password" value={formData.newPassword} onChange={e => setFormData({...formData, newPassword: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="Masukkan password baru" /></div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setModal(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200">Batal</button>
              <button onClick={handleSave} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 shadow-sm">Simpan</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-emerald-600">
        <div className="flex bg-gray-100 p-1 rounded-lg w-fit mb-4">
          <button onClick={() => setActiveTab('kabupaten')} className={`px-4 py-2 font-bold text-sm rounded uppercase flex items-center gap-2 transition-all ${activeTab === 'kabupaten' ? 'bg-white shadow text-emerald-800' : 'text-gray-500'}`}><Shield className="w-4 h-4"/> Admin Kabupaten</button>
          <button onClick={() => setActiveTab('kecamatan')} className={`px-4 py-2 font-bold text-sm rounded uppercase flex items-center gap-2 transition-all ${activeTab === 'kecamatan' ? 'bg-white shadow text-emerald-800' : 'text-gray-500'}`}><Users className="w-4 h-4"/> Admin Kecamatan</button>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div><h2 className="text-lg font-black text-gray-900 uppercase tracking-wide">Daftar Pengguna Sistem</h2><p className="text-gray-600 font-medium text-sm">Kelola akses, ubah nama profil, atau reset password akun.</p></div>
          {activeTab === 'kabupaten' && isSuperAdmin && <button onClick={() => openModal('add_kab')} className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wider flex items-center gap-2 shadow-sm transition-colors"><UserPlus className="w-4 h-4" /> Tambah Admin</button>}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {activeTab === 'kabupaten' && !isSuperAdmin && (
           <div className="bg-amber-50 p-3 text-sm text-amber-800 flex items-start gap-2 border-b border-amber-100">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>Hanya <b>Admin Utama (Super Admin)</b> yang memiliki hak untuk menambah, mengedit, atau menghapus akun Admin Kabupaten lainnya.</p>
           </div>
        )}
        {activeTab === 'kecamatan' && (
           <div className="bg-blue-50 p-3 text-sm text-blue-800 flex items-start gap-2 border-b border-blue-100">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>Penambahan dan penghapusan Akun Kecamatan diatur secara otomatis melalui menu <b>Manajemen Database</b> agar tersinkronisasi otomatis dengan wilayah rekapitulasi pelaporan.</p>
           </div>
        )}
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm uppercase"><tr><th className="p-4 w-1/4 font-bold">Username</th><th className="p-4 w-1/2 font-bold">Nama / Alias Tampilan</th><th className="p-4 text-right w-1/4 font-bold">Aksi</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {(activeTab === 'kabupaten' ? kabUsers : kecUsers).map((u) => (
              <tr key={u.username} className="hover:bg-gray-50">
                <td className="p-4 font-bold text-gray-800">{u.username}</td>
                <td className="p-4 text-gray-700 font-medium flex items-center gap-2">{u.name} {u.username === user.username && <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-black uppercase">Anda</span>}</td>
                <td className="p-4 text-right space-x-2 whitespace-nowrap">
                  {activeTab === 'kabupaten' ? (
                    <>
                      <button onClick={() => openModal('edit_user', u)} disabled={!isSuperAdmin && u.username !== user.username} className={`px-3 py-1.5 rounded-lg text-sm font-bold uppercase transition-colors ${(!isSuperAdmin && u.username !== user.username) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}><Edit className="w-4 h-4 inline mr-1"/>Edit</button>
                      <button onClick={() => handleDelete(u)} disabled={u.username === user.username || !isSuperAdmin} className={`px-3 py-1.5 rounded-lg text-sm font-bold uppercase transition-colors ${(u.username === user.username || !isSuperAdmin) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}><Trash2 className="w-4 h-4 inline mr-1"/>Hapus</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => openModal('edit_user', u)} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-bold uppercase transition-colors"><Edit className="w-4 h-4 inline mr-1"/>Edit</button>
                      <button onClick={() => openModal('reset_kec', u)} className="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-sm font-bold uppercase transition-colors"><Key className="w-4 h-4 inline mr-1"/>Reset Sandi</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PengaturanAkun({ user, setUser, usersDb, showToast }) {
  const [name, setName] = useState(user.name);
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name) return showToast('Nama tidak boleh kosong', 'error');
    await setDoc(doc(firestoreDb, "usersDb", user.username), { ...usersDb[user.username], name });
    setUser(p => ({ ...p, name }));
    showToast('Profil berhasil diperbarui!');
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!passwords.old || !passwords.new || !passwords.confirm) return showToast('Isi semua kolom password!', 'error');
    if (usersDb[user.username].password !== passwords.old) return showToast('Password lama salah!', 'error');
    if (passwords.new !== passwords.confirm) return showToast('Password baru dan konfirmasi tidak cocok!', 'error');
    
    await setDoc(doc(firestoreDb, "usersDb", user.username), { ...usersDb[user.username], password: passwords.new });
    setUser(p => ({ ...p, password: passwords.new }));
    setPasswords({ old: '', new: '', confirm: '' });
    showToast('Password berhasil diganti!');
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-4xl">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-emerald-600">
        <h2 className="text-xl font-black text-gray-900 uppercase tracking-wide mb-1">Pengaturan Akun Anda</h2>
        <p className="text-gray-600 font-medium text-sm">Kelola informasi profil dan keamanan login Anda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-3"><Settings className="w-5 h-5 text-gray-400" /> Profil Pengguna</h3>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username Login</label>
              <input type="text" disabled value={user.username} className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 text-gray-500 rounded-lg cursor-not-allowed font-semibold" />
              <p className="text-xs text-gray-400 mt-1">Username tidak dapat diubah.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap / Tampilan</label>
              <input type="text" disabled={user.role === 'kecamatan'} value={name} onChange={e => setName(e.target.value)} className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium ${user.role === 'kecamatan' ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 'border-gray-300'}`} placeholder="Nama Anda" />
              {user.role === 'kecamatan' && <p className="text-xs text-amber-600 font-medium mt-1">Admin Kecamatan tidak dapat merubah nama profil wilayahnya secara mandiri.</p>}
            </div>
            {user.role === 'kabupaten' && <div className="pt-2"><button type="submit" className="bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-lg hover:bg-emerald-800 transition-colors shadow-sm text-sm uppercase tracking-wider flex items-center gap-2"><Save className="w-4 h-4"/> Simpan Profil</button></div>}
          </form>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-3"><Key className="w-5 h-5 text-gray-400" /> Ganti Password</h3>
          <form onSubmit={handleSavePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password Lama</label>
              <input type="password" value={passwords.old} onChange={e => setPasswords({...passwords, old: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="Masukkan password lama" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
              <input type="password" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="Minimal 6 karakter" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password Baru</label>
              <input type="password" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="Ketik ulang password baru" />
            </div>
            <div className="pt-2"><button type="submit" className="bg-amber-500 text-white font-bold px-5 py-2.5 rounded-lg hover:bg-amber-600 transition-colors shadow-sm text-sm uppercase tracking-wider flex items-center gap-2"><Save className="w-4 h-4"/> Simpan Password</button></div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ========================================================================================
// === MODUL TAHUNAN
// ========================================================================================
function KecamatanLaporanTahunan({ user, db, showToast, showDialog, masterData }) {
  const [view, setView] = useState('list'); 
  const [tahun, setTahun] = useState('2024');
  const [semester, setSemester] = useState('I');
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [formData, setFormData] = useState({});
  
  const listLaporan = Object.keys(db).filter(key => key.endsWith(`-${user.wilayah}`)).map(key => {
      const parts = key.split('-'); return { tahun: parts[0], semester: parts[1], key, isLocked: !!db[key].isLocked };
  }).sort((a, b) => b.tahun.localeCompare(a.tahun) || b.semester.localeCompare(a.semester));

  const handleTambahLaporan = () => {
    const key = `${tahun}-${semester}-${user.wilayah}`;
    if (db[key]) { showToast('Laporan sudah ada! Silakan Edit.', 'error'); return; }
    
    const initData = { isLocked: false };
    let prevTahun = tahun, prevSemester = semester === 'II' ? 'I' : 'II';
    if (semester === 'I') prevTahun = (parseInt(tahun) - 1).toString();
    const prevData = db[`${prevTahun}-${prevSemester}-${user.wilayah}`];

    masterData.komoditas.forEach(k => {
      initData[k] = emptyRow(k, masterData.wujud);
      if (prevData && prevData[k]) {
        const pCol7 = parseFloat(prevData[k].col3) + parseFloat(prevData[k].col5) - parseFloat(prevData[k].col6); 
        if (pCol7 > 0) initData[k].col3 = pCol7;
      }
    });

    setFormData(initData); setIsViewOnly(false); setView('form');
  };

  const handleEditLaporan = (t, s, key, viewOnly = false) => { setTahun(t); setSemester(s); setFormData(JSON.parse(JSON.stringify(db[key]))); setIsViewOnly(viewOnly); setView('form'); };
  const handleDeleteLaporan = (key) => { 
    showDialog('Hapus Laporan', 'Apakah Anda yakin ingin menghapus laporan ini? Data tidak dapat dikembalikan.', async () => {
      await deleteDoc(doc(firestoreDb, "dbT", key)); showToast('Laporan dihapus!', 'success'); 
    });
  };

  const handleSave = () => {
    let adaError = false;
    const allFormKeys = Object.keys(formData).filter(k => k !== 'isLocked');
    allFormKeys.forEach(kom => {
      const row = formData[kom];
      const col7 = (parseFloat(row.col3)||0) + (parseFloat(row.col5)||0) - (parseFloat(row.col6)||0);
      const col11 = (parseFloat(row.col8)||0) + (parseFloat(row.col9)||0) + (parseFloat(row.col10)||0);
      if (col7 > 0 && col7 !== col11) adaError = true;
    });

    const proceedSave = async () => {
      const key = `${tahun}-${semester}-${user.wilayah}`;
      await setDoc(doc(firestoreDb, "dbT", key), formData); showToast('Tersimpan!'); setView('list');
    };

if (adaError) { 
      // Memanggil pop-up khusus mode Error (parameter ke-4 diset 'true')
      showDialog(
        'Penyimpanan Dibatalkan!', 
        'Jumlah Luas Areal (Kolom 11) harus sama dengan Luas Tanaman Akhir Semester (Kolom 7) di setiap komoditas.\n\nSilakan periksa kembali angka yang berwarna merah di tabel.', 
        null, 
        true
      );
      return; 
    } else {
      proceedSave();
    }

  };

  if (view === 'list') {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-l-4 border-l-emerald-500">
          <div><h2 className="text-xl font-bold text-gray-800">Daftar Laporan Semester (SPR-TT)</h2><p className="text-gray-500">Kecamatan {user.wilayah}</p></div>
          <div className="flex flex-wrap items-center gap-3 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
            <select value={tahun} onChange={e => setTahun(e.target.value)} className="bg-white border border-gray-300 rounded px-2 py-1 text-sm font-semibold">{TAHUN_OPTIONS.map(t => <option key={t}>{t}</option>)}</select>
            <select value={semester} onChange={e => setSemester(e.target.value)} className="bg-white border border-gray-300 rounded px-2 py-1 text-sm font-semibold">{SEMESTER_OPTIONS.map(s => <option key={s}>{s}</option>)}</select>
            <button onClick={handleTambahLaporan} className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded font-medium transition-colors text-sm"><Plus className="w-4 h-4" /> Tambah</button>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm"><tr><th className="p-4 w-1/4">Tahun</th><th className="p-4 w-1/4">Semester</th><th className="p-4 w-1/4">Status</th><th className="p-4 text-right w-1/4">Aksi</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {listLaporan.map((l) => (
                  <tr key={l.key} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-800">{l.tahun}</td><td className="p-4 text-gray-600">Semester {l.semester}</td>
                    <td className="p-4">{l.isLocked ? <span className="px-2.5 py-1 rounded bg-red-100 text-red-800 text-xs font-bold"><Lock className="w-3.5 h-3.5 inline mr-1" />Terkunci</span> : <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 text-xs font-bold"><Unlock className="w-3.5 h-3.5 inline mr-1" />Terbuka</span>}</td>
                    <td className="p-4 text-right space-x-2">
                      {l.isLocked ? <button onClick={() => handleEditLaporan(l.tahun, l.semester, l.key, true)} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"><Eye className="w-4 h-4 inline mr-1"/>Lihat</button> : (
                        <><button onClick={() => handleEditLaporan(l.tahun, l.semester, l.key, false)} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-medium"><Edit className="w-4 h-4 inline mr-1"/>Edit</button>
                        <button onClick={() => handleDeleteLaporan(l.key)} className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium"><Trash2 className="w-4 h-4 inline mr-1"/>Hapus</button></>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      </div>
    );
  }

  const existingKeys = Object.keys(formData).filter(k => k !== 'isLocked');
  const rowLabelsToRender = isViewOnly ? existingKeys : Array.from(new Set([...masterData.komoditas, ...existingKeys])).sort();

  return (
    <div className="space-y-6 animate-in slide-in-from-right-8">
      <div className="bg-white p-4 rounded-xl flex justify-between items-center z-10 relative shadow-sm border border-gray-200">
        <div className="flex items-center gap-3"><button onClick={() => setView('list')} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"><ArrowLeft className="w-5 h-5" /></button><div><h2 className="text-lg font-bold uppercase text-gray-800">Laporan SPR-TT {isViewOnly && "(Baca)"}</h2></div></div>
        {!isViewOnly && <button onClick={handleSave} className="bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-bold uppercase hover:bg-emerald-800"><Save className="w-5 h-5 inline mr-2" /> Simpan</button>}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"><FormSPRTT data={formData} setData={setFormData} readOnly={isViewOnly} meta={{ prov: 'Jawa Barat', kab: 'Pangandaran', kec: user.wilayah, tahun, semester }} rowLabels={rowLabelsToRender} wujudMap={masterData.wujud} /></div>
    </div>
  );
}

function KabupatenLaporanTahunan({ db, showToast, masterData }) {
  const [mode, setMode] = useState('status'); 
  const [tahun, setTahun] = useState('2024');
  const [semester, setSemester] = useState('I');
  const [filterKec, setFilterKec] = useState('Semua Kecamatan');
  const [filterKom, setFilterKom] = useState('Semua Komoditas');
  
  const [view, setView] = useState('list');
  const [formData, setFormData] = useState({});
  const [editInfo, setEditInfo] = useState(null);

  const keysInDb = Object.keys(db).filter(k => k.startsWith(`${tahun}-${semester}-`));
  const historicalKec = keysInDb.map(k => k.split('-')[2]);
  const allAvailableKec = Array.from(new Set([...masterData.kecamatan, ...historicalKec])).sort();

  const historicalKom = new Set();
  keysInDb.forEach(k => { Object.keys(db[k]).forEach(kom => { if (kom !== 'isLocked') historicalKom.add(kom); }); });
  const allAvailableKom = Array.from(new Set([...masterData.komoditas, ...Array.from(historicalKom)])).sort();

  let rowLabels = filterKom !== 'Semua Komoditas' ? (filterKec === 'Semua Kecamatan' ? allAvailableKec : [filterKec]) : allAvailableKom;
  let rowHeaderLabel = filterKom !== 'Semua Komoditas' ? 'Kecamatan' : 'Jenis Komoditas';
  
  const toggleLock = async (key) => { await setDoc(doc(firestoreDb, "dbT", key), { ...db[key], isLocked: !db[key].isLocked }); showToast(!db[key].isLocked ? 'Terkunci!' : 'Terbuka!', 'info'); };
  const listLaporan = Object.keys(db).map(key => { const parts = key.split('-'); return { tahun: parts[0], semester: parts[1], kecamatan: parts[2], isLocked: !!db[key].isLocked, key }; }).filter(l => l.tahun === tahun && l.semester === semester).sort((a,b) => a.kecamatan.localeCompare(b.kecamatan));

  const handleEdit = (l) => {
    setEditInfo(l);
    setFormData(JSON.parse(JSON.stringify(db[l.key])));
    setView('form');
  };

  const handleSave = async () => {
    await setDoc(doc(firestoreDb, "dbT", editInfo.key), { ...formData, isLocked: db[editInfo.key].isLocked });
    showToast('Data Laporan berhasil diperbarui!', 'success');
    setView('list');
  };

  const displayData = useMemo(() => {
    if (mode !== 'semester') return {};
    const result = {};
    if (filterKom !== 'Semua Komoditas') {
      rowLabels.forEach(kec => {
        const key = `${tahun}-${semester}-${kec}`;
        const kecData = db[key] || {};
        result[kec] = kecData[filterKom] ? { ...kecData[filterKom] } : emptyRow(filterKom, masterData.wujud);
      });
    } else {
      allAvailableKom.forEach(kom => result[kom] = emptyRow(kom, masterData.wujud));
      const kecs = filterKec === 'Semua Kecamatan' ? allAvailableKec : [filterKec];
      kecs.forEach(kec => {
        const key = `${tahun}-${semester}-${kec}`;
        if (db[key]) {
          allAvailableKom.forEach(kom => {
            if(kom === 'isLocked') return;
            const row = db[key][kom]; if (!row) return;
            ['col3', 'col4', 'col5', 'col6', 'col8', 'col9', 'col10', 'col12', 'col14'].forEach(f => {
              result[kom][f] = (parseFloat(result[kom][f]) || 0) + (parseFloat(row[f]) || 0);
            });
            if (row.col15) result[kom].col15 = row.col15; 
          });
        }
      });
    }
    return result;
  }, [mode, tahun, semester, filterKec, filterKom, db, rowLabels, allAvailableKom, allAvailableKec, masterData.wujud]);

  if (view === 'form') {
    const existingKeys = Object.keys(formData).filter(k => k !== 'isLocked');
    const labelsToRender = Array.from(new Set([...masterData.komoditas, ...existingKeys])).sort();
    return (
      <div className="space-y-6 animate-in slide-in-from-right-8">
        <div className="bg-white p-4 rounded-xl flex justify-between items-center z-10 relative shadow-sm border border-gray-200">
          <div className="flex items-center gap-3"><button onClick={() => setView('list')} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"><ArrowLeft className="w-5 h-5" /></button><div><h2 className="text-lg font-bold uppercase text-gray-800">Edit Laporan SPR-TT</h2><p className="text-sm text-gray-600 font-medium">Kecamatan {editInfo?.kecamatan} • Tahun {editInfo?.tahun} • Semester {editInfo?.semester}</p></div></div>
          <button onClick={handleSave} className="bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-bold uppercase hover:bg-emerald-800 transition-colors shadow-sm tracking-wider flex items-center gap-2"><Save className="w-5 h-5" /> Simpan Perubahan</button>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"><FormSPRTT data={formData} setData={setFormData} readOnly={false} meta={{ prov: 'Jawa Barat', kab: 'Pangandaran', kec: editInfo?.kecamatan, tahun: editInfo?.tahun, semester: editInfo?.semester }} rowLabels={labelsToRender} wujudMap={masterData.wujud} /></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-emerald-700">
        <div className="flex bg-gray-100 p-1 rounded-lg w-fit mb-4">
          <button onClick={() => setMode('semester')} className={`px-4 py-2 font-bold text-sm rounded uppercase ${mode === 'semester' ? 'bg-white shadow text-emerald-800' : 'text-gray-500'}`}>Rekap Semester</button>
          <button onClick={() => setMode('status')} className={`px-4 py-2 font-bold text-sm rounded uppercase ${mode === 'status' ? 'bg-white shadow text-emerald-800' : 'text-gray-500'}`}>Status Validasi</button>
        </div>
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div><h2 className="text-lg font-black text-gray-900 uppercase tracking-wide">{mode === 'status' ? 'Status Laporan Kecamatan' : 'Rekapitulasi Laporan Semester'}</h2><p className="text-gray-600 font-medium text-sm">Tanaman Tahunan (SPR-TT) - Tingkat Kabupaten</p></div>
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
             {mode === 'semester' && <select value={filterKec} onChange={e => setFilterKec(e.target.value)} className="bg-gray-50 p-2 rounded-lg border border-gray-300 font-semibold focus:outline-none text-sm"><option>Semua Kecamatan</option>{allAvailableKec.map(k => <option key={k}>{k}</option>)}</select>}
             {mode === 'semester' && <select value={filterKom} onChange={e => setFilterKom(e.target.value)} className="bg-gray-50 p-2 rounded-lg border border-gray-300 font-semibold focus:outline-none text-sm"><option>Semua Komoditas</option>{allAvailableKom.map(k => <option key={k}>{k}</option>)}</select>}
             <div className="flex items-center gap-2">
                <select value={tahun} onChange={e => setTahun(e.target.value)} className="bg-gray-50 p-2 rounded border border-gray-300 font-semibold text-sm">{TAHUN_OPTIONS.map(t => <option key={t}>{t}</option>)}</select>
                <select value={semester} onChange={e => setSemester(e.target.value)} className="bg-gray-50 p-2 rounded border border-gray-300 font-semibold text-sm">{SEMESTER_OPTIONS.map(s => <option key={s}>{s}</option>)}</select>
             </div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {mode === 'semester' ? (
          <FormSPRTT data={displayData} setData={() => {}} readOnly={true} meta={{ prov: 'Jawa Barat', kab: 'Pangandaran', kec: filterKec, tahun, semester, isRekap: true }} rowLabels={rowLabels} rowHeaderLabel={rowHeaderLabel} wujudMap={masterData.wujud} />
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 border-b border-gray-200 text-gray-700 text-sm uppercase"><tr><th className="p-4 font-bold">Kecamatan</th><th className="p-4 font-bold">Periode</th><th className="p-4 font-bold">Status</th><th className="p-4 text-right font-bold">Aksi Validasi</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {listLaporan.length === 0 ? <tr><td colSpan="4" className="p-8 text-center text-gray-500 font-medium">Belum ada laporan masuk.</td></tr> : listLaporan.map((l) => (
                <tr key={l.key} className="hover:bg-gray-50">
                  <td className="p-4 font-bold text-gray-900">{l.kecamatan}</td><td className="p-4 text-gray-700 font-medium">Thn {l.tahun} - Sem {l.semester}</td>
                  <td className="p-4">{l.isLocked ? <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 uppercase"><Lock className="w-3.5 h-3.5 inline mr-1" /> Terkunci</span> : <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 uppercase"><Unlock className="w-3.5 h-3.5 inline mr-1" /> Terbuka</span>}</td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => handleEdit(l)} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-bold uppercase transition-colors"><Edit className="w-4 h-4 inline mr-1"/>Edit</button>
                    {l.isLocked ? <button onClick={() => toggleLock(l.key)} className="px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-bold uppercase"><Unlock className="w-4 h-4 inline mr-1"/>Buka Status</button> : <button onClick={() => toggleLock(l.key)} className="px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-sm font-bold uppercase hover:bg-emerald-800"><Lock className="w-4 h-4 inline mr-1"/>Tetapkan</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function KecamatanAtapTahunan({ user, db, atap, showToast, showDialog, titleType, masterData }) {
  const [view, setView] = useState('list');
  const [tahun, setTahun] = useState('2024');
  const [formData, setFormData] = useState({});

  const listAtap = Object.keys(atap).filter(key => key.endsWith(`-${user.wilayah}`)).map(key => ({ tahun: key.split('-')[0], key, isLocked: !!atap[key].isLocked })).sort((a,b)=>b.tahun.localeCompare(a.tahun));

  const handleBuatAtap = () => {
    const key = `${tahun}-${user.wilayah}`;
    if (atap[key]) { showToast(`${titleType} Tahun ini sudah ada!`, 'error'); return; }
    
    const s1Locked = db[`${tahun}-I-${user.wilayah}`]?.isLocked;
    const s2Locked = db[`${tahun}-II-${user.wilayah}`]?.isLocked;

    const proceedForm = () => {
        const autoCalcData = titleType === 'ASEM' ? calculateAsemTahunan(tahun, user.wilayah, db, masterData.komoditas) : calculateAtapTahunan(tahun, user.wilayah, db, masterData.komoditas);
        const initData = {};
        Object.keys(autoCalcData).forEach(kom => {
           initData[kom] = { tbm: autoCalcData[kom].tbm, tm: autoCalcData[kom].tm, ttm: autoCalcData[kom].ttm, produksi: autoCalcData[kom].produksi, petani: autoCalcData[kom].petani };
        });
        setFormData(initData); setView('form');
    };

    if (titleType === 'ATAP') {
        if (!s1Locked || !s2Locked) {
            showDialog('Peringatan Data Belum Lengkap', `Data Laporan Semester I dan II pada tahun ${tahun} belum lengkap atau belum divalidasi (dikunci) oleh Kabupaten.\n\nApakah Anda tetap ingin melanjutkan pembuatan ATAP dengan data yang ada saat ini?`, proceedForm);
        } else { proceedForm(); }
    } else {
        if (!s1Locked) {
            showDialog('Peringatan Data Belum Lengkap', `Data Laporan Semester I pada tahun ${tahun} belum divalidasi (dikunci) oleh Kabupaten.\n\nASEM menggunakan Semester 1 sebagai dasar. Apakah Anda tetap ingin melanjutkan pembuatan ASEM?`, proceedForm);
        } else { proceedForm(); }
    }
  };

  const handleEdit = (key) => { setTahun(key.split('-')[0]); setFormData(JSON.parse(JSON.stringify(atap[key].data))); setView('form'); };
  const handleDelete = (key) => { 
    showDialog('Konfirmasi Hapus', `Hapus Data ${titleType} ini?`, async () => {
      await deleteDoc(doc(firestoreDb, titleType === 'ASEM' ? 'asemT' : 'atapT', key)); showToast('Dihapus', 'success'); 
    });
  };
  const handleSave = async () => { 
      await setDoc(doc(firestoreDb, titleType === 'ASEM' ? 'asemT' : 'atapT', `${tahun}-${user.wilayah}`), { isLocked: false, data: formData }); 
      showToast(`${titleType} Tersimpan!`); setView('list'); 
  };

  if (view === 'list') {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-l-4 border-l-emerald-500">
          <div><h2 className="text-xl font-bold text-gray-800">Angka {titleType === 'ASEM' ? 'Sementara (ASEM)' : 'Tetap (ATAP)'} Tahunan</h2><p className="text-gray-500">Kecamatan {user.wilayah}</p></div>
          <div className="flex items-center gap-3 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
             <select value={tahun} onChange={e => setTahun(e.target.value)} className="bg-white border border-gray-300 rounded px-2 py-1 text-sm font-semibold focus:outline-none">{TAHUN_OPTIONS.map(t => <option key={t}>{t}</option>)}</select>
             <button onClick={handleBuatAtap} className="px-4 py-1.5 bg-emerald-600 text-white rounded font-bold text-sm flex items-center gap-1.5 hover:bg-emerald-700 transition-colors"><Plus className="w-4 h-4"/> Buat {titleType}</button>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600"><tr><th className="p-4">Tahun {titleType}</th><th className="p-4">Status Validasi</th><th className="p-4 text-right">Aksi</th></tr></thead>
            <tbody>
              {listAtap.length === 0 ? <tr><td colSpan="3" className="p-12 text-center text-gray-400">Belum ada data {titleType}</td></tr> : listAtap.map(a => (
                <tr key={a.key} className="border-b border-gray-100 hover:bg-gray-50">
                   <td className="p-4 font-bold text-gray-800">{a.tahun}</td>
                   <td className="p-4">{a.isLocked ? <span className="text-red-800 bg-red-100 px-3 py-1 rounded-full text-xs font-bold">Ditetapkan Kabupaten</span> : <span className="text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full text-xs font-bold">Terbuka</span>}</td>
                   <td className="p-4 text-right">
                      {a.isLocked ? <button onClick={() => handleEdit(a.key)} className="px-3 py-1.5 bg-gray-100 rounded text-sm font-bold hover:bg-gray-200"><Eye className="w-4 h-4 inline mr-1" />Lihat</button> :
                      <><button onClick={() => handleEdit(a.key)} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded text-sm font-bold mr-2 hover:bg-emerald-100"><Edit className="w-4 h-4 inline mr-1" />Edit</button><button onClick={() => handleDelete(a.key)} className="px-3 py-1.5 bg-red-50 text-red-700 rounded text-sm font-bold hover:bg-red-100"><Trash2 className="w-4 h-4 inline mr-1" />Hapus</button></>}
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const existingKeys = Object.keys(formData).filter(k => k !== 'isLocked');
  const labelsToRender = atap[`${tahun}-${user.wilayah}`]?.isLocked ? existingKeys : Array.from(new Set([...masterData.komoditas, ...existingKeys])).sort();

  return (
    <div className="space-y-6 animate-in slide-in-from-right-8">
      <div className="bg-white p-4 rounded-xl flex justify-between items-center z-10 relative shadow-sm border border-gray-200">
         <div className="flex items-center gap-3"><button onClick={()=>setView('list')} className="p-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"><ArrowLeft className="w-5 h-5"/></button><div><h2 className="font-bold text-lg uppercase text-gray-800">Form {titleType} Tahunan {atap[`${tahun}-${user.wilayah}`]?.isLocked && "(Mode Baca)"}</h2><p className="text-sm text-gray-600 font-medium">Kecamatan {user.wilayah} • Tahun {tahun}</p></div></div>
         {!atap[`${tahun}-${user.wilayah}`]?.isLocked && <button onClick={handleSave} className="bg-emerald-700 hover:bg-emerald-800 transition-colors text-white px-6 py-2.5 rounded-lg font-bold shadow-sm uppercase tracking-wider flex items-center gap-2"><Save className="w-5 h-5"/> Simpan {titleType}</button>}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"><FormATAPTahunan data={formData} setData={setFormData} readOnly={atap[`${tahun}-${user.wilayah}`]?.isLocked} meta={{prov: 'Jawa Barat', kab: 'Pangandaran', kec: user.wilayah, tahun, titleType}} rowLabels={labelsToRender} /></div>
    </div>
  );
}

function KabupatenAtapTahunan({ atap, showToast, titleType, masterData }) {
  const [mode, setMode] = useState('status'); 
  const [tahunAwal, setTahunAwal] = useState('2021');
  const [tahunAkhir, setTahunAkhir] = useState('2024');
  const [filterKec, setFilterKec] = useState('Semua Kecamatan');
  const [filterKom, setFilterKom] = useState('Semua Komoditas');
  const [tahunATAPStatus, setTahunATAPStatus] = useState('2024');

  const [view, setView] = useState('list');
  const [formData, setFormData] = useState({});
  const [editInfo, setEditInfo] = useState(null);

  const listAtap = Object.keys(atap).map(k => ({ tahun: k.split('-')[0], kecamatan: k.split('-')[1], isLocked: !!atap[k].isLocked, key: k }))
                 .filter(l => l.tahun === tahunATAPStatus).sort((a,b) => a.kecamatan.localeCompare(b.kecamatan));
                 
  const toggleLock = async (key) => { await setDoc(doc(firestoreDb, titleType === 'ASEM' ? 'asemT' : 'atapT', key), { ...atap[key], isLocked: !atap[key].isLocked }); showToast(!atap[key].isLocked ? `${titleType} Ditetapkan (Terkunci)!` : `${titleType} Dibuka!`, 'info'); };

  const handleEdit = (l) => {
    setEditInfo(l);
    setFormData(JSON.parse(JSON.stringify(atap[l.key].data)));
    setView('form');
  };

  const handleSave = async () => {
    await setDoc(doc(firestoreDb, titleType === 'ASEM' ? 'asemT' : 'atapT', editInfo.key), { ...atap[editInfo.key], data: formData });
    showToast(`Data ${titleType} berhasil diperbarui!`, 'success');
    setView('list');
  };

  const compYears = useMemo(() => {
    let y1 = parseInt(tahunAwal), y2 = parseInt(tahunAkhir); if (y1>y2) {let t=y1;y1=y2;y2=t;} return Array.from({length: y2-y1+1}, (_,i) => (y1+i).toString());
  }, [tahunAwal, tahunAkhir]);

  const historicalKec = Object.keys(atap).filter(k => compYears.some(y => k.startsWith(`${y}-`))).map(k => k.split('-')[1]);
  const allAvailableKec = Array.from(new Set([...masterData.kecamatan, ...historicalKec])).sort();

  const historicalKom = new Set();
  Object.keys(atap).forEach(k => {
     if(compYears.some(y => k.startsWith(`${y}-`)) && atap[k].isLocked) { Object.keys(atap[k].data).forEach(kom => historicalKom.add(kom)); }
  });
  const allAvailableKom = Array.from(new Set([...masterData.komoditas, ...Array.from(historicalKom)])).sort();

  const rowLabels = filterKom !== 'Semua Komoditas' ? (filterKec === 'Semua Kecamatan' ? allAvailableKec : [filterKec]) : allAvailableKom;
  const rowHeaderLabel = filterKom !== 'Semua Komoditas' ? 'Kecamatan' : 'Jenis Komoditas';

  const compData = useMemo(() => {
     const res = {};
     rowLabels.forEach(label => { res[label] = {}; compYears.forEach(y => { res[label][y] = { tbm:0, tm:0, ttm:0, jumlah:0, produksi:0, petani:0, produktivitas:0 }; }); });
     const kecs = filterKec === 'Semua Kecamatan' ? allAvailableKec : [filterKec];
     const koms = filterKom === 'Semua Komoditas' ? allAvailableKom : [filterKom];

     compYears.forEach(year => {
        kecs.forEach(kec => {
           const a = atap[`${year}-${kec}`];
           if (a && a.isLocked) { 
               koms.forEach(kom => {
                  const r = a.data[kom]; if(!r) return;
                  const targetLabel = filterKom === 'Semua Komoditas' ? kom : kec;
                  res[targetLabel][year].tbm += parseFloat(r.tbm)||0; res[targetLabel][year].tm += parseFloat(r.tm)||0; res[targetLabel][year].ttm += parseFloat(r.ttm)||0;
                  res[targetLabel][year].jumlah += (parseFloat(r.tbm)||0)+(parseFloat(r.tm)||0)+(parseFloat(r.ttm)||0);
                  res[targetLabel][year].produksi += parseFloat(r.produksi)||0; res[targetLabel][year].petani += parseFloat(r.petani)||0;
               });
           }
        });
        rowLabels.forEach(label => { res[label][year].produktivitas = res[label][year].tm > 0 ? res[label][year].produksi / res[label][year].tm : 0; });
     });
     return res;
  }, [atap, compYears, filterKec, filterKom, rowLabels, allAvailableKec, allAvailableKom]);

  if (view === 'form') {
    const existingKeys = Object.keys(formData);
    const labelsToRender = Array.from(new Set([...masterData.komoditas, ...existingKeys])).sort();
    return (
      <div className="space-y-6 animate-in slide-in-from-right-8">
        <div className="bg-white p-4 rounded-xl flex justify-between items-center z-10 relative shadow-sm border border-gray-200">
          <div className="flex items-center gap-3"><button onClick={() => setView('list')} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"><ArrowLeft className="w-5 h-5" /></button><div><h2 className="text-lg font-bold uppercase text-gray-800">Edit {titleType} Tahunan</h2><p className="text-sm text-gray-600 font-medium">Kecamatan {editInfo?.kecamatan} • Tahun {editInfo?.tahun}</p></div></div>
          <button onClick={handleSave} className="bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-bold uppercase hover:bg-emerald-800 transition-colors shadow-sm tracking-wider flex items-center gap-2"><Save className="w-5 h-5" /> Simpan Perubahan</button>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"><FormATAPTahunan data={formData} setData={setFormData} readOnly={false} meta={{ prov: 'Jawa Barat', kab: 'Pangandaran', kec: editInfo?.kecamatan, tahun: editInfo?.tahun, titleType }} rowLabels={labelsToRender} /></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in">
       <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-emerald-700">
         <div className="flex bg-gray-100 p-1 rounded-lg w-fit mb-4"><button onClick={()=>setMode('status')} className={`px-4 py-2 font-bold text-sm rounded uppercase ${mode==='status'?'bg-white shadow text-emerald-800':'text-gray-500'}`}>Status Validasi</button><button onClick={()=>setMode('rekap')} className={`px-4 py-2 font-bold text-sm rounded uppercase ${mode==='rekap'?'bg-white shadow text-emerald-800':'text-gray-500'}`}>Rekapitulasi {titleType}</button></div>
         <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div><h2 className="text-lg font-black text-gray-900 uppercase tracking-wide">{mode === 'status' ? `Status Laporan ${titleType} Kecamatan` : `Rekapitulasi Angka ${titleType==='ASEM'?'Sementara':'Tetap'} Tahunan`}</h2><p className="text-gray-600 font-medium text-sm">Tingkat Kabupaten</p></div>
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
             {mode === 'rekap' && <select value={filterKec} onChange={e=>setFilterKec(e.target.value)} className="p-2 bg-gray-50 border border-gray-300 rounded font-semibold text-sm"><option>Semua Kecamatan</option>{allAvailableKec.map(k=><option key={k}>{k}</option>)}</select>}
             {mode === 'rekap' && <select value={filterKom} onChange={e=>setFilterKom(e.target.value)} className="p-2 bg-gray-50 border border-gray-300 rounded font-semibold text-sm"><option>Semua Komoditas</option>{allAvailableKom.map(k=><option key={k}>{k}</option>)}</select>}
             {mode === 'rekap' ? (
                <div className="flex items-center gap-2"><select value={tahunAwal} onChange={e=>setTahunAwal(e.target.value)} className="p-2 bg-gray-50 border border-gray-300 rounded font-semibold text-sm">{TAHUN_OPTIONS.map(t=><option key={t}>{t}</option>)}</select><span className="font-bold">-</span><select value={tahunAkhir} onChange={e=>setTahunAkhir(e.target.value)} className="p-2 bg-gray-50 border border-gray-300 rounded font-semibold text-sm">{TAHUN_OPTIONS.map(t=><option key={t}>{t}</option>)}</select></div>
             ) : (
                <div className="flex items-center gap-2"><span className="text-sm font-bold text-gray-700">Tahun {titleType}:</span><select value={tahunATAPStatus} onChange={e=>setTahunATAPStatus(e.target.value)} className="p-2 bg-gray-50 border border-gray-300 rounded font-semibold text-sm">{TAHUN_OPTIONS.map(t=><option key={t}>{t}</option>)}</select></div>
             )}
          </div>
         </div>
       </div>

       <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {mode === 'status' ? (
             <table className="w-full text-left border-collapse"><thead className="bg-gray-100 text-sm uppercase text-gray-700"><tr><th className="p-4 font-bold">Kecamatan</th><th className="p-4 font-bold">Tahun {titleType}</th><th className="p-4 font-bold">Status Validasi</th><th className="p-4 text-right font-bold">Aksi Validasi</th></tr></thead>
             <tbody className="divide-y divide-gray-100">
               {listAtap.length === 0 ? <tr><td colSpan="4" className="p-12 text-center text-gray-400 font-medium">Belum ada pengajuan {titleType} pada tahun ini.</td></tr> : listAtap.map(l => (
                 <tr key={l.key} className="hover:bg-gray-50">
                    <td className="p-4 font-bold text-gray-900">{l.kecamatan}</td><td className="p-4 text-gray-700 font-medium">{l.tahun}</td>
                    <td className="p-4">{l.isLocked ? <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"><Lock className="w-3.5 h-3.5 inline mr-1" />Ditetapkan</span> : <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"><Unlock className="w-3.5 h-3.5 inline mr-1" />Menunggu Validasi</span>}</td>
                    <td className="p-4 text-right space-x-2">
                       <button onClick={() => handleEdit(l)} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-bold uppercase transition-colors"><Edit className="w-4 h-4 inline mr-1"/>Edit</button>
                       {l.isLocked ? <button onClick={()=>toggleLock(l.key)} className="px-3 py-1.5 bg-gray-100 text-gray-700 font-bold text-sm rounded-lg uppercase transition-colors"><Unlock className="w-4 h-4 inline mr-1"/> Buka Status</button> : <button onClick={()=>toggleLock(l.key)} className="px-3 py-1.5 bg-emerald-700 text-white font-bold text-sm rounded-lg uppercase transition-colors hover:bg-emerald-800"><Lock className="w-4 h-4 inline mr-1"/> Tetapkan</button>}
                    </td>
                 </tr>
               ))}
             </tbody></table>
          ) : ( <TablePerbandinganTahun data={compData} years={compYears} rowLabels={rowLabels} rowHeaderLabel={rowHeaderLabel} meta={{prov: 'Jawa Barat', kab: 'Pangandaran', kom: filterKom, isAtapOnly: true, titleType}} /> )}
       </div>
    </div>
  );
}

// ========================================================================================
// === MODUL SEMUSIM
// ========================================================================================
function KecamatanLaporanSemusim({ user, db, showToast, showDialog, masterData }) {
  const [view, setView] = useState('list'); 
  const [tahun, setTahun] = useState('2024');
  const [triwulan, setTriwulan] = useState('I');
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [formData, setFormData] = useState({});
  
  const listLaporan = Object.keys(db).filter(key => key.endsWith(`-${user.wilayah}`)).map(key => {
      const parts = key.split('-'); return { tahun: parts[0], triwulan: parts[1], key, isLocked: !!db[key].isLocked };
  }).sort((a, b) => b.tahun.localeCompare(a.tahun) || b.triwulan.localeCompare(a.triwulan));

  const handleTambahLaporan = () => {
    const key = `${tahun}-${triwulan}-${user.wilayah}`;
    if (db[key]) { showToast(`Laporan sudah ada!`, 'error'); return; }
    
    const initData = { isLocked: false };
    let prevTahun = tahun, prevTriwulan = triwulan === 'I' ? 'IV' : (triwulan === 'II' ? 'I' : triwulan === 'III' ? 'II' : 'III');
    if (triwulan === 'I') prevTahun = (parseInt(tahun) - 1).toString();
    const prevData = db[`${prevTahun}-${prevTriwulan}-${user.wilayah}`];

    masterData.komoditasSemusim.forEach(k => {
      initData[k] = emptyRowSemusim(k, masterData.wujudSemusim);
      if (prevData && prevData[k]) {
        const pCol6 = (parseFloat(prevData[k].col3)||0) + (parseFloat(prevData[k].col4)||0) - (parseFloat(prevData[k].col5)||0);
        if (pCol6 > 0) initData[k].col3 = pCol6;
      }
    });

    setFormData(initData); setIsViewOnly(false); setView('form');
  };

  const handleEditLaporan = (t, tw, key, viewOnly = false) => { setTahun(t); setTriwulan(tw); setFormData(JSON.parse(JSON.stringify(db[key]))); setIsViewOnly(viewOnly); setView('form'); };
  const handleDeleteLaporan = (key) => { 
    showDialog('Konfirmasi Hapus', 'Hapus laporan ini? Data tidak dapat dikembalikan.', async () => {
       await deleteDoc(doc(firestoreDb, "dbS", key)); showToast('Dihapus!', 'success'); 
    });
  };
  const handleSave = async () => { await setDoc(doc(firestoreDb, "dbS", `${tahun}-${triwulan}-${user.wilayah}`), formData); showToast('Tersimpan!'); setView('list'); };

  if (view === 'list') {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-l-4 border-l-blue-500">
          <div><h2 className="text-xl font-bold text-gray-800">Daftar Laporan Triwulan (SPR-TS)</h2><p className="text-gray-500">Kecamatan {user.wilayah}</p></div>
          <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
            <select value={tahun} onChange={e => setTahun(e.target.value)} className="bg-white border border-gray-300 rounded px-2 py-1 text-sm font-semibold focus:outline-none">{TAHUN_OPTIONS.map(t => <option key={t}>{t}</option>)}</select>
            <select value={triwulan} onChange={e => setTriwulan(e.target.value)} className="bg-white border border-gray-300 rounded px-2 py-1 text-sm font-semibold focus:outline-none">{TRIWULAN_OPTIONS.map(s => <option key={`TW-${s}`} value={s}>TW {s}</option>)}</select>
            <button onClick={handleTambahLaporan} className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded font-medium text-sm"><Plus className="w-4 h-4" /> Tambah</button>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200 text-sm"><tr><th className="p-4 w-1/4">Tahun</th><th className="p-4 w-1/4">Triwulan</th><th className="p-4 w-1/4">Status</th><th className="p-4 text-right w-1/4">Aksi</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {listLaporan.map((l) => (
                  <tr key={l.key} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-800">{l.tahun}</td><td className="p-4 text-gray-600">Triwulan {l.triwulan}</td>
                    <td className="p-4">{l.isLocked ? <span className="px-2.5 py-1 rounded bg-red-100 text-red-800 text-xs font-bold"><Lock className="w-3.5 h-3.5 inline mr-1" />Terkunci</span> : <span className="px-2.5 py-1 rounded bg-blue-100 text-blue-800 text-xs font-bold"><Unlock className="w-3.5 h-3.5 inline mr-1" />Terbuka</span>}</td>
                    <td className="p-4 text-right space-x-2">
                      {l.isLocked ? <button onClick={() => handleEditLaporan(l.tahun, l.triwulan, l.key, true)} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"><Eye className="w-4 h-4 inline mr-1"/>Lihat</button> : (
                        <><button onClick={() => handleEditLaporan(l.tahun, l.triwulan, l.key, false)} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100"><Edit className="w-4 h-4 inline mr-1"/>Edit</button>
                        <button onClick={() => handleDeleteLaporan(l.key)} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100"><Trash2 className="w-4 h-4 inline mr-1"/>Hapus</button></>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      </div>
    );
  }

  const existingKeys = Object.keys(formData).filter(k => k !== 'isLocked');
  const rowLabelsToRender = isViewOnly ? existingKeys : Array.from(new Set([...masterData.komoditasSemusim, ...existingKeys])).sort();

  return (
    <div className="space-y-6 animate-in slide-in-from-right-8">
      <div className="bg-white p-4 rounded-xl flex justify-between items-center z-10 relative shadow-sm border border-gray-200">
        <div className="flex items-center gap-3"><button onClick={() => setView('list')} className="p-2 bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button><div><h2 className="text-lg font-bold uppercase text-gray-800">Laporan SPR-TS {isViewOnly && "(Baca)"}</h2></div></div>{!isViewOnly && <button onClick={handleSave} className="bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold uppercase"><Save className="w-5 h-5 inline mr-2"/>Simpan</button>}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"><FormSPRTS data={formData} setData={setFormData} readOnly={isViewOnly} meta={{ prov: 'Jawa Barat', kab: 'Pangandaran', kec: user.wilayah, tahun, triwulan }} rowLabels={rowLabelsToRender} wujudMap={masterData.wujudSemusim} /></div>
    </div>
  );
}

function KabupatenLaporanSemusim({ db, showToast, masterData }) {
  const [mode, setMode] = useState('triwulan'); 
  const [tahun, setTahun] = useState('2024');
  const [triwulan, setTriwulan] = useState('I');
  const [filterKec, setFilterKec] = useState('Semua Kecamatan');
  const [filterKom, setFilterKom] = useState('Semua Komoditas');
  
  const [view, setView] = useState('list');
  const [formData, setFormData] = useState({});
  const [editInfo, setEditInfo] = useState(null);

  const keysInDb = Object.keys(db).filter(k => k.startsWith(`${tahun}-${triwulan}-`));
  const historicalKec = keysInDb.map(k => k.split('-')[2]);
  const allAvailableKec = Array.from(new Set([...masterData.kecamatan, ...historicalKec])).sort();

  const historicalKom = new Set();
  keysInDb.forEach(k => { Object.keys(db[k]).forEach(kom => { if (kom !== 'isLocked') historicalKom.add(kom); }); });
  const allAvailableKom = Array.from(new Set([...masterData.komoditasSemusim, ...Array.from(historicalKom)])).sort();

  let rowLabels = filterKom !== 'Semua Komoditas' ? (filterKec === 'Semua Kecamatan' ? allAvailableKec : [filterKec]) : allAvailableKom;
  let rowHeaderLabel = filterKom !== 'Semua Komoditas' ? 'Kecamatan' : 'Jenis Komoditas';
  
  const toggleLock = async (key) => { await setDoc(doc(firestoreDb, "dbS", key), { ...db[key], isLocked: !db[key].isLocked }); showToast(!db[key].isLocked ? 'Terkunci!' : 'Terbuka!', 'info'); };
  const listLaporan = Object.keys(db).map(key => { const parts = key.split('-'); return { tahun: parts[0], triwulan: parts[1], kecamatan: parts[2], isLocked: !!db[key].isLocked, key }; }).filter(l => l.tahun === tahun && l.triwulan === triwulan).sort((a,b) => a.kecamatan.localeCompare(b.kecamatan));

  const handleEdit = (l) => {
    setEditInfo(l);
    setFormData(JSON.parse(JSON.stringify(db[l.key])));
    setView('form');
  };

  const handleSave = async () => {
    await setDoc(doc(firestoreDb, "dbS", editInfo.key), { ...formData, isLocked: db[editInfo.key].isLocked });
    showToast('Data Laporan berhasil diperbarui!', 'success');
    setView('list');
  };

  const displayData = useMemo(() => {
    if (mode !== 'triwulan') return {};
    const result = {};
    if (filterKom !== 'Semua Komoditas') {
      rowLabels.forEach(kec => {
        const key = `${tahun}-${triwulan}-${kec}`;
        const kecData = db[key] || {};
        result[kec] = kecData[filterKom] ? { ...kecData[filterKom] } : emptyRowSemusim(filterKom, masterData.wujudSemusim);
      });
    } else {
      allAvailableKom.forEach(kom => result[kom] = emptyRowSemusim(kom, masterData.wujudSemusim));
      const kecs = filterKec === 'Semua Kecamatan' ? allAvailableKec : [filterKec];
      kecs.forEach(kec => {
        const key = `${tahun}-${triwulan}-${kec}`;
        if (db[key]) {
          allAvailableKom.forEach(kom => {
            if(kom === 'isLocked') return;
            const row = db[key][kom]; if (!row) return;
            ['col3', 'col4', 'col5', 'col7', 'col8', 'col9', 'col11'].forEach(f => {
              result[kom][f] = (parseFloat(result[kom][f]) || 0) + (parseFloat(row[f]) || 0);
            });
            if (row.col12) result[kom].col12 = row.col12; 
          });
        }
      });
    }
    return result;
  }, [mode, tahun, triwulan, filterKec, filterKom, db, rowLabels, allAvailableKom, allAvailableKec, masterData.wujudSemusim]);

  if (view === 'form') {
    const existingKeys = Object.keys(formData).filter(k => k !== 'isLocked');
    const labelsToRender = Array.from(new Set([...masterData.komoditasSemusim, ...existingKeys])).sort();
    return (
      <div className="space-y-6 animate-in slide-in-from-right-8">
        <div className="bg-white p-4 rounded-xl flex justify-between items-center z-10 relative shadow-sm border border-gray-200">
          <div className="flex items-center gap-3"><button onClick={() => setView('list')} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"><ArrowLeft className="w-5 h-5" /></button><div><h2 className="text-lg font-bold uppercase text-gray-800">Edit Laporan SPR-TS</h2><p className="text-sm text-gray-600 font-medium">Kecamatan {editInfo?.kecamatan} • Tahun {editInfo?.tahun} • Triwulan {editInfo?.triwulan}</p></div></div>
          <button onClick={handleSave} className="bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold uppercase hover:bg-blue-800 transition-colors shadow-sm tracking-wider flex items-center gap-2"><Save className="w-5 h-5" /> Simpan Perubahan</button>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"><FormSPRTS data={formData} setData={setFormData} readOnly={false} meta={{ prov: 'Jawa Barat', kab: 'Pangandaran', kec: editInfo?.kecamatan, tahun: editInfo?.tahun, triwulan: editInfo?.triwulan, isRekap: false }} rowLabels={labelsToRender} wujudMap={masterData.wujudSemusim} /></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-blue-700">
        <div className="flex bg-gray-100 p-1 rounded-lg w-fit mb-4">
          <button onClick={() => setMode('triwulan')} className={`px-4 py-2 font-bold text-sm rounded uppercase ${mode === 'triwulan' ? 'bg-white shadow text-blue-800' : 'text-gray-500'}`}>Rekap Triwulan</button>
          <button onClick={() => setMode('status')} className={`px-4 py-2 font-bold text-sm rounded uppercase ${mode === 'status' ? 'bg-white shadow text-blue-800' : 'text-gray-500'}`}>Status Validasi</button>
        </div>
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div><h2 className="text-lg font-black text-gray-900 uppercase tracking-wide">{mode === 'status' ? 'Status Laporan Kecamatan' : 'Rekapitulasi Laporan Triwulan'}</h2><p className="text-gray-600 text-sm">Tanaman Semusim (SPR-TS) - Tingkat Kabupaten</p></div>
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
             {mode === 'triwulan' && <select value={filterKec} onChange={e => setFilterKec(e.target.value)} className="bg-gray-50 p-2 rounded-lg border border-gray-300 font-semibold focus:outline-none text-sm"><option>Semua Kecamatan</option>{allAvailableKec.map(k => <option key={k}>{k}</option>)}</select>}
             {mode === 'triwulan' && <select value={filterKom} onChange={e => setFilterKom(e.target.value)} className="bg-gray-50 p-2 rounded-lg border border-gray-300 font-semibold focus:outline-none text-sm"><option>Semua Komoditas</option>{allAvailableKom.map(k => <option key={k}>{k}</option>)}</select>}
             <div className="flex items-center gap-2">
                <select value={tahun} onChange={e => setTahun(e.target.value)} className="bg-gray-50 p-2 rounded border border-gray-300 font-semibold text-sm">{TAHUN_OPTIONS.map(t => <option key={t}>{t}</option>)}</select>
                <select value={triwulan} onChange={e => setTriwulan(e.target.value)} className="bg-gray-50 p-2 rounded border border-gray-300 font-semibold text-sm">{TRIWULAN_OPTIONS.map(s => <option key={`TW-${s}`} value={s}>TW {s}</option>)}</select>
             </div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {mode === 'triwulan' ? (
          <FormSPRTS data={displayData} setData={() => {}} readOnly={true} meta={{ prov: 'Jawa Barat', kab: 'Pangandaran', kec: filterKec, tahun, triwulan, isRekap: true }} rowLabels={rowLabels} rowHeaderLabel={rowHeaderLabel} wujudMap={masterData.wujudSemusim} />
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 border-b border-gray-200 text-gray-700 text-sm uppercase"><tr><th className="p-4 font-bold">Kecamatan</th><th className="p-4 font-bold">Periode</th><th className="p-4 font-bold">Status</th><th className="p-4 text-right font-bold">Aksi Validasi</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {listLaporan.length === 0 ? <tr><td colSpan="4" className="p-8 text-center text-gray-500 font-medium">Belum ada laporan masuk.</td></tr> : listLaporan.map((l) => (
                <tr key={l.key} className="hover:bg-gray-50">
                  <td className="p-4 font-bold text-gray-900">{l.kecamatan}</td><td className="p-4 text-gray-700 font-medium">Thn {l.tahun} - TW {l.triwulan}</td>
                  <td className="p-4">{l.isLocked ? <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 uppercase"><Lock className="w-3.5 h-3.5 inline mr-1" /> Terkunci</span> : <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 uppercase"><Unlock className="w-3.5 h-3.5 inline mr-1" /> Terbuka</span>}</td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => handleEdit(l)} className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-bold uppercase transition-colors"><Edit className="w-4 h-4 inline mr-1"/>Edit</button>
                    {l.isLocked ? <button onClick={() => toggleLock(l.key)} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold uppercase hover:bg-gray-200"><Unlock className="w-4 h-4 inline mr-1"/>Buka Status</button> : <button onClick={() => toggleLock(l.key)} className="px-3 py-1.5 bg-blue-700 text-white rounded-lg text-sm font-bold uppercase hover:bg-blue-800"><Lock className="w-4 h-4 inline mr-1"/>Tetapkan</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function KecamatanAtapSemusim({ user, dbSemusim, atap, showToast, showDialog, titleType, masterData }) {
  const [view, setView] = useState('list');
  const [tahun, setTahun] = useState('2024');
  const [formData, setFormData] = useState({});

  const listAtap = Object.keys(atap).filter(key => key.endsWith(`-${user.wilayah}`)).map(key => ({ tahun: key.split('-')[0], key, isLocked: !!atap[key].isLocked })).sort((a,b)=>b.tahun.localeCompare(a.tahun));

  const handleBuatAtap = () => {
    const key = `${tahun}-${user.wilayah}`;
    if (atap[key]) { showToast(`${titleType} Tahun ini sudah ada!`, 'error'); return; }

    const t1Locked = dbSemusim[`${tahun}-I-${user.wilayah}`]?.isLocked;
    const t2Locked = dbSemusim[`${tahun}-II-${user.wilayah}`]?.isLocked;
    const t3Locked = dbSemusim[`${tahun}-III-${user.wilayah}`]?.isLocked;
    const t4Locked = dbSemusim[`${tahun}-IV-${user.wilayah}`]?.isLocked;

    const proceedForm = () => {
        const autoCalcData = titleType === 'ASEM' ? calculateAsemSemusim(tahun, user.wilayah, dbSemusim, masterData.komoditasSemusim) : calculateAtapSemusim(tahun, user.wilayah, dbSemusim, masterData.komoditasSemusim);
        const initData = {};
        Object.keys(autoCalcData).forEach(kom => {
           initData[kom] = {
               luas: autoCalcData[kom].luas, panen: autoCalcData[kom].panen,
               produksi: autoCalcData[kom].produksi, petani: autoCalcData[kom].petani
           };
        });
        setFormData(initData); setView('form');
    };

    if (titleType === 'ATAP') {
        if (!t1Locked || !t2Locked || !t3Locked || !t4Locked) {
            showDialog('Peringatan Data Belum Lengkap', `Data Laporan Triwulan I, II, III, dan IV pada tahun ${tahun} belum lengkap atau belum divalidasi (dikunci) oleh Kabupaten.\n\nApakah Anda tetap ingin melanjutkan pembuatan ATAP dengan data yang ada saat ini?`, proceedForm);
        } else { proceedForm(); }
    } else {
        if (!t1Locked) {
            showDialog('Peringatan Data Belum Lengkap', `Data Laporan Triwulan I pada tahun ${tahun} belum divalidasi (dikunci) oleh Kabupaten.\n\nASEM membutuhkan data S1/T1 sebagai dasar. Apakah Anda tetap ingin melanjutkan pembuatan ASEM dengan data saat ini?`, proceedForm);
        } else { proceedForm(); }
    }
  };

  const handleEdit = (key) => { setTahun(key.split('-')[0]); setFormData(JSON.parse(JSON.stringify(atap[key].data))); setView('form'); };
  const handleDelete = (key) => { 
      showDialog('Konfirmasi Hapus', `Hapus Data ${titleType} ini?`, async () => {
          await deleteDoc(doc(firestoreDb, titleType === 'ASEM' ? 'asemS' : 'atapS', key)); showToast('Dihapus', 'success'); 
      });
  };
  const handleSave = async () => { await setDoc(doc(firestoreDb, titleType === 'ASEM' ? 'asemS' : 'atapS', `${tahun}-${user.wilayah}`), { isLocked: false, data: formData }); showToast(`${titleType} Tersimpan!`); setView('list'); };

  if (view === 'list') {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-l-4 border-l-blue-500">
          <div><h2 className="text-xl font-bold text-gray-800">Angka {titleType === 'ASEM' ? 'Sementara (ASEM)' : 'Tetap (ATAP)'} Semusim</h2><p className="text-gray-500">Kecamatan {user.wilayah}</p></div>
          <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
             <select value={tahun} onChange={e => setTahun(e.target.value)} className="bg-white border border-gray-300 rounded px-2 py-1 text-sm font-semibold focus:outline-none">{TAHUN_OPTIONS.map(t => <option key={t}>{t}</option>)}</select>
             <button onClick={handleBuatAtap} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-sm transition-colors flex items-center gap-1.5"><Plus className="w-4 h-4"/> Buat {titleType}</button>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600"><tr><th className="p-4">Tahun {titleType}</th><th className="p-4">Status Validasi</th><th className="p-4 text-right">Aksi</th></tr></thead>
            <tbody>
              {listAtap.length === 0 ? <tr><td colSpan="3" className="p-12 text-center text-gray-400">Belum ada data {titleType}</td></tr> : listAtap.map(a => (
                <tr key={a.key} className="border-b border-gray-100 hover:bg-gray-50">
                   <td className="p-4 font-bold text-gray-800">{a.tahun}</td>
                   <td className="p-4">
                     {a.isLocked ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><Lock className="w-3.5 h-3.5" /> Ditetapkan Kabupaten</span> : <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Unlock className="w-3.5 h-3.5" /> Terbuka (Bisa Diedit)</span>}
                   </td>
                   <td className="p-4 text-right">
                      {a.isLocked ? <button onClick={() => handleEdit(a.key)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"><Eye className="w-4 h-4" /> Lihat</button> :
                      <><button onClick={() => handleEdit(a.key)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors mr-2"><Edit className="w-4 h-4" /> Edit</button><button onClick={() => handleDelete(a.key)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"><Trash2 className="w-4 h-4" /> Hapus</button></>}
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  
  const existingKeys = Object.keys(formData).filter(k => k !== 'isLocked');
  const labelsToRender = atap[`${tahun}-${user.wilayah}`]?.isLocked ? existingKeys : Array.from(new Set([...masterData.komoditasSemusim, ...existingKeys])).sort();

  return (
    <div className="space-y-6 animate-in slide-in-from-right-8">
      <div className="bg-white p-4 rounded-xl flex justify-between items-center z-10 relative shadow-sm border border-gray-200">
         <div className="flex items-center gap-3"><button onClick={()=>setView('list')} className="p-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"><ArrowLeft className="w-5 h-5"/></button><div><h2 className="font-bold text-lg uppercase text-gray-800">Form {titleType} Semusim {atap[`${tahun}-${user.wilayah}`]?.isLocked && "(Mode Baca)"}</h2><p className="text-sm text-gray-600 font-medium">Kecamatan {user.wilayah} • Tahun {tahun}</p></div></div>
         {!atap[`${tahun}-${user.wilayah}`]?.isLocked && <button onClick={handleSave} className="bg-blue-700 hover:bg-blue-800 transition-colors text-white px-6 py-2.5 rounded-lg font-bold shadow-sm uppercase tracking-wider flex items-center gap-2"><Save className="w-5 h-5"/> Simpan {titleType}</button>}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"><FormATAPSemusim data={formData} setData={setFormData} readOnly={atap[`${tahun}-${user.wilayah}`]?.isLocked} meta={{prov: 'Jawa Barat', kab: 'Pangandaran', kec: user.wilayah, tahun, titleType}} rowLabels={labelsToRender} /></div>
    </div>
  );
}

function KabupatenAtapSemusim({ atap, showToast, titleType, masterData }) {
  const [mode, setMode] = useState('status'); 
  const [tahunAwal, setTahunAwal] = useState('2021');
  const [tahunAkhir, setTahunAkhir] = useState('2024');
  const [filterKec, setFilterKec] = useState('Semua Kecamatan');
  const [filterKom, setFilterKom] = useState('Semua Komoditas');
  const [tahunATAPStatus, setTahunATAPStatus] = useState('2024');

  const [view, setView] = useState('list');
  const [formData, setFormData] = useState({});
  const [editInfo, setEditInfo] = useState(null);

  const listAtap = Object.keys(atap).map(k => ({ tahun: k.split('-')[0], kecamatan: k.split('-')[1], isLocked: !!atap[k].isLocked, key: k }))
                 .filter(l => l.tahun === tahunATAPStatus).sort((a,b) => a.kecamatan.localeCompare(b.kecamatan));
                 
  const toggleLock = async (key) => { await setDoc(doc(firestoreDb, titleType === 'ASEM' ? 'asemS' : 'atapS', key), { ...atap[key], isLocked: !atap[key].isLocked }); showToast(!atap[key].isLocked ? `${titleType} Ditetapkan (Terkunci)!` : `${titleType} Dibuka!`, 'info'); };

  const handleEdit = (l) => {
    setEditInfo(l);
    setFormData(JSON.parse(JSON.stringify(atap[l.key].data)));
    setView('form');
  };

  const handleSave = async () => {
    await setDoc(doc(firestoreDb, titleType === 'ASEM' ? 'asemS' : 'atapS', editInfo.key), { ...atap[editInfo.key], data: formData });
    showToast(`Data ${titleType} berhasil diperbarui!`, 'success');
    setView('list');
  };

  const compYears = useMemo(() => {
    let y1 = parseInt(tahunAwal), y2 = parseInt(tahunAkhir); if (y1>y2) {let t=y1;y1=y2;y2=t;} return Array.from({length: y2-y1+1}, (_,i) => (y1+i).toString());
  }, [tahunAwal, tahunAkhir]);

  const historicalKec = Object.keys(atap).filter(k => compYears.some(y => k.startsWith(`${y}-`))).map(k => k.split('-')[1]);
  const allAvailableKec = Array.from(new Set([...masterData.kecamatan, ...historicalKec])).sort();

  const historicalKom = new Set();
  Object.keys(atap).forEach(k => {
     if(compYears.some(y => k.startsWith(`${y}-`)) && atap[k].isLocked) { Object.keys(atap[k].data).forEach(kom => historicalKom.add(kom)); }
  });
  const allAvailableKom = Array.from(new Set([...masterData.komoditasSemusim, ...Array.from(historicalKom)])).sort();

  const rowLabels = filterKom !== 'Semua Komoditas' ? (filterKec === 'Semua Kecamatan' ? allAvailableKec : [filterKec]) : allAvailableKom;
  const rowHeaderLabel = filterKom !== 'Semua Komoditas' ? 'Kecamatan' : 'Jenis Komoditas';

  const compData = useMemo(() => {
     const res = {};
     rowLabels.forEach(label => {
        res[label] = {};
        compYears.forEach(y => { res[label][y] = { luas:0, panen:0, produksi:0, petani:0, produktivitas:0 }; });
     });
     
     const kecs = filterKec === 'Semua Kecamatan' ? allAvailableKec : [filterKec];
     const koms = filterKom === 'Semua Komoditas' ? allAvailableKom : [filterKom];

     compYears.forEach(year => {
        kecs.forEach(kec => {
           const a = atap[`${year}-${kec}`];
           if (a && a.isLocked) { 
               koms.forEach(kom => {
                  const r = a.data[kom]; if(!r) return;
                  const targetLabel = filterKom === 'Semua Komoditas' ? kom : kec;
                  
                  res[targetLabel][year].luas += parseFloat(r.luas)||0; res[targetLabel][year].panen += parseFloat(r.panen)||0; 
                  res[targetLabel][year].produksi += parseFloat(r.produksi)||0; res[targetLabel][year].petani += parseFloat(r.petani)||0;
               });
           }
        });
        rowLabels.forEach(label => {
           res[label][year].produktivitas = res[label][year].panen > 0 ? res[label][year].produksi / res[label][year].panen : 0;
        });
     });
     return res;
  }, [atap, compYears, filterKec, filterKom, rowLabels, allAvailableKec, allAvailableKom]);

  if (view === 'form') {
    const existingKeys = Object.keys(formData);
    const labelsToRender = Array.from(new Set([...masterData.komoditasSemusim, ...existingKeys])).sort();
    return (
      <div className="space-y-6 animate-in slide-in-from-right-8">
        <div className="bg-white p-4 rounded-xl flex justify-between items-center z-10 relative shadow-sm border border-gray-200">
          <div className="flex items-center gap-3"><button onClick={() => setView('list')} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"><ArrowLeft className="w-5 h-5" /></button><div><h2 className="text-lg font-bold uppercase text-gray-800">Edit {titleType} Semusim</h2><p className="text-sm text-gray-600 font-medium">Kecamatan {editInfo?.kecamatan} • Tahun {editInfo?.tahun}</p></div></div>
          <button onClick={handleSave} className="bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-bold uppercase hover:bg-emerald-800 transition-colors shadow-sm tracking-wider flex items-center gap-2"><Save className="w-5 h-5" /> Simpan Perubahan</button>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"><FormATAPSemusim data={formData} setData={setFormData} readOnly={false} meta={{ prov: 'Jawa Barat', kab: 'Pangandaran', kec: editInfo?.kecamatan, tahun: editInfo?.tahun, titleType }} rowLabels={labelsToRender} /></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in">
       <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-blue-700">
         <div className="flex bg-gray-100 p-1 rounded-lg w-fit mb-4"><button onClick={()=>setMode('status')} className={`px-4 py-2 font-bold text-sm rounded uppercase ${mode==='status'?'bg-white shadow text-blue-800':'text-gray-500'}`}>Status Validasi</button><button onClick={()=>setMode('rekap')} className={`px-4 py-2 font-bold text-sm rounded uppercase ${mode==='rekap'?'bg-white shadow text-blue-800':'text-gray-500'}`}>Rekapitulasi {titleType}</button></div>
         
         <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div><h2 className="text-lg font-black text-gray-900 uppercase tracking-wide">{mode === 'status' ? `Status Laporan ${titleType} Kecamatan` : `Rekapitulasi Angka ${titleType==='ASEM'?'Sementara':'Tetap'} Semusim`}</h2><p className="text-gray-600 font-medium text-sm">Tingkat Kabupaten</p></div>
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
             {mode === 'rekap' && <select value={filterKec} onChange={e=>setFilterKec(e.target.value)} className="p-2 bg-gray-50 border border-gray-300 rounded font-semibold text-sm"><option>Semua Kecamatan</option>{allAvailableKec.map(k=><option key={k}>{k}</option>)}</select>}
             {mode === 'rekap' && <select value={filterKom} onChange={e=>setFilterKom(e.target.value)} className="p-2 bg-gray-50 border border-gray-300 rounded font-semibold text-sm"><option>Semua Komoditas</option>{allAvailableKom.map(k=><option key={k}>{k}</option>)}</select>}
             
             {mode === 'rekap' ? (
                <div className="flex items-center gap-2">
                   <select value={tahunAwal} onChange={e=>setTahunAwal(e.target.value)} className="p-2 bg-gray-50 border border-gray-300 rounded font-semibold text-sm">{TAHUN_OPTIONS.map(t=><option key={t}>{t}</option>)}</select><span className="font-bold">-</span><select value={tahunAkhir} onChange={e=>setTahunAkhir(e.target.value)} className="p-2 bg-gray-50 border border-gray-300 rounded font-semibold text-sm">{TAHUN_OPTIONS.map(t=><option key={t}>{t}</option>)}</select>
                </div>
             ) : (
                <div className="flex items-center gap-2">
                   <span className="text-sm font-bold text-gray-700">Tahun {titleType}:</span>
                   <select value={tahunATAPStatus} onChange={e=>setTahunATAPStatus(e.target.value)} className="p-2 bg-gray-50 border border-gray-300 rounded font-semibold text-sm">{TAHUN_OPTIONS.map(t=><option key={t}>{t}</option>)}</select>
                </div>
             )}
          </div>
         </div>
       </div>

       <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {mode === 'status' ? (
             <table className="w-full text-left border-collapse"><thead className="bg-gray-100 text-sm uppercase text-gray-700"><tr><th className="p-4 font-bold">Kecamatan</th><th className="p-4 font-bold">Tahun {titleType}</th><th className="p-4 font-bold">Status Validasi</th><th className="p-4 text-right font-bold">Aksi Validasi</th></tr></thead>
             <tbody className="divide-y divide-gray-100">
               {listAtap.length === 0 ? <tr><td colSpan="4" className="p-12 text-center text-gray-400 font-medium">Belum ada pengajuan {titleType} pada tahun ini.</td></tr> : listAtap.map(l => (
                 <tr key={l.key} className="hover:bg-gray-50">
                    <td className="p-4 font-bold text-gray-900">{l.kecamatan}</td><td className="p-4 text-gray-700 font-medium">{l.tahun}</td>
                    <td className="p-4">{l.isLocked ? <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"><Lock className="w-3.5 h-3.5 inline mr-1" />Ditetapkan</span> : <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"><Unlock className="w-3.5 h-3.5 inline mr-1" />Menunggu Validasi</span>}</td>
                    <td className="p-4 text-right space-x-2">
                       <button onClick={() => handleEdit(l)} className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-bold uppercase transition-colors"><Edit className="w-4 h-4 inline mr-1"/>Edit</button>
                       {l.isLocked ? <button onClick={()=>toggleLock(l.key)} className="px-3 py-1.5 bg-gray-100 text-gray-700 font-bold text-sm rounded-lg uppercase transition-colors"><Unlock className="w-4 h-4 inline mr-1"/> Buka Status</button> : <button onClick={()=>toggleLock(l.key)} className="px-3 py-1.5 bg-blue-700 text-white font-bold text-sm rounded-lg uppercase transition-colors hover:bg-blue-800"><Lock className="w-4 h-4 inline mr-1"/> Tetapkan</button>}
                    </td>
                 </tr>
               ))}
             </tbody></table>
          ) : ( <TablePerbandinganSemusim data={compData} years={compYears} rowLabels={rowLabels} rowHeaderLabel={rowHeaderLabel} meta={{prov: 'Jawa Barat', kab: 'Pangandaran', kom: filterKom, isAtapOnly: true, titleType}} /> )}
       </div>
    </div>
  );
}

// ========================================================================================
// === FORM RENDERER UNTUK ATAP (KECAMATAN FORM ENTRY)
// ========================================================================================
function FormATAPTahunan({ data, setData, readOnly, meta, rowLabels }) {
  const handleInputChange = (label, field, val) => {
    if (readOnly) return;
    setData(prev => { const n = { ...prev }; const r = { ...(n[label] || emptyAtapTahunan()) }; r[field] = val; n[label] = r; return n; });
  };
  const num = (val) => parseFloat(val) || 0;
  
  const renderRow = (label, index) => {
    const row = data[label] || emptyAtapTahunan();
    const jumlah = num(row.tbm) + num(row.tm) + num(row.ttm);
    const produktivitas = num(row.tm) > 0 ? (num(row.produksi) / num(row.tm)).toFixed(2) : 0;

    const renderInp = (f, w='w-20') => (
      <td className="border border-gray-400 p-1"><input disabled={readOnly} type="number" value={row[f]} onChange={(e) => handleInputChange(label, f, e.target.value)} className={`w-full ${w} px-2 py-1 text-sm border border-transparent focus:border-emerald-500 focus:ring-1 rounded ${readOnly ? 'bg-transparent text-gray-500 font-bold text-right' : 'bg-gray-50 hover:bg-white text-right'}`} placeholder="-" /></td>
    );

    return (
      <tr key={label} className="hover:bg-emerald-50/50 transition-colors">
        <td className="border border-gray-400 p-2 text-center text-sm">{index + 1}</td><td className="border border-gray-400 p-2 text-sm font-medium whitespace-nowrap">{label}</td>
        {renderInp('tbm')}{renderInp('tm')}{renderInp('ttm')}
        <td className="border border-gray-400 p-2 text-right text-sm font-bold bg-gray-100">{jumlah > 0 ? jumlah.toLocaleString('id-ID') : '-'}</td>
        {renderInp('produksi', 'w-24')}
        <td className="border border-gray-400 p-2 text-right text-sm bg-gray-100">{produktivitas > 0 ? Number(produktivitas).toLocaleString('id-ID') : '-'}</td>
        {renderInp('petani')}
      </tr>
    );
  };

  const renderFooterRow = () => {
    let t = { tbm:0, tm:0, ttm:0, jumlah:0, produksi:0, petani:0 };
    rowLabels.forEach(l => {
      const r = data[l] || emptyAtapTahunan();
      t.tbm+=num(r.tbm); t.tm+=num(r.tm); t.ttm+=num(r.ttm); 
      t.jumlah+=num(r.tbm)+num(r.tm)+num(r.ttm); t.produksi+=num(r.produksi); t.petani+=num(r.petani);
    });
    const f = (v) => v > 0 ? v.toLocaleString('id-ID') : '-';
    return (
      <tr className="bg-gray-200 font-bold">
        <td colSpan="2" className="border border-gray-400 p-3 text-center">Jumlah</td><td className="border border-gray-400 p-2 text-right">{f(t.tbm)}</td><td className="border border-gray-400 p-2 text-right">{f(t.tm)}</td><td className="border border-gray-400 p-2 text-right">{f(t.ttm)}</td><td className="border border-gray-400 p-2 text-right text-emerald-800">{f(t.jumlah)}</td><td className="border border-gray-400 p-2 text-right">{f(t.produksi)}</td><td className="border border-gray-400 bg-gray-300"></td><td className="border border-gray-400 p-2 text-right">{f(t.petani)}</td>
      </tr>
    );
  }

  const tableId = "table-atap-tahunan";

  return (
    <div className="w-full flex flex-col">
      <div className="p-6 bg-white border-b border-gray-200 relative">
         <div className="text-center">
            <h1 className="text-xl font-black uppercase text-gray-900 tracking-wide font-Arial leading-tight">ANGKA {meta.titleType === 'ASEM' ? 'SEMENTARA (ASEM)' : 'TETAP (ATAP)'} TAHUNAN</h1>
            <h2 className="text-sm font-bold text-gray-500 mt-1 uppercase">Kecamatan {meta.kec} - Tahun {meta.tahun}</h2>
         </div>
         <div className="flex justify-center md:justify-end gap-2 mt-4 md:mt-0 md:absolute md:right-6 md:top-6">
            <button onClick={() => exportToExcel(tableId, `ATAP_Tahunan_${meta.kec}_${meta.tahun}`)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded shadow-sm hover:bg-green-700 transition-colors"><Download className="w-4 h-4"/> Excel</button>
            <button onClick={() => printPDF(tableId, `Angka ${meta.titleType} Tahunan - Kec. ${meta.kec} Tahun ${meta.tahun}`)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded shadow-sm hover:bg-red-700 transition-colors"><Printer className="w-4 h-4"/> PDF</button>
         </div>
      </div>
      <div className="w-full overflow-x-auto p-4 bg-gray-50">
        <table id={tableId} className="w-full min-w-[1000px] border-collapse border border-gray-800 bg-white">
          <thead className="bg-gray-200 text-gray-800 text-xs text-center border-gray-800 align-middle">
            <tr>
              <th rowSpan="2" className="border border-gray-800 p-2 font-bold w-10">No</th><th rowSpan="2" className="border border-gray-800 p-2 font-bold min-w-[150px]">Jenis Komoditas</th><th colSpan="4" className="border border-gray-800 p-2 font-bold bg-gray-300">Luas Areal (Ha)</th><th rowSpan="2" className="border border-gray-800 p-2 font-bold w-24">Produksi (Kg)</th><th rowSpan="2" className="border border-gray-800 p-2 font-bold w-24">Produktivitas<br/>(Kg/Ha)</th><th rowSpan="2" className="border border-gray-800 p-2 font-bold w-20">Jumlah<br/>Petani<br/>(KK)</th>
            </tr>
            <tr>
              <th className="border border-gray-800 p-1 font-semibold w-20">TBM</th><th className="border border-gray-800 p-1 font-semibold w-20">TM</th><th className="border border-gray-800 p-1 font-semibold w-20">TTM/TR</th><th className="border border-gray-800 p-1 font-semibold w-24 bg-gray-100">Jumlah</th>
            </tr>
          </thead>
          <tbody>{rowLabels.map((label, index) => renderRow(label, index))}{renderFooterRow()}</tbody>
        </table>
      </div>
    </div>
  );
}

function FormATAPSemusim({ data, setData, readOnly, meta, rowLabels }) {
  const handleInputChange = (label, field, val) => {
    if (readOnly) return;
    setData(prev => { const n = { ...prev }; const r = { ...(n[label] || emptyAtapSemusim()) }; r[field] = val; n[label] = r; return n; });
  };
  const num = (val) => parseFloat(val) || 0;
  
  const renderRow = (label, index) => {
    const row = data[label] || emptyAtapSemusim();
    const produktivitas = num(row.panen) > 0 ? (num(row.produksi) / num(row.panen)).toFixed(2) : 0;

    const renderInp = (f, w='w-20') => (
      <td className="border border-gray-400 p-1"><input disabled={readOnly} type="number" value={row[f]} onChange={(e) => handleInputChange(label, f, e.target.value)} className={`w-full ${w} px-2 py-1 text-sm border border-transparent focus:border-blue-500 focus:ring-1 rounded ${readOnly ? 'bg-transparent text-gray-500 font-bold text-right' : 'bg-gray-50 hover:bg-white text-right'}`} placeholder="-" /></td>
    );

    return (
      <tr key={label} className="hover:bg-blue-50/50 transition-colors">
        <td className="border border-gray-400 p-2 text-center text-sm">{index + 1}</td><td className="border border-gray-400 p-2 text-sm font-medium whitespace-nowrap">{label}</td>
        {renderInp('luas')}{renderInp('panen')}{renderInp('produksi', 'w-24')}
        <td className="border border-gray-400 p-2 text-right text-sm bg-gray-100">{produktivitas > 0 ? Number(produktivitas).toLocaleString('id-ID') : '-'}</td>
        {renderInp('petani')}
      </tr>
    );
  };

  const renderFooterRow = () => {
    let t = { luas:0, panen:0, produksi:0, petani:0 };
    rowLabels.forEach(l => {
      const r = data[l] || emptyAtapSemusim();
      t.luas+=num(r.luas); t.panen+=num(r.panen); t.produksi+=num(r.produksi); t.petani+=num(r.petani);
    });
    const f = (v) => v > 0 ? v.toLocaleString('id-ID') : '-';
    return (
      <tr className="bg-gray-200 font-bold">
        <td colSpan="2" className="border border-gray-400 p-3 text-center">Jumlah</td><td className="border border-gray-400 p-2 text-right">{f(t.luas)}</td><td className="border border-gray-400 p-2 text-right">{f(t.panen)}</td><td className="border border-gray-400 p-2 text-right text-blue-800">{f(t.produksi)}</td><td className="border border-gray-400 bg-gray-300"></td><td className="border border-gray-400 p-2 text-right">{f(t.petani)}</td>
      </tr>
    );
  }

  const tableId = "table-atap-semusim";

  return (
    <div className="w-full flex flex-col">
      <div className="p-6 bg-white border-b border-gray-200 relative">
         <div className="text-center">
            <h1 className="text-xl font-black uppercase text-gray-900 tracking-wide font-Arial leading-tight">ANGKA {meta.titleType === 'ASEM' ? 'SEMENTARA (ASEM)' : 'TETAP (ATAP)'} SEMUSIM</h1>
            <h2 className="text-sm font-bold text-gray-500 mt-1 uppercase">Kecamatan {meta.kec} - Tahun {meta.tahun}</h2>
         </div>
         <div className="flex justify-center md:justify-end gap-2 mt-4 md:mt-0 md:absolute md:right-6 md:top-6">
            <button onClick={() => exportToExcel(tableId, `ATAP_Semusim_${meta.kec}_${meta.tahun}`)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded shadow-sm hover:bg-green-700 transition-colors"><Download className="w-4 h-4"/> Excel</button>
            <button onClick={() => printPDF(tableId, `Angka ${meta.titleType} Semusim - Kec. ${meta.kec} Tahun ${meta.tahun}`)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded shadow-sm hover:bg-red-700 transition-colors"><Printer className="w-4 h-4"/> PDF</button>
         </div>
      </div>
      <div className="w-full overflow-x-auto p-4 bg-gray-50">
        <table id={tableId} className="w-full min-w-[1000px] border-collapse border border-gray-800 bg-white">
          <thead className="bg-gray-200 text-gray-800 text-xs text-center border-gray-800 align-middle">
            <tr>
              <th className="border border-gray-800 p-2 font-bold w-10">No</th><th className="border border-gray-800 p-2 font-bold min-w-[150px]">Jenis Komoditas</th><th className="border border-gray-800 p-2 font-bold w-24">Luas Areal (Ha)</th><th className="border border-gray-800 p-2 font-bold w-24">Luas Panen (Ha)</th><th className="border border-gray-800 p-2 font-bold w-24">Produksi (Kg)</th><th className="border border-gray-800 p-2 font-bold w-24">Produktivitas<br/>(Kg/Ha)</th><th className="border border-gray-800 p-2 font-bold w-20">Jumlah<br/>Petani<br/>(KK)</th>
            </tr>
          </thead>
          <tbody>{rowLabels.map((label, index) => renderRow(label, index))}{renderFooterRow()}</tbody>
        </table>
      </div>
    </div>
  );
}

// ========================================================================================
// === KOMPONEN TABEL BERSAMA (RENDERERS)
// ========================================================================================

function TablePerbandinganTahun({ data, years, rowLabels, rowHeaderLabel, meta }) {
  const formatNum = (val) => val > 0 ? Number(val.toFixed(2)).toLocaleString('id-ID') : '-';
  const renderRow = (label, index) => {
    const rowData = data[label];
    return (
      <tr key={label} className="hover:bg-emerald-50/50 transition-colors">
        <td className="border border-gray-400 p-2 text-center text-sm">{index + 1}</td>
        <td className="border border-gray-400 p-2 text-sm font-medium whitespace-nowrap">{label}</td>
        {years.map(y => <td key={`tbm-${y}`} className="border border-gray-400 p-1 text-right text-sm">{formatNum(rowData[y]?.tbm || 0)}</td>)}
        {years.map(y => <td key={`tm-${y}`} className="border border-gray-400 p-1 text-right text-sm">{formatNum(rowData[y]?.tm || 0)}</td>)}
        {years.map(y => <td key={`ttm-${y}`} className="border border-gray-400 p-1 text-right text-sm">{formatNum(rowData[y]?.ttm || 0)}</td>)}
        {years.map(y => <td key={`jum-${y}`} className="border border-gray-400 p-1 text-right text-sm font-semibold bg-gray-50 text-emerald-800">{formatNum(rowData[y]?.jumlah || 0)}</td>)}
        {years.map(y => <td key={`prod-${y}`} className="border border-gray-400 p-1 text-right text-sm bg-blue-50">{formatNum(rowData[y]?.produksi || 0)}</td>)}
        {years.map(y => <td key={`produktivitas-${y}`} className="border border-gray-400 p-1 text-right text-sm bg-amber-50">{formatNum(rowData[y]?.produktivitas || 0)}</td>)}
        {years.map(y => <td key={`petani-${y}`} className="border border-gray-400 p-1 text-right text-sm">{formatNum(rowData[y]?.petani || 0)}</td>)}
      </tr>
    );
  };

  const renderFooterRow = () => {
    const totals = {};
    years.forEach(y => totals[y] = { tbm: 0, tm: 0, ttm: 0, jumlah: 0, produksi: 0, petani: 0, produktivitas: 0 });
    rowLabels.forEach(label => {
      years.forEach(y => {
        totals[y].tbm += data[label][y].tbm; totals[y].tm += data[label][y].tm; totals[y].ttm += data[label][y].ttm;
        totals[y].jumlah += data[label][y].jumlah; totals[y].produksi += data[label][y].produksi; totals[y].petani += data[label][y].petani;
      });
    });
    years.forEach(y => totals[y].produktivitas = totals[y].tm > 0 ? totals[y].produksi / totals[y].tm : 0);
    return (
      <tr className="bg-gray-200 font-bold">
        <td colSpan="2" className="border border-gray-400 p-3 text-center">Jumlah</td>
        {years.map(y => <td key={`ftbm-${y}`} className="border border-gray-400 p-2 text-right">{formatNum(totals[y].tbm)}</td>)}
        {years.map(y => <td key={`ftm-${y}`} className="border border-gray-400 p-2 text-right">{formatNum(totals[y].tm)}</td>)}
        {years.map(y => <td key={`fttm-${y}`} className="border border-gray-400 p-2 text-right">{formatNum(totals[y].ttm)}</td>)}
        {years.map(y => <td key={`fjum-${y}`} className="border border-gray-400 p-2 text-right text-emerald-800">{formatNum(totals[y].jumlah)}</td>)}
        {years.map(y => <td key={`fprod-${y}`} className="border border-gray-400 p-2 text-right bg-blue-100">{formatNum(totals[y].produksi)}</td>)}
        {years.map(y => <td key={`fproduktivitas-${y}`} className="border border-gray-400 p-2 text-right bg-amber-100">{formatNum(totals[y].produktivitas)}</td>)}
        {years.map(y => <td key={`fpetani-${y}`} className="border border-gray-400 p-2 text-right">{formatNum(totals[y].petani)}</td>)}
      </tr>
    );
  };

  const tableId = "table-banding-tahunan";
  const reportTitle = meta.isAtapOnly ? `Rekapitulasi Angka ${meta.titleType} Tahunan` : 'Rekapitulasi Perbandingan Tahunan';

  return (
    <div className="w-full flex flex-col">
      <div className="p-6 bg-white border-b border-gray-200 relative">
        <div className="flex flex-col sm:flex-row justify-between items-start text-sm font-bold text-gray-900 uppercase mb-4 gap-4">
          <div className="space-y-1 font-Arial">
            <div className="flex"><span className="w-36">PROVINSI</span><span>: {meta.prov}</span></div>
            <div className="flex"><span className="w-36">KABUPATEN/KOTA</span><span>: {meta.kab}</span></div>
            {(!meta.isAtapOnly && meta.kec !== 'Semua Kecamatan') && (
              <div className="flex"><span className="w-36">KECAMATAN</span><span>: {meta.kec}</span></div>
            )}
          </div>
          <div className="space-y-1 sm:text-right font-Arial">
            <div className="flex sm:justify-end"><span className="w-32 text-left">PERIODE</span><span>: {years[0]} - {years[years.length-1]}</span></div>
            {meta.kom !== 'Semua Komoditas' && (
              <div className="flex sm:justify-end"><span className="w-32 text-left">KOMODITAS</span><span>: {meta.kom}</span></div>
            )}
          </div>
        </div>
        <div className="text-center relative">
          <h1 className="text-xl font-black uppercase text-gray-900 tracking-wide font-Arial leading-tight">
            {reportTitle}
          </h1>
          <h2 className="text-lg font-bold uppercase text-gray-700 font-Arial leading-tight">TANAMAN TAHUNAN</h2>
          <div className="absolute right-0 top-0 hidden md:block text-lg font-black text-gray-500 border-2 border-gray-400 px-2 py-0.5 rounded-sm">
            SPR-TT
          </div>
          <div className="flex justify-center md:justify-end gap-2 mt-4 md:mt-0 md:absolute md:right-0 md:top-10">
            <button onClick={() => exportToExcel(tableId, `Rekap_Tahunan_${years[0]}-${years[years.length-1]}`)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded shadow hover:bg-green-700 transition-colors"><Download className="w-4 h-4"/> Excel</button>
            <button onClick={() => printPDF(tableId, reportTitle)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded shadow hover:bg-red-700 transition-colors"><Printer className="w-4 h-4"/> PDF</button>
          </div>
        </div>
      </div>
      <div className="w-full overflow-x-auto p-4 bg-gray-50">
        <table id={tableId} className="w-full min-w-[1300px] border-collapse border border-gray-800 bg-white">
          <thead className="bg-gray-200 text-gray-800 text-xs text-center border-gray-800 align-middle">
            <tr>
              <th rowSpan="3" className="border border-gray-800 p-2 font-bold w-10">No</th>
              <th rowSpan="3" className="border border-gray-800 p-2 font-bold min-w-[150px]">{rowHeaderLabel}</th>
              <th colSpan={years.length * 4} className="border border-gray-800 p-2 font-bold bg-gray-300">Luas Areal (Ha)</th>
              <th colSpan={years.length} rowSpan="2" className="border border-gray-800 p-2 font-bold bg-blue-100">Produksi Total (Kg)</th>
              <th colSpan={years.length} rowSpan="2" className="border border-gray-800 p-2 font-bold bg-amber-100">Produktivitas (Kg/Ha)</th>
              <th colSpan={years.length} rowSpan="2" className="border border-gray-800 p-2 font-bold bg-purple-100">Petani (KK)</th>
            </tr>
            <tr>
              <th colSpan={years.length} className="border border-gray-800 p-1 font-semibold">TBM</th>
              <th colSpan={years.length} className="border border-gray-800 p-1 font-semibold">TM</th>
              <th colSpan={years.length} className="border border-gray-800 p-1 font-semibold">TTM/TR</th>
              <th colSpan={years.length} className="border border-gray-800 p-1 font-semibold bg-gray-300">Jumlah</th>
            </tr>
            <tr>
              {years.map(y => <th key={`th-tbm-${y}`} className="border border-gray-800 p-1 font-normal w-20 bg-gray-200">{y}</th>)}
              {years.map(y => <th key={`th-tm-${y}`} className="border border-gray-800 p-1 font-normal w-20 bg-gray-200">{y}</th>)}
              {years.map(y => <th key={`th-ttm-${y}`} className="border border-gray-800 p-1 font-normal w-20 bg-gray-200">{y}</th>)}
              {years.map(y => <th key={`th-jum-${y}`} className="border border-gray-800 p-1 font-normal w-24 bg-gray-300">{y}</th>)}
              {years.map(y => <th key={`th-prod-${y}`} className="border border-gray-800 p-1 font-normal w-24 bg-blue-100">{y}</th>)}
              {years.map(y => <th key={`th-produktivitas-${y}`} className="border border-gray-800 p-1 font-normal w-24 bg-amber-100">{y}</th>)}
              {years.map(y => <th key={`th-petani-${y}`} className="border border-gray-800 p-1 font-normal w-20 bg-purple-100">{y}</th>)}
            </tr>
          </thead>
          <tbody>{rowLabels.map((label, index) => renderRow(label, index))}{renderFooterRow()}</tbody>
        </table>
      </div>
    </div>
  );
}

function TablePerbandinganSemusim({ data, years, rowLabels, rowHeaderLabel, meta }) {
  const formatNum = (val) => val > 0 ? Number(val.toFixed(2)).toLocaleString('id-ID') : '-';
  const renderRow = (label, index) => {
    const rowData = data[label];
    return (
      <tr key={label} className="hover:bg-blue-50/50">
        <td className="border border-gray-400 p-2 text-center text-sm">{index + 1}</td>
        <td className="border border-gray-400 p-2 text-sm font-medium whitespace-nowrap">{label}</td>
        {years.map(y => <td key={`luas-${y}`} className="border border-gray-400 p-1 text-right text-sm">{formatNum(rowData[y]?.luas || 0)}</td>)}
        {years.map(y => <td key={`panen-${y}`} className="border border-gray-400 p-1 text-right text-sm">{formatNum(rowData[y]?.panen || 0)}</td>)}
        {years.map(y => <td key={`prod-${y}`} className="border border-gray-400 p-1 text-right text-sm bg-blue-50">{formatNum(rowData[y]?.produksi || 0)}</td>)}
        {years.map(y => <td key={`produktivitas-${y}`} className="border border-gray-400 p-1 text-right text-sm bg-amber-50">{formatNum(rowData[y]?.produktivitas || 0)}</td>)}
        {years.map(y => <td key={`petani-${y}`} className="border border-gray-400 p-1 text-right text-sm">{formatNum(rowData[y]?.petani || 0)}</td>)}
      </tr>
    );
  };

  const renderFooterRow = () => {
    const totals = {};
    years.forEach(y => totals[y] = { luas: 0, panen: 0, produksi: 0, produktivitas: 0, petani: 0 });
    rowLabels.forEach(label => {
      years.forEach(y => {
        totals[y].luas += data[label][y].luas; totals[y].panen += data[label][y].panen;
        totals[y].produksi += data[label][y].produksi; totals[y].petani += data[label][y].petani;
      });
    });
    years.forEach(y => totals[y].produktivitas = totals[y].panen > 0 ? totals[y].produksi / totals[y].panen : 0);
    return (
      <tr className="bg-gray-200 font-bold">
        <td colSpan="2" className="border border-gray-400 p-3 text-center">Jumlah</td>
        {years.map(y => <td key={`fluas-${y}`} className="border border-gray-400 p-2 text-right">{formatNum(totals[y].luas)}</td>)}
        {years.map(y => <td key={`fpanen-${y}`} className="border border-gray-400 p-2 text-right">{formatNum(totals[y].panen)}</td>)}
        {years.map(y => <td key={`fprod-${y}`} className="border border-gray-400 p-2 text-right bg-blue-100">{formatNum(totals[y].produksi)}</td>)}
        {years.map(y => <td key={`fproduktivitas-${y}`} className="border border-gray-400 p-2 text-right bg-amber-100">{formatNum(totals[y].produktivitas)}</td>)}
        {years.map(y => <td key={`fpetani-${y}`} className="border border-gray-400 p-2 text-right">{formatNum(totals[y].petani)}</td>)}
      </tr>
    );
  };

  const tableId = "table-banding-semusim";
  const reportTitle = meta.isAtapOnly ? `Rekapitulasi Angka ${meta.titleType} Semusim` : 'Rekapitulasi Perbandingan Semusim';

  return (
    <div className="w-full flex flex-col">
      <div className="p-6 bg-white border-b border-gray-200 relative">
        <div className="flex flex-col sm:flex-row justify-between items-start text-sm font-bold text-gray-900 uppercase mb-4 gap-4">
          <div className="space-y-1 font-Arial">
            <div className="flex"><span className="w-36">PROVINSI</span><span>: {meta.prov}</span></div>
            <div className="flex"><span className="w-36">KABUPATEN/KOTA</span><span>: {meta.kab}</span></div>
            {(!meta.isAtapOnly && meta.kec !== 'Semua Kecamatan') && (
              <div className="flex"><span className="w-36">KECAMATAN</span><span>: {meta.kec}</span></div>
            )}
          </div>
          <div className="space-y-1 sm:text-right font-Arial">
            <div className="flex sm:justify-end"><span className="w-32 text-left">PERIODE</span><span>: {years[0]} - {years[years.length-1]}</span></div>
            {meta.kom !== 'Semua Komoditas' && (
              <div className="flex sm:justify-end"><span className="w-32 text-left">KOMODITAS</span><span>: {meta.kom}</span></div>
            )}
          </div>
        </div>
        <div className="text-center relative">
          <h1 className="text-xl font-black uppercase text-gray-900 tracking-wide font-Arial leading-tight">
            {reportTitle}
          </h1>
          <h2 className="text-lg font-bold uppercase text-gray-700 font-Arial leading-tight">TANAMAN SEMUSIM</h2>
          <div className="absolute right-0 top-0 hidden md:block text-lg font-black text-gray-500 border-2 border-gray-400 px-2 py-0.5 rounded-sm">
            SPR-TS
          </div>
          <div className="flex justify-center md:justify-end gap-2 mt-4 md:mt-0 md:absolute md:right-0 md:top-10">
            <button onClick={() => exportToExcel(tableId, `Rekap_Semusim_${years[0]}-${years[years.length-1]}`)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded shadow hover:bg-green-700 transition-colors"><Download className="w-4 h-4"/> Excel</button>
            <button onClick={() => printPDF(tableId, reportTitle)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded shadow hover:bg-red-700 transition-colors"><Printer className="w-4 h-4"/> PDF</button>
          </div>
        </div>
      </div>
      <div className="w-full overflow-x-auto p-4 bg-gray-50">
        <table id={tableId} className="w-full min-w-[1300px] border-collapse border border-gray-800 bg-white">
          <thead className="bg-gray-200 text-gray-800 text-xs text-center border-gray-800 align-middle">
            <tr>
              <th rowSpan="2" className="border border-gray-800 p-2 font-bold w-10">No</th>
              <th rowSpan="2" className="border border-gray-800 p-2 font-bold min-w-[150px]">{rowHeaderLabel}</th>
              <th colSpan={years.length} className="border border-gray-800 p-2 font-bold bg-gray-300">Luas Areal Akhir Tahun (Ha)</th>
              <th colSpan={years.length} className="border border-gray-800 p-2 font-bold bg-green-100">Luas Panen Total (Ha)</th>
              <th colSpan={years.length} className="border border-gray-800 p-2 font-bold bg-blue-100">Produksi Total (Kg)</th>
              <th colSpan={years.length} className="border border-gray-800 p-2 font-bold bg-amber-100">Produktivitas (Kg/Ha)</th>
              <th colSpan={years.length} className="border border-gray-800 p-2 font-bold bg-purple-100">Petani (KK)</th>
            </tr>
            <tr>
              {years.map(y => <th key={`th-l-${y}`} className="border border-gray-800 p-1 font-normal w-20 bg-gray-300">{y}</th>)}
              {years.map(y => <th key={`th-p-${y}`} className="border border-gray-800 p-1 font-normal w-20 bg-green-100">{y}</th>)}
              {years.map(y => <th key={`th-pr-${y}`} className="border border-gray-800 p-1 font-normal w-20 bg-blue-100">{y}</th>)}
              {years.map(y => <th key={`th-pro-${y}`} className="border border-gray-800 p-1 font-normal w-20 bg-amber-100">{y}</th>)}
              {years.map(y => <th key={`th-pe-${y}`} className="border border-gray-800 p-1 font-normal w-20 bg-purple-100">{y}</th>)}
            </tr>
          </thead>
          <tbody>{rowLabels.map((label, index) => renderRow(label, index))}{renderFooterRow()}</tbody>
        </table>
      </div>
    </div>
  );
}

function FormSPRTT({ data, setData, readOnly, meta, rowLabels, wujudMap }) {
  const handleInputChange = (label, field, val) => {
    if (readOnly) return;
    setData(prev => { const n = { ...prev }; const r = { ...(n[label] || emptyRow(label, wujudMap)) }; r[field] = val; n[label] = r; return n; });
  };
  const num = (val) => parseFloat(val) || 0;
  const renderRow = (label, index) => {
    const row = data[label] || emptyRow(label, wujudMap);
    const col7 = num(row.col3) + num(row.col5) - num(row.col6);
    const col11 = num(row.col8) + num(row.col9) + num(row.col10);
    const col13 = num(row.col9) > 0 ? (num(row.col12) / num(row.col9)).toFixed(2) : 0;
    const isCol11Error = col7 > 0 && col11 !== col7;

    const renderInputCell = (field, width = 'w-20', type = 'number') => (
      <td className="border border-gray-400 p-1"><input disabled={readOnly} type={type} value={row[field]} onChange={(e) => handleInputChange(label, field, e.target.value)} className={`w-full ${width} px-2 py-1 text-sm border border-transparent focus:border-emerald-500 focus:ring-1 rounded ${readOnly ? 'bg-transparent text-gray-500 font-medium' : 'bg-gray-50 hover:bg-white'} transition-colors ${type==='number' ? 'text-right' : ''}`} placeholder="-" /></td>
    );

    return (
      <tr key={label} className="hover:bg-emerald-50/50 transition-colors">
        <td className="border border-gray-400 p-2 text-center text-sm">{index + 1}</td><td className="border border-gray-400 p-2 text-sm font-medium whitespace-nowrap">{label}</td>
        {renderInputCell('col3')}{renderInputCell('col4')}{renderInputCell('col5')}{renderInputCell('col6')}
        <td className="border border-gray-400 p-2 text-right text-sm font-semibold bg-gray-100">{col7 > 0 ? col7.toLocaleString('id-ID') : '-'}</td>
        {renderInputCell('col8')}{renderInputCell('col9')}{renderInputCell('col10')}
        <td className={`border border-gray-400 p-2 text-right text-sm font-bold ${isCol11Error && !readOnly ? 'bg-red-100 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>{col11 > 0 ? col11.toLocaleString('id-ID') : '-'}</td>
        {renderInputCell('col12', 'w-24')}
        <td className="border border-gray-400 p-2 text-right text-sm bg-gray-100 text-gray-600">{col13 > 0 ? Number(col13).toLocaleString('id-ID') : '-'}</td>
        {renderInputCell('col14')}{renderInputCell('col15', 'w-24', 'text')}{renderInputCell('col16', 'w-32', 'text')}
      </tr>
    );
  };

  const renderFooterRow = () => {
    let t = { c3:0, c4:0, c5:0, c6:0, c7:0, c8:0, c9:0, c10:0, c11:0, c12:0, c14:0 };
    rowLabels.forEach(l => {
      const r = data[l] || emptyRow(l, wujudMap);
      t.c3+=num(r.col3); t.c4+=num(r.col4); t.c5+=num(r.col5); t.c6+=num(r.col6);
      t.c7+=num(r.col3)+num(r.col5)-num(r.col6); t.c8+=num(r.col8); t.c9+=num(r.col9); t.c10+=num(r.col10);
      t.c11+=num(r.col8)+num(r.col9)+num(r.col10); t.c12+=num(r.col12); t.c14+=num(r.col14);
    });
    const f = (v) => v > 0 ? v.toLocaleString('id-ID') : '-';
    return (
      <tr className="bg-gray-200 font-bold">
        <td colSpan="2" className="border border-gray-400 p-3 text-center">Jumlah</td><td className="border border-gray-400 p-2 text-right">{f(t.c3)}</td><td className="border border-gray-400 p-2 text-right">{f(t.c4)}</td><td className="border border-gray-400 p-2 text-right">{f(t.c5)}</td><td className="border border-gray-400 p-2 text-right">{f(t.c6)}</td><td className="border border-gray-400 p-2 text-right text-emerald-800">{f(t.c7)}</td><td className="border border-gray-400 p-2 text-right">{f(t.c8)}</td><td className="border border-gray-400 p-2 text-right">{f(t.c9)}</td><td className="border border-gray-400 p-2 text-right">{f(t.c10)}</td><td className="border border-gray-400 p-2 text-right text-emerald-800">{f(t.c11)}</td><td className="border border-gray-400 p-2 text-right">{f(t.c12)}</td><td className="border border-gray-400 bg-gray-400"></td><td className="border border-gray-400 p-2 text-right">{f(t.c14)}</td><td className="border border-gray-400 bg-gray-400" colSpan="2"></td>
      </tr>
    );
  }

  const tableId = "table-sprtt";
  const reportTitle = meta.isRekap ? 'Rekapitulasi Data Komoditas SPR-TT' : 'Laporan Data Komoditas SPR-TT';

  return (
    <div className="w-full flex flex-col">
      <div className="p-6 bg-white border-b border-gray-200 relative">
        <div className="flex flex-col sm:flex-row justify-between items-start text-sm font-bold text-gray-900 uppercase mb-4 gap-4">
          <div className="space-y-1 font-Arial">
            <div className="flex"><span className="w-36">PROVINSI</span><span>: {meta.prov}</span></div>
            <div className="flex"><span className="w-36">KABUPATEN/KOTA</span><span>: {meta.kab}</span></div>
            {(!meta.isRekap || meta.kec !== 'Semua Kecamatan') && (
              <div className="flex"><span className="w-36">KECAMATAN</span><span>: {meta.kec}</span></div>
            )}
          </div>
          <div className="space-y-1 sm:text-right font-Arial">
            <div className="flex sm:justify-end"><span className="w-32 text-left">TAHUN</span><span>: {meta.tahun}</span></div>
            <div className="flex sm:justify-end"><span className="w-32 text-left">SEMESTER</span><span>: {meta.semester}</span></div>
          </div>
        </div>
        <div className="text-center relative">
          <h1 className="text-xl font-black uppercase text-gray-900 tracking-wide font-Arial leading-tight">
            {meta.isRekap ? 'REKAPITULASI DATA KOMODITAS PERKEBUNAN RAKYAT' : 'LAPORAN DATA KOMODITAS PERKEBUNAN RAKYAT'}
          </h1>
          <h2 className="text-lg font-bold uppercase text-gray-700 font-Arial leading-tight">TANAMAN TAHUNAN</h2>
          <div className="absolute right-0 top-0 hidden md:block text-lg font-black text-gray-500 border-2 border-gray-400 px-2 py-0.5 rounded-sm">
            SPR-TT
          </div>
          <div className="flex justify-center md:justify-end gap-2 mt-4 md:mt-0 md:absolute md:right-0 md:top-10">
            <button onClick={() => exportToExcel(tableId, `SPR_TT_${meta.kec}_${meta.tahun}_S${meta.semester}`)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded shadow hover:bg-green-700 transition-colors"><Download className="w-4 h-4"/> Excel</button>
            <button onClick={() => printPDF(tableId, reportTitle)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded shadow hover:bg-red-700 transition-colors"><Printer className="w-4 h-4"/> PDF</button>
          </div>
        </div>
      </div>
      <div className="w-full overflow-x-auto p-4 bg-gray-50">
        <table id={tableId} className="w-full min-w-[1300px] border-collapse border border-gray-800 bg-white">
          <thead className="bg-gray-200 text-gray-800 text-xs text-center border-gray-800 align-middle">
            <tr>
              <th rowSpan="3" className="border border-gray-800 p-2 font-bold w-10">No</th><th rowSpan="3" className="border border-gray-800 p-2 font-bold min-w-[150px]">{meta.isRekap && meta.kom !== 'Semua Komoditas' ? 'Kecamatan' : 'Jenis Komoditas'}</th><th colSpan="9" className="border border-gray-800 p-2 font-bold bg-gray-300">Kondisi Semester Laporan</th><th rowSpan="3" className="border border-gray-800 p-2 font-bold w-24">Produksi (Kg)</th><th rowSpan="3" className="border border-gray-800 p-2 font-bold w-24">Produktivitas<br/>(Kg/Ha)</th><th rowSpan="3" className="border border-gray-800 p-2 font-bold w-20">Jumlah<br/>Rumah<br/>Tangga<br/>Pekebun<br/>(KK)</th><th rowSpan="3" className="border border-gray-800 p-2 font-bold w-24">Wujud<br/>produksi</th><th rowSpan="3" className="border border-gray-800 p-2 font-bold min-w-[120px]">Keterangan</th>
            </tr>
            <tr>
              <th rowSpan="2" className="border border-gray-800 p-1 font-semibold w-20">Luas Tanaman<br/>akhir<br/>Semester lalu<br/>(ha)</th><th colSpan="3" className="border border-gray-800 p-1 font-semibold">Mutasi tanaman (ha)</th><th colSpan="5" className="border border-gray-800 p-1 font-semibold">Luas Areal (Ha)</th>
            </tr>
            <tr>
              <th className="border border-gray-800 p-1 font-normal text-[11px] w-20">Peremajaan</th><th className="border border-gray-800 p-1 font-normal text-[11px] w-20">Perluasan</th><th className="border border-gray-800 p-1 font-normal text-[11px] w-20">Pengurangan</th><th className="border border-gray-800 p-1 font-normal text-[11px] w-24 bg-gray-100">Luas<br/>Tanaman<br/>Akhir<br/>Semester</th><th className="border border-gray-800 p-1 font-normal text-[11px] w-20">TBM</th><th className="border border-gray-800 p-1 font-normal text-[11px] w-20">TM</th><th className="border border-gray-800 p-1 font-normal text-[11px] w-20">TTM/TR</th><th className="border border-gray-800 p-1 font-normal text-[11px] w-24 bg-gray-100">Jumlah</th>
            </tr>
          </thead>
          <tbody>{rowLabels.map((label, index) => renderRow(label, index))}{renderFooterRow()}</tbody>
        </table>
      </div>
    </div>
  );
}

function FormSPRTS({ data, setData, readOnly, meta, rowLabels, wujudMap }) {
  const handleInputChange = (label, field, val) => {
    if (readOnly) return;
    setData(prev => { const n = { ...prev }; const r = { ...(n[label] || emptyRowSemusim(label, wujudMap)) }; r[field] = val; n[label] = r; return n; });
  };
  const num = (val) => parseFloat(val) || 0;
  const renderRow = (label, index) => {
    const row = data[label] || emptyRowSemusim(label, wujudMap);
    const col6 = num(row.col3) + num(row.col4) - num(row.col5);
    const col10 = num(row.col7) > 0 ? (num(row.col8) / num(row.col7)) : 0;
    const renderInp = (f, w='w-20', type='number', dis=false) => (
      <td className="border border-gray-400 p-1"><input disabled={dis || readOnly} type={type} value={row[f]} onChange={(e) => handleInputChange(label, f, e.target.value)} className={`w-full ${w} px-2 py-1 text-sm border border-transparent focus:border-blue-500 focus:ring-1 rounded ${(dis || readOnly) ? 'bg-transparent text-gray-500 font-medium' : 'bg-blue-50 hover:bg-white'} transition-colors ${type==='number' ? 'text-right' : ''}`} placeholder="-" /></td>
    );

    return (
      <tr key={label} className="hover:bg-blue-50/50 transition-colors">
        <td className="border border-gray-400 p-2 text-center text-sm">{index + 1}</td><td className="border border-gray-400 p-2 text-sm font-medium whitespace-nowrap">{label}</td>
        {renderInp('col3')}{renderInp('col4')}{renderInp('col5')}
        <td className="border border-gray-400 p-2 text-right text-sm font-semibold bg-gray-100">{col6 > 0 ? col6.toLocaleString('id-ID') : '-'}</td>
        {renderInp('col7')}{renderInp('col8', 'w-24')}{renderInp('col9', 'w-24', 'number', true)} 
        <td className="border border-gray-400 p-2 text-right text-sm bg-gray-100 text-gray-600">{col10 > 0 ? Number(col10.toFixed(2)).toLocaleString('id-ID') : '-'}</td>
        {renderInp('col11')}{renderInp('col12', 'w-24', 'text')}{renderInp('col13', 'w-32', 'text')}
      </tr>
    );
  };

  const renderFooterRow = () => {
    let t = { c3:0, c4:0, c5:0, c6:0, c7:0, c8:0, c9:0, c11:0 };
    rowLabels.forEach(l => {
      const r = data[l] || emptyRowSemusim(l, wujudMap);
      t.c3+=num(r.col3); t.c4+=num(r.col4); t.c5+=num(r.col5); t.c6+=num(r.col3)+num(r.col4)-num(r.col5);
      t.c7+=num(r.col7); t.c8+=num(r.col8); t.c9+=num(r.col9); t.c11+=num(r.col11);
    });
    const f = (v) => v > 0 ? v.toLocaleString('id-ID') : '-';
    return (
      <tr className="bg-gray-200 font-bold">
        <td colSpan="2" className="border border-gray-400 p-3 text-center">Jumlah</td><td className="border border-gray-400 p-2 text-right">{f(t.c3)}</td><td className="border border-gray-400 p-2 text-right">{f(t.c4)}</td><td className="border border-gray-400 p-2 text-right">{f(t.c5)}</td><td className="border border-gray-400 p-2 text-right text-blue-800">{f(t.c6)}</td><td className="border border-gray-400 p-2 text-right">{f(t.c7)}</td><td className="border border-gray-400 p-2 text-right">{f(t.c8)}</td><td className="border border-gray-400 p-2 text-right">{f(t.c9)}</td><td className="border border-gray-400 bg-gray-400"></td><td className="border border-gray-400 p-2 text-right">{f(t.c11)}</td><td className="border border-gray-400 bg-gray-400" colSpan="2"></td>
      </tr>
    );
  }

  const tableId = "table-sprts";
  const reportTitle = meta.isRekap ? 'Rekapitulasi Data Komoditas SPR-TS' : 'Laporan Data Komoditas SPR-TS';

  return (
    <div className="w-full flex flex-col">
      <div className="p-6 bg-white border-b border-gray-200 relative">
        <div className="flex flex-col sm:flex-row justify-between items-start text-sm font-bold text-gray-900 uppercase mb-4 gap-4">
          <div className="space-y-1 font-Arial">
            <div className="flex"><span className="w-36">PROVINSI</span><span>: {meta.prov}</span></div>
            <div className="flex"><span className="w-36">KABUPATEN/KOTA</span><span>: {meta.kab}</span></div>
            {(!meta.isRekap || meta.kec !== 'Semua Kecamatan') && (
              <div className="flex"><span className="w-36">KECAMATAN</span><span>: {meta.kec}</span></div>
            )}
          </div>
          <div className="space-y-1 sm:text-right font-Arial">
            <div className="flex sm:justify-end"><span className="w-32 text-left">TAHUN</span><span>: {meta.tahun}</span></div>
            <div className="flex sm:justify-end"><span className="w-32 text-left">TRIWULAN</span><span>: {meta.triwulan}</span></div>
          </div>
        </div>
        <div className="text-center relative">
          <h1 className="text-xl font-black uppercase text-gray-900 tracking-wide font-Arial leading-tight">
            {meta.isRekap ? 'REKAPITULASI DATA KOMODITAS PERKEBUNAN RAKYAT' : 'LAPORAN DATA KOMODITAS PERKEBUNAN RAKYAT'}
          </h1>
          <h2 className="text-lg font-bold uppercase text-gray-700 font-Arial leading-tight">TANAMAN SEMUSIM</h2>
          <div className="absolute right-0 top-0 hidden md:block text-lg font-black text-gray-500 border-2 border-gray-400 px-2 py-0.5 rounded-sm">
            SPR-TS
          </div>
          <div className="flex justify-center md:justify-end gap-2 mt-4 md:mt-0 md:absolute md:right-0 md:top-10">
            <button onClick={() => exportToExcel(tableId, `SPR_TS_${meta.kec}_${meta.tahun}_TW${meta.triwulan}`)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded shadow hover:bg-green-700 transition-colors"><Download className="w-4 h-4"/> Excel</button>
            <button onClick={() => printPDF(tableId, reportTitle)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded shadow hover:bg-red-700 transition-colors"><Printer className="w-4 h-4"/> PDF</button>
          </div>
        </div>
      </div>
      <div className="w-full overflow-x-auto p-4 bg-gray-50">
        <table id={tableId} className="w-full min-w-[1300px] border-collapse border border-gray-800 bg-white">
          <thead className="bg-gray-200 text-gray-800 text-xs text-center border-gray-800 align-middle">
            <tr>
              <th rowSpan="2" className="border border-gray-800 p-2 font-bold w-10">No</th><th rowSpan="2" className="border border-gray-800 p-2 font-bold min-w-[150px]">{meta.isRekap && meta.kom !== 'Semua Komoditas' ? 'Kecamatan' : 'Jenis Komoditas'}</th><th colSpan="4" className="border border-gray-800 p-2 font-bold bg-gray-300">Kondisi Laporan</th><th rowSpan="2" className="border border-gray-800 p-2 font-bold w-20">TM<br/>(Luas Panen)<br/>(Ha)</th><th rowSpan="2" className="border border-gray-800 p-2 font-bold w-24">Produksi (Kg)</th><th rowSpan="2" className="border border-gray-800 p-2 font-bold w-24">Produksi<br/>Gula Merah (Kg)</th><th rowSpan="2" className="border border-gray-800 p-2 font-bold w-24">Produktivitas<br/>(Kg/Ha)</th><th rowSpan="2" className="border border-gray-800 p-2 font-bold w-20">Jumlah<br/>Rumah<br/>Tangga<br/>Pekebun (KK)</th><th rowSpan="2" className="border border-gray-800 p-2 font-bold w-24">Wujud<br/>produksi</th><th rowSpan="2" className="border border-gray-800 p-2 font-bold min-w-[120px]">Keterangan</th>
            </tr>
            <tr>
              <th className="border border-gray-800 p-1 font-semibold w-20">Luas Tanaman<br/>akhir<br/>Triwulan lalu (ha)</th><th className="border border-gray-800 p-1 font-semibold w-20">Perluasan</th><th className="border border-gray-800 p-1 font-semibold w-20">Pengurangan</th><th className="border border-gray-800 p-1 font-semibold w-24 bg-gray-100">Luas<br/>Tanaman<br/>Akhir<br/>Triwulan</th>
            </tr>
          </thead>
          <tbody>{rowLabels.map((label, index) => renderRow(label, index))}{renderFooterRow()}</tbody>
        </table>
      </div>
    </div>
  );
}

// ========================================================================================
// === MODUL PANDUAN PENGGUNAAN (HELP / GUIDES)
// ========================================================================================
function PanduanDashboard() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-indigo-600 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 uppercase tracking-wide">Panduan Penggunaan Aplikasi</h2>
          <p className="text-gray-600 mt-2 font-medium max-w-3xl leading-relaxed">
            Pusat informasi mengenai alur kerja, Standar Operasional Prosedur (SOP), dan definisi data statistik komoditas perkebunan berdasakan <b>Pedoman Pengelolaan Data Komoditas Perkebunan (PDKP) Kementerian Pertanian 2024</b>.
          </p>
        </div>
        <BookOpen className="absolute -right-6 -top-6 w-48 h-48 text-indigo-50 opacity-50 transform -rotate-12" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Terminologi Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><BookOpen className="w-5 h-5" /></div>
              <h3 className="text-lg font-black text-gray-800 uppercase tracking-wide">Terminologi & Definisi Data</h3>
            </div>
            
            <div className="space-y-5">
              <div className="p-5 bg-indigo-50/50 rounded-xl border border-indigo-100 transition-all hover:shadow-md">
                <h4 className="font-black text-indigo-900 mb-2 flex items-center gap-2"><span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span> Angka Sementara (ASEM)</h4>
                <p className="text-sm text-gray-700 leading-relaxed text-justify pl-8">
                  <b>ASEM</b> adalah data hasil estimasi atau perkiraan sampai akhir tahun berjalan berdasarkan data periode awal (Semester 1 / Triwulan 1) yang sudah dilaporkan. 
                  ASEM dihitung secara otomatis oleh sistem menggunakan <b>Metode Proyeksi</b> rata-rata nilai pada periode yang sama dalam 5 tahun terakhir. Keadaan kondisi tanaman (TBM, TM, TR) diproyeksikan dengan menjaga rasio persentase yang ada pada tahun sebelumnya (T-1).
                </p>
              </div>

              <div className="p-5 bg-emerald-50/50 rounded-xl border border-emerald-100 transition-all hover:shadow-md">
                <h4 className="font-black text-emerald-900 mb-2 flex items-center gap-2"><span className="bg-emerald-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span> Angka Tetap (ATAP)</h4>
                <p className="text-sm text-gray-700 leading-relaxed text-justify pl-8">
                  <b>ATAP</b> adalah data final yang sudah divalidasi (melalui tahap <i>desk</i>) dan disinkronisasi antara Kabupaten dan Kecamatan. ATAP merupakan data rekapitulasi utuh selama 1 tahun (Januari - Desember).
                  <br/><br/>
                  <b>Kriteria Agregasi ATAP:</b><br/>
                  <span className="inline-block mt-2 font-semibold">• Tanaman Tahunan:</span> Mengambil kriteria Luas TM (Tanaman Menghasilkan) <b>tertinggi</b> di antara dua laporan Semester. Total Produksi adalah jumlah S1 dan S2.<br/>
                  <span className="inline-block mt-1 font-semibold">• Tanaman Semusim:</span> Mengambil kriteria Luas Panen (TM) <b>tertinggi</b> di antara seluruh laporan Triwulan. Total Produksi adalah penjumlahan keempat Triwulan.
                </p>
              </div>

              <div className="p-5 bg-blue-50/50 rounded-xl border border-blue-100 transition-all hover:shadow-md">
                <h4 className="font-black text-blue-900 mb-2 flex items-center gap-2"><span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span> Laporan Rutin (SPR)</h4>
                <p className="text-sm text-gray-700 leading-relaxed text-justify pl-8">
                  <b>Statistik Perkebunan Rakyat (SPR)</b> adalah formulir pencatatan data riil dari lapangan.
                  <br/>• <b>SPR-TT (Tahunan):</b> Diisi setiap 6 bulan (Semester). Memuat pergerakan komoditas seperti Kelapa, Cengkeh, dan Kopi.
                  <br/>• <b>SPR-TS (Semusim):</b> Diisi setiap 3 bulan (Triwulan). Memuat pergerakan komoditas jangka pendek seperti Tembakau.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Alur Kerja Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Activity className="w-5 h-5" /></div>
              <h3 className="text-lg font-black text-gray-800 uppercase tracking-wide">Alur Kerja (SOP)</h3>
            </div>
            <div className="relative border-l-2 border-gray-200 ml-3 space-y-6 pb-2">
              <div className="relative pl-6">
                <div className="absolute -left-[9px] top-1 w-4 h-4 bg-gray-400 rounded-full border-4 border-white shadow"></div>
                <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Langkah 1: Input Laporan</h4>
                <p className="text-xs text-gray-600 mt-1 font-medium leading-relaxed">Kecamatan menginput data mentah riil ke dalam menu Laporan Semester/Triwulan.</p>
              </div>
              <div className="relative pl-6">
                <div className="absolute -left-[9px] top-1 w-4 h-4 bg-blue-500 rounded-full border-4 border-white shadow"></div>
                <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Langkah 2: Validasi Desk</h4>
                <p className="text-xs text-gray-600 mt-1 font-medium leading-relaxed">Kabupaten memverifikasi laporan tersebut. Jika sesuai, Kabupaten melakukan <b>"Kunci Data"</b> agar kecamatan tidak dapat mengubahnya secara sepihak.</p>
              </div>
              <div className="relative pl-6">
                <div className="absolute -left-[9px] top-1 w-4 h-4 bg-amber-500 rounded-full border-4 border-white shadow"></div>
                <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Langkah 3: Pembuatan ATAP</h4>
                <p className="text-xs text-gray-600 mt-1 font-medium leading-relaxed">Di akhir periode, Kecamatan masuk ke menu Angka Tetap. Sistem akan menarik data laporan terkunci tadi untuk diolah otomatis menjadi ATAP.</p>
              </div>
              <div className="relative pl-6">
                <div className="absolute -left-[9px] top-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-white shadow"></div>
                <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Langkah 4: Penetapan ATAP</h4>
                <p className="text-xs text-gray-600 mt-1 font-medium leading-relaxed">Kabupaten memverifikasi hasil ATAP yang dikirim kecamatan, kemudian melakukan penetapan akhir (Lock). Data tampil di Beranda Publik.</p>
              </div>
            </div>
          </div>

          {/* F.A.Q Section */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl shadow-sm text-white">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-700">
              <div className="p-2 bg-gray-700 text-amber-400 rounded-lg"><HelpCircle className="w-5 h-5" /></div>
              <h3 className="text-lg font-black text-gray-100 uppercase tracking-wide">Pusat Bantuan</h3>
            </div>
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-bold text-emerald-300">Q: Kenapa saat klik "Buat ATAP", muncul peringatan?</h4>
                <p className="text-xs text-gray-300 mt-1.5 leading-relaxed text-justify">Hal ini mendandakan ada Laporan Semester/Triwulan Anda di tahun tersebut yang belum lengkap atau belum divalidasi (dikunci) oleh tingkat Kabupaten. (Fitur ini dirancang untuk mengingatkan, namun Anda tetap dapat memilih opsi Lanjutkan).</p>
              </div>
              <div className="pt-2">
                <h4 className="text-sm font-bold text-emerald-300">Q: Tombol "Edit" di laporan saya hilang?</h4>
                <p className="text-xs text-gray-300 mt-1.5 leading-relaxed text-justify">Jika tombol berubah menjadi "Lihat" dan ada label <span className="text-red-300">Terkunci</span>, itu berarti data sudah divalidasi Kabupaten. Hubungi admin Kabupaten jika Anda mendesak ingin melakukan revisi data.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}