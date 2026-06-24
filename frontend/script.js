document.addEventListener('DOMContentLoaded', () => {

const API = 'http://localhost:4000/api';

function authHeaders() {
    return {
        'Content-Type': 'application/json',
        'x-user-id': sessionStorage.getItem('userId') || ''
    };
}

function showMsg(id, text, ok) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.style.cssText = `
        padding:10px 14px;
        border-radius:5px;
        margin-bottom:16px;
        font-size:14px;
        background:${ok ? '#d4edda' : '#f8d7da'};
        color:${ok ? '#155724' : '#721c24'};
        border:1px solid ${ok ? '#c3e6cb' : '#f5c6cb'};
        display:block;
    `;
}

function fmtDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-ZA');
}

// ─── SIGNUP ───────────────────────────────────────────────────────────────────

const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const password = document.getElementById('signupPassword').value;
        const confirm  = document.getElementById('confirmPassword').value;

        if (password !== confirm) {
            showMsg('signupMsg', 'Passwords do not match.', false);
            return;
        }

        const btn = signupForm.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Creating account...';

        try {
            const res = await fetch(`${API}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName:       document.getElementById('firstName').value.trim(),
                    lastName:        document.getElementById('lastName').value.trim(),
                    employeeNumber:  document.getElementById('empNumber').value.trim(),
                    email:           document.getElementById('signupEmail').value.trim(),
                    department:      document.getElementById('department').value.trim(),
                    password,
                    confirmPassword: confirm
                })
            });

            const data = await res.json();

            if (res.ok) {
                showMsg('signupMsg', '✅ Account created! Wait for HR to approve it before logging in.', true);
                signupForm.reset();
            } else {
                showMsg('signupMsg', data.error || 'Registration failed.', false);
            }
        } catch (err) {
            showMsg('signupMsg', 'Could not reach the server. Is the backend running?', false);
        }

        btn.disabled = false;
        btn.textContent = 'Create Account';
    });
}

// ─── EMPLOYEE LOGIN ────────────────────────────────────────────────────────────

const employeeLoginForm = document.getElementById('employeeLoginForm');
if (employeeLoginForm) {
    employeeLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn = employeeLoginForm.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Signing in...';

        try {
            const res = await fetch(`${API}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    email:    document.getElementById('loginEmail').value.trim(),
                    password: document.getElementById('loginPassword').value
                })
            });

            const data = await res.json();

            if (res.ok) {
                if (data.user.role !== 'employee') {
                    showMsg('loginMsg', 'This login is for employees only.', false);
                } else {
                    sessionStorage.setItem('user', JSON.stringify(data.user));
                    sessionStorage.setItem('userId', data.user.id);
                    window.location.href = 'employee-dashboard.html';
                }
            } else {
                showMsg('loginMsg', data.error || 'Login failed. Check your email and password.', false);
            }
        } catch (err) {
            showMsg('loginMsg', 'Could not reach the server. Is the backend running?', false);
        }

        btn.disabled = false;
        btn.textContent = 'Sign in →';
    });
}

// ─── HR LOGIN ──────────────────────────────────────────────────────────────────

