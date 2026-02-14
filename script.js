document.addEventListener('DOMContentLoaded', () => {
    // Clock Functionality
    function updateClock() {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        const clockElement = document.getElementById('clock');
        if (clockElement) {
            clockElement.textContent = timeString;
        }
    }
    setInterval(updateClock, 1000);
    updateClock();

    // Typing Effect
    const typingElement = document.querySelector('.typing-text');
    const outputArea = document.getElementById('output-area');

    if (typingElement && typingElement.dataset.text) {
        const textToType = typingElement.dataset.text;
        let charIndex = 0;

        function typeChar() {
            if (charIndex < textToType.length) {
                typingElement.textContent += textToType.charAt(charIndex);
                charIndex++;
                setTimeout(typeChar, 100 + Math.random() * 100);
            } else {
                if (outputArea) {
                    setTimeout(() => {
                        outputArea.style.opacity = '1';
                    }, 500);
                }
            }
        }

        // Start typing after a small delay
        setTimeout(typeChar, 1000);
    } else {
        if (outputArea) {
            outputArea.style.opacity = '1';
        }
    }

    // Interactive Console Simulation (Easter Egg)
    const commandInput = document.querySelector('.typing-text');
    if (commandInput && commandInput.dataset.text === "whoami") {
        setTimeout(() => {
            // Future expansion
        }, 5000);
    }

    // --- LOGS FEATURE ---
    const logsGrid = document.getElementById('logs-grid');
    const toggleUploadBtn = document.getElementById('toggle-upload');
    const uploadSection = document.getElementById('upload-section');
    const logForm = document.getElementById('log-form');

    // Toggle Upload Form
    if (toggleUploadBtn && uploadSection) {
        toggleUploadBtn.addEventListener('click', () => {
            const isHidden = uploadSection.style.display === 'none';
            uploadSection.style.display = isHidden ? 'block' : 'none';
            toggleUploadBtn.textContent = isHidden ? '[-] Cancel Log' : '[+] New Log Entry';
        });
    }

    // Submit Log
    if (logForm) {
        logForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(logForm);

            // Basic Feedback
            const btn = logForm.querySelector('button');
            const originalText = btn.textContent;
            btn.textContent = '[ UPLOADING... ]';
            btn.disabled = true;

            try {
                const response = await fetch('/api/logs', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                if (result.message === 'success') {
                    alert('>> Log Processed Successfully');
                    logForm.reset();
                    // Hide form
                    uploadSection.style.display = 'none';
                    toggleUploadBtn.textContent = '[+] New Log Entry';
                    // Refresh logs
                    fetchLogs();
                } else {
                    alert('>> Error: ' + (result.error || result.msg));
                }
            } catch (error) {
                alert('>> System Error: ' + error.message);
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }

    // Delete Log
    window.deleteLog = async (id) => {
        if (confirm('>> Are you sure you want to delete this entry?')) {
            try {
                const response = await fetch(`/api/logs/${id}`, { method: 'DELETE' });
                const result = await response.json();
                if (result.message === 'deleted') {
                    fetchLogs();
                } else {
                    alert('>> Error deleting log');
                }
            } catch (error) {
                console.error('Error:', error);
            }
        }
    };

    // Fetch Logs
    async function fetchLogs() {
        if (!logsGrid) return;

        try {
            const response = await fetch('/api/logs');
            const result = await response.json();

            if (result.data && result.data.length > 0) {
                logsGrid.innerHTML = result.data.map(log => `
                    <div class="card">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <h3><i class="fas fa-file-alt"></i> ${log.title}</h3>
                            <button onclick="deleteLog(${log.id})" style="background: transparent; border: 1px solid red; color: red; cursor: pointer; padding: 2px 5px; font-family: inherit;">[X]</button>
                        </div>
                        <p style="font-size: 0.8rem; color: var(--terminal-dim); margin-bottom: 10px;">
                            ${new Date(log.created_at).toLocaleDateString()} | [${log.type.toUpperCase()}]
                        </p>
                        <p style="white-space: pre-wrap;">${log.content}</p>
                        ${log.media_url ? `
                            <div style="margin-top: 15px; border: 1px dashed var(--terminal-dim); padding: 5px;">
                                ${log.media_url.match(/\.(mp4|mov|avi)$/i) ?
                            `<video controls src="${log.media_url}" style="max-width: 100%; border: 1px solid var(--terminal-green);"></video>` :
                            `<img src="${log.media_url}" alt="Log Media" style="max-width: 100%; border: 1px solid var(--terminal-green);">`
                        }
                            </div>
                        ` : ''}
                    </div>
                `).join('');
            } else {
                logsGrid.innerHTML = '<p>>> No logs found. Start logging your journey!</p>';
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
            logsGrid.innerHTML = '<p style="color: red;">>> Error connecting to server.</p>';
        }
    }

    // Call fetch logs if we are on the page
    if (logsGrid) {
        fetchLogs();
    }
});
