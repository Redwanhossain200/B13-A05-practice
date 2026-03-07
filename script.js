let allIssues = [];

document.getElementById('login-form').addEventListener('submit', function (e) {
  e.preventDefault();

  const user = document.getElementById('username').value;
  const pass = document.getElementById('password').value;

  if (user === 'admin' && pass === 'admin123') {
    console.log("Login successful!");
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('main-section').classList.remove('hidden');
    fetchIssues();
  } else {
    alert('Invalid!');
  }
});

async function fetchIssues() {
  const spinner = document.getElementById('loading-spinner');
  const grid = document.getElementById('issue-grid');
  spinner.classList.remove('hidden');

  grid.classList.add('opacity-0');
  setTimeout(() => {
    grid.classList.remove('opacity-0');
    grid.classList.add('opacity-100', 'transition-opacity', 'duration-500');
  }, 10);

  try {
    const res = await fetch('https://phi-lab-server.vercel.app/api/v1/lab/issues');
    const result = await res.json();

    if (result.status === "success") {
      allIssues = result.data;
      displayIssues(allIssues);
    }
  } catch (error) {
    console.error("Error while fetching issues:", error);
  } finally {
    spinner.classList.add('hidden');
  }
};

function getLabelHTML(labels) {
  return labels.map(l => {
    let labelLower = l.toLowerCase();
    let color = '';
    let icon = '';

    if (labelLower.includes('bug')) {
      color = 'bg-red-50 text-red-500 border-red-100';
      icon = 'fa-bug';
    } else if (labelLower.includes('help')) {
      color = 'bg-orange-50 text-orange-500 border-orange-100';
      icon = 'fa-hand-holding-heart';
    } else if (labelLower.includes('enhancement')) {
      color = 'bg-blue-50 text-blue-500 border-blue-100';
      icon = 'fa-wand-magic-sparkles';
    } else if (labelLower.includes('documentation')) {
      color = 'bg-gray-50 text-gray-500 border-gray-100';
      icon = 'fa-file-lines';
    } else {
      color = 'bg-green-50 text-green-500 border-green-100';
      icon = 'fa-tag';
    }

    return `<span class="label-pill ${color} border py-1 px-3 rounded-full text-[11px] flex items-center gap-1">
                <i class="fa-solid ${icon} text-[10px]"></i> 
                ${l}
            </span>`;
  }).join('');
};

function displayIssues(issues) {
  const grid = document.getElementById('issue-grid');
  const countText = document.getElementById('issue-count-text');

  if (countText) {
    countText.innerText = `${issues.length} Issues`;
  }

  grid.innerHTML = issues.map(issue => {
    const isOpen = issue.status === 'open';
    const statusImg = isOpen ? 'Open-Status.png' : 'Closed- Status .png';
    const statusClass = isOpen ? 'status-badge-open' : 'status-badge-closed';
    const formattedDate = new Date(issue.createdAt).toLocaleDateString();

    return `
      <div class="issue-card bg-white rounded-lg p-5 flex flex-col justify-between ${statusClass}">
        <div>
          <div class="flex justify-between items-center mb-4 gap-2">
            <span><img src="./assets/${statusImg}" alt="${issue.status}"></span>
            <span class="priority-badge uppercase ${getPriorityClass(issue.priority)}">
              ${issue.priority}
            </span>
          </div>
          
          <h3 onclick="showDetails(${issue.id})" 
              class="text-[15px] font-bold text-[#1E293B] cursor-pointer hover:text-[#6366F1] transition-colors mb-2 line-clamp-2">
            ${issue.title}
          </h3>
          
          <p class="text-xs text-gray-500 mb-4 line-clamp-2 leading-relaxed">
            ${issue.description}
          </p>
          
          <div class="flex flex-wrap gap-2 mb-4">
            ${getLabelHTML(issue.labels)}
          </div>
        </div>

        <div class="border-t border-gray-50 pt-3 mt-auto flex flex-col gap-1 text-[10px] text-gray-400">
          <span class="font-medium text-gray-500">#${issue.id} by @${issue.author}</span>
          <span>${formattedDate}</span>
        </div>
      </div>
    `;
  }).join('');
};

