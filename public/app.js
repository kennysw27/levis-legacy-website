// ============================================================
// Levi's Legacy LLC — SPA Core Application
// ============================================================

import { testimonials, faqData } from "./fleet.js";

let vehicles = [];

// ---- Constants ----
const PHONE = "(254) 592-5792";
const PHONE_LINK = "tel:+12545925792";
const SMS_LINK = "sms:+12545925792";
const EMAIL = "info@levislegacyllc.com";

// ============================================================
// LIGHTBOX LOGIC
// ============================================================
window.lightboxImages = [];
window.lightboxIndex = 0;

window.openLightbox = function (vehicleId, startIndex) {
  const vehicle = vehicles.find(v => v.id === vehicleId);
  if (!vehicle || !vehicle.images || vehicle.images.length === 0) return;
  
  window.lightboxImages = vehicle.images;
  window.lightboxIndex = startIndex;
  
  const lightbox = document.getElementById("lightbox");
  const img = document.getElementById("lightbox__img");
  const counter = document.getElementById("lightbox__counter");
  
  img.src = window.lightboxImages[window.lightboxIndex];
  counter.textContent = `${window.lightboxIndex + 1} / ${window.lightboxImages.length}`;
  lightbox.style.display = "flex";
  document.body.style.overflow = "hidden"; // Prevent scrolling
};

window.closeLightbox = function () {
  const lightbox = document.getElementById("lightbox");
  lightbox.style.display = "none";
  document.body.style.overflow = "auto";
};

window.changeLightboxImage = function (step) {
  window.lightboxIndex += step;
  if (window.lightboxIndex < 0) {
    window.lightboxIndex = window.lightboxImages.length - 1;
  } else if (window.lightboxIndex >= window.lightboxImages.length) {
    window.lightboxIndex = 0;
  }
  
  const img = document.getElementById("lightbox__img");
  const counter = document.getElementById("lightbox__counter");
  
  img.src = window.lightboxImages[window.lightboxIndex];
  counter.textContent = `${window.lightboxIndex + 1} / ${window.lightboxImages.length}`;
};

// ---- Router ----
function getRoute() {
  const hash = window.location.hash.slice(2) || "home";
  return hash;
}

function navigate(path) {
  window.location.hash = `#/${path}`;
}

// ---- Init ----
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch('/api/vehicles');
    vehicles = await res.json();
  } catch (e) {
    console.error("Could not load vehicles:", e);
  }
  renderApp();
  window.addEventListener("hashchange", renderApp);
  initNavScroll();
});

function renderApp() {
  const route = getRoute();
  const viewport = document.getElementById("app-viewport");
  if (!viewport) return;

  closeMobileNav();

  // Determine page
  if (route === "home") {
    viewport.innerHTML = renderHomePage();
  } else if (route === "fleet") {
    viewport.innerHTML = renderFleetPage();
  } else if (route.startsWith("vehicle/")) {
    const id = route.split("/")[1];
    viewport.innerHTML = renderVehicleDetailPage(id);
  } else if (route === "booking") {
    viewport.innerHTML = renderBookingPage();
  } else if (route === "private-transportation") {
    viewport.innerHTML = renderPrivateTransportPage();
  } else if (route === "about") {
    viewport.innerHTML = renderAboutPage();
  } else if (route === "faq") {
    viewport.innerHTML = renderFAQPage();
  } else if (route === "contact") {
    viewport.innerHTML = renderContactPage();
  } else if (route === "policies") {
    viewport.innerHTML = renderPoliciesPage();
  } else {
    viewport.innerHTML = renderHomePage();
  }

  // Update active nav link
  updateActiveNav(route);

  // Scroll to top
  window.scrollTo({ top: 0, behavior: "instant" });

  // Init page-specific features after DOM update
  requestAnimationFrame(() => {
    initFAQAccordion();
    initScrollReveal();
    initBookingForm();
    initContactForm();
  });
}

// ---- Navigation Scroll ----
function initNavScroll() {
  const nav = document.getElementById("main-nav");
  if (!nav) return;
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      nav.classList.add("nav--scrolled");
    } else {
      nav.classList.remove("nav--scrolled");
    }
  });
}

// ---- Mobile Nav ----
window.toggleMobileNav = function () {
  const mobileNav = document.getElementById("mobile-nav");
  const hamburger = document.getElementById("nav-hamburger");
  if (mobileNav && hamburger) {
    mobileNav.classList.toggle("mobile-nav--active");
    hamburger.classList.toggle("nav__hamburger--active");
    document.body.style.overflow = mobileNav.classList.contains(
      "mobile-nav--active"
    )
      ? "hidden"
      : "";
  }
};

function closeMobileNav() {
  const mobileNav = document.getElementById("mobile-nav");
  const hamburger = document.getElementById("nav-hamburger");
  if (mobileNav) mobileNav.classList.remove("mobile-nav--active");
  if (hamburger) hamburger.classList.remove("nav__hamburger--active");
  document.body.style.overflow = "";
}

function updateActiveNav(route) {
  document.querySelectorAll(".nav__link, .mobile-nav__link").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;
    const linkRoute = href.replace("#/", "");
    link.classList.toggle(
      "nav__link--active",
      linkRoute === route || (route === "home" && linkRoute === "home")
    );
  });
}

// ---- FAQ Accordion ----
function initFAQAccordion() {
  document.querySelectorAll(".faq-item__question").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".faq-item");
      const isActive = item.classList.contains("faq-item--active");
      // Close all
      document
        .querySelectorAll(".faq-item")
        .forEach((i) => i.classList.remove("faq-item--active"));
      // Toggle clicked
      if (!isActive) item.classList.add("faq-item--active");
    });
  });
}

// ---- Scroll Reveal ----
function initScrollReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal--visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
}

// ---- Booking Form ----
function initBookingForm() {
  const form = document.getElementById("booking-form");
  if (!form) return;

  // Pre-fill vehicle if in URL params
  const urlParams = new URLSearchParams(window.location.search);
  const vehicleParam =
    urlParams.get("vehicle") || getBookingVehicleFromHash();
  if (vehicleParam) {
    const select = form.querySelector("#vehicle-preference");
    if (select) select.value = vehicleParam;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateBookingForm(form)) return;
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Sending...";
    submitBtn.disabled = true;

    const data = new FormData(form);
    try {
      await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get("full-name"),
          email: data.get("booking-email"),
          phone: data.get("phone"),
          pickupDate: data.get("pickup-date"),
          returnDate: data.get("return-date"),
          vehicleId: data.get("vehicle-preference"),
          message: (data.get("booking-notes") || "") + (data.get("pickup-location") ? ` [Pickup: ${data.get("pickup-location")}]` : "")
        })
      });
      showBookingConfirmation(form);
    } catch (e) {
      console.error(e);
      alert("There was an error submitting your request. Please try again.");
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });
}

