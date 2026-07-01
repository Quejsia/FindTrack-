const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const marker = `      {/* ── VIEW 4: MAIN DASHBOARD PORTAL ── */}`;

const newViews = `      {/* ── VIEW 8: ABOUT US PAGE ── */}
      {currentView === "about" && (
        <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "sans-serif" }}>
          <header style={{ padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", borderBottom: "1px solid #e2e8f0" }}>
            <div style={{ fontWeight: "bold", fontSize: "24px", color: "#01725a", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }} onClick={() => { setCurrentView("landing"); window.history.pushState(null, "", "/"); }}>
              <MapPin className="h-6 w-6 text-[#01725a]"/>
              FindTrack
            </div>
          </header>
          <div style={{ maxWidth: "800px", margin: "40px auto", padding: "40px", background: "#fff", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
            <h1 style={{ fontSize: "32px", fontWeight: "bold", color: "#00654f", marginBottom: "24px" }}>About Us</h1>
            <p style={{ fontSize: "16px", color: "#475569", lineHeight: "1.6", marginBottom: "20px" }}>
              FindTrack is a community-driven lost and found platform dedicated to helping people recover their lost items across the Philippines.
              Our mission is to foster a culture of honesty and trust (Bayanihan) by providing a secure and accessible platform for reporting and recovering lost belongings.
            </p>
            <p style={{ fontSize: "16px", color: "#475569", lineHeight: "1.6", marginBottom: "20px" }}>
              Whether you've lost something precious or found an item that needs returning, FindTrack is here to bridge the gap and make recovery easier.
            </p>
          </div>
        </div>
      )}

      {/* ── VIEW 9: SAFETY GUIDELINES PAGE ── */}
      {currentView === "safety" && (
        <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "sans-serif" }}>
          <header style={{ padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", borderBottom: "1px solid #e2e8f0" }}>
            <div style={{ fontWeight: "bold", fontSize: "24px", color: "#01725a", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }} onClick={() => { setCurrentView("landing"); window.history.pushState(null, "", "/"); }}>
              <MapPin className="h-6 w-6 text-[#01725a]"/>
              FindTrack
            </div>
          </header>
          <div style={{ maxWidth: "800px", margin: "40px auto", padding: "40px", background: "#fff", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
            <h1 style={{ fontSize: "32px", fontWeight: "bold", color: "#00654f", marginBottom: "24px" }}>Safety Guidelines</h1>
            <p style={{ fontSize: "16px", color: "#475569", lineHeight: "1.6", marginBottom: "20px" }}>
              Your safety is our top priority. When meeting to return or retrieve a lost item, please keep the following guidelines in mind:
            </p>
            <ul style={{ listStyleType: "disc", paddingLeft: "24px", color: "#475569", lineHeight: "1.6", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <li><strong>Meet in Public Places:</strong> Always choose well-lit, public locations for handovers, such as cafes, malls, or police stations.</li>
              <li><strong>Bring a Friend:</strong> If possible, bring someone with you when meeting a stranger.</li>
              <li><strong>Verify Ownership:</strong> Ask identifying questions about the item before handing it over (e.g., unique marks, passwords for devices).</li>
              <li><strong>Do Not Share Personal Information:</strong> Avoid sharing your home address, financial details, or other sensitive information.</li>
              <li><strong>Trust Your Instincts:</strong> If a situation feels unsafe, cancel the meeting and report the user if necessary.</li>
            </ul>
          </div>
        </div>
      )}

      {/* ── VIEW 10: HELP CENTER PAGE ── */}
      {currentView === "help" && (
        <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "sans-serif" }}>
          <header style={{ padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", borderBottom: "1px solid #e2e8f0" }}>
            <div style={{ fontWeight: "bold", fontSize: "24px", color: "#01725a", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }} onClick={() => { setCurrentView("landing"); window.history.pushState(null, "", "/"); }}>
              <MapPin className="h-6 w-6 text-[#01725a]"/>
              FindTrack
            </div>
          </header>
          <div style={{ maxWidth: "800px", margin: "40px auto", padding: "40px", background: "#fff", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
            <h1 style={{ fontSize: "32px", fontWeight: "bold", color: "#00654f", marginBottom: "24px" }}>Help Center</h1>
            <p style={{ fontSize: "16px", color: "#475569", lineHeight: "1.6", marginBottom: "20px" }}>
              Need assistance with using FindTrack? You're in the right place.
            </p>
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#0f172a", marginBottom: "12px" }}>How to Report a Lost Item</h2>
              <p style={{ fontSize: "16px", color: "#475569", lineHeight: "1.6" }}>
                1. Log in to your account and go to the Dashboard.<br/>
                2. Click on the "Report Item" button.<br/>
                3. Fill out the details (type, description, location) and upload a photo if available.<br/>
                4. Submit the report to alert the community.
              </p>
            </div>
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#0f172a", marginBottom: "12px" }}>How to Claim a Found Item</h2>
              <p style={{ fontSize: "16px", color: "#475569", lineHeight: "1.6" }}>
                1. Browse the items feed on your Dashboard.<br/>
                2. If you spot an item that belongs to you, click "Claim item" (Hand icon).<br/>
                3. Provide proof of ownership in the message to the finder.<br/>
                4. Coordinate a safe handover.
              </p>
            </div>
            <p style={{ fontSize: "16px", color: "#475569", lineHeight: "1.6", marginTop: "40px", paddingTop: "20px", borderTop: "1px solid #e2e8f0" }}>
              Still need help? Please reach out to our support team at: <strong>novapulsarsupport@gmail.com</strong>
            </p>
          </div>
        </div>
      )}

      {/* ── VIEW 11: CONTACT US PAGE ── */}
      {currentView === "contact" && (
        <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "sans-serif" }}>
          <header style={{ padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", borderBottom: "1px solid #e2e8f0" }}>
            <div style={{ fontWeight: "bold", fontSize: "24px", color: "#01725a", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }} onClick={() => { setCurrentView("landing"); window.history.pushState(null, "", "/"); }}>
              <MapPin className="h-6 w-6 text-[#01725a]"/>
              FindTrack
            </div>
          </header>
          <div style={{ maxWidth: "800px", margin: "40px auto", padding: "40px", background: "#fff", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
            <h1 style={{ fontSize: "32px", fontWeight: "bold", color: "#00654f", marginBottom: "24px" }}>Contact Us</h1>
            <p style={{ fontSize: "16px", color: "#475569", lineHeight: "1.6", marginBottom: "20px" }}>
              We'd love to hear from you. Whether you have a question about our platform, need help with an item, or want to provide feedback, our team is ready to assist.
            </p>
            
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "24px", borderRadius: "8px", marginTop: "32px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#166534", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Mail className="w-6 h-6" /> Email Support
              </h2>
              <p style={{ fontSize: "16px", color: "#166534", lineHeight: "1.6" }}>
                You can reach our support team directly at:<br/>
                <a href="mailto:novapulsarsupport@gmail.com" style={{ fontWeight: "bold", textDecoration: "underline", color: "#15803d", fontSize: "18px", display: "inline-block", marginTop: "8px" }}>
                  novapulsarsupport@gmail.com
                </a>
              </p>
              <p style={{ fontSize: "14px", color: "#15803d", marginTop: "12px" }}>
                We typically respond within 24-48 hours.
              </p>
            </div>
          </div>
        </div>
      )}

`;

code = code.replace(marker, newViews + marker);
fs.writeFileSync('src/App.tsx', code);
console.log('Added new views');
