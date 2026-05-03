import { Map, Calendar, Wallet, Sparkles, Plane, Loader2, Bell, Plus, Trash2, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateItinerary, TripPreferences } from './services/gemini';

interface Reminder {
  id: string;
  title: string;
  date: string;
  time: string;
  completed: boolean;
}

export default function App() {
  const [prefs, setPrefs] = useState<TripPreferences>({
    destination: '',
    duration: 3,
    vibe: 'Relaxing',
    budget: 'Moderate'
  });
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState<string | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: '',
    date: '',
    time: ''
  });
  const [savedTrips, setSavedTrips] = useState<Array<{prefs: TripPreferences, itinerary: string, reminders: Reminder[]}>>([]);

  useEffect(() => {
    // Load saved trips from localStorage
    const saved = localStorage.getItem('ai-trip-planner-trips');
    if (saved) {
      setSavedTrips(JSON.parse(saved));
    }

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Check for due reminders every minute
    const checkReminders = () => {
      const now = new Date();
      reminders.forEach(reminder => {
        if (!reminder.completed) {
          const reminderTime = new Date(`${reminder.date}T${reminder.time}`);
          if (reminderTime <= now && reminderTime > new Date(now.getTime() - 60000)) { // Within last minute
            if (Notification.permission === 'granted') {
              new Notification('Trip Reminder', {
                body: reminder.title,
                icon: '/vite.svg'
              });
            }
            // Mark as completed
            setReminders(prev => prev.map(r => 
              r.id === reminder.id ? {...r, completed: true} : r
            ));
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [reminders]);

  const addReminder = () => {
    if (!newReminder.title || !newReminder.date || !newReminder.time) return;
    
    const reminder: Reminder = {
      id: Date.now().toString(),
      title: newReminder.title,
      date: newReminder.date,
      time: newReminder.time,
      completed: false
    };
    
    setReminders(prev => [...prev, reminder]);
    setNewReminder({ title: '', date: '', time: '' });
    setShowReminderForm(false);
  };

  const deleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const saveTrip = () => {
    if (!itinerary) return;
    
    const trip = {
      prefs,
      itinerary,
      reminders
    };
    
    const updatedTrips = [...savedTrips, trip];
    setSavedTrips(updatedTrips);
    localStorage.setItem('ai-trip-planner-trips', JSON.stringify(updatedTrips));
    
    alert('Trip saved successfully!');
  };

  const loadTrip = (trip: {prefs: TripPreferences, itinerary: string, reminders: Reminder[]}) => {
    setPrefs(trip.prefs);
    setItinerary(trip.itinerary);
    setReminders(trip.reminders);
  };

  const exportTrip = () => {
    if (!itinerary) return;
    
    const tripData = {
      preferences: prefs,
      itinerary: itinerary,
      reminders: reminders,
      exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(tripData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `trip-to-${prefs.destination.replace(/\s+/g, '-').toLowerCase()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prefs.destination) return;
    
    setLoading(true);
    try {
      const result = await generateItinerary(prefs);
      setItinerary(result);
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Please try again.';
      setItinerary(`An error occurred while generating your itinerary. ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-slate-900 font-sans selection:bg-orange-200">
      
      {/* Hero Section */}
      <div className="bg-[#FF6B35] text-white pt-16 pb-24 px-6 md:px-12 rounded-b-[3rem] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row gap-8 items-center justify-between">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold uppercase tracking-wider backdrop-blur-sm mb-6">
              <Plane className="w-4 h-4" /> AI Trip Planner
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4 leading-[1.1]">
              Design your perfect escape.
            </h1>
            <p className="text-orange-50 text-lg md:text-xl font-medium opacity-90 max-w-md">
              Tell us where you want to go. We'll handle the itinerary, bookings, and packing list.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 md:px-12 -mt-12 relative z-20 pb-24">
        
        {!itinerary && !loading && (
          <form onSubmit={handleGenerate} className="bg-white rounded-3xl shadow-xl shadow-orange-900/5 p-8 border border-slate-100/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Map className="w-4 h-4" /> Destination
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kyoto, Japan"
                  required
                  className="w-full text-xl md:text-2xl font-medium text-slate-800 placeholder-slate-300 border-b-2 border-slate-100 focus:border-orange-500 outline-none py-2 transition-colors bg-transparent"
                  value={prefs.destination}
                  onChange={e => setPrefs({...prefs, destination: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Duration (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  required
                  className="w-full text-xl md:text-2xl font-medium text-slate-800 placeholder-slate-300 border-b-2 border-slate-100 focus:border-orange-500 outline-none py-2 transition-colors bg-transparent"
                  value={prefs.duration}
                  onChange={e => setPrefs({...prefs, duration: parseInt(e.target.value) || 1})}
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Trip Vibe
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Relaxing', 'Adventure', 'Cultural', 'Foodie', 'Nightlife', 'Nature'].map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setPrefs({...prefs, vibe: v})}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        prefs.vibe === v 
                          ? 'bg-slate-900 text-white shadow-md' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Wallet className="w-4 h-4" /> Budget
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Budget Friendly', 'Moderate', 'Luxury'].map(b => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setPrefs({...prefs, budget: b})}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        prefs.budget === b 
                          ? 'bg-slate-900 text-white shadow-md' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-slate-100 flex justify-end">
              <button 
                type="submit"
                className="bg-[#FF6B35] hover:bg-[#E85D2A] text-white px-8 py-4 rounded-full font-bold text-lg transition-transform active:scale-95 shadow-lg shadow-orange-500/30 flex items-center gap-2"
              >
                Generate Itinerary <Sparkles className="w-5 h-5" />
              </button>
            </div>
          </form>
        )}

        {loading && (
          <div className="bg-white rounded-3xl shadow-xl shadow-orange-900/5 p-16 flex flex-col items-center justify-center border border-slate-100/50">
            <Loader2 className="w-12 h-12 text-[#FF6B35] animate-spin mb-6" />
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Crafting your perfect trip...</h3>
            <p className="text-slate-500">Curating the best spots for a {prefs.vibe.toLowerCase()} experience in {prefs.destination}.</p>
          </div>
        )}

        {itinerary && !loading && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-center mb-6">
              <button 
                onClick={() => setItinerary(null)}
                className="text-sm font-bold text-slate-500 hover:text-slate-900 uppercase tracking-wider transition-colors"
              >
                ← Plan Another Trip
              </button>
              <div className="flex gap-3">
                <button 
                  onClick={saveTrip}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full font-medium text-sm transition-colors flex items-center gap-2"
                >
                  Save Trip
                </button>
                <button 
                  onClick={exportTrip}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full font-medium text-sm transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Export
                </button>
                <button 
                  onClick={() => setShowReminderForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full font-medium text-sm transition-colors flex items-center gap-2"
                >
                  <Bell className="w-4 h-4" /> Add Reminder
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-white rounded-3xl shadow-xl shadow-orange-900/5 p-8 md:p-12 border border-slate-100/50 prose prose-slate prose-lg md:prose-xl max-w-none prose-headings:font-bold prose-h1:text-4xl prose-h1:text-[#FF6B35] prose-h2:text-2xl prose-h2:mt-10 md:prose-h2:mt-16 prose-h2:border-b prose-h2:pb-4 prose-h2:border-slate-100 prose-a:text-[#FF6B35] prose-a:no-underline hover:prose-a:underline prose-li:marker:text-orange-400">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {itinerary}
                  </ReactMarkdown>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="bg-white rounded-3xl shadow-xl shadow-orange-900/5 p-6 border border-slate-100/50">
                  <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-[#FF6B35]" /> Trip Reminders
                  </h3>
                  
                  {reminders.length === 0 ? (
                    <p className="text-slate-500 text-sm">No reminders set yet. Add some to stay organized!</p>
                  ) : (
                    <div className="space-y-3">
                      {reminders.map(reminder => (
                        <div key={reminder.id} className={`p-3 rounded-lg border ${reminder.completed ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className={`font-medium ${reminder.completed ? 'line-through text-green-700' : 'text-slate-800'}`}>
                                {reminder.title}
                              </h4>
                              <p className="text-sm text-slate-500">
                                {new Date(reminder.date).toLocaleDateString()} at {reminder.time}
                              </p>
                            </div>
                            <button 
                              onClick={() => deleteReminder(reminder.id)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {savedTrips.length > 0 && (
                  <div className="bg-white rounded-3xl shadow-xl shadow-orange-900/5 p-6 border border-slate-100/50">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Saved Trips</h3>
                    <div className="space-y-2">
                      {savedTrips.map((trip, index) => (
                        <button
                          key={index}
                          onClick={() => loadTrip(trip)}
                          className="w-full text-left p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                        >
                          <div className="font-medium text-slate-800">{trip.prefs.destination}</div>
                          <div className="text-sm text-slate-500">{trip.prefs.duration} days • {trip.prefs.vibe}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reminder Form Modal */}
        {showReminderForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full">
              <h3 className="text-2xl font-bold text-slate-800 mb-6">Add Trip Reminder</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Reminder Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Book flight tickets"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    value={newReminder.title}
                    onChange={e => setNewReminder({...newReminder, title: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    value={newReminder.date}
                    onChange={e => setNewReminder({...newReminder, date: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Time</label>
                  <input
                    type="time"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    value={newReminder.time}
                    onChange={e => setNewReminder({...newReminder, time: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => setShowReminderForm(false)}
                  className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={addReminder}
                  className="flex-1 bg-[#FF6B35] hover:bg-[#E85D2A] text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  Add Reminder
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

