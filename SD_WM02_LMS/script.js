// ============================================================
// SCRIPT.JS — LMS Chacks Creative Technology
// Handles: signup saving, dynamic greeting, leave requests,
//          approve/reject accounts, leave review, reports
// ============================================================


// ==========================
// HELPER — Get element safely
// Returns null without throwing if element doesn't exist
// ==========================

function getEl(id) {
    return document.getElementById(id);
}


// ==========================
// SIGNUP FORM
// Saves the new user's details to localStorage so that the
// dashboard can display the correct name and profile info
// ==========================

const signupForm = getEl("signupForm");

if (signupForm) {

    signupForm.addEventListener("submit", function (e) {

        e.preventDefault();

        // Read all fields from the signup form
        const firstName = getEl("firstName").value.trim();
        const lastName  = getEl("lastName").value.trim();
        const empNumber = getEl("empNumber").value.trim();
        const email     = getEl("signupEmail").value.trim();
        const dept      = getEl("department").value.trim();
        const password  = getEl("signupPassword").value;
        const confirm   = getEl("confirmPassword").value;

        // Basic validation — passwords must match
        if (password !== confirm) {
            alert("Passwords do not match. Please try again.");
            return;
        }

        // Build a user object from the form data
        const newUser = {
            firstName : firstName,
            lastName  : lastName,
            fullName  : firstName + " " + lastName,
            empNumber : empNumber,
            email     : email,
            department: dept
        };

        // Save the current user to localStorage so other pages can read it
        localStorage.setItem("currentUser", JSON.stringify(newUser));

        // Also add this user to the pending accounts list so HR can approve them
        let accounts = JSON.parse(localStorage.getItem("pendingAccounts") || "[]");
        accounts.push({
            id        : empNumber || "EMP" + Date.now(),
            name      : newUser.fullName,
            email     : email,
            department: dept,
            status    : "Pending"
        });
        localStorage.setItem("pendingAccounts", JSON.stringify(accounts));

        alert("Account created! Waiting for HR approval.");

        // Redirect to employee login after signup
        window.location.href = "employee-login.html";

    });

}


// ==========================
// EMPLOYEE DASHBOARD
// Loads the logged-in user's name and profile data,
// and populates leave counts from localStorage
// ==========================

if (getEl("welcomeName")) {

    // Load user from localStorage
    const user = JSON.parse(localStorage.getItem("currentUser") || "{}");

    // Display first name in the welcome heading
    if (user.firstName) {
        getEl("welcomeName").textContent = user.firstName + "!";
    } else {
        getEl("welcomeName").textContent = "Employee!";
    }

    // Fill profile section with real user data
    if (getEl("profileName"))   getEl("profileName").textContent   = user.fullName   || "—";
    if (getEl("profileEmpId"))  getEl("profileEmpId").textContent  = user.empNumber  || "—";
    if (getEl("profileDept"))   getEl("profileDept").textContent   = user.department || "—";
    if (getEl("profileEmail"))  getEl("profileEmail").textContent  = user.email      || "—";

    // Load leave requests from localStorage and calculate counts
    const leaveRequests = JSON.parse(localStorage.getItem("leaveRequests") || "[]");

    const totalDays    = 20; // Company policy: 20 leave days per year
    const approvedDays = leaveRequests.filter(r => r.status === "Approved").length;
    const pendingCount = leaveRequests.filter(r => r.status === "Pending").length;
    const remaining    = totalDays - approvedDays;

    // Update the summary cards
    if (getEl("remainingDays"))  getEl("remainingDays").textContent  = remaining;
    if (getEl("approvedCount"))  getEl("approvedCount").textContent  = approvedDays;
    if (getEl("pendingCount"))   getEl("pendingCount").textContent   = pendingCount;

    // Update the hero banner stats
    if (getEl("heroBalance"))  getEl("heroBalance").textContent  = remaining + " days";
    if (getEl("heroPending"))  getEl("heroPending").textContent  = pendingCount;

    // Populate the leave history table with the employee's requests
    const leaveTableBody = getEl("leaveTableBody");

    if (leaveTableBody) {

        leaveTableBody.innerHTML = ""; // Clear existing rows

        if (leaveRequests.length === 0) {

            // Show a message if there are no requests yet
            leaveTableBody.innerHTML = "<tr><td colspan='3'>No leave requests yet.</td></tr>";

        } else {

            leaveRequests.forEach(function (req) {

                const row = document.createElement("tr");

                row.innerHTML = `
                    <td>${req.startDate}</td>
                    <td>${req.leaveType}</td>
                    <td class="${req.status.toLowerCase()}">${req.status}</td>
                `;

                leaveTableBody.appendChild(row);

            });

        }

    }

}


