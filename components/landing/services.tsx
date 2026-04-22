import { Truck, Leaf, Recycle, Trash2 } from 'lucide-react'

const services = [
  {
    icon: Truck,
    title: 'Waste Collection',
    description: 'Weekly kerbside pickup from your gate every morning by 8:00 AM.',
  },
  {
    icon: Leaf,
    title: 'Composting',
    description: 'Organic waste processed via Black Soldier Fly and earthworm composting.',
  },
  {
    icon: Recycle,
    title: 'Recycling',
    description: 'Plastic, glass, and paper sorted and sent to certified recycling facilities.',
  },
  {
    icon: Trash2,
    title: 'Safe Disposal',
    description: 'Remaining waste responsibly disposed of at licensed facilities in Mukono.',
  },
]

export function Services() {
  return (
    <section className="py-20 px-6 max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <span className="reru-overline inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 mb-4">
          What we do
        </span>
        <h2 className="reru-h2 text-reru-text-primary">Four pillars of clean living</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {services.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="bg-white border border-reru-border rounded-xl p-6 shadow-card hover:border-green-200 hover:shadow-card-hover transition-all duration-150"
          >
            <div className="w-11 h-11 rounded-lg bg-green-100 flex items-center justify-center mb-4">
              <Icon size={20} strokeWidth={1.8} className="text-green-600" />
            </div>
            <h3 className="reru-card-title text-reru-text-primary mb-2">{title}</h3>
            <p className="text-sm text-reru-text-secondary leading-relaxed">{description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
