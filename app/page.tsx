import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Professional PDF Editing
              <br />
              Made Simple
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Edit, annotate, and enhance your PDF documents with powerful tools
            </p>
            <Link
              href="/editor"
              className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg"
            >
              Start Editing Now
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12 text-slate-900">
              Powerful Features
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="card hover:shadow-lg transition-shadow">
                <div className="text-blue-600 text-4xl mb-4">📝</div>
                <h3 className="text-xl font-semibold mb-3 text-slate-900">Text Editing</h3>
                <p className="text-slate-600">
                  Add, edit, and format text with ease. Choose from multiple fonts, sizes, and colors.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="card hover:shadow-lg transition-shadow">
                <div className="text-blue-600 text-4xl mb-4">✏️</div>
                <h3 className="text-xl font-semibold mb-3 text-slate-900">Drawing Tools</h3>
                <p className="text-slate-600">
                  Annotate with freehand drawing, shapes, arrows, and highlighting tools.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="card hover:shadow-lg transition-shadow">
                <div className="text-blue-600 text-4xl mb-4">🖼️</div>
                <h3 className="text-xl font-semibold mb-3 text-slate-900">Image Insertion</h3>
                <p className="text-slate-600">
                  Insert images, logos, and signatures directly into your PDF documents.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="card hover:shadow-lg transition-shadow">
                <div className="text-blue-600 text-4xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-3 text-slate-900">Zoom & Navigate</h3>
                <p className="text-slate-600">
                  Precise zoom controls and smooth navigation for detailed editing work.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="card hover:shadow-lg transition-shadow">
                <div className="text-blue-600 text-4xl mb-4">💾</div>
                <h3 className="text-xl font-semibold mb-3 text-slate-900">Save & Export</h3>
                <p className="text-slate-600">
                  Download your edited PDFs instantly with all annotations preserved.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="card hover:shadow-lg transition-shadow">
                <div className="text-blue-600 text-4xl mb-4">🔒</div>
                <h3 className="text-xl font-semibold mb-3 text-slate-900">Secure & Private</h3>
                <p className="text-slate-600">
                  Your documents are processed securely and never stored on our servers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12 text-slate-900">
              How It Works
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-3 text-slate-900">Upload PDF</h3>
                <p className="text-slate-600">
                  Drag and drop or click to upload your PDF document
                </p>
              </div>

              <div className="text-center">
                <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-3 text-slate-900">Edit & Annotate</h3>
                <p className="text-slate-600">
                  Use our powerful tools to make your changes
                </p>
              </div>

              <div className="text-center">
                <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-3 text-slate-900">Download</h3>
                <p className="text-slate-600">
                  Save your edited PDF with a single click
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-blue-600 text-white py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Edit Your PDFs?
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Get started now - no registration required
            </p>
            <Link
              href="/editor"
              className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg"
            >
              Launch Editor
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