// ==========================
// LEAVE APPLICATION FORM
// Saves a new leave request to localStorage so it appears
// in both the employee history and the HR review table
// ==========================

const leaveForm = getEl("leaveForm");

if (leaveForm) {

    leaveForm.addEventListener("submit", function (e) {

        e.preventDefault();

        // Read the form values
        const leaveType = getEl("leaveType").value;
        const startDate = getEl("startDate").value;
        const endDate   = getEl("endDate").value;
        const reason    = getEl("leaveReason").value.trim();

        // Basic validation
        if (!startDate || !endDate) {
            alert("Please select both start and end dates.");
            return;
        }

        // Get the current user
        const user = JSON.parse(localStorage.getItem("currentUser") || "{}");

        // Build a leave request object
        const newRequest = {
            employee  : user.fullName  || "Unknown Employee",
            leaveType : leaveType,
            startDate : startDate,
            endDate   : endDate,
            reason    : reason,
            status    : "Pending"
        };

        // Add to the list of leave requests in localStorage
        let requests = JSON.parse(localStorage.getItem("leaveRequests") || "[]");
        requests.push(newRequest);
        localStorage.setItem("leaveRequests", JSON.stringify(requests));

        alert("Leave request submitted successfully!");

        leaveForm.reset();

        // Refresh the page so the history table updates
        location.reload();

    });

}


// ==========================
// APPROVE ACCOUNTS PAGE
// Loads pending account registrations and renders them
// in the table — new signups appear here automatically
// ==========================

const accountsTableBody = getEl("accountsTableBody");

if (accountsTableBody) {

    // Load accounts from localStorage
    let accounts = JSON.parse(localStorage.getItem("pendingAccounts") || "[]");

    // If no accounts exist yet, show sample data so the page isn't empty
    if (accounts.length === 0) {
        accounts = [
            { id: "EMP001", name: "John Smith",    email: "john@email.com",   department: "Information Technology", status: "Pending"  },
            { id: "EMP002", name: "Sarah Williams", email: "sarah@email.com",  department: "Finance",                status: "Pending"  },
            { id: "EMP003", name: "Michael Brown",  email: "michael@email.com",department: "Human Resources",        status: "Approved" }
        ];
        localStorage.setItem("pendingAccounts", JSON.stringify(accounts));
    }

    // Render rows
    renderAccountRows(accounts);

    // Update the summary cards
    updateAccountCards(accounts);

}

// Renders the accounts table rows from an array
function renderAccountRows(accounts) {

    if (!accountsTableBody) return;

    accountsTableBody.innerHTML = "";

    accounts.forEach(function (acc, index) {

        const row = document.createElement("tr");

        // Choose the correct button state based on account status
        const actionBtn = acc.status === "Pending"
            ? `<button class="approve-btn" data-index="${index}">Approve</button>
               <button class="reject-btn"  data-index="${index}">Reject</button>`
            : `<button disabled>${acc.status}</button>`;

        row.innerHTML = `
            <td>${acc.id}</td>
            <td>${acc.name}</td>
            <td>${acc.email}</td>
            <td>${acc.department}</td>
            <td><span class="${acc.status.toLowerCase()}">${acc.status}</span></td>
            <td>${actionBtn}</td>
        `;

        accountsTableBody.appendChild(row);

    });

    // Attach approve button listeners
    document.querySelectorAll(".approve-btn").forEach(function (btn) {

        btn.addEventListener("click", function () {

            const i = parseInt(this.dataset.index);
            let accounts = JSON.parse(localStorage.getItem("pendingAccounts") || "[]");

            accounts[i].status = "Approved";

            localStorage.setItem("pendingAccounts", JSON.stringify(accounts));

            alert(accounts[i].name + " has been approved!");

            renderAccountRows(accounts);
            updateAccountCards(accounts);

        });

    });

    // Attach reject button listeners
    document.querySelectorAll(".reject-btn").forEach(function (btn) {

        btn.addEventListener("click", function () {

            const i = parseInt(this.dataset.index);
            let accounts = JSON.parse(localStorage.getItem("pendingAccounts") || "[]");

            accounts[i].status = "Rejected";

            localStorage.setItem("pendingAccounts", JSON.stringify(accounts));

            alert(accounts[i].name + " has been rejected.");

            renderAccountRows(accounts);
            updateAccountCards(accounts);

        });

    });

}

