import { SectionHeader } from './SectionHeader';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PlusIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { faqs } from '../data/faqs';

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faqs" aria-labelledby="faqs-heading" className="border-t border-line bg-surface py-24 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div>
          <SectionHeader
            id="faqs-heading"
            title="Questions sellers ask first"
            description="Get answers on supported couriers, required files, data handling, and how discrepancies are flagged."
            aside={
              <Link
                to="/app"
                className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-accent-ink shadow-sm hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                Open workspace →
              </Link>
            }
          />
        </div>

        <ul className="divide-y divide-line border-y border-line">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            const panelId = `faq-panel-${i}`;
            const buttonId = `faq-button-${i}`;
            return (
              <li key={faq.question}>
                <h3>
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-6 py-5 text-left text-[16px] font-bold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                    
                    {faq.question}
                    <PlusIcon
                      className={`h-5 w-5 shrink-0 text-muted transition-transform duration-200 ease-out ${
                      isOpen ? 'rotate-45' : ''}`}
                      aria-hidden="true" />
                    
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen &&
                  <motion.div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                    className="overflow-hidden">
                    
                      <p className="max-w-2xl pb-6 leading-relaxed text-muted">{faq.answer}</p>
                    </motion.div>
                  }
                </AnimatePresence>
              </li>);
          })}
        </ul>
      </div>
    </section>);

}
