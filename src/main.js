// src/main.js

// Import your Tailwind CSS entrypoint (built by Vite + PostCSS)
import './index.css';

// Make sure in your tailwind.config.js you have something like:
//   theme.extend.animation['fade-in'] = 'fadeInUp 0.6s ease-out forwards'

window.addEventListener('DOMContentLoaded', () => {
  // Set up an IntersectionObserver to trigger the fade-in
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      // Remove the hidden state, add the animation class, then stop observing
      entry.target.classList.remove('opacity-0');
      entry.target.classList.add('animate-fade-in');
      obs.unobserve(entry.target);
    });
  }, {
    threshold: 0.1
  });

  // Hide all [data-animate] elements initially and observe them
  document.querySelectorAll('[data-animate]').forEach(el => {
    el.classList.add('opacity-0');
    observer.observe(el);
  });
});
