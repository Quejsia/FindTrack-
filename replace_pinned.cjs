const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
const startTag = '{/* PANEL: PINNED ITEMS */}';
const endTag = '{/* PANEL: CATEGORIES BROWSER */}';
const startIndex = code.indexOf(startTag);
const endIndex = code.indexOf(endTag, startIndex);
if (startIndex === -1 || endIndex === -1) {
    console.log('Could not find boundaries');
    process.exit(1);
}

const replacement = `{/* PANEL: PINNED ITEMS */}
            <section
              id="pinned"
              className={\`\${activeTab === "pinned" ? "block" : "hidden"}\`}
            >
              <div className="max-w-6xl mx-auto space-y-8">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="font-headline-lg text-3xl font-bold text-on-surface">Pinned Items</h2>
                    <p className="font-body-md text-on-surface-variant mt-2">Quick access to items you are keeping track of.</p>
                  </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[240px]">
                  {items
                    .filter((item) => pinnedIds.includes(item.id))
                    .map((r, i) => {
                      const isLarge = i % 5 === 0;
                      return (
                        <div 
                          key={r.id} 
                          className={\`\${isLarge ? "md:col-span-2 md:row-span-2" : "col-span-1 row-span-1"} bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden hover:shadow-md transition-shadow group flex flex-col relative\`}
                          onClick={() => {
                            setSelectedItemId(r.id);
                            setActiveTab("itemDetail");
                          }}
                        >
                          <div className={\`\${isLarge ? "h-3/5" : "h-1/2"} bg-surface-variant relative overflow-hidden\`}>
                            {r.image || r.imageUrl ? (
                              <img src={r.image || r.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-outline">
                                <Camera className="h-10 w-10 opacity-30" />
                              </div>
                            )}
                            <div className="absolute top-3 left-3 flex gap-2">
                              <span className={\`px-2.5 py-1 text-xs font-bold rounded-full \${
                                r.claimed ? 'bg-primary-container text-on-primary-container' : 
                                r.type === 'found' ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'
                              }\`}>
                                {r.claimed ? 'RESOLVED' : r.type === 'found' ? 'FOUND ITEM' : 'LOST ITEM'}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePin(r.id);
                              }}
                              className="absolute top-3 right-3 p-2 rounded-full bg-tertiary-container text-on-tertiary-container backdrop-blur-md transition-colors hover:scale-110"
                            >
                              <MapPin className="h-4 w-4" fill="currentColor" />
                            </button>
                          </div>
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <h3 className={\`font-headline-md font-bold text-on-surface mb-1 truncate \${isLarge ? "text-xl" : "text-base"}\`}>
                                {r.title}
                              </h3>
                              <p className="flex items-center text-xs text-on-surface-variant">
                                <MapPin className="h-3 w-3 mr-1 text-outline shrink-0" />
                                <span className="truncate">{r.location}</span>
                              </p>
                            </div>
                            <div className="mt-2 text-xs text-on-surface-variant flex items-center justify-between">
                              <span>{r.createdAt ? new Date(r.createdAt.seconds ? r.createdAt.seconds * 1000 : r.createdAt).toLocaleDateString() : 'Recent'}</span>
                              <span className="font-bold text-primary">View Details &rarr;</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  
                  {items.filter((item) => pinnedIds.includes(item.id)).length === 0 && (
                    <div className="col-span-full py-16 text-center border-2 border-dashed border-outline-variant rounded-2xl bg-surface-container-lowest">
                      <MapPin className="h-12 w-12 text-outline mx-auto mb-4" />
                      <h3 className="font-headline-md text-lg font-bold text-on-surface mb-2">No pinned items</h3>
                      <p className="text-on-surface-variant mb-6">You haven't bookmarked any items yet.</p>
                      <button 
                        onClick={() => setActiveTab("search")}
                        className="inline-flex items-center gap-2 px-6 py-2.5 font-label-md font-bold bg-primary text-on-primary rounded-lg shadow-sm hover:bg-primary-dim transition-colors"
                      >
                        <Search className="h-4 w-4" /> Browse Items
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>

            `;

code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
fs.writeFileSync('src/App.tsx', code);
console.log('Replaced pinned items layout.');
