// ==========================================
// YOUTUBE CREATOR DASHBOARD
// FRONTEND JAVASCRIPT
// ==========================================

const API_BASE =
  "https://youtube-dashboard-api.surjeetmaurya0981.workers.dev";

// ==========================================
// HTML ELEMENTS
// ==========================================

const channelInput = document.getElementById("channelInput");
const sidebarChannelInput = document.getElementById("sidebarChannelInput");

const loadChannelBtn = document.getElementById("loadChannelBtn");
const sidebarLoadBtn = document.getElementById("sidebarLoadBtn");

const channelAvatar = document.getElementById("channelAvatar");
const channelName = document.getElementById("channelName");
const channelHandle = document.getElementById("channelHandle");
const channelDescription = document.getElementById("channelDescription");

const subscriberCount = document.getElementById("subscriberCount");
const totalViews = document.getElementById("totalViews");
const totalVideos = document.getElementById("totalVideos");

const visitChannelBtn = document.getElementById("visitChannelBtn");

const latestVideos = document.getElementById("latestVideos");

const connectGoogleBtn = document.getElementById("connectGoogleBtn");
const exploreTipsBtn = document.getElementById("exploreTipsBtn");
const viewAllVideos = document.getElementById("viewAllVideos");


// ==========================================
// FORMAT NUMBERS
// ==========================================

function formatNumber(number) {
  if (number === undefined || number === null) {
    return "0";
  }

  return Number(number).toLocaleString("en-IN");
}


// ==========================================
// API REQUEST
// ==========================================

async function youtubeRequest(endpoint, params = {}) {

  let apiUrl = "";

  if (endpoint === "channels") {

    apiUrl =
      API_BASE +
      "/api/channel?url=" +
      encodeURIComponent(params.url);

  } else if (endpoint === "playlistItems") {

    apiUrl =
      API_BASE +
      "/api/videos?playlistId=" +
      encodeURIComponent(params.playlistId);

  } else {

    throw new Error("Invalid API endpoint");
  }

  const response = await fetch(apiUrl);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "YouTube API request failed"
    );
  }

  if (endpoint === "channels") {
    return { items: [data] };
  }

  return data;
}


// ==========================================
// FIND CHANNEL
// ==========================================

async function findChannel(channelLink) {

  if (!channelLink) {
    throw new Error("Please enter a YouTube channel link.");
  }

  const cleanLink = channelLink.trim();

  const response = await youtubeRequest(
    "channels",
    {
      url: cleanLink
    }
  );

  if (!response.items || response.items.length === 0) {
    throw new Error("YouTube channel not found.");
  }

  return response.items[0];
}


// ==========================================
// LOAD CHANNEL
// ==========================================

async function loadChannel(link) {

  if (!link || !link.trim()) {
    alert("Please enter a YouTube channel link.");
    return;
  }

  const originalButtonText = loadChannelBtn
    ? loadChannelBtn.textContent
    : "";

  if (loadChannelBtn) {
    loadChannelBtn.disabled = true;
    loadChannelBtn.textContent = "Loading...";
  }

  if (sidebarLoadBtn) {
    sidebarLoadBtn.disabled = true;
  }

  try {

    latestVideos.innerHTML =
      "<p>Loading channel videos...</p>";

    channelName.textContent = "Loading...";
    channelHandle.textContent = "";
    channelDescription.textContent = "Please wait...";

    const channel = await findChannel(link);

    const snippet = channel.snippet;
    const statistics = channel.statistics;
    const contentDetails = channel.contentDetails;

    // CHANNEL NAME

    channelName.textContent =
      snippet.title || "Unknown Channel";

    // CHANNEL HANDLE

    const handle = snippet.customUrl || "";

    channelHandle.textContent = handle
      ? handle.startsWith("@")
        ? handle
        : "@" + handle
      : "";

    // CHANNEL DESCRIPTION

    channelDescription.textContent =
      snippet.description || "No description available.";

    // CHANNEL IMAGE

    if (snippet.thumbnails) {

      const image =
        snippet.thumbnails.high ||
        snippet.thumbnails.medium ||
        snippet.thumbnails.default;

      if (image) {
        channelAvatar.src = image.url;
      }
    }

    // SUBSCRIBERS

    if (statistics.hiddenSubscriberCount) {

      subscriberCount.textContent = "Hidden";

    } else {

      subscriberCount.textContent =
        formatNumber(statistics.subscriberCount);
    }

    // TOTAL VIEWS

    totalViews.textContent =
      formatNumber(statistics.viewCount);

    // TOTAL VIDEOS

    totalVideos.textContent =
      formatNumber(statistics.videoCount);

    // CHANNEL LINK

    const channelId = channel.id;

    visitChannelBtn.href =
      "https://www.youtube.com/channel/" + channelId;

    visitChannelBtn.target = "_blank";

    visitChannelBtn.rel = "noopener noreferrer";

    // SAVE CHANNEL ID

    localStorage.setItem(
      "lastChannelId",
      channelId
    );

    // SAVE CHANNEL URL

    localStorage.setItem(
      "lastChannelUrl",
      link
    );

    // UPDATE INPUTS

    if (channelInput) {
      channelInput.value = link;
    }

    if (sidebarChannelInput) {
      sidebarChannelInput.value = link;
    }

    // LOAD LATEST VIDEOS

    const uploadsPlaylist =
      contentDetails.relatedPlaylists.uploads;

    if (uploadsPlaylist) {
      await loadLatestVideos(uploadsPlaylist);
    } else {
      latestVideos.innerHTML =
        "<p>No videos available.</p>";
    }

  } catch (error) {

    console.error("Channel Error:", error);

    channelName.textContent = "Channel Not Found";

    channelDescription.textContent =
      error.message;

    latestVideos.innerHTML =
      "<p>Unable to load channel videos.</p>";

    alert(error.message);

  } finally {

    if (loadChannelBtn) {
      loadChannelBtn.disabled = false;
      loadChannelBtn.textContent =
        originalButtonText || "Load Channel";
    }

    if (sidebarLoadBtn) {
      sidebarLoadBtn.disabled = false;
    }
  }
}


