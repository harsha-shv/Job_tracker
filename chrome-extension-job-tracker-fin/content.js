(function () {
    console.log("🔄 Content script loaded successfully."); // Check if the script is running

    function getJobDetails() {
        console.log("🧐 Extracting job details...");

        let jobTitle, company, jobLink;

        if (window.location.hostname.includes("linkedin.com")) {
            jobTitle = document.querySelector('h1')?.innerText.trim() || "N/A";
            company = document.querySelector('.job-details-jobs-unified-top-card__company-name a')?.innerText.trim() || "N/A";
            jobLink = window.location.href;
        } else if (window.location.hostname.includes("jobright.ai")) {
            jobTitle = document.querySelector('h1')?.innerText.trim() || "N/A";
            let fullText = document.querySelector('h2')?.innerText.trim() || "N/A";
            let details = fullText.split("·").map(text => text.trim());
            company = details[0];
            jobLink = window.location.href;
        }

        console.log("📋 Extracted Data:", { jobTitle, company, jobLink });

        return { jobTitle, company, jobLink };
    }

    function showConfirmationPopup(jobData) {
        let existingPopup = document.getElementById("jobConfirmationPopup");
        if (existingPopup) existingPopup.remove();

        let popup = document.createElement("div");
        popup.id = "jobConfirmationPopup";
        popup.style.position = "fixed";
        popup.style.top = "20px";
        popup.style.right = "20px";
        popup.style.backgroundColor = "#fff";
        popup.style.padding = "15px";
        popup.style.boxShadow = "0px 4px 10px rgba(0,0,0,0.2)";
        popup.style.borderRadius = "10px";
        popup.style.zIndex = "9999";
        popup.style.fontSize = "14px";
        popup.style.fontFamily = "Arial, sans-serif";

        popup.innerHTML = `
            <strong>Did you apply for this job?</strong>
            <p>${jobData.jobTitle} at ${jobData.company}</p>
            <label>Upload Resume (optional):</label>
            <input type="file" id="resumeUpload" accept=".pdf,.doc,.docx" />
            <button id="applyYes" style="margin:5px; padding:5px 10px; background:#28a745; color:#fff; border:none; border-radius:5px; cursor:pointer;">Yes</button>
            <button id="applyNo" style="margin:5px; padding:5px 10px; background:#dc3545; color:#fff; border:none; border-radius:5px; cursor:pointer;">No</button>
        `;

        document.body.appendChild(popup);

        document.getElementById("applyYes").addEventListener("click", function () {
            let resumeFile = document.getElementById("resumeUpload").files[0];
            saveJob(jobData, resumeFile);
            popup.remove();
        });

        document.getElementById("applyNo").addEventListener("click", function () {
            console.log("❌ User chose NOT to save this job.");
            popup.remove();
        });
    }

    function saveJob(jobData, resumeFile) {
        console.log("📤 Saving job to applied jobs...", jobData);
        if (resumeFile) {
            uploadResumeToIndexedDB(jobData.jobLink, resumeFile);
        }
        chrome.runtime.sendMessage({ action: "saveJob", data: jobData }, () => {
            if (chrome.runtime.lastError) {
                console.warn("⚠️ Could not send message:", chrome.runtime.lastError.message);
            } else {
                console.log("✅ Job data saved successfully!");
            }
        });
    }

    function uploadResumeToIndexedDB(jobLink, file) {
        let reader = new FileReader();

        reader.onload = function (event) {
            let arrayBuffer = event.target.result;
            let byteArray = [...new Uint8Array(arrayBuffer)];

            let fileType = file.type || "application/octet-stream";

            chrome.runtime.sendMessage({
                action: "uploadResume",
                jobLink: jobLink,
                fileData: byteArray,
                fileType: fileType
            }, (response) => {
                if (response && response.success) {
                    console.log(`✅ Resume successfully stored in IndexedDB for ${jobLink}`);
                } else {
                    console.error(`❌ Error storing resume in IndexedDB`);
                }
            });
        };

        reader.readAsArrayBuffer(file);
    }

    // Detect all clicks and check if the clicked button contains "APPLY NOW" text
    document.addEventListener('click', (event) => {
        let target = event.target;

        // Log clicked element for debugging
        console.log("🔍 Click detected on:", target);

        // Check if the clicked element or its children contain "APPLY NOW"
        let applyButton = target.closest('button') || target.closest('span');
        if (applyButton && (applyButton.innerText.trim().toUpperCase().includes("APPLY NOW") || applyButton.innerText.trim().toUpperCase().includes("APPLY"))) {
            console.log("✅ Apply button detected:", applyButton);

            console.log("✅ Apply button clicked, showing confirmation popup...");
            setTimeout(() => {
                let jobData = getJobDetails();
                if (jobData.company !== "N/A") {
                    showConfirmationPopup(jobData);
                } else {
                    console.warn("❌ Company name not found, trying again in 2s...");
                    setTimeout(() => showConfirmationPopup(jobData), 2000);
                }
            }, 2000);
        } else {
            console.log("❌ Apply button not detected on click.");
        }
    });

})();
