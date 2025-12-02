import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            PDF Editor Pro
          </Link>

          <div className="flex items-center gap-6">
            <Link
              href="/editor"
              className="text-slate-700 hover:text-blue-600 transition-colors font-medium"
            >
              Editor
            </Link>
            <Link
              href="/#features"
              className="text-slate-700 hover:text-blue-600 transition-colors font-medium hidden md:block"
            >
              Features
            </Link>
            <Link
              href="/editor"
              className="btn btn-primary"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
