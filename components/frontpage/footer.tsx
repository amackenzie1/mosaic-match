import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative z-20 bg-black/50 backdrop-blur-md border-t border-blue-900/50 text-gray-400 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-200">Mosaic</h3>
            <p className="text-sm">Powering Insights</p>
          </div>
          <div>
            <h4 className="text-md font-semibold mb-4 text-gray-200">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/chat-analysis"
                  className="hover:text-white transition-colors duration-300"
                >
                  Chat Analysis
                </Link>
              </li>
              <li>
                <Link
                  href="/chat-games"
                  className="hover:text-white transition-colors duration-300"
                >
                  Chat Games
                </Link>
              </li>
              <li>
                <Link
                  href="/amavie"
                  className="hover:text-white transition-colors duration-300"
                >
                  Amavie
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="hover:text-white transition-colors duration-300"
                >
                  Research
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy-mission"
                  className="hover:text-white transition-colors duration-300"
                >
                  Privacy & Mission
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-white transition-colors duration-300"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-md font-semibold mb-4 text-gray-200">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/terms-of-service"
                  className="hover:text-white transition-colors duration-300"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy-policy"
                  className="hover:text-white transition-colors duration-300"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-md font-semibold mb-4 text-gray-200">
              Connect
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="https://www.linkedin.com/company/mosaicai-ca"
                  className="hover:text-white transition-colors duration-300"
                >
                  LinkedIn
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-blue-900/50 text-center text-sm">
          © {new Date().getFullYear()} Mosaic. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
