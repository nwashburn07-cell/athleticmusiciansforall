if (document.querySelector('#weekGrid')) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const categories = ['school', 'music', 'sport', 'life'];
  const storageKey = 'in-the-mix-week-plan';
  let tasks = [];

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (Array.isArray(saved)) {
      tasks = saved
        .filter(task => task && typeof task.text === 'string' && days.includes(task.day) && categories.includes(task.category))
        .map(task => ({
          ...task,
          duration: Number.isFinite(Number(task.duration)) ? Number(task.duration) : 1,
          flexible: task.flexible !== false,
        }));
    }
  } catch {
    tasks = [];
  }

  const grid = document.querySelector('#weekGrid');
  const taskInput = document.querySelector('#taskInput');
  const categoryInput = document.querySelector('#categoryInput');
  const dayInput = document.querySelector('#dayInput');
  const durationInput = document.querySelector('#durationInput');
  const flexInput = document.querySelector('#flexInput');
  const balanceMessage = document.querySelector('#balanceMessage');

  function save() {
    localStorage.setItem(storageKey, JSON.stringify(tasks));
  }

  function formatDuration(hours) {
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} hr`;
  }

  function taskHours(day) {
    return tasks.filter(task => task.day === day).reduce((total, task) => total + task.duration, 0);
  }

  function renderBalance() {
    const totalHours = tasks.reduce((total, task) => total + task.duration, 0);
    const loads = days.map(day => ({ day, hours: taskHours(day) }));
    const busiest = loads.reduce((best, current) => current.hours > best.hours ? current : best, loads[0]);
    const restMoments = tasks.filter(task => task.category === 'life').length;
    const plannedHours = document.querySelector('#plannedHours');
    const busyDay = document.querySelector('#busyDay');
    const restCount = document.querySelector('#restCount');
    const loadFill = document.querySelector('#loadFill');

    plannedHours.textContent = `${formatDuration(totalHours)} planned`;
    busyDay.textContent = busiest.hours ? `${busiest.day.slice(0, 3)} · ${formatDuration(busiest.hours)}` : '—';
    restCount.textContent = String(restMoments);
    loadFill.style.width = `${Math.min(100, (totalHours / 35) * 100)}%`;
    loadFill.setAttribute('aria-valuenow', String(Math.min(100, Math.round((totalHours / 35) * 100))));

    if (!tasks.length) {
      balanceMessage.textContent = 'Add a few anchors to see how your week is shaping up.';
      balanceMessage.dataset.tone = 'calm';
      return;
    }

    const tightDays = loads.filter(load => load.hours > 4);
    if (tightDays.length) {
      const dayList = tightDays.map(load => `${load.day.slice(0, 3)} (${formatDuration(load.hours)})`).join(', ');
      balanceMessage.textContent = `A lot is landing on ${dayList}. Try moving a flexible task or adding a little recovery time.`;
      balanceMessage.dataset.tone = 'busy';
    } else if (!restMoments) {
      balanceMessage.textContent = 'Your plan has tasks, but no recovery time yet. You can add a 15-minute reset to your lightest day.';
      balanceMessage.dataset.tone = 'nudge';
    } else if (totalHours > 28) {
      balanceMessage.textContent = 'That’s a full week. Check that meals, travel, and sleep still have space around these plans.';
      balanceMessage.dataset.tone = 'nudge';
    } else {
      balanceMessage.textContent = 'Your plan has some breathing room. Keep the flexible items movable when real life changes.';
      balanceMessage.dataset.tone = 'calm';
    }
  }

  function render() {
    grid.replaceChildren();
    days.forEach(day => {
      const column = document.createElement('section');
      column.className = 'day-column';
      const dayTasks = tasks.filter(task => task.day === day);
      const titleRow = document.createElement('div');
      titleRow.className = 'day-title-row';
      const title = document.createElement('div');
      title.className = 'day-name';
      title.textContent = day.slice(0, 3).toUpperCase();
      const load = document.createElement('span');
      load.className = 'day-load';
      load.textContent = dayTasks.length ? formatDuration(taskHours(day)) : '—';
      titleRow.append(title, load);
      column.append(titleRow);

      if (!dayTasks.length) {
        const empty = document.createElement('div');
        empty.className = 'empty-day';
        empty.textContent = 'Room to breathe';
        column.append(empty);
      }

      dayTasks.forEach(task => {
        const chip = document.createElement('div');
        chip.className = `task-chip ${task.category}`;
        const label = document.createElement('span');
        label.className = 'task-label';
        label.textContent = task.text;
        const meta = document.createElement('span');
        meta.className = 'task-meta';
        meta.textContent = `${formatDuration(task.duration)} · ${task.flexible ? 'flex' : 'fixed'}`;
        const remove = document.createElement('button');
        remove.className = 'remove-task';
        remove.type = 'button';
        remove.setAttribute('aria-label', `Remove ${task.text}`);
        remove.textContent = '×';
        remove.addEventListener('click', () => {
          tasks = tasks.filter(item => item.id !== task.id);
          save();
          render();
        });
        chip.append(label, meta, remove);
        column.append(chip);
      });
      grid.append(column);
    });

    const count = tasks.length;
    document.querySelector('#taskCount').textContent = count
      ? `${count} ${count === 1 ? 'THING' : 'THINGS'} · ${formatDuration(tasks.reduce((total, task) => total + task.duration, 0))} PLANNED`
      : 'YOUR PLAN, YOUR CALL.';
    renderBalance();
  }

  function addTask({ text = taskInput.value.trim(), category = categoryInput.value, day = dayInput.value, duration = Number(durationInput.value), flexible = flexInput.value === 'flexible' } = {}) {
    if (!text) {
      taskInput.focus();
      taskInput.setCustomValidity('Add one thing you want to remember.');
      taskInput.reportValidity();
      taskInput.addEventListener('input', () => taskInput.setCustomValidity(''), { once: true });
      return false;
    }
    tasks.push({ id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, text, category, day, duration, flexible });
    save();
    render();
    return true;
  }

  document.querySelector('#addTask').addEventListener('click', () => {
    if (addTask()) {
      taskInput.value = '';
      taskInput.focus();
    }
  });
  taskInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') document.querySelector('#addTask').click();
  });
  document.querySelector('#clearPlan').addEventListener('click', () => {
    tasks = [];
    save();
    render();
    balanceMessage.textContent = 'Your map is clear. Add fixed commitments first, then build around them.';
  });
  document.querySelector('#addReset').addEventListener('click', () => {
    const lightestDay = days.reduce((best, day) => taskHours(day) < taskHours(best) ? day : best, days[0]);
    addTask({ text: 'A 15-minute reset', category: 'life', day: lightestDay, duration: 0.25, flexible: true });
    balanceMessage.textContent = `Added a 15-minute reset to ${lightestDay}, your lightest day so far.`;
    balanceMessage.dataset.tone = 'calm';
  });
  document.querySelector('#rebalancePlan').addEventListener('click', () => {
    let moved = 0;
    for (let attempt = 0; attempt < 14; attempt += 1) {
      const fullestDay = days.reduce((best, day) => taskHours(day) > taskHours(best) ? day : best, days[0]);
      const lightestDay = days.reduce((best, day) => taskHours(day) < taskHours(best) ? day : best, days[0]);
      if (taskHours(fullestDay) <= 4 || taskHours(fullestDay) - taskHours(lightestDay) < 1) break;
      const movable = [...tasks].reverse().find(task => task.day === fullestDay && task.flexible);
      if (!movable) break;
      movable.day = lightestDay;
      moved += 1;
    }
    if (moved) {
      save();
      render();
      balanceMessage.textContent = `Moved ${moved} flexible ${moved === 1 ? 'item' : 'items'} from fuller days to lighter days. You can still adjust each one.`;
      balanceMessage.dataset.tone = 'calm';
    } else {
      balanceMessage.textContent = 'No flexible items need moving right now. Add more tasks or mark a movable one as flexible to use this helper.';
      balanceMessage.dataset.tone = 'nudge';
    }
  });
  render();
}


if (document.querySelector('#breathButton')) {
  const breathButton = document.querySelector('#breathButton');
  const breathVisual = document.querySelector('#breathVisual');
  const breathCue = document.querySelector('#breathCue');
  const breathCopy = document.querySelector('#breathCopy');
  let breathTimer = null;
  let breathPhase = 'inhale';
  let breathSeconds = 4;
  let breathRounds = 0;

  function showBreathPhase() {
    breathVisual.classList.toggle('inhale', breathPhase === 'inhale');
    breathVisual.classList.toggle('exhale', breathPhase === 'exhale');
    breathCue.textContent = `${breathPhase === 'inhale' ? 'Breathe in gently' : 'Breathe out softly'} · ${breathSeconds}`;
  }

  function finishBreathing() {
    clearInterval(breathTimer);
    breathTimer = null;
    breathVisual.classList.remove('inhale', 'exhale');
    breathCue.textContent = 'That’s your minute.';
    breathCopy.textContent = 'Notice how you feel. You can go back to your day at your own pace.';
    breathButton.innerHTML = 'Try the reset again <span>↗</span>';
  }

  breathButton.addEventListener('click', () => {
    if (breathTimer) {
      clearInterval(breathTimer);
      breathTimer = null;
      breathVisual.classList.remove('inhale', 'exhale');
      breathCue.textContent = 'Take it at your pace.';
      breathCopy.textContent = 'The exercise is paused. Let your breath return to its normal rhythm.';
      breathButton.innerHTML = 'Start a gentle reset <span>↗</span>';
      return;
    }
    breathPhase = 'inhale';
    breathSeconds = 4;
    breathRounds = 0;
    breathCopy.textContent = 'Breathe in gently for 4, then out softly for 5. No need to take a deep breath.';
    breathButton.innerHTML = 'Pause reset <span>Ⅱ</span>';
    showBreathPhase();
    breathTimer = setInterval(() => {
      breathSeconds -= 1;
      if (breathSeconds <= 0) {
        if (breathPhase === 'inhale') {
          breathPhase = 'exhale';
          breathSeconds = 5;
        } else {
          breathRounds += 1;
          if (breathRounds >= 6) {
            finishBreathing();
            return;
          }
          breathPhase = 'inhale';
          breathSeconds = 4;
        }
      }
      showBreathPhase();
    }, 1000);
  });

}
