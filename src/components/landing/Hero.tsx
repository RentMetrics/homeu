import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative py-20 overflow-hidden bg-gradient-to-b from-white to-gray-50">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col items-center max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Unlock Your Rental Power with HomeU
          </h1>
          <p className="mt-6 text-xl leading-8 text-gray-600">
            Build credit, pay rent easily, get rewarded, and manage your rental life – all in one place.
          </p>
          <div className="flex flex-col gap-4 mt-10 sm:flex-row">
            <Button size="lg" className="px-8 py-6 text-lg">
              Sign Up for Free
            </Button>
            <Button size="lg" variant="outline" className="px-8 py-6 text-lg">
              Learn More
            </Button>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-50 via-white to-white" />
      </div>
    </section>
  );
} 