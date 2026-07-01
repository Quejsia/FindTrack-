const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
const startTag = '{/* ── VIEW 4: MAIN DASHBOARD PORTAL ── */}';
const endTag = '{/* MAIN PANELS INJECTION DESK */}';
const startIndex = code.indexOf(startTag);
const endIndex = code.indexOf(endTag, startIndex);
if (startIndex === -1 || endIndex === -1) {
    console.log('Could not find boundaries');
    process.exit(1);
}

const replacement = `{/* ── VIEW 4: MAIN DASHBOARD PORTAL ── */}
      {currentView === "dashboard" && (
        <div className="flex h-[100dvh] bg-surface-container-lowest text-on-surface font-body-md overflow-hidden">
          {/* SIDEBAR (Desktop) */}
          <aside className={\`fixed md:relative z-50 flex flex-col w-64 h-full bg-primary text-on-primary shadow-md transition-transform transform \${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0\`}>
            <div className="p-6 flex justify-between items-center shrink-0">
              <div>
                <h1 className="font-headline-lg text-2xl font-bold">FindTrack</h1>
                <p className="font-label-md text-on-primary/80 mt-1">Community Lost &amp; Found</p>
              </div>
              <button className="md:hidden" onClick={() => setSidebarOpen(false)}>✕</button>
            </div>
            <nav className="flex-1 overflow-y-auto space-y-1 px-4">
              {[
                { id: "home", label: "Home", icon: Home },
                { id: "report", label: "Report Item", icon: PlusCircle },
                { id: "search", label: "Search", icon: Search },
                { id: "notifications", label: "Alerts", icon: Bell },
                { id: "profile", label: "Profile", icon: UserIcon },
                { id: "myitems", label: "My Items", icon: Inbox },
                { id: "pinned", label: "Pinned Items", icon: MapPin },
                { id: "categories", label: "Categories", icon: Tag },
                { id: "analytics", label: "Analytics", icon: PenTool },
                { id: "tips", label: "Recovery Tips", icon: Info },
                { id: "packaging", label: "Packaging Tips", icon: Package },
                { id: "about", label: "About / Help", icon: CheckCircle2 }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (profileName === "Guest" && ["report", "notifications", "myitems", "pinned"].includes(item.id)) {
                      setShowGuestModal(true);
                    } else {
                      setActiveTab(item.id);
                      if (item.id === "home" || item.id === "search") setCategoryKeywords(null);
                    }
                    setSidebarOpen(false);
                  }}
                  className={\`w-full flex items-center px-4 py-3 rounded-lg transition-colors group \${
                    activeTab === item.id 
                      ? "bg-primary-container text-on-primary-container font-medium" 
                      : "text-on-primary hover:bg-white/10"
                  }\`}
                >
                  <item.icon className={\`h-5 w-5 mr-3 \${activeTab === item.id ? "text-on-primary-container" : ""}\`} />
                  <span className="text-sm">{item.label}</span>
                </button>
              ))}
            </nav>
            <div className="p-4 border-t border-on-primary/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg overflow-hidden shrink-0">
                  {profileName === "Guest" ? "G" : profileName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="text-sm font-medium truncate">{profileName}</div>
                  <div className="text-xs text-white/70 truncate">{profileEmail || "Guest User"}</div>
                </div>
              </div>
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 flex flex-col min-w-0 h-full">
            {/* TOP BAR */}
            <header className="h-16 shrink-0 flex items-center justify-between px-6 bg-surface-container-lowest border-b border-outline-variant z-40">
              <div className="flex items-center gap-4">
                <button 
                  className="md:hidden text-on-surface"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="relative hidden sm:block" onClick={() => setActiveTab('search')}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline" />
                  <input 
                    type="text" 
                    placeholder="Search community..."
                    className="pl-10 pr-4 py-2 bg-surface-container rounded-full text-sm border-none focus:ring-2 focus:ring-primary outline-none w-64 pointer-events-none"
                    readOnly
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    if (profileName === "Guest") setShowGuestModal(true);
                    else setActiveTab("report");
                  }}
                  className="hidden sm:flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-full text-sm font-medium hover:bg-primary-dim transition-colors"
                >
                  <PlusCircle className="h-4 w-4" />
                  Report Item
                </button>
                <button 
                  onClick={() => setActiveTab('notifications')}
                  className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors relative"
                >
                  <Bell className="h-5 w-5" />
                  {alerts.filter(a => !a.read).length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>}
                </button>
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold cursor-pointer">
                  {profileName === "Guest" ? "G" : profileName.charAt(0).toUpperCase()}
                </div>
              </div>
            </header>

            {/* MAIN PANELS INJECTION DESK */}
`;

code = code.substring(0, startIndex) + replacement + code.substring(endIndex + endTag.length);
fs.writeFileSync('src/App.tsx', code);
console.log('Replaced dashboard layout.');
