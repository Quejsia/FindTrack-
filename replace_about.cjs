const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
const startTag = '<section\n              id="about"';
const endTag = ' {/* SIDEBAR NAVIGATION DRAWERS */}';
const endTagFallback = '{/* ── VIEW 5: VERIFY EMAIL SCREEN ── */}'; // wait, it is at the end of the dashboard

const startIndex = code.indexOf(startTag);
if (startIndex === -1) {
    console.log('Could not find boundaries');
    process.exit(1);
}

// Find the end of the `<section id="about">`
// Since it's the last section before the main closing tags, let's find the closing `</main>` or similar.
const closingMain = code.indexOf('</main>', startIndex);
const endIndex = closingMain;

const replacement = `<section
              id="about"
              className={\`\${activeTab === "about" ? "block" : "hidden"}\`}
            >
              <div className="max-w-6xl mx-auto space-y-8">
                <header className="mb-8">
                  <h2 className="font-headline-lg text-3xl font-bold text-on-surface">About &amp; Help</h2>
                  <p className="font-body-md text-on-surface-variant mt-2">Everything you need to know about FindTrack.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-8 space-y-8">
                    {/* FAQ */}
                    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 md:p-8">
                      <h3 className="font-headline-md text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
                        <Info className="h-6 w-6 text-primary" /> Frequently Asked Questions
                      </h3>
                      
                      <div className="space-y-6">
                        <div className="border-b border-outline-variant pb-6">
                          <h4 className="font-bold text-on-surface mb-2">How do I verify ownership?</h4>
                          <p className="text-on-surface-variant text-sm">When you claim a found item, you must correctly answer the secret security question set by the finder. Additionally, the finder may request further proof of ownership via contact before handing over the item.</p>
                        </div>
                        <div className="border-b border-outline-variant pb-6">
                          <h4 className="font-bold text-on-surface mb-2">What happens when an item is claimed?</h4>
                          <p className="text-on-surface-variant text-sm">Once an item is successfully claimed and verified, its status changes to 'Resolved'. Contact details are then shared securely between both parties to arrange the return.</p>
                        </div>
                        <div>
                          <h4 className="font-bold text-on-surface mb-2">Is FindTrack free to use?</h4>
                          <p className="text-on-surface-variant text-sm">Yes, FindTrack is completely free for all community members. Our mission is to restore trust and reunite lost items with their rightful owners.</p>
                        </div>
                      </div>
                    </div>

                    {/* Guidelines */}
                    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 md:p-8">
                      <h3 className="font-headline-md text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
                        <ShieldCheck className="h-6 w-6 text-primary" /> Community Guidelines
                      </h3>
                      <ul className="space-y-3 text-sm text-on-surface-variant">
                        <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 text-primary shrink-0" /> Always meet in public, well-lit places when returning items.</li>
                        <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 text-primary shrink-0" /> Do not share personal addresses or sensitive information until verified.</li>
                        <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 text-primary shrink-0" /> Report any suspicious behavior or false claims immediately.</li>
                      </ul>
                    </div>
                  </div>

                  <div className="lg:col-span-4 space-y-6">
                    {/* Contact Support */}
                    <div className="bg-primary text-on-primary rounded-2xl p-6 md:p-8 text-center relative overflow-hidden">
                      <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Mail className="h-8 w-8" />
                        </div>
                        <h3 className="font-headline-md text-xl font-bold mb-2">Need More Help?</h3>
                        <p className="text-sm text-on-primary/90 mb-6">Our support team is ready to assist you with any issues or disputes.</p>
                        <a href="mailto:novapulsarsupport@gmail.com" className="inline-block w-full py-3 bg-white text-primary font-bold rounded-xl hover:bg-surface-variant transition-colors shadow-sm">
                          Contact Support
                        </a>
                      </div>
                      <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    </div>

                    {/* App Info */}
                    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 text-center">
                      <div className="w-12 h-12 bg-surface-variant rounded-xl flex items-center justify-center mx-auto mb-3">
                        <span className="text-xl">✨</span>
                      </div>
                      <h4 className="font-bold text-on-surface">FindTrack</h4>
                      <p className="text-xs text-on-surface-variant mt-1 mb-4">Version 2.0.0 (Beta)</p>
                      <div className="flex justify-center gap-4 text-xs font-bold text-primary">
                        <button onClick={() => setCurrentView('privacy')}>Privacy Policy</button>
                        <span>&bull;</span>
                        <button onClick={() => setCurrentView('terms')}>Terms of Service</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
`;

code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
fs.writeFileSync('src/App.tsx', code);
console.log('Replaced about layout.');
