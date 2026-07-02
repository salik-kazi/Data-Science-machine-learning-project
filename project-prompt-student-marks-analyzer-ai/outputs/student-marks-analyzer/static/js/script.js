const state = {
    payload: null,
    students: [],
    page: 1,
    pageSize: 10,
    sortKey: "average",
    sortDirection: "desc",
    query: "",
    status: "all",
    grade: "all",
};

const elements = {};

document.addEventListener("DOMContentLoaded", () => {
    cacheElements();
    bindEvents();
    loadDashboard();
});

function cacheElements() {
    elements.loading = document.getElementById("loadingScreen");
    elements.statsGrid = document.getElementById("statsGrid");
    elements.studentRows = document.getElementById("studentRows");
    elements.globalSearch = document.getElementById("globalSearch");
    elements.statusFilter = document.getElementById("statusFilter");
    elements.gradeFilter = document.getElementById("gradeFilter");
    elements.prevPage = document.getElementById("prevPage");
    elements.nextPage = document.getElementById("nextPage");
    elements.pageInfo = document.getElementById("pageInfo");
    elements.emptyState = document.getElementById("emptyState");
    elements.subjectGrid = document.getElementById("subjectGrid");
    elements.topStudents = document.getElementById("topStudents");
    elements.bottomStudents = document.getElementById("bottomStudents");
    elements.classInsights = document.getElementById("classInsights");
    elements.toast = document.getElementById("toast");
    elements.heroAverage = document.getElementById("heroAverage");
    elements.sidebarHealth = document.getElementById("sidebarHealth");
    elements.sidebar = document.getElementById("sidebar");
}

function bindEvents() {
    elements.globalSearch.addEventListener("input", (event) => {
        state.query = event.target.value.trim().toLowerCase();
        state.page = 1;
        renderTable();
    });

    elements.statusFilter.addEventListener("change", (event) => {
        state.status = event.target.value;
        state.page = 1;
        renderTable();
    });

    elements.gradeFilter.addEventListener("change", (event) => {
        state.grade = event.target.value;
        state.page = 1;
        renderTable();
    });

    elements.prevPage.addEventListener("click", () => {
        state.page = Math.max(1, state.page - 1);
        renderTable();
    });

    elements.nextPage.addEventListener("click", () => {
        state.page += 1;
        renderTable();
    });

    document.querySelectorAll("th[data-sort]").forEach((heading) => {
        heading.addEventListener("click", () => {
            const sortKey = heading.dataset.sort;
            if (state.sortKey === sortKey) {
                state.sortDirection = state.sortDirection === "asc" ? "desc" : "asc";
            } else {
                state.sortKey = sortKey;
                state.sortDirection = "asc";
            }
            renderTable();
        });
    });

    document.getElementById("themeToggle").addEventListener("click", () => {
        document.body.classList.toggle("light");
        showToast("Theme updated");
    });

    document.getElementById("printReport").addEventListener("click", () => {
        showToast("Opening print dialog");
        window.print();
    });

    document.getElementById("menuButton").addEventListener("click", () => {
        elements.sidebar.classList.toggle("open");
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "/" && document.activeElement !== elements.globalSearch) {
            event.preventDefault();
            elements.globalSearch.focus();
        }
        if (event.key.toLowerCase() === "d" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            document.body.classList.toggle("light");
            showToast("Theme updated");
        }
    });

    document.querySelectorAll("[data-nav]").forEach((link) => {
        link.addEventListener("click", () => {
            document.querySelectorAll("[data-nav]").forEach((item) => item.classList.remove("active"));
            link.classList.add("active");
            elements.sidebar.classList.remove("open");
        });
    });
}

async function loadDashboard() {
    try {
        const response = await fetch("/api/dashboard");
        if (!response.ok) throw new Error("Dashboard API failed");
        state.payload = await response.json();
        state.students = state.payload.students;
        renderDashboard();
        showToast("Dashboard ready");
    } catch (error) {
        showToast("Unable to load dashboard data");
        console.error(error);
    } finally {
        setTimeout(() => elements.loading.classList.add("hidden"), 350);
    }
}

function renderDashboard() {
    renderStats();
    renderTable();
    renderSubjects();
    renderAnalytics();
    AnalyzerCharts.render(state.payload);
    AnalyzerAnimations.revealCards();
    if (window.lucide) lucide.createIcons();
}

