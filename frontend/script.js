async function generateSteps() {
    const taskInput = document.getElementById('taskInput').value.trim();
    const resultsContainer = document.getElementById('resultsContainer');
    const loading = document.getElementById('loading');
    const errorMessage = document.getElementById('errorMessage');
    const generateBtn = document.getElementById('generateBtn');

    // Reset previous states
    resultsContainer.innerHTML = '';
    errorMessage.classList.add('hidden');

    if (!taskInput) {
        errorMessage.innerText = "Please enter a task first!";
        errorMessage.classList.remove('hidden');
        return;
    }

    // Show loading & disable button
    loading.classList.remove('hidden');
    generateBtn.disabled = true;
    generateBtn.classList.add('opacity-50', 'cursor-not-allowed');

    try {
        const response = await fetch('https://ai-task-assistant-production-4bfb.up.railway.app/generate-steps', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ task: taskInput })
});

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Failed to generate steps.');
        }

        // Parse steps data safely
        let steps = [];
        try {
            let cleanText = data.steps;
            if (typeof cleanText === 'string') {
                cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '').trim();
                steps = JSON.parse(cleanText);
            } else {
                steps = cleanText;
            }
        } catch (parseError) {
            steps = data.steps.split('\n').filter(step => step.trim() !== '');
        }

        // Render steps beautifully
        if (Array.isArray(steps) && steps.length > 0) {
            steps.forEach((step, index) => {
                const stepCard = document.createElement('div');
                stepCard.className = "bg-slate-900/50 border border-slate-700/60 hover:border-indigo-500/50 rounded-2xl p-5 flex items-start gap-4 transition-all duration-300 shadow-md";
                
                stepCard.innerHTML = `
                    <div class="flex-shrink-0 w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 font-bold flex items-center justify-center text-sm shadow-inner">
                        ${index + 1}
                    </div>
                    <div class="text-slate-200 text-sm sm:text-base leading-relaxed pt-1">
                        ${typeof step === 'string' ? step : JSON.stringify(step)}
                    </div>
                `;
                resultsContainer.appendChild(stepCard);
            });
        } else {
            throw new Error("Received empty or invalid steps format from AI.");
        }

    } catch (error) {
        console.error(error);
        errorMessage.innerText = error.message || "Something went wrong. Please try again.";
        errorMessage.classList.remove('hidden');
    } finally {
        // Hide loading & enable button
        loading.classList.add('hidden');
        generateBtn.disabled = false;
        generateBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

// Allow pressing 'Enter' key to trigger generation directly from input field
document.getElementById('taskInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        generateSteps();
    }
});