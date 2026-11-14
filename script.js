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
const avatarFallback = document.getElementById("avatarFallback");

const channelName = document.getElementById("channelName");
const channelHandle = document.getElementById("channelHandle");
const channelDescription = document.getElementById("channelDescription");

const subscriberCount = document.getElementById("subscriberCount");
const totalViews = document.getElementById("totalViews");
const totalVideos = document.getElementById("totalVideos");

const visitChannelBtn = document.getElementById("visitChannelBtn");

const latestVideos = document.getElementById("latestVideos");
const chartArea = document.getElementById("chartArea");

const connectGoogleBtn = document.getElementById("connectGoogleBtn");
const exploreTipsBtn = document.getElementById("exploreTipsBtn");
const viewAllVideos = document.getElementById("viewAllVideos");


// ==========================================
// FORMAT NUMBERS
// ==========================================

function formatNumber(number) {
  return Number(number || 0).toLocaleString("en-IN");
}

function formatShortNumber(number) {

  number = Number(number || 0);

  if (number >= 10000000) {
    return (number / 10000000).toFixed(1) + "Cr";
  }

  if (number >= 100000) {
    return (number / 100000).toFixed(1) + "L";
  }

  if (number >= 1000) {
    return (number / 1000).toFixed(1) + "K";
  }

  return number.toString();
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
    throw new Error(data.error || "API request failed");
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

  return await youtubeRequest("channels", {
    url: channelLink.trim()
  });
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
    : "Load";

  if (loadChannelBtn) {
    loadChannelBtn.disabled = true;
    loadChannelBtn.textContent = "Loading...";
  }

  if (sidebarLoadBtn) {
    sidebarLoadBtn.disabled = true;
  }

  try {

    latestVideos.innerHTML =
      "<p>Loading latest videos...</p>";

    chartArea.innerHTML =
      "<p>Loading analytics chart...</p>";

    channelName.textContent = "Loading...";
    channelHandle.textContent = "";
    channelDescription.textContent = "Please wait...";

    const response = await findChannel(link);

    const channel = response.items[0];

    const snippet = channel.snippet || {};
    const statistics = channel.statistics || {};
    const contentDetails = channel.contentDetails || {};

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

    const thumbnails = snippet.thumbnails || {};

    const profileImage =
      thumbnails.high ||
      thumbnails.medium ||
      thumbnails.default;

    if (profileImage && profileImage.url) {

      channelAvatar.src = profileImage.url;
      channelAvatar.style.display = "block";

      if (avatarFallback) {
        avatarFallback.style.display = "none";
      }

      channelAvatar.onerror = () => {

        channelAvatar.style.display = "none";

        if (avatarFallback) {
          avatarFallback.style.display = "block";
        }

      };

    } else {

      channelAvatar.style.display = "none";

      if (avatarFallback) {
        avatarFallback.style.display = "block";
      }

    }


    // SUBSCRIBERS

    subscriberCount.textContent =
      statistics.hiddenSubscriberCount
        ? "Hidden"
        : formatNumber(statistics.subscriberCount);


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

    localStorage.setItem("lastChannelId", channelId);


    // SAVE CHANNEL URL

    localStorage.setItem("lastChannelUrl", link);


    // UPDATE INPUTS

    if (channelInput) {
      channelInput.value = link;
    }

    if (sidebarChannelInput) {
      sidebarChannelInput.value = link;
    }


    // LOAD LATEST VIDEOS

    const uploadsPlaylist =
      contentDetails.relatedPlaylists?.uploads;

    if (uploadsPlaylist) {

      await loadLatestVideos(uploadsPlaylist);

    } else {

      latestVideos.innerHTML =
        "<p>No videos available.</p>";

      chartArea.innerHTML =
        "<p>No analytics available.</p>";

    }

  } catch (error) {

    console.error("Channel Error:", error);

    channelName.textContent = "Channel Not Found";

    channelDescription.textContent =
      error.message;

    latestVideos.innerHTML =
      "<p>Unable to load channel videos.</p>";

    chartArea.innerHTML =
      "<p>Unable to load analytics.</p>";

    alert(error.message);

  } finally {

    if (loadChannelBtn) {

      loadChannelBtn.disabled = false;

      loadChannelBtn.textContent =
        originalButtonText || "Load";

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
      "<p>Loading videos...</p>";

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

      chartArea.innerHTML =
        "<p>No video analytics available.</p>";

      return;
    }

    const chartVideos = [];

    data.items.forEach(item => {

      const video = item.snippet || {};

      const videoId =
        video.resourceId?.videoId;

      if (!videoId) return;

      const videoTitle =
        video.title || "Untitled Video";

      const thumbnails =
        video.thumbnails || {};

      const thumbnail =
        thumbnails.medium ||
        thumbnails.default;

      const views =
        Number(item.statistics?.viewCount || 0);


      // SAVE CHART DATA

      chartVideos.push({
        title: videoTitle,
        views: views
      });


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

      date.textContent = video.publishedAt
        ? new Date(video.publishedAt).toLocaleDateString("en-IN")
        : "";


      // VIEWS

      const viewCount = document.createElement("p");

      viewCount.textContent =
        "▶ " + formatNumber(views) + " views";


      // VIDEO LINK

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
      card.appendChild(viewCount);
      card.appendChild(link);

      latestVideos.appendChild(card);

    });


    // CREATE CHART

    createAnalyticsChart(chartVideos);

  } catch (error) {

    console.error("Videos Error:", error);

    latestVideos.innerHTML =
      "<p>Unable to load videos.</p>";

    chartArea.innerHTML =
      "<p>Unable to load analytics.</p>";

  }
}


