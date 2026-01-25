import { SmartFeed } from "@/components/SmartFeed";
import { Navbar } from "@/components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <SmartFeed />
        </div>
      </main>
    </div>
  );
}
