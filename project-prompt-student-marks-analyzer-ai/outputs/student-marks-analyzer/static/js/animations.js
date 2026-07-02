const AnalyzerAnimations = (() => {
    function animateNumber(element, target, suffix = "") {
        const numericTarget = Number(target);
        if (!element || Number.isNaN(numericTarget)) return;
        const duration = 900;
        const start = performance.now();

        function frame(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = numericTarget * eased;
            element.textContent = `${current.toFixed(numericTarget % 1 === 0 ? 0 : 2)}${suffix}`;
            if (progress < 1) requestAnimationFrame(frame);
        }

        requestAnimationFrame(frame);
    }

    function revealCards() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.animate(
                        [
                            { opacity: 0, transform: "translateY(18px)" },
                            { opacity: 1, transform: "translateY(0)" },
                        ],
                        { duration: 520, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" }
                    );
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });

        document.querySelectorAll(".panel, .stat-card, .hero-card").forEach((element) => observer.observe(element));
    }

    return { animateNumber, revealCards };
})();
