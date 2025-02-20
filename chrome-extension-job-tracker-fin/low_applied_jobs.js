document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get({ lowAppliedJobs: [] }, (data) => {
        let jobList = document.getElementById("low-applied-jobs-list");
        data.lowAppliedJobs.forEach(job => {
            let li = document.createElement("li");
            li.innerHTML = `<strong>${job.title}</strong> at ${job.company} (<em>${job.applicants} applicants</em>) - <a href="${job.link}" target="_blank">View</a>`;
            jobList.appendChild(li);
        });
    });
});