// ==========================================
// CREATE ANALYTICS CHART
// ==========================================

function createAnalyticsChart(videos) {

  chartArea.innerHTML = "";

  // FIX CHART HEIGHT

  chartArea.style.height = "auto";
  chartArea.style.minHeight = "0";
  chartArea.style.overflow = "visible";

  const analyticsCard =
    document.querySelector(".analytics-card");

  if (analyticsCard) {
    analyticsCard.style.height = "auto";
    analyticsCard.style.overflow = "hidden";
  }


  if (!videos || videos.length === 0) {

    chartArea.innerHTML =
      "<p>No chart data available.</p>";

    return;
  }


  // MAXIMUM VIEWS

  const maximumViews = Math.max(
    ...videos.map(video => video.views),
    1
  );


  // TOTAL RECENT VIEWS

  const totalRecentViews = videos.reduce(
    (sum, video) => sum + video.views,
    0
  );


  // CHART CONTAINER

  const chart = document.createElement("div");

  chart.className = "views-chart";


  // SUMMARY

  const heading = document.createElement("div");

  heading.className = "chart-summary";

  const summaryText = document.createElement("p");

  summaryText.textContent =
    formatNumber(totalRecentViews) + " total views";

  heading.appendChild(summaryText);

  chart.appendChild(heading);


  // CREATE BARS

  videos.forEach((video, index) => {

    const row = document.createElement("div");

    row.className = "chart-row";


    // LABEL

    const label = document.createElement("div");

    label.className = "chart-label";

    label.textContent =
      "Video " + (index + 1);


    // BAR CONTAINER

    const barContainer = document.createElement("div");

    barContainer.className =
      "chart-bar-container";


    // BAR

    const bar = document.createElement("div");

    bar.className = "chart-bar";

    const percentage =
      (video.views / maximumViews) * 100;

    bar.style.width =
      Math.max(percentage, 1) + "%";


    // VIEW COUNT

    const count = document.createElement("span");

    count.className = "chart-count";

    count.textContent =
      formatShortNumber(video.views);


    // ADD ELEMENTS

    barContainer.appendChild(bar);

    row.appendChild(label);

    row.appendChild(barContainer);

    row.appendChild(count);

    chart.appendChild(row);

  });


  // CHART NOTE

  const note = document.createElement("p");

  note.className = "chart-note";

  note.textContent =
    "Public view counts of the latest 5 uploaded videos. Not historical daily analytics.";

  chart.appendChild(note);


  // SHOW CHART

  chartArea.appendChild(chart);

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
