const db = new Dexie("WorkoutDB");
db.version(1).stores({
    workouts: 'date,pushups,situps,squats,steps'
});

const startDate = new Date('2025-04-17');
const today = new Date().toISOString().split('T')[0];

async function loadToday() {
    const workout = await db.workouts.get(today);
    if (workout) {
        document.getElementById('pushup-progress').style.width = `${Math.min(workout.pushups, 100)}%`;
        document.getElementById('situp-progress').style.width = `${Math.min(workout.situps, 100)}%`;
        document.getElementById('squat-progress').style.width = `${Math.min(workout.squats, 100)}%`;
        document.getElementById('pushups').value = workout.pushups;
        document.getElementById('situps').value = workout.situps;
        document.getElementById('squats').value = workout.squats;
        document.getElementById('steps').value = workout.steps;
    }
}

async function loadLogs() {
    const logs = await db.workouts.orderBy('date').reverse().toArray();
    const logList = document.getElementById('logs');
    logList.innerHTML = '';
    logs.forEach(log => {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.textContent = `${log.date}: Pushups: ${log.pushups}, Situps: ${log.situps}, Squats: ${log.squats}, Steps: ${log.steps}`;
        logList.appendChild(li);
    });
}

async function updateStats() {
    const workouts = await db.workouts.toArray();
    const daysCompleted = Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24));
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
    document.getElementById('streak').textContent = `Streak: ${streak} days`;
    document.getElementById('completion').textContent = `Stats: Pushups ${pushupRate}%, Situps ${situpRate}%, Squats ${squatRate}%, Avg ${avgRate}%`;
}

document.getElementById('log-workout').addEventListener('click', async () => {
    const pushups = parseInt(document.getElementById('pushups').value) || 0;
    const situps = parseInt(document.getElementById('situps').value) || 0;
    const squats = parseInt(document.getElementById('squats').value) || 0;
    const steps = parseInt(document.getElementById('steps').value) || 0;
    const status = document.getElementById('status');
    if (pushups > 100 || situps > 100 || squats > 100 || pushups < 0 || situps < 0 || squats < 0 || steps < 0) {
        status.textContent = 'Reps must be 0–100, steps must be positive';
        return;
    }
    try {
        await db.workouts.put({ date: today, pushups, situps, squats, steps });
        status.textContent = 'Workout logged!';
        document.getElementById('pushup-progress').style.width = `${Math.min(pushups, 100)}%`;
        document.getElementById('situp-progress').style.width = `${Math.min(situps, 100)}%`;
        document.getElementById('squat-progress').style.width = `${Math.min(squats, 100)}%`;
        await loadLogs();
        await updateStats();
    } catch (e) {
        status.textContent = 'Error logging workout';
    }
});

window.onload = async () => {
    await loadToday();
    await loadLogs();
    await updateStats();
};