import os
import json
from datetime import datetime
from flask import Flask, render_template, request, jsonify
import joblib
import pandas as pd

app = Flask(__name__)

model = joblib.load("burnout_model5.pkl")
scaler = joblib.load("scaler5.pkl")

model_columns = ['Age', 'Experience', 'WorkHoursPerWeek', 'RemoteRatio',
                 'SatisfactionLevel', 'StressLevel', 'Gender_Male',
                 'JobRole_Engineer', 'JobRole_HR', 'JobRole_Manager', 'JobRole_Sales']

# ──────────────────────────────────────────────
#  INDUSTRY BENCHMARKS (simulated averages)
# ──────────────────────────────────────────────
INDUSTRY_BENCHMARKS = {
    "Engineer": {"avg_score": 42, "avg_stress": 6.2, "avg_hours": 47, "sample_size": 12400},
    "Analyst": {"avg_score": 38, "avg_stress": 5.8, "avg_hours": 44, "sample_size": 8700},
    "HR": {"avg_score": 35, "avg_stress": 5.3, "avg_hours": 42, "sample_size": 6200},
    "Manager": {"avg_score": 52, "avg_stress": 7.1, "avg_hours": 51, "sample_size": 9800},
    "Sales": {"avg_score": 48, "avg_stress": 6.8, "avg_hours": 49, "sample_size": 11300},
}
GLOBAL_AVG = {"avg_score": 43, "avg_stress": 6.2, "avg_hours": 46.5, "sample_size": 48400}


def get_industry_comparison(job_role, probability, stress, work_hours):
    """Compare user's metrics against their role's benchmark."""
    bench = INDUSTRY_BENCHMARKS.get(job_role, GLOBAL_AVG)
    score_diff = round(probability - bench["avg_score"], 1)
    stress_diff = round(stress - bench["avg_stress"], 1)
    hours_diff = round(work_hours - bench["avg_hours"], 1)
    return {
        "role": job_role,
        "role_avg_score": bench["avg_score"],
        "global_avg_score": GLOBAL_AVG["avg_score"],
        "sample_size": bench["sample_size"],
        "score_diff": score_diff,
        "score_better": score_diff < 0,
        "stress_diff": stress_diff,
        "hours_diff": hours_diff,
        "user_score": round(probability, 1),
        "user_stress": stress,
        "user_hours": work_hours
    }


# ──────────────────────────────────────────────
#  RISK FACTOR BREAKDOWN
# ──────────────────────────────────────────────
def get_factor_breakdown(stress, work_hours, satisfaction, remote_ratio):
    """Compute individual contribution of each factor to burnout risk."""
    factors = []

    # Stress contribution (max ~35%)
    if stress >= 8:
        s = 95
    elif stress >= 6:
        s = 70
    elif stress >= 4:
        s = 45
    else:
        s = max(10, stress * 10)
    factors.append({"name": "Stress Level", "value": s, "raw": stress, "max": 10,
                    "icon": "😰", "tip": "High stress is the #1 burnout driver."})

    # Work hours contribution (max ~30%)
    if work_hours >= 60:
        w = 95
    elif work_hours >= 50:
        w = 70
    elif work_hours >= 45:
        w = 50
    else:
        w = max(10, min(40, (work_hours - 20) * 2))
    factors.append({"name": "Work Hours", "value": w, "raw": work_hours, "max": 80,
                    "icon": "⏰", "tip": "Overwork erodes recovery capacity."})

    # Satisfaction (inverse - low = bad, max ~20%)
    sat_score = max(5, 100 - (satisfaction * 20))
    factors.append({"name": "Low Satisfaction", "value": round(sat_score), "raw": satisfaction, "max": 5,
                    "icon": "😞", "tip": "Dissatisfaction fuels emotional exhaustion."})

    # Remote ratio (inverse - less remote = worse)
    if remote_ratio < 20:
        r = 70
    elif remote_ratio < 40:
        r = 45
    elif remote_ratio < 60:
        r = 25
    else:
        r = 10
    factors.append({"name": "Office Overload", "value": r, "raw": remote_ratio, "max": 100,
                    "icon": "🏢", "tip": "Commuting and lack of flexibility add strain."})

    return factors


