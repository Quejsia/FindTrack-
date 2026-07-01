const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
const startTag = '{/* PANEL: CATEGORIES BROWSER */}';
const endTag = '{/* PANEL: ANALYTICS DESK */}';
const startIndex = code.indexOf(startTag);
const endIndex = code.indexOf(endTag, startIndex);
if (startIndex === -1 || endIndex === -1) {
    console.log('Could not find boundaries');
    process.exit(1);
}

const replacement = `{/* PANEL: CATEGORIES BROWSER */}
            <section
              id="categories"
              className={\`\${activeTab === "categories" ? "block" : "hidden"}\`}
            >
              <div className="max-w-6xl mx-auto space-y-8">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="font-headline-lg text-3xl font-bold text-on-surface">Browse Categories</h2>
                    <p className="font-body-md text-on-surface-variant mt-2">Filter lost and found items by type.</p>
                  </div>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Category 1 */}
                  <div 
                    className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant hover:border-primary hover:shadow-md transition-all cursor-pointer group flex flex-col items-center text-center"
                    onClick={() => {
                      setCategoryKeywords(["bag", "backpack", "purse", "wallet", "luggage", "suitcase", "handbag"]);
                      setActiveTab("search");
                    }}
                  >
                    <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mb-4 text-3xl group-hover:scale-110 transition-transform">
                      🎒
                    </div>
                    <h3 className="font-headline-md font-bold text-on-surface mb-2">Bags &amp; Backpacks</h3>
                    <p className="text-sm text-on-surface-variant mb-4">Purses, wallets, luggage, etc.</p>
                    <div className="mt-auto inline-flex items-center gap-1.5 px-3 py-1 bg-surface-variant text-on-surface-variant rounded-full text-xs font-bold">
                      {items.filter(i => ["bag", "backpack", "purse", "wallet", "luggage", "suitcase", "handbag"].some(kw => i.title.toLowerCase().includes(kw) || i.desc?.toLowerCase().includes(kw))).length} Items Active
                    </div>
                  </div>

                  {/* Category 2 */}
                  <div 
                    className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant hover:border-primary hover:shadow-md transition-all cursor-pointer group flex flex-col items-center text-center"
                    onClick={() => {
                      setCategoryKeywords(["phone", "laptop", "tablet", "charger", "headphone", "earphone", "computer", "iphone", "samsung", "ipad", "macbook"]);
                      setActiveTab("search");
                    }}
                  >
                    <div className="w-16 h-16 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Smartphone className="h-8 w-8" />
                    </div>
                    <h3 className="font-headline-md font-bold text-on-surface mb-2">Electronics</h3>
                    <p className="text-sm text-on-surface-variant mb-4">Phones, laptops, tablets, chargers</p>
                    <div className="mt-auto inline-flex items-center gap-1.5 px-3 py-1 bg-surface-variant text-on-surface-variant rounded-full text-xs font-bold">
                      {items.filter(i => ["phone", "laptop", "tablet", "charger", "headphone", "earphone", "computer", "iphone", "samsung", "ipad", "macbook"].some(kw => i.title.toLowerCase().includes(kw) || i.desc?.toLowerCase().includes(kw))).length} Items Active
                    </div>
                  </div>

                  {/* Category 3 */}
                  <div 
                    className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant hover:border-primary hover:shadow-md transition-all cursor-pointer group flex flex-col items-center text-center"
                    onClick={() => {
                      setCategoryKeywords(["book", "notebook", "textbook", "pen", "pencil", "id", "card", "stationery", "notes"]);
                      setActiveTab("search");
                    }}
                  >
                    <div className="w-16 h-16 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Info className="h-8 w-8" />
                    </div>
                    <h3 className="font-headline-md font-bold text-on-surface mb-2">Books &amp; Stationery</h3>
                    <p className="text-sm text-on-surface-variant mb-4">Textbooks, IDs, pens, notes</p>
                    <div className="mt-auto inline-flex items-center gap-1.5 px-3 py-1 bg-surface-variant text-on-surface-variant rounded-full text-xs font-bold">
                      {items.filter(i => ["book", "notebook", "textbook", "pen", "pencil", "id", "card", "stationery", "notes"].some(kw => i.title.toLowerCase().includes(kw) || i.desc?.toLowerCase().includes(kw))).length} Items Active
                    </div>
                  </div>

                  {/* Category 4 */}
                  <div 
                    className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant hover:border-primary hover:shadow-md transition-all cursor-pointer group flex flex-col items-center text-center"
                    onClick={() => {
                      setCategoryKeywords(["jacket", "shirt", "pants", "uniform", "glasses", "watch", "coat", "shoes", "hat", "scarf"]);
                      setActiveTab("search");
                    }}
                  >
                    <div className="w-16 h-16 rounded-full bg-error-container text-on-error-container flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Tag className="h-8 w-8" />
                    </div>
                    <h3 className="font-headline-md font-bold text-on-surface mb-2">Clothing &amp; Accs.</h3>
                    <p className="text-sm text-on-surface-variant mb-4">Jackets, uniforms, glasses, watches</p>
                    <div className="mt-auto inline-flex items-center gap-1.5 px-3 py-1 bg-surface-variant text-on-surface-variant rounded-full text-xs font-bold">
                      {items.filter(i => ["jacket", "shirt", "pants", "uniform", "glasses", "watch", "coat", "shoes", "hat", "scarf"].some(kw => i.title.toLowerCase().includes(kw) || i.desc?.toLowerCase().includes(kw))).length} Items Active
                    </div>
                  </div>
                </div>
              </div>
            </section>

            `;

code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
fs.writeFileSync('src/App.tsx', code);
console.log('Replaced categories layout.');
