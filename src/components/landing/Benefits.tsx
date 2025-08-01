import { Shield, Clock, Sparkles } from "lucide-react";

const benefits = [
  {
    name: "Secure & Private",
    description: "Your data is protected with bank-level security and encryption.",
    icon: Shield,
  },
  {
    name: "Save Time",
    description: "Automate rent payments and streamline your rental applications.",
    icon: Clock,
  },
  {
    name: "Grow Your Credit",
    description: "Build credit history through consistent rent reporting.",
    icon: Sparkles,
  },
];

export function Benefits() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="container px-4 mx-auto">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Why Choose HomeU?
          </h2>
          <p className="mt-4 text-lg leading-8 text-gray-600">
            We're building the future of rental management, one feature at a time.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 mt-16 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit) => (
            <div
              key={benefit.name}
              className="relative p-8 bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-50">
                  <benefit.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold leading-7 text-gray-900">
                  {benefit.name}
                </h3>
              </div>
              <p className="mt-4 text-base leading-7 text-gray-600">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 