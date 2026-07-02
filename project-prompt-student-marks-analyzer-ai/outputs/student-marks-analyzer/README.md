# Student Marks Analyzer

A premium Flask dashboard that generates and analyzes student marks with Python and NumPy, then presents the results through a custom responsive UI with Chart.js visualizations.

## Features

- NumPy-only backend analytics for mean, median, manual mode, standard deviation, variance, min, max, sum, boolean indexing, filtering, reshaping, and random dataset generation.
- Generated dataset of 100 students across Math, Science, English, Computer, and AI.
- Overview statistic cards, subject analysis, sortable/searchable/paginated student table, grade/status filters, and interactive charts.
- CSV export, simple PDF export, print report, toast notifications, theme toggle, loading screen, keyboard shortcut search, responsive sidebar, and custom 404 page.

## Run Locally

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Open `http://127.0.0.1:5000`.

Do not open `templates/index.html` directly in Chrome. This is a Flask template, so it must be opened through the Flask server URL above. You can also double-click `start_dashboard.bat` on Windows.

## Future Additions

The project is structured so Pandas, Matplotlib, Seaborn, Scikit-Learn, and CSV upload support can be added without disturbing the current Flask API or frontend modules.
