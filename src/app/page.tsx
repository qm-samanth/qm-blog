import { SmartFeed } from "@/components/SmartFeed";
import { Navbar } from "@/components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <SmartFeed />
      </main>
    </div>
  );
}
