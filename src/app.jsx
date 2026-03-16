import React, { useState, useEffect, useContext, createContext, useMemo } from 'react';
import { 
  Search, Globe, User, Star, Heart, Clock, Check, Plus, 
  PlayCircle, Info, ChevronLeft, ChevronRight, LogOut, Clapperboard, 
  Tv, MonitorPlay, TrendingUp, Award, Play, Film, Tv2, Mail, Lock, X, Filter,
  Eye, EyeOff, ShieldCheck, Sparkles, Flame, PlusCircle, MinusCircle, Save,
  ArrowRight, InfoIcon
} from 'lucide-react';

// ==========================================
// TMDB API AYARLARI (Canlı Yayın İçin Hazır)
// ==========================================
const TMDB_API_KEY = '5d0983119d8fc90b3286bf7c9be516e0';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const TMDB_HIGH_RES_IMAGE_URL = 'https://image.tmdb.org/t/p/original'; 
const TMDB_BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/original';

const fetchTMDB = async (endpoint, lang = 'tr-TR') => {
  try {
    const response = await fetch(`${TMDB_BASE_URL}${endpoint}?api_key=${TMDB_API_KEY}&language=${lang}`);
    if (!response.ok) throw new Error('Ağ hatası');
    return await response.json();
  } catch (error) {
    console.error("TMDB API Hatası:", error);
    return null;
  }
};

// Yardımcı Fonksiyon: Kullanıcı Baş Harflerini Al
const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ==========================================
// 1. DİL (i18n) SİSTEMİ
// ==========================================
const translations = {
  en: {
    nav: { home: "Home", movies: "Movies", tv: "TV Series", anime: "Anime", search: "Search" },
    auth: { 
      login: "Log In", logout: "Log Out", profile: "Profile", register: "Sign Up", 
      email: "Email", password: "Password", username: "Full Name", 
      noAccount: "Don't have an account?", haveAccount: "Already have an account?",
      secureNote: "Secure session protection active.",
      passWeak: "Weak", passMedium: "Good", passStrong: "Strong"
    },
    home: { 
      hero: "Discover & Track.",
      trendingMovies: "Trending Movies",
      trendingTV: "Trending TV Shows", 
      editorsChoice: "Editor's Choice",
      editorsNote: "Weekly hand-picked recommendation for you.",
      loading: "Loading universe...",
      trends: ["GLOBAL TRENDS", "TOP PICKS", "WEEKLY HITS", "CRITICS CHOICE"]
    },
    media: {
      director: "Director", cast: "Cast", rating: "IMDb", release: "Release Date",
      overview: "Overview", platforms: "Available on",
      track: "Track", watched: "Watched", watching: "Watching", plan: "Plan to Watch",
      addToWatchlist: "Watchlist", favorite: "Favorite",
      season: "Season", episode: "Episode", updateProgress: "Save Progress",
      readMore: "View Details", currentProgress: "Your Progress",
      types: { movie: "Movie", tv: "TV Series", anime: "Anime" }
    },
    profile: {
      stats: "Lifetime Stats", totalWatched: "Total Watched", avgRating: "Avg Rating",
      favorites: "Favorites List", recent: "Recent Activity",
      watched: "Watched History",
      watchlist: "Watchlist",
      filters: { all: "All", movie: "Movies", tv: "TV Series" },
      emptyFilter: "No media found for this filter."
    },
    search: { placeholder: "Search movies, series...", noResults: "No results found in this universe.", searching: "Searching..." }
  },
  tr: {
    nav: { home: "Ana Sayfa", movies: "Filmler", tv: "Diziler", anime: "Animeler", search: "Ara" },
    auth: { 
      login: "Giriş Yap", logout: "Çıkış Yap", profile: "Profil", register: "Kayıt Ol", 
      email: "E-posta", password: "Şifre", username: "Ad Soyad", 
      noAccount: "Hesabın yok mu?", haveAccount: "Zaten bir hesabın var mı?",
      secureNote: "Güvenli oturum koruması aktif.",
      passWeak: "Zayıf", passMedium: "İyi", passStrong: "Güçlü"
    },
    home: { 
      hero: "Keşfet ve Takip Et.",
      trendingMovies: "Popüler Filmler", 
      trendingTV: "Popüler Diziler",
      editorsChoice: "Editörün Seçimi",
      editorsNote: "Bu hafta senin için seçtiğimiz özel yapım.",
      loading: "Evren yükleniyor...",
      trends: ["KÜRESEL TRENDLER", "GÜNÜN SEÇİMLERİ", "HAFTALIK HİTLER", "ELEŞTİRMEN NOTLARI"]
    },
    media: {
      director: "Yönetmen", cast: "Oyuncular", rating: "Puan", release: "Çıkış Tarihi",
      overview: "Özet", platforms: "Platformlar",
      track: "Takip Et", watched: "İzlendi", watching: "İzleniyor", plan: "İzlenecek",
      addToWatchlist: "İzleme Listesi", favorite: "Favori",
      season: "Sezon", episode: "Bölüm", updateProgress: "İlerlemeyi Kaydet",
      readMore: "Detayları Gör", currentProgress: "Kaldığın Yer",
      types: { movie: "Film", tv: "Dizi", anime: "Anime" }
    },
    profile: {
      stats: "Genel İstatistikler", totalWatched: "Toplam İzlenen", avgRating: "Ortalama Puan",
      favorites: "Favori Listesi", recent: "Son Aktiviteler",
      watched: "İzleme Geçmişi",
      watchlist: "İzleme Listesi",
      filters: { all: "Tümü", movie: "Filmler", tv: "Diziler" },
      emptyFilter: "Bu filtreye uygun izlenmiş yapım bulunmuyor."
    },
    search: { placeholder: "Film veya dizi ara...", noResults: "Bu evrende sonuç bulunamadı.", searching: "Aranıyor..." }
  }
};

