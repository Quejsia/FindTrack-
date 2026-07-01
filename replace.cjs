const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

const startMarker = '      {/* ── VIEW 1: LANDING PAGE ── */}';
const endMarker = '      {/* ── VIEW 2: LOGIN PAGE ── */}';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
    console.error('Markers not found');
    process.exit(1);
}

const newContent = `      {/* ── VIEW 1: LANDING PAGE ── */}
      {currentView === "landing" && (
        <div className="bg-[#fffbff] text-[#393927] font-sans antialiased overflow-x-hidden min-h-screen flex flex-col">
          {/* TopNavBar */}
          <header className="w-full top-0 z-50 bg-[#fffbff] shadow-sm sticky">
            <div className="flex justify-between items-center h-16 px-4 md:px-8 max-w-7xl mx-auto">
              <div className="font-sans text-2xl font-bold text-[#01725a] tracking-tight flex items-center gap-2">
                <MapPin className="h-6 w-6 text-[#01725a]" />
                FindTrack
              </div>
              <nav className="hidden md:flex items-center gap-6">
                <button onClick={() => setCurrentView("landing")} className="text-[#01725a] border-b-2 border-[#01725a] pb-1 font-medium text-sm hover:text-[#01725a] transition-colors duration-200">Home</button>
                <button className="text-[#666551] font-medium text-sm hover:text-[#01725a] transition-colors duration-200">How it Works</button>
                <button className="text-[#666551] font-medium text-sm hover:text-[#01725a] transition-colors duration-200">Community</button>
                <button className="text-[#666551] font-medium text-sm hover:text-[#01725a] transition-colors duration-200">Safety</button>
              </nav>
              <div className="flex items-center gap-4">
                <button onClick={() => setCurrentView("login")} className="hidden md:block text-[#666551] font-medium text-sm hover:text-[#01725a] transition-colors duration-200 scale-95 active:scale-90">Login</button>
                <button onClick={() => setCurrentView("signup")} className="bg-[#01725a] text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-[#00654f] transition-colors scale-95 active:scale-90">Get Started</button>
                {/* Mobile Menu Button */}
                <button 
                  className="md:hidden p-2 text-[#666551] hover:text-[#01725a]"
                  onClick={() => setLandingMenuOpen(!landingMenuOpen)}
                >
                  {landingMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>
            </div>
          </header>

          {/* Mobile Nav Dropdown */}
          {landingMenuOpen && (
            <div className="md:hidden absolute top-16 left-0 right-0 bg-white shadow-xl z-50 p-6 flex flex-col gap-4 border-b border-slate-100">
              <button className="text-left font-medium text-slate-700 hover:text-[#01725a] py-2">Home</button>
              <button className="text-left font-medium text-slate-700 hover:text-[#01725a] py-2">How it Works</button>
              <button className="text-left font-medium text-slate-700 hover:text-[#01725a] py-2">Community</button>
              <button className="text-left font-medium text-slate-700 hover:text-[#01725a] py-2">Safety</button>
              <hr className="border-slate-100 my-2" />
              <button 
                onClick={() => {
                  setLandingMenuOpen(false);
                  setCurrentView("login");
                }}
                className="text-left font-medium text-slate-700 hover:text-[#01725a] py-2"
              >
                Login
              </button>
              <button 
                onClick={() => {
                  setLandingMenuOpen(false);
                  setCurrentView("signup");
                }}
                className="bg-[#01725a] hover:bg-[#00654f] text-white px-6 py-3 rounded-lg font-semibold text-center transition-colors shadow-sm mt-2"
              >
                Get Started
              </button>
            </div>
          )}

          <main className="flex-1">
            {/* Hero Section */}
            <section className="relative min-h-[921px] flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 z-0">
                <img className="w-full h-full object-cover object-center" alt="Hero background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCDC3YRMFuO-lEwm9bKTIguR-1belAnXoHIgeigQ3q4SUYgObcsSiNUjHnpR_ZfqvyDsqJKY7pe4fPQ9fAxiXPLcUxQOJOcX6tgsnNpBIFjznIY1JDEnT0amN_j0g91NAtN4xOqL_xe6gYYA1U5PBGH18oRD2F1fn_Z1eAqQ2CYzkwKBwB-0d16PaU0F6IfiXoXHmT6Txuseum5Be0PuKe26wtdeMNMjFB0UJczwaKK0iUeWAfbVmcG-yd4WQJ83LfWGXw7GPVkDQ"/>
                <div className="absolute inset-0 bg-[#fffbff]/30 backdrop-blur-[2px]"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#fffbff] via-transparent to-transparent"></div>
              </div>
              <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 text-center mt-8 w-full">
                <div className="bg-white/85 backdrop-blur-md border border-white/30 p-8 md:p-12 rounded-xl inline-block max-w-3xl shadow-lg w-full">
                  <h1 className="font-sans text-4xl md:text-[48px] md:leading-[56px] font-bold text-[#00654f] mb-4">
                    Find what's lost.<br/>Restore community trust.
                  </h1>
                  <p className="font-sans text-lg text-[#666551] mb-8 max-w-2xl mx-auto">
                    FindTrack helps Filipinos recover lost belongings through trusted community reporting and verified recovery workflows.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button 
                      onClick={() => setCurrentView("signup")}
                      className="w-full sm:w-auto bg-[#fab83f] text-[#553900] px-6 py-3 rounded-lg font-semibold text-sm shadow-md hover:bg-[#ebaa32] transition-colors flex items-center justify-center gap-2"
                    >
                      <PlusCircle className="w-5 h-5" />
                      Start Reporting
                    </button>
                    <button 
                      onClick={handleGuestBrowse}
                      className="w-full sm:w-auto border-2 border-[#01725a] text-[#01725a] px-6 py-3 rounded-lg font-semibold text-sm hover:bg-[#01725a]/5 transition-colors"
                    >
                      How it Works
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Value Propositions (Bento Grid) */}
            <section className="py-24 bg-[#ffffff]">
              <div className="max-w-7xl mx-auto px-4 md:px-8">
                <div className="text-center mb-16">
                  <h2 className="font-sans text-3xl md:text-4xl font-bold text-[#00654f] mb-2">Three Pillars of Recovery</h2>
                  <p className="font-sans text-base text-[#666551] max-w-xl mx-auto">A seamless workflow designed to bring your items back home.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Pillar 1 */}
                  <div className="bg-[#f7f4df] rounded-xl p-6 flex flex-col items-start border border-[#bcbaa2]/30 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-[#9af4d6] text-[#005d49] rounded-full flex items-center justify-center mb-4">
                      <FileSearch className="w-6 h-6" />
                    </div>
                    <h3 className="font-sans text-xl font-bold text-[#00654f] mb-2">Report</h3>
                    <p className="font-sans text-base text-[#666551]">Quickly document lost or found items with AI-assisted details for precise matching.</p>
                  </div>
                  {/* Pillar 2 */}
                  <div className="bg-[#fdfae7] rounded-xl p-6 flex flex-col items-start border border-[#bcbaa2]/30 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-[#b5eedb] text-[#235b4c] rounded-full flex items-center justify-center mb-4">
                      <MessageSquareHeart className="w-6 h-6" />
                    </div>
                    <h3 className="font-sans text-xl font-bold text-[#00654f] mb-2">Connect</h3>
                    <p className="font-sans text-base text-[#666551]">Securely message community members when a match is found, protecting your privacy.</p>
                  </div>
                  {/* Pillar 3 */}
                  <div className="bg-[#f7f4df] rounded-xl p-6 flex flex-col items-start border border-[#bcbaa2]/30 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-[#fab83f] text-[#553900] rounded-full flex items-center justify-center mb-4">
                      <Handshake className="w-6 h-6" />
                    </div>
                    <h3 className="font-sans text-xl font-bold text-[#00654f] mb-2">Recover</h3>
                    <p className="font-sans text-base text-[#666551]">Follow verified hand-off protocols to ensure items return home safely and securely.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Community Section */}
            <section className="py-24 bg-[#f7f4df]">
              <div className="max-w-7xl mx-auto px-4 md:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <h2 className="font-sans text-3xl md:text-4xl font-bold text-[#00654f] mb-4">By the Community,<br/>For the Community.</h2>
                    <p className="font-sans text-lg text-[#666551] mb-6">Built on the foundation of Bayanihan, FindTrack empowers everyday Filipinos to look out for one another.</p>
                    <div className="flex gap-6 mb-8">
                      <div>
                        <div className="font-sans text-3xl font-bold text-[#01725a]">{new Set(items.map(i => i.userId)).size > 0 ? new Set(items.map(i => i.userId)).size + 250 : "250"}+</div>
                        <div className="font-sans text-sm font-medium text-[#666551]">Community Members</div>
                      </div>
                      <div className="w-px bg-[#bcbaa2]/50"></div>
                      <div>
                        <div className="font-sans text-3xl font-bold text-[#fab83f]">{stats.claimed > 0 ? stats.claimed + 50 : "50"}+</div>
                        <div className="font-sans text-sm font-medium text-[#666551]">Successful Recoveries</div>
                      </div>
                    </div>
                    {/* Testimonial Card */}
                    <div className="bg-white rounded-xl p-6 border border-[#bcbaa2]/30 shadow-sm relative">
                      <Quote className="absolute top-4 right-4 text-[#bcbaa2]/30 w-10 h-10" />
                      <p className="font-sans text-base text-[#393927] mb-4 italic relative z-10">"I lost my wallet in a busy market. Thanks to FindTrack and an honest neighbor, I had it back the same afternoon. It restored my faith in our community."</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#9af4d6] overflow-hidden">
                          <img className="w-full h-full object-cover" alt="Maria S." src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4mp2UcZ07sn0BvHPG_RPg-hm024ejxE91EzNfW7s6xnoXilpmLSUCtN6C2AYZXy-sR48N-w6_fvSH6QTbyzwMF6pl6wQ0-q2sIpEbMcgabPHHSf6Hx4aWsTviC8m4oK3scWANYbOv5zGDk1Q9vgQlRCObKfm-llTTArNahdDKtHc-BpKPyk4Xs1s5hebPDg9iOVdsghGdWA289RnCHnFDxECJFzpBFfVUE3knb29DlyxCKcoAIQzhH4cjKPYfo8_OrOuOrrjiRw"/>
                        </div>
                        <div>
                          <div className="font-sans text-sm text-[#393927] font-bold">Maria S.</div>
                          <div className="font-sans text-[10px] font-medium text-[#666551]">Community Hero</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="relative h-[400px] lg:h-[500px] rounded-xl overflow-hidden shadow-lg border border-[#bcbaa2]/20">
                    <img className="w-full h-full object-cover" alt="Community" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBxlGOvC8tUv_qZ8mbCzoTfeO2pcAAWluudEQ74nJYhDiM6dKFkJnXAMN2tK4YBhxIv0KPww3WsGnpb6KywmxGohTQ6i90nv7w2u0RVCecjGnzgkXMAWIJCDNduz3N6uzUJzOO2X6hUbk8TdWW4cPEa870HJ5Ah1QvAKbwvSknJT3Vri6FIhh8Mm_4iOGeknwaECR9sIKas-PM3QZqG2o9wpOSp-eQc4Fnpoc0yWIHqiDg4zXr3mFK3NE8g9xXChlUOf26yIrPeeg"/>
                  </div>
                </div>
              </div>
            </section>
          </main>

          {/* Footer */}
          <footer className="bg-[#ebe9cf] border-t border-[#bcbaa2]/30 w-full mt-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 px-4 md:px-8 max-w-7xl mx-auto">
              <div>
                <div className="font-sans text-2xl font-bold text-[#393927] mb-4 flex items-center gap-2"><MapPin className="h-6 w-6 text-[#01725a]"/>FindTrack</div>
                <p className="font-sans text-base text-[#666551] max-w-sm mb-4">© 2024 FindTrack Philippines. Empowering communities through trust and recovery.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <nav className="flex flex-col gap-3">
                  <a className="font-sans text-sm font-medium text-[#666551] hover:text-[#01725a] hover:underline transition-all opacity-80 hover:opacity-100 cursor-pointer">About Us</a>
                  <a onClick={() => { setCurrentView("privacy"); window.history.pushState(null, "", "/privacy"); }} className="font-sans text-sm font-medium text-[#666551] hover:text-[#01725a] hover:underline transition-all opacity-80 hover:opacity-100 cursor-pointer">Privacy Policy</a>
                  <a onClick={() => { setCurrentView("terms"); window.history.pushState(null, "", "/terms"); }} className="font-sans text-sm font-medium text-[#666551] hover:text-[#01725a] hover:underline transition-all opacity-80 hover:opacity-100 cursor-pointer">Terms of Service</a>
                </nav>
                <nav className="flex flex-col gap-3">
                  <a className="font-sans text-sm font-medium text-[#666551] hover:text-[#01725a] hover:underline transition-all opacity-80 hover:opacity-100 cursor-pointer">Safety Guidelines</a>
                  <a className="font-sans text-sm font-medium text-[#666551] hover:text-[#01725a] hover:underline transition-all opacity-80 hover:opacity-100 cursor-pointer">Help Center</a>
                  <a className="font-sans text-sm font-medium text-[#666551] hover:text-[#01725a] hover:underline transition-all opacity-80 hover:opacity-100 cursor-pointer">Contact Us</a>
                </nav>
              </div>
            </div>
          </footer>
        </div>
      )}
`;

const updatedContent = content.substring(0, startIndex) + newContent + content.substring(endIndex);
fs.writeFileSync('src/App.tsx', updatedContent);
console.log('Success');
