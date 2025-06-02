import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Us | QuickBill",
  description: "Learn about QuickBill Inventory Management System",
}

export default function AboutPage() {
  return (
    <div className="container max-w-4xl py-12">
      <h1 className="text-3xl font-bold mb-8">About QuickBill</h1>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">Our Mission</h2>
          <p>
            At QuickBill, our mission is to empower businesses of all sizes with powerful, yet easy-to-use inventory
            management and billing solutions. We believe that efficient inventory management is the backbone of any
            successful business, and we're dedicated to making it accessible to everyone.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Our Story</h2>
          <p>
            QuickBill was founded in 2020 by a team of entrepreneurs who experienced firsthand the challenges of
            managing inventory, sales, and purchases for small businesses. Frustrated by the complexity and high cost of
            existing solutions, they set out to create a more intuitive and affordable alternative.
          </p>
          <p className="mt-2">
            What started as a simple tool for tracking inventory has evolved into a comprehensive business management
            platform that helps thousands of businesses streamline their operations, reduce costs, and grow their
            revenue.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">What We Offer</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Inventory Management:</strong> Track stock levels, set reorder points, and manage product
              information with ease.
            </li>
            <li>
              <strong>Sales Management:</strong> Create and manage sales orders, track customer information, and monitor
              sales performance.
            </li>
            <li>
              <strong>Purchase Management:</strong> Create purchase orders, manage supplier relationships, and track
              incoming inventory.
            </li>
            <li>
              <strong>Invoicing:</strong> Generate professional invoices, track payments, and manage accounts
              receivable.
            </li>
            <li>
              <strong>Reporting:</strong> Gain insights into your business with comprehensive reports on sales,
              inventory, purchases, and more.
            </li>
            <li>
              <strong>Multi-user Access:</strong> Collaborate with your team by assigning different roles and
              permissions to users.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Our Values</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Simplicity:</strong> We believe that powerful software doesn't have to be complicated. We strive
              to make our platform intuitive and easy to use.
            </li>
            <li>
              <strong>Reliability:</strong> We understand that businesses rely on our platform for their daily
              operations. We're committed to providing a reliable and stable service.
            </li>
            <li>
              <strong>Customer-Centric:</strong> Our customers are at the heart of everything we do. We actively listen
              to feedback and continuously improve our platform to meet their needs.
            </li>
            <li>
              <strong>Innovation:</strong> We're constantly exploring new technologies and approaches to make inventory
              management more efficient and effective.
            </li>
            <li>
              <strong>Accessibility:</strong> We believe that powerful business tools should be accessible to businesses
              of all sizes, not just large enterprises.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
          <p>
            We'd love to hear from you! If you have any questions, feedback, or inquiries, please don't hesitate to
            reach out to us at quickbill@gmail.com.
          </p>
        </section>
      </div>
    </div>
  )
}

