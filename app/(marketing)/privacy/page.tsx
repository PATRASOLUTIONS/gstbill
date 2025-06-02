import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | QuickBill",
  description: "Privacy Policy for QuickBill Inventory Management System",
}

export default function PrivacyPage() {
  return (
    <div className="container max-w-4xl py-12">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
          <p>
            We collect information you provide directly to us, such as when you create an account, update your profile,
            use interactive features, make a purchase, request customer support, or otherwise communicate with us.
          </p>
          <p className="mt-2">
            This information may include your name, email address, phone number, company information, billing address,
            and any other information you choose to provide.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and send related information</li>
            <li>Send technical notices, updates, security alerts, and support messages</li>
            <li>Respond to your comments, questions, and requests</li>
            <li>Communicate with you about products, services, offers, and events</li>
            <li>Monitor and analyze trends, usage, and activities in connection with our services</li>
            <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
            <li>Personalize and improve your experience</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Data Storage and Security</h2>
          <p>
            We implement appropriate security measures to protect your personal information against unauthorized access,
            alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic
            storage is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Data Retention</h2>
          <p>
            We retain your information for as long as your account is active or as needed to provide you services. We
            will retain and use your information as necessary to comply with our legal obligations, resolve disputes,
            and enforce our agreements.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Sharing of Information</h2>
          <p>We may share your information with:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>
              Vendors, consultants, and other service providers who need access to such information to carry out work on
              our behalf
            </li>
            <li>
              In response to a request for information if we believe disclosure is in accordance with any applicable
              law, regulation, or legal process
            </li>
            <li>
              If we believe your actions are inconsistent with our user agreements or policies, or to protect the
              rights, property, and safety of QuickBill or others
            </li>
            <li>
              In connection with, or during negotiations of, any merger, sale of company assets, financing, or
              acquisition of all or a portion of our business by another company
            </li>
            <li>With your consent or at your direction</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Your Rights</h2>
          <p>
            You have the right to access, correct, or delete your personal information. You can manage your account
            settings or contact us directly to exercise these rights. You may also opt out of receiving promotional
            communications from us by following the instructions in those communications.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Cookies and Tracking Technologies</h2>
          <p>
            We use cookies and similar tracking technologies to track activity on our services and hold certain
            information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
            Privacy Policy on this page and updating the "Last Updated" date.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">9. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at quickbill@gmail.com.</p>
        </section>
      </div>
    </div>
  )
}

