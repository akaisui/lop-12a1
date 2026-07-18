(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {
        var gallery = document.getElementById("gallery");
        if (!gallery) return;

        var total = 199;
        var batchSize = 28;
        var rendered = 0;
        var order = [];
        var cards = [];
        var count = document.getElementById("galleryCount");
        var more = document.getElementById("galleryMore");
        var loadMore = document.getElementById("loadMore");
        var shuffle = document.getElementById("shuffleGallery");
        var lightbox = document.getElementById("lightbox");
        var lightboxImage = document.getElementById("lightboxImage");
        var lightboxFigure = lightbox ? lightbox.querySelector(".lightbox__figure") : null;
        var lightboxCaption = document.getElementById("lightboxCaption");
        var lightboxCounter = document.getElementById("lightboxCounter");
        var activeIndex = 0;
        var lastFocus = null;

        for (var i = 1; i <= total; i += 1) order.push(i);

        function pad(value) {
            return String(value).length < 2 ? "0" + value : String(value);
        }

        function updateCount() {
            if (count) count.innerHTML = "<strong>" + rendered + "</strong> / " + total + " khoảnh khắc";
            if (more) {
                var complete = rendered >= total;
                more.classList.toggle("is-complete", complete);
                var message = more.querySelector("p");
                if (message) message.textContent = complete ? "Bạn đã đi qua tất cả những ngày đẹp nhất." : "Vẫn còn rất nhiều câu chuyện đang chờ...";
            }
        }

        function createCard(number, position) {
            var figure = document.createElement("figure");
            var image = document.createElement("img");
            figure.className = "gallery-item";
            figure.setAttribute("tabindex", "0");
            figure.setAttribute("role", "button");
            figure.setAttribute("aria-label", "Mở ảnh kỷ niệm số " + pad(number));
            figure.dataset.index = String(position);
            image.src = "./img/p" + number + ".jpg";
            image.alt = "Kỷ niệm 12A1 — ảnh số " + pad(number);
            image.loading = "lazy";
            image.decoding = "async";
            image.addEventListener("load", function () {
                figure.classList.add("is-loaded");
            }, { once: true });
            image.addEventListener("error", function () {
                figure.classList.add("is-loaded");
                figure.classList.add("is-missing");
            }, { once: true });
            figure.appendChild(image);

            if (image.complete) {
                window.setTimeout(function () { figure.classList.add("is-loaded"); }, 30);
            }

            figure.addEventListener("click", function () { openLightbox(position); });
            figure.addEventListener("keydown", function (event) {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openLightbox(position);
                }
            });
            return figure;
        }

        function renderBatch(reset) {
            if (reset) {
                gallery.innerHTML = "";
                cards = [];
                rendered = 0;
            }
            var end = Math.min(rendered + batchSize, total);
            var fragment = document.createDocumentFragment();
            for (var index = rendered; index < end; index += 1) {
                var card = createCard(order[index], index);
                cards[index] = card;
                fragment.appendChild(card);
            }
            gallery.appendChild(fragment);
            rendered = end;
            updateCount();
        }

        function shuffleOrder() {
            for (var index = order.length - 1; index > 0; index -= 1) {
                var randomIndex = Math.floor(Math.random() * (index + 1));
                var temp = order[index];
                order[index] = order[randomIndex];
                order[randomIndex] = temp;
            }
            renderBatch(true);
            var first = gallery.querySelector(".gallery-item");
            if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
        }

        function preload(index) {
            if (index < 0 || index >= total) return;
            var image = new Image();
            image.src = "./img/p" + order[index] + ".jpg";
        }

        function renderLightboxImage() {
            var number = order[activeIndex];
            if (!lightboxImage || !lightboxFigure) return;
            lightboxImage.classList.remove("is-visible");
            lightboxFigure.classList.remove("is-loaded");
            lightboxImage.alt = "Kỷ niệm 12A1 — ảnh số " + pad(number);
            lightboxCaption.textContent = "Một mảnh ký ức của 12A1 · " + pad(number) + " / " + total;
            lightboxCounter.textContent = pad(activeIndex + 1) + " / " + total;
            lightboxImage.onload = function () {
                lightboxFigure.classList.add("is-loaded");
                requestAnimationFrame(function () { lightboxImage.classList.add("is-visible"); });
            };
            lightboxImage.src = "./img/p" + number + ".jpg";
            preload(activeIndex - 1);
            preload(activeIndex + 1);
        }

        function openLightbox(index) {
            if (!lightbox) return;
            activeIndex = Math.max(0, Math.min(total - 1, index));
            lastFocus = document.activeElement;
            lightbox.classList.add("is-open");
            lightbox.setAttribute("aria-hidden", "false");
            document.body.classList.add("lightbox-open");
            renderLightboxImage();
            var close = lightbox.querySelector("[data-lightbox-close]");
            if (close) close.focus();
        }

        function closeLightbox() {
            if (!lightbox) return;
            lightbox.classList.remove("is-open");
            lightbox.setAttribute("aria-hidden", "true");
            document.body.classList.remove("lightbox-open");
            if (lastFocus && lastFocus.focus) lastFocus.focus();
        }

        function moveLightbox(direction) {
            activeIndex = (activeIndex + direction + total) % total;
            renderLightboxImage();
        }

        if (loadMore) loadMore.addEventListener("click", function () { renderBatch(false); });
        if (shuffle) shuffle.addEventListener("click", shuffleOrder);
        if (lightbox) {
            lightbox.addEventListener("click", function (event) {
                if (event.target.hasAttribute("data-lightbox-close")) closeLightbox();
            });
            var prev = document.getElementById("lightboxPrev");
            var next = document.getElementById("lightboxNext");
            if (prev) prev.addEventListener("click", function () { moveLightbox(-1); });
            if (next) next.addEventListener("click", function () { moveLightbox(1); });
            document.addEventListener("keydown", function (event) {
                if (!lightbox.classList.contains("is-open")) return;
                if (event.key === "Escape") closeLightbox();
                if (event.key === "ArrowLeft") moveLightbox(-1);
                if (event.key === "ArrowRight") moveLightbox(1);
            });
        }

        renderBatch(false);
    });
})();
