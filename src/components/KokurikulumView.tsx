import React, { useState, useEffect, useMemo } from "react";
import { SchoolDetails } from "../types";
import {
  Trophy,
  Search,
  RefreshCw,
  AlertCircle,
  Database,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
  Medal,
  Star,
  Award,
  Tent,
  Lightbulb,
  Sprout,
  Clipboard,
  Check,
} from "lucide-react";

const APPS_SCRIPT_CODE = `function doGet(e) {
  var sheetName = e.parameter.sheet || "UNIT UNIFORM";
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({error: "Sheet not found"})).setMimeType(ContentService.MimeType.JSON);
  
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  
  var headers = data[0];
  var records = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    records.push(obj);
  }
  
  return ContentService.createTextOutput(JSON.stringify(records)).setMimeType(ContentService.MimeType.JSON);
}`;

interface KokurikulumViewProps {
  details: SchoolDetails;
  isAdmin: boolean;
  onSave: (details: SchoolDetails) => void;
}

const TABS = [
  { id: "UNIT UNIFORM", title: "Unit Uniform", icon: Tent },
  { id: "KELAB PERSATUAN", title: "Kelab/Persatuan", icon: Lightbulb },
  { id: "SUKAN PERMAINAN", title: "Sukan/Permainan", icon: Medal },
  { id: "BENGKEL/KURSUS", title: "Bengkel & Kursus", icon: Award },
  { id: "PENCAPAIAN TAHAP 1", title: "Tahap 1", icon: Sprout },
];

