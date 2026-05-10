import Navbar from "@/components/Navbar";

export const metadata = { title: "Terms of Service — Gamers360" };

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-16 relative z-10">
        <h1 className="text-3xl font-black mb-8">Terms of Service</h1>
        <div className="glass rounded-2xl p-8 space-y-6 text-gray-300 text-sm leading-relaxed">
          <p className="text-gray-500">Last updated: May 2025</p>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. Acceptance</h2>
            <p>By accessing or using Gamers360, you agree to be bound by these Terms. If you do not agree, do not use the platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. Eligibility</h2>
            <p>You must be at least 13 years old to use Gamers360. By creating an account you represent that you meet this requirement.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. Accounts</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials. One account per person is permitted. Creating multiple accounts to exploit the points system will result in permanent suspension.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">4. Points & Withdrawals</h2>
            <p>Points are earned by playing games and have no monetary value until withdrawn. We reserve the right to adjust point values, conversion rates, and minimum withdrawal thresholds at any time. Withdrawals are processed within 1-3 business days and are subject to verification.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">5. Fair Play</h2>
            <p>Using bots, scripts, exploits, or any automated means to earn points is strictly prohibited. We monitor gameplay patterns and reserve the right to suspend accounts and forfeit points for suspicious activity.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">6. Referral Program</h2>
            <p>Referral bonuses are awarded when a referred user creates an account using your referral link. Self-referrals and fraudulent referral activity will result in forfeiture of all referral bonuses.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">7. Ads</h2>
            <p>Gamers360 is a free, ad-supported platform. Ad revenue funds user payouts. You agree not to use ad-blocking software while using the platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">8. Termination</h2>
            <p>We may suspend or terminate your account at our discretion for violation of these Terms. Upon termination, any unredeemed points are forfeited.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">9. Limitation of Liability</h2>
            <p>Gamers360 is provided &quot;as is&quot; without warranty of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">10. Changes</h2>
            <p>We may update these Terms at any time. Continued use of the platform after changes constitutes acceptance of the revised Terms.</p>
          </section>
        </div>
      </main>
    </>
  );
}
