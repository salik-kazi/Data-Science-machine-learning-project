from __future__ import annotations

import csv
import io
import math
from dataclasses import dataclass
from typing import Any

import numpy as np
from flask import Flask, Response, jsonify, render_template


app = Flask(__name__)

SUBJECTS = ["Math", "Science", "English", "Computer", "AI"]
PASS_MARK = 40
STUDENT_COUNT = 100
RANDOM_SEED = 20260702


@dataclass(frozen=True)
class StudentRecord:
    name: str
    roll_number: str
    marks: dict[str, int]
    average: float
    grade: str
    status: str


def assign_grade(average: float) -> str:
    if average >= 90:
        return "A+"
    if average >= 80:
        return "A"
    if average >= 70:
        return "B"
    if average >= 60:
        return "C"
    if average >= 40:
        return "Pass"
    return "Fail"


def generate_student_names(count: int) -> list[str]:
    first_names = np.array(
        [
            "Aarav", "Aanya", "Vihaan", "Diya", "Kabir", "Ira", "Reyansh", "Meera",
            "Arjun", "Saanvi", "Vivaan", "Anika", "Advik", "Tara", "Ishaan", "Kiara",
            "Rohan", "Nisha", "Dev", "Avni", "Neil", "Riya", "Yash", "Maya",
            "Kunal", "Anaya", "Samar", "Zara", "Ayaan", "Myra",
        ]
    )
    last_names = np.array(
        [
            "Sharma", "Patel", "Rao", "Mehta", "Iyer", "Kapoor", "Nair", "Khan",
            "Verma", "Das", "Joshi", "Reddy", "Malhotra", "Singh", "Bose",
        ]
    )
    names: list[str] = []
    for index in range(count):
        names.append(f"{first_names[index % len(first_names)]} {last_names[(index * 7) % len(last_names)]}")
    return names


def generate_marks_dataset(count: int = STUDENT_COUNT) -> tuple[list[StudentRecord], np.ndarray]:
    rng = np.random.default_rng(RANDOM_SEED)
    base_scores = rng.normal(loc=72, scale=15, size=(count, len(SUBJECTS)))
    aptitude_boost = rng.normal(loc=0, scale=6, size=(count, 1))
    subject_curve = np.array([2, 0, -1, 4, 6]).reshape(1, len(SUBJECTS))
    marks_matrix = np.clip(base_scores + aptitude_boost + subject_curve, 18, 100).round().astype(int)

    # Boolean indexing creates a realistic spread of struggling and standout students.
    struggling_mask = rng.random(count) < 0.12
    marks_matrix[struggling_mask] = np.clip(marks_matrix[struggling_mask] - rng.integers(12, 25), 10, 100)
    honors_mask = rng.random(count) < 0.10
    marks_matrix[honors_mask] = np.clip(marks_matrix[honors_mask] + rng.integers(8, 16), 10, 100)

    names = generate_student_names(count)
    averages = np.mean(marks_matrix, axis=1)

    records = []
    for index, row in enumerate(marks_matrix):
        average = round(float(averages[index]), 2)
        grade = assign_grade(average)
        records.append(
            StudentRecord(
                name=names[index],
                roll_number=f"SMA-{index + 1:03d}",
                marks={subject: int(row[subject_index]) for subject_index, subject in enumerate(SUBJECTS)},
                average=average,
                grade=grade,
                status="Pass" if average >= PASS_MARK else "Fail",
            )
        )
    return records, marks_matrix


def calculate_mode(values: np.ndarray) -> int:
    unique_values, counts = np.unique(values.astype(int), return_counts=True)
    return int(unique_values[np.argmax(counts)])


