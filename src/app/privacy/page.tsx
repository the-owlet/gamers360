import Navbar from "@/components/Navbar";

export const metadata = { title: "Privacy Policy — Gamers360" };

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-16 relative z-10">
        <h1 className="text-3xl font-black mb-8">Privacy Policy</h1>
        <div className="glass rounded-2xl p-8 space-y-6 text-gray-300 text-sm leading-relaxed">
          <p className="text-gray-500">Last updated: May 2025</p>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. Information We Collect</h2>
            <p>We collect information you provide when creating an account: username, email address, and password (stored securely hashed). We also collect gameplay data including scores, games played, and points earned.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. How We Use Your Information</h2>
            <p>Your information is used to: maintain your account and wallet, track game progress and achievements, process withdrawal requests, display leaderboards, serve relevant advertisements, and prevent fraud.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. Advertising</h2>
            <p>We use Google AdSense to display advertisements. Google may use cookies and similar technologies to serve ads based on your browsing activity. You can manage your ad preferences through Google&apos;s Ad Settings.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">4. Cookies</h2>
            <p>We use essential cookies for authentication and session management. Third-party advertising partners may also set cookies for ad personalization.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">5. Data Sharing</h2>
            <p>We do not sell your personal information. We may share anonymized, aggregated data with advertising partners. Withdrawal requests require sharing necessary payment details with our payment processor (Flutterwave).</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">6. Data Security</h2>
            <p>Passwords are hashed using bcrypt. Sessions are managed with secure, httpOnly cookies. We implement reasonable security measures to protect your data, but no system is 100% secure.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">7. Your Rights</h2>
            <p>You may request access to, correction of, or deletion of your personal data by contacting us. Account deletion will forfeit any unredeemed points.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">8. Children</h2>
            <p>Gamers360 is not intended for children under 13. We do not knowingly collect personal information from children under 13.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">9. Changes</h2>
            <p>We may update this Privacy Policy periodically. We will notify you of significant changes via email or in-app notification.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">10. Contact</h2>
            <p>For privacy-related inquiries, contact us at support@gamers360.com.</p>
          </section>
        </div>
      </main>
    </>
  );
}