// ==========================================
// LOAD LATEST VIDEOS
// ==========================================

async function loadLatestVideos(playlistId) {

  try {

    latestVideos.innerHTML =
      "<p>Loading latest videos...</p>";

    const data = await youtubeRequest(
      "playlistItems",
      {
        playlistId: playlistId
      }
    );

    latestVideos.innerHTML = "";

    if (!data.items || data.items.length === 0) {

      latestVideos.innerHTML =
        "<p>No videos found.</p>";

      return;
    }

    data.items.forEach(item => {

      const video = item.snippet;

      const videoId =
        video.resourceId.videoId;

      const videoTitle =
        video.title || "Untitled Video";

      const thumbnail =
        video.thumbnails.medium ||
        video.thumbnails.default;

      // VIDEO CARD

      const card = document.createElement("div");

      card.className = "video-card";

      // THUMBNAIL

      const image = document.createElement("img");

      image.src = thumbnail
        ? thumbnail.url
        : "";

      image.alt = videoTitle;

      // TITLE

      const title = document.createElement("h4");

      title.textContent = videoTitle;

      // DATE

      const date = document.createElement("p");

      date.textContent =
        video.publishedAt
          ? new Date(
              video.publishedAt
            ).toLocaleDateString("en-IN")
          : "";

      // LINK

      const link = document.createElement("a");

      link.href =
        "https://www.youtube.com/watch?v=" + videoId;

      link.target = "_blank";

      link.rel = "noopener noreferrer";

      link.textContent = "Watch Video";

      // ADD ELEMENTS

      card.appendChild(image);

      card.appendChild(title);

      card.appendChild(date);

      card.appendChild(link);

      latestVideos.appendChild(card);

    });

  } catch (error) {

    console.error("Videos Error:", error);

    latestVideos.innerHTML =
      "<p>Unable to load videos.</p>";
  }
}


// ==========================================
// LOAD BUTTON EVENTS
// ==========================================

if (loadChannelBtn) {

  loadChannelBtn.addEventListener("click", () => {

    loadChannel(channelInput.value);

  });

}


if (sidebarLoadBtn) {

  sidebarLoadBtn.addEventListener("click", () => {

    loadChannel(sidebarChannelInput.value);

  });

}


// ==========================================
// ENTER KEY SUPPORT
// ==========================================

if (channelInput) {

  channelInput.addEventListener("keypress", event => {

    if (event.key === "Enter") {

      loadChannel(channelInput.value);

    }

  });

}


if (sidebarChannelInput) {

  sidebarChannelInput.addEventListener("keypress", event => {

    if (event.key === "Enter") {

      loadChannel(sidebarChannelInput.value);

    }

  });

}


// ==========================================
// CONNECT GOOGLE BUTTON
// ==========================================

if (connectGoogleBtn) {

  connectGoogleBtn.addEventListener("click", () => {

    alert(
      "Google OAuth integration is coming soon!"
    );

  });

}


// ==========================================
// EXPLORE TIPS BUTTON
// ==========================================

if (exploreTipsBtn) {

  exploreTipsBtn.addEventListener("click", () => {

    alert(
      "Creator growth tips are coming soon!"
    );

  });

}


// ==========================================
// VIEW ALL VIDEOS
// ==========================================

if (viewAllVideos) {

  viewAllVideos.addEventListener("click", () => {

    alert(
      "More video analytics are coming soon!"
    );

  });

}


// ==========================================
// RESTORE LAST CHANNEL
// ==========================================

window.addEventListener("DOMContentLoaded", () => {

  const savedUrl =
    localStorage.getItem("lastChannelUrl");

  if (savedUrl) {

    if (channelInput) {
      channelInput.value = savedUrl;
    }

    if (sidebarChannelInput) {
      sidebarChannelInput.value = savedUrl;
    }

    loadChannel(savedUrl);

  }

});


// ==========================================
// DASHBOARD READY
// ==========================================

console.log(
  "YouTube Creator Dashboard Loaded Successfully!"
);