def summarize_subjects(marks_matrix: np.ndarray) -> list[dict[str, Any]]:
    subject_summaries = []
    for index, subject in enumerate(SUBJECTS):
        scores = marks_matrix[:, index]
        subject_summaries.append(
            {
                "subject": subject,
                "highest": int(np.max(scores)),
                "lowest": int(np.min(scores)),
                "average": round(float(np.mean(scores)), 2),
                "median": round(float(np.median(scores)), 2),
                "mode": calculate_mode(scores),
                "standardDeviation": round(float(np.std(scores)), 2),
                "variance": round(float(np.var(scores)), 2),
                "sum": int(np.sum(scores)),
            }
        )
    return subject_summaries


def grade_distribution(records: list[StudentRecord]) -> dict[str, int]:
    grades = ["A+", "A", "B", "C", "Pass", "Fail"]
    return {grade: sum(1 for record in records if record.grade == grade) for grade in grades}


def build_histogram(averages: np.ndarray) -> list[dict[str, Any]]:
    bins = np.array([0, 40, 50, 60, 70, 80, 90, 101])
    labels = ["0-39", "40-49", "50-59", "60-69", "70-79", "80-89", "90-100"]
    counts, _ = np.histogram(averages, bins=bins)
    return [{"range": label, "count": int(count)} for label, count in zip(labels, counts)]


def create_dashboard_payload() -> dict[str, Any]:
    records, marks_matrix = generate_marks_dataset()
    averages = np.mean(marks_matrix, axis=1)
    pass_mask = averages >= PASS_MARK
    fail_mask = ~pass_mask
    sorted_records = sorted(records, key=lambda record: record.average, reverse=True)
    reshaped_preview = marks_matrix.reshape(STUDENT_COUNT, len(SUBJECTS), 1)[:5].tolist()

    class_average = float(np.mean(averages))
    total_students = len(records)
    pass_count = int(np.sum(pass_mask))
    fail_count = int(np.sum(fail_mask))

    return {
        "subjects": SUBJECTS,
        "students": [
            {
                "name": record.name,
                "rollNumber": record.roll_number,
                "marks": record.marks,
                "average": record.average,
                "grade": record.grade,
                "status": record.status,
            }
            for record in records
        ],
        "overview": {
            "totalStudents": total_students,
            "totalSubjects": len(SUBJECTS),
            "classAverage": round(class_average, 2),
            "highestScore": round(float(np.max(averages)), 2),
            "lowestScore": round(float(np.min(averages)), 2),
            "passPercentage": round((pass_count / total_students) * 100, 2),
            "failPercentage": round((fail_count / total_students) * 100, 2),
        },
        "subjectAnalysis": summarize_subjects(marks_matrix),
        "analytics": {
            "topStudents": [
                {"name": record.name, "rollNumber": record.roll_number, "average": record.average, "grade": record.grade}
                for record in sorted_records[:5]
            ],
            "bottomStudents": [
                {"name": record.name, "rollNumber": record.roll_number, "average": record.average, "grade": record.grade}
                for record in sorted_records[-5:]
            ],
            "passList": [record.roll_number for record in records if record.status == "Pass"],
            "failList": [record.roll_number for record in records if record.status == "Fail"],
            "gradeDistribution": grade_distribution(records),
            "classInsights": build_class_insights(records, marks_matrix),
            "performanceRanking": [
                {"rank": rank + 1, "name": record.name, "average": record.average}
                for rank, record in enumerate(sorted_records[:10])
            ],
            "reshapedPreview": reshaped_preview,
        },
        "charts": {
            "subjectAverages": [round(float(value), 2) for value in np.mean(marks_matrix, axis=0)],
            "subjectHighest": [int(value) for value in np.max(marks_matrix, axis=0)],
            "subjectLowest": [int(value) for value in np.min(marks_matrix, axis=0)],
            "gradeDistribution": grade_distribution(records),
            "histogram": build_histogram(averages),
            "trend": [round(float(value), 2) for value in np.convolve(averages, np.ones(8) / 8, mode="valid")[:24]],
        },
    }


