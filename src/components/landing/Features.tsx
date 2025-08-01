import { CreditCard, TrendingUp, Gift, FileText, Home } from "lucide-react";

const features = [
  {
    name: "Build Your Credit",
    description: "Report your rent payments to build credit history and improve your score.",
    icon: TrendingUp,
  },
  {
    name: "Seamless Rent Payments",
    description: "Pay your rent online with ease using our secure payment system.",
    icon: CreditCard,
  },
  {
    name: "Earn Rewards",
    description: "Get rewarded for paying rent on time with points you can redeem.",
    icon: Gift,
  },
  {
    name: "Apply Smarter",
    description: "Use pre-filled applications to streamline your rental process.",
    icon: FileText,
  },
  {
    name: "Your Rental Hub",
    description: "Keep all your rental documents and history in one secure place.",
    icon: Home,
  },
];

export function Features() {
  return (
    <section className="py-24 bg-white">
      <div className="container px-4 mx-auto">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-lg leading-8 text-gray-600">
            Everything you need to manage your rental life, all in one place.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 mt-16 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.name}
              className="relative p-8 bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-50">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold leading-7 text-gray-900">
                  {feature.name}
                </h3>
              </div>
              <p className="mt-4 text-base leading-7 text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 