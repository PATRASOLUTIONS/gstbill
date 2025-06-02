import Link from "next/link"

export function MarketingFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="container flex items-center justify-center py-6">
        <nav className="flex gap-6">
          <Link
            href="/terms"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Terms of Service
          </Link>
          <Link
            href="/privacy"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Privacy Policy
          </Link>
          <Link
            href="/about"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            About Us
          </Link>
        </nav>
      </div>
    </footer>
  )
}