const I18nContext = createContext();
const useI18n = () => useContext(I18nContext);

const I18nProvider = ({ children }) => {
  const [lang, setLang] = useState('tr'); 
  const tmdbLang = lang === 'tr' ? 'tr-TR' : 'en-US';
  const t = useMemo(() => translations[lang], [lang]);
  const toggleLang = () => setLang(prev => prev === 'en' ? 'tr' : 'en');

  return (
    <I18nContext.Provider value={{ lang, tmdbLang, toggleLang, t }}>
      {children}
    </I18nContext.Provider>
  );
};

// ==========================================
// 2. VERİ VE KULLANICI YÖNETİMİ (YEREL DURUM)
// ==========================================
const DataContext = createContext();
const useData = () => useContext(DataContext);

const DataProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState({
    watchlist: [],
    favorites: [],
    history: {},
    displayName: ''
  });

  const login = (email, password) => {
    const name = email.split('@')[0];
    setCurrentUser({ id: 'user-id-123', email });
    setUserData(prev => ({ ...prev, displayName: name }));
  };

  const registerComplete = (username, email) => {
    setCurrentUser({ id: 'user-id-123', email });
    setUserData({
      watchlist: [],
      favorites: [],
      history: {},
      displayName: username
    });
  };

  const logout = () => {
    setCurrentUser(null);
    setUserData({
      watchlist: [],
      favorites: [],
      history: {},
      displayName: ''
    });
  };

  const updateMediaStatus = (media, status, season = null, episode = null) => {
    setUserData(prev => ({
      ...prev,
      history: {
        ...prev.history,
        [media.id]: { 
          ...(prev.history[media.id] || {}), 
          status: status, 
          media: media,
          progress: season !== null ? { season, episode } : prev.history[media.id]?.progress
        }
      }
    }));
  };

  const toggleList = (mediaItem, listName) => {
    setUserData(prev => {
      const list = prev[listName] || [];
      const exists = list.find(item => item.id === mediaItem.id);
      const newList = exists ? list.filter(item => item.id !== mediaItem.id) : [...list, mediaItem];
      return { ...prev, [listName]: newList };
    });
  };

  return (
    <DataContext.Provider value={{ currentUser, userData, login, registerComplete, logout, updateMediaStatus, toggleList }}>
      {children}
    </DataContext.Provider>
  );
};

// ==========================================
// 3. ARAYÜZ BİLEŞENLERİ
// ==========================================

