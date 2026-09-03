// 1. Register GSAP Plugins
gsap.registerPlugin(ScrollTrigger, TextPlugin);

// 2. Timeline Animation Sequence
const tl = gsap.timeline();

// Typewriter Headline Reveal
tl.to("#typewriter-text", {
    duration: 1.8,
    text: "Digital Experiences.",
    ease: "none",
    delay: 0.3
})
    // Fade & Slide in Subtitle right after
    .from(".hero-sub", {
        y: 20,
        opacity: 0,
        duration: 1,
        ease: "power2.out"
    }, "-=0.2");