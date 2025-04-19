const db = new Dexie("WorkoutDB");
db.version(1).stores({
    workouts: 'date,pushups,situps,squats'
});

const startDate = new Date('2025-04-17');
const today = new Date().toISOString().split('T')[0];

let historyChart;

async function loadToday() {
    const workout = await db.workouts.get(today);
    const totals = workout || { pushups: 0, situps: 0, squats: 0 };
    document.getElementById('pushup-progress').style.width = `${Math.min(totals.pushups, 100)}%`;
    document.getElementById('situp-progress').style.width = `${Math.min(totals.situps, 100)}%`;
    document.getElementById('squat-progress').style.width = `${Math.min(totals.squats, 100)}%`;
    document.getElementById('pushups').value = '';
    document.getElementById('situps').value = '';
    document.getElementById('squats').value = '';
    document.getElementById('current-totals').textContent = `Pushups: ${totals.pushups}/100, Situps: ${totals.situps}/100, Squats: ${totals.squats}/100`;
}

async function loadHistoryGraph() {
    const workouts = await db.workouts.orderBy('date').toArray();
    const labels = workouts.map(w => w.date);
    const pushups = workouts.map(w => w.pushups);
    const situps = workouts.map(w => w.situps);
    const squats = workouts.map(w => w.squats);

    if (historyChart) historyChart.destroy();
    const ctx = document.getElementById('history-chart').getContext('2d');
    historyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Pushups',
                    data: pushups,
                    borderColor: '#4caf50',
                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                    fill: false,
                    tension: 0.3
                },
                {
                    label: 'Situps',
                    data: situps,
                    borderColor: '#2196f3',
                    backgroundColor: 'rgba(33, 150, 243, 0.2)',
                    fill: false,
                    tension: 0.3
                },
                {
                    label: 'Squats',
                    data: squats,
                    borderColor: '#f44336',
                    backgroundColor: 'rgba(244, 67, 54, 0.2)',
                    fill: false,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { title: { display: true, text: 'Date', color: '#ffffff' }, ticks: { color: '#ffffff' } },
                y: { title: { display: true, text: 'Reps', color: '#ffffff' }, ticks: { color: '#ffffff' }, min: 0, max: 100 }
            },
            plugins: {
                legend: { labels: { color: '#ffffff' } }
            }
        }
    });
}

async function updateStats() {
    const workouts = await db.workouts.toArray();
    const daysCompleted = Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24));
    const fullyCompleted = workouts.filter(w => w.pushups >= 100 && w.situps >= 100 && w.squats >= 100).length;
    let streak = 0;
    let current = new Date();
    const dates = workouts.map(w => w.date);
    while (dates.includes(current.toISOString().split('T')[0])) {
        streak++;
        current.setDate(current.getDate() - 1);
    }
    const totalDays = workouts.length;
    const completedPushups = workouts.filter(w => w.pushups >= 100).length;
    const completedSitups = workouts.filter(w => w.situps >= 100).length;
    const completedSquats = workouts.filter(w => w.squats >= 100).length;
    const pushupRate = totalDays > 0 ? Math.round((completedPushups / totalDays) * 100) : 0;
    const situpRate = totalDays > 0 ? Math.round((completedSitups / totalDays) * 100) : 0;
    const squatRate = totalDays > 0 ? Math.round((completedSquats / totalDays) * 100) : 0;
    const avgRate = totalDays > 0 ? Math.round((pushupRate + situpRate + squatRate) / 3) : 0;
    document.getElementById('days-completed').textContent = `Days Completed: ${daysCompleted}`;
    document.getElementById('fully-completed').textContent = `Fully Completed Days: ${fullyCompleted}`;
    document.getElementById('streak').textContent = `Streak: ${streak} days`;
    document.getElementById('completion').textContent = `Stats: Pushups ${pushupRate}%, Situps ${situpRate}%, Squats ${squatRate}%, Avg ${avgRate}%`;
}

document.getElementById('log-workout').addEventListener('click', async () => {
    const pushupsAdd = parseInt(document.getElementById('pushups').value) || 0;
    const situpsAdd = parseInt(document.getElementById('situps').value) || 0;
    const squatsAdd = parseInt(document.getElementById('squats').value) || 0;
    const status = document.getElementById('status');

    const current = await db.workouts.get(today) || { pushups: 0, situps: 0, squats: 0 };
    const newPushups = Math.min(current.pushups + pushupsAdd, 100);
    const newSitups = Math.min(current.situps + situpsAdd, 100);
    const newSquats = Math.min(current.squats + squatsAdd, 100);

    if (pushupsAdd < 0 || situpsAdd < 0 || squatsAdd < 0) {
        status.textContent = 'Reps must be positive';
        return;
    }
    if (newPushups > 100 || newSitups > 100 || newSquats > 100) {
        status.textContent = 'Total reps cannot exceed 100';
        return;
    }

    try {
        await db.workouts.put({ date: today, pushups: newPushups, situps: newSitups, squats: newSquats });
        status.textContent = 'Reps added!';
        document.getElementById('pushup-progress').style.width = `${newPushups}%`;
        document.getElementById('situp-progress').style.width = `${newSitups}%`;
        document.getElementById('squat-progress').style.width = `${newSquats}%`;
        document.getElementById('current-totals').textContent = `Pushups: ${newPushups}/100, Situps: ${newSitups}/100, Squats: ${newSquats}/100`;
        document.getElementById('pushups').value = '';
        document.getElementById('situps').value = '';
        document.getElementById('squats').value = '';
        await loadHistoryGraph();
        await updateStats();
    } catch (e) {
        status.textContent = 'Error adding reps';
    }
});

document.getElementById('edit-date').addEventListener('change', async () => {
    const date = document.getElementById('edit-date').value;
    const workout = await db.workouts.get(date) || { pushups: 0, situps: 0, squats: 0 };
    document.getElementById('edit-pushups').value = workout.pushups;
    document.getElementById('edit-situps').value = workout.situps;
    document.getElementById('edit-squats').value = workout.squats;
});

document.getElementById('update-record').addEventListener('click', async () => {
    const date = document.getElementById('edit-date').value;
    const pushups = parseInt(document.getElementById('edit-pushups').value) || 0;
    const situps = parseInt(document.getElementById('edit-situps').value) || 0;
    const squats = parseInt(document.getElementById('edit-squats').value) || 0;
    const status = document.getElementById('edit-status');

    if (!date) {
        status.textContent = 'Please select a date';
        return;
    }
    if (pushups < 0 || situps < 0 || squats < 0 || pushups > 100 || situps > 100 || squats > 100) {
        status.textContent = 'Reps must be 0–100';
        return;
    }

    try {
        await db.workouts.put({ date, pushups, situps, squats });
        status.textContent = 'Record updated!';
        if (date === today) await loadToday();
        await loadHistoryGraph();
        await updateStats();
        document.getElementById('edit-pushups').value = '';
        document.getElementById('edit-situps').value = '';
        document.getElementById('edit-squats').value = '';
        document.getElementById('edit-date').value = '';
    } catch (e) {
        status.textContent = 'Error updating record';
    }
});

window.onload = async () => {
    await loadToday();
    await loadHistoryGraph();
    await updateStats();
    M.AutoInit();
};