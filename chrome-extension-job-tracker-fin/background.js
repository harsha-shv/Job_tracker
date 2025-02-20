const CLIENT_ID = "695258250704-n3l26k61vee0bplotpsgd5hbk2k3g751.apps.googleusercontent.com";
const API_KEY = "AIzaSyC_TD2r_7D_o7pVJEVfwNcQVbMB0Q6XCic";
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/drive.file";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "saveJob") {
        let jobData = message.data;
        jobData.status = "applied"; // Default status when saved

        chrome.storage.local.get({ appliedJobs: [] }, (data) => {
            let appliedJobs = data.appliedJobs;
            appliedJobs.push(jobData);

            chrome.storage.local.set({ appliedJobs }, () => {
                console.log("✅ Job saved in applied list");
                sendResponse({ success: true }); // Send response back to content.js
            });
        });
    }

    if (message.action === "uploadResume") {
        uploadResumeToIndexedDB(message.fileData, message.jobLink, message.fileType, (response) => {
            sendResponse(response);
        });
        return true; // Required for async response
    }

    if (message.action === "getResume") {
        getResumeFromIndexedDB(message.jobLink, (resumeLink) => {
            sendResponse({ resume: resumeLink });
        });
        return true;
    }

    if (message.action === "updateJobStatus") {
        chrome.storage.local.get({ appliedJobs: [] }, (data) => {
            let appliedJobs = data.appliedJobs;
            let jobIndex = appliedJobs.findIndex(job => job.jobLink === message.jobLink);

            if (jobIndex !== -1) {
                appliedJobs[jobIndex].status = message.newStatus;
                chrome.storage.local.set({ appliedJobs }, () => {
                    console.log(`✅ Job status updated to ${message.newStatus}`);
                    sendResponse({ success: true });
                });
            } else {
                sendResponse({ success: false, error: "Job not found" });
            }
        });

        return true; // Required for async sendResponse
    }

});

chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "fileUpload") {
        port.onMessage.addListener((message) => {
            if (message.action === "uploadResume") {
                let { fileData, jobLink } = message;

                console.log("📥 Receiving File Data in background.js:");
                if (!fileData) {
                    console.error("❌ ERROR: fileData is undefined or null.");
                    port.postMessage({ error: "Invalid file data received" });
                    return;
                }

                if (!Array.isArray(fileData)) {
                    console.error("❌ ERROR: fileData is not an array. Received:", typeof fileData, fileData);
                    port.postMessage({ error: "Invalid file format" });
                    return;
                }

                console.log("📏 Received File Size (bytes):", fileData.length);
                console.log("📄 First 100 Bytes:", fileData.slice(0, 100));

                uploadResumeToDrive(fileData, jobLink, (response) => {
                    port.postMessage(response); // Send response back
                    port.disconnect(); // Close connection after upload
                });
            }
        });
    }
});


// Authenticate User with Google OAuth
function authenticateUser(callback) {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
            console.error("❌ Authentication Error:", chrome.runtime.lastError);
            return;
        }
        callback(token);
    });
}


function openDatabase() {
    return new Promise((resolve, reject) => {
        let request = indexedDB.open("JobTrackerDB", 1);

        request.onupgradeneeded = function(event) {
            let db = event.target.result;
            if (!db.objectStoreNames.contains("resumes")) {
                db.createObjectStore("resumes", { keyPath: "jobLink" });
            }
        };

        request.onsuccess = function(event) {
            resolve(event.target.result);
        };

        request.onerror = function(event) {
            reject("❌ IndexedDB error: " + event.target.errorCode);
        };
    });
}

function uploadResumeToIndexedDB(fileData, jobLink, fileType, callback) {
    openDatabase().then((db) => {
        let transaction = db.transaction(["resumes"], "readwrite");
        let store = transaction.objectStore("resumes");

        let resumeEntry = {
            jobLink: jobLink,
            fileData: fileData,
            fileType: fileType
        };

        let request = store.put(resumeEntry);

        request.onsuccess = function() {
            console.log("✅ Resume saved in IndexedDB for job:", jobLink);
            callback({ success: true });
        };

        request.onerror = function(event) {
            console.error("❌ Error saving resume in IndexedDB:", event.target.error);
            callback({ success: false });
        };
    }).catch(error => {
        console.error(error);
        callback({ success: false });
    });
}
function getResumeFromIndexedDB(jobLink, callback) {
    openDatabase().then((db) => {
        let transaction = db.transaction(["resumes"], "readonly");
        let store = transaction.objectStore("resumes");

        let request = store.get(jobLink);

        request.onsuccess = function() {
            if (request.result) {
                console.log(`✅ Resume found for ${jobLink}`);
                callback({ resume: request.result.fileData, fileType: request.result.fileType || "application/octet-stream" });
            } else {
                console.warn(`⚠️ No resume found for job: ${jobLink}`);
                callback({ resume: null });
            }
        };

        request.onerror = function(event) {
            console.error("❌ Error retrieving resume from IndexedDB:", event.target.error);
            callback({ resume: null });
        };
    }).catch(error => {
        console.error(error);
        callback({ resume: null });
    });
}