function getBookingVehicleFromHash() {
  const hash = window.location.hash;
  const match = hash.match(/vehicle=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function validateBookingForm(form) {
  let valid = true;
  // Clear previous errors
  form.querySelectorAll(".form-error").forEach((el) => el.remove());
  form
    .querySelectorAll(".form-input, .form-select")
    .forEach((input) => input.classList.remove("form-input--error"));

  const required = form.querySelectorAll("[required]");
  required.forEach((field) => {
    if (!field.value.trim()) {
      valid = false;
      field.classList.add("form-input--error");
      const error = document.createElement("span");
      error.className = "form-error";
      error.textContent = "This field is required";
      field.parentNode.appendChild(error);
    }
  });

  // Email validation
  const email = form.querySelector("#booking-email");
  if (email && email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    valid = false;
    email.classList.add("form-input--error");
    const error = document.createElement("span");
    error.className = "form-error";
    error.textContent = "Please enter a valid email";
    email.parentNode.appendChild(error);
  }

  // Date validation
  const pickup = form.querySelector("#pickup-date");
  const returnDate = form.querySelector("#return-date");
  if (pickup && returnDate && pickup.value && returnDate.value) {
    if (new Date(returnDate.value) <= new Date(pickup.value)) {
      valid = false;
      returnDate.classList.add("form-input--error");
      const error = document.createElement("span");
      error.className = "form-error";
      error.textContent = "Return date must be after pickup date";
      returnDate.parentNode.appendChild(error);
    }
  }

  return valid;
}

function showBookingConfirmation(form) {
  const data = new FormData(form);
  const vehiclePref = data.get("vehicle-preference") || "No preference";
  const vehicleMatch = vehicles.find((v) => v.id === vehiclePref);
  const vehicleName = vehicleMatch ? vehicleMatch.name : vehiclePref;

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay modal-overlay--active";
  overlay.id = "booking-modal";
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal__icon">✓</div>
      <h3 class="modal__title">Booking Request Received!</h3>
      <p class="modal__text">Thank you, ${data.get("full-name")}! We've received your reservation request. Our team will review it and reach out within 2 hours to confirm your booking.</p>
      <div class="modal__summary">
        <div class="modal__summary-row">
          <span class="modal__summary-label">Vehicle</span>
          <span class="modal__summary-value">${vehicleName}</span>
        </div>
        <div class="modal__summary-row">
          <span class="modal__summary-label">Pickup Date</span>
          <span class="modal__summary-value">${formatDate(data.get("pickup-date"))}</span>
        </div>
        <div class="modal__summary-row">
          <span class="modal__summary-label">Return Date</span>
          <span class="modal__summary-value">${formatDate(data.get("return-date"))}</span>
        </div>
        <div class="modal__summary-row">
          <span class="modal__summary-label">Pickup Location</span>
          <span class="modal__summary-value">${data.get("pickup-location") || "TBD"}</span>
        </div>
      </div>
      <p class="modal__text" style="font-size: 0.85rem;">We'll call or text you at <strong>${data.get("phone")}</strong> to finalize details. If you need immediate assistance, call us at <a href="${PHONE_LINK}">${PHONE}</a>.</p>
      <button class="btn btn--primary btn--full" onclick="document.getElementById('booking-modal').remove()">Got It</button>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });

  form.reset();
}

// ---- Contact Form ----
function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay modal-overlay--active";
    overlay.id = "contact-modal";
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal__icon">✉️</div>
        <h3 class="modal__title">Message Sent!</h3>
        <p class="modal__text">Thanks for reaching out, ${data.get("contact-name")}! We'll get back to you within 24 hours.</p>
        <button class="btn btn--primary btn--full" onclick="document.getElementById('contact-modal').remove()">OK</button>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.remove();
    });
    form.reset();
  });
}

// ---- Helpers ----
function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function renderStars(count) {
  return "★".repeat(count) + "☆".repeat(5 - count);
}

function getMinDate() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

// ============================================================
// PAGE RENDERERS
// ============================================================

// ---- HOME PAGE ----
function renderHomePage() {
  return `
    ${renderHero()}
    ${renderTrustBar()}
    ${renderFleetPreview()}
    ${renderHowItWorks()}
    ${renderServices()}
    ${renderWhyChooseUs()}
    ${renderTestimonials()}
    ${renderHomeFAQ()}
    ${renderContactCTA()}
  `;
}

