const menuBtn = document.querySelector('#menuBtn');
const menu = document.querySelector('#menu');

menuBtn.addEventListener('click', () => {
  menu.classList.toggle('active');
});

document.querySelectorAll('.menu a').forEach(link => {
  link.addEventListener('click', () => menu.classList.remove('active'));
});

const filterButtons = document.querySelectorAll('.filter-btn');
const projectCards = document.querySelectorAll('.project-card');

const descriptionModal = document.createElement('div');
descriptionModal.className = 'description-modal';
descriptionModal.setAttribute('aria-hidden', 'true');
descriptionModal.innerHTML = `
  <div class="description-modal-content" role="dialog" aria-modal="true" aria-labelledby="descriptionModalTitle">
    <button class="description-modal-close" type="button" aria-label="Fechar descricao">&times;</button>
    <h3 id="descriptionModalTitle"></h3>
    <p></p>
  </div>
`;
document.body.append(descriptionModal);

const descriptionTitle = descriptionModal.querySelector('h3');
const descriptionText = descriptionModal.querySelector('p');
const descriptionClose = descriptionModal.querySelector('.description-modal-close');

const closeDescriptionModal = () => {
  descriptionModal.classList.remove('active');
  descriptionModal.setAttribute('aria-hidden', 'true');
};

document.querySelectorAll('.project-card > p').forEach(description => {
  description.classList.add('project-description');

  if (description.scrollHeight <= description.clientHeight + 1) {
    return;
  }

  const toggle = document.createElement('button');
  toggle.className = 'project-description-toggle';
  toggle.type = 'button';
  toggle.textContent = 'Ver mais';
  toggle.setAttribute('aria-label', `Ver descricao completa de ${description.parentElement.querySelector('h3').textContent}`);

  toggle.addEventListener('click', () => {
    descriptionTitle.textContent = description.parentElement.querySelector('h3').textContent;
    descriptionText.textContent = description.textContent.trim();
    descriptionModal.classList.add('active');
    descriptionModal.setAttribute('aria-hidden', 'false');
    descriptionClose.focus();
  });

  description.after(toggle);
});

descriptionClose.addEventListener('click', closeDescriptionModal);

descriptionModal.addEventListener('click', event => {
  if (event.target === descriptionModal) {
    closeDescriptionModal();
  }
});

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    filterButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    const filter = button.dataset.filter;

    projectCards.forEach(card => {
      const category = card.dataset.category;
      const shouldShow = filter === 'todos' || category === filter;
      card.style.display = shouldShow ? 'block' : 'none';
    });
  });
});

const modal = document.querySelector('#imageModal');
const modalImage = document.querySelector('#modalImage');
const modalClose = document.querySelector('.image-modal-close');

const closeImageModal = () => {
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  modalImage.src = '';
  modalImage.alt = '';
};

document.querySelectorAll('.project-image img').forEach(image => {
  image.addEventListener('click', () => {
    modalImage.src = image.src;
    modalImage.alt = image.alt;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
  });
});

modalClose.addEventListener('click', closeImageModal);

modal.addEventListener('click', event => {
  if (event.target === modal) {
    closeImageModal();
  }
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && modal.classList.contains('active')) {
    closeImageModal();
  }

  if (event.key === 'Escape' && descriptionModal.classList.contains('active')) {
    closeDescriptionModal();
  }
});

const reveals = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
    }
  });
}, { threshold: 0.12 });

reveals.forEach(el => observer.observe(el));