const UserInitials = ({ name, size = "md" }) => {
  const initials = getInitials(name);
  const sizeClasses = {
    sm: "w-8 h-8 text-[10px]",
    md: "w-10 h-10 text-[10px]",
    lg: "w-32 h-32 text-4xl"
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-black text-white shadow-2xl border-2 border-white/5 uppercase tracking-tighter`}>
      {initials}
    </div>
  );
};

const getTypeIcon = (type) => {
  switch(type) {
    case 'movie': return <Film size={12} className="mr-1"/>;
    case 'tv': return <Tv2 size={12} className="mr-1"/>;
    default: return <Film size={12} className="mr-1"/>;
  }
};

const formatMediaCard = (item, type = 'movie') => {
  return {
    id: item.id,
    type: item.media_type || type,
    title: item.title || item.name,
    originalTitle: item.original_title || item.original_name,
    poster: item.poster_path ? `${TMDB_IMAGE_BASE_URL}${item.poster_path}` : 'https://via.placeholder.com/500x750?text=Afiş+Yok',
    highResPoster: item.poster_path ? `${TMDB_HIGH_RES_IMAGE_URL}${item.poster_path}` : 'https://via.placeholder.com/1000x1500?text=Afiş+Yok',
    backdrop: item.backdrop_path ? `${TMDB_BACKDROP_BASE_URL}${item.backdrop_path}` : 'https://via.placeholder.com/1920x1080?text=Görsel+Yok',
    imdbRating: item.vote_average ? item.vote_average.toFixed(1) : 'N/A',
    overview: item.overview,
    year: (item.release_date || item.first_air_date || 'N/A').substring(0, 4)
  };
};

const MediaCard = ({ media, onClick, progress }) => {
  const { userData, toggleList } = useData();
  const { t } = useI18n();
  const inWatchlist = (userData.watchlist || []).some(m => m.id === media.id);

  return (
    <div 
      className="group relative flex-shrink-0 w-44 sm:w-52 lg:w-60 cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 hover:ring-2 hover:ring-white/30 bg-gray-900"
      onClick={() => onClick(media.id, media.type)}
    >
      <img src={media.poster} alt={media.title} className="w-full h-64 sm:h-72 lg:h-80 object-cover" loading="lazy" />
      
      {progress && (
        <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded-md shadow-lg border border-white/20 z-10">
          S{progress.season} E{progress.episode}
        </div>
      )}

      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center uppercase tracking-wider border border-white/10 shadow-lg">
        {getTypeIcon(media.type)} {t.media.types[media.type] || 'Media'}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
        <h4 className="text-white font-extrabold text-base leading-tight mb-2 drop-shadow-md line-clamp-2">{media.title}</h4>
        
        <div className="flex items-center justify-between mt-1">
          <span className="bg-[#f5c518] text-black text-xs font-black px-2 py-1 rounded shadow-md flex items-center tracking-tight">
            <Star size={12} className="mr-1 fill-black" /> {media.imdbRating}
          </span>
          
          <button 
            onClick={(e) => { e.stopPropagation(); toggleList(media, 'watchlist'); }}
            className={`p-2 rounded-full transition-colors shadow-lg ${inWatchlist ? 'bg-white text-black' : 'bg-black/50 text-white hover:bg-white hover:text-black border border-white/20'}`}
          >
            {inWatchlist ? <Check size={16} /> : <Plus size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// SAYFALAR (VIEWS)
// ==========================================

const AuthView = ({ navigate }) => {
  const { t } = useI18n();
  const { login, registerComplete } = useData();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });

  const getPassStrength = (pass) => {
    if (pass.length === 0) return 0;
    if (pass.length < 6) return 1;
    if (pass.length < 10) return 2;
    return 3;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin) {
      login(formData.email, formData.password);
    } else {
      registerComplete(formData.username, formData.email);
    }
    navigate('home');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-blue-600/10 to-purple-600/10 blur-[150px] rounded-full pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-md bg-gray-900/80 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.6)]">
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 to-purple-600 shadow-[0_15px_35px_rgba(59,130,246,0.4)] flex items-center justify-center mx-auto mb-6 transform -rotate-6">
            <ShieldCheck className="text-white" size={40} />
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight mb-2">{isLogin ? t.auth.login : t.auth.register}</h2>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">
            <ShieldCheck size={12} className="text-green-500" /> {t.auth.secureNote}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="relative group">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input type="text" placeholder={t.auth.username} required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full bg-black/40 border border-gray-800 text-white px-14 py-4.5 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder-gray-600 font-bold" />
            </div>
          )}
          <div className="relative group">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input type="email" placeholder={t.auth.email} required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-black/40 border border-gray-800 text-white px-14 py-4.5 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder-gray-600 font-bold" />
          </div>
          <div className="relative group">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder={t.auth.password} 
              required 
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
              className="w-full bg-black/40 border border-gray-800 text-white px-14 py-4.5 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder-gray-600 font-bold" 
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {!isLogin && formData.password.length > 0 && (
            <div className="px-1">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Güvenlik</span>
                <span className="text-[10px] font-black uppercase text-blue-400">
                  {getPassStrength(formData.password) === 1 ? t.auth.passWeak : getPassStrength(formData.password) === 2 ? t.auth.passMedium : t.auth.passStrong}
                </span>
              </div>
              <div className="flex gap-1.5 h-1.5">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`flex-1 rounded-full transition-all duration-500 ${getPassStrength(formData.password) >= i ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gray-800'}`} />
                ))}
              </div>
            </div>
          )}

          <button type="submit" className="w-full bg-white text-black font-black text-lg py-5 rounded-2xl hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all uppercase tracking-[0.2em] mt-6 flex items-center justify-center gap-3 active:scale-95">
            <ShieldCheck size={20} /> {isLogin ? t.auth.login : t.auth.register}
          </button>
        </form>

        <div className="mt-8 text-center text-gray-400 font-bold">
          {isLogin ? t.auth.noAccount : t.auth.haveAccount}{' '}
          <span onClick={() => setIsLogin(!isLogin)} className="text-blue-400 hover:text-blue-300 cursor-pointer transition-colors font-black border-b-2 border-blue-400/20 pb-0.5 ml-1">
            {isLogin ? t.auth.register : t.auth.login}
          </span>
        </div>
      </div>
    </div>
  );
};

