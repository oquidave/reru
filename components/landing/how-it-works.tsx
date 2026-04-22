const steps = [
  { number: '01', title: 'Register', description: 'Sign up online in under 5 minutes. Choose your plan and preferred collection day.' },
  { number: '02', title: 'Get your bags', description: 'We deliver colour-coded bags to your home for sorting organic, plastic, and other waste.' },
  { number: '03', title: 'Set out waste', description: 'Place your bags at your gate by 8:00 AM on your collection day.' },
  { number: '04', title: 'We collect', description: 'Our team picks up, sorts, composts, and recycles — and you can track it all online.' },
]

export function HowItWorks() {
  return (
    <section className="py-20 px-6 bg-green-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="reru-overline inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 mb-4">
            How it works
          </span>
          <h2 className="reru-h2 text-reru-text-primary">Up and running in 4 steps</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map(({ number, title, description }) => (
            <div key={number} className="relative">
              <div className="bg-white border border-reru-border rounded-xl p-6 shadow-card h-full">
                <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center mb-4">
                  <span className="text-sm font-bold text-white">{number}</span>
                </div>
                <h3 className="reru-card-title text-reru-text-primary mb-2">{title}</h3>
                <p className="text-sm text-reru-text-secondary leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