// Updates the summary cards on the approve-accounts page
function updateAccountCards(accounts) {

    const total    = accounts.length;
    const pending  = accounts.filter(a => a.status === "Pending").length;
    const approved = accounts.filter(a => a.status === "Approved").length;

    if (getEl("totalEmployees"))   getEl("totalEmployees").textContent   = total;
    if (getEl("pendingApproval"))  getEl("pendingApproval").textContent  = pending;
    if (getEl("approvedAccounts")) getEl("approvedAccounts").textContent = approved;

}


// ==========================
// REVIEW LEAVES PAGE
// Loads all submitted leave requests and renders them
// so HR can approve or reject each one
// ==========================

const leavesTableBody = getEl("leavesTableBody");

if (leavesTableBody) {

    // Load leave requests from localStorage
    let leaveRequests = JSON.parse(localStorage.getItem("leaveRequests") || "[]");

    // If empty, show sample data
    if (leaveRequests.length === 0) {
        leaveRequests = [
            { employee: "John Smith",    leaveType: "Annual Leave",          startDate: "15/06/2026", endDate: "20/06/2026", reason: "Family Vacation",    status: "Pending"  },
            { employee: "Sarah Williams",leaveType: "Sick Leave",            startDate: "21/06/2026", endDate: "23/06/2026", reason: "Medical Recovery",   status: "Approved" },
            { employee: "Michael Brown", leaveType: "Family Responsibility", startDate: "28/06/2026", endDate: "29/06/2026", reason: "Family Emergency",   status: "Rejected" }
        ];
        localStorage.setItem("leaveRequests", JSON.stringify(leaveRequests));
    }

    renderLeaveRows(leaveRequests);
    updateLeaveCards(leaveRequests);

}

// Renders the leave review table rows
function renderLeaveRows(requests) {

    if (!leavesTableBody) return;

    leavesTableBody.innerHTML = "";

    requests.forEach(function (req, index) {

        const row = document.createElement("tr");

        // Only pending requests get approve/reject buttons
        const actionBtn = req.status === "Pending"
            ? `<button class="approve-btn" data-index="${index}">Approve</button>
               <button class="reject-btn"  data-index="${index}">Reject</button>`
            : `<button disabled>${req.status}</button>`;

        row.innerHTML = `
            <td>${req.employee}</td>
            <td>${req.leaveType}</td>
            <td>${req.startDate}</td>
            <td>${req.endDate}</td>
            <td>${req.reason}</td>
            <td><span class="${req.status.toLowerCase()}">${req.status}</span></td>
            <td>${actionBtn}</td>
        `;

        leavesTableBody.appendChild(row);

    });

    // Approve button listeners for leave review
    document.querySelectorAll(".approve-btn").forEach(function (btn) {

        btn.addEventListener("click", function () {

            const i = parseInt(this.dataset.index);
            let requests = JSON.parse(localStorage.getItem("leaveRequests") || "[]");

            requests[i].status = "Approved";

            localStorage.setItem("leaveRequests", JSON.stringify(requests));

            alert(requests[i].employee + "'s leave has been approved!");

            renderLeaveRows(requests);
            updateLeaveCards(requests);

        });

    });

    // Reject button listeners for leave review
    document.querySelectorAll(".reject-btn").forEach(function (btn) {

        btn.addEventListener("click", function () {

            const i = parseInt(this.dataset.index);
            let requests = JSON.parse(localStorage.getItem("leaveRequests") || "[]");

            requests[i].status = "Rejected";

            localStorage.setItem("leaveRequests", JSON.stringify(requests));

            alert(requests[i].employee + "'s leave has been rejected.");

            renderLeaveRows(requests);
            updateLeaveCards(requests);

        });

    });

}

// Updates the summary cards on the review-leaves page
function updateLeaveCards(requests) {

    const total    = requests.length;
    const pending  = requests.filter(r => r.status === "Pending").length;
    const approved = requests.filter(r => r.status === "Approved").length;
    const rejected = requests.filter(r => r.status === "Rejected").length;

    if (getEl("totalRequests"))    getEl("totalRequests").textContent    = total;
    if (getEl("pendingRequests"))  getEl("pendingRequests").textContent  = pending;
    if (getEl("approvedRequests")) getEl("approvedRequests").textContent = approved;
    if (getEl("rejectedRequests")) getEl("rejectedRequests").textContent = rejected;

}