const HomeView = ({ navigate }) => {
  const { t, tmdbLang } = useI18n();
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [trendingTV, setTrendingTV] = useState([]);
  const [editorsPick, setEditorsPick] = useState(null);
  const [heroMedia, setHeroMedia] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [trendIndex, setTrendIndex] = useState(0);

  useEffect(() => {
    const trendTimer = setInterval(() => {
      setTrendIndex((prev) => (prev + 1) % (t.home.trends?.length || 1));
    }, 4000); 
    return () => clearInterval(trendTimer);
  }, [t.home.trends]);

  useEffect(() => {
    const fetchHomeData = async () => {
      setLoading(true);
      const [moviesRes, tvRes, editorRes] = await Promise.all([
        fetchTMDB('/trending/movie/week', tmdbLang),
        fetchTMDB('/trending/tv/week', tmdbLang),
        fetchTMDB('/movie/27205', tmdbLang)
      ]);

      if (moviesRes && moviesRes.results) {
        const formattedMovies = moviesRes.results.map(m => formatMediaCard(m, 'movie'));
        setTrendingMovies(formattedMovies);
        setHeroMedia(formattedMovies[0]); 
      }
      if (tvRes && tvRes.results) {
        setTrendingTV(tvRes.results.map(m => formatMediaCard(m, 'tv')));
      }
      if (editorRes) {
        setEditorsPick(formatMediaCard(editorRes, 'movie'));
      }
      setLoading(false);
    };

    fetchHomeData();
  }, [tmdbLang]);

  if (loading) return <div className="h-screen flex items-center justify-center text-white text-2xl font-black tracking-widest animate-pulse">{t.home.loading}</div>;
  if (!heroMedia) return <div className="h-screen flex items-center justify-center text-white">Bağlantı hatası.</div>;

  return (
    <div className="pb-20">
      <div className="relative h-[80vh] w-full cursor-pointer group" onClick={() => navigate('media', heroMedia.id, heroMedia.type)}>
        <img src={heroMedia.backdrop} alt={heroMedia.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/20 to-transparent" />
        
        <div className="absolute bottom-0 left-0 p-8 md:p-16 max-w-5xl">
          <div className="flex items-center space-x-4 text-white/60 mb-6 text-sm font-black tracking-[0.3em] uppercase h-6 overflow-hidden">
            <TrendingUp size={18} className="text-blue-500" />
            <span key={trendIndex} className="animate-in slide-in-from-bottom duration-500">{t.home.trends[trendIndex]}</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter drop-shadow-2xl leading-none italic">{heroMedia.title}</h1>
          
          <div className="flex items-center gap-6 mb-8">
            <span className="bg-[#f5c518] text-black text-md font-black px-3 py-1 rounded-lg shadow-2xl flex items-center tracking-tight">
               <Star size={16} className="mr-2 fill-black" /> {heroMedia.imdbRating}
            </span>
            <span className="text-xl font-black text-white/40">{heroMedia.year}</span>
          </div>

          <div className="flex space-x-4">
            <button className="bg-white text-black px-10 py-4 rounded-full font-black text-md flex items-center hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all hover:scale-105 active:scale-95">
              <PlayCircle size={22} className="mr-3" /> {t.media.readMore}
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-12 -mt-16 relative z-10 space-y-20">
        {editorsPick && (
          <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-white/5 p-10 group cursor-pointer" onClick={() => navigate('media', editorsPick.id, 'movie')}>
            <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 group-hover:opacity-40 transition-opacity duration-700">
               <img src={editorsPick.backdrop} className="w-full h-full object-cover rounded-l-full" />
               <div className="absolute inset-0 bg-gradient-to-l from-transparent to-gray-950" />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-10">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 bg-white text-black px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest mb-4">
                  <Sparkles size={14} /> {t.home.editorsChoice}
                </div>
                <h3 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tighter">{editorsPick.title}</h3>
                <p className="text-lg text-gray-400 max-w-xl font-bold italic mb-6">{t.home.editorsNote}</p>
                <div className="flex items-center gap-4">
                  <span className="text-white/60 font-black text-xs uppercase tracking-widest">{editorsPick.year}</span>
                  <span className="text-blue-500 font-black">•</span>
                  <span className="text-white/60 font-black text-xs uppercase tracking-widest flex items-center gap-1"><Star size={12} className="fill-blue-500 text-blue-500"/> {editorsPick.imdbRating}</span>
                </div>
              </div>
            </div>
          </section>
        )}

        <section>
          <h2 className="text-3xl font-black text-white mb-8 flex items-center tracking-tight gap-4">
            <div className="w-1.5 h-8 bg-rose-600 rounded-full" /> {t.home.trendingMovies}
          </h2>
          <div className="flex gap-8 overflow-x-auto pb-8 scrollbar-hide px-2">
            {trendingMovies.slice(1).map(media => (
              <MediaCard key={`m-${media.id}`} media={media} onClick={(id, type) => navigate('media', id, type)} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-black text-white mb-8 flex items-center tracking-tight gap-4">
             <div className="w-1.5 h-8 bg-blue-600 rounded-full" /> {t.home.trendingTV}
          </h2>
          <div className="flex gap-8 overflow-x-auto pb-8 scrollbar-hide px-2">
            {trendingTV.map(media => (
              <MediaCard key={`t-${media.id}`} media={media} onClick={(id, type) => navigate('media', id, type)} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

const MediaDetailView = ({ mediaId, mediaType = 'movie' }) => {
  const { t, tmdbLang } = useI18n();
  const { userData, updateMediaStatus, toggleList } = useData();
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPosterExpanded, setIsPosterExpanded] = useState(false);

  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      const [details, credits] = await Promise.all([
        fetchTMDB(`/${mediaType}/${mediaId}`, tmdbLang),
        fetchTMDB(`/${mediaType}/${mediaId}/credits`, tmdbLang)
      ]);

      if (details) {
        const formatted = formatMediaCard(details, mediaType);
        formatted.genres = details.genres ? details.genres.map(g => g.name) : [];
        if (credits) {
          formatted.cast = credits.cast.slice(0, 4).map(c => c.name);
          const dir = credits.crew.find(c => c.job === 'Director' || c.department === 'Directing');
          formatted.director = dir ? dir.name : 'Bilinmiyor';
        } else {
          formatted.cast = [];
          formatted.director = 'Bilinmiyor';
        }
        setMedia(formatted);

        const existingProgress = userData.history[mediaId]?.progress;
        if (existingProgress) {
          setSeason(existingProgress.season);
          setEpisode(existingProgress.episode);
        }
      }
      setLoading(false);
    };
    
    fetchDetails();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [mediaId, mediaType, tmdbLang]);
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsPosterExpanded(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white text-xl font-black tracking-widest animate-pulse">ECLIPSE...</div>;
  if (!media) return <div className="min-h-screen flex items-center justify-center text-white text-xl">İçerik bulunamadı.</div>;

  const history = userData.history[media.id] || {};
  const inWatchlist = (userData.watchlist || []).some(m => m.id === media.id);
  const inFavorites = (userData.favorites || []).some(m => m.id === media.id);

  const StatusButton = ({ status, label, icon: Icon }) => {
    const isActive = history.status === status;
    return (
      <button 
        onClick={() => updateMediaStatus(media, status)}
        className={`flex items-center justify-center px-4 py-3 rounded-xl font-black transition-all shadow-xl text-[10px] uppercase tracking-widest ${
          isActive ? 'bg-white text-black ring-4 ring-white/10 scale-105' : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-600'
        }`}
      >
        <Icon size={14} className="mr-2" /> {label}
      </button>
    );
  };

  return (
    <div className="min-h-screen relative pb-20 bg-gray-950">
      
      {isPosterExpanded && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl animate-in fade-in duration-300 p-4" onClick={() => setIsPosterExpanded(false)}>
          <button className="absolute top-8 right-8 text-gray-400 hover:text-white transition-colors bg-white/10 p-3 rounded-full hover:bg-white/20" onClick={() => setIsPosterExpanded(false)}>
            <X size={32} />
          </button>
          <img src={media.highResPoster} alt={media.title} className="max-w-full max-h-[90vh] rounded-[2rem] shadow-[0_0_120px_rgba(59,130,246,0.2)] animate-in zoom-in-95 duration-500 cursor-default" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <div className="relative z-10">
        <div className="h-[60vh] w-full relative">
          <img src={media.backdrop} alt={media.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/90 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-8 -mt-64 relative">
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="w-72 flex-shrink-0 mx-auto lg:mx-0">
              <div className="relative group cursor-pointer" onClick={() => setIsPosterExpanded(true)}>
                <img src={media.poster} alt={media.title} className="w-full rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] border-4 border-gray-900 group-hover:border-blue-500 transition-colors duration-500" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-[2rem] flex items-center justify-center backdrop-blur-sm">
                  <Search size={40} className="text-white scale-75 group-hover:scale-100 transition-transform duration-500" />
                </div>
              </div>
              
              <div className="mt-8 space-y-3">
                {mediaType === 'tv' && (
                  <div className="bg-gray-900/50 p-5 rounded-[1.5rem] border border-white/5 shadow-2xl mb-4">
                    <h4 className="text-white font-black text-[9px] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <Clapperboard size={12} className="text-blue-400" /> {t.media.currentProgress}
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 font-bold text-[9px] uppercase">{t.media.season}</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setSeason(Math.max(1, season - 1))} className="text-gray-500 hover:text-white transition-colors"><MinusCircle size={18}/></button>
                          <span className="w-6 text-center text-white font-black text-md">{season}</span>
                          <button onClick={() => setSeason(season + 1)} className="text-gray-500 hover:text-white transition-colors"><PlusCircle size={18}/></button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 font-bold text-[9px] uppercase">{t.media.episode}</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEpisode(Math.max(1, episode - 1))} className="text-gray-500 hover:text-white transition-colors"><MinusCircle size={18}/></button>
                          <span className="w-6 text-center text-white font-black text-md">{episode}</span>
                          <button onClick={() => setEpisode(episode + 1)} className="text-gray-500 hover:text-white transition-colors"><PlusCircle size={18}/></button>
                        </div>
                      </div>
                      <button onClick={() => updateMediaStatus(media, history.status || 'watching', season, episode)} className="w-full bg-blue-600/20 text-blue-400 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white transition-all shadow-lg active:scale-95">
                        <Save size={12} /> {t.media.updateProgress}
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <StatusButton status="watched" label={t.media.watched} icon={Check} />
                  <StatusButton status="watching" label={t.media.watching} icon={PlayCircle} />
                </div>
                <StatusButton status="plan" label={t.media.plan} icon={Clock} />
                
                <div className="flex gap-3 pt-6 border-t border-white/5">
                  <button onClick={() => toggleList(media, 'watchlist')} className={`flex-1 py-4 rounded-xl flex justify-center items-center transition font-black text-[9px] uppercase tracking-[0.1em] border ${inWatchlist ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-900 text-gray-500 border-gray-800 hover:text-white'}`}>
                    {inWatchlist ? <Check size={14} className="mr-2"/> : <Plus size={14} className="mr-2"/>} {t.media.addToWatchlist}
                  </button>
                  <button onClick={() => toggleList(media, 'favorites')} className={`px-5 rounded-xl flex justify-center items-center transition border ${inFavorites ? 'bg-rose-600 border-rose-500 text-white' : 'bg-gray-900 text-gray-600 border-gray-800 hover:text-rose-500'}`}>
                    <Heart size={20} className={inFavorites ? "fill-current" : ""} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 pt-12">
              <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tighter leading-none italic">{media.title}</h1>
              
              <div className="flex flex-wrap items-center text-xs text-gray-400 gap-6 mb-10">
                <span className="flex items-center bg-[#f5c518] text-black px-3 py-1 rounded-lg font-black text-lg shadow-xl">
                  <Star size={18} className="mr-2 fill-black" /> {media.imdbRating}
                </span>
                <span className="text-xl font-black">{media.year}</span>
                <div className="flex gap-2">
                  {(media.genres || []).map(g => <span key={g} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest">{g}</span>)}
                </div>
              </div>

              <div className="mb-12">
                <p className="text-gray-400 leading-relaxed text-xl font-bold italic">{media.overview || "Özet bulunmuyor."}</p>
              </div>

              <div className="grid grid-cols-2 gap-8 border-t border-white/5 pt-8">
                <div>
                  <span className="block text-gray-600 text-[9px] mb-2 uppercase tracking-[0.2em] font-black">{t.media.director}</span>
                  <span className="text-white font-black text-xl">{media.director}</span>
                </div>
                <div>
                  <span className="block text-gray-600 text-[9px] mb-2 uppercase tracking-[0.2em] font-black">{t.media.cast}</span>
                  <span className="text-white font-black text-xl leading-tight">{(media.cast || []).join(', ')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SearchView = ({ navigate }) => {
  const { t, tmdbLang } = useI18n();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length > 2) {
        setIsSearching(true);
        const res = await fetchTMDB(`/search/multi`, tmdbLang + `&query=${encodeURIComponent(query)}`);
        if (res && res.results) {
          const filtered = res.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv');
          setResults(filtered.map(m => formatMediaCard(m, m.media_type)));
        }
        setIsSearching(false);
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query, tmdbLang]);

  return (
    <div className="max-w-7xl mx-auto px-8 py-32 min-h-screen">
      <div className="relative mb-20 max-w-4xl mx-auto">
        <Search className={`absolute left-8 top-1/2 -translate-y-1/2 ${isSearching ? 'text-blue-500 animate-pulse' : 'text-gray-700'}`} size={32} />
        <input 
          type="text" 
          autoFocus
          placeholder={t.search.placeholder}
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full bg-gray-900/40 backdrop-blur-2xl border-4 border-gray-900 text-white text-3xl md:text-4xl font-black px-24 py-8 rounded-[2.5rem] outline-none focus:border-blue-600 transition-all placeholder-gray-800"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
        {results.map(media => <MediaCard key={`s-${media.id}`} media={media} onClick={(id, type) => navigate('media', id, type)} />)}
      </div>
    </div>
  );
};

const ProfileView = ({ navigate }) => {
  const { t } = useI18n();
  const { userData, logout } = useData();
  
  const [watchedFilter, setWatchedFilter] = useState('all');
  const [favFilter, setFavFilter] = useState('all');
  const [watchlistFilter, setWatchlistFilter] = useState('all');

  const watchedEntries = Object.values(userData.history || {}).filter(h => h.status === 'watched' && h.media);
  const watchedItems = watchedEntries.map(h => ({ ...h.media, progress: h.progress }));
  
  const filteredWatched = watchedItems.filter(m => watchedFilter === 'all' || m.type === watchedFilter);
  const filteredFavs = (userData.favorites || []).filter(m => favFilter === 'all' || m.type === favFilter);
  const filteredWatchlist = (userData.watchlist || []).filter(m => watchlistFilter === 'all' || m.type === watchlistFilter);

  const FilterBar = ({ current, set }) => (
    <div className="flex gap-2 bg-gray-900/80 backdrop-blur-md p-1.5 rounded-xl border border-gray-800 shadow-xl self-start">
      {['all', 'movie', 'tv'].map(f => (
        <button
          key={f}
          onClick={() => set(f)}
          className={`px-4 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2 ${
            current === f ? 'bg-white text-black shadow-lg scale-105' : 'text-gray-500 hover:text-white hover:bg-white/5'
          }`}
        >
          {f !== 'all' && getTypeIcon(f)} {t.profile.filters[f]}
        </button>
      ))}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-8 py-32 min-h-screen relative">
      <div className="bg-gradient-to-br from-gray-900 to-black border border-white/5 rounded-[3rem] p-12 flex flex-col md:flex-row items-center justify-between gap-12 mb-20 shadow-2xl">
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="relative group">
             <div className="absolute inset-0 bg-blue-600 blur-2xl opacity-10 animate-pulse" />
             <UserInitials name={userData.displayName} size="lg" />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tighter italic leading-none">
              {userData.displayName || 'Traveler'}
            </h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-6">
              <div className="bg-black/50 px-6 py-4 rounded-2xl border border-white/5 shadow-inner">
                <div className="text-2xl font-black text-white flex items-center gap-2">
                  <Check size={20} className="text-green-500"/> {watchedItems.length}
                </div>
                <div className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mt-1">{t.profile.totalWatched}</div>
              </div>
              <div className="bg-black/50 px-6 py-4 rounded-2xl border border-white/5 shadow-inner">
                <div className="text-2xl font-black text-white flex items-center gap-2">
                  <Heart size={20} className="text-rose-500 fill-rose-500"/> {(userData.favorites || []).length}
                </div>
                <div className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mt-1">{t.profile.favorites}</div>
              </div>
            </div>
          </div>
        </div>
        
        <button onClick={() => { logout(); navigate('home'); }} className="flex items-center gap-2 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.1em] transition-all border border-red-500/10 active:scale-95">
          <LogOut size={18} /> {t.auth.logout}
        </button>
      </div>

      <div className="space-y-32">
        <section>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
            <h2 className="text-4xl font-black text-white mb-2 tracking-tighter italic flex items-center gap-3">
              <Check className="text-green-500" size={32} /> {t.profile.watched}
            </h2>
            <FilterBar current={watchedFilter} set={setWatchedFilter} />
          </div>
          {filteredWatched.length > 0 ? (
            <div className="flex gap-8 overflow-x-auto pb-8 scrollbar-hide px-2">
              {filteredWatched.map(media => <MediaCard key={`wh-${media.id}`} media={media} progress={media.progress} onClick={(id, type) => navigate('media', id, type)} />)}
            </div>
          ) : (
            <div className="bg-white/5 border border-white/5 rounded-[2rem] p-16 text-center text-gray-600 font-black text-xl tracking-tight">{t.profile.emptyFilter}</div>
          )}
        </section>

        <section>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
            <h2 className="text-4xl font-black text-white mb-2 tracking-tighter italic flex items-center gap-3">
              <Clock className="text-blue-500" size={32} /> {t.profile.watchlist}
            </h2>
            <FilterBar current={watchlistFilter} set={setWatchlistFilter} />
          </div>
          {filteredWatchlist.length > 0 ? (
            <div className="flex gap-8 overflow-x-auto pb-8 scrollbar-hide px-2">
              {filteredWatchlist.map(media => <MediaCard key={`w-${media.id}`} media={media} onClick={(id, type) => navigate('media', id, type)} />)}
            </div>
          ) : (
            <div className="bg-white/5 border border-white/5 rounded-[2rem] p-16 text-center text-gray-600 font-black text-xl tracking-tight">{t.profile.emptyFilter}</div>
          )}
        </section>

        <section>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
            <h2 className="text-4xl font-black text-white mb-2 tracking-tighter italic flex items-center gap-3">
              <Heart className="text-rose-500 fill-rose-500" size={32} /> {t.profile.favorites}
            </h2>
            <FilterBar current={favFilter} set={setFavFilter} />
          </div>
          {filteredFavs.length > 0 ? (
            <div className="flex gap-8 overflow-x-auto pb-8 scrollbar-hide px-2">
              {filteredFavs.map(media => <MediaCard key={`f-${media.id}`} media={media} onClick={(id, type) => navigate('media', id, type)} />)}
            </div>
          ) : (
            <div className="bg-white/5 border border-white/5 rounded-[2rem] p-16 text-center text-gray-600 font-black text-xl tracking-tight">{t.profile.emptyFilter}</div>
          )}
        </section>
      </div>
    </div>
  );
};

// ==========================================
// 5. ANA APP BİLEŞENİ
// ==========================================
export default function App() {
  return (
    <I18nProvider>
      <DataProvider>
        <AppLayout />
      </DataProvider>
    </I18nProvider>
  );
}

const AppLayout = () => {
  const { t, lang, toggleLang } = useI18n();
  const { userData } = useData();
  const [currentRoute, setCurrentRoute] = useState({ view: 'home', id: null, type: 'movie' });
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigate = (view, id = null, type = 'movie') => {
    setCurrentRoute({ view, id, type });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderView = () => {
    switch (currentRoute.view) {
      case 'home': return <HomeView navigate={navigate} />;
      case 'media': return <MediaDetailView mediaId={currentRoute.id} mediaType={currentRoute.type} />;
      case 'search': return <SearchView navigate={navigate} />;
      case 'profile': return <ProfileView navigate={navigate} />;
      case 'auth': return <AuthView navigate={navigate} />;
      default: return <HomeView navigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-blue-600/30 overflow-x-hidden">
      <nav className={`fixed top-0 w-full z-50 transition-all duration-700 ${scrolled ? 'bg-gray-950/90 backdrop-blur-2xl py-4 border-b border-white/5' : 'bg-transparent py-8'}`}>
        <div className="max-w-[120rem] mx-auto px-8 flex justify-between items-center">
          <div className="flex items-center gap-16">
            <div className="text-3xl font-black tracking-tighter text-white cursor-pointer flex items-center gap-2 transition-transform hover:scale-105" onClick={() => navigate('home')}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center transform rotate-12">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
              <span className="italic">ECLIPSE</span>
            </div>
            <div className="hidden lg:flex items-center gap-10 font-black text-[10px] uppercase tracking-[0.3em] text-gray-500">
              <button onClick={() => navigate('home')} className="hover:text-white transition-colors">{t.nav.home}</button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('search')} className="text-gray-400 hover:text-white transition-all p-3 rounded-xl hover:bg-white/5">
              <Search size={18} />
            </button>
            <button onClick={toggleLang} className="text-gray-400 hover:text-white transition-all flex items-center gap-2 p-3 rounded-xl hover:bg-white/5 font-black uppercase text-[10px] tracking-widest">
              <Globe size={16} /> {lang}
            </button>
            
            {userData.displayName ? (
              <button onClick={() => navigate('profile')} className="flex items-center gap-3 text-white bg-white/10 hover:bg-white/20 px-6 py-2.5 rounded-xl transition-all border border-white/5 shadow-xl font-black text-[10px] uppercase tracking-widest">
                <UserInitials name={userData.displayName} size="sm" />
                <span className="hidden sm:inline">{userData.displayName}</span>
              </button>
            ) : (
              <button onClick={() => navigate('auth')} className="flex items-center gap-2 text-black bg-white hover:bg-gray-200 px-8 py-3 rounded-xl transition-all shadow-xl font-black text-[10px] uppercase tracking-[0.1em]">
                <User size={16} /> {t.auth.login}
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="min-h-screen">
        {renderView()}
      </main>

      <footer className="bg-black py-20 text-center border-t border-white/5 relative z-10">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-gray-700 to-gray-500 flex items-center justify-center opacity-20">
            <div className="w-2 h-2 bg-black rounded-full"></div>
          </div>
          <span className="font-black tracking-[0.3em] text-gray-700 text-2xl italic">ECLIPSE</span>
        </div>
        <p className="font-black text-gray-600 uppercase tracking-widest text-[9px] mb-2">Premium Personal Media Tracker & Discoverer</p>
        <p className="text-[8px] text-gray-800 font-bold uppercase tracking-[0.1em]">Utilizing TMDB API for demonstration purposes.</p>
      </footer>
    </div>
  );
}