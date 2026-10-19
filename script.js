const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const categories = ['school', 'music', 'sport', 'life'];
const storageKey = 'in-the-mix-week-plan';
let tasks = [];
try { const saved = JSON.parse(localStorage.getItem(storageKey) || '[]'); if (Array.isArray(saved)) tasks = saved.filter(task => task && typeof task.text === 'string' && days.includes(task.day) && categories.includes(task.category)); } catch { tasks = []; }
const grid = document.querySelector('#weekGrid');
const taskInput = document.querySelector('#taskInput');
const categoryInput = document.querySelector('#categoryInput');
const dayInput = document.querySelector('#dayInput');
function save() { localStorage.setItem(storageKey, JSON.stringify(tasks)); }
function render() {
  grid.replaceChildren();
  days.forEach(day => {
    const column = document.createElement('section'); column.className = 'day-column';
    const title = document.createElement('div'); title.className = 'day-name'; title.textContent = day.slice(0, 3).toUpperCase(); column.append(title);
    const dayTasks = tasks.filter(task => task.day === day);
    if (!dayTasks.length) { const empty = document.createElement('div'); empty.className = 'empty-day'; empty.textContent = 'A little room…'; column.append(empty); }
    dayTasks.forEach(task => {
      const chip = document.createElement('div'); chip.className = 'task-chip ' + task.category;
      const label = document.createElement('span'); label.textContent = task.text;
      const remove = document.createElement('button'); remove.className = 'remove-task'; remove.type = 'button'; remove.setAttribute('aria-label', 'Remove ' + task.text); remove.textContent = '×';
      remove.addEventListener('click', () => { tasks = tasks.filter(item => item.id !== task.id); save(); render(); });
      chip.append(label, remove); column.append(chip);
    }); grid.append(column);
  });
  document.querySelector('#taskCount').textContent = tasks.length ? tasks.length + ' ' + (tasks.length === 1 ? 'THING' : 'THINGS') + ' ON YOUR MAP' : 'YOUR PLAN, YOUR CALL.';
}
function addTask() {
  const text = taskInput.value.trim();
  if (!text) { taskInput.focus(); taskInput.setCustomValidity('Add one thing you want to remember.'); taskInput.reportValidity(); taskInput.addEventListener('input', () => taskInput.setCustomValidity(''), { once: true }); return; }
  tasks.push({ id: Date.now() + '-' + Math.random().toString(16).slice(2), text, category: categoryInput.value, day: dayInput.value });
  taskInput.value = ''; save(); render(); taskInput.focus();
}
document.querySelector('#addTask').addEventListener('click', addTask);
taskInput.addEventListener('keydown', event => { if (event.key === 'Enter') addTask(); });
document.querySelector('#clearPlan').addEventListener('click', () => { tasks = []; save(); render(); }); render();
const breathButton = document.querySelector('#breathButton');
const breathVisual = document.querySelector('#breathVisual');
const breathCue = document.querySelector('#breathCue');
const breathCopy = document.querySelector('#breathCopy');
let breathTimer = null, breathPhase = 'inhale', breathSeconds = 4, breathRounds = 0;
function showBreathPhase() { breathVisual.classList.toggle('inhale', breathPhase === 'inhale'); breathVisual.classList.toggle('exhale', breathPhase === 'exhale'); breathCue.textContent = (breathPhase === 'inhale' ? 'Breathe in gently' : 'Breathe out softly') + ' · ' + breathSeconds; }
function finishBreathing() { clearInterval(breathTimer); breathTimer = null; breathVisual.classList.remove('inhale', 'exhale'); breathCue.textContent = 'That’s your minute.'; breathCopy.textContent = 'Notice how you feel. You can go back to your day at your own pace.'; breathButton.innerHTML = 'Try the reset again <span>↗</span>'; }
breathButton.addEventListener('click', () => {
  if (breathTimer) { clearInterval(breathTimer); breathTimer = null; breathVisual.classList.remove('inhale', 'exhale'); breathCue.textContent = 'Take it at your pace.'; breathCopy.textContent = 'The exercise is paused. Let your breath return to its normal rhythm.'; breathButton.innerHTML = 'Start a gentle reset <span>↗</span>'; return; }
  breathPhase = 'inhale'; breathSeconds = 4; breathRounds = 0; breathCopy.textContent = 'Breathe in gently for 4, then out softly for 5. No need to take a deep breath.'; breathButton.innerHTML = 'Pause reset <span>Ⅱ</span>'; showBreathPhase();
  breathTimer = setInterval(() => { breathSeconds -= 1; if (breathSeconds <= 0) { if (breathPhase === 'inhale') { breathPhase = 'exhale'; breathSeconds = 5; } else { breathRounds += 1; if (breathRounds >= 6) { finishBreathing(); return; } breathPhase = 'inhale'; breathSeconds = 4; } } showBreathPhase(); }, 1000);
});