function renderStats() {
    const overview = state.payload.overview;
    const stats = [
        ["Total Students", overview.totalStudents, "", "Generated class roster"],
        ["Total Subjects", overview.totalSubjects, "", "Core assessment areas"],
        ["Class Average", overview.classAverage, "", "Mean across all marks"],
        ["Highest Score", overview.highestScore, "", "Best student average"],
        ["Lowest Score", overview.lowestScore, "", "Lowest student average"],
        ["Pass Percentage", overview.passPercentage, "%", "Average above pass line"],
        ["Fail Percentage", overview.failPercentage, "%", "Needs intervention"],
    ];

    elements.statsGrid.innerHTML = stats.map(([label, value, suffix, caption]) => `
        <article class="stat-card">
            <span>${label}</span>
            <strong data-value="${value}" data-suffix="${suffix}">0${suffix}</strong>
            <small>${caption}</small>
        </article>
    `).join("");

    document.querySelectorAll(".stat-card strong").forEach((element) => {
        AnalyzerAnimations.animateNumber(element, element.dataset.value, element.dataset.suffix);
    });
    AnalyzerAnimations.animateNumber(elements.heroAverage, overview.classAverage);
    elements.sidebarHealth.textContent = `${overview.passPercentage}%`;
}

function filteredStudents() {
    const query = state.query;
    return state.students
        .filter((student) => {
            const searchable = `${student.name} ${student.rollNumber} ${student.grade} ${student.status}`.toLowerCase();
            const matchesQuery = !query || searchable.includes(query);
            const matchesStatus = state.status === "all" || student.status === state.status;
            const matchesGrade = state.grade === "all" || student.grade === state.grade;
            return matchesQuery && matchesStatus && matchesGrade;
        })
        .sort((a, b) => {
            const first = a[state.sortKey];
            const second = b[state.sortKey];
            const direction = state.sortDirection === "asc" ? 1 : -1;
            if (typeof first === "number") return (first - second) * direction;
            return String(first).localeCompare(String(second)) * direction;
        });
}

function renderTable() {
    const students = filteredStudents();
    const totalPages = Math.max(1, Math.ceil(students.length / state.pageSize));
    state.page = Math.min(state.page, totalPages);
    const start = (state.page - 1) * state.pageSize;
    const pageRows = students.slice(start, start + state.pageSize);

    elements.studentRows.innerHTML = pageRows.map((student) => `
        <tr>
            <td><strong>${student.name}</strong></td>
            <td>${student.rollNumber}</td>
            <td>
                <div class="marks">
                    ${Object.entries(student.marks).map(([subject, mark]) => `<span class="chip">${subject}: ${mark}</span>`).join("")}
                </div>
            </td>
            <td>${student.average}</td>
            <td><span class="chip">${student.grade}</span></td>
            <td><span class="status ${student.status.toLowerCase()}">${student.status}</span></td>
        </tr>
    `).join("");

    elements.emptyState.classList.toggle("show", pageRows.length === 0);
    elements.pageInfo.textContent = `Page ${state.page} of ${totalPages}`;
    elements.prevPage.disabled = state.page === 1;
    elements.nextPage.disabled = state.page === totalPages;
    if (window.lucide) lucide.createIcons();
}

function renderSubjects() {
    elements.subjectGrid.innerHTML = state.payload.subjectAnalysis.map((subject) => `
        <article class="subject-card">
            <span class="eyebrow">${subject.subject}</span>
            <strong>${subject.average}</strong>
            ${metric("Highest", subject.highest)}
            ${metric("Lowest", subject.lowest)}
            ${metric("Median", subject.median)}
            ${metric("Mode", subject.mode)}
            ${metric("Std Dev", subject.standardDeviation)}
            ${metric("Variance", subject.variance)}
        </article>
    `).join("");
}

function metric(label, value) {
    return `<div class="metric-row"><span>${label}</span><b>${value}</b></div>`;
}

function renderAnalytics() {
    elements.topStudents.innerHTML = state.payload.analytics.topStudents.map((student, index) => rankItem(index + 1, student)).join("");
    elements.bottomStudents.innerHTML = state.payload.analytics.bottomStudents.map((student, index) => rankItem(index + 1, student)).join("");
    elements.classInsights.innerHTML = state.payload.analytics.classInsights.map((insight) => `
        <div class="insight-item">
            <strong>${insight}</strong>
        </div>
    `).join("");
}

function rankItem(rank, student) {
    return `
        <div class="rank-item">
            <span>#${rank} ${student.name}</span>
            <strong>${student.average} / ${student.grade}</strong>
        </div>
    `;
}

function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add("show");
    clearTimeout(showToast.timeout);
    showToast.timeout = setTimeout(() => elements.toast.classList.remove("show"), 2400);
}
