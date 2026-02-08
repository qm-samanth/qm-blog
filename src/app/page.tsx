import { SmartFeed } from "@/components/SmartFeed";
import { Navbar } from "@/components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="w-full">
        {/* Hero Section */}
        <div className="w-full py-20 px-4" style={{ backgroundColor: "#f6f2eb" }}>
          <div className="container mx-auto">
            <h1 className="text-6xl font-bold text-black mb-6">Q-BLOG</h1>
            <p className="text-xl text-gray-800">
              Welcome to the QualMinds Blog, your premier destination for insights, trends, and expertise in IT services. 
              We share valuable knowledge on technology, innovation, and digital transformation to help businesses thrive in the modern era.
            </p>
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
