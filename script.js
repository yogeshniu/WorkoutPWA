let exercises = {
    pushup: { total: 0, entries: [], dates: {} },
    squat: { total: 0, entries: [], dates: {} },
    situp: { total: 0, entries: [], dates: {} }
};

// Load saved data
const savedData = localStorage.getItem('workoutData');
if (savedData) {
    exercises = JSON.parse(savedData);
    Object.keys(exercises).forEach(type => {
        updateProgress(type);
        updateEntries(type);
    });
    updateChart();
    updateStreak();
}

function saveData() {
    localStorage.setItem('workoutData', JSON.stringify(exercises));
}

function addExercise(type) {
    const input = document.getElementById(`${type}Input`);
    const reps = parseInt(input.value);
    
    if (isNaN(reps) || reps <= 0) {
        alert('Please enter a valid number of reps');
        return;
    }

    if (exercises[type].total + reps > 100) {
        alert('Total reps cannot exceed 100');
        return;
    }

    exercises[type].total += reps;
    const today = new Date().toISOString().split('T')[0];
    exercises[type].entries.push({
        reps: reps,
        time: new Date().toLocaleTimeString(),
        date: today
    });
    exercises[type].dates[today] = (exercises[type].dates[today] || 0) + reps;
    saveData();
    updateStreak();

    updateProgress(type);
    updateEntries(type);
    updateChart();
    input.value = '';
}

function updateProgress(type) {
    const progressBar = document.getElementById(`${type}Progress`);
    const percentage = (exercises[type].total / 100) * 100;
    progressBar.style.width = `${percentage}%`;
    progressBar.textContent = `${exercises[type].total}/100`;
}

function updateEntries(type) {
    const entriesDiv = document.getElementById(`${type}Entries`);
    entriesDiv.innerHTML = exercises[type].entries
        .map(entry => `<div>${entry.reps} reps at ${entry.time}</div>`)
        .join('');
}

let historyChart;

function updateChart() {
    try {
        const canvas = document.getElementById('historyChart');
        const ctx = canvas.getContext('2d');
        
        if (historyChart) {
            historyChart.destroy();
        }

        historyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Pushups', 'Squats', 'Situps'],
                datasets: [{
                    label: 'Progress (reps)',
                    data: [exercises.pushup.total, exercises.squat.total, exercises.situp.total],
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(153, 102, 255, 0.6)'
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(153, 102, 255, 1)'
                    ],
                    borderWidth: 2,
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Daily Exercise Progress',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                }
            }
        });
    } catch (error) {
        console.error('Error updating chart:', error);
    }
}

function updateStreak() {
    const dates = new Set();
    Object.values(exercises).forEach(exercise => {
        Object.keys(exercise.dates).forEach(date => dates.add(date));
    });

    const sortedDates = Array.from(dates).sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let streak = 0;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    for (let i = 0; i < sortedDates.length; i++) {
        const currentDate = sortedDates[i];
        const nextDate = sortedDates[i + 1];

        if (nextDate) {
            const dayDiff = (new Date(nextDate) - new Date(currentDate)) / 86400000;
            if (dayDiff === 1) {
                streak++;
            } else {
                streak = 0;
            }
        }

        longestStreak = Math.max(longestStreak, streak + 1);
    }

    if (sortedDates.includes(today)) {
        currentStreak = streak + 1;
    } else if (sortedDates.includes(yesterday)) {
        currentStreak = streak;
    } else {
        currentStreak = 0;
    }

    document.getElementById('currentStreak').textContent = `Current Streak: ${currentStreak} days`;
    document.getElementById('longestStreak').textContent = `Longest Streak: ${longestStreak} days`;

    // Update calendar
    const calendarDiv = document.getElementById('calendarDays');
    calendarDiv.innerHTML = '';

    const daysToShow = 30;
    const calendarDates = [];
    for (let i = 0; i < daysToShow; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        calendarDates.unshift(date.toISOString().split('T')[0]);
    }

    calendarDates.forEach(date => {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('calendar-day');
        dayDiv.textContent = new Date(date).getDate();

        let hasWorkout = false;
        Object.values(exercises).forEach(exercise => {
            if (exercise.dates[date]) hasWorkout = true;
        });

        dayDiv.classList.add(hasWorkout ? 'workout-done' : 'no-workout');
        dayDiv.title = date;
        calendarDiv.appendChild(dayDiv);
    });
}

// Initialize the chart and calendar
document.addEventListener('DOMContentLoaded', () => {
    // Load saved data and initialize UI
    const savedData = localStorage.getItem('workoutData');
    if (savedData) {
        try {
            exercises = JSON.parse(savedData);
            Object.keys(exercises).forEach(type => {
                updateProgress(type);
                updateEntries(type);
            });
            updateChart();
            updateStreak();
        } catch (error) {
            console.error('Error loading saved data:', error);
            localStorage.removeItem('workoutData');
        }
    }

    // Add input event listeners for validation
    ['pushup', 'squat', 'situp'].forEach(type => {
        const input = document.getElementById(`${type}Input`);
        input.addEventListener('input', () => {
            const value = parseInt(input.value);
            if (value < 0) input.value = 0;
            if (value > 100) input.value = 100;
        });
    });
});