// ==========================
// REPORTS PAGE
// Loads leave data and filters it based on the selected
// report type and month, then renders results in the table
// ==========================

const reportForm = getEl("reportForm");
const reportTableBody = getEl("reportTableBody");

if (reportTableBody) {

    // Load all leave requests for the summary cards
    const allRequests = JSON.parse(localStorage.getItem("leaveRequests") || "[]");
    updateReportCards(allRequests);

    // Show all requests by default when the page loads
    renderReportRows(allRequests);

}

if (reportForm) {

    reportForm.addEventListener("submit", function (e) {

        e.preventDefault();

        const type  = getEl("reportType").value;
        const month = getEl("reportMonth").value; // Format: "YYYY-MM"

        let requests = JSON.parse(localStorage.getItem("leaveRequests") || "[]");

        // Filter by status if not "all"
        if (type !== "all") {
            requests = requests.filter(function (r) {
                return r.status.toLowerCase() === type;
            });
        }

        // Filter by month if a month is selected
        if (month) {
            requests = requests.filter(function (r) {
                // startDate may be in dd/mm/yyyy or yyyy-mm-dd format
                return r.startDate.includes(month.split("-")[1]) &&
                       r.startDate.includes(month.split("-")[0]);
            });
        }

        renderReportRows(requests);

    });

}

// Renders rows in the report results table
function renderReportRows(requests) {

    if (!reportTableBody) return;

    reportTableBody.innerHTML = "";

    if (requests.length === 0) {

        reportTableBody.innerHTML = "<tr><td colspan='5'>No records found for the selected filter.</td></tr>";
        return;

    }

    requests.forEach(function (req) {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${req.employee}</td>
            <td>${req.leaveType}</td>
            <td>${req.startDate}</td>
            <td>${req.endDate}</td>
            <td><span class="${req.status.toLowerCase()}">${req.status}</span></td>
        `;

        reportTableBody.appendChild(row);

    });

}

// Updates the summary cards on the reports page
function updateReportCards(requests) {

    const total    = requests.length;
    const approved = requests.filter(r => r.status === "Approved").length;
    const rejected = requests.filter(r => r.status === "Rejected").length;
    const pending  = requests.filter(r => r.status === "Pending").length;

    if (getEl("reportTotalLeaves")) getEl("reportTotalLeaves").textContent = total;
    if (getEl("reportApproved"))    getEl("reportApproved").textContent    = approved;
    if (getEl("reportRejected"))    getEl("reportRejected").textContent    = rejected;
    if (getEl("reportPending"))     getEl("reportPending").textContent     = pending;

}


// ==========================
// HR DASHBOARD CARDS
// Updates the HR dashboard summary cards from localStorage
// ==========================

if (getEl("hrTotalEmployees")) {

    const accounts = JSON.parse(localStorage.getItem("pendingAccounts") || "[]");
    const requests = JSON.parse(localStorage.getItem("leaveRequests")   || "[]");

    getEl("hrTotalEmployees").textContent  = accounts.length;
    getEl("hrPendingAccounts").textContent = accounts.filter(a => a.status === "Pending").length;
    getEl("hrPendingLeaves").textContent   = requests.filter(r => r.status === "Pending").length;
    getEl("hrApprovedLeaves").textContent  = requests.filter(r => r.status === "Approved").length;

}


// ==========================
// SEARCH FUNCTION
// Filters table rows in real time as the user types
// Works on any page that has a #searchEmployee input
// ==========================

const searchInput = getEl("searchEmployee");

if (searchInput) {

    searchInput.addEventListener("keyup", function () {

        const filter = this.value.toLowerCase();

        // Find all rows inside any tbody on the page
        const rows = document.querySelectorAll("tbody tr");

        rows.forEach(function (row) {

            const text = row.textContent.toLowerCase();

            // Show the row if it contains the search text, hide otherwise
            row.style.display = text.includes(filter) ? "" : "none";

        });

    });

}


// ==========================
// SYSTEM LOG
// Confirms the script loaded correctly (visible in DevTools)
// ==========================

console.log("LMS — Leave Management System script loaded successfully.");