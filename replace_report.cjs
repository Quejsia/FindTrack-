const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
const startTag = '{/* PANEL: REPORT SUBMISSION */}';
const endTag = '{/* PANEL: SEARCH REGISTRY */}';
const startIndex = code.indexOf(startTag);
const endIndex = code.indexOf(endTag, startIndex);
if (startIndex === -1 || endIndex === -1) {
    console.log('Could not find boundaries');
    process.exit(1);
}

const replacement = `{/* PANEL: REPORT SUBMISSION */}
            <section
              id="report"
              className={\`\${activeTab === "report" ? "block" : "hidden"}\`}
            >
              <div className="max-w-3xl mx-auto space-y-8">
                <header className="mb-8">
                  <h2 className="font-headline-lg text-3xl font-bold text-on-surface">Report an Item</h2>
                  <p className="font-body-md text-on-surface-variant mt-2">Fill in the details below. Our smart matching system will help find the owner or the item.</p>
                </header>

                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
                  {/* Stepper Header */}
                  <div className="flex border-b border-outline-variant bg-surface-variant/50">
                    <div className={\`flex-1 py-4 px-6 text-center text-sm font-bold border-b-2 \${reportStep >= 1 ? 'border-primary text-primary' : 'border-transparent text-outline'}\`}>
                      1. Basic Info
                    </div>
                    <div className={\`flex-1 py-4 px-6 text-center text-sm font-bold border-b-2 \${reportStep >= 2 ? 'border-primary text-primary' : 'border-transparent text-outline'}\`}>
                      2. Details
                    </div>
                    <div className={\`flex-1 py-4 px-6 text-center text-sm font-bold border-b-2 \${reportStep >= 3 ? 'border-primary text-primary' : 'border-transparent text-outline'}\`}>
                      3. Verification
                    </div>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (reportStep < 3) {
                        setReportStep(reportStep + 1);
                        return;
                      }
                      await handleSubmit(e);
                      setReportStep(1);
                    }}
                    className="p-6 md:p-8 space-y-6"
                  >
                    {/* STEP 1: Basic Info */}
                    <div className={\`space-y-6 \${reportStep === 1 ? 'block' : 'hidden'}\`}>
                      <div className="space-y-3">
                        <label className="block font-label-md font-bold text-on-surface">I am reporting a...</label>
                        <div className="grid grid-cols-2 gap-4">
                          <label className={\`cursor-pointer border rounded-xl p-4 flex flex-col items-center gap-2 transition-all \${reportType === "lost" ? "border-error text-error bg-error/5 ring-2 ring-error/20" : "border-outline-variant text-on-surface-variant hover:bg-surface-variant"}\`}>
                            <input type="radio" name="reportType" value="lost" checked={reportType === "lost"} onChange={() => setReportType("lost")} className="sr-only" />
                            <Search className="h-6 w-6" />
                            <span className="font-bold">Lost Item</span>
                          </label>
                          <label className={\`cursor-pointer border rounded-xl p-4 flex flex-col items-center gap-2 transition-all \${reportType === "found" ? "border-primary text-primary bg-primary/5 ring-2 ring-primary/20" : "border-outline-variant text-on-surface-variant hover:bg-surface-variant"}\`}>
                            <input type="radio" name="reportType" value="found" checked={reportType === "found"} onChange={() => setReportType("found")} className="sr-only" />
                            <PackageCheck className="h-6 w-6" />
                            <span className="font-bold">Found Item</span>
                          </label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block font-label-md font-bold text-on-surface">Item Title</label>
                        <input type="text" required value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} placeholder="e.g. Blue Hydroflask" className="w-full bg-surface-variant border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none" />
                      </div>

                      <div className="space-y-2">
                        <label className="block font-label-md font-bold text-on-surface">Location {reportType === "lost" ? "Lost" : "Found"}</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-outline" />
                          <input type="text" required value={reportLocation} onChange={(e) => setReportLocation(e.target.value)} placeholder="e.g. Library 2nd Floor" className="w-full bg-surface-variant border-none rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-primary outline-none" />
                        </div>
                      </div>
                    </div>

                    {/* STEP 2: Details */}
                    <div className={\`space-y-6 \${reportStep === 2 ? 'block' : 'hidden'}\`}>
                      <div className="space-y-2">
                        <label className="block font-label-md font-bold text-on-surface">Description</label>
                        <textarea required value={reportDesc} onChange={(e) => setReportDesc(e.target.value)} rows={4} placeholder="Describe the item in detail (color, brand, unique marks...)" className="w-full bg-surface-variant border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none resize-none"></textarea>
                      </div>

                      <div className="space-y-2">
                        <label className="block font-label-md font-bold text-on-surface">Upload Image (Optional)</label>
                        <div className="border-2 border-dashed border-outline-variant rounded-xl p-8 text-center hover:bg-surface-variant transition-colors cursor-pointer relative">
                          <input type="file" accept="image/*" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setReportImageFile(file);
                              const reader = new FileReader();
                              reader.onload = (ev) => setReportImage(ev.target?.result as string);
                              reader.readAsDataURL(file);
                            }
                          }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                          {reportImage ? (
                            <div className="flex flex-col items-center">
                              <img src={reportImage} alt="Preview" className="h-32 object-contain rounded-lg mb-4 shadow-sm" />
                              <span className="text-sm font-medium text-primary">Change Image</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <Camera className="h-10 w-10 text-outline mb-3" />
                              <span className="text-sm font-medium text-on-surface">Click to upload or drag and drop</span>
                              <span className="text-xs text-on-surface-variant mt-1">PNG, JPG up to 5MB</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* STEP 3: Verification */}
                    <div className={\`space-y-6 \${reportStep === 3 ? 'block' : 'hidden'}\`}>
                      <div className="p-4 bg-primary-container text-on-primary-container rounded-xl text-sm mb-6">
                        <div className="flex items-start gap-3">
                          <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold mb-1">Protecting Ownership</p>
                            <p>To ensure this item is returned to its rightful owner, set a secret question that only the real owner would know.</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block font-label-md font-bold text-on-surface">Secret Verification Question</label>
                        <input type="text" required value={reportSecurityQuestion} onChange={(e) => setReportSecurityQuestion(e.target.value)} placeholder="e.g. What is the wallpaper on the lock screen?" className="w-full bg-surface-variant border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none" />
                      </div>

                      <div className="space-y-2">
                        <label className="block font-label-md font-bold text-on-surface">Secret Answer</label>
                        <input type="text" required value={reportSecurityAnswer} onChange={(e) => setReportSecurityAnswer(e.target.value)} placeholder="e.g. A picture of a dog" className="w-full bg-surface-variant border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none" />
                        <p className="text-xs text-on-surface-variant mt-1">This answer will be hidden and used for verification.</p>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-6 border-t border-outline-variant flex justify-between items-center mt-8">
                      {reportStep > 1 ? (
                        <button type="button" onClick={() => setReportStep(reportStep - 1)} className="px-6 py-2.5 rounded-full font-label-md font-bold text-on-surface border border-outline-variant hover:bg-surface-variant transition-colors">
                          Back
                        </button>
                      ) : <div></div>}
                      
                      <button type="submit" disabled={isUploading} className="px-6 py-2.5 rounded-full font-label-md font-bold bg-primary text-on-primary hover:bg-primary-dim transition-colors flex items-center gap-2 shadow-sm disabled:opacity-70">
                        {isUploading ? "Uploading..." : reportStep < 3 ? "Continue" : (
                          <><Send className="h-4 w-4" /> Submit Report</>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </section>

            `;

code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
fs.writeFileSync('src/App.tsx', code);
console.log('Replaced report layout.');