function getPriorityClass(priority) {
  const baseStyle = "rounded-2xl px-6 py-1 font-semibold";

  const colors = {
    high: "text-[#ef4444] bg-[#FEECEC]",
    medium: "text-[#f59e0b] bg-[#FFF6D1]",
    low: "text-[#9ca3af] bg-[#eeeff2]"
  };

  const selectedColor = colors[priority] || colors.low;

  return `${selectedColor} ${baseStyle}`;
};

function filterData(status) {
  const allButtons = document.querySelectorAll('.tab-btn');
  const spinner = document.getElementById('loading-spinner');
  const grid = document.getElementById('issue-grid');

  allButtons.forEach(btn => {
    btn.classList.remove('active-tab', 'text-gray-500');
    btn.classList.add('text-gray-500');
  });

  if (event) {
    event.target.classList.add('active-tab');
    event.target.classList.remove('text-gray-500');
  }

  grid.innerHTML = '';
  spinner.classList.remove('hidden');

  setTimeout(() => {
    const filtered = status === 'all'
      ? allIssues
      : allIssues.filter(issue => issue.status === status);

    displayIssues(filtered);

    spinner.classList.add('hidden');
  }, 300);
};

async function handleSearch() {
  const query = document.getElementById('search-input').value.toLowerCase();
  const spinner = document.getElementById('loading-spinner');
  const grid = document.getElementById('issue-grid');

  if (query.trim() === "") {
    displayIssues(allIssues);
    return;
  }

  grid.innerHTML = '';
  spinner.classList.remove('hidden');

  try {
    const res = await fetch(`https://phi-lab-server.vercel.app/api/v1/lab/issues/search?q=${query}`);
    const result = await res.json();

    if (result.status === "success" && result.data) {
      displayIssues(result.data);
    }
  } catch (err) {
    console.error("Search API Error:", err);
  } finally {
    spinner.classList.add('hidden');
  }
};

const searchBtn = document.getElementById('search-btn');
if (searchBtn) {
  searchBtn.addEventListener('click', handleSearch);
}

const searchInput = document.getElementById('search-input');
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    if (e.target.value.trim() === "") {
      displayIssues(allIssues);
    }
  });

  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
  });
};

async function showDetails(id) {
  const modal = document.getElementById('issue_modal');
  const content = document.getElementById('modal-content');

  content.innerHTML = '<div class="flex justify-center py-10"><span class="loading loading-dots loading-lg"></span></div>';
  modal.showModal();

  try {
    const res = await fetch(`https://phi-lab-server.vercel.app/api/v1/lab/issue/${id}`);
    const result = await res.json();
    const data = result.data;

    const isOpened = data.status === 'open';
    const statusText = isOpened ? 'Opened' : 'Closed';
    const statusBg = isOpened ? 'bg-[#00BA88]' : 'bg-[#A855F7]';

    content.innerHTML = `
        <h2 class="text-3xl font-bold text-[#1E293B] mb-4">${data.title}</h2>
        <div class="flex items-center gap-2 mb-6 text-sm">
            <span class="px-3 py-1 rounded-full ${statusBg} text-white font-medium flex items-center">
              ${statusText}
            </span>
            <span class="text-gray-400">• Opened by <span class="text-gray-500 font-medium">${data.author}</span> • ${new Date(data.createdAt).toLocaleDateString('en-GB')}</span>
        </div>
        <div class="flex flex-wrap gap-2 mb-8">
            ${getLabelHTML(data.labels)}
        </div>
        <p class="text-[#64748B] leading-relaxed mb-8 text-[15px]">${data.description}</p>
        <div class="bg-[#F8FAFC] p-6 rounded-xl flex justify-between items-start gap-24"> 
            <div>
                <p class="text-[13px] text-[#64748B] mb-1">Assignee:</p>
                <p class="font-bold text-[#1E293B] text-[15px]">${data.assignee || 'Unassigned'}</p>
            </div>
            <div class="text-left">
                <p class="text-[13px] text-[#64748B] mb-2">Priority:</p>
                <span class="${getPriorityClass(data.priority)} inline-block">
                  ${data.priority}
                </span>
            </div>
        </div>
    `;
  } catch (err) {
    content.innerHTML = '<p class="text-red-500 text-center">Error loading details.</p>';
  }
};