def build_class_insights(records: list[StudentRecord], marks_matrix: np.ndarray) -> list[str]:
    subject_averages = np.mean(marks_matrix, axis=0)
    strongest_subject = SUBJECTS[int(np.argmax(subject_averages))]
    improvement_subject = SUBJECTS[int(np.argmin(subject_averages))]
    class_average = float(np.mean(np.mean(marks_matrix, axis=1)))
    fail_count = sum(1 for record in records if record.status == "Fail")
    excellence_count = sum(1 for record in records if record.grade in {"A", "A+"})

    return [
        f"{strongest_subject} is the strongest subject with an average of {np.max(subject_averages):.2f}.",
        f"{improvement_subject} needs the most attention with an average of {np.min(subject_averages):.2f}.",
        f"{excellence_count} students are currently in the A or A+ band.",
        f"{fail_count} students need targeted intervention plans.",
        f"The class average is {class_average:.2f}, indicating a {class_average - PASS_MARK:.2f} point buffer above the pass line.",
    ]


def rows_for_csv() -> list[dict[str, Any]]:
    payload = create_dashboard_payload()
    return payload["students"]


@app.route("/")
def index() -> str:
    return render_template("index.html")


@app.route("/api/dashboard")
def dashboard_api() -> Response:
    return jsonify(create_dashboard_payload())


@app.route("/download/csv")
def download_csv() -> Response:
    output = io.StringIO()
    fieldnames = ["Student Name", "Roll Number", *SUBJECTS, "Average", "Grade", "Status"]
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    for student in rows_for_csv():
        writer.writerow(
            {
                "Student Name": student["name"],
                "Roll Number": student["rollNumber"],
                **student["marks"],
                "Average": student["average"],
                "Grade": student["grade"],
                "Status": student["status"],
            }
        )
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=student-marks-report.csv"},
    )


@app.route("/download/pdf")
def download_pdf() -> Response:
    payload = create_dashboard_payload()
    lines = [
        "Student Marks Analyzer Report",
        f"Total Students: {payload['overview']['totalStudents']}",
        f"Total Subjects: {payload['overview']['totalSubjects']}",
        f"Class Average: {payload['overview']['classAverage']}",
        f"Pass Percentage: {payload['overview']['passPercentage']}%",
        f"Fail Percentage: {payload['overview']['failPercentage']}%",
        "",
        "Top Students:",
        *[
            f"{student['name']} ({student['rollNumber']}) - {student['average']} / {student['grade']}"
            for student in payload["analytics"]["topStudents"]
        ],
    ]
    pdf_bytes = create_simple_pdf(lines)
    return Response(
        pdf_bytes,
        mimetype="application/pdf",
        headers={"Content-Disposition": "attachment; filename=student-marks-report.pdf"},
    )


def create_simple_pdf(lines: list[str]) -> bytes:
    escaped_lines = [line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)") for line in lines]
    text_stream = ["BT", "/F1 16 Tf", "72 760 Td"]
    for index, line in enumerate(escaped_lines):
        prefix = "" if index == 0 else "0 -24 Td"
        text_stream.append(f"{prefix} ({line}) Tj")
    text_stream.append("ET")
    stream = "\n".join(text_stream).encode("latin-1", errors="replace")
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream",
    ]
    pdf = io.BytesIO()
    pdf.write(b"%PDF-1.4\n")
    offsets = []
    for number, obj in enumerate(objects, start=1):
        offsets.append(pdf.tell())
        pdf.write(f"{number} 0 obj\n".encode())
        pdf.write(obj)
        pdf.write(b"\nendobj\n")
    xref_position = pdf.tell()
    pdf.write(f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode())
    for offset in offsets:
        pdf.write(f"{offset:010d} 00000 n \n".encode())
    pdf.write(
        f"trailer << /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_position}\n%%EOF".encode()
    )
    return pdf.getvalue()


@app.errorhandler(404)
def not_found(_: Exception) -> tuple[str, int]:
    return render_template("404.html"), 404


if __name__ == "__main__":
    app.run(debug=True)
