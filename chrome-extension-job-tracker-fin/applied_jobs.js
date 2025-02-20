document.addEventListener("DOMContentLoaded", function () {
    let sections = {
        applied: document.getElementById("appliedJobs"),
        interviewing: document.getElementById("interviewingJobs"),
        offerLetter: document.getElementById("offerLetterJobs"),
        rejected: document.getElementById("rejectedJobs"),
    };

    let countElements = {
        applied: document.getElementById("countApplied"),
        interviewing: document.getElementById("countInterviewing"),
        offerLetter: document.getElementById("countOfferLetter"),
        rejected: document.getElementById("countRejected"),
    };

    let searchInput = document.getElementById("jobSearch");

    function loadJobs() {
        chrome.storage.local.get({ appliedJobs: [] }, (data) => {
            let appliedJobs = data.appliedJobs;

            Object.values(sections).forEach(section => section.innerHTML = "");

            let jobCounts = { applied: 0, interviewing: 0, offerLetter: 0, rejected: 0 };

            appliedJobs.reverse().forEach(job => {
                let jobElement = document.createElement("div");
                jobElement.classList.add("job");
                jobElement.setAttribute("data-job-title", job.jobTitle.toLowerCase());
                jobElement.setAttribute("data-company", job.company.toLowerCase());
                jobElement.innerHTML = `
                <strong>${job.jobTitle}</strong> at ${job.company} <br>
                <a href="${job.jobLink}" target="_blank">View Job</a> <br>
                <label>Status:</label>
                <select class="status-dropdown" data-job="${job.jobLink}">
                    <option value="applied" ${job.status === "applied" ? "selected" : ""}>Applied</option>
                    <option value="interviewing" ${job.status === "interviewing" ? "selected" : ""}>Interviewing</option>
                    <option value="offerLetter" ${job.status === "offerLetter" ? "selected" : ""}>Offer Received</option>
                    <option value="rejected" ${job.status === "rejected" ? "selected" : ""}>Rejected</option>
                </select>
                <br>
                <span id="resumeContainer-${job.jobLink}">Checking for resume...</span>
            `;

                sections[job.status].appendChild(jobElement);
                jobCounts[job.status]++;


                chrome.runtime.sendMessage({ action: "getResume", jobLink: job.jobLink }, (response) => {
                    let resumeContainer = document.getElementById(`resumeContainer-${job.jobLink}`);

                    if (!resumeContainer) {
                        console.error(`❌ resumeContainer-${job.jobLink} not found in DOM`);
                        return;
                    }

                    console.log(`📥 Retrieved resume for ${job.jobLink}:`, response);

                    if (response && response.resume && response.resume.resume && response.resume.resume.length > 0) {
                        let resumeData = response.resume.resume;
                        let fileType = response.resume.fileType || "application/octet-stream";
                        let fileExtension = fileType.includes("pdf") ? "pdf" : "docx";
                        let fileName = `Resume.${fileExtension}`;
                        console.log(`📥 Retrieved resume for ${fileType}:`);
                        let blob = new Blob([new Uint8Array(resumeData)], { type: fileType });
                        let url = URL.createObjectURL(blob);

                        console.log(`✅ Creating download link: ${url}`);

                        resumeContainer.innerHTML = `<a href="${url}" download="${fileName}">Download Resume</a>`;
                    } else {
                        resumeContainer.innerHTML = "No Resume Available";
                    }
                });




            });

            Object.keys(jobCounts).forEach(status => {
                countElements[status].innerText = jobCounts[status];
            });

            document.querySelectorAll(".status-dropdown").forEach(dropdown => {
                dropdown.addEventListener("change", function () {
                    let newStatus = this.value;
                    let jobLink = this.getAttribute("data-job");

                    updateJobStatus(jobLink, newStatus);
                });
            });
        });
    }

    function updateJobStatus(jobLink, newStatus) {
        chrome.storage.local.get({ appliedJobs: [] }, (data) => {
            let appliedJobs = data.appliedJobs;
            let jobIndex = appliedJobs.findIndex(job => job.jobLink === jobLink);

            if (jobIndex !== -1) {
                appliedJobs[jobIndex].status = newStatus;
                chrome.storage.local.set({ appliedJobs }, () => {
                    console.log(`✅ Job moved to ${newStatus}`);
                    loadJobs();
                });
            }
        });
    }

    searchInput.addEventListener("input", function () {
        let query = searchInput.value.toLowerCase();
        let activeSection = document.querySelector(".job-list.active");

        if (!activeSection) return;

        let jobs = activeSection.querySelectorAll(".job");

        jobs.forEach(job => {
            let jobTitle = job.getAttribute("data-job-title");
            let companyName = job.getAttribute("data-company");

            if (jobTitle.includes(query) || companyName.includes(query)) {
                job.style.display = "block"; 
            } else {
                job.style.display = "none"; 
            }
        });

        if (!query) {
            jobs.forEach(job => job.style.display = "block"); 
        }
    });

    document.querySelectorAll(".tab").forEach(tab => {
        tab.addEventListener("click", function () {
            let category = this.getAttribute("data-category");

            // Hide all job lists and remove active tab styling
            document.querySelectorAll(".job-list").forEach(section => section.classList.remove("active"));
            document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));

            // Show the selected job list and highlight the active tab
            sections[category].classList.add("active");
            this.classList.add("active");
        });
    });

    loadJobs(); 
});
