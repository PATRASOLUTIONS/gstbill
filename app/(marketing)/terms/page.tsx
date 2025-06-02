import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service | QuickBill",
  description: "Terms of Service for QuickBill Inventory Management System",
}

export default function TermsPage() {
  return (
    <div className="container max-w-4xl py-12">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing or using QuickBill Inventory Management System, you agree to be bound by these Terms of
            Service. If you do not agree to all the terms and conditions, you must not access or use our services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
          <p>
            QuickBill provides inventory management, invoicing, sales tracking, purchase management, and reporting tools
            for businesses. Our service is subject to change without prior notice.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials and for all activities
            that occur under your account. You must notify us immediately of any unauthorized use of your account.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Data and Privacy</h2>
          <p>
            Your use of QuickBill is subject to our Privacy Policy, which governs our collection and use of your
            information. You acknowledge that you have read and understand our Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. User Conduct</h2>
          <p>
            You agree not to use QuickBill for any unlawful purpose or in any way that could damage, disable, or impair
            our services. You must not attempt to gain unauthorized access to any part of our services or systems.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Intellectual Property</h2>
          <p>
            All content, features, and functionality of QuickBill, including but not limited to text, graphics, logos,
            and software, are owned by QuickBill and are protected by copyright, trademark, and other intellectual
            property laws.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Limitation of Liability</h2>
          <p>
            QuickBill shall not be liable for any indirect, incidental, special, consequential, or punitive damages
            resulting from your access to or use of, or inability to access or use, our services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. Termination</h2>
          <p>
            We may terminate or suspend your account and access to QuickBill immediately, without prior notice, for
            conduct that we determine violates these Terms of Service or is harmful to other users, us, or third
            parties.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">9. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms of Service at any time. We will provide notice of significant
            changes by posting the new Terms of Service on our website or through other communications.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">10. Governing Law</h2>
          <p>
            These Terms of Service shall be governed by and construed in accordance with the laws of the jurisdiction in
            which QuickBill operates, without regard to its conflict of law provisions.
          </p>
        </section>
      </div>
    </div>
  )
}