# ──────────────────────────────────────────────
#  RECOMMENDATIONS ENGINE
# ──────────────────────────────────────────────
def get_recommendations(probability, stress, work_hours, satisfaction, remote_ratio):
    """Return personalized recommendations based on risk factors."""
    recs = []

    if stress >= 7:
        recs.append({"icon": "🧘", "text": "Your stress level is very high. Try daily mindfulness or meditation - even 10 minutes can reduce cortisol levels significantly."})
    elif stress >= 5:
        recs.append({"icon": "🌿", "text": "Moderate stress detected. Consider short breathing exercises or walks during breaks to manage tension."})

    if work_hours >= 55:
        recs.append({"icon": "⏰", "text": "You're working excessive hours. Set firm boundaries - try to keep your week under 45 hours and protect your weekends."})
    elif work_hours >= 45:
        recs.append({"icon": "📅", "text": "Your work hours are above average. Plan your tasks with time-blocking to improve efficiency and avoid overtime."})

    if satisfaction <= 2.0:
        recs.append({"icon": "💬", "text": "Low job satisfaction is a key burnout driver. Have an honest conversation with your manager about your role and growth opportunities."})
    elif satisfaction <= 3.0:
        recs.append({"icon": "🎯", "text": "Your satisfaction could improve. Identify what motivates you most and seek projects aligned with those interests."})

    if remote_ratio < 20:
        recs.append({"icon": "🏠", "text": "Consider negotiating more remote work days. Hybrid work can reduce commute stress and improve work-life balance."})

    if probability >= 50:
        recs.append({"icon": "🩺", "text": "Your burnout risk is significant. Consider speaking with a mental health professional for personalized support."})

    if probability < 20:
        recs.append({"icon": "✨", "text": "Great news - your burnout risk is low! Keep maintaining your healthy work habits and personal boundaries."})
    else:
        recs.append({"icon": "💪", "text": "Physical exercise 3-4 times a week is one of the most effective ways to combat burnout and boost resilience."})

    return recs


# ──────────────────────────────────────────────
#  30-DAY ACTION PLAN
# ──────────────────────────────────────────────
def get_action_plan(probability, stress, work_hours, satisfaction, remote_ratio):
    """Generate a 4-week progressive wellness plan."""
    plan = []

    # Week 1 - Awareness
    w1_tasks = []
    w1_tasks.append("Track your daily energy levels in a journal (morning, midday, evening)")
    if stress >= 6:
        w1_tasks.append("Start a 5-minute breathing exercise every morning before work")
    if work_hours >= 50:
        w1_tasks.append("Log your actual working hours every day - no estimating")
    w1_tasks.append("Identify your top 3 workplace frustrations and write them down")
    plan.append({"week": 1, "title": "Awareness & Baseline", "icon": "🔍", "tasks": w1_tasks})

    # Week 2 - Small Changes
    w2_tasks = []
    if stress >= 5:
        w2_tasks.append("Add a 10-minute guided meditation to your daily routine")
    if work_hours >= 45:
        w2_tasks.append("Set a hard stop time and leave work on time at least 3 days this week")
    w2_tasks.append("Take a proper lunch break away from your desk every day")
    if satisfaction <= 3:
        w2_tasks.append("Schedule a 1-on-1 with your manager to discuss workload and satisfaction")
    w2_tasks.append("Exercise at least 3 times this week - even a 20-min walk counts")
    plan.append({"week": 2, "title": "Small Changes", "icon": "🌱", "tasks": w2_tasks})

    # Week 3 - Building Habits
    w3_tasks = []
    w3_tasks.append("Practice time-blocking: plan tomorrow's top 3 tasks every evening")
    if stress >= 6:
        w3_tasks.append("Try a digital detox: no screens for 1 hour before bed")
    if remote_ratio < 30:
        w3_tasks.append("Propose 1-2 days of remote work to your team lead")
    w3_tasks.append("Reconnect with a hobby or activity you've been neglecting")
    w3_tasks.append("Say 'no' to at least one non-essential request this week")
    plan.append({"week": 3, "title": "Building Habits", "icon": "🔧", "tasks": w3_tasks})

    # Week 4 - Sustain & Evaluate
    w4_tasks = []
    w4_tasks.append("Re-take the burnout assessment and compare your score to Week 1")
    w4_tasks.append("Review your energy journal: identify patterns and peak/low times")
    if probability >= 50:
        w4_tasks.append("If score hasn't improved, book a consultation with a health professional")
    w4_tasks.append("Create a personal wellness plan for the next 3 months")
    w4_tasks.append("Celebrate every small improvement - progress matters more than perfection")
    plan.append({"week": 4, "title": "Sustain & Evaluate", "icon": "🏆", "tasks": w4_tasks})

    return plan


