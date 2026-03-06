// Global State
let allIssues = [];

// 1. Auth Logic
document.getElementById('login-form').addEventListener('submit', function (e) {
  e.preventDefault();
  const user = document.getElementById('username').value;
  const pass = document.getElementById('password').value;

  if (user === 'admin' && pass === 'admin123') {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('main-section').classList.remove('hidden');
    fetchIssues(); // Load data after login
  } else {
    alert('Invalid credentials! Try admin / admin123');
  }
});

// 2. Fetch Data
async function fetchIssues() {
  const grid = document.getElementById('issue-grid');
  const spinner = document.getElementById('loading-spinner');

  grid.innerHTML = '';
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

  grid.innerHTML = issues.map(issue => `
        <div class="issue-card bg-white border-t-4  border-green-500 rounded-lg p-4 shadow-sm flex flex-col justify-between ${issue.status === 'open' ? 'status-badge-open' : 'status-badge-closed'}">
            <div>
                <div class="flex justify-between items-start mb-2">
                    <span class="text-[10px] text-gray-400 font-mono"><img src="./assets/Open-Status.png" alt="Open Status"></span>
                    <span class="text-[10px] px-6 py-1 rounded-2xl bg-gray-100 font-bold uppercase ${getPriorityClass(issue.priority)}">${issue.priority}</span>
                </div>
                <h3 onclick="showDetails(${issue.id})" class="text-sm font-bold text-[#1E293B] cursor-pointer hover:text-[#6366F1] transition-colors mb-2 line-clamp-2">${issue.title}</h3>
                <p class="text-xs text-gray-500 mb-4 line-clamp-2">${issue.description}</p>
                
                <div class="flex flex-wrap gap-1 mb-4">
                    ${issue.labels.map(l => `<span class="label-pill bg-red-50 text-red-500 border border-red-100">${l}</span>`).join('')}
                </div>
            </div>

            <div class="border-t-2 border-gray-50 pt-3 mt-auto">
                <div class="flex flex-col gap-2 text-[11px] text-gray-400">
                    <span>by @${issue.author}</span>
                    <span>${new Date(issue.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Helper Class for Priority
function getPriorityClass(p) {
  if (p === 'high') return 'text-red-600 bg-red-50';
  if (p === 'medium') return 'text-orange-600 bg-orange-50';
  return 'text-green-600 bg-green-50';
}

// 4. Filtration Logic
function filterData(status) {
  // UI Update
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active-tab');
    btn.classList.add('text-gray-500');
  });
  event.target.classList.add('active-tab');
  event.target.classList.remove('text-gray-500');

  // Filter Logic
  if (status === 'all') {
    displayIssues(allIssues);
  } else {
    const filtered = allIssues.filter(item => item.status === status);
    displayIssues(filtered);
  }
}

// 5. Search Functionality
document.getElementById('search-input').addEventListener('input', async (e) => {
  const query = e.target.value.toLowerCase();
  if (query.length < 2) {
    displayIssues(allIssues);
    return;
  }

  try {
    const res = await fetch(`https://phi-lab-server.vercel.app/api/v1/lab/issues/search?q=${query}`);
    const result = await res.json();
    displayIssues(result.data);
  } catch (err) {
    console.log(err);
  }
});

// 6. Modal / Details
async function showDetails(id) {
  const modal = document.getElementById('issue_modal');
  const content = document.getElementById('modal-content');

  content.innerHTML = '<span class="loading loading-dots loading-md"></span>';
  modal.showModal();

  try {
    const res = await fetch(`https://phi-lab-server.vercel.app/api/v1/lab/issue/${id}`);
    const result = await res.json();
    const data = result.data;

    content.innerHTML = `
    <h2 class="text-2xl font-bold mb-4">${data.title}</h2>
            <div class="flex items-center gap-2 mb-2">
                <span class="badge ${data.status === 'open' ? 'badge-success' : 'badge-secondary'} text-white">${data.status}</span>
                <span class="text-gray-400 text-sm">• Opened by ${data.author} • ${new Date(data.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="bg-gray-50 p-4 rounded-lg mb-6">
                <p class="text-gray-700">${data.description}</p>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div class="p-3 border-none bg-gray-50 rounded-lg">
                    <p class="text-xs text-gray-400 uppercase font-bold">Assignee</p>
                    <p class="font-medium">${data.assignee || 'Unassigned'}</p>
                </div>
                <div class="p-3 border-none bg-gray-50 rounded-lg">
                    <p class="text-xs text-gray-400 uppercase font-bold">Priority</p>
                    <button class="${getPriorityClass(data.priority)} text-white border-none cursor-default px-3">
                        <p class="font-medium text-left text-white bg-red-500 px-6 py-1 uppercase rounded-2xl">${data.priority}</p>
                    </button>
                </div>
            </div>
        `;
  } catch (err) {
    content.innerHTML = 'Error loading data.';
  }
}