(function () {
  'use strict';

  var root = document.querySelector('[data-home-slider]');
  if (!root) return;

  var slides = Array.prototype.slice.call(root.querySelectorAll('[data-home-slide]'));
  var dots = Array.prototype.slice.call(root.querySelectorAll('[data-slider-dot]'));
  var prev = root.querySelector('[data-slider-prev]');
  var next = root.querySelector('[data-slider-next]');
  var toggle = root.querySelector('[data-slider-toggle]');
  var progress = root.querySelector('[data-slider-progress]');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var delay = 7500;
  var current = 0;
  var timer = null;
  var pausedByUser = reduceMotion;
  var interactionPauseUntil = 0;

  function resetProgress() {
    if (!progress) return;
    progress.style.animation = 'none';
    progress.offsetWidth;
    if (!pausedByUser && Date.now() >= interactionPauseUntil) {
      progress.style.animation = 'homeSliderProgress ' + delay + 'ms linear forwards';
    }
  }

  function showSlide(index, userInitiated) {
    current = (index + slides.length) % slides.length;
    slides.forEach(function (slide, slideIndex) {
      var active = slideIndex === current;
      slide.hidden = !active;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
    dots.forEach(function (dot, dotIndex) {
      var active = dotIndex === current;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    if (userInitiated) interactionPauseUntil = Date.now() + 12000;
    schedule();
  }

  function schedule() {
    window.clearTimeout(timer);
    resetProgress();
    if (pausedByUser || document.hidden) return;
    var wait = Math.max(delay, interactionPauseUntil - Date.now());
    timer = window.setTimeout(function () {
      if (Date.now() < interactionPauseUntil) {
        schedule();
        return;
      }
      showSlide(current + 1, false);
    }, wait);
  }

  function setPaused(value) {
    pausedByUser = value;
    toggle.textContent = value ? 'Відтворити' : 'Пауза';
    toggle.setAttribute('aria-label', value ? 'Увімкнути автоматичну зміну' : 'Призупинити автоматичну зміну');
    root.classList.toggle('is-paused', value);
    schedule();
  }

  prev.addEventListener('click', function () { showSlide(current - 1, true); });
  next.addEventListener('click', function () { showSlide(current + 1, true); });
  dots.forEach(function (dot) {
    dot.addEventListener('click', function () { showSlide(Number(dot.getAttribute('data-slider-dot')), true); });
  });
  toggle.addEventListener('click', function () { setPaused(!pausedByUser); });
  root.addEventListener('mouseenter', function () { window.clearTimeout(timer); });
  root.addEventListener('mouseleave', schedule);
  root.addEventListener('focusin', function () { window.clearTimeout(timer); });
  root.addEventListener('focusout', function (event) {
    if (!root.contains(event.relatedTarget)) schedule();
  });
  document.addEventListener('visibilitychange', schedule);

  var touchStartX = null;
  root.addEventListener('touchstart', function (event) { touchStartX = event.changedTouches[0].clientX; }, { passive: true });
  root.addEventListener('touchend', function (event) {
    if (touchStartX === null) return;
    var distance = event.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(distance) < 55) return;
    showSlide(current + (distance < 0 ? 1 : -1), true);
  }, { passive: true });

  var quiz = root.querySelector('[data-home-quiz]');
  if (quiz) {
    var answers = {};
    var quizProgress = quiz.querySelector('[data-quiz-progress]');
    var result = quiz.querySelector('[data-quiz-result]');
    quiz.querySelectorAll('[data-quiz-question]').forEach(function (question) {
      var key = question.getAttribute('data-quiz-question');
      question.querySelectorAll('[data-quiz-value]').forEach(function (button) {
        button.addEventListener('click', function () {
          question.querySelectorAll('[data-quiz-value]').forEach(function (item) { item.classList.remove('is-selected'); });
          button.classList.add('is-selected');
          answers[key] = button.getAttribute('data-quiz-value');
          var count = Object.keys(answers).length;
          quizProgress.textContent = count + ' / 3';
          interactionPauseUntil = Date.now() + 30000;
          if (count === 3) {
            var query = new URLSearchParams({ object: answers.object, bill: answers.bill, backup: answers.backup });
            result.href = 'configurator.html?' + query.toString();
            result.classList.remove('is-disabled');
            result.setAttribute('aria-disabled', 'false');
            result.querySelector('span').textContent = 'Відповіді збережено';
          }
          schedule();
        });
      });
    });
    result.addEventListener('click', function (event) {
      if (result.classList.contains('is-disabled')) event.preventDefault();
    });
  }

  function updateCountdown() {
    var now = new Date();
    var end = new Date(now);
    var daysUntilSunday = (7 - now.getDay()) % 7;
    end.setDate(now.getDate() + daysUntilSunday);
    end.setHours(23, 59, 59, 999);
    if (end.getTime() <= now.getTime()) end.setDate(end.getDate() + 7);
    var remaining = Math.max(0, end.getTime() - now.getTime());
    var values = {
      days: Math.floor(remaining / 86400000),
      hours: Math.floor(remaining / 3600000) % 24,
      minutes: Math.floor(remaining / 60000) % 60,
      seconds: Math.floor(remaining / 1000) % 60
    };
    Object.keys(values).forEach(function (key) {
      var node = root.querySelector('[data-' + key + ']');
      if (node) node.textContent = String(values[key]).padStart(2, '0');
    });
  }

  updateCountdown();
  window.setInterval(updateCountdown, 1000);
  showSlide(0, false);
  if (reduceMotion) setPaused(true);
})();
