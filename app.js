// ─── Countdown Timer ─────────────────────────────────────────────────────────
function initCountdown() {
    const countdownElement = document.getElementById('event-countdown');
    if (!countdownElement) return;

    // Target date: May 5, 2026, 20:00:00
    const targetDate = new Date('2026-05-05T20:00:00').getTime();

    const interval = setInterval(() => {
        const now = new Date().getTime();
        const distance = targetDate - now;

        // Time calculations for days, hours, minutes and seconds
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Display the result in the element with id="event-countdown"
        document.getElementById('days').textContent = days < 0 ? '0' : String(days).padStart(2, '0');
        document.getElementById('hours').textContent = hours < 0 ? '0' : String(hours).padStart(2, '0');
        document.getElementById('minutes').textContent = minutes < 0 ? '0' : String(minutes).padStart(2, '0');
        document.getElementById('seconds').textContent = seconds < 0 ? '0' : String(seconds).padStart(2, '0');

        // If the count down is finished, write some text
        if (distance < 0) {
            clearInterval(interval);
            countdownElement.innerHTML = "<span class='countdown-finished'>EVENT ACTIVE</span>";
        }
    }, 1000); // Update every second
}

// Initialize countdown when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initCountdown();
});