(() => {
  const canvas = document.querySelector('#spaceBackground');

  if (!canvas) {
    return;
  }

  const context = canvas.getContext('2d', { alpha: false });
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const symbols = '01<>[]{}//::SYSVOIDXRUN404#@';
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let width = 0;
  let height = 0;
  let scale = 1;
  let stars = [];
  let asteroids = [];
  let entities = [];
  let frameId = 0;
  let previousTime = performance.now();
  let nextEntityTime = previousTime + random(9000, 19000);

  const wormholes = [
    { x: 0.16, y: 0.27, radius: 116, tilt: -0.18, color: '0, 210, 203', speed: 0.00024 },
    { x: 0.86, y: 0.58, radius: 176, tilt: 0.28, color: '113, 62, 238', speed: -0.00016 }
  ];

  function random(min, max) {
    return Math.random() * (max - min) + min;
  }

  function createStar() {
    return {
      x: random(0, width),
      y: random(0, height),
      depth: random(0.2, 1),
      size: random(0.35, 1.6),
      phase: random(0, Math.PI * 2),
      speed: random(0.02, 0.14)
    };
  }

  function createAsteroid() {
    const radius = random(9, width < 720 ? 28 : 42);
    const pointCount = Math.floor(random(7, 11));
    const points = Array.from({ length: pointCount }, (_, index) => ({
      angle: (Math.PI * 2 * index) / pointCount,
      radius: radius * random(0.72, 1.12)
    }));

    return {
      x: random(-80, width + 80),
      y: random(-80, height + 80),
      radius,
      depth: random(0.22, 0.86),
      velocityX: random(-0.065, 0.065),
      velocityY: random(0.018, 0.095),
      rotation: random(0, Math.PI * 2),
      spin: random(-0.00032, 0.00032),
      points
    };
  }

  function resizeScene() {
    width = window.innerWidth;
    height = window.innerHeight;
    scale = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(scale, 0, 0, scale, 0, 0);

    const starCount = Math.min(190, Math.max(70, Math.floor((width * height) / 9200)));
    const asteroidCount = width < 720 ? 5 : 10;
    stars = Array.from({ length: starCount }, createStar);
    asteroids = Array.from({ length: asteroidCount }, createAsteroid);
  }

  function drawNebulas(time) {
    const nebulae = [
      {
        x: width * 0.22 + Math.sin(time * 0.00006) * 42,
        y: height * 0.3,
        radius: Math.max(width, height) * 0.45,
        inner: 'rgba(13, 60, 107, 0.15)',
        middle: 'rgba(7, 40, 96, 0.07)'
      },
      {
        x: width * 0.76 + Math.cos(time * 0.00005) * 60,
        y: height * 0.62,
        radius: Math.max(width, height) * 0.52,
        inner: 'rgba(74, 30, 126, 0.14)',
        middle: 'rgba(37, 18, 86, 0.07)'
      }
    ];

    nebulae.forEach(nebula => {
      const gradient = context.createRadialGradient(
        nebula.x,
        nebula.y,
        0,
        nebula.x,
        nebula.y,
        nebula.radius
      );
      gradient.addColorStop(0, nebula.inner);
      gradient.addColorStop(0.42, nebula.middle);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);
    });
  }

  function drawWormholes(time) {
    wormholes.forEach((wormhole, index) => {
      const pulse = 1 + Math.sin(time * 0.00042 + index) * 0.045;
      const radius = wormhole.radius * pulse * Math.min(1, width / 1100 + 0.34);
      const x = width * wormhole.x + pointer.x * (index ? 16 : -20);
      const y = height * wormhole.y + pointer.y * (index ? 10 : -16);

      context.save();
      context.translate(x, y);
      context.rotate(wormhole.tilt + time * wormhole.speed);
      context.scale(1, 0.42);

      const glow = context.createRadialGradient(0, 0, radius * 0.16, 0, 0, radius * 1.45);
      glow.addColorStop(0, 'rgba(1, 2, 10, 0.94)');
      glow.addColorStop(0.28, `rgba(${wormhole.color}, 0.13)`);
      glow.addColorStop(0.48, `rgba(${wormhole.color}, 0.06)`);
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      context.fillStyle = glow;
      context.beginPath();
      context.arc(0, 0, radius * 1.48, 0, Math.PI * 2);
      context.fill();

      for (let ring = 0; ring < 7; ring += 1) {
        const expansion = (time * 0.008 + ring * 23) % (radius * 0.86);
        const ringRadius = radius * 0.43 + expansion;
        const opacity = (1 - expansion / (radius * 0.86)) * (ring === 0 ? 0.32 : 0.14);
        context.strokeStyle = `rgba(${wormhole.color}, ${opacity})`;
        context.lineWidth = ring === 0 ? 1.5 : 1;
        context.beginPath();
        context.arc(0, 0, ringRadius, 0, Math.PI * 2);
        context.stroke();
      }

      context.restore();
    });
  }

  function drawStars(time, elapsed) {
    const centerX = width / 2;
    const centerY = height / 2;

    stars.forEach(star => {
      if (!reducedMotion) {
        const expansion = star.speed * elapsed * star.depth;
        star.x += ((star.x - centerX) / Math.max(width, 1)) * expansion;
        star.y += ((star.y - centerY) / Math.max(height, 1)) * expansion;
      }

      if (star.x < -8 || star.x > width + 8 || star.y < -8 || star.y > height + 8) {
        star.x = centerX + random(-width * 0.18, width * 0.18);
        star.y = centerY + random(-height * 0.18, height * 0.18);
      }

      const x = star.x + pointer.x * star.depth * 18;
      const y = star.y + pointer.y * star.depth * 12;
      const alpha = 0.28 + star.depth * 0.46 + Math.sin(time * 0.0012 + star.phase) * 0.16;
      const radius = star.size * star.depth;

      context.fillStyle = `rgba(168, 214, 255, ${alpha})`;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();

      if (star.depth > 0.86 && alpha > 0.68) {
        context.strokeStyle = `rgba(0, 224, 164, ${alpha * 0.22})`;
        context.lineWidth = 0.6;
        context.beginPath();
        context.moveTo(x - radius * 4, y);
        context.lineTo(x + radius * 4, y);
        context.stroke();
      }
    });
  }

  function drawAsteroids(elapsed) {
    asteroids.forEach(asteroid => {
      if (!reducedMotion) {
        asteroid.x += asteroid.velocityX * elapsed;
        asteroid.y += asteroid.velocityY * elapsed;
        asteroid.rotation += asteroid.spin * elapsed;
      }

      if (asteroid.y > height + asteroid.radius * 3) {
        asteroid.y = -asteroid.radius * 3;
        asteroid.x = random(0, width);
      }

      if (asteroid.x < -asteroid.radius * 3) {
        asteroid.x = width + asteroid.radius;
      } else if (asteroid.x > width + asteroid.radius * 3) {
        asteroid.x = -asteroid.radius;
      }

      const x = asteroid.x + pointer.x * asteroid.depth * 34;
      const y = asteroid.y + pointer.y * asteroid.depth * 22;

      context.save();
      context.translate(x, y);
      context.rotate(asteroid.rotation);
      context.beginPath();
      asteroid.points.forEach((point, pointIndex) => {
        const pointX = Math.cos(point.angle) * point.radius;
        const pointY = Math.sin(point.angle) * point.radius;

        if (pointIndex === 0) {
          context.moveTo(pointX, pointY);
        } else {
          context.lineTo(pointX, pointY);
        }
      });
      context.closePath();

      const surface = context.createRadialGradient(
        -asteroid.radius * 0.42,
        -asteroid.radius * 0.48,
        asteroid.radius * 0.08,
        0,
        0,
        asteroid.radius * 1.2
      );
      surface.addColorStop(0, `rgba(112, 137, 163, ${0.19 + asteroid.depth * 0.14})`);
      surface.addColorStop(0.55, `rgba(29, 37, 57, ${0.28 + asteroid.depth * 0.18})`);
      surface.addColorStop(1, 'rgba(6, 9, 18, 0.6)');
      context.fillStyle = surface;
      context.fill();
      context.strokeStyle = `rgba(85, 154, 183, ${0.15 + asteroid.depth * 0.18})`;
      context.lineWidth = 0.8;
      context.stroke();

      context.fillStyle = `rgba(0, 0, 0, ${0.1 + asteroid.depth * 0.12})`;
      context.beginPath();
      context.ellipse(
        -asteroid.radius * 0.26,
        -asteroid.radius * 0.08,
        asteroid.radius * 0.2,
        asteroid.radius * 0.13,
        0.4,
        0,
        Math.PI * 2
      );
      context.fill();
      context.restore();
    });
  }

  function spawnDigitalEntity(time) {
    const direction = Math.random() > 0.5 ? 1 : -1;
    const length = Math.floor(random(10, 18));
    entities.push({
      direction,
      startX: direction === 1 ? -80 : width + 80,
      y: random(height * 0.2, height * 0.82),
      amplitude: random(20, 48),
      speed: random(0.22, 0.42),
      born: time,
      duration: random(1800, 3000),
      length,
      chars: Array.from({ length }, () => symbols.charAt(Math.floor(random(0, symbols.length))))
    });
  }

  function drawDigitalEntities(time) {
    if (time > nextEntityTime && entities.length === 0 && !reducedMotion) {
      spawnDigitalEntity(time);
      nextEntityTime = time + random(11000, 27000);
    }

    entities = entities.filter(entity => {
      const age = time - entity.born;

      if (age > entity.duration) {
        return false;
      }

      const progress = age / entity.duration;
      const opacity = Math.sin(progress * Math.PI) * 0.42;
      const headX = entity.startX + entity.direction * progress * (width + 160);

      context.save();
      context.font = '12px "Courier New", monospace';
      context.textAlign = 'center';

      entity.chars.forEach((char, index) => {
        const distance = index * 17;
        const x = headX - entity.direction * distance;
        const wave = Math.sin(progress * 18 - index * 0.72) * entity.amplitude;
        const y = entity.y + wave;
        const fade = 1 - index / entity.length;
        context.fillStyle = `rgba(0, 224, 164, ${opacity * fade})`;
        context.shadowBlur = 10;
        context.shadowColor = 'rgba(0, 224, 164, 0.34)';
        context.fillText(char, x, y);
      });

      context.restore();
      return true;
    });
  }

  function render(time) {
    const elapsed = Math.min(34, time - previousTime);
    previousTime = time;
    pointer.x += (pointer.targetX - pointer.x) * 0.035;
    pointer.y += (pointer.targetY - pointer.y) * 0.035;

    context.fillStyle = '#02030b';
    context.fillRect(0, 0, width, height);
    drawNebulas(time);
    drawWormholes(time);
    drawStars(time, elapsed);
    drawAsteroids(elapsed);
    drawDigitalEntities(time);

    frameId = window.requestAnimationFrame(render);
  }

  window.addEventListener('pointermove', event => {
    pointer.targetX = (event.clientX / Math.max(width, 1) - 0.5) * 2;
    pointer.targetY = (event.clientY / Math.max(height, 1) - 0.5) * 2;
  }, { passive: true });

  window.addEventListener('pointerleave', () => {
    pointer.targetX = 0;
    pointer.targetY = 0;
  });

  window.addEventListener('resize', resizeScene);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      window.cancelAnimationFrame(frameId);
      return;
    }

    previousTime = performance.now();
    frameId = window.requestAnimationFrame(render);
  });

  resizeScene();
  frameId = window.requestAnimationFrame(render);
})();
