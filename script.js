let allIssues = [];

// 1. Auth Logic
document.getElementById('login-form').addEventListener('submit', function (e) {
  e.preventDefault();
  const user = document.getElementById('username').value;
  const pass = document.getElementById('password').value;

  if (user === 'admin' && pass === 'admin123') {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('main-section').classList.remove('hidden');
    fetchIssues();
  } else {
    alert('Invalid credentials!');
  }
});

// 2. Fetch Data
async function fetchIssues() {
  const spinner = document.getElementById('loading-spinner');
  spinner.classList.remove('hidden');

  try {
    const res = await fetch('https://phi-lab-server.vercel.app/api/v1/lab/issues');
    const result = await res.json();
    allIssues = result.data;
    displayIssues(allIssues);
  } catch (error) {
    console.error("Fetch error:", error);
  } finally {
    spinner.classList.add('hidden');
  }
}

// 3. Display Function
function displayIssues(issues) {
  const grid = document.getElementById('issue-grid');
  document.getElementById('issue-count-text').innerText = `${issues.length} Issues`;

  grid.innerHTML = issues.map(issue => {
    const statusIcon = issue.status === 'open'
      ? '<img src="./assets/Open-Status.png" alt="open status">'
      : '<img src="./assets/Closed- Status .png" alt="Closed Status">';

    return `
        <div class="issue-card bg-white rounded-lg p-5 flex flex-col justify-between ${issue.status === 'open' ? 'status-badge-open' : 'status-badge-closed'}">
            <div>
                <div class="flex justify-between items-center mb-4">
                    <span>${statusIcon}</span>
                    <span class="priority-badge uppercase ${getPriorityClass(issue.priority)}">${issue.priority}</span>
                </div>
                <h3 onclick="showDetails(${issue.id})" class="text-[15px] font-bold text-[#1E293B] cursor-pointer hover:text-[#6366F1] transition-colors mb-2 line-clamp-2">
                    ${issue.title}
                </h3>
                <p class="text-xs text-gray-500 mb-4 line-clamp-2 leading-relaxed">${issue.description}</p>
                <div class="flex flex-wrap gap-2 mb-4">
                    ${issue.labels.map(l => {
      let color = l.toLowerCase().includes('bug') ? 'bg-red-50 text-red-500 border-red-100' :
        l.toLowerCase().includes('help') ? 'bg-orange-50 text-orange-500 border-orange-100' :
          'bg-green-50 text-green-500 border-green-100';
      return `<span class="label-pill ${color}"><i class="fa-solid fa-tag text-[8px]"></i> ${l}</span>`;
    }).join('')}
                </div>
            </div>
            <div class="border-t border-gray-50 pt-3 mt-auto flex flex-col gap-1 text-[10px] text-gray-400">
                <span class="font-medium text-gray-500">#${issue.id} by @${issue.author}</span>
                <span>${new Date(issue.createdAt).toLocaleDateString()}</span>
            </div>
        </div>
    `;
  }).join('');
}

function getPriorityClass(p) {
  if (p === 'high') return 'text-red-600 bg-red-50';
  if (p === 'medium') return 'text-orange-600 bg-orange-50';
  return 'text-green-600 bg-green-50';
}

// 4. Filter & Search
function filterData(status) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active-tab', 'text-gray-500'));
  event.target.classList.add('active-tab');
  const filtered = status === 'all' ? allIssues : allIssues.filter(i => i.status === status);
  displayIssues(filtered);
}

document.getElementById('search-input').addEventListener('input', async (e) => {
  const query = e.target.value.toLowerCase();
  if (query.length < 2) return displayIssues(allIssues);
  try {
    const res = await fetch(`https://phi-lab-server.vercel.app/api/v1/lab/issues/search?q=${query}`);
    const result = await res.json();
    displayIssues(result.data);
  } catch (err) { console.log(err); }
});

// 5. Modal Details (Based on Popup.png)
async function showDetails(id) {
  const modal = document.getElementById('issue_modal');
  const content = document.getElementById('modal-content');
  content.innerHTML = '<div class="flex justify-center py-10"><span class="loading loading-dots loading-lg"></span></div>';
  modal.showModal();

  try {
    const res = await fetch(`https://phi-lab-server.vercel.app/api/v1/lab/issue/${id}`);
    const result = await res.json();
    const data = result.data;

    content.innerHTML = `
        <h2 class="text-3xl font-bold text-[#1E293B] mb-4">${data.title}</h2>
        <div class="flex items-center gap-3 mb-6">
            <span class="px-3 py-1 rounded-full bg-[#00BA88] text-white text-sm font-medium">Opened</span>
            <span class="text-gray-400 text-sm">• Opened by <span class="text-gray-600 font-medium">${data.author}</span> • ${new Date(data.createdAt).toLocaleDateString()}</span>
        </div>
        <div class="flex gap-2 mb-8">
            ${data.labels.map(l => `<span class="label-pill bg-red-50 text-red-500 border border-red-100 py-1 px-3 text-[11px]"><i class="fa-solid fa-tag mr-1"></i> ${l}</span>`).join('')}
        </div>
        <p class="text-gray-500 leading-relaxed mb-8">${data.description}</p>
        <div class="bg-gray-50 p-6 rounded-2xl flex justify-between items-center gap-3">
            <div>
                <p class="text-xs text-gray-400 font-bold uppercase mb-1">Assignee:</p>
                <p class="font-bold text-[#1E293B]">${data.assignee || 'Unassigned'}</p>
            </div>
            <div class="text-left">
                <p class="text-xs text-gray-400 font-bold uppercase mb-2">Priority:</p>
                <span class="bg-red-500 text-white px-6 py-1 rounded-md text-xs font-bold uppercase">${data.priority}</span>
            </div>
        </div>
    `;
  } catch (err) { content.innerHTML = '<p class="text-red-500">Error loading details.</p>'; }
}