export function KokurikulumView({
  details,
  isAdmin,
  onSave,
}: KokurikulumViewProps) {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [loadedData, setLoadedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTahun, setFilterTahun] = useState("Semua");
  const [filterKelas, setFilterKelas] = useState("Semua");
  const [filterPeringkat, setFilterPeringkat] = useState("Semua");
  const [filterPencapaian, setFilterPencapaian] = useState("Semua");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Admin settings modal state
  const [showSettings, setShowSettings] = useState(false);
  const [tempUrl, setTempUrl] = useState(details.kokoGasUrl || "");
  const [copiedScript, setCopiedScript] = useState(false);

  // Fetch data
  const fetchData = async () => {
    if (!details.kokoGasUrl) {
      setLoadedData([]);
      return;
    }

    let targetUrl = details.kokoGasUrl.trim();
    if (targetUrl.includes("/a/macros/")) {
      targetUrl = targetUrl.replace(/\/a\/macros\/[^\/]+\/s\//, "/macros/s/");
    }

    setLoading(true);
    setErrorMsg("");
    try {
      // Append sheet parameter to tell Apps Script which sheet to fetch
      const urlWithParam = new URL(targetUrl);
      urlWithParam.searchParams.append("sheet", activeTab);

      const res = await fetch(urlWithParam.toString(), { redirect: "follow" });
      if (!res.ok) throw new Error(`HTTP Ralat ${res.status}`);

      const text = await res.text();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        if (text.trim().startsWith("<")) {
          throw new Error(
            "Apps Script memulangkan HTML. Sila pastikan Apps Script anda di-deploy dengan betul.",
          );
        }
        throw new Error("Data yang diterima bukan format JSON yang sah.");
      }

      const arrayData = Array.isArray(parsed)
        ? parsed
        : parsed.data || parsed.records || parsed[activeTab] || [];
      setLoadedData(arrayData);
    } catch (err: any) {
      setErrorMsg(`Gagal mengambil data: ${err.message}`);
      setLoadedData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Reset filters on tab change
    setSearchTerm("");
    setFilterTahun("Semua");
    setFilterKelas("Semua");
    setFilterPeringkat("Semua");
    setFilterPencapaian("Semua");
    setCurrentPage(1);
  }, [activeTab, details.kokoGasUrl]);

  // Utility
  const getValueByKey = (item: any, possibleKeys: string[]) => {
    for (const key of possibleKeys) {
      const matchingKey = Object.keys(item).find(
        (k) => k.toUpperCase().trim() === key.toUpperCase().trim(),
      );
      if (matchingKey !== undefined) return item[matchingKey];
    }
    return "";
  };

  // Extract Dropdown Options
  const availableTahun = useMemo(() => {
    const set = new Set<string>();
    loadedData.forEach((item) => {
      const val = getValueByKey(item, ["TAHUN", "YEAR"]);
      if (val) set.add(String(val).trim().toUpperCase());
    });
    return Array.from(set).sort();
  }, [loadedData]);

  const availableKelas = useMemo(() => {
    const set = new Set<string>();
    loadedData.forEach((item) => {
      const val = getValueByKey(item, ["KELAS", "CLASS"]);
      if (val) set.add(String(val).trim().toUpperCase());
    });
    return Array.from(set).sort();
  }, [loadedData]);

  const availablePeringkat = useMemo(() => {
    const set = new Set<string>();
    loadedData.forEach((item) => {
      const val = getValueByKey(item, ["PERINGKAT", "LEVEL"]);
      if (val) set.add(String(val).trim().toUpperCase());
    });
    return Array.from(set).sort();
  }, [loadedData]);

  const availablePencapaian = useMemo(() => {
    const set = new Set<string>();
    loadedData.forEach((item) => {
      const val = getValueByKey(item, ["PENCAPAIAN", "ACHIEVEMENT"]);
      if (val) set.add(String(val).trim().toUpperCase());
    });
    return Array.from(set).sort();
  }, [loadedData]);

  // Filter Data
  const processedData = useMemo(() => {
    return loadedData.filter((item) => {
      const nama = String(
        getValueByKey(item, ["NAMA", "NAMA MURID", "NAME"]),
      ).toLowerCase();
      const matchSearch =
        !searchTerm || nama.includes(searchTerm.toLowerCase());

      const tahunVal = String(getValueByKey(item, ["TAHUN", "YEAR"]))
        .trim()
        .toUpperCase();
      const matchTahun = filterTahun === "Semua" || tahunVal === filterTahun;

      const kelasVal = String(getValueByKey(item, ["KELAS", "CLASS"]))
        .trim()
        .toUpperCase();
      const matchKelas = filterKelas === "Semua" || kelasVal === filterKelas;

      const peringkatVal = String(getValueByKey(item, ["PERINGKAT", "LEVEL"]))
        .trim()
        .toUpperCase();
      const matchPeringkat =
        filterPeringkat === "Semua" || peringkatVal === filterPeringkat;

      const pencapaianVal = String(
        getValueByKey(item, ["PENCAPAIAN", "ACHIEVEMENT"]),
      )
        .trim()
        .toUpperCase();
      const matchPencapaian =
        filterPencapaian === "Semua" || pencapaianVal === filterPencapaian;

      return (
        matchSearch &&
        matchTahun &&
        matchKelas &&
        matchPeringkat &&
        matchPencapaian
      );
    });
  }, [
    loadedData,
    searchTerm,
    filterTahun,
    filterKelas,
    filterPeringkat,
    filterPencapaian,
  ]);

  // Analytics
  const analytics = useMemo(() => {
    let total = processedData.length;
    const pencapaianObj: Record<string, number> = {};
    const peringkatObj: Record<string, number> = {};

    processedData.forEach((item) => {
      const pencapaian =
        String(getValueByKey(item, ["PENCAPAIAN", "ACHIEVEMENT"])).trim() ||
        "TIADA";
      const peringkat =
        String(getValueByKey(item, ["PERINGKAT", "LEVEL"])).trim() || "TIADA";

      pencapaianObj[pencapaian] = (pencapaianObj[pencapaian] || 0) + 1;
      peringkatObj[peringkat] = (peringkatObj[peringkat] || 0) + 1;
    });

    return {
      total,
      pencapaianCounts: pencapaianObj,
      peringkatCounts: peringkatObj,
    };
  }, [processedData]);

  // Pagination bounds
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedData.slice(start, start + itemsPerPage);
  }, [processedData, currentPage, itemsPerPage]);

  const handleSaveSettings = () => {
    onSave({ ...details, kokoGasUrl: tempUrl });
    setShowSettings(false);
  };

  const getPeringkatColor = (p: string) => {
    const upper = p.toUpperCase();
    if (upper.includes("ANTARABANGSA") || upper.includes("INTERNATIONAL"))
      return "bg-purple-100 text-purple-700 border-purple-200";
    if (upper.includes("KEBANGSAAN") || upper.includes("NATIONAL"))
      return "bg-amber-100 text-amber-700 border-amber-200";
    if (upper.includes("NEGERI") || upper.includes("STATE"))
      return "bg-blue-100 text-blue-700 border-blue-200";
    if (upper.includes("DAERAH") || upper.includes("DISTRICT"))
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  const themeText = "text-[#bc1437]";
  const themePageBtnActive = "bg-[#bc1437] shadow-[#bc1437]/20";

  const handleCopyScript = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center sm:items-center bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-50 border border-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Pencapaian Kokurikulum
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => {
                setTempUrl(details.kokoGasUrl || "");
                setShowSettings(true);
              }}
              className="p-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-2xl transition-all shadow-sm hover:scale-[1.03] active:scale-95 cursor-pointer"
              title="Tetapan Apps Script"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex bg-white rounded-xl shadow-sm border border-slate-200/60 p-1 shrink-0 overflow-x-auto hide-scrollbar">
          {TABS.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? "bg-[#bc1437] text-white shadow-md shadow-[#bc1437]/10"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <tab.icon className={`w-4 h-4 shrink-0 ${isSelected ? "text-white" : "text-slate-400"}`} />
                {tab.title}
              </button>
            );
          })}
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-5 rounded-2xl flex items-start gap-3.5">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-black uppercase tracking-wider mb-1">
              Ralat Semasa Integrasi
            </p>
            <p className="text-xs font-semibold opacity-90">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Analytics */}
      {!loading && !errorMsg && loadedData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="p-8 rounded-3xl border border-[#bc1437]/20 bg-[#bc1437] shadow-sm relative overflow-hidden flex flex-col justify-center items-center h-full">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white opacity-90 mb-2">
              Jumlah Pencapaian
            </h4>
            <p className="text-6xl font-black text-white">{analytics.total}</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
              Pecahan Peringkat
            </h4>
            <div className="space-y-3">
              {Object.entries(analytics.peringkatCounts)
                .sort((a, b) => (b[1] as number) - (a[1] as number))
                .slice(0, 4)
                .map(([k, v], i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold text-slate-700 truncate mr-2">
                        {k}
                      </span>
                      <span className="font-black text-[#bc1437]">
                        {Number(v)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full">
                      <div
                        className="bg-[#bc1437] h-1.5 rounded-full"
                        style={{
                          width: `${(Number(v) / (analytics.total || 1)) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
              Pencapaian Teratas
            </h4>
            <div className="space-y-3">
              {Object.entries(analytics.pencapaianCounts)
                .sort((a, b) => (b[1] as number) - (a[1] as number))
                .slice(0, 4)
                .map(([k, v], i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold text-slate-700 truncate mr-2">
                        {k}
                      </span>
                      <span className="font-black text-amber-600">
                        {Number(v)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full">
                      <div
                        className="bg-amber-400 h-1.5 rounded-full"
                        style={{
                          width: `${(Number(v) / (analytics.total || 1)) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter and Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_12px_40px_rgba(0,0,0,0.03)] overflow-hidden relative">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 justify-between lg:items-center w-full min-w-0">
            <div className="min-w-0 flex-1">
              <h3 className="font-black text-slate-800 text-lg leading-tight uppercase tracking-tight truncate">
                Senarai {TABS.find((t) => t.id === activeTab)?.title}
              </h3>
            </div>

            <div className="flex flex-1 sm:flex-none items-center gap-3 w-full sm:w-auto">
              <div className="relative group flex-1 sm:flex-none sm:w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#bc1437]" />
                <input
                  type="text"
                  placeholder="Cari nama murid..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-[#bc1437]/10 focus:border-[#bc1437] transition-all shadow-sm"
                />
              </div>
              <button
                onClick={fetchData}
                disabled={loading}
                title="Segarkan Data"
                className="bg-white border border-slate-200 p-2.5 rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50 group shrink-0 hidden sm:flex items-center justify-center"
              >
                <RefreshCw
                  className={`w-4 h-4 text-slate-500 ${loading ? "animate-spin" : "group-hover:text-[#bc1437]"}`}
                />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select
              value={filterTahun}
              onChange={(e) => {
                setFilterTahun(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3.5 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#bc1437] shadow-sm"
            >
              <option value="Semua">Semua Tahun</option>
              {availableTahun.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={filterKelas}
              onChange={(e) => {
                setFilterKelas(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3.5 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#bc1437] shadow-sm"
            >
              <option value="Semua">Semua Kelas</option>
              {availableKelas.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={filterPeringkat}
              onChange={(e) => {
                setFilterPeringkat(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3.5 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#bc1437] shadow-sm"
            >
              <option value="Semua">Semua Peringkat</option>
              {availablePeringkat.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={filterPencapaian}
              onChange={(e) => {
                setFilterPencapaian(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3.5 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#bc1437] shadow-sm"
            >
              <option value="Semua">Semua Pencapaian</option>
              {availablePencapaian.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            title="Segarkan Data"
            className="sm:hidden w-full bg-white border border-slate-200 p-2.5 rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50 group flex items-center justify-center gap-2"
          >
            <RefreshCw
              className={`w-4 h-4 text-slate-500 ${loading ? "animate-spin" : "group-hover:text-[#bc1437]"}`}
            />
            <span className="text-xs font-bold text-slate-600">
              Segarkan Data
            </span>
          </button>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#bc1437] text-white text-[10px] md:text-xs uppercase tracking-wider border-b border-[#bc1437]">
                <th className="px-6 py-4 font-black w-12 text-center">Bil.</th>
                <th className="px-6 py-4 font-black sticky lg:static left-0 lg:left-auto bg-[#bc1437] z-20 min-w-[180px] max-w-[280px]">
                  Nama Murid
                </th>
                <th className="px-6 py-4 font-black text-center">Tahun/Kelas</th>
                <th className="px-6 py-4 font-black">Pertandingan/Aktiviti</th>
                <th className="px-6 py-4 font-black text-center">Peringkat</th>
                <th className="px-6 py-4 font-black text-center">Pencapaian</th>
                <th className="px-6 py-4 font-black">Guru Pengiring</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-6 py-20 text-center text-slate-400"
                  >
                    <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-[#bc1437]" />
                    <p className="font-extrabold text-xs uppercase tracking-widest text-slate-500">
                      Memuat naik data...
                    </p>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-6 py-16 text-center text-slate-400"
                  >
                    <Database className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-bold text-sm">Tiada Rekod Dijumpai</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => {
                  const realIndex = (currentPage - 1) * itemsPerPage + idx + 1;
                  const nama = String(
                    getValueByKey(item, ["NAMA MURID", "NAMA", "NAME"]),
                  );
                  const tahun = String(getValueByKey(item, ["TAHUN", "YEAR"]));
                  const kelas = String(getValueByKey(item, ["KELAS", "CLASS"]));
                  const pertandingan = String(
                    getValueByKey(item, [
                      "PERTANDINGAN",
                      "AKTIVITI",
                      "COMPETITION",
                      "ACTIVITY",
                    ]),
                  );
                  const anjuran = String(
                    getValueByKey(item, ["ANJURAN", "ORGANIZER"]),
                  );
                  const peringkat = String(
                    getValueByKey(item, ["PERINGKAT", "LEVEL"]),
                  );
                  const pencapaian = String(
                    getValueByKey(item, ["PENCAPAIAN", "ACHIEVEMENT"]),
                  );
                  const guru = String(
                    getValueByKey(item, [
                      "NAMA GURU PENGIRING",
                      "GURU PENGIRING",
                      "GURU",
                      "TEACHER",
                    ]),
                  );

                  return (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50 transition-colors border-b border-slate-100 group"
                    >
                      <td className="px-6 py-4 text-center font-black text-slate-400 text-xs">
                        {realIndex}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800 text-xs sm:text-sm leading-snug uppercase sticky lg:static left-0 lg:left-auto bg-white group-hover:bg-slate-50 z-10 lg:z-auto border-r border-slate-100 lg:border-r-0 shadow-[2px_0_5px_rgba(0,0,0,0.02)] lg:shadow-none min-w-[180px] max-w-[280px]">
                        <div
                          className="whitespace-normal break-words leading-tight"
                          title={nama}
                        >
                          {nama || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-center">
                        <div className="font-bold text-slate-700 uppercase">
                          {tahun || "-"}
                        </div>
                        <div className="font-medium text-slate-500 uppercase">
                          {kelas || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs min-w-[200px] whitespace-normal">
                        <div className="font-bold text-slate-800 uppercase leading-snug">
                          {pertandingan || "-"}
                        </div>
                        <div className="font-medium text-slate-500 text-[10px] uppercase mt-1 leading-snug">
                          {anjuran ? `Anjuran: ${anjuran}` : ""}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 text-[10px] rounded-lg border font-bold uppercase tracking-wider ${getPeringkatColor(peringkat)}`}
                        >
                          {peringkat || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-black text-amber-600 text-xs uppercase">
                          {pencapaian || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-600 text-xs uppercase whitespace-normal break-words">
                        {guru || "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && totalPages > 1 && (
          <div className="p-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/40">
            <p className="text-xs font-bold text-slate-500">
              Memaparkan{" "}
              <span className="text-slate-800">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{" "}
              hingga{" "}
              <span className="text-slate-800">
                {Math.min(currentPage * itemsPerPage, processedData.length)}
              </span>{" "}
              daripada <span className={themeText}>{processedData.length}</span>{" "}
              rekod
            </p>

            <div className="flex items-center space-x-1.5 select-none">
              <button
                onClick={() =>
                  currentPage > 1 && setCurrentPage(currentPage - 1)
                }
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {(() => {
                let startPage = Math.max(1, currentPage - 2);
                let endPage = startPage + 4;
                if (endPage > totalPages) {
                  endPage = totalPages;
                  startPage = Math.max(1, endPage - 4);
                }
                const pagesToShow = Array.from(
                  { length: endPage - startPage + 1 },
                  (_, i) => startPage + i,
                );
                return pagesToShow.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[36px] h-[36px] flex items-center justify-center text-xs font-black rounded-xl transition-all ${
                      currentPage === page
                        ? `${themePageBtnActive} text-white shadow-md shadow-emerald-500/20`
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50 bg-white shadow-sm"
                    }`}
                  >
                    {page}
                  </button>
                ));
              })()}
              <button
                onClick={() =>
                  currentPage < totalPages && setCurrentPage(currentPage + 1)
                }
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showSettings && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h4 className="font-black text-lg text-slate-800 mb-2">
              Tetapan Apps Script
            </h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-4">
              URL API Kokurikulum (GET)
            </p>

            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2 block">
              URL Apps Script
            </label>
            <input
              type="text"
              value={tempUrl}
              onChange={(e) => setTempUrl(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:border-[#bc1437] outline-none shadow-sm font-mono text-slate-600 mb-6"
              placeholder="https://script.google.com/macros/s/.../exec"
            />

            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Kod Apps Script (.gs)
                </label>
                <button
                  onClick={handleCopyScript}
                  className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  {copiedScript ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" /> Disalin
                    </>
                  ) : (
                    <>
                      <Clipboard className="w-3 h-3" /> Salin Kod
                    </>
                  )}
                </button>
              </div>
              <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto max-h-48 text-left">
                <pre className="text-[10px] sm:text-xs font-mono text-slate-300 leading-relaxed">
                  {APPS_SCRIPT_CODE}
                </pre>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowSettings(false)}
                className="px-5 py-3 border border-slate-200 text-slate-600 hover:bg-slate-100 font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-5 py-3 bg-[#bc1437] hover:opacity-90 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md shadow-[#bc1437]/10"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
