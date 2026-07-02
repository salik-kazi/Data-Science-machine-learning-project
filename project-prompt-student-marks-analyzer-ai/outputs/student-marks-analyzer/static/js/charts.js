const AnalyzerCharts = (() => {
    const chartRegistry = {};
    const palette = {
        blue: "#2f8cff",
        cyan: "#3de7ff",
        purple: "#a162ff",
        green: "#48e6a2",
        red: "#ff6b88",
        white: "rgba(248, 251, 255, 0.86)",
        grid: "rgba(255, 255, 255, 0.09)",
    };

    function baseOptions(extra = {}) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            resizeDelay: 120,
            animation: {
                duration: 450,
                easing: "easeOutQuart",
            },
            plugins: {
                legend: {
                    labels: {
                        color: palette.white,
                        usePointStyle: true,
                    },
                },
                tooltip: {
                    backgroundColor: "rgba(7, 10, 22, 0.92)",
                    borderColor: "rgba(255,255,255,0.16)",
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 12,
                },
            },
            scales: extra.scales ?? {
                x: {
                    grid: { color: "transparent" },
                    ticks: { color: palette.white },
                },
                y: {
                    beginAtZero: true,
                    grid: { color: palette.grid },
                    ticks: { color: palette.white },
                },
            },
            ...extra,
        };
    }

    function gradient(ctx, colorA, colorB) {
        const chart = ctx.chart;
        const { chartArea } = chart;
        if (!chartArea) return colorA;
        const fill = chart.ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        fill.addColorStop(0, colorA);
        fill.addColorStop(1, colorB);
        return fill;
    }

    function createChart(id, config) {
        const canvas = document.getElementById(id);
        if (!canvas) return;
        if (chartRegistry[id]) chartRegistry[id].destroy();
        chartRegistry[id] = new Chart(canvas, config);
    }

    function render(payload) {
        const subjects = payload.subjects;
        const charts = payload.charts;
        const gradeLabels = Object.keys(charts.gradeDistribution);
        const gradeValues = Object.values(charts.gradeDistribution);
        const passCount = payload.analytics.passList.length;
        const failCount = payload.analytics.failList.length;

        createChart("barChart", {
            type: "bar",
            data: {
                labels: subjects,
                datasets: [{
                    label: "Average marks",
                    data: charts.subjectAverages,
                    borderWidth: 1,
                    borderRadius: 12,
                    backgroundColor: (ctx) => gradient(ctx, "rgba(61,231,255,0.9)", "rgba(161,98,255,0.5)"),
                    borderColor: "rgba(255,255,255,0.18)",
                }],
            },
            options: baseOptions(),
        });

        createChart("lineChart", {
            type: "line",
            data: {
                labels: charts.trend.map((_, index) => `W${index + 1}`),
                datasets: [{
                    label: "Rolling class trend",
                    data: charts.trend,
                    tension: 0.42,
                    fill: true,
                    borderColor: palette.cyan,
                    pointRadius: 3,
                    backgroundColor: "rgba(47, 140, 255, 0.13)",
                }],
            },
            options: baseOptions(),
        });

        createChart("doughnutChart", {
            type: "doughnut",
            data: {
                labels: gradeLabels,
                datasets: [{
                    data: gradeValues,
                    backgroundColor: [palette.cyan, palette.blue, palette.purple, palette.green, "#f5c15d", palette.red],
                    borderColor: "rgba(7, 10, 22, 0.76)",
                    borderWidth: 4,
                }],
            },
            options: baseOptions({ cutout: "68%", scales: {} }),
        });

        createChart("pieChart", {
            type: "pie",
            data: {
                labels: ["Pass", "Fail"],
                datasets: [{
                    data: [passCount, failCount],
                    backgroundColor: [palette.green, palette.red],
                    borderColor: "rgba(7, 10, 22, 0.76)",
                    borderWidth: 4,
                }],
            },
            options: baseOptions({ scales: {} }),
        });

        createChart("radarChart", {
            type: "radar",
            data: {
                labels: subjects,
                datasets: [
                    {
                        label: "Highest",
                        data: charts.subjectHighest,
                        borderColor: palette.cyan,
                        backgroundColor: "rgba(61, 231, 255, 0.14)",
                    },
                    {
                        label: "Average",
                        data: charts.subjectAverages,
                        borderColor: palette.purple,
                        backgroundColor: "rgba(161, 98, 255, 0.16)",
                    },
                    {
                        label: "Lowest",
                        data: charts.subjectLowest,
                        borderColor: palette.red,
                        backgroundColor: "rgba(255, 107, 136, 0.12)",
                    },
                ],
            },
            options: baseOptions({
                scales: {
                    r: {
                        angleLines: { color: palette.grid },
                        grid: { color: palette.grid },
                        pointLabels: { color: palette.white },
                        ticks: { color: palette.white, backdropColor: "transparent" },
                    },
                },
            }),
        });

        createChart("histogramChart", {
            type: "bar",
            data: {
                labels: charts.histogram.map((item) => item.range),
                datasets: [{
                    label: "Students",
                    data: charts.histogram.map((item) => item.count),
                    borderRadius: 10,
                    backgroundColor: (ctx) => gradient(ctx, "rgba(47,140,255,0.86)", "rgba(72,230,162,0.42)"),
                }],
            },
            options: baseOptions(),
        });
    }

    return { render };
})();
