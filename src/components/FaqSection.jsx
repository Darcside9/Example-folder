import { useState } from 'react';
import { faqs } from '../data/faqData';

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <section id="faq" className="section faq-section reveal-on-scroll">
      <div className="section-heading text-center">
        <span className="eyebrow">Got Questions?</span>
        <h2>Frequently Asked Questions</h2>
        <p>
          Everything you need to know about our virtual phone numbers, carrier routing, and privacy guarantees.
        </p>
      </div>

      <div className="faq-container">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={index} className={`faq-item ${isOpen ? 'open' : ''}`}>
              <button
                type="button"
                className="faq-toggle"
                onClick={() => toggleFaq(index)}
                aria-expanded={isOpen}
              >
                <span>{faq.question}</span>
                <span className="faq-icon-arrow">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </span>
              </button>
              <div className="faq-content-wrapper">
                <div className="faq-content">
                  <p>{faq.answer}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
