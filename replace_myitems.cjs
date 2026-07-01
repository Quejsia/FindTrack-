const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
const startTag = '{/* PANEL: MY ITEMS */}';
const endTag = '{/* PANEL: PINNED ITEMS */}';
const startIndex = code.indexOf(startTag);
const endIndex = code.indexOf(endTag, startIndex);
if (startIndex === -1 || endIndex === -1) {
    console.log('Could not find boundaries');
    process.exit(1);
}

const replacement = `{/* PANEL: MY ITEMS */}
            <section
              id="myitems"
              className={\`\${activeTab === "myitems" ? "block" : "hidden"}\`}
            >
              <div className="max-w-6xl mx-auto space-y-8">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="font-headline-lg text-3xl font-bold text-on-surface">My Items</h2>
                    <p className="font-body-md text-on-surface-variant mt-2">Manage your reported lost and found items.</p>
                  </div>
                  <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 font-label-md font-bold border border-outline rounded-lg text-on-surface hover:bg-surface-variant transition-colors">
                      <Filter className="h-4 w-4" /> Filter
                    </button>
                    <button 
                      onClick={() => setActiveTab("report")}
                      className="flex items-center gap-2 px-4 py-2 font-label-md font-bold bg-primary text-on-primary rounded-lg shadow-sm hover:bg-primary-dim transition-colors"
                    >
                      <PlusCircle className="h-4 w-4" /> Report New
                    </button>
                  </div>
                </header>

                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 border-b border-outline-variant">
                  <button className="px-4 py-2 font-label-md font-bold text-primary border-b-2 border-primary whitespace-nowrap">
                    Active ({items.filter(i => i.userId === auth.currentUser?.uid && !i.claimed).length})
                  </button>
                  <button className="px-4 py-2 font-label-md font-medium text-on-surface-variant hover:text-on-surface whitespace-nowrap">
                    Resolved ({items.filter(i => i.userId === auth.currentUser?.uid && i.claimed).length})
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {items
                    .filter((item) => item.userId === auth.currentUser?.uid)
                    .map((r) => {
                      const pinned = pinnedIds.includes(r.id);
                      return (
                        <div key={r.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
                          <div 
                            className="relative h-48 bg-surface-variant overflow-hidden cursor-pointer"
                            onClick={() => {
                              setSelectedItemId(r.id);
                              setActiveTab("itemDetail");
                            }}
                          >
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
                              className={\`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-colors \${
                                pinned ? "bg-tertiary-container text-on-tertiary-container" : "bg-black/30 text-white hover:bg-black/50"
                              }\`}
                            >
                              <MapPin className="h-4 w-4" fill={pinned ? "currentColor" : "none"} />
                            </button>
                          </div>
                          <div className="p-5 flex-1 flex flex-col">
                            <h3 
                              className="font-headline-md text-lg font-bold text-on-surface mb-2 cursor-pointer hover:text-primary transition-colors line-clamp-1"
                              onClick={() => {
                                setSelectedItemId(r.id);
                                setActiveTab("itemDetail");
                              }}
                            >
                              {r.title}
                            </h3>
                            <div className="space-y-1.5 mb-4 flex-1">
                              <p className="flex items-center text-sm text-on-surface-variant">
                                <MapPin className="h-4 w-4 mr-2 text-outline shrink-0" />
                                <span className="truncate">{r.location}</span>
                              </p>
                              <p className="flex items-center text-sm text-on-surface-variant">
                                <Clock className="h-4 w-4 mr-2 text-outline shrink-0" />
                                <span>{r.createdAt ? new Date(r.createdAt.seconds ? r.createdAt.seconds * 1000 : r.createdAt).toLocaleDateString() : 'Recent'}</span>
                              </p>
                            </div>
                            <div className="pt-4 border-t border-outline-variant flex justify-between items-center">
                              <button 
                                onClick={() => {
                                  setSelectedItemId(r.id);
                                  setActiveTab("itemDetail");
                                }}
                                className="text-sm font-bold text-primary hover:text-primary-dim"
                              >
                                View Details
                              </button>
                              <button 
                                onClick={() => handleDelete(r.id)}
                                className="text-sm font-bold text-error hover:text-error-container"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  
                  {items.filter((item) => item.userId === auth.currentUser?.uid).length === 0 && (
                    <div className="col-span-full py-16 text-center border-2 border-dashed border-outline-variant rounded-2xl bg-surface-container-lowest">
                      <Inbox className="h-12 w-12 text-outline mx-auto mb-4" />
                      <h3 className="font-headline-md text-lg font-bold text-on-surface mb-2">No items yet</h3>
                      <p className="text-on-surface-variant mb-6">You haven't reported any lost or found items.</p>
                      <button 
                        onClick={() => setActiveTab("report")}
                        className="inline-flex items-center gap-2 px-6 py-2.5 font-label-md font-bold bg-primary text-on-primary rounded-lg shadow-sm hover:bg-primary-dim transition-colors"
                      >
                        <PlusCircle className="h-4 w-4" /> Report an Item
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>

            `;

code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
fs.writeFileSync('src/App.tsx', code);
console.log('Replaced my items layout.');
