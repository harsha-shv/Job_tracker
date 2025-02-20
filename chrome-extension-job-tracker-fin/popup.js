document.addEventListener('DOMContentLoaded', () => {
    // Get applied jobs count
    chrome.storage.local.get({ appliedJobs: [] }, (data) => {
        document.getElementById("applied-job-count").innerText = data.appliedJobs.length;
    });

    // Get low-applied jobs count
    chrome.storage.local.get({ lowAppliedJobs: [] }, (data) => {
        document.getElementById("low-applied-job-count").innerText = data.lowAppliedJobs.length;
    });

    // Redirect to Applied Jobs Page
    document.getElementById("view-applied-jobs").addEventListener('click', () => {
        chrome.tabs.create({ url: "applied_jobs.html" });
    });

    // Redirect to Low-Applied Jobs Page
    document.getElementById("view-low-applied-jobs").addEventListener('click', () => {
        chrome.tabs.create({ url: "low_applied_jobs.html" });
    });
});
