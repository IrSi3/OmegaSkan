// Animated navbar when scrolled
window.addEventListener("scroll", function () {
    const navbar = document.querySelector(".navbar");
    navbar.classList.toggle("navbar-scrolled", window.scrollY > 50);
  });

// On mobile: navbar static-top when not scrolled and fixed-top when scrolled down
window.addEventListener("scroll", function () {
  const navbar = document.querySelector(".navbar");
  navbar.classList.toggle("navbar-static", window.scrollY <= 0);
  navbar.classList.toggle("navbar-fixed", window.scrollY > 0);

});

