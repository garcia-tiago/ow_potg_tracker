const STORAGE_KEY = "potg-tracker-data";
let currentTarget = null;
let resetArmed = false;
let selectedRole = null;

/* STATE */

let state = loadState();

/* INIT STATE */ 

function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) return JSON.parse(saved);

    const data = {};

    HEROES.forEach(hero => {
        data[hero.name] = {
            matches: 0,
            completed: false,
            role: hero.role
        };
    });

    return data;
}

/* SAVE */

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* STATS */

function groupHeroes() {
    const grouped = {
        Tank: [],
        Damage: [],
        Support: []
    };

    HEROES.forEach(hero => {
        grouped[hero.role].push(hero);
    });

    return grouped;
}

function getStats() {
    const entries = Object.entries(state);

    return {
        total: entries.length,
        completed: entries.filter(([_, h]) => h.completed).length,
        matches: entries.reduce((sum, [_, h]) => sum + h.matches, 0)
    };
}

/* LEFT PANEL */

function renderLeft() {
    const stats = getStats();

    const percent = Math.round((stats.completed / stats.total) * 100);
    const diff = getDifficultyHeroes();

    document.getElementById("leftPanel").innerHTML = `

    <div class="logo-container">
      <img src="images/logo.png" class="logo" />
    </div>

    <div class="card big-progress">

      <div class="progress-header">
        <div class="progress-title">Progress</div>
        <div class="progress-percent">${percent}%</div>
      </div>

      <div class="progress-numbers">
        <span class="big-number">${stats.completed}</span>
        <span class="divider">/</span>
        <span class="big-number">${stats.total}</span>
      </div>

      <div class="progress-bar">
        <div class="progress-fill" style="width:${percent}%"></div>
      </div>

    </div>

    <div class="card">
      
        <div class="label">Current Target</div>

<div class="target-hero">

  ${currentTarget ? `
    <img src="${HEROES.find(h => h.name === currentTarget).image}" />

    <div class="target-info">

      <div class="value">${currentTarget}</div>

      <div class="match-stepper">

        <button onclick="changeMatches(-1)" ${state[currentTarget].completed || state[currentTarget].matches === 0 ? 'disabled' : ''}>-</button>

        <div class="match-value">
          ${state[currentTarget].matches}
        </div>

        <button onclick="changeMatches(1)" ${state[currentTarget].completed ? 'disabled' : ''}>+</button>

      </div>

      <div class="button-row">
        <button onclick="toggleComplete()"
          class="${state[currentTarget].completed ? 'undo' : 'complete'}"
          ${state[currentTarget].matches === 0 ? 'disabled' : ''}
        >
          ${state[currentTarget].completed ? 'Undo Complete' : 'Complete'}
        </button>
      </div>

    </div>

  ` : `
    <div class="target-placeholder">
      <div class="placeholder-text">Select Hero</div>
    </div>
  `}

</div>

    </div>

    <div class="card">
      <div class="label">Total Matches</div>
      <div class="value">${stats.matches}</div>
    </div>

    <div class="card difficulty-card">

      <div class="difficulty-row">

        <div class="difficulty-item easy ${!diff.easiest ? 'empty' : ''}">
          <div class="difficulty-title">Easiest</div>

          ${diff.easiest ? `
            <div class="img-wrapper">
              <img src="${diff.easiest.image}" />
              <div class="match-overlay">
                ${state[diff.easiest.name].matches}
              </div>
            </div>
          ` : `
            <div class="img-wrapper empty-box"></div>
          `}
        </div>


        <div class="difficulty-item hard ${!diff.hardest ? 'empty' : ''}">
          <div class="difficulty-title">Hardest</div>

          ${diff.hardest ? `
            <div class="img-wrapper">
              <img src="${diff.hardest.image}" />
              <div class="match-overlay">
                ${state[diff.hardest.name].matches}
              </div>
            </div>
          ` : `
            <div class="img-wrapper empty-box"></div>
          `}
        </div>

      </div>

    </div>


    <div class="role-filter">

      <button onclick="toggleRole('Tank')" class="${selectedRole === 'Tank' ? 'active' : ''}">
        <img src="images/icons/tank_icon.png" alt="Tank">
      </button>

      <button onclick="toggleRole('Damage')" class="${selectedRole === 'Damage' ? 'active' : ''}">
        <img src="images/icons/dps_icon.png" alt="Damage">
      </button>

      <button onclick="toggleRole('Support')" class="${selectedRole === 'Support' ? 'active' : ''}">
        <img src="images/icons/supp_icon.png" alt="Support">
      </button>

    </div>

    <div class="left-actions">

      <div class="action-row">

        <button onclick="selectNextTarget()">
          Next
        </button>

        <button onclick="rollRandomHero()">
          Random
        </button>

      </div>

      <button
        onclick="handleReset()"
        class="${resetArmed ? 'reset-confirm' : 'reset'}"
      >
        ${resetArmed ? 'Click Again To Confirm' : 'Reset Challenge'}
      </button>

    </div>

  `;
}

