(function () {
    "use strict";

    var $ = function (selector, scope) {
        return (scope || document).querySelector(selector);
    };
    var $$ = function (selector, scope) {
        return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
    };
    var prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    document.addEventListener("DOMContentLoaded", function () {
        var body = document.body;
        var page = body.getAttribute("data-page") || "home";
        var header = $("#siteHeader");

        body.classList.add("is-ready");

        $$('[data-delay]').forEach(function (element) {
            element.style.setProperty("--reveal-delay", element.getAttribute("data-delay") || 0);
        });

        $$('[data-current-year]').forEach(function (element) {
            element.textContent = new Date().getFullYear();
        });

        setupReveal();
        setupAmbientCanvas();
        setupNavigation(header);
        setupIntro();
        setupMusic();
        setupCounters();
        setupMagneticButtons();
        setupTransitions();
        setupPointerGlow();

        window.A1App = {
            page: page,
            $: $,
            $$: $$,
            reducedMotion: prefersReducedMotion
        };

        function setupReveal() {
            var items = $$('[data-reveal]');
            if (!items.length || prefersReducedMotion || !("IntersectionObserver" in window)) {
                items.forEach(function (item) { item.classList.add("is-visible"); });
                return;
            }

            var observer = new IntersectionObserver(function (entries, instance) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        instance.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.12, rootMargin: "0px 0px -6%" });

            items.forEach(function (item) { observer.observe(item); });
        }

        function setupAmbientCanvas() {
            var canvas = $("#ambientCanvas");
            if (!canvas || prefersReducedMotion) return;

            var context = canvas.getContext("2d");
            var width = 0;
            var height = 0;
            var ratio = Math.min(window.devicePixelRatio || 1, 2);
            var motes = [];
            var lastFrame = 0;

            function resize() {
                ratio = Math.min(window.devicePixelRatio || 1, 2);
                width = window.innerWidth;
                height = window.innerHeight;
                canvas.width = width * ratio;
                canvas.height = height * ratio;
                canvas.style.width = width + "px";
                canvas.style.height = height + "px";
                context.setTransform(ratio, 0, 0, ratio, 0, 0);
                if (!motes.length) {
                    for (var i = 0; i < 42; i += 1) {
                        motes.push({
                            x: Math.random() * width,
                            y: Math.random() * height,
                            radius: Math.random() * 1.8 + 0.3,
                            alpha: Math.random() * 0.35 + 0.06,
                            speed: Math.random() * 0.13 + 0.025,
                            drift: Math.random() * 0.4 - 0.2,
                            phase: Math.random() * Math.PI * 2
                        });
                    }
                }
            }

            function render(time) {
                if (document.hidden) {
                    lastFrame = time;
                    window.requestAnimationFrame(render);
                    return;
                }

                var delta = Math.min((time - lastFrame) / 16.67 || 1, 3);
                lastFrame = time;
                context.clearRect(0, 0, width, height);
                context.globalCompositeOperation = "screen";

                motes.forEach(function (mote) {
                    mote.y -= mote.speed * delta;
                    mote.x += Math.sin(time * 0.00025 + mote.phase) * mote.drift * delta;
                    if (mote.y < -10) mote.y = height + 10;
                    if (mote.x < -10) mote.x = width + 10;
                    if (mote.x > width + 10) mote.x = -10;

                    var pulse = 0.72 + Math.sin(time * 0.001 + mote.phase) * 0.28;
                    var glow = context.createRadialGradient(mote.x, mote.y, 0, mote.x, mote.y, mote.radius * 8);
                    glow.addColorStop(0, "rgba(231, 134, 154, " + (mote.alpha * pulse) + ")");
                    glow.addColorStop(1, "rgba(231, 134, 154, 0)");
                    context.fillStyle = glow;
                    context.beginPath();
                    context.arc(mote.x, mote.y, mote.radius * 8, 0, Math.PI * 2);
                    context.fill();
                });
                context.globalCompositeOperation = "source-over";
                window.requestAnimationFrame(render);
            }

            resize();
            window.addEventListener("resize", resize, { passive: true });
            window.requestAnimationFrame(render);
        }

        function setupNavigation(siteHeader) {
            if (!siteHeader) return;
            var toggle = $("#navToggle");
            var links = $("#navLinks");

            function setScrolled() {
                siteHeader.classList.toggle("is-scrolled", window.scrollY > 26);
            }

            setScrolled();
            window.addEventListener("scroll", setScrolled, { passive: true });

            if (!toggle || !links) return;
            toggle.addEventListener("click", function () {
                var open = toggle.getAttribute("aria-expanded") === "true";
                toggle.setAttribute("aria-expanded", String(!open));
                toggle.setAttribute("aria-label", open ? "Mở menu" : "Đóng menu");
                links.classList.toggle("is-open", !open);
                body.classList.toggle("menu-open", !open);
            });

            $$("a", links).forEach(function (link) {
                link.addEventListener("click", function () {
                    toggle.setAttribute("aria-expanded", "false");
                    links.classList.remove("is-open");
                    body.classList.remove("menu-open");
                });
            });
        }

        function setupIntro() {
            var intro = $("#introScreen");
            if (!intro) return;

            var seen = false;
            try { seen = sessionStorage.getItem("12a1-intro-seen") === "true"; } catch (error) { /* private browsing */ }

            if (seen) {
                intro.classList.add("is-skipped");
                body.classList.remove("intro-open");
                return;
            }

            body.classList.add("intro-open");
            var enter = $("#enterExperience");
            if (!enter) return;

            enter.addEventListener("click", function () {
                try { sessionStorage.setItem("12a1-intro-seen", "true"); } catch (error) { /* no-op */ }
                intro.classList.add("is-leaving");
                body.classList.remove("intro-open");
                var audio = $("#player");
                if (audio) {
                    audio.volume = 0.68;
                    var playRequest = audio.play();
                    if (playRequest && playRequest.catch) playRequest.catch(function () {});
                }
                window.setTimeout(function () { intro.remove(); }, 1100);
            });
        }

        function setupMusic() {
            var dock = $("#musicPlayer");
            var audio = $("#player");
            if (!dock || !audio) return;

            var toggle = $(".music-player__toggle", dock);
            var mute = $(".music-player__mute", dock);
            audio.volume = 0.68;

            function updateState() {
                var playing = !audio.paused;
                dock.classList.toggle("is-playing", playing);
                toggle.setAttribute("aria-label", playing ? "Tạm dừng nhạc" : "Phát nhạc");
            }

            function startAudio() {
                var promise = audio.play();
                if (promise && promise.then) {
                    promise.then(updateState).catch(updateState);
                } else {
                    updateState();
                }
            }

            toggle.addEventListener("click", function () {
                dock.classList.add("is-expanded");
                if (audio.paused) startAudio();
                else audio.pause();
                updateState();
            });

            mute.addEventListener("click", function () {
                audio.muted = !audio.muted;
                dock.classList.toggle("is-muted", audio.muted);
                mute.setAttribute("aria-label", audio.muted ? "Bật âm thanh" : "Tắt âm thanh");
            });

            audio.addEventListener("play", updateState);
            audio.addEventListener("pause", updateState);
            audio.addEventListener("ended", updateState);
            updateState();

            try {
                if (sessionStorage.getItem("12a1-intro-seen") === "true" && body.getAttribute("data-page") !== "home") {
                    window.setTimeout(startAudio, 180);
                }
            } catch (error) { /* no-op */ }
        }

        function setupCounters() {
            var counters = $$('[data-since]');
            if (!counters.length) return;

            function pad(number, length) {
                var value = String(number);
                while (value.length < length) value = "0" + value;
                return value;
            }

            function update() {
                var now = Date.now();
                counters.forEach(function (counter) {
                    var since = new Date(counter.getAttribute("data-since")).getTime();
                    var seconds = Math.max(0, Math.floor((now - since) / 1000));
                    var days = Math.floor(seconds / 86400);
                    seconds %= 86400;
                    var hours = Math.floor(seconds / 3600);
                    seconds %= 3600;
                    var minutes = Math.floor(seconds / 60);
                    seconds %= 60;
                    var values = { days: pad(days, 4), hours: pad(hours, 2), minutes: pad(minutes, 2), seconds: pad(seconds, 2) };
                    Object.keys(values).forEach(function (unit) {
                        var target = $("[data-unit='" + unit + "']", counter);
                        if (target) target.textContent = values[unit];
                    });
                });
            }

            update();
            window.setInterval(update, 1000);
        }

        function setupMagneticButtons() {
            if (prefersReducedMotion || !window.matchMedia || !window.matchMedia("(pointer: fine)").matches) return;
            $$(".magnetic").forEach(function (element) {
                element.addEventListener("pointermove", function (event) {
                    var rect = element.getBoundingClientRect();
                    var x = (event.clientX - rect.left - rect.width / 2) * 0.12;
                    var y = (event.clientY - rect.top - rect.height / 2) * 0.12;
                    element.style.transform = "translate(" + x + "px, " + y + "px)";
                });
                element.addEventListener("pointerleave", function () {
                    element.style.transform = "";
                });
            });
        }

        function setupTransitions() {
            $$('a.page-link').forEach(function (link) {
                link.addEventListener("click", function (event) {
                    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                    var destination = new URL(link.href, window.location.href);
                    if (destination.origin !== window.location.origin || destination.pathname === window.location.pathname) return;
                    event.preventDefault();
                    body.classList.add("is-page-leaving");
                    window.setTimeout(function () { window.location.href = destination.href; }, 350);
                });
            });
        }

        function setupPointerGlow() {
            if (prefersReducedMotion || !window.matchMedia || !window.matchMedia("(pointer: fine)").matches) return;
            var queued = false;
            var x = 0;
            var y = 0;
            window.addEventListener("pointermove", function (event) {
                x = event.clientX;
                y = event.clientY;
                if (queued) return;
                queued = true;
                window.requestAnimationFrame(function () {
                    document.documentElement.style.setProperty("--mouse-x", x + "px");
                    document.documentElement.style.setProperty("--mouse-y", y + "px");
                    queued = false;
                });
            }, { passive: true });

            $$('[data-parallax]').forEach(function (element) {
                window.addEventListener("pointermove", function (event) {
                    var rect = element.getBoundingClientRect();
                    if (rect.bottom < 0 || rect.top > window.innerHeight) return;
                    var px = (event.clientX - window.innerWidth / 2) * 0.006;
                    var py = (event.clientY - window.innerHeight / 2) * 0.006;
                    element.style.transform = "translate3d(" + px + "px, " + py + "px, 0)";
                }, { passive: true });
            });
        }
    });
})();
