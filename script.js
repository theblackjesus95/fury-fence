/*
 * Basic interactivity for the Fury Fence website
 *
 * This script intercepts the contact form submission and displays a
 * confirmation message to the user without reloading the page. In a real
 * deployment the form would send data to a backend; here we simulate that
 * behaviour for demonstration purposes.
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  const messages = document.getElementById('form-messages');

  // Mobile navigation toggle functionality
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      nav.classList.toggle('open');
      navToggle.classList.toggle('open');
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // Extract the form fields for potential further use or validation
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();

    // Simple validation: ensure none of the fields are empty
    if (name === '' || email === '' || message === '') {
      messages.textContent = 'Please fill out all fields before submitting.';
      messages.style.color = '#e56b6f';
      return;
    }

    // Display a thank-you message to the user
    messages.textContent = `Thank you, ${name}! We have received your message and will contact you soon.`;
    messages.style.color = '#c94a44';

    // Reset the form fields
    form.reset();
  });
});