/* HERO GRID */

function renderGrid() {
    const grid = document.getElementById("heroGrid");
    const grouped = groupHeroes();

    grid.innerHTML = Object.entries(grouped).map(([role, heroes]) => {

    return `
      <section class="role-section">
        <h2 class="role-title">${role}</h2>

        <div class="role-grid">
          ${heroes.map(hero => {
            const data = state[hero.name];

            return `
              <div class="hero ${data.completed ? "done" : ""} ${hero.name === currentTarget ? "selected" : ""} " onclick="selectHero('${hero.name}')">

                <img src="${hero.image}" />

                <div class="hero-overlay">
                  <div class="hero-matches">${data.matches} matches</div>
                </div>

              </div>
            `;
          }).join("")}
        </div>

      </section>
    `;
  }).join("");
}

/* ACTIONS */

function selectHero(name) {
    currentTarget = name;
    render();
}

function selectNextTarget() {
  const heroes = getFilteredHeroes();

  if (heroes.length === 0) {
    currentTarget = null;
  } else {
    currentTarget = heroes[0].name;
  }
  
  render();
}

function rollRandomHero() {
  const heroes = getFilteredHeroes();

  if (heroes.length === 0) return;

  currentTarget = heroes[Math.floor(Math.random() * heroes.length)].name;

  render();
}

function toggleRandomMode() {
  const btn = document.getElementById("randomBtn");
  btn.classList.toggle("active", randomMode);

  const heroes = getFilteredHeroes();
  if (heroes.length === 0) return;

  if (!wasRandom && randomMode) {
    rollRandomHero();
  }

  if (wasRandom && !randomMode) {
    selectNextTarget();
  }

  render();
}

function changeMatches(amount) {
    if (!currentTarget) return;

    const hero = state[currentTarget];

    if (hero.completed && amount > 0) {
      return;
    }

    hero.matches = Math.max(0, hero.matches + amount);

    if (hero.matches === 0) {
      hero.completed = false;
    }

    saveState();
    render();
}

function toggleComplete() {
  if (!currentTarget) return;

  const hero = state[currentTarget];

  hero.completed = !hero.completed;

  saveState();
  render();
}

function handleReset() {
  if (!resetArmed) {
    resetArmed = true;
    renderLeft();

    setTimeout(() => {
      resetArmed = false;
      renderLeft();
    }, 5000);

    return;
  }

  HEROES.forEach(hero => {
    state[hero.name] = {
      matches: 0,
      completed: false
    };
  });

  currentTarget = null;
  resetArmed = false
  saveState();
  render();
}

function toggleRole(role) {
  selectedRole = selectedRole === role ? null : role;

 render();
}

function getDifficultyHeroes() {
  const playedHeroes = HEROES.filter(h => state[h.name].matches > 0);
  const completedHeroes = HEROES.filter(h => state[h.name].completed);

  const easiest = completedHeroes.length ? [...completedHeroes].sort( (a, b) => state[a.name].matches - state[b.name].matches )[0] : null;

  const hardest = playedHeroes.length ? [...playedHeroes].sort( (a, b) => state[b.name].matches - state[a.name].matches )[0] : null;

  return {
    easiest,
    hardest
  };
}

function getFilteredHeroes() {
  let heroes = HEROES.filter(h => !state[h.name].completed);

  if (selectedRole) {
    heroes = heroes.filter(h => h.role === selectedRole);
  }

  return heroes;
}

/* MASTER RENDER */

function render() {
  renderLeft();
  renderGrid();
}

/* START */

render();