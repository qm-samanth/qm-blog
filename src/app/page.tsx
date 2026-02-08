import { SmartFeed } from "@/components/SmartFeed";
import { Navbar } from "@/components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="w-full">
        {/* Hero Section */}
        <div className="w-full py-6 px-4" style={{ backgroundColor: "#f6f2eb" }}>
          <div className="container mx-auto">
            <div className="max-w-4xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 mb-1">
                <span className="text-sm font-bold tracking-widest" style={{ color: "#690031" }}>WELCOME TO</span>
              </div>
              
              {/* Main Title */}
              <h1 className="text-7xl sm:text-8xl font-bold mb-8 leading-tight text-black">
                Q-BLOG
              </h1>
              
              {/* Subtitle with accent line */}
              <div className="relative pl-6 border-l-4" style={{ borderColor: "#690031" }}>
                <p className="text-lg sm:text-xl text-gray-700 leading-relaxed max-w-3xl">
                  Welcome to the QualMinds Blog, your premier destination for insights, trends, and expertise in IT services. We share valuable knowledge on technology, innovation, and digital transformation to help businesses thrive in the modern era.
                </p>
              </div>
              
              {/* CTA Button */}
              <div className="mt-10">
                <button 
                  style={{ backgroundColor: "#690031" }} 
                  className="px-8 py-3 rounded-full text-white font-semibold hover:opacity-90 transition-opacity"
                >
                  Explore Articles
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Section */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <SmartFeed />
        </div>
      </main>
    </div>
  );
}