const hrLoginForm = document.getElementById('hrLoginForm');
if (hrLoginForm) {
    hrLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn = hrLoginForm.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Logging in...';

        try {
            const res = await fetch(`${API}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    email:    document.getElementById('hrEmail').value.trim(),
                    password: document.getElementById('hrPassword').value
                })
            });

            const data = await res.json();

            if (res.ok) {
                if (data.user.role !== 'hr') {
                    showMsg('hrLoginMsg', 'This login is for HR managers only.', false);
                } else {
                    sessionStorage.setItem('user', JSON.stringify(data.user));
                    sessionStorage.setItem('userId', data.user.id);
                    window.location.href = 'review-leaves.html';
                }
            } else {
                showMsg('hrLoginMsg', data.error || 'Login failed.', false);
            }
        } catch (err) {
            showMsg('hrLoginMsg', 'Could not reach the server. Is the backend running?', false);
        }

        btn.disabled = false;
        btn.textContent = 'Login';
    });
}

// ─── EMPLOYEE DASHBOARD ────────────────────────────────────────────────────────

async function loadEmployeeDashboard() {
    try {
        const stored = sessionStorage.getItem('user');
        if (!stored) { window.location.href = 'employee-login.html'; return; }
        const user = JSON.parse(stored);

        const nameEl = document.getElementById('empName');
        if (nameEl) nameEl.textContent = user.firstName;

        const fields = {
            profileName:      `${user.firstName} ${user.lastName}`,
            profileEmpNumber: user.employeeNumber,
            profileDept:      user.department,
            profileEmail:     user.email
        };
        for (const [id, val] of Object.entries(fields)) {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        }
    } catch (err) {
        console.error('Could not load user info', err);
    }

    try {
        const res = await fetch(`${API}/leaves/my`, {
            credentials: 'include',
            headers: authHeaders()
        });
        const data = await res.json();
        const leaves = Array.isArray(data) ? data : (data.leaves || []);

        const tbody = document.getElementById('leaveHistoryBody');
        if (tbody) {
            if (!leaves.length) {
                tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#aaa;">No leave requests yet.</td></tr>';
            } else {
                tbody.innerHTML = leaves.map(l => `
                    <tr>
                        <td>${fmtDate(l.start_date)}</td>
                        <td>${l.leave_type || l.type}</td>
                        <td class="${l.status}">${l.status.charAt(0).toUpperCase() + l.status.slice(1)}</td>
                    </tr>
                `).join('');
            }
        }

        const approved = leaves.filter(l => l.status === 'approved').length;
        const pending  = leaves.filter(l => l.status === 'pending').length;
        const usedDays = leaves
            .filter(l => l.status === 'approved')
            .reduce((sum, l) => {
                const diff = (new Date(l.end_date) - new Date(l.start_date)) / (1000 * 60 * 60 * 24) + 1;
                return sum + diff;
            }, 0);
        const remaining = Math.max(0, 20 - usedDays);

        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set('statTotal',     20);
        set('statRemaining', remaining);
        set('statApproved',  approved);
        set('statPending',   pending);
        set('leaveBalance',  `${remaining} days`);
        set('pendingCount',  pending);

    } catch (err) {
        console.error('Could not load leaves', err);
    }
}

if (document.getElementById('leaveHistoryBody') || document.getElementById('empName')) {
    loadEmployeeDashboard();
}

const leaveForm = document.getElementById('leaveForm');
if (leaveForm) {
    leaveForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn = leaveForm.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Submitting...';

        try {
            const res = await fetch(`${API}/leaves`, {
                method: 'POST',
                headers: authHeaders(),
                credentials: 'include',
                body: JSON.stringify({
                    leaveType: document.getElementById('leaveType').value,
                    startDate: document.getElementById('startDate').value,
                    endDate:   document.getElementById('endDate').value,
                    reason:    document.getElementById('leaveReason').value
                })
            });

            const data = await res.json();

            if (res.ok) {
                showMsg('leaveMsg', '✅ Leave request submitted successfully!', true);
                leaveForm.reset();
                loadEmployeeDashboard();
            } else {
                showMsg('leaveMsg', data.error || 'Could not submit request.', false);
            }
        } catch (err) {
            showMsg('leaveMsg', 'Could not reach the server.', false);
        }

        btn.disabled = false;
        btn.textContent = 'Submit Request';
    });
}

// ─── LOGOUT ───────────────────────────────────────────────────────────────────

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        sessionStorage.clear();
        await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' });
        window.location.href = 'index.html';
    });
}

// ─── APPROVE ACCOUNTS (HR) ─────────────────────────────────────────────────────

async function loadEmployees() {
    const tbody = document.getElementById('employeeTableBody');
    if (!tbody) return;

    try {
        const res = await fetch(`${API}/employees`, {
            credentials: 'include',
            headers: authHeaders()
        });
        if (!res.ok) { window.location.href = 'hr-login.html'; return; }

        const data = await res.json();
        const employees = Array.isArray(data) ? data : (data.employees || []);

        if (!employees.length) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#aaa;">No employees registered yet.</td></tr>';
        } else {
            tbody.innerHTML = employees.map(emp => {
                const isPending = emp.status === 'pending';
                const actionBtns = isPending
                    ? `<button class="approve-btn" onclick="updateEmployee(${emp.id}, 'approved')">Approve</button>
                       <button class="reject-btn"  onclick="updateEmployee(${emp.id}, 'rejected')">Reject</button>`
                    : `<button disabled>${emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}</button>`;

                return `
                    <tr id="emp-row-${emp.id}">
                        <td>${emp.employee_number}</td>
                        <td>${emp.first_name} ${emp.last_name}</td>
                        <td>${emp.email}</td>
                        <td>${emp.department}</td>
                        <td><span class="${emp.status}">${emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}</span></td>
                        <td>${actionBtns}</td>
                    </tr>
                `;
            }).join('');
        }

        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set('totalEmployees',    employees.length);
        set('pendingEmployees',  employees.filter(e => e.status === 'pending').length);
        set('approvedEmployees', employees.filter(e => e.status === 'approved').length);

        const searchInput = document.getElementById('searchEmployee');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                const q = searchInput.value.toLowerCase();
                tbody.querySelectorAll('tr').forEach(row => {
                    row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
                });
            });
        }

    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:red;">Error loading employees.</td></tr>';
    }
}

window.updateEmployee = async function(id, status) {
    try {
        const res = await fetch(`${API}/employees/${id}/status`, {
            method: 'PATCH',
            headers: authHeaders(),
            credentials: 'include',
            body: JSON.stringify({ status })
        });
        if (res.ok) loadEmployees();
        else alert('Could not update employee status.');
    } catch (err) {
        alert('Server error.');
    }
}

if (document.getElementById('employeeTableBody')) loadEmployees();

// ─── REVIEW LEAVES (HR) ────────────────────────────────────────────────────────

async function loadLeaves() {
    const tbody = document.getElementById('leavesTableBody');
    if (!tbody) return;

    try {
        const res = await fetch(`${API}/leaves`, {
            credentials: 'include',
            headers: authHeaders()
        });
        if (!res.ok) { window.location.href = 'hr-login.html'; return; }

        const data = await res.json();
        const leaves = Array.isArray(data) ? data : (data.leaves || []);

        if (!leaves.length) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#aaa;">No leave requests yet.</td></tr>';
        } else {
            tbody.innerHTML = leaves.map(l => {
                const isPending = l.status === 'pending';
                const actionBtns = isPending
                    ? `<button class="approve-btn" onclick="updateLeave(${l.id}, 'approved')">Approve</button>
                       <button class="reject-btn"  onclick="updateLeave(${l.id}, 'rejected')">Reject</button>`
                    : `<button disabled>${l.status === 'approved' ? 'Completed' : 'Closed'}</button>`;

                return `
                    <tr id="leave-row-${l.id}">
                        <td>${l.first_name} ${l.last_name}</td>
                        <td>${l.leave_type || l.type}</td>
                        <td>${fmtDate(l.start_date)}</td>
                        <td>${fmtDate(l.end_date)}</td>
                        <td>${l.reason || '—'}</td>
                        <td><span class="${l.status}">${l.status.charAt(0).toUpperCase() + l.status.slice(1)}</span></td>
                        <td>${actionBtns}</td>
                    </tr>
                `;
            }).join('');
        }

        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set('totalLeaves',    leaves.length);
        set('pendingLeaves',  leaves.filter(l => l.status === 'pending').length);
        set('approvedLeaves', leaves.filter(l => l.status === 'approved').length);
        set('rejectedLeaves', leaves.filter(l => l.status === 'rejected').length);

    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:red;">Error loading leave requests.</td></tr>';
    }
}

window.updateLeave = async function(id, status) {
    try {
        const res = await fetch(`${API}/leaves/${id}`, {
            method: 'PATCH',
            headers: authHeaders(),
            credentials: 'include',
            body: JSON.stringify({ status })
        });
        if (res.ok) loadLeaves();
        else alert('Could not update leave status.');
    } catch (err) {
        alert('Server error.');
    }
}

if (document.getElementById('leavesTableBody')) loadLeaves();

}); // end DOMContentLoaded