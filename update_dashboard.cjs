const fs = require('fs');

const content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');

const startIdx1 = lines.findIndex(l => l.includes('<div className="min-h-screen text-slate-800">') && lines[lines.indexOf(l) - 1].includes('VIEW 4: MAIN DASHBOARD PORTAL'));
const endIdx1 = lines.findIndex((l, i) => i > startIdx1 && l.includes('          {/* MAIN PANELS INJECTION DESK */}'));

if (startIdx1 !== -1 && endIdx1 !== -1) {
  const replacement1 = `        <div className="min-h-screen flex flex-col md:flex-row bg-[#F4F1E1] text-slate-900 font-sans overflow-hidden">
          {/* Mobile Header */}
          <header className="md:hidden bg-[#1A7B72] text-white p-4 flex items-center justify-between sticky top-0 z-50">
            <div className="text-xl font-medium tracking-tight flex items-center gap-2">
              <Search className="h-5 w-5" />
              FindTrack
            </div>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
              <Menu className="h-6 w-6" />
            </button>
          </header>

          {/* Desktop Sidebar */}
          <aside className={\`\${sidebarOpen ? 'flex absolute inset-y-0 left-0 w-64 shadow-2xl z-50' : 'hidden'} md:flex flex-col w-64 bg-[#1A7B72] text-white p-6 min-h-screen shrink-0 md:sticky md:top-0 transition-all\`}>
            <div className="flex justify-between items-center mb-12">
              <div className="text-2xl font-semibold tracking-tight">
                FindTrack
              </div>
              <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <nav className="flex flex-col gap-2">
              <button onClick={() => { setActiveTab('home'); setSidebarOpen(false); }} className={\`text-left px-4 py-3 rounded-lg transition-colors \${activeTab === 'home' ? 'bg-white/20 font-medium' : 'hover:bg-white/10'}\`}>Dashboard</button>
              <button onClick={() => { setActiveTab('search'); setSidebarOpen(false); }} className={\`text-left px-4 py-3 rounded-lg transition-colors \${activeTab === 'search' ? 'bg-white/20 font-medium' : 'hover:bg-white/10'}\`}>Reports</button>
              <button onClick={() => { setActiveTab('notifications'); setSidebarOpen(false); }} className={\`text-left px-4 py-3 rounded-lg transition-colors \${activeTab === 'notifications' ? 'bg-white/20 font-medium' : 'hover:bg-white/10'}\`}>Community</button>
              <button onClick={() => { setActiveTab('profile'); setSidebarOpen(false); }} className={\`text-left px-4 py-3 rounded-lg transition-colors \${activeTab === 'profile' ? 'bg-white/20 font-medium' : 'hover:bg-white/10'}\`}>Settings</button>
            </nav>
            <div className="mt-auto pt-8 flex items-center gap-3 cursor-pointer opacity-80 hover:opacity-100 transition-opacity" onClick={logOut}>
              <LogOut className="h-5 w-5" /> Sign Out
            </div>
          </aside>

          {/* Mobile overlay */}
          {sidebarOpen && (
            <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
          )}

          {/* MAIN PANELS INJECTION DESK */}`;

  lines.splice(startIdx1, endIdx1 - startIdx1 + 1, replacement1);
}

const startIdx2 = lines.findIndex(l => l.includes('<main>'));
const endIdx2 = lines.findIndex((l, i) => i > startIdx2 && l.includes('            {/* PANEL: REPORT SUBMISSION */}'));