// ---- Hero ----
function renderHero() {
  return `
    <section class="hero" id="hero-section">
      <div class="hero__bg">
        <img src="./assets/hero_dfw_light.png" alt="Dallas-Fort Worth skyline" loading="eager" />
      </div>
      <div class="hero__accent"></div>
      <div class="container">
        <div class="hero__content">
          <div class="hero__badge">
            <span class="hero__badge-dot"></span>
            Serving the DFW Metroplex
          </div>
          <h1 class="hero__title">
            Reliable Car Rentals &amp;<br>
            <span class="gold-text">Private Transportation</span> in DFW
          </h1>
          <p class="hero__subtitle">
            Book clean, comfortable vehicles with easy pickup, flexible scheduling, and friendly local service across the Dallas–Fort Worth area.
          </p>
          <div class="hero__buttons">
            <a href="#/booking" class="btn btn--primary btn--lg">Book a Vehicle</a>
            <a href="#/fleet" class="btn btn--secondary btn--lg">View Fleet</a>
            <a href="${PHONE_LINK}" class="btn btn--ghost btn--lg">📞 Call or Text</a>
          </div>
          <div class="hero__stats hide-mobile">
            <div>
              <div class="hero__stat-value">820+</div>
              <div class="hero__stat-label">Total Trips</div>
            </div>
            <div>
              <div class="hero__stat-value">5.0★</div>
              <div class="hero__stat-label">Average Rating</div>
            </div>
            <div>
              <div class="hero__stat-value">6</div>
              <div class="hero__stat-label">Years of Hosting</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

// ---- Trust Bar ----
function renderTrustBar() {
  const items = [
    { icon: "📍", text: "DFW-Based Company" },
    { icon: "💻", text: "Easy Online Booking" },
    { icon: "✨", text: "Clean, Well-Maintained Vehicles" },
    { icon: "📅", text: "Flexible Rental Options" },
    { icon: "🛣️", text: "Unlimited Mileage on Select Vehicles" },
  ];
  return `
    <section class="trust-bar">
      <div class="trust-bar__grid">
        ${items
          .map(
            (item) => `
          <div class="trust-bar__item">
            <div class="trust-bar__icon">${item.icon}</div>
            <span class="trust-bar__text">${item.text}</span>
          </div>
        `
          )
          .join("")}
      </div>
    </section>
  `;
}

// ---- Fleet Preview ----
function renderFleetPreview() {
  return `
    <section class="section" id="fleet-preview">
      <div class="container">
        <div class="section__header reveal">
          <span class="section-label">Our Fleet</span>
          <h2 class="section-title">Choose Your Perfect Vehicle</h2>
          <p class="section-subtitle">From affordable sedans to family minivans and premium SUVs — we have the right vehicle for every occasion across DFW.</p>
        </div>
        <div class="fleet-grid fleet-grid--home">
          ${vehicles.slice(0, 4).map((v, i) => renderVehicleCard(v, i)).join("")}
        </div>
        <div class="text-center mt-xl reveal">
          <a href="#/fleet" class="btn btn--secondary">View All ${vehicles.length} Vehicles →</a>
        </div>
      </div>
    </section>
  `;
}

function renderVehicleCard(vehicle, index = 0) {
  const categoryLabels = {
    sedan: "Sedan",
    suv: "SUV",
    premium: "Premium",
    family: "Family",
  };
  return `
    <div class="vehicle-card reveal reveal--delay-${(index % 4) + 1}">
      <div class="vehicle-card__image-wrap">
        <img src="${vehicle.image}" alt="${vehicle.name}" loading="lazy" />
        <span class="vehicle-card__badge">${categoryLabels[vehicle.category] || vehicle.category}</span>
      </div>
      <div class="vehicle-card__body">
        <span class="vehicle-card__type">${vehicle.type}</span>
        <h3 class="vehicle-card__name">${vehicle.name}</h3>
        <p class="vehicle-card__desc">${vehicle.shortDescription}</p>
        <div class="vehicle-card__meta">
          <span class="vehicle-card__meta-item"><span class="vehicle-card__meta-icon">👤</span> ${vehicle.seats} seats</span>
          <span class="vehicle-card__meta-item"><span class="vehicle-card__meta-icon">🧳</span> ${vehicle.bags} bags</span>
          <span class="vehicle-card__meta-item"><span class="vehicle-card__meta-icon">⚙️</span> ${vehicle.transmission}</span>
        </div>
        <div class="vehicle-card__footer">
          <div class="vehicle-card__price">
            <span class="vehicle-card__price-amount">$${vehicle.dailyRate}</span>
            <span class="vehicle-card__price-period">/day</span>
          </div>
          <a href="#/vehicle/${vehicle.id}" class="btn btn--primary btn--sm">Check Availability</a>
        </div>
      </div>
    </div>
  `;
}

// ---- How It Works ----
function renderHowItWorks() {
  const steps = [
    {
      num: "1",
      title: "Choose Your Vehicle",
      text: "Browse our fleet and select the vehicle that fits your needs and budget.",
    },
    {
      num: "2",
      title: "Select Rental Dates",
      text: "Pick your preferred pickup and return dates with flexible scheduling options.",
    },
    {
      num: "3",
      title: "Submit Info & Payment",
      text: "Fill out your driver info and payment details through our secure booking form.",
    },
    {
      num: "4",
      title: "Pickup & Drive",
      text: "Get confirmation with pickup instructions and hit the road in your clean, ready vehicle.",
    },
  ];
  return `
    <section class="section section--dark" id="how-it-works">
      <div class="container">
        <div class="section__header reveal">
          <span class="section-label">How It Works</span>
          <h2 class="section-title">Booking Made Simple</h2>
          <p class="section-subtitle">Four easy steps to get behind the wheel of a clean, comfortable vehicle.</p>
        </div>
        <div class="steps-grid">
          ${steps
            .map(
              (step, i) => `
            <div class="step-card reveal reveal--delay-${i + 1}">
              <div class="step-card__number">${step.num}</div>
              <h3 class="step-card__title">${step.title}</h3>
              <p class="step-card__text">${step.text}</p>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    </section>
  `;
}

// ---- Services ----
function renderServices() {
  const services = [
    {
      icon: "🚗",
      title: "Car Rentals",
      text: "Affordable daily, weekly, and extended vehicle rentals across DFW.",
      link: "#/fleet",
    },
    {
      icon: "🚘",
      title: "Private Transportation",
      text: "Professional chauffeur-driven service for any occasion.",
      link: "#/private-transportation",
    },
    {
      icon: "✈️",
      title: "Airport Transportation",
      text: "Reliable pickups and drop-offs at DFW Airport and Love Field.",
      link: "#/private-transportation",
    },
    {
      icon: "🎉",
      title: "Event Transportation",
      text: "Arrive in style for weddings, galas, and special celebrations.",
      link: "#/private-transportation",
    },
    {
      icon: "💼",
      title: "Business Travel",
      text: "Executive vehicles and professional service for corporate clients.",
      link: "#/fleet",
    },
  ];
  return `
    <section class="section" id="services-section">
      <div class="container">
        <div class="section__header reveal">
          <span class="section-label">Our Services</span>
          <h2 class="section-title">Transportation Solutions for Every Need</h2>
          <p class="section-subtitle">Whether you need a vehicle for the day or a professional driver for the evening, we've got you covered.</p>
        </div>
        <div class="services-grid">
          ${services
            .map(
              (s, i) => `
            <a href="${s.link}" class="service-card reveal reveal--delay-${(i % 3) + 1}">
              <div class="service-card__icon">${s.icon}</div>
              <div class="service-card__content">
                <h3 class="service-card__title">${s.title}</h3>
                <p class="service-card__text">${s.text}</p>
              </div>
              <span class="service-card__arrow">→</span>
            </a>
          `
            )
            .join("")}
        </div>
      </div>
    </section>
  `;
}

// ---- Why Choose Us ----
function renderWhyChooseUs() {
  const features = [
    {
      icon: "✨",
      title: "Clean Vehicles",
      text: "Every vehicle is professionally cleaned and inspected before every rental.",
    },
    {
      icon: "💬",
      title: "Easy Communication",
      text: "Reach us anytime by call, text, or email — we respond fast.",
    },
    {
      icon: "📍",
      title: "Local DFW Service",
      text: "We're a DFW-based company who knows the area inside and out.",
    },
    {
      icon: "📅",
      title: "Flexible Scheduling",
      text: "Need to change plans? We work with you on flexible pickup and return times.",
    },
    {
      icon: "💻",
      title: "Simple Booking",
      text: "Our straightforward online form means you can book in under 2 minutes.",
    },
    {
      icon: "😊",
      title: "Friendly Service",
      text: "We treat every customer like family — professional, warm, and reliable.",
    },
  ];
  return `
    <section class="section section--alt" id="why-choose-us">
      <div class="container">
        <div class="section__header reveal">
          <span class="section-label">Why Choose Us</span>
          <h2 class="section-title">Why Customers Choose <span class="gold-text">Levi's Legacy</span></h2>
          <p class="section-subtitle">We're not a faceless national chain. We're your local DFW transportation partner, committed to quality and trust.</p>
        </div>
        <div class="features-grid">
          ${features
            .map(
              (f, i) => `
            <div class="feature-item reveal reveal--delay-${(i % 3) + 1}">
              <div class="feature-item__icon">${f.icon}</div>
              <div>
                <h3 class="feature-item__title">${f.title}</h3>
                <p class="feature-item__text">${f.text}</p>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    </section>
  `;
}

// ---- Testimonials ----
function renderTestimonials() {
  return `
    <section class="section" id="testimonials">
      <div class="container">
        <div class="section__header reveal">
          <span class="section-label">Testimonials</span>
          <h2 class="section-title">What Our Customers Say</h2>
          <p class="section-subtitle">Real reviews from real DFW customers who trust us with their transportation needs.</p>
        </div>
        <div class="testimonials-grid">
          ${testimonials
            .slice(0, 3)
            .map(
              (t, i) => `
            <div class="testimonial-card reveal reveal--delay-${i + 1}">
              <div class="testimonial-card__stars">${renderStars(t.rating)}</div>
              <p class="testimonial-card__text">"${t.text}"</p>
              <div class="testimonial-card__author">
                <div class="testimonial-card__avatar">${t.name.charAt(0)}</div>
                <div>
                  <div class="testimonial-card__name">${t.name}</div>
                  <div class="testimonial-card__location">${t.location} · ${t.date}</div>
                </div>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    </section>
  `;
}

// ---- Home FAQ (first 5 only) ----
function renderHomeFAQ() {
  return `
    <section class="section section--dark" id="faq-section">
      <div class="container container--narrow">
        <div class="section__header reveal">
          <span class="section-label">FAQ</span>
          <h2 class="section-title">Frequently Asked Questions</h2>
        </div>
        <div class="faq-list reveal">
          ${faqData
            .slice(0, 5)
            .map(
              (faq) => `
            <div class="faq-item">
              <button class="faq-item__question" aria-expanded="false">
                <span class="faq-item__question-text">${faq.question}</span>
                <span class="faq-item__icon">+</span>
              </button>
              <div class="faq-item__answer">
                <div class="faq-item__answer-inner">${faq.answer}</div>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
        <div class="text-center mt-xl reveal">
          <a href="#/faq" class="btn btn--secondary-dark">View All FAQs →</a>
        </div>
      </div>
    </section>
  `;
}

// ---- Contact CTA ----
function renderContactCTA() {
  return `
    <section class="contact-cta" id="contact-cta">
      <div class="contact-cta__bg"></div>
      <div class="container contact-cta__content reveal">
        <h2 class="contact-cta__title">Ready to Book Your Vehicle?</h2>
        <p class="contact-cta__text">Call, text, or check availability online. We're here to help you get on the road.</p>
        <div class="contact-cta__buttons">
          <a href="#/booking" class="btn btn--primary btn--lg">Book Online</a>
          <a href="${PHONE_LINK}" class="btn btn--secondary btn--lg">📞 ${PHONE}</a>
          <a href="${SMS_LINK}" class="btn btn--ghost btn--lg">💬 Text Us</a>
        </div>
      </div>
    </section>
  `;
}

// ============================================================
// FLEET PAGE
// ============================================================
function renderFleetPage() {
  return `
    <div class="page-header">
      <div class="container">
        <span class="section-label">Our Fleet</span>
        <h1 class="page-header__title">Our Vehicle Fleet</h1>
        <p class="page-header__subtitle">Browse our selection of clean, well-maintained vehicles available for rental across the Dallas–Fort Worth area.</p>
      </div>
    </div>
    <section class="section">
      <div class="container">
        <div class="fleet-grid">
          ${vehicles.map((v, i) => renderVehicleCard(v, i)).join("")}
        </div>
      </div>
    </section>
    ${renderContactCTA()}
  `;
}

// ============================================================
// VEHICLE DETAIL PAGE
// ============================================================
function renderVehicleDetailPage(vehicleId) {
  const vehicle = vehicles.find((v) => v.id === vehicleId);
  if (!vehicle) {
    return `
      <div class="page-header">
        <div class="container">
          <h1 class="page-header__title">Vehicle Not Found</h1>
          <p class="page-header__subtitle">Sorry, we couldn't find that vehicle. Please browse our fleet.</p>
          <a href="#/fleet" class="btn btn--primary mt-lg">View Fleet</a>
        </div>
      </div>
    `;
  }

  return `
    <div class="vehicle-detail">
      <div class="container">
        <div class="vehicle-detail__breadcrumb">
          <a href="#/home">Home</a>
          <span>›</span>
          <a href="#/fleet">Fleet</a>
          <span>›</span>
          <span style="color: var(--text-body)">${vehicle.name}</span>
        </div>

        <div class="vehicle-detail__hero reveal" style="cursor: pointer;" onclick="openLightbox('${vehicle.id}', 0)">
          <img id="main-vehicle-image" src="${vehicle.image}" alt="${vehicle.name}" loading="eager" />
        </div>
        ${
          vehicle.images && vehicle.images.length > 1
            ? `
        <div class="vehicle-gallery reveal">
          ${vehicle.images
            .map(
              (img, idx) => `
            <img 
              src="${img}" 
              class="vehicle-gallery__thumb ${idx === 0 ? "active" : ""}" 
              onclick="event.stopPropagation(); document.getElementById('main-vehicle-image').src = this.src; document.querySelectorAll('.vehicle-gallery__thumb').forEach(el => el.classList.remove('active')); this.classList.add('active'); openLightbox('${vehicle.id}', ${idx});" 
              alt="${vehicle.name} Thumbnail ${idx + 1}" 
              loading="lazy"
            />
          `
            )
            .join("")}
        </div>
        `
            : ""
        }

        <div class="vehicle-detail__type">${vehicle.type}</div>
        <h1 class="vehicle-detail__name">${vehicle.name}</h1>
        <p class="vehicle-detail__best-for"><strong>Best for:</strong> ${vehicle.bestFor}</p>

        <div class="vehicle-detail__grid">
          <!-- Main Content -->
          <div class="vehicle-detail__main">
            <div class="vehicle-detail__section reveal">
              <h2 class="vehicle-detail__section-title">About This Vehicle</h2>
              <p class="vehicle-detail__description">${vehicle.fullDescription}</p>
            </div>

            <div class="vehicle-detail__section reveal">
              <h2 class="vehicle-detail__section-title">Features & Amenities</h2>
              <div class="vehicle-detail__features-list">
                ${vehicle.features.map((f) => `<div class="vehicle-detail__feature"><span class="vehicle-detail__feature-icon">✓</span> ${f}</div>`).join("")}
              </div>
            </div>

            <div class="vehicle-detail__section reveal">
              <h2 class="vehicle-detail__section-title">Rental Policies</h2>
              <div class="vehicle-detail__policy-list">
                <div class="vehicle-detail__policy">
                  <div class="vehicle-detail__policy-icon">📋</div>
                  <div>
                    <div class="vehicle-detail__policy-title">Requirements</div>
                    <div class="vehicle-detail__policy-text">${vehicle.rentalRequirements.join(". ")}.</div>
                  </div>
                </div>
                <div class="vehicle-detail__policy">
                  <div class="vehicle-detail__policy-icon">💳</div>
                  <div>
                    <div class="vehicle-detail__policy-title">Security Deposit</div>
                    <div class="vehicle-detail__policy-text">${vehicle.deposit}</div>
                  </div>
                </div>
                <div class="vehicle-detail__policy">
                  <div class="vehicle-detail__policy-icon">🛣️</div>
                  <div>
                    <div class="vehicle-detail__policy-title">Mileage Policy</div>
                    <div class="vehicle-detail__policy-text">${vehicle.mileagePolicy}</div>
                  </div>
                </div>
                <div class="vehicle-detail__policy">
                  <div class="vehicle-detail__policy-icon">⛽</div>
                  <div>
                    <div class="vehicle-detail__policy-title">Fuel Policy</div>
                    <div class="vehicle-detail__policy-text">${vehicle.fuelPolicy}</div>
                  </div>
                </div>
                <div class="vehicle-detail__policy">
                  <div class="vehicle-detail__policy-icon">📍</div>
                  <div>
                    <div class="vehicle-detail__policy-title">Pickup & Drop-off</div>
                    <div class="vehicle-detail__policy-text">${vehicle.pickupDropoff}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="vehicle-detail__sidebar">
            <div class="vehicle-detail__price-card">
              <div class="vehicle-detail__price-label">Starting at</div>
              <div class="vehicle-detail__price-value">$${vehicle.dailyRate}<span class="vehicle-detail__price-period">/day</span></div>
              <div class="vehicle-detail__price-divider"></div>
              <div class="vehicle-detail__quick-specs">
                <div class="vehicle-detail__quick-spec">
                  <span class="vehicle-detail__quick-spec-label">Seats</span>
                  <span class="vehicle-detail__quick-spec-value">${vehicle.seats} passengers</span>
                </div>
                <div class="vehicle-detail__quick-spec">
                  <span class="vehicle-detail__quick-spec-label">Luggage</span>
                  <span class="vehicle-detail__quick-spec-value">${vehicle.bags} bags</span>
                </div>
                <div class="vehicle-detail__quick-spec">
                  <span class="vehicle-detail__quick-spec-label">Transmission</span>
                  <span class="vehicle-detail__quick-spec-value">${vehicle.transmission}</span>
                </div>
                <div class="vehicle-detail__quick-spec">
                  <span class="vehicle-detail__quick-spec-label">Fuel</span>
                  <span class="vehicle-detail__quick-spec-value">${vehicle.fuelType}</span>
                </div>
                <div class="vehicle-detail__quick-spec">
                  <span class="vehicle-detail__quick-spec-label">Deposit</span>
                  <span class="vehicle-detail__quick-spec-value">${vehicle.deposit.split(" (")[0]}</span>
                </div>
              </div>
              <div class="vehicle-detail__actions">
                <a href="#/booking?vehicle=${vehicle.id}" class="btn btn--primary btn--full btn--lg">Check Availability</a>
                <a href="${PHONE_LINK}" class="btn btn--secondary btn--full">📞 Call ${PHONE}</a>
                <a href="${SMS_LINK}" class="btn btn--ghost btn--full">💬 Text Us to Book</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    ${renderContactCTA()}
  `;
}

// ============================================================
// BOOKING PAGE
// ============================================================
function renderBookingPage() {
  const hash = window.location.hash;
  const vehicleMatch = hash.match(/vehicle=([^&]+)/);
  const preselected = vehicleMatch ? decodeURIComponent(vehicleMatch[1]) : "";

  return `
    <div class="page-header">
      <div class="container">
        <span class="section-label">Reservations</span>
        <h1 class="page-header__title">Book Your Vehicle</h1>
        <p class="page-header__subtitle">Fill out the form below and we'll confirm your reservation within a few hours. It's quick and easy.</p>
      </div>
    </div>
    <section class="section">
      <div class="container container--narrow">
        <form id="booking-form" class="reveal" novalidate>
          <div class="form-grid form-grid--2col">
            <div class="form-group">
              <label class="form-label" for="full-name">Full Name <span class="required">*</span></label>
              <input type="text" class="form-input" id="full-name" name="full-name" placeholder="Your full name" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="phone">Phone Number <span class="required">*</span></label>
              <input type="tel" class="form-input" id="phone" name="phone" placeholder="(555) 123-4567" required />
            </div>
            <div class="form-group" style="grid-column: 1 / -1;">
              <label class="form-label" for="booking-email">Email Address <span class="required">*</span></label>
              <input type="email" class="form-input" id="booking-email" name="email" placeholder="you@email.com" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="pickup-date">Pickup Date <span class="required">*</span></label>
              <input type="date" class="form-input" id="pickup-date" name="pickup-date" min="${getMinDate()}" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="return-date">Return Date <span class="required">*</span></label>
              <input type="date" class="form-input" id="return-date" name="return-date" min="${getMinDate()}" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="vehicle-preference">Vehicle Preference <span class="required">*</span></label>
              <select class="form-select" id="vehicle-preference" name="vehicle-preference" required>
                <option value="">Select a vehicle</option>
                ${vehicles.map((v) => `<option value="${v.id}" ${preselected === v.id ? "selected" : ""}>${v.name} — $${v.dailyRate}/day</option>`).join("")}
                <option value="no-preference">No preference</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="pickup-location">Pickup Location <span class="required">*</span></label>
              <select class="form-select" id="pickup-location" name="pickup-location" required>
                <option value="">Select a location</option>
                <option value="DFW Office">Our DFW Office</option>
                <option value="DFW Airport">DFW Airport</option>
                <option value="Dallas Love Field">Dallas Love Field</option>
                <option value="Hotel Delivery">Hotel Delivery</option>
                <option value="Custom Address">Custom Address (specify below)</option>
              </select>
            </div>
            <div class="form-group" style="grid-column: 1 / -1;">
              <label class="form-label" for="special-notes">Special Notes or Requests</label>
              <textarea class="form-textarea" id="special-notes" name="special-notes" placeholder="Flight number, custom pickup address, special requirements, etc."></textarea>
            </div>
          </div>
          <div class="mt-xl">
            <button type="submit" class="btn btn--primary btn--lg btn--full">Submit Booking Request</button>
          </div>
          <p class="text-center mt-md" style="font-size: 0.85rem; color: var(--gray-500);">
            Prefer to book by phone? Call us at <a href="${PHONE_LINK}">${PHONE}</a>
          </p>
        </form>
      </div>
    </section>
  `;
}

// ============================================================
// PRIVATE TRANSPORTATION PAGE
// ============================================================
function renderPrivateTransportPage() {
  const services = [
    {
      icon: "✈️",
      title: "Airport Transfers",
      text: "Professional pickups and drop-offs at DFW International Airport and Dallas Love Field. We track your flight so we're ready when you land. Comfortable vehicles, meet-and-greet service, and luggage assistance included.",
    },
    {
      icon: "💼",
      title: "Corporate & Executive Travel",
      text: "Make a lasting impression with professional chauffeur-driven transportation for business meetings, client entertainment, and corporate events. Luxury vehicles available for executive-level service.",
    },
    {
      icon: "🎉",
      title: "Special Events & Celebrations",
      text: "From weddings and anniversaries to prom nights and birthday celebrations — arrive in style. We offer premium vehicles and professional drivers to make your special occasion unforgettable.",
    },
    {
      icon: "🏥",
      title: "Medical Appointments",
      text: "Reliable, comfortable transportation to and from medical facilities, hospitals, and clinics across the DFW metro area. We ensure you arrive on time and stress-free.",
    },
    {
      icon: "🌃",
      title: "Night Out & Entertainment",
      text: "Enjoy your evening without worrying about driving. Professional transportation to restaurants, concerts, sporting events, and entertainment venues throughout Dallas–Fort Worth.",
    },
    {
      icon: "👥",
      title: "Group Transportation",
      text: "Need to move a group? Our passenger van accommodates up to 12 people comfortably. Perfect for family reunions, team outings, church events, and group excursions.",
    },
  ];

  return `
    <div class="page-header">
      <div class="container">
        <span class="section-label">Private Transportation</span>
        <h1 class="page-header__title">Private Transportation Services</h1>
        <p class="page-header__subtitle">Professional chauffeur-driven transportation for any occasion across the Dallas–Fort Worth metro area.</p>
      </div>
    </div>
    <section class="section">
      <div class="container">
        <div class="text-center mb-xl reveal">
          <p class="section-subtitle" style="max-width: 700px; margin: 0 auto;">
            In addition to our vehicle rental fleet, Levi's Legacy LLC offers private transportation services with professional, courteous drivers. Whether you need an airport pickup, a ride to a corporate event, or transportation for a special celebration, we've got you covered.
          </p>
        </div>
        <div class="pt-services-grid">
          ${services.map((s, i) => `
            <div class="pt-service-card reveal reveal--delay-${(i % 3) + 1}">
              <div class="pt-service-card__icon">${s.icon}</div>
              <h3 class="pt-service-card__title">${s.title}</h3>
              <p class="pt-service-card__text">${s.text}</p>
            </div>
          `).join("")}
        </div>
      </div>
    </section>
    <section class="section section--dark">
      <div class="container container--narrow">
        <div class="section__header reveal">
          <span class="section-label">How to Book</span>
          <h2 class="section-title">Request Private Transportation</h2>
          <p class="section-subtitle">Contact us with your event details and we'll provide a personalized quote within hours.</p>
        </div>
        <div class="text-center reveal">
          <div class="contact-cta__buttons" style="justify-content: center;">
            <a href="#/contact" class="btn btn--primary btn--lg">Request a Quote</a>
            <a href="${PHONE_LINK}" class="btn btn--secondary btn--lg">📞 Call ${PHONE}</a>
          </div>
        </div>
      </div>
    </section>
    ${renderContactCTA()}
  `;
}

// ============================================================
// ABOUT PAGE
// ============================================================
function renderAboutPage() {
  return `
    <div class="page-header">
      <div class="container">
        <span class="section-label">About Us</span>
        <h1 class="page-header__title">About Levi's Legacy LLC</h1>
        <p class="page-header__subtitle">Your trusted local car rental and private transportation company in the Dallas–Fort Worth area.</p>
      </div>
    </div>
    <section class="content-page">
      <div class="container container--narrow">
        <div class="content-block reveal">
          <h2 class="content-block__title">Our Story</h2>
          <p class="content-block__text">
            Levi's Legacy LLC was founded with a simple belief: renting a vehicle should be easy, transparent, and stress-free. Based in the heart of the Dallas–Fort Worth metro area, we set out to build a car rental and private transportation company that puts customers first — no hidden fees, no corporate runaround, and no dirty vehicles.
          </p>
          <p class="content-block__text mt-md">
            As a locally owned and operated business, we understand the needs of DFW residents, visitors, and business travelers. Whether you're a family heading to a weekend getaway, a professional in need of reliable transportation, or a group looking for a ride to a special event, we've got a vehicle and a solution for you.
          </p>
        </div>

        <div class="content-block reveal">
          <h2 class="content-block__title">Our Mission</h2>
          <p class="content-block__text">
            To provide the Dallas–Fort Worth community with clean, reliable, and affordable vehicle rentals and private transportation services — delivered with integrity, transparency, and genuine customer care.
          </p>
        </div>

        <div class="content-block reveal">
          <h2 class="content-block__title">Our Values</h2>
          <div class="about-values">
            <div class="about-value">
              <div class="about-value__icon">🤝</div>
              <div>
                <div class="about-value__title">Trust & Transparency</div>
                <div class="about-value__text">No hidden fees, no surprises. What we quote is what you pay.</div>
              </div>
            </div>
            <div class="about-value">
              <div class="about-value__icon">✨</div>
              <div>
                <div class="about-value__title">Quality & Cleanliness</div>
                <div class="about-value__text">Every vehicle is professionally cleaned and inspected before every rental.</div>
              </div>
            </div>
            <div class="about-value">
              <div class="about-value__icon">📍</div>
              <div>
                <div class="about-value__title">Local & Personal</div>
                <div class="about-value__text">We're your neighbors, not a distant call center. Real people, real service.</div>
              </div>
            </div>
            <div class="about-value">
              <div class="about-value__icon">💪</div>
              <div>
                <div class="about-value__title">Reliability</div>
                <div class="about-value__text">We show up on time, every time. Your schedule matters to us.</div>
              </div>
            </div>
            <div class="about-value">
              <div class="about-value__icon">❤️</div>
              <div>
                <div class="about-value__title">Customer First</div>
                <div class="about-value__text">Every decision we make is guided by what's best for our customers.</div>
              </div>
            </div>
            <div class="about-value">
              <div class="about-value__icon">🌍</div>
              <div>
                <div class="about-value__title">Community</div>
                <div class="about-value__text">We're proud to serve the DFW community and invest in our local area.</div>
              </div>
            </div>
          </div>
        </div>

        <div class="content-block reveal">
          <h2 class="content-block__title">Service Area</h2>
          <p class="content-block__text">
            We proudly serve the entire Dallas–Fort Worth Metropolitan Area, including:
          </p>
          <p class="content-block__text mt-sm">
            <strong style="color: var(--gold-600);">Dallas · Fort Worth · Denton · Frisco · Plano · McKinney · Lewisville · Arlington · Irving · Grapevine · Garland · Mesquite · Carrollton · Richardson · Allen · Wylie · Rockwall · Mansfield · Grand Prairie</strong>
          </p>
          <p class="content-block__text mt-sm">
            We also serve DFW International Airport and Dallas Love Field for vehicle delivery and private transportation.
          </p>
        </div>
      </div>
    </section>
    ${renderContactCTA()}
  `;
}

// ============================================================
// FAQ PAGE
// ============================================================
function renderFAQPage() {
  return `
    <div class="page-header">
      <div class="container">
        <span class="section-label">FAQ</span>
        <h1 class="page-header__title">Frequently Asked Questions</h1>
        <p class="page-header__subtitle">Everything you need to know about renting a vehicle or booking private transportation with Levi's Legacy.</p>
      </div>
    </div>
    <section class="section">
      <div class="container container--narrow">
        <div class="faq-list reveal">
          ${faqData
            .map(
              (faq) => `
            <div class="faq-item">
              <button class="faq-item__question" aria-expanded="false">
                <span class="faq-item__question-text">${faq.question}</span>
                <span class="faq-item__icon">+</span>
              </button>
              <div class="faq-item__answer">
                <div class="faq-item__answer-inner">${faq.answer}</div>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
        <div class="text-center mt-xl reveal">
          <p style="color: var(--text-muted); margin-bottom: var(--space-md);">Still have questions? We're happy to help.</p>
          <a href="#/contact" class="btn btn--primary">Contact Us</a>
        </div>
      </div>
    </section>
    ${renderContactCTA()}
  `;
}

// ============================================================
// CONTACT PAGE
// ============================================================
function renderContactPage() {
  return `
    <div class="page-header">
      <div class="container">
        <span class="section-label">Contact</span>
        <h1 class="page-header__title">Get in Touch</h1>
        <p class="page-header__subtitle">Have a question, need a quote, or ready to book? Reach out — we'd love to hear from you.</p>
      </div>
    </div>
    <section class="section">
      <div class="container">
        <div class="contact-grid mb-xl">
          <div class="contact-info-card reveal">
            <div class="contact-info-card__icon">📞</div>
            <div>
              <div class="contact-info-card__title">Call Us</div>
              <div class="contact-info-card__text"><a href="${PHONE_LINK}">${PHONE}</a><br>Mon–Sat: 8am – 8pm<br>Sun: 10am – 6pm</div>
            </div>
          </div>
          <div class="contact-info-card reveal reveal--delay-1">
            <div class="contact-info-card__icon">💬</div>
            <div>
              <div class="contact-info-card__title">Text Us</div>
              <div class="contact-info-card__text"><a href="${SMS_LINK}">${PHONE}</a><br>Quick questions and booking requests welcome anytime.</div>
            </div>
          </div>
          <div class="contact-info-card reveal reveal--delay-2">
            <div class="contact-info-card__icon">✉️</div>
            <div>
              <div class="contact-info-card__title">Email Us</div>
              <div class="contact-info-card__text"><a href="mailto:${EMAIL}">${EMAIL}</a><br>We respond within 24 hours.</div>
            </div>
          </div>
          <div class="contact-info-card reveal reveal--delay-3">
            <div class="contact-info-card__icon">📍</div>
            <div>
              <div class="contact-info-card__title">Service Area</div>
              <div class="contact-info-card__text">Dallas–Fort Worth Metropolitan Area<br>Including DFW Airport & Love Field</div>
            </div>
          </div>
        </div>

        <div class="contact-grid contact-grid--main">
          <div class="reveal">
            <h2 class="section-title" style="font-size: 1.5rem;">Send Us a Message</h2>
            <p class="section-subtitle mb-xl">Fill out the form and we'll get back to you within 24 hours.</p>
            <form id="contact-form" novalidate>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label" for="contact-name">Your Name <span class="required">*</span></label>
                  <input type="text" class="form-input" id="contact-name" name="contact-name" placeholder="Full name" required />
                </div>
                <div class="form-group">
                  <label class="form-label" for="contact-email">Email <span class="required">*</span></label>
                  <input type="email" class="form-input" id="contact-email" name="contact-email" placeholder="you@email.com" required />
                </div>
                <div class="form-group">
                  <label class="form-label" for="contact-phone">Phone</label>
                  <input type="tel" class="form-input" id="contact-phone" name="contact-phone" placeholder="(555) 123-4567" />
                </div>
                <div class="form-group">
                  <label class="form-label" for="contact-subject">Subject</label>
                  <select class="form-select" id="contact-subject" name="contact-subject">
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Vehicle Rental">Vehicle Rental Question</option>
                    <option value="Private Transportation">Private Transportation Quote</option>
                    <option value="Airport Transfer">Airport Transfer</option>
                    <option value="Corporate Account">Corporate Account</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" for="contact-message">Message <span class="required">*</span></label>
                  <textarea class="form-textarea" id="contact-message" name="contact-message" placeholder="How can we help you?" required></textarea>
                </div>
              </div>
              <div class="mt-lg">
                <button type="submit" class="btn btn--primary btn--lg">Send Message</button>
              </div>
            </form>
          </div>
          <div class="reveal reveal--delay-2">
            <div style="background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: var(--space-xl);">
              <h3 style="font-family: var(--font-heading); font-weight: 700; color: var(--text-heading); margin-bottom: var(--space-lg);">Quick Response Guarantee</h3>
              <div style="display: flex; flex-direction: column; gap: var(--space-lg);">
                <div style="display: flex; gap: var(--space-md); align-items: flex-start;">
                  <span style="font-size: 1.5rem;">⚡</span>
                  <div>
                    <div style="font-weight: 600; color: var(--text-heading); margin-bottom: 4px;">Phone & Text</div>
                    <div style="font-size: 0.9rem; color: var(--text-muted);">We respond to calls and texts within minutes during business hours.</div>
                  </div>
                </div>
                <div style="display: flex; gap: var(--space-md); align-items: flex-start;">
                  <span style="font-size: 1.5rem;">📧</span>
                  <div>
                    <div style="font-weight: 600; color: var(--text-heading); margin-bottom: 4px;">Email</div>
                    <div style="font-size: 0.9rem; color: var(--text-muted);">Emails are answered within 24 hours, usually much sooner.</div>
                  </div>
                </div>
                <div style="display: flex; gap: var(--space-md); align-items: flex-start;">
                  <span style="font-size: 1.5rem;">📋</span>
                  <div>
                    <div style="font-weight: 600; color: var(--text-heading); margin-bottom: 4px;">Booking Requests</div>
                    <div style="font-size: 0.9rem; color: var(--text-muted);">Online booking requests are confirmed within 2 hours.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

// ============================================================
// POLICIES PAGE
// ============================================================
function renderPoliciesPage() {
  return `
    <div class="page-header">
      <div class="container">
        <span class="section-label">Policies</span>
        <h1 class="page-header__title">Rental Policies & Terms</h1>
        <p class="page-header__subtitle">Please review our rental policies before booking. We aim to keep everything clear and fair.</p>
      </div>
    </div>
    <section class="content-page">
      <div class="container container--narrow">
        <div class="content-block reveal">
          <h2 class="content-block__title">Driver Requirements</h2>
          <div class="content-block__text">
            <ul>
              <li>All renters must be at least 21 years of age. Luxury and group transport vehicles require renters to be 25+.</li>
              <li>A valid U.S. driver's license (or valid international driver's license with passport) is required.</li>
              <li>Additional drivers must meet the same requirements and be listed on the rental agreement.</li>
              <li>A clean driving record is required. We reserve the right to deny service based on driving history.</li>
            </ul>
          </div>
        </div>

        <div class="content-block reveal">
          <h2 class="content-block__title">Insurance Requirements</h2>
          <div class="content-block__text">
            <ul>
              <li>All renters must provide proof of valid auto insurance that covers rental vehicles.</li>
              <li>Standard vehicles: Minimum liability coverage required.</li>
              <li>Luxury vehicles & passenger vans: Full-coverage insurance required.</li>
              <li>If you do not have qualifying insurance, we can help you find temporary rental coverage options.</li>
            </ul>
          </div>
        </div>

        <div class="content-block reveal">
          <h2 class="content-block__title">Security Deposit</h2>
          <div class="content-block__text">
            <ul>
              <li>A refundable security deposit is placed on your credit card at pickup.</li>
              <li><strong>Nissan Altima & Nissan Rogue (2021/2024):</strong> $150–$200 deposit</li>
              <li><strong>Chrysler Pacifica (2017/2020):</strong> $200 deposit</li>
              <li><strong>Buick Enclave:</strong> $300 deposit</li>
              <li><strong>Kia Telluride:</strong> $350 deposit</li>
              <li>Deposits are refunded within 3–5 business days after the vehicle is returned in good condition.</li>
              <li>Deductions may apply for damage, excessive dirt, smoking, or late returns.</li>
            </ul>
          </div>
        </div>

        <div class="content-block reveal">
          <h2 class="content-block__title">Mileage Policy</h2>
          <div class="content-block__text">
            <ul>
              <li><strong>Sedans & Minivans:</strong> Unlimited mileage included.</li>
              <li><strong>Kia Telluride & Buick Enclave:</strong> 200 miles/day included. $0.30 per additional mile.</li>
            </ul>
          </div>
        </div>

        <div class="content-block reveal">
          <h2 class="content-block__title">Fuel & Charging Policy</h2>
          <div class="content-block__text">
            <ul>
              <li>Gasoline vehicles must be returned with the same fuel level as pickup. Refueling fees apply otherwise ($35–$50 depending on vehicle).</li>
            </ul>
          </div>
        </div>

        <div class="content-block reveal">
          <h2 class="content-block__title">Reservation & Cancellation</h2>
          <div class="content-block__text">
            <ul>
              <li>Reservations are confirmed within 2 hours of submission.</li>
              <li>Free cancellation up to 48 hours before your scheduled pickup.</li>
              <li>Cancellations within 24–48 hours: 50% of the first day's rate applies.</li>
              <li>Cancellations within 24 hours or no-shows: Full first day's rate applies.</li>
              <li>Early returns: No refunds for unused days unless approved in advance.</li>
            </ul>
          </div>
        </div>

        <div class="content-block reveal">
          <h2 class="content-block__title">Vehicle Use Policy</h2>
          <div class="content-block__text">
            <ul>
              <li>No smoking in any vehicle. A $250 cleaning fee applies for violations.</li>
              <li>No off-road driving. Vehicles are for paved road use only.</li>
              <li>Vehicles may not leave the state of Texas without prior written approval.</li>
              <li>Pets are allowed with a $50 pet cleaning fee (must be disclosed at booking).</li>
              <li>Renter is responsible for all traffic violations, tolls, and parking tickets during the rental period.</li>
            </ul>
          </div>
        </div>

        <div class="content-block reveal">
          <h2 class="content-block__title">Pickup & Return</h2>
          <div class="content-block__text">
            <ul>
              <li>Standard pickup hours: 8:00 AM – 6:00 PM, Monday through Saturday.</li>
              <li>Sunday and after-hours pickup available by arrangement.</li>
              <li>Late returns (more than 1 hour past scheduled time) may be charged a partial day rate.</li>
              <li>Airport and hotel delivery available for an additional fee.</li>
            </ul>
          </div>
        </div>

        <div class="content-block reveal">
          <h2 class="content-block__title">Damage & Liability</h2>
          <div class="content-block__text">
            <ul>
              <li>The renter is responsible for any damage to the vehicle during the rental period.</li>
              <li>All damage must be reported immediately by calling ${PHONE}.</li>
              <li>A pre-rental and post-rental vehicle inspection is conducted. Photos are taken and shared with the renter.</li>
              <li>Damage costs will be deducted from the security deposit. Additional charges may apply for major damage.</li>
            </ul>
          </div>
        </div>

        <div class="text-center mt-xl reveal">
          <p style="color: var(--text-muted); margin-bottom: var(--space-md);">Questions about our policies? We're happy to explain anything in detail.</p>
          <a href="#/contact" class="btn btn--primary">Contact Us</a>
        </div>
      </div>
    </section>
  `;
}
