import { SmartFeed } from "@/components/SmartFeed";
import { Navbar } from "@/components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="w-full">
        {/* Hero Section */}
        <div className="w-full py-6 px-4" style={{ backgroundColor: "#690031" }}>
          <div className="container mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Left Content */}
              <div className="max-w-4xl">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold tracking-widest text-white">WELCOME TO</span>
                </div>
                
                {/* Main Title */}
                <h1 className="text-7xl sm:text-8xl font-bold mb-8 leading-tight text-white">
                  Q-BLOG
                </h1>
                
                {/* Subtitle with accent line */}
                <div className="relative pl-6 border-l-4" style={{ borderColor: "#f5dbc6" }}>
                  <p className="text-lg sm:text-xl text-white leading-relaxed max-w-5xl">
                    Welcome to the QualMinds Blog, your premier destination for insights, trends, and expertise in IT services. We share valuable knowledge on technology, innovation, and digital transformation to help businesses thrive in the modern era.
                  </p>
                </div>
                
                {/* CTA Button */}
                <div className="mt-10">
                  <button 
                    style={{ backgroundColor: "#f5dbc6", color: "#690031" }} 
                    className="px-8 py-3 rounded-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    Explore Our Articles
                  </button>
                </div>
              </div>

              {/* Right Side Decorative Element */}
              <div className="hidden lg:flex items-center justify-center relative h-80 overflow-hidden">
                {/* Decorative circles and shapes - soft blend */}
                <div className="absolute w-64 h-64 rounded-full" style={{ backgroundColor: "#f5dbc6", right: "20%", top: "10%", opacity: 0.08 }}></div>
                <div className="absolute w-48 h-48 rounded-full" style={{ backgroundColor: "#f5dbc6", right: "5%", bottom: "15%", opacity: 0.06 }}></div>
                <div className="absolute w-32 h-32 rounded-full" style={{ backgroundColor: "#f5dbc6", right: "40%", bottom: "30%", opacity: 0.1 }}></div>
                
                {/* Accent line elements */}
                <div className="absolute h-1 w-24" style={{ backgroundColor: "#f5dbc6", right: "15%", top: "25%", transform: "rotate(45deg)", opacity: 0.05 }}></div>
                <div className="absolute h-1 w-20" style={{ backgroundColor: "#f5dbc6", right: "25%", bottom: "40%", transform: "rotate(-30deg)", opacity: 0.04 }}></div>
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
