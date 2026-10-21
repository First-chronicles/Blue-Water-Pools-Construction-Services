/* Blue Water Pools Construction & Services: site script (vanilla JS, no build step) */
(function () {
  "use strict";

  /* Lead form backend. Leave empty for demo mode (proposal preview).
     To go live, paste a Formspree endpoint (https://formspree.io/f/XXXXXXX) or a GHL webhook URL. */
  var FORM_ENDPOINT = "";
  var PHONE_DISPLAY = "(239) 224-8484";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Sticky header shadow ---------- */
  var header = document.querySelector(".site-header");
  var onScroll = function () { header.classList.toggle("scrolled", window.scrollY > 8); };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile drawer ---------- */
  var toggle = document.querySelector(".menu-toggle");
  var drawer = document.getElementById("drawer");
  var backdrop = document.querySelector(".drawer-backdrop");
  var closeBtn = drawer.querySelector(".drawer-close");

  function openDrawer() {
    drawer.classList.add("open");
    backdrop.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }
  function closeDrawer(returnFocus) {
    drawer.classList.remove("open");
    backdrop.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    if (returnFocus) toggle.focus();
  }
  toggle.addEventListener("click", openDrawer);
  closeBtn.addEventListener("click", function () { closeDrawer(true); });
  backdrop.addEventListener("click", function () { closeDrawer(true); });
  drawer.addEventListener("click", function (e) { if (e.target.closest("a")) closeDrawer(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && drawer.classList.contains("open")) closeDrawer(true);
  });

  /* ---------- Service buttons preselect the hero form ---------- */
  var heroService = document.getElementById("h-service");
  document.querySelectorAll("[data-service]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var val = btn.getAttribute("data-service");
      for (var i = 0; i < heroService.options.length; i++) {
        if (heroService.options[i].text === val) heroService.selectedIndex = i;
      }
      setTimeout(function () { document.getElementById("h-name").focus({ preventScroll: true }); }, reduceMotion ? 0 : 500);
    });
  });

  /* ---------- Lead forms ---------- */
  function setError(field, msg) {
    field.classList.add("invalid");
    var input = field.querySelector("input, select, textarea");
    input.setAttribute("aria-invalid", "true");
    var err = field.querySelector(".field-error");
    if (!err) {
      err = document.createElement("span");
      err.className = "field-error";
      err.id = input.id + "-err";
      field.appendChild(err);
      input.setAttribute("aria-describedby", err.id);
    }
    err.textContent = msg;
  }
  function clearErrors(form) {
    form.querySelectorAll(".field.invalid").forEach(function (f) {
      f.classList.remove("invalid");
      f.querySelector("input, select, textarea").removeAttribute("aria-invalid");
      var err = f.querySelector(".field-error");
      if (err) err.textContent = "";
    });
  }
  function validate(form) {
    clearErrors(form);
    var firstBad = null;
    form.querySelectorAll("[required]").forEach(function (input) {
      if (!input.value.trim()) {
        var label = form.querySelector('label[for="' + input.id + '"]').textContent.trim();
        setError(input.closest(".field"), "Please add your " + label.toLowerCase() + ".");
        firstBad = firstBad || input;
      }
    });
    var phone = form.querySelector('input[type="tel"]');
    if (phone && phone.value.trim() && phone.value.replace(/\D/g, "").length < 10) {
      setError(phone.closest(".field"), "Please enter a 10-digit phone number.");
      firstBad = firstBad || phone;
    }
    var email = form.querySelector('input[type="email"]');
    if (email && email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
      setError(email.closest(".field"), "Please check your email address.");
      firstBad = firstBad || email;
    }
    if (firstBad) firstBad.focus();
    return !firstBad;
  }

  document.querySelectorAll(".lead-form").forEach(function (form) {
    var status = form.querySelector(".form-status");
    var submit = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.classList.remove("is-error");
      if (!validate(form)) return;
      var name = form.querySelector('[name="name"]').value.trim().split(" ")[0];

      if (!FORM_ENDPOINT) {
        /* Demo mode: no claim that anything was delivered. */
        status.textContent = "Thank you, " + name + ". This preview is not connected to an inbox yet, so your details were not sent. To reach Blue Water Pools today, call " + PHONE_DISPLAY + ".";
        return;
      }

      submit.disabled = true;
      var original = submit.textContent;
      submit.textContent = "Sending...";
      var data = new FormData(form);
      data.append("form", form.getAttribute("data-form"));
      fetch(FORM_ENDPOINT, { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then(function (res) {
          if (res.status === 200) {
            form.reset();
            status.textContent = "Thank you, " + name + ". Your request was received. We will be in touch soon. For anything urgent, call " + PHONE_DISPLAY + ".";
          } else {
            throw new Error("Status " + res.status);
          }
        })
        .catch(function () {
          status.classList.add("is-error");
          status.textContent = "Sorry, your request did not go through. Please call " + PHONE_DISPLAY + " or email bwaterpoolsconstruction@gmail.com.";
        })
        .finally(function () {
          submit.disabled = false;
          submit.textContent = original;
        });
    });
  });

  /* ---------- Lightbox ---------- */
  var box = document.querySelector(".lightbox");
  var items = Array.prototype.slice.call(document.querySelectorAll("[data-lightbox]"));
  if (box && typeof box.showModal === "function" && items.length) {
    var img = box.querySelector("img");
    var cap = box.querySelector("figcaption");
    var idx = 0;
    var lastTrigger = null;
    var show = function (i) {
      idx = (i + items.length) % items.length;
      var a = items[idx];
      img.src = a.getAttribute("href");
      img.alt = a.querySelector("img").alt;
      cap.textContent = a.getAttribute("data-caption") || "";
    };
    items.forEach(function (a, i) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        lastTrigger = a;
        show(i);
        box.showModal();
      });
    });
    box.querySelector(".lightbox-close").addEventListener("click", function () { box.close(); });
    box.querySelector(".prev").addEventListener("click", function () { show(idx - 1); });
    box.querySelector(".next").addEventListener("click", function () { show(idx + 1); });
    box.addEventListener("click", function (e) { if (e.target === box) box.close(); });
    box.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
    });
    box.addEventListener("close", function () { if (lastTrigger) lastTrigger.focus(); });
  }

  /* ---------- Service-area map (public town centers only, never a business address) ---------- */
  var TOWNS = [
    { name: "Cape Coral", lat: 26.5629, lng: -81.9495, main: true },
    { name: "Fort Myers", lat: 26.6406, lng: -81.8723 },
    { name: "Naples", lat: 26.1420, lng: -81.7948 },
    { name: "Estero", lat: 26.4381, lng: -81.8068 },
    { name: "Bonita Springs", lat: 26.3398, lng: -81.7787 },
    { name: "Pine Island", lat: 26.6126, lng: -82.1162 },
    { name: "St. James City", lat: 26.4973, lng: -82.0790 },
    { name: "Bokeelia", lat: 26.7059, lng: -82.1590 },
    { name: "Punta Gorda", lat: 26.9298, lng: -82.0454 },
    { name: "Ave Maria", lat: 26.3270, lng: -81.4387 },
    { name: "LaBelle", lat: 26.7617, lng: -81.4384 },
    { name: "Glades County (Moore Haven)", lat: 26.8331, lng: -81.0931 }
  ];
  var mapEl = document.getElementById("map");

  function initMap() {
    if (!window.L || mapEl.dataset.ready) return;
    mapEl.dataset.ready = "1";
    var map = L.map(mapEl, { scrollWheelZoom: false, zoomSnap: 0.25 });
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 18,
      attribution: "Imagery &copy; Esri, Maxar, Earthstar Geographics"
    }).addTo(map);
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 18,
      attribution: "Labels &copy; Esri"
    }).addTo(map);

    var bounds = [];
    TOWNS.forEach(function (t) {
      var m = L.circleMarker([t.lat, t.lng], {
        radius: t.main ? 13 : 9,
        color: "#ffffff",
        weight: t.main ? 4 : 3,
        fillColor: t.main ? "#29a9e1" : "#1d5fcc",
        fillOpacity: 1
      }).addTo(map);
      m.bindTooltip(t.name, {
        permanent: t.main,
        direction: "top",
        offset: [0, t.main ? -12 : -8],
        className: "map-label" + (t.main ? " main" : "")
      });
      bounds.push([t.lat, t.lng]);
    });
    map.fitBounds(bounds, { padding: [36, 36] });
    window.addEventListener("resize", function () { map.invalidateSize(); });
  }

  if (mapEl) {
    if ("IntersectionObserver" in window) {
      var mo = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { initMap(); mo.disconnect(); }
      }, { rootMargin: "300px" });
      mo.observe(mapEl);
    } else {
      window.addEventListener("load", initMap);
    }
  }

  /* ---------- Gentle reveal on scroll ---------- */
  if (!reduceMotion && "IntersectionObserver" in window) {
    var targets = document.querySelectorAll(".svc-card, .blog-card, .step, .gallery-grid a, .why-list li, .faq details");
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); ro.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -40px 0px" });
    targets.forEach(function (el) {
      if (el.getBoundingClientRect().top > window.innerHeight) {
        el.classList.add("reveal");
        ro.observe(el);
      }
    });
  }

  /* ---------- Footer year ---------- */
  var y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();
})();
