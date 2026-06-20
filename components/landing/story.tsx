import Image from 'next/image'

const journey = [
  {
    src: '/images/waste-collection-client-gate.jpeg',
    alt: 'RERU crew wheeling a collection bin from a household gate',
    step: 'Collected',
    title: 'We pick up at your gate',
    description:
      'Our uniformed crew arrives by 8:00 AM on your collection day — straight from your gate, no trips to the road side.',
  },
  {
    src: '/images/sorting-center-man-with-compost.jpeg',
    alt: 'RERU worker turning organic waste in a composting bay',
    step: 'Composted',
    title: 'Sorted & composted',
    description:
      'At our sorting centre, organic waste is turned in composting bays using Black Soldier Fly and earthworms — not dumped or burned.',
  },
  {
    src: '/images/sorting-center-compost-close-up.jpeg',
    alt: 'Close-up of finished organic compost produced from household waste',
    step: 'Returned to the soil',
    title: 'Rich organic compost',
    description:
      'What started as your household waste becomes nutrient-rich compost for farms and gardens across Mukono — a full circle.',
  },
]

export function Story() {
  return (
    <section className="py-20 px-6 bg-green-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="reru-overline inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 mb-4">
            Our story
          </span>
          <h2 className="reru-h2 text-reru-text-primary">From your gate to the garden</h2>
          <p className="reru-body text-reru-text-secondary mt-3 max-w-2xl mx-auto">
            Your waste doesn&apos;t disappear into a landfill. Follow its journey from a household
            bin to compost that feeds the soil.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {journey.map(({ src, alt, step, title, description }) => (
            <article
              key={title}
              className="group bg-white border border-reru-border rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-150"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={src}
                  alt={alt}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
                <span className="absolute top-3 left-3 reru-overline px-3 py-1 rounded-full bg-green-900/80 backdrop-blur-sm text-white">
                  {step}
                </span>
              </div>
              <div className="p-6">
                <h3 className="reru-card-title text-reru-text-primary mb-2">{title}</h3>
                <p className="text-sm text-reru-text-secondary leading-relaxed">{description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
