(function () {
    "use strict";

    var MEMBERS = [
        "Kha", "Huyện", "Thanh Duy", "Quốc Khang", "Tuấn Anh", "Minh", "Ngọc", "Tiến",
        "Hoàng Khang", "Yến", "Kiệt", "Phúc", "Quyến", "Trường", "Tố", "Giang",
        "Khánh Duy", "Yên", "Cầm", "Dương Hân", "Nhi", "Mẫn", "Đào", "Lan Anh",
        "Thu Ngọc", "Mơ", "Á", "Mơ", "Quỳnh", "Lành", "Thành Duy", "Hòa",
        "Tú Anh", "Đoàn", "Phương Hòa", "Hậu", "Hân", "Phước", "Phát", "Bích"
    ];

    document.addEventListener("DOMContentLoaded", function () {
        var canvas = document.getElementById("memoryCanvas");
        if (!canvas) return;

        var shell = canvas.parentElement;
        var trigger = document.getElementById("plantMemory");
        var status = document.getElementById("memoryStatus");
        var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
        function ease(v) { return v === 1 ? 1 : 1 - Math.pow(2, -10 * v); }

        function quadratic(a, b, c, t) {
            var u = 1 - t;
            return { x: u * u * a.x + 2 * u * t * b.x + t * t * c.x, y: u * u * a.y + 2 * u * t * b.y + t * t * c.y };
        }

        function heartPath(ctx, x, y, s) {
            var pts = [];
            for (var i = 0; i <= 40; i += 1) {
                var a = (Math.PI * 2 * i) / 40;
                pts.push({
                    x: x + 16 * Math.pow(Math.sin(a), 3) * s,
                    y: y - (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) * s
                });
            }
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            pts.slice(1).forEach(function (p) { ctx.lineTo(p.x, p.y); });
            ctx.closePath();
        }

        /* ═══════════════════ MemoryTree ═══════════════════ */
        function MemoryTree() {
            this.ctx = canvas.getContext("2d");
            this.w = 0; this.h = 0; this.ratio = 1; this.base = 0;
            this.branches = [];
            this.blooms = [];
            this.decorations = [];
            this.particles = [];
            this.petals = [];
            this.sparkles = [];
            this.pointer = { x: -100, y: -100 };
            this.running = false;
            this.finished = false;
            this.startedAt = 0;
            this.duration = reduceMotion ? 100 : 7200;
            this.resize = this.resize.bind(this);
            this.frame = this.frame.bind(this);
            this.resize();
            window.addEventListener("resize", this.resize, { passive: true });
            canvas.addEventListener("pointermove", this._onMove.bind(this), { passive: true });
            canvas.addEventListener("pointerleave", function () {
                this.pointer.x = this.pointer.y = -100;
            }.bind(this));
            requestAnimationFrame(this.frame);
        }

        MemoryTree.prototype.rnd = function () {
            this.seed = (this.seed * 9301 + 49297) % 233280;
            return this.seed / 233280;
        };

        MemoryTree.prototype._onMove = function (e) {
            var r = canvas.getBoundingClientRect();
            this.pointer.x = e.clientX - r.left;
            this.pointer.y = e.clientY - r.top;
        };

        MemoryTree.prototype.resize = function () {
            var r = shell.getBoundingClientRect();
            this.w = Math.max(320, r.width);
            this.h = Math.max(260, r.height);
            this.ratio = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = this.w * this.ratio;
            canvas.height = this.h * this.ratio;
            canvas.style.width = this.w + "px";
            canvas.style.height = this.h + "px";
            this.ctx.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
            this.generate();
        };

        /* ─── Generate tree structure ─── */
        MemoryTree.prototype.generate = function () {
            this.seed = 12;
            this.branches = [];
            this.particles = [];
            this.petals = [];
            this.sparkles = [];
            var base = Math.min(this.w, this.h);
            this.base = base;

            /* Build branches & collect ALL candidate bloom positions */
            this._candidates = [];
            var root = { x: this.w / 2, y: this.h * 0.93 };
            this.makeBranch(root, base * 0.37, -Math.PI / 2, base * 0.038, 5, 0);

            /* ── Distribute exactly 40 named blooms evenly across candidates ── */
            var candidates = this._candidates;
            var total = MEMBERS.length;
            var step = candidates.length / total;
            var selected = {};
            this.blooms = [];
            this.decorations = [];

            for (var i = 0; i < total; i += 1) {
                var idx = Math.min(Math.round(i * step), candidates.length - 1);
                while (selected[idx] && idx < candidates.length - 1) idx += 1;
                selected[idx] = true;
                var bl = candidates[idx];
                bl.name = MEMBERS[i];
                this.blooms.push(bl);
            }

            for (var k = 0; k < candidates.length; k += 1) {
                if (!selected[k]) this.decorations.push(candidates[k]);
            }

            /* Pre-calculate name positions & resolve overlaps */
            this.resolveNames();

            /* Ambient particles */
            for (var pi = 0; pi < 100; pi += 1) {
                this.particles.push({
                    x: this.rnd() * this.w,
                    y: this.rnd() * this.h * 0.85,
                    r: this.rnd() * 1.6 + 0.3,
                    a: this.rnd() * 0.5 + 0.1,
                    ph: this.rnd() * Math.PI * 2,
                    c: this.rnd() > 0.5 ? "231,134,154" : "216,180,119"
                });
            }

            /* Falling petals */
            for (var pj = 0; pj < 50; pj += 1) {
                this.petals.push({
                    x: this.rnd() * this.w, y: this.rnd() * this.h,
                    sz: this.rnd() * 3.2 + 1.5, sp: this.rnd() * 0.45 + 0.1,
                    dr: this.rnd() * 0.7 - 0.35, rot: this.rnd() * Math.PI,
                    ph: this.rnd() * Math.PI * 2,
                    c: this.rnd() > 0.6 ? "216,180,119" : "231,134,154"
                });
            }

            /* Sparkles clustered near blooms */
            for (var sk = 0; sk < 35; sk += 1) {
                var ref = this.blooms.length > 0 ? this.blooms[Math.floor(this.rnd() * this.blooms.length)] : null;
                this.sparkles.push({
                    x: ref ? ref.point.x + (this.rnd() - 0.5) * 80 : this.rnd() * this.w,
                    y: ref ? ref.point.y + (this.rnd() - 0.5) * 80 : this.rnd() * this.h * 0.5,
                    sz: this.rnd() * 1.4 + 0.5,
                    a: this.rnd() * 0.6 + 0.2,
                    sp: this.rnd() * 0.006 + 0.002,
                    ph: this.rnd() * Math.PI * 2
                });
            }

            delete this._candidates;
        };

        /* ─── Collision-resolved name positions ─── */
        MemoryTree.prototype.resolveNames = function () {
            var fontSize = Math.max(9, this.base * 0.019);
            this.fontSize = fontSize;
            var ctx = this.ctx;
            var self = this;

            ctx.font = "600 " + fontSize + "px 'Be Vietnam Pro', sans-serif";

            /* Initial radial positions along branch angle */
            this.blooms.forEach(function (b) {
                var hs = b.size * 1.15 * self.base * 0.00042;
                var dist = hs * 24 + fontSize * 1.5;
                b.nameX = b.point.x + Math.cos(b.angle) * dist;
                b.nameY = b.point.y + Math.sin(b.angle) * dist;
                b.nameW = ctx.measureText(b.name).width;
            });

            /* Iterative repulsion — push overlapping labels apart */
            var padX = fontSize * 0.7;
            var padY = fontSize * 0.5;
            for (var pass = 0; pass < 16; pass += 1) {
                for (var i = 0; i < this.blooms.length; i += 1) {
                    for (var j = i + 1; j < this.blooms.length; j += 1) {
                        var bi = this.blooms[i], bj = this.blooms[j];
                        var dx = bj.nameX - bi.nameX;
                        var dy = bj.nameY - bi.nameY;
                        var minX = (bi.nameW + bj.nameW) / 2 + padX;
                        var minY = fontSize + padY;
                        var overlapX = minX - Math.abs(dx);
                        var overlapY = minY - Math.abs(dy);
                        if (overlapX > 0 && overlapY > 0) {
                            /* Push along the axis with smaller overlap */
                            if (overlapX < overlapY) {
                                var pushX = overlapX * 0.28 * (dx >= 0 ? 1 : -1);
                                bi.nameX -= pushX;
                                bj.nameX += pushX;
                            } else {
                                var pushY = overlapY * 0.28 * (dy >= 0 ? 1 : -1);
                                bi.nameY -= pushY;
                                bj.nameY += pushY;
                            }
                        }
                    }
                }
            }

            /* Clamp inside canvas */
            this.blooms.forEach(function (b) {
                var hw = b.nameW / 2 + 6;
                b.nameX = clamp(b.nameX, hw, self.w - hw);
                b.nameY = clamp(b.nameY, fontSize, self.h - fontSize * 2.5);
            });
        };

        /* ─── Recursive branch builder ─── */
        MemoryTree.prototype.makeBranch = function (start, length, angle, width, depth, parentStart) {
            var end = {
                x: start.x + Math.cos(angle) * length,
                y: start.y + Math.sin(angle) * length
            };
            var bend = {
                x: (start.x + end.x) / 2 + (this.rnd() - 0.5) * length * 0.45,
                y: (start.y + end.y) / 2 + (this.rnd() - 0.5) * length * 0.18
            };
            var startAt = clamp(parentStart + (depth ? 0.04 + this.rnd() * 0.04 : 0), 0, 0.9);
            var seg = {
                start: start, bend: bend, end: end,
                width: width, depth: depth,
                startAt: startAt, duration: 0.1 + this.rnd() * 0.07
            };
            this.branches.push(seg);

            if (depth <= 1) {
                this._candidates.push({
                    point: end,
                    size: this.rnd() * 1.0 + 1.8,
                    hue: this.rnd(),
                    at: startAt + seg.duration * 0.8,
                    phase: this.rnd() * Math.PI * 2,
                    angle: angle,
                    name: null
                });
            }

            if (depth <= 0) return;
            var cs = startAt + seg.duration * 0.58;
            var cl = length * (0.63 + this.rnd() * 0.12);
            var sp = 0.34 + this.rnd() * 0.25;
            this.makeBranch(end, cl, angle - sp, width * 0.65, depth - 1, cs);
            this.makeBranch(end, cl * (0.85 + this.rnd() * 0.13), angle + sp, width * 0.65, depth - 1, cs + 0.01);
            if (depth > 3 && this.rnd() > 0.25) {
                this.makeBranch(end, cl * 0.7, angle + (this.rnd() - 0.5) * 0.24, width * 0.52, depth - 2, cs + 0.04);
            }
        };

        /* ─── Animation lifecycle ─── */
        MemoryTree.prototype.start = function () {
            if (this.running) return;
            this.running = true;
            this.finished = false;
            this.startedAt = performance.now();
            if (trigger) trigger.classList.add("is-hidden");
            if (status) {
                status.classList.add("is-growing");
                status.textContent = "Một ký ức đang lớn lên...";
            }
        };

        MemoryTree.prototype.frame = function (t) {
            var p = this.running ? clamp((t - this.startedAt) / this.duration, 0, 1) : 0;
            if (this.running && p >= 1 && !this.finished) {
                this.finished = true;
                if (status) status.textContent = "Và rồi, thanh xuân lại nở hoa.";
            }
            this.draw(t, p);
            requestAnimationFrame(this.frame);
        };

        /* ─── Main draw ─── */
        MemoryTree.prototype.draw = function (t, p) {
            var c = this.ctx;
            c.clearRect(0, 0, this.w, this.h);
            c.save();

            /* Vignette */
            var vig = c.createRadialGradient(this.w / 2, this.h * 0.42, 0, this.w / 2, this.h * 0.42, this.w * 0.62);
            vig.addColorStop(0, "rgba(150,60,85,0.13)");
            vig.addColorStop(1, "rgba(8,5,11,0)");
            c.fillStyle = vig;
            c.fillRect(0, 0, this.w, this.h);

            this.drawParticles(c, t);
            this.drawBranches(c, p);
            this.drawDecorations(c, t, p);
            this.drawBlooms(c, t, p);
            if (this.running && p > 0.45) this.drawPetals(c, t, p);
            if (this.running && p > 0.6) this.drawSparkles(c, t, p);
            if (!this.running) this.drawHeart(c, t, this.w / 2, this.h * 0.48, Math.min(this.w, this.h) * 0.007, 0.82);

            /* Pointer glow */
            if (this.pointer.x > 0) {
                var pg = c.createRadialGradient(this.pointer.x, this.pointer.y, 0, this.pointer.x, this.pointer.y, 110);
                pg.addColorStop(0, "rgba(231,134,154,0.16)");
                pg.addColorStop(1, "rgba(231,134,154,0)");
                c.fillStyle = pg;
                c.fillRect(this.pointer.x - 110, this.pointer.y - 110, 220, 220);
            }
            c.restore();
        };

        /* ─── Ambient particles ─── */
        MemoryTree.prototype.drawParticles = function (c, t) {
            this.particles.forEach(function (p) {
                var pulse = 0.55 + Math.sin(t * 0.001 + p.ph) * 0.45;
                c.fillStyle = "rgba(" + p.c + "," + (p.a * pulse) + ")";
                c.beginPath();
                c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                c.fill();
            });
        };

        /* ─── Branch rendering ─── */
        MemoryTree.prototype.drawBranches = function (c, progress) {
            this.branches.forEach(function (br) {
                var local = clamp((progress - br.startAt) / br.duration, 0, 1);
                if (local <= 0) return;
                var pt = quadratic(br.start, br.bend, br.end, ease(local));
                var g = c.createLinearGradient(br.start.x, br.start.y, pt.x, pt.y);
                g.addColorStop(0, br.depth > 3 ? "rgba(65,46,46,0.98)" : "rgba(58,43,43,0.96)");
                g.addColorStop(1, br.depth < 2 ? "rgba(200,100,118,0.92)" : "rgba(95,60,65,0.96)");
                c.strokeStyle = g;
                c.lineWidth = Math.max(1.2, br.width * (1 - br.depth * 0.065));
                c.lineCap = "round";
                c.beginPath();
                c.moveTo(br.start.x, br.start.y);
                c.quadraticCurveTo(br.bend.x, br.bend.y, pt.x, pt.y);
                c.stroke();
            });
        };

        /* ─── Small decorative glowing dots (no hearts, no names) ─── */
        MemoryTree.prototype.drawDecorations = function (c, t, progress) {
            var self = this;
            this.decorations.forEach(function (d) {
                var grow = clamp((progress - d.at) / 0.12, 0, 1);
                if (grow <= 0) return;
                var pulse = 0.7 + Math.sin(t * 0.0015 + d.phase) * 0.3;
                var hue = d.hue > 0.5 ? "231,134,154" : "216,180,119";
                var alpha = (0.25 + grow * 0.25) * pulse;
                var dotR = self.base * 0.003 * ease(grow);

                /* soft glow */
                var gr = dotR * 7;
                var glow = c.createRadialGradient(d.point.x, d.point.y, 0, d.point.x, d.point.y, gr);
                glow.addColorStop(0, "rgba(" + hue + "," + (alpha * 0.45) + ")");
                glow.addColorStop(1, "rgba(" + hue + ",0)");
                c.fillStyle = glow;
                c.beginPath();
                c.arc(d.point.x, d.point.y, gr, 0, Math.PI * 2);
                c.fill();

                /* bright center dot */
                c.fillStyle = "rgba(" + hue + "," + alpha + ")";
                c.beginPath();
                c.arc(d.point.x, d.point.y, dotR, 0, Math.PI * 2);
                c.fill();
            });
        };

        /* ─── Named blooms: heart + glow + petals + label ─── */
        MemoryTree.prototype.drawBlooms = function (c, t, progress) {
            var self = this;
            var fontSize = self.fontSize;

            this.blooms.forEach(function (bloom) {
                var grow = clamp((progress - bloom.at) / 0.12, 0, 1);
                if (grow <= 0) return;
                var size = bloom.size * (0.7 + ease(grow) * 0.5);
                var hue = bloom.hue > 0.5 ? "231,134,154" : "216,180,119";
                var pulse = 0.84 + Math.sin(t * 0.0014 + bloom.phase) * 0.16;
                var hs = size * self.base * 0.00044 * pulse;
                var ba = 0.5 + grow * 0.46;

                /* Glow aura */
                var gr = hs * 30;
                var glow = c.createRadialGradient(bloom.point.x, bloom.point.y, 0, bloom.point.x, bloom.point.y, gr);
                glow.addColorStop(0, "rgba(" + hue + "," + (ba * 0.35) + ")");
                glow.addColorStop(0.4, "rgba(" + hue + "," + (ba * 0.12) + ")");
                glow.addColorStop(1, "rgba(" + hue + ",0)");
                c.fillStyle = glow;
                c.beginPath();
                c.arc(bloom.point.x, bloom.point.y, gr, 0, Math.PI * 2);
                c.fill();

                /* Petal cluster (5 ellipses rotating slowly) */
                for (var p = 0; p < 5; p += 1) {
                    var pa = bloom.phase + (Math.PI * 2 * p / 5) + t * 0.00018;
                    var pd = hs * 14 + Math.sin(t * 0.0009 + p * 1.3) * 2;
                    c.save();
                    c.translate(bloom.point.x + Math.cos(pa) * pd, bloom.point.y + Math.sin(pa) * pd);
                    c.rotate(pa + Math.PI / 4);
                    c.globalAlpha = ba * 0.3 * ease(grow);
                    c.fillStyle = "rgb(" + hue + ")";
                    c.beginPath();
                    c.ellipse(0, 0, hs * 4, hs * 2, 0, 0, Math.PI * 2);
                    c.fill();
                    c.restore();
                }

                /* Heart */
                self.drawHeart(c, t, bloom.point.x, bloom.point.y, hs, ba, hue);

                /* ── Name label ── */
                if (bloom.name && grow >= 0.5) {
                    var ta = ease(clamp((grow - 0.5) / 0.5, 0, 1));

                    /* Subtle connector line */
                    c.save();
                    c.globalAlpha = ta * 0.18;
                    c.strokeStyle = "#f7efe8";
                    c.lineWidth = 0.5;
                    c.setLineDash([2, 4]);
                    c.beginPath();
                    c.moveTo(bloom.point.x, bloom.point.y);
                    c.lineTo(bloom.nameX, bloom.nameY);
                    c.stroke();
                    c.setLineDash([]);
                    c.restore();

                    /* Background pill */
                    c.save();
                    c.globalAlpha = ta * 0.42;
                    var pw = bloom.nameW + 14;
                    var ph = fontSize + 8;
                    var px = bloom.nameX - pw / 2;
                    var py = bloom.nameY - ph / 2;
                    c.fillStyle = "rgba(16,11,21,0.72)";
                    c.beginPath();
                    c.roundRect(px, py, pw, ph, ph / 2);
                    c.fill();
                    c.restore();

                    /* Text with glow */
                    c.save();
                    c.font = "600 " + fontSize + "px 'Be Vietnam Pro', sans-serif";
                    c.textAlign = "center";
                    c.textBaseline = "middle";
                    c.shadowColor = "rgba(" + hue + ",0.5)";
                    c.shadowBlur = 8;
                    c.fillStyle = "rgba(247,239,232," + (ta * 0.95) + ")";
                    c.fillText(bloom.name, bloom.nameX, bloom.nameY);
                    c.shadowBlur = 0;
                    c.fillText(bloom.name, bloom.nameX, bloom.nameY);
                    c.restore();
                }
            });
        };

        /* ─── Falling cherry blossom petals ─── */
        MemoryTree.prototype.drawPetals = function (c, t, progress) {
            var amount = clamp((progress - 0.45) / 0.55, 0, 1);
            this.petals.forEach(function (p) {
                var x = p.x + Math.sin(t * 0.0007 + p.ph) * 28 + p.dr * t * 0.02;
                var y = (p.y + t * p.sp * 0.05 * amount) % (this.h + 30) - 15;
                c.save();
                c.translate(x, y);
                c.rotate(p.rot + t * 0.0005);
                c.globalAlpha = 0.16 + amount * 0.32;
                c.fillStyle = "rgb(" + p.c + ")";
                c.beginPath();
                c.ellipse(0, 0, p.sz, p.sz * 0.55, 0, 0, Math.PI * 2);
                c.fill();
                c.restore();
            }, this);
        };

        /* ─── Twinkling 4-point sparkle stars ─── */
        MemoryTree.prototype.drawSparkles = function (c, t, progress) {
            var amount = clamp((progress - 0.6) / 0.4, 0, 1);
            this.sparkles.forEach(function (s) {
                var tw = Math.sin(t * s.sp + s.ph);
                if (tw < 0.25) return;
                var al = s.a * amount * tw;
                var sz = s.sz * (0.6 + tw * 0.4);
                c.save();
                c.globalAlpha = al;
                c.fillStyle = "#fff";
                c.beginPath();
                c.moveTo(s.x, s.y - sz * 3);
                c.lineTo(s.x + sz * 0.5, s.y);
                c.lineTo(s.x, s.y + sz * 3);
                c.lineTo(s.x - sz * 0.5, s.y);
                c.closePath();
                c.fill();
                c.beginPath();
                c.moveTo(s.x - sz * 3, s.y);
                c.lineTo(s.x, s.y + sz * 0.5);
                c.lineTo(s.x + sz * 3, s.y);
                c.lineTo(s.x, s.y - sz * 0.5);
                c.closePath();
                c.fill();
                c.restore();
            });
        };

        /* ─── Heart shape ─── */
        MemoryTree.prototype.drawHeart = function (c, t, x, y, size, alpha, color) {
            var pulse = 1 + Math.sin(t * 0.002) * 0.06;
            c.save();
            c.globalAlpha = alpha;
            c.shadowColor = color ? "rgba(" + color + ",0.75)" : "rgba(231,134,154,0.75)";
            c.shadowBlur = 20;
            c.fillStyle = color ? "rgb(" + color + ")" : "rgb(231,134,154)";
            heartPath(c, x, y, size * pulse);
            c.fill();
            c.restore();
        };

        /* ─── Bootstrap ─── */
        var tree = new MemoryTree();
        if (trigger) trigger.addEventListener("click", function () { tree.start(); });
        canvas.addEventListener("click", function () {
            if (!tree.running) tree.start();
        });

        /* Journey progress line */
        var journey = document.querySelector(".journey-section");
        var jline = document.querySelector(".journey-line span");
        if (journey && jline) {
            function updateLine() {
                var r = journey.getBoundingClientRect();
                var total = Math.max(1, r.height - innerHeight * 0.5);
                var prog = clamp((innerHeight * 0.48 - r.top) / total, 0, 1);
                jline.style.setProperty("--journey-progress", (prog * 100) + "%");
            }
            updateLine();
            addEventListener("scroll", updateLine, { passive: true });
            addEventListener("resize", updateLine, { passive: true });
        }
    });
})();