# ──────────────────────────────────────────────
#  ROUTES
# ──────────────────────────────────────────────
@app.route("/")
def home():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():
    try:
        age = int(request.form["age"])
        experience = int(request.form["experience"])
        work_hours = int(request.form["work_hours"])
        remote_ratio = int(request.form["remote_ratio"])
        satisfaction = float(request.form["satisfaction"])
        stress = int(request.form["stress"])
        gender = request.form["gender"]
        job_role = request.form["job_role"]

        df = pd.DataFrame([{
            "Age": age,
            "Experience": experience,
            "WorkHoursPerWeek": work_hours,
            "RemoteRatio": remote_ratio,
            "SatisfactionLevel": satisfaction,
            "StressLevel": stress,
            "Gender": gender,
            "JobRole": job_role
        }])

        df = pd.get_dummies(df, columns=["Gender", "JobRole"], drop_first=True)
        df = df.reindex(columns=model_columns, fill_value=0)

        features_scaled = scaler.transform(df)
        probability = model.predict_proba(features_scaled)[0][1] * 100

        # Determine result category
        if probability < 20:
            result = "✅ Low Burnout Risk"
            result_class = "result-low"
            result_description = "Your work-life balance appears healthy. Keep up the good practices!"
        elif probability < 45:
            result = "⚠️ Moderate Burnout Risk"
            result_class = "result-moderate"
            result_description = "Some warning signs detected. Consider adjusting your work habits."
        elif probability < 70:
            result = "🔴 High Burnout Risk"
            result_class = "result-high"
            result_description = "Significant risk factors identified. Action is recommended to prevent burnout."
        else:
            result = "🚨 Critical Burnout Risk"
            result_class = "result-critical"
            result_description = "Urgent attention needed. Please prioritize your mental health and seek support."

        recommendations = get_recommendations(probability, stress, work_hours, satisfaction, remote_ratio)
        factor_breakdown = get_factor_breakdown(stress, work_hours, satisfaction, remote_ratio)
        action_plan = get_action_plan(probability, stress, work_hours, satisfaction, remote_ratio)
        industry_comparison = get_industry_comparison(job_role, probability, stress, work_hours)

        return render_template("index.html",
                               result=result,
                               probability=round(probability, 1),
                               result_class=result_class,
                               result_description=result_description,
                               recommendations=recommendations,
                               factor_breakdown=factor_breakdown,
                               action_plan=action_plan,
                               industry=industry_comparison,
                               # Pass raw values for charts
                               stress_val=stress,
                               hours_val=work_hours,
                               satisfaction_val=satisfaction,
                               remote_val=remote_ratio,
                               job_role_val=job_role)

    except Exception as e:
        return render_template("index.html",
                               result="❌ Error",
                               probability=0,
                               result_class="result-low",
                               result_description=f"An error occurred: {str(e)}. Please check your inputs.",
                               recommendations=[],
                               factor_breakdown=[],
                               action_plan=[])


# ──────────────────────────────────────────────
#  MOOD TRACKER API
# ──────────────────────────────────────────────
MOOD_FILE = os.path.join(os.path.dirname(__file__), "mood_data.json")


@app.route("/api/mood", methods=["GET", "POST"])
def mood_api():
    if request.method == "POST":
        data = request.get_json()
        moods = []
        if os.path.exists(MOOD_FILE):
            with open(MOOD_FILE, "r") as f:
                moods = json.load(f)
        moods.append({
            "date": datetime.now().strftime("%Y-%m-%d"),
            "mood": data.get("mood", 3),
            "emoji": data.get("emoji", "😐"),
            "note": data.get("note", "")
        })
        # Keep last 90 days
        moods = moods[-90:]
        with open(MOOD_FILE, "w") as f:
            json.dump(moods, f)
        return jsonify({"success": True})
    else:
        moods = []
        if os.path.exists(MOOD_FILE):
            with open(MOOD_FILE, "r") as f:
                moods = json.load(f)
        return jsonify(moods)


if __name__ == "__main__":
<<<<<<< HEAD
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
=======
    app.run()
>>>>>>> 48b13cd1b9c54d6a82c778b3139bca2386409c78