if (startIdx2 !== -1 && endIdx2 !== -1) {
  const replacement2 = `          <main className="flex-1 h-[100dvh] overflow-y-auto p-4 md:p-8 lg:p-10 relative bg-[#F4F1E1]">
            {/* PANEL: HOME */}
            <section
              id="home"
              className={\`\${activeTab === "home" ? "flex" : "hidden"} max-w-5xl mx-auto h-full flex-col\`}
            >
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                Magandang araw 👋
              </h1>
              
              {/* Stats row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-[#D3E8E5] p-5 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
                    <ShoppingBag className="w-8 h-8 text-[#1A7B72] mb-3" strokeWidth={1.5} />
                    <div className="text-sm font-medium text-[#15605A] leading-tight mb-1">Items<br/>Reported:</div>
                    <div className="text-3xl font-bold text-[#1A7B72]">{stats.lost + stats.found}</div>
                  </div>
                  <div className="bg-[#E2F0D9] p-5 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
                    <Search className="w-8 h-8 text-[#1A7B72] mb-3" strokeWidth={1.5} />
                    <div className="text-sm font-medium text-[#15605A] leading-tight mb-1">Items<br/>Found:</div>
                    <div className="text-3xl font-bold text-[#1A7B72]">{stats.found}</div>
                  </div>
                  <div className="bg-[#D3E8E5] p-5 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
                    <Users className="w-8 h-8 text-[#1A7B72] mb-3" strokeWidth={1.5} />
                    <div className="text-sm font-medium text-[#15605A] leading-tight mb-1">Community<br/>Members:</div>
                    <div className="text-3xl font-bold text-[#1A7B72]">250+</div>
                  </div>
                  <div className="bg-[#D3E8E5] p-5 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
                    <CheckSquare className="w-8 h-8 text-[#1A7B72] mb-3" strokeWidth={1.5} />
                    <div className="text-sm font-medium text-[#15605A] leading-tight mb-1">Recoveries<br/>This Week:</div>
                    <div className="text-3xl font-bold text-[#1A7B72]">{stats.claimed}</div>
                  </div>
              </div>

              {/* Content row */}
              <div className="grid md:grid-cols-2 gap-6 mb-8 flex-1 min-h-[400px]">
                  {/* Recent Community Activity */}
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col h-full">
                    <h2 className="text-xl font-bold text-slate-900 mb-6">Recent Community Activity</h2>
                    <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                      {items.slice(0, 6).map((r) => (
                        <div key={r.id} className="text-sm border-b border-slate-50 pb-4 last:border-0">
                          <span className="font-semibold text-slate-800">{r.type === 'lost' ? 'Lost' : 'Found'} {r.title}</span> {r.location ? \`in \${r.location}\` : ''} - 
                          <span className="text-slate-500 ml-1">Reported by {r.contactName?.split(' ')[0] || 'Member'} ({r.date ? new Date(r.date).toLocaleDateString() : 'recently'})</span>
                        </div>
                      ))}
                      {items.length === 0 && <div className="text-slate-500 text-sm">No recent activity.</div>}
                    </div>
                  </div>
                  
                  {/* Private Messages */}
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col h-full">
                    <h2 className="text-xl font-bold text-slate-900 mb-6">Private Messages</h2>
                    <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold shrink-0">JS</div>
                        <div className="bg-slate-100 rounded-2xl rounded-tl-none p-3 text-sm text-slate-700">
                          <div className="font-bold mb-1">Juan S.</div>
                          - Hi, I think I found your item... We actually dropped this item around your area?
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold shrink-0">MD</div>
                        <div className="bg-[#D3E8E5] rounded-2xl rounded-tl-none p-3 text-sm text-slate-700">
                          <div className="font-bold mb-1">Maria D.</div>
                          - Can you confirm the location... near a north store?
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold shrink-0">LG</div>
                        <div className="bg-slate-100 rounded-2xl rounded-tl-none p-3 text-sm text-slate-700">
                          <div className="font-bold mb-1">Leo G.</div>
                          - New match for your report... Step up now, speaker!
                        </div>
                      </div>
                    </div>
                  </div>
              </div>

              {/* Footer Banner */}
              <div className="mt-auto bg-[#1A7B72] text-white text-center py-5 px-6 rounded-2xl font-medium shadow-md">
                Every recovered item strengthens the community.
              </div>
            </section>`;

  lines.splice(startIdx2, endIdx2 - startIdx2, replacement2);
}

fs.writeFileSync('src/App.tsx', lines.join('\n'));
console.log('